#!/usr/bin/env node

/**
 * Database Schema Checker and VIP Field Adder
 */

console.log('🔧 DATABASE SCHEMA VIP FIELD CHECKER\n');

async function checkAndAddVipField() {
  try {
    console.log('📊 Importing User schema...');
    
    // Import User schema
    const { User } = await import('./schemas/userSchema.js');
    
    console.log('✅ Successfully imported User schema\n');
    
    // Check current schema
    const schema = User.schema;
    const paths = schema.paths;
    
    console.log('📋 Current Schema Fields:');
    console.log('Field Name                | Type      | Required  | Default');
    console.log('--------------------------|-----------|-----------|----------');
    
    Object.keys(paths).forEach(field => {
      const path = paths[field];
      const fieldType = path.instance || 'Mixed';
      const required = path.isRequired || false;
      const defaultValue = path.defaultValue || 'none';
      
      console.log(
        `${field.padEnd(25)} | ` +
        `${fieldType.padEnd(9)} | ` +
        `${String(required).padEnd(9)} | ` +
        `${String(defaultValue).substring(0, 8)}`
      );
    });
    
    // Check if vipTier field exists
    const hasVipField = 'vipTier' in paths;
    console.log(`\n👑 VIP Field Status: ${hasVipField ? '✅ EXISTS' : '❌ MISSING'}`);
    
    if (!hasVipField) {
      console.log('\n🛠️ VIP FIELD NOT FOUND - SOLUTIONS:');
      console.log('\n1. Add to userSchema.js manually:');
      console.log('```javascript');
      console.log('const userSchema = new mongoose.Schema({');
      console.log('  // ...existing fields...');
      console.log('  vipTier: {');
      console.log('    type: String,');
      console.log('    enum: ["bronze", "silver", "gold", "diamond"],');
      console.log('    default: null,');
      console.log('    lowercase: true');
      console.log('  },');
      console.log('  // ...rest of schema...');
      console.log('});');
      console.log('```');
      
      console.log('\n2. Or try to add dynamically:');
      try {
        // Try to add vipTier field dynamically
        schema.add({
          vipTier: {
            type: String,
            enum: ["bronze", "silver", "gold", "diamond"],
            default: null,
            lowercase: true
          }
        });
        
        console.log('✅ VIP field added dynamically to schema');
        console.log('⚠️ This is temporary - add to userSchema.js for permanent fix');
        
      } catch (addError) {
        console.log(`❌ Failed to add VIP field dynamically: ${addError.message}`);
      }
    }
    
    // Test database operations
    console.log('\n🧪 Testing Database Operations:');
    
    try {
      // Try to find or create a test user
      const testUserId = 'test_vip_user_123';
      
      let testUser = await User.findOne({ discordId: testUserId });
      if (!testUser) {
        console.log('Creating test user...');
        testUser = new User({
          discordId: testUserId,
          username: 'VIP_Test_User',
          balance: 1000000,
          rodLevel: 5
        });
      }
      
      // Try to set VIP
      console.log('Testing VIP assignment...');
      testUser.vipTier = 'diamond';
      await testUser.save();
      
      // Verify VIP was saved
      const verifyUser = await User.findOne({ discordId: testUserId });
      console.log('VIP save test result:', verifyUser.vipTier);
      
      if (verifyUser.vipTier === 'diamond') {
        console.log('✅ VIP field working correctly!');
      } else {
        console.log('❌ VIP field not saving properly');
        
        // Try alternative fields
        console.log('Trying alternative VIP fields...');
        testUser.vip = 'diamond';
        testUser.premium = 'diamond';
        testUser.tier = 'diamond';
        await testUser.save();
        
        const verifyAlt = await User.findOne({ discordId: testUserId });
        console.log('Alternative fields saved:', {
          vip: verifyAlt.vip,
          premium: verifyAlt.premium,
          tier: verifyAlt.tier
        });
      }
      
      // Clean up test user
      await User.deleteOne({ discordId: testUserId });
      console.log('Test user cleaned up');
      
    } catch (testError) {
      console.log(`❌ Database test failed: ${testError.message}`);
    }
    
    // Check existing users for VIP data
    console.log('\n👥 Checking Existing Users for VIP Data:');
    
    try {
      const users = await User.find({}).limit(5);
      
      if (users.length === 0) {
        console.log('No users found in database');
      } else {
        console.log(`Found ${users.length} users to check:\n`);
        
        users.forEach((user, index) => {
          const userData = user.toObject();
          console.log(`User ${index + 1} (${user.discordId}):`);
          
          // Look for any VIP-related data
          const vipFields = {};
          Object.keys(userData).forEach(key => {
            const value = userData[key];
            if (value && (
              key.toLowerCase().includes('vip') ||
              key.toLowerCase().includes('tier') ||
              key.toLowerCase().includes('premium') ||
              ['bronze', 'silver', 'gold', 'diamond'].includes(String(value).toLowerCase())
            )) {
              vipFields[key] = value;
            }
          });
          
          if (Object.keys(vipFields).length > 0) {
            console.log('  VIP-related data:', vipFields);
          } else {
            console.log('  No VIP data found');
          }
        });
      }
    } catch (userError) {
      console.log(`❌ User check failed: ${userError.message}`);
    }
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    
    if (hasVipField) {
      console.log('✅ VIP field exists - check if values are being saved correctly');
      console.log('• Use /set-vip command to test VIP assignment');
      console.log('• Check /debug-vip output for field values');
      console.log('• Verify VIP values are lowercase');
    } else {
      console.log('❌ VIP field missing - add to schema:');
      console.log('• Edit schemas/userSchema.js');
      console.log('• Add vipTier field definition');
      console.log('• Restart bot after schema changes');
      console.log('• Test with /set-vip command');
    }
    
  } catch (error) {
    console.error('❌ Schema check failed:', error);
  }
}

// Run schema checker
checkAndAddVipField().then(() => {
  console.log('\n✅ Schema VIP field check completed!');
  console.log('🔧 Apply recommendations to fix VIP issues.');
}).catch(error => {
  console.error('❌ Schema check script failed:', error);
});