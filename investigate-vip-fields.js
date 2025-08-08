#!/usr/bin/env node

/**
 * Database VIP Field Investigation
 * Find the correct VIP field name in database
 */

console.log('🔍 DATABASE VIP FIELD INVESTIGATION\n');

async function investigateVipFields() {
  try {
    console.log('📊 Checking Database Schema and VIP Fields...\n');
    
    // Import User schema
    const { User } = await import('./schemas/userSchema.js');
    
    console.log('✅ Successfully imported User schema');
    
    // Get schema definition
    const schema = User.schema;
    const paths = schema.paths;
    
    console.log('\n📋 User Schema Fields:');
    console.log('Field Name                | Type      | Default   | VIP Related?');
    console.log('--------------------------|-----------|-----------|-------------');
    
    const vipRelatedFields = [];
    
    Object.keys(paths).forEach(field => {
      const path = paths[field];
      const fieldType = path.instance || 'Mixed';
      const defaultValue = path.defaultValue || 'none';
      const isVipRelated = /vip|tier|premium|subscription|rank|level|status/i.test(field);
      
      if (isVipRelated) {
        vipRelatedFields.push(field);
      }
      
      const vipIndicator = isVipRelated ? '👑 YES' : '   no';
      
      console.log(
        `${field.padEnd(25)} | ` +
        `${fieldType.padEnd(9)} | ` +
        `${String(defaultValue).padEnd(9)} | ` +
        `${vipIndicator}`
      );
    });
    
    console.log(`\n👑 VIP-Related Fields Found: ${vipRelatedFields.length}`);
    if (vipRelatedFields.length > 0) {
      vipRelatedFields.forEach(field => {
        console.log(`   • ${field}`);
      });
    }
    
    // Sample user data investigation
    console.log('\n👤 Sample User Data Investigation:');
    
    try {
      // Get a few sample users to check their VIP fields
      const sampleUsers = await User.find({}).limit(5);
      
      if (sampleUsers.length === 0) {
        console.log('   ❌ No users found in database');
      } else {
        console.log(`   ✅ Found ${sampleUsers.length} sample users\n`);
        
        sampleUsers.forEach((user, index) => {
          console.log(`📱 User ${index + 1} (${user.discordId}):`);
          
          // Check all possible VIP fields
          const vipData = {};
          vipRelatedFields.forEach(field => {
            if (user[field] !== undefined && user[field] !== null) {
              vipData[field] = user[field];
            }
          });
          
          if (Object.keys(vipData).length > 0) {
            console.log('   VIP Fields:', JSON.stringify(vipData, null, 2));
          } else {
            console.log('   No VIP data found');
          }
          
          // Check for any field containing VIP-like values
          const allFields = user.toObject();
          const potentialVipValues = [];
          
          Object.entries(allFields).forEach(([key, value]) => {
            if (value && typeof value === 'string') {
              const lowerValue = value.toLowerCase();
              if (['bronze', 'silver', 'gold', 'diamond', 'premium', 'vip'].includes(lowerValue)) {
                potentialVipValues.push({ field: key, value });
              }
            }
          });
          
          if (potentialVipValues.length > 0) {
            console.log('   Potential VIP Values:', potentialVipValues);
          }
          
          console.log(''); // Empty line for spacing
        });
      }
    } catch (dbError) {
      console.log(`   ❌ Database query failed: ${dbError.message}`);
    }
    
    // Field recommendations
    console.log('\n💡 FIELD ANALYSIS RECOMMENDATIONS:');
    
    if (vipRelatedFields.includes('vipTier')) {
      console.log('   ✅ Standard field "vipTier" found - should work correctly');
    } else {
      console.log('   ⚠️ Standard field "vipTier" not found');
    }
    
    if (vipRelatedFields.length === 0) {
      console.log('   🔧 SOLUTION: Add VIP field to schema');
      console.log('   Code to add to userSchema.js:');
      console.log('   ```javascript');
      console.log('   vipTier: {');
      console.log('     type: String,');
      console.log('     enum: ["bronze", "silver", "gold", "diamond"],');
      console.log('     default: null');
      console.log('   }');
      console.log('   ```');
    } else {
      console.log('   🎯 Use these fields for VIP checking:');
      vipRelatedFields.forEach(field => {
        console.log(`      • user.${field}`);
      });
    }
    
    // Manual VIP setting guide
    console.log('\n🛠️ MANUAL VIP SETTING GUIDE:');
    console.log('   1. Use the new /set-vip command:');
    console.log('      /set-vip user:@username tier:diamond');
    console.log('   ');
    console.log('   2. Or manually in database:');
    console.log('      UPDATE users SET vipTier = "diamond" WHERE discordId = "USER_ID";');
    console.log('   ');
    console.log('   3. Verify with /debug-vip command');
    
    // Common issues and solutions
    console.log('\n🔧 COMMON VIP ISSUES & SOLUTIONS:');
    console.log('   ');
    console.log('   Issue: "Your VIP: NONE" despite having VIP');
    console.log('   Solutions:');
    console.log('   • Check if VIP field name is correct in schema');
    console.log('   • Verify VIP value is lowercase ("diamond" not "DIAMOND")');
    console.log('   • Ensure database connection is working');
    console.log('   • Use /set-vip to reset VIP status');
    console.log('   ');
    console.log('   Issue: VIP shows but still can\'t upgrade');
    console.log('   Solutions:');
    console.log('   • Check balance (need enough xu)');
    console.log('   • Verify rod level progression (can\'t skip levels)');
    console.log('   • Restart bot to refresh cache');
    console.log('   • Check console logs for VIP calculation');
    
  } catch (error) {
    console.error('❌ VIP field investigation failed:', error);
  }
}

// Run VIP field investigation
investigateVipFields().then(() => {
  console.log('\n✅ VIP field investigation completed!');
  console.log('🔍 Review results to identify VIP storage issues.');
}).catch(error => {
  console.error('❌ Investigation script failed:', error);
});