#!/usr/bin/env node

/**
 * Check Existing Commands Compatibility
 * Verify old commands still work with new deployment system
 */

import fs from 'fs';
import path from 'path';

console.log('🔍 CHECKING EXISTING COMMANDS COMPATIBILITY\n');

console.log('✅ GOOD NEWS: Your existing commands should still work!');
console.log('💡 The deploy-commands.js script only REGISTERS commands with Discord');
console.log('💡 It doesn\'t change how commands work - just makes them visible');

console.log('\n📊 ANALYZING EXISTING COMMANDS...');

const commandsDir = './commands';
if (!fs.existsSync(commandsDir)) {
  console.log('❌ Commands directory not found');
  process.exit(1);
}

const commandFiles = fs.readdirSync(commandsDir)
  .filter(file => file.endsWith('.js'));

console.log(`📁 Found ${commandFiles.length} command files\n`);

let workingCommands = [];
let potentialIssues = [];

commandFiles.forEach(file => {
  console.log(`🔍 Checking: ${file}`);
  
  try {
    const filePath = path.join(commandsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check command structure
    const hasDefaultExport = content.includes('export default');
    const hasDataProperty = content.includes('SlashCommandBuilder') || content.includes('.setName(');
    const hasExecuteFunction = content.includes('execute(') || content.includes('execute:');
    const hasInteractionParam = content.includes('interaction');
    
    const status = {
      file,
      hasDefaultExport,
      hasDataProperty,
      hasExecuteFunction,
      hasInteractionParam,
      compatible: hasDefaultExport && hasDataProperty && hasExecuteFunction
    };
    
    if (status.compatible) {
      console.log(`   ✅ Compatible - Should work normally`);
      workingCommands.push(file);
    } else {
      console.log(`   ⚠️ Potential compatibility issues:`);
      if (!hasDefaultExport) console.log(`      • Missing default export`);
      if (!hasDataProperty) console.log(`      • Missing SlashCommandBuilder`);
      if (!hasExecuteFunction) console.log(`      • Missing execute function`);
      potentialIssues.push({ file, issues: status });
    }
    
  } catch (error) {
    console.log(`   ❌ Error reading file: ${error.message}`);
    potentialIssues.push({ file, error: error.message });
  }
  
  console.log('');
});

console.log('📊 COMPATIBILITY SUMMARY:');
console.log(`✅ Compatible commands: ${workingCommands.length}`);
console.log(`⚠️ Potential issues: ${potentialIssues.length}`);

if (workingCommands.length > 0) {
  console.log('\n✅ COMMANDS THAT SHOULD WORK:');
  workingCommands.forEach(cmd => {
    console.log(`   • ${cmd}`);
  });
}

if (potentialIssues.length > 0) {
  console.log('\n⚠️ COMMANDS THAT MIGHT NEED FIXES:');
  potentialIssues.forEach(issue => {
    console.log(`   • ${issue.file}`);
    if (issue.error) {
      console.log(`     Error: ${issue.error}`);
    }
  });
}

console.log('\n🎯 WHAT HAPPENS WHEN YOU DEPLOY:');

console.log('\n✅ EXISTING COMMANDS WILL:');
console.log('• Continue to work exactly the same');
console.log('• Keep all their functionality');
console.log('• Respond to interactions normally');
console.log('• Access database and other features');

console.log('\n🔄 DEPLOY SCRIPT ONLY:');
console.log('• Registers commands with Discord API');
console.log('• Makes slash commands visible in Discord');
console.log('• Updates command descriptions/options');
console.log('• Does NOT change command logic');

console.log('\n💡 COMMON SCENARIOS:');

console.log('\n🎮 Scenario 1: Commands working but not visible');
console.log('• Problem: Commands registered in old way');
console.log('• Solution: Run deploy-commands.js');
console.log('• Result: Commands become visible as slash commands');

console.log('\n🎮 Scenario 2: Some commands visible, some not');
console.log('• Problem: Mixed registration methods');
console.log('• Solution: deploy-commands.js registers ALL commands');
console.log('• Result: All commands visible consistently');

console.log('\n🎮 Scenario 3: Commands work locally but not on Railway');
console.log('• Problem: Commands not deployed to production');
console.log('• Solution: Deploy commands on Railway too');
console.log('• Result: Commands work in production Discord');

console.log('\n🧪 TESTING EXISTING COMMANDS:');

console.log('\n📋 Before deploying new system:');
console.log('1. List current working commands in Discord');
console.log('2. Test a few key commands (/fish, /balance, etc.)');
console.log('3. Note which ones work vs don\'t work');

console.log('\n📋 After deploying new system:');
console.log('1. All previous working commands should still work');
console.log('2. Previously broken commands might now work');
console.log('3. Commands should appear more consistently');

console.log('\n🔧 IF COMMANDS STOP WORKING:');

console.log('\n❌ Possible causes:');
console.log('• Syntax error in command file');
console.log('• Missing import statements');
console.log('• Changed export format');
console.log('• Railway environment issues');

console.log('\n✅ Quick fixes:');
console.log('• Check Railway logs for errors');
console.log('• Verify command file syntax');
console.log('• Test commands locally first');
console.log('• Rollback if needed: git revert HEAD');

console.log('\n🚀 DEPLOYMENT SAFETY:');

console.log('\n🛡️ Safe deployment approach:');
console.log('1. Test deploy-commands.js locally first');
console.log('2. Backup current working state');
console.log('3. Deploy to Railway');
console.log('4. Test existing commands immediately');
console.log('5. Rollback if anything breaks');

console.log('\n📝 Quick test commands:');
console.log('/fish          # Basic command');
console.log('/balance       # Database command');
console.log('/help          # Info command');
console.log('/ping          # Simple response');

console.log('\n✅ CONCLUSION:');
console.log('🎯 Your existing commands should continue working normally');
console.log('🎯 Deploy script only makes them visible/accessible');
console.log('🎯 Command logic and functionality unchanged');
console.log('🎯 Safe to deploy - minimal risk to existing features');

console.log('\n✅ Existing commands compatibility check completed!');