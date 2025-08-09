#!/usr/bin/env node

/**
 * Direct File Content Viewer
 * Show the actual content of test-command-order.js
 */

import fs from 'fs';

console.log('📄 SHOWING test-command-order.js CONTENT\n');

const targetFile = './commands/test-command-order.js';

if (!fs.existsSync(targetFile)) {
  console.log('❌ File not found: test-command-order.js');
  console.log('💡 Maybe the file name is different?');
  
  // List all files in commands directory
  console.log('\n📁 Files in commands directory:');
  const files = fs.readdirSync('./commands').filter(f => f.includes('test') || f.includes('order'));
  if (files.length > 0) {
    files.forEach(file => console.log(`   • ${file}`));
  } else {
    console.log('   No files with "test" or "order" in name found');
  }
  
  process.exit(1);
}

try {
  const content = fs.readFileSync(targetFile, 'utf8');
  
  console.log('📋 FULL FILE CONTENT:');
  console.log('='.repeat(80));
  console.log(content);
  console.log('='.repeat(80));
  
  console.log('\n🔍 QUICK ANALYSIS:');
  
  const lines = content.split('\n');
  console.log(`📊 Total lines: ${lines.length}`);
  
  console.log('\n🎯 OPTION-RELATED LINES:');
  lines.forEach((line, index) => {
    if (line.includes('addStringOption') || 
        line.includes('addIntegerOption') || 
        line.includes('addBooleanOption') ||
        line.includes('setRequired')) {
      console.log(`Line ${index + 1}: ${line.trim()}`);
    }
  });
  
  // Count setRequired patterns
  const requiredTrue = (content.match(/\.setRequired\(\s*true\s*\)/g) || []).length;
  const requiredFalse = (content.match(/\.setRequired\(\s*false\s*\)/g) || []).length;
  
  console.log(`\n📊 OPTION COUNT:`);
  console.log(`✅ Required options (.setRequired(true)): ${requiredTrue}`);
  console.log(`⚪ Optional options (.setRequired(false)): ${requiredFalse}`);
  console.log(`📋 Total options: ${requiredTrue + requiredFalse}`);
  
  if (requiredTrue > 0 && requiredFalse > 0) {
    console.log(`\n⚠️ POTENTIAL ISSUE:`);
    console.log(`This command has both required and optional options`);
    console.log(`Discord API Error 50035 occurs when required options come after optional ones`);
    console.log(`Check the order manually in the file content above`);
  }
  
} catch (error) {
  console.log(`❌ Error reading file: ${error.message}`);
}

console.log(`\n✅ File content display completed!`);