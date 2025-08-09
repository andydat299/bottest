#!/usr/bin/env node

/**
 * Railway Quick Fix
 * Replace corrupted repair-rod-fixed.js with clean disabled version
 */

import fs from 'fs';

console.log('🚂 RAILWAY QUICK FIX\n');

try {
  // Remove corrupted file
  if (fs.existsSync('./commands/repair-rod-fixed.js')) {
    fs.unlinkSync('./commands/repair-rod-fixed.js');
    console.log('✅ Removed corrupted repair-rod-fixed.js');
  }
  
  // Copy clean version
  if (fs.existsSync('./commands/repair-rod-fixed-clean.js')) {
    const cleanContent = fs.readFileSync('./commands/repair-rod-fixed-clean.js', 'utf8');
    fs.writeFileSync('./commands/repair-rod-fixed.js', cleanContent);
    console.log('✅ Replaced with clean disabled version');
    
    // Remove temp file
    fs.unlinkSync('./commands/repair-rod-fixed-clean.js');
    console.log('✅ Removed temporary file');
  }
  
  console.log('\n🎯 NEXT STEPS FOR RAILWAY:');
  console.log('1. git add .');
  console.log('2. git commit -m "Fix: Replace corrupted repair command for Railway"');
  console.log('3. git push');
  console.log('4. Railway will auto-redeploy');
  console.log('5. Bot should start successfully');
  
  console.log('\n✅ Files ready for Railway deployment!');
  console.log('🔧 Use /repair-rod-clean for repairs until this is re-enabled');
  
} catch (error) {
  console.error('❌ Fix failed:', error.message);
  console.log('\n💡 Manual fix:');
  console.log('1. Delete commands/repair-rod-fixed.js');
  console.log('2. Create simple disabled version');
  console.log('3. Commit and push to Railway');
}

console.log('\n🚂 Railway fix completed!');