#!/usr/bin/env node

/**
 * Backup Script: Backup user rod data before migration
 */

console.log('💾 FISHING ROD DATA BACKUP SCRIPT\n');

import fs from 'fs';
import path from 'path';

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

async function backupRodData() {
  const mongoose = await connectToDatabase();
  
  try {
    // Import schemas
    const { User } = await import('./schemas/userSchema.js');
    
    console.log('📋 Creating backup of fishing rod data...\n');
    
    // Get all users with rod data
    const usersWithRods = await User.find({
      $or: [
        { rodLevel: { $exists: true } },
        { rodsOwned: { $exists: true } }
      ]
    }, {
      discordId: 1,
      username: 1,
      rodLevel: 1,
      rodsOwned: 1,
      rodExperience: 1,
      balance: 1,
      createdAt: 1
    });
    
    console.log(`Found ${usersWithRods.length} users with rod data`);
    
    if (usersWithRods.length === 0) {
      console.log('No users found with rod data to backup');
      return;
    }
    
    // Create backup object
    const backup = {
      timestamp: new Date().toISOString(),
      totalUsers: usersWithRods.length,
      migrationVersion: '1.0.0',
      description: 'Backup before migrating from 10-level to 20-level fishing rod system',
      users: usersWithRods.map(user => ({
        discordId: user.discordId,
        username: user.username,
        rodLevel: user.rodLevel,
        rodsOwned: user.rodsOwned,
        rodExperience: user.rodExperience || 0,
        balance: user.balance || 0,
        createdAt: user.createdAt
      }))
    };
    
    // Create backups directory if it doesn't exist
    const backupsDir = './backups';
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir);
      console.log('📁 Created backups directory');
    }
    
    // Generate backup filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFilename = `fishing-rods-backup-${timestamp}.json`;
    const backupPath = path.join(backupsDir, backupFilename);
    
    // Write backup file
    fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
    
    console.log(`✅ Backup created successfully!`);
    console.log(`📁 File: ${backupPath}`);
    console.log(`📊 Users backed up: ${backup.totalUsers}`);
    
    // Create summary
    const summary = {
      totalUsers: backup.totalUsers,
      rodLevelDistribution: {},
      rodsOwnedStats: {
        min: Infinity,
        max: 0,
        average: 0
      }
    };
    
    backup.users.forEach(user => {
      const level = user.rodLevel || 1;
      summary.rodLevelDistribution[level] = (summary.rodLevelDistribution[level] || 0) + 1;
      
      const rodsCount = user.rodsOwned ? user.rodsOwned.length : 1;
      summary.rodsOwnedStats.min = Math.min(summary.rodsOwnedStats.min, rodsCount);
      summary.rodsOwnedStats.max = Math.max(summary.rodsOwnedStats.max, rodsCount);
      summary.rodsOwnedStats.average += rodsCount;
    });
    
    summary.rodsOwnedStats.average = (summary.rodsOwnedStats.average / backup.totalUsers).toFixed(1);
    
    console.log('\n📊 BACKUP SUMMARY:');
    console.log('Rod Level Distribution:');
    Object.entries(summary.rodLevelDistribution)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .forEach(([level, count]) => {
        console.log(`   Level ${level}: ${count} users`);
      });
    
    console.log('\nRods Owned Statistics:');
    console.log(`   Min rods: ${summary.rodsOwnedStats.min}`);
    console.log(`   Max rods: ${summary.rodsOwnedStats.max}`);
    console.log(`   Average rods: ${summary.rodsOwnedStats.average}`);
    
    // Create restore instructions
    const restoreInstructions = `
# Fishing Rod Backup Restore Instructions

## Backup Details
- **Created:** ${backup.timestamp}
- **Users:** ${backup.totalUsers}
- **File:** ${backupFilename}

## To Restore (if needed):
1. Import the backup file:
   \`\`\`javascript
   const backup = JSON.parse(fs.readFileSync('${backupPath}', 'utf8'));
   \`\`\`

2. Restore each user:
   \`\`\`javascript
   for (const userData of backup.users) {
     await User.updateOne(
       { discordId: userData.discordId },
       {
         rodLevel: userData.rodLevel,
         rodsOwned: userData.rodsOwned,
         rodExperience: userData.rodExperience
       }
     );
   }
   \`\`\`

## Migration Safety:
- This backup preserves all rod data before migration
- Migration script will not lose any existing progress
- Users with rod levels 1-10 will keep their progress
- New levels 11-20 will be available for upgrade
`;
    
    fs.writeFileSync(path.join(backupsDir, `restore-instructions-${timestamp}.md`), restoreInstructions);
    
    console.log('\n💡 BACKUP COMPLETE:');
    console.log('✅ All rod data safely backed up');
    console.log('✅ Restore instructions created');
    console.log('✅ Ready for migration');
    
    console.log('\n🚀 Next steps:');
    console.log('1. Run migration: node migrate-fishing-rods.js');
    console.log('2. Test new rod system: /fishing-rods');
    console.log('3. Users can upgrade: /upgrade-rod level:11');
    
  } catch (error) {
    console.error('❌ Backup failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Execute backup
backupRodData().then(() => {
  console.log('\n🎉 Backup completed successfully!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Backup script failed:', error);
  process.exit(1);
});