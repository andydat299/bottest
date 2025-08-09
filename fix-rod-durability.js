#!/usr/bin/env node

/**
 * Fix Rod Manager Durability
 * Check and fix durability values in rodManager.js
 */

import fs from 'fs';

console.log('🔧 FIXING ROD MANAGER DURABILITY\n');

const rodManagerPath = './utils/rodManager.js';

if (!fs.existsSync(rodManagerPath)) {
  console.log('❌ rodManager.js not found!');
  process.exit(1);
}

try {
  let content = fs.readFileSync(rodManagerPath, 'utf8');
  
  console.log('🔍 Checking current durability values...\n');
  
  // Expected durability values for each level
  const correctDurability = {
    1: 100, 2: 120, 3: 140, 4: 160, 5: 180,
    6: 200, 7: 220, 8: 240, 9: 260, 10: 280,
    11: 500, 12: 550, 13: 600, 14: 650, 15: 700,
    16: 800, 17: 900, 18: 1000, 19: 1200, 20: 1500
  };
  
  // Find and check each level's durability
  let needsUpdate = false;
  let changes = [];
  
  for (let level = 1; level <= 20; level++) {
    const expectedDurability = correctDurability[level];
    
    // Look for level pattern in file
    const levelPattern = new RegExp(`(${level}:\\s*{[^}]*durability:\\s*)(\\d+)`, 'g');
    const match = levelPattern.exec(content);
    
    if (match) {
      const currentDurability = parseInt(match[2]);
      
      if (currentDurability !== expectedDurability) {
        console.log(`⚠️  Level ${level}: ${currentDurability} → ${expectedDurability}`);
        
        // Replace the durability value
        content = content.replace(
          new RegExp(`(${level}:\\s*{[^}]*durability:\\s*)${currentDurability}`, 'g'),
          `$1${expectedDurability}`
        );
        
        needsUpdate = true;
        changes.push({
          level,
          old: currentDurability,
          new: expectedDurability
        });
      } else {
        console.log(`✅ Level ${level}: ${currentDurability} (correct)`);
      }
    } else {
      console.log(`⚠️  Level ${level}: Pattern not found in file`);
    }
  }
  
  if (needsUpdate) {
    // Backup original file
    const backupPath = `./utils/rodManager-backup-${Date.now()}.js`;
    fs.writeFileSync(backupPath, fs.readFileSync(rodManagerPath));
    console.log(`\n📋 Backed up to: ${backupPath}`);
    
    // Write updated content
    fs.writeFileSync(rodManagerPath, content);
    console.log(`✅ Updated ${rodManagerPath}`);
    
    console.log('\n📊 Changes made:');
    changes.forEach(change => {
      console.log(`   Level ${change.level}: ${change.old} → ${change.new}`);
    });
    
    console.log('\n🎯 Durability progression:');
    console.log('   Levels 1-10: 100-280 (basic rods)');
    console.log('   Levels 11-15: 500-700 (legendary rods)'); 
    console.log('   Levels 16-20: 800-1500 (mythical/transcendent)');
    
  } else {
    console.log('\n✅ All durability values are correct!');
    console.log('🎉 No changes needed');
  }
  
  console.log('\n🔧 Next steps:');
  console.log('   1. Test /repair-rod-check command');
  console.log('   2. Run /sync-rod for affected users');
  console.log('   3. Test /repair-rod functionality');
  
} catch (error) {
  console.error('❌ Error fixing rod manager:', error);
  console.log('\n💡 Manual fix required:');
  console.log('   Edit utils/rodManager.js manually');
  console.log('   Check durability values for levels 11-20');
}

console.log('\n✅ Rod manager durability check completed!');