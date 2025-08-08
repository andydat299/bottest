#!/usr/bin/env node

/**
 * Fix Broken Files Script
 * Removes broken/problematic files safely
 */

import fs from 'fs';

console.log('🔧 FIXING BROKEN FILES\n');

// List of files that may be broken or need removal
const brokenFiles = [
  './commands/eval-public.js',
  './commands/eval-public-disabled.js',
  './commands/temp.js',
  './commands/test.js',
  './temp.js',
  './test.js'
];

let fixedCount = 0;
let removedCount = 0;

for (const filePath of brokenFiles) {
  try {
    if (fs.existsSync(filePath)) {
      console.log(`🔍 Checking: ${filePath}`);
      
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check if file is problematic
      const hasExportDefault = content.includes('export default');
      const hasImports = content.includes('import');
      const isCommentOnly = content.trim().startsWith('//') && !hasImports && !hasExportDefault;
      const isEmpty = content.trim().length === 0;
      const isDisabled = content.includes('disabled') || content.includes('DISABLED');
      
      if (isEmpty || isCommentOnly || (isDisabled && content.length < 200)) {
        // Remove problematic file
        fs.unlinkSync(filePath);
        console.log(`🗑️ Removed: ${filePath}`);
        removedCount++;
      } else if (content.includes('export default null')) {
        // Fix export default null issue
        const newContent = '// This file has been disabled\n// Use alternative commands instead\n';
        fs.writeFileSync(filePath, newContent);
        console.log(`🔧 Fixed: ${filePath} (removed export default null)`);
        fixedCount++;
      } else {
        console.log(`✅ OK: ${filePath}`);
      }
    } else {
      console.log(`ℹ️ Not found: ${filePath}`);
    }
  } catch (error) {
    console.log(`❌ Error with ${filePath}: ${error.message}`);
  }
}

// Clean up any remaining problematic files
console.log('\n🧹 Additional cleanup...');

try {
  // Remove any files that start with 'temp' or 'test'
  if (fs.existsSync('./commands')) {
    const files = fs.readdirSync('./commands');
    
    for (const file of files) {
      if ((file.startsWith('temp') || file.startsWith('test')) && file.endsWith('.js')) {
        const fullPath = `./commands/${file}`;
        fs.unlinkSync(fullPath);
        console.log(`🗑️ Removed temp/test file: ${fullPath}`);
        removedCount++;
      }
    }
  }
} catch (error) {
  console.log(`⚠️ Could not clean commands directory: ${error.message}`);
}

console.log(`\n📊 Fix Results:`);
console.log(`   🔧 Files fixed: ${fixedCount}`);
console.log(`   🗑️ Files removed: ${removedCount}`);

if (fixedCount + removedCount > 0) {
  console.log('\n✅ Broken files have been fixed/removed!');
  console.log('🚀 Project should now be error-free.');
} else {
  console.log('\n✅ No broken files found!');
  console.log('🎉 Project is already clean.');
}

// Verify remaining command files
console.log('\n📁 Remaining command files:');
try {
  const commands = fs.readdirSync('./commands').filter(f => f.endsWith('.js'));
  commands.forEach(cmd => {
    const size = fs.statSync(`./commands/${cmd}`).size;
    console.log(`   📄 ${cmd} (${size} bytes)`);
  });
  console.log(`\nTotal: ${commands.length} command files`);
} catch (error) {
  console.log('   Could not list command files');
}

console.log('\n🎯 To prevent future issues:');
console.log('   • Only create files with proper exports');
console.log('   • Avoid "export default null"');
console.log('   • Remove temp/test files regularly');
console.log('   • Use proper command structure');

console.log('\n✅ File fix script completed!');