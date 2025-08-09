#!/usr/bin/env node

/**
 * Check Command Names and Descriptions
 * Ensure all commands use proper English names and descriptions
 */

import fs from 'fs';
import path from 'path';

console.log('🔍 CHECKING COMMAND NAMES AND DESCRIPTIONS\n');

const commandsDir = './commands';
const issues = [];
const suggestions = [];

if (!fs.existsSync(commandsDir)) {
  console.log('❌ Commands directory not found');
  process.exit(1);
}

const commandFiles = fs.readdirSync(commandsDir)
  .filter(file => file.endsWith('.js'));

console.log(`📁 Found ${commandFiles.length} command files\n`);

// Check each command file
for (const file of commandFiles) {
  const filePath = path.join(commandsDir, file);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    console.log(`🔍 Checking: ${file}`);
    
    // Extract command name and description patterns
    const nameMatch = content.match(/\.setName\(['"`]([^'"`]+)['"`]\)/);
    const descMatch = content.match(/\.setDescription\(['"`]([^'"`]+)['"`]\)/);
    
    if (nameMatch) {
      const commandName = nameMatch[1];
      
      // Check for Vietnamese characters or spaces in command name
      const hasVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(commandName);
      const hasSpaces = /\s/.test(commandName);
      const hasUppercase = /[A-Z]/.test(commandName);
      
      if (hasVietnamese) {
        issues.push({
          file,
          type: 'Vietnamese characters in command name',
          current: commandName,
          issue: 'Command names cannot contain Vietnamese characters'
        });
      }
      
      if (hasSpaces) {
        issues.push({
          file,
          type: 'Spaces in command name',
          current: commandName,
          issue: 'Command names cannot contain spaces'
        });
      }
      
      if (hasUppercase) {
        issues.push({
          file,
          type: 'Uppercase in command name',
          current: commandName,
          issue: 'Command names should be lowercase'
        });
      }
      
      if (!hasVietnamese && !hasSpaces && !hasUppercase) {
        console.log(`  ✅ Name: /${commandName} - OK`);
      } else {
        console.log(`  ❌ Name: /${commandName} - Issues found`);
      }
    } else {
      console.log(`  ⚠️ Could not find command name in ${file}`);
    }
    
    if (descMatch) {
      const description = descMatch[1];
      
      // Check description length (Discord limit is 100 characters)
      if (description.length > 100) {
        issues.push({
          file,
          type: 'Description too long',
          current: description,
          issue: `Description is ${description.length} characters (max 100)`
        });
        console.log(`  ❌ Description: Too long (${description.length}/100 chars)`);
      } else {
        console.log(`  ✅ Description: OK (${description.length}/100 chars)`);
      }
    } else {
      console.log(`  ⚠️ Could not find description in ${file}`);
    }
    
    console.log('');
    
  } catch (error) {
    console.log(`  ❌ Error reading ${file}: ${error.message}\n`);
  }
}

// Report issues
console.log('📊 ANALYSIS RESULTS:\n');

if (issues.length === 0) {
  console.log('✅ All commands have proper names and descriptions!');
  console.log('🎮 Commands should deploy successfully to Discord');
} else {
  console.log(`❌ Found ${issues.length} issues that need fixing:\n`);
  
  issues.forEach((issue, index) => {
    console.log(`${index + 1}. ${issue.file}:`);
    console.log(`   Type: ${issue.type}`);
    console.log(`   Current: "${issue.current}"`);
    console.log(`   Issue: ${issue.issue}`);
    console.log('');
  });
}

// Provide fixes for common issues
console.log('🔧 COMMON FIXES:\n');

console.log('❌ Vietnamese characters in command names:');
console.log('   Change: .setName("cá-câu") → .setName("fish")');
console.log('   Change: .setName("auto-fishing") → .setName("auto-fishing") ✅');

console.log('\n❌ Spaces in command names:');
console.log('   Change: .setName("auto fishing") → .setName("auto-fishing")');
console.log('   Change: .setName("check balance") → .setName("balance")');

console.log('\n❌ Uppercase in command names:');
console.log('   Change: .setName("AutoFish") → .setName("autofish")');
console.log('   Change: .setName("checkBalance") → .setName("check-balance")');

console.log('\n❌ Long descriptions:');
console.log('   Keep under 100 characters');
console.log('   Use concise, clear descriptions');

console.log('\n✅ GOOD COMMAND EXAMPLES:');
console.log('   .setName("fish").setDescription("Go fishing and try to catch something!")');
console.log('   .setName("balance").setDescription("Check your current balance")');
console.log('   .setName("auto-fishing").setDescription("Start or stop auto-fishing")');
console.log('   .setName("rod-status").setDescription("Check your fishing rod status")');

console.log('\n🎯 COMMAND NAMING RULES:');
console.log('✅ Use only English letters, numbers, and hyphens');
console.log('✅ All lowercase');
console.log('✅ No spaces (use hyphens instead)');
console.log('✅ 1-32 characters long');
console.log('✅ Descriptive but concise');

console.log('\n📝 DESCRIPTION RULES:');
console.log('✅ 1-100 characters long');
console.log('✅ Clear and descriptive');
console.log('✅ Can use any language (Vietnamese OK for descriptions)');
console.log('✅ Explain what the command does');

console.log('\n🚀 NEXT STEPS:');
if (issues.length > 0) {
  console.log('1. Fix the issues listed above');
  console.log('2. Test locally: node deploy-commands.js');
  console.log('3. Deploy to Railway: git add . && git commit -m "Fix: Command names" && git push');
} else {
  console.log('✅ All commands are properly formatted!');
  console.log('🚀 Ready to deploy: node deploy-commands.js');
}

console.log('\n✅ Command check completed!');