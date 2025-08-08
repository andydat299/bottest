#!/usr/bin/env node

/**
 * Migration Script: Convert Old Rod System (1-10) to New Rod System (1-20)
 * Safely migrate user rod data without losing progress
 */

console.log('🔄 FISHING ROD DATA MIGRATION SCRIPT\n');

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

async function connectToDatabase() {
  try {
    const mongoose = await import('mongoose');
    
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MongoDB URI not found in environment variables');
    }
    
    await mongoose.default.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    return mongoose.default;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    throw error;
  }
}

async function migrateRodSystem() {
  const mongoose = await connectToDatabase();
  
  try {
    // Import schemas
    const { User } = await import('./schemas/userSchema.js');
    const { FISHING_RODS } = await import('./utils/rodManager.js');
    
    console.log('📋 Starting Fishing Rod Migration...\n');
    
    // Get all users with rod data
    const usersWithRods = await User.find({
      $or: [
        { rodLevel: { $exists: true } },
        { rodsOwned: { $exists: true } }
      ]
    });
    
    console.log(`Found ${usersWithRods.length} users with rod data`);
    
    if (usersWithRods.length === 0) {
      console.log('No users found with rod data to migrate');
      return;
    }
    
    let migrationStats = {
      usersProcessed: 0,
      usersUpdated: 0,
      dataPreserved: 0,
      newFieldsAdded: 0,
      errors: 0
    };
    
    console.log('\n🔄 Processing users...\n');
    
    for (const user of usersWithRods) {
      try {
        console.log(`Processing user: ${user.discordId} (${user.username})`);
        migrationStats.usersProcessed++;
        
        let needsUpdate = false;
        let changes = [];
        
        // 1. Migrate rodLevel (1-10 old system to 1-20 new system)
        const oldRodLevel = user.rodLevel;
        
        if (oldRodLevel === undefined || oldRodLevel === null) {
          // No rod level set, initialize to 1
          user.rodLevel = 1;
          needsUpdate = true;
          changes.push('Set default rodLevel: 1');
        } else if (oldRodLevel > 10) {
          // User somehow has level > 10 in old system, cap at 10
          user.rodLevel = 10;
          needsUpdate = true;
          changes.push(`Capped rodLevel: ${oldRodLevel} → 10`);
        } else {
          // Valid old rod level (1-10), keep as is
          changes.push(`Preserved rodLevel: ${oldRodLevel}`);
          migrationStats.dataPreserved++;
        }
        
        // 2. Migrate rodsOwned array
        const oldRodsOwned = user.rodsOwned;
        
        if (!oldRodsOwned || !Array.isArray(oldRodsOwned)) {
          // No rodsOwned array, create based on current rod level
          const currentLevel = user.rodLevel || 1;
          user.rodsOwned = Array.from({ length: currentLevel }, (_, i) => i + 1);
          needsUpdate = true;
          changes.push(`Created rodsOwned: [${user.rodsOwned.join(', ')}]`);
          migrationStats.newFieldsAdded++;
        } else {
          // Clean existing rodsOwned array
          const cleanedRods = oldRodsOwned
            .filter(level => level >= 1 && level <= 20) // Remove invalid levels
            .filter((level, index, arr) => arr.indexOf(level) === index) // Remove duplicates
            .sort((a, b) => a - b); // Sort ascending
          
          // Ensure user owns all rods up to their current level
          const currentLevel = user.rodLevel || 1;
          const completeRods = [];
          
          for (let i = 1; i <= currentLevel; i++) {
            if (!completeRods.includes(i)) {
              completeRods.push(i);
            }
          }
          
          // Add any additional rods they owned
          cleanedRods.forEach(level => {
            if (!completeRods.includes(level) && level <= 20) {
              completeRods.push(level);
            }
          });
          
          user.rodsOwned = completeRods.sort((a, b) => a - b);
          
          if (JSON.stringify(oldRodsOwned) !== JSON.stringify(user.rodsOwned)) {
            needsUpdate = true;
            changes.push(`Updated rodsOwned: [${oldRodsOwned.join(', ')}] → [${user.rodsOwned.join(', ')}]`);
          } else {
            changes.push(`Preserved rodsOwned: [${user.rodsOwned.join(', ')}]`);
            migrationStats.dataPreserved++;
          }
        }
        
        // 3. Add rodExperience if not exists (for future features)
        if (user.rodExperience === undefined || user.rodExperience === null) {
          user.rodExperience = 0;
          needsUpdate = true;
          changes.push('Added rodExperience: 0');
          migrationStats.newFieldsAdded++;
        }
        
        // 4. Validate rod data consistency
        const finalRodLevel = user.rodLevel;
        const finalRodsOwned = user.rodsOwned;
        
        // Ensure user owns their current rod
        if (!finalRodsOwned.includes(finalRodLevel)) {
          finalRodsOwned.push(finalRodLevel);
          finalRodsOwned.sort((a, b) => a - b);
          user.rodsOwned = finalRodsOwned;
          needsUpdate = true;
          changes.push(`Added current rod to owned: ${finalRodLevel}`);
        }
        
        // Save changes if needed
        if (needsUpdate) {
          await user.save();
          migrationStats.usersUpdated++;
          console.log(`  ✅ Updated user with ${changes.length} changes:`);
          changes.forEach(change => console.log(`     • ${change}`));
        } else {
          console.log(`  ✅ No changes needed`);
        }
        
        // Show final state
        const currentRod = FISHING_RODS[user.rodLevel];
        console.log(`  📊 Final state: Level ${user.rodLevel} (${currentRod.name}), Owns [${user.rodsOwned.join(', ')}]`);
        console.log('');
        
      } catch (error) {
        console.error(`  ❌ Error processing user ${user.discordId}:`, error.message);
        migrationStats.errors++;
      }
    }
    
    // Migration summary
    console.log('📊 MIGRATION SUMMARY:');
    console.log(`  Users processed: ${migrationStats.usersProcessed}`);
    console.log(`  Users updated: ${migrationStats.usersUpdated}`);
    console.log(`  Data preserved: ${migrationStats.dataPreserved}`);
    console.log(`  New fields added: ${migrationStats.newFieldsAdded}`);
    console.log(`  Errors: ${migrationStats.errors}`);
    
    if (migrationStats.errors === 0) {
      console.log('\n✅ MIGRATION COMPLETED SUCCESSFULLY!');
    } else {
      console.log('\n⚠️ MIGRATION COMPLETED WITH SOME ERRORS');
    }
    
    console.log('\n💡 What was migrated:');
    console.log('  • Rod levels (1-10) preserved and validated');
    console.log('  • Rod ownership arrays cleaned and completed');
    console.log('  • New rodExperience field added for future features');
    console.log('  • Data consistency ensured');
    console.log('  • Ready for 20-level rod system');
    
    console.log('\n🎣 Users can now:');
    console.log('  • Continue using their current rods (levels 1-10)');
    console.log('  • Upgrade to new rod levels (11-20)');
    console.log('  • Use /fishing-rods to see all available rods');
    console.log('  • Use /upgrade-rod to upgrade progressively');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Execute migration
migrateRodSystem().then(() => {
  console.log('\n🎉 Fishing rod migration completed!');
  console.log('🚀 20-level rod system is now ready to use.');
  process.exit(0);
}).catch(error => {
  console.error('❌ Migration script failed:', error);
  process.exit(1);
});