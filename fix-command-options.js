#!/usr/bin/env node

/**
 * Fix Discord Command Options Order
 * Required options must come before non-required options
 */

import fs from 'fs';
import path from 'path';

console.log('🔧 FIXING DISCORD COMMAND OPTIONS ORDER\n');

const commandsDir = './commands';
let filesFixed = 0;
let issuesFound = 0;

function analyzeCommandFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath);
    
    // Skip non-JS files or broken files
    if (!fileName.endsWith('.js') || content.includes('export default null')) {
      return;
    }
    
    console.log(`🔍 Checking: ${fileName}`);
    
    // Look for addXXXOption patterns
    const optionMatches = content.match(/\.add\w+Option\([^)]+\)/g);
    
    if (!optionMatches) {
      console.log(`   ✅ No options found`);
      return;
    }
    
    let hasIssue = false;
    let foundNonRequired = false;
    
    optionMatches.forEach((match, index) => {
      const isRequired = match.includes('.setRequired(true)');
      
      if (foundNonRequired && isRequired) {
        console.log(`   ❌ Issue found: Required option after non-required`);
        console.log(`      Option ${index + 1}: ${match.substring(0, 50)}...`);
        hasIssue = true;
        issuesFound++;
      }
      
      if (!isRequired) {
        foundNonRequired = true;
      }
    });
    
    if (!hasIssue) {
      console.log(`   ✅ Options order is correct`);
    }
    
    return hasIssue;
    
  } catch (error) {
    console.log(`   ❌ Error reading ${filePath}: ${error.message}`);
    return false;
  }
}

// Scan all command files
if (fs.existsSync(commandsDir)) {
  const files = fs.readdirSync(commandsDir);
  
  files.forEach(file => {
    const filePath = path.join(commandsDir, file);
    if (fs.statSync(filePath).isFile()) {
      const hasIssue = analyzeCommandFile(filePath);
      if (hasIssue) {
        filesFixed++;
      }
    }
  });
} else {
  console.log('❌ Commands directory not found!');
  process.exit(1);
}

console.log('\n📊 ANALYSIS RESULTS:');
console.log(`   📁 Files checked: ${fs.readdirSync(commandsDir).filter(f => f.endsWith('.js')).length}`);
console.log(`   ⚠️ Files with issues: ${filesFixed}`);
console.log(`   🐛 Total issues found: ${issuesFound}`);

if (issuesFound > 0) {
  console.log('\n🔧 COMMON FIXES NEEDED:');
  console.log('1. Move all .setRequired(true) options to the beginning');
  console.log('2. Put optional options after required ones');
  console.log('3. Check option order in SlashCommandBuilder');
  
  console.log('\n💡 Example fix:');
  console.log('❌ WRONG:');
  console.log('  .addStringOption(option => option.setRequired(false))');
  console.log('  .addIntegerOption(option => option.setRequired(true))');
  console.log('');
  console.log('✅ CORRECT:');
  console.log('  .addIntegerOption(option => option.setRequired(true))');
  console.log('  .addStringOption(option => option.setRequired(false))');
} else {
  console.log('\n✅ All command options are properly ordered!');
}

console.log('\n🎯 Next steps:');
console.log('1. Fix the identified files manually');
console.log('2. Run deploy-commands.js again');
console.log('3. Check for other syntax errors');

console.log('\n✅ Analysis completed!');