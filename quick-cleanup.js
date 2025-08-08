#!/usr/bin/env node

/**
 * Quick Empty File Remover
 * Simple script to remove known empty/problematic files
 */

import fs from 'fs';

console.log('🗑️ QUICK EMPTY FILE CLEANUP\n');

// List of files to check and remove if empty/problematic
const filesToCheck = [
  './commands/eval-public.js',
  './commands/temp-eval.js', 
  './commands/test-eval.js',
  './commands/temp.js',
  './commands/test.js',
  './scripts/temp.js',
  './scripts/test.js',
  './temp.js',
  './test.js',
  './empty.js',
  './debug.js'
];

let removedFiles = [];
let keptFiles = [];

for (const filePath of filesToCheck) {
  try {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check if file should be removed
      const isEmpty = stats.size === 0;
      const isWhitespaceOnly = content.trim().length === 0;
      const isDisabled = content.includes('THIS FILE HAS BEEN DISABLED') || 
                        content.includes('export default null');
      const isTooSmall = content.trim().length < 50 && !content.includes('export default');
      
      if (isEmpty || isWhitespaceOnly || isDisabled || isTooSmall) {
        fs.unlinkSync(filePath);
        removedFiles.push({
          path: filePath,
          reason: isEmpty ? 'Empty' : 
                 isWhitespaceOnly ? 'Whitespace only' :
                 isDisabled ? 'Disabled' : 'Too small'
        });
        console.log(`🗑️ Removed: ${filePath} (${removedFiles[removedFiles.length-1].reason})`);
      } else {
        keptFiles.push(filePath);
        console.log(`✅ Kept: ${filePath} (${content.length} chars)`);
      }
    }
  } catch (error) {
    console.log(`❌ Error checking ${filePath}: ${error.message}`);
  }
}

// Check for any completely empty files in commands directory
try {
  if (fs.existsSync('./commands')) {
    const commandFiles = fs.readdirSync('./commands');
    
    for (const file of commandFiles) {
      if (file.endsWith('.js')) {
        const filePath = `./commands/${file}`;
        
        if (!filesToCheck.includes(filePath)) {
          const stats = fs.statSync(filePath);
          const content = fs.readFileSync(filePath, 'utf8');
          
          if (stats.size === 0 || content.trim().length === 0) {
            fs.unlinkSync(filePath);
            removedFiles.push({ path: filePath, reason: 'Empty' });
            console.log(`🗑️ Removed empty command: ${filePath}`);
          }
        }
      }
    }
  }
} catch (error) {
  console.log(`⚠️ Could not scan commands directory: ${error.message}`);
}

console.log(`\n📊 Cleanup Summary:`);
console.log(`   🗑️ Files removed: ${removedFiles.length}`);
console.log(`   ✅ Files kept: ${keptFiles.length}`);

if (removedFiles.length > 0) {
  console.log('\n🗑️ Removed files:');
  removedFiles.forEach(file => {
    console.log(`   • ${file.path} (${file.reason})`);
  });
}

if (keptFiles.length > 0) {
  console.log('\n✅ Kept files:');
  keptFiles.forEach(file => {
    console.log(`   • ${file}`);
  });
}

console.log('\n🧹 Quick cleanup completed!');
console.log('🚀 Run "node clean-empty-files.js" for comprehensive cleanup.');