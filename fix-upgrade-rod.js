#!/usr/bin/env node

/**
 * Fix Upgrade Rod Command
 * Replace broken upgrade-rod.js with clean version
 */

import fs from 'fs';

console.log('🔧 FIXING UPGRADE-ROD COMMAND\n');

try {
  // Backup broken file
  if (fs.existsSync('./commands/upgrade-rod.js')) {
    const backupName = `./commands/upgrade-rod-broken-${Date.now()}.js`;
    fs.copyFileSync('./commands/upgrade-rod.js', backupName);
    console.log(`📋 Backed up broken file to: ${backupName}`);
  }

  // Replace with clean version
  if (fs.existsSync('./commands/upgrade-rod-clean.js')) {
    const cleanContent = fs.readFileSync('./commands/upgrade-rod-clean.js', 'utf8');
    fs.writeFileSync('./commands/upgrade-rod.js', cleanContent);
    console.log('✅ Replaced upgrade-rod.js with clean version');
    
    // Remove the temporary clean file
    fs.unlinkSync('./commands/upgrade-rod-clean.js');
    console.log('🗑️ Removed temporary upgrade-rod-clean.js');
  } else {
    console.log('❌ Clean version not found!');
    process.exit(1);
  }

  console.log('\n✅ UPGRADE-ROD COMMAND FIXED!');
  console.log('🎣 /upgrade-rod should now work properly');
  console.log('🚀 Restart your bot to apply changes');
  
  console.log('\n📊 File Status:');
  console.log('   ✅ upgrade-rod.js - FIXED');
  console.log('   📋 upgrade-rod-broken-*.js - BACKUP');
  console.log('   🗑️ upgrade-rod-clean.js - REMOVED');
  
} catch (error) {
  console.error('❌ Fix failed:', error.message);
  console.log('\n💡 Manual fix options:');
  console.log('1. Delete commands/upgrade-rod.js');
  console.log('2. Rename commands/upgrade-rod-clean.js to upgrade-rod.js');
  console.log('3. Use /upgrade-rod-fixed command instead');
}

console.log('\n🎯 Test after restart:');
console.log('   /upgrade-rod - Should work without errors');
console.log('   Check console for any import/syntax errors');

console.log('\n✅ Fix script completed!');