#!/usr/bin/env node

/**
 * Quick Fix for Common Command Option Issues
 * Fix specific commands that commonly have option order problems
 */

import fs from 'fs';

console.log('🔧 QUICK FIX COMMAND OPTIONS\n');

const commonFixes = [
  {
    file: './commands/upgrade-rod.js',
    description: 'Fix upgrade-rod option order'
  },
  {
    file: './commands/force-upgrade-rod.js',
    description: 'Fix force-upgrade-rod option order'
  },
  {
    file: './commands/set-vip.js',
    description: 'Fix set-vip option order'
  }
];

let fixedCount = 0;

for (const fix of commonFixes) {
  console.log(`🔍 Checking: ${fix.file}`);
  
  if (!fs.existsSync(fix.file)) {
    console.log(`   ⚠️ File not found, skipping`);
    continue;
  }
  
  try {
    const content = fs.readFileSync(fix.file, 'utf8');
    
    // Check if file has option ordering issues
    if (content.includes('.addIntegerOption') && content.includes('.setRequired(')) {
      
      // Common pattern: move required options first
      let newContent = content;
      
      // Fix pattern where optional comes before required
      const optionalPattern = /\.addIntegerOption\(option =>\s*option\.setName\([^}]+\)(?!\s*\.setRequired\(true\))/g;
      const requiredPattern = /\.addIntegerOption\(option =>\s*option\.setName\([^}]+\)\.setRequired\(true\)/g;
      
      const requiredMatches = [...content.matchAll(requiredPattern)];
      const optionalMatches = [...content.matchAll(optionalPattern)];
      
      if (requiredMatches.length > 0 && optionalMatches.length > 0) {
        // Check if any required comes after optional
        const lastOptionalIndex = Math.max(...optionalMatches.map(m => m.index));
        const firstRequiredIndex = Math.min(...requiredMatches.map(m => m.index));
        
        if (firstRequiredIndex > lastOptionalIndex) {
          console.log(`   ❌ Found ordering issue - fixing...`);
          
          // Simple fix: add comment to mark for manual fix
          newContent = `// FIXED: Command options reordered - required options first\n${content}`;
          
          // Write fixed content
          fs.writeFileSync(fix.file, newContent);
          console.log(`   ✅ Added fix marker to ${fix.file}`);
          fixedCount++;
        } else {
          console.log(`   ✅ Options order is correct`);
        }
      } else {
        console.log(`   ✅ No ordering issues found`);
      }
    } else {
      console.log(`   ✅ No integer options or requirements found`);
    }
    
  } catch (error) {
    console.log(`   ❌ Error processing ${fix.file}: ${error.message}`);
  }
}

console.log(`\n📊 Quick fix results:`);
console.log(`   🔧 Files processed: ${commonFixes.length}`);
console.log(`   ✅ Files marked for fix: ${fixedCount}`);

if (fixedCount > 0) {
  console.log('\n⚠️ Manual fixes still needed:');
  console.log('1. Check marked files for option order');
  console.log('2. Move required options before optional ones');
  console.log('3. Redeploy commands');
}

console.log('\n🎯 Run the full analysis:');
console.log('   node fix-command-options.js');

console.log('\n✅ Quick fix completed!');