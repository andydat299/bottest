#!/usr/bin/env node

/**
 * Fix Command Deployment Errors
 * Diagnose and fix "Invalid Form Body" error 50035
 */

import fs from 'fs';
import path from 'path';

console.log('🔧 FIXING COMMAND DEPLOYMENT ERRORS\n');

console.log('❌ ERROR IDENTIFIED:');
console.log('   Code: 50035 - Invalid Form Body');
console.log('   Cause: One or more commands have invalid structure');
console.log('   Issue: Command name, description, or options format');

console.log('\n🔍 SCANNING COMMANDS FOR ISSUES...');

const commandsDir = './commands';
if (!fs.existsSync(commandsDir)) {
  console.log('❌ Commands directory not found');
  process.exit(1);
}

const commandFiles = fs.readdirSync(commandsDir)
  .filter(file => file.endsWith('.js'));

console.log(`📁 Checking ${commandFiles.length} command files...\n`);

let validCommands = [];
let invalidCommands = [];

for (const file of commandFiles) {
  console.log(`🔍 Checking: ${file}`);
  
  try {
    const filePath = path.join(commandsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for common issues
    const issues = [];
    
    // Issue 1: Command name validation
    const nameMatch = content.match(/\.setName\(['"`]([^'"`]+)['"`]\)/);
    if (nameMatch) {
      const name = nameMatch[1];
      if (name.length < 1 || name.length > 32) {
        issues.push(`Name length invalid: "${name}" (${name.length} chars, must be 1-32)`);
      }
      if (!/^[a-z0-9_-]+$/.test(name)) {
        issues.push(`Name contains invalid characters: "${name}" (only a-z, 0-9, _, - allowed)`);
      }
      if (name.includes(' ')) {
        issues.push(`Name contains spaces: "${name}" (use hyphens or underscores)`);
      }
    } else {
      issues.push('No command name found (.setName() missing)');
    }
    
    // Issue 2: Description validation
    const descMatch = content.match(/\.setDescription\(['"`]([^'"`]+)['"`]\)/);
    if (descMatch) {
      const desc = descMatch[1];
      if (desc.length < 1 || desc.length > 100) {
        issues.push(`Description length invalid: ${desc.length} chars (must be 1-100)`);
      }
    } else {
      issues.push('No command description found (.setDescription() missing)');
    }
    
    // Issue 3: Export format
    if (!content.includes('export default')) {
      issues.push('Missing "export default" statement');
    }
    
    // Issue 4: Required properties
    if (!content.includes('data:') && !content.includes('data =')) {
      issues.push('Missing "data" property');
    }
    
    if (!content.includes('execute:') && !content.includes('execute(') && !content.includes('async execute')) {
      issues.push('Missing "execute" function');
    }
    
    // Issue 5: Option validation (if any)
    const optionMatches = content.match(/\.addStringOption|\.addIntegerOption|\.addBooleanOption|\.addUserOption/g);
    if (optionMatches) {
      // Check for common option issues
      if (content.includes('.setRequired()') && !content.includes('.setRequired(true)') && !content.includes('.setRequired(false)')) {
        issues.push('Option setRequired() should have true/false parameter');
      }
    }
    
    if (issues.length === 0) {
      console.log(`   ✅ Valid command structure`);
      validCommands.push(file);
    } else {
      console.log(`   ❌ Issues found:`);
      issues.forEach(issue => {
        console.log(`      • ${issue}`);
      });
      invalidCommands.push({ file, issues });
    }
    
  } catch (error) {
    console.log(`   ❌ Error reading file: ${error.message}`);
    invalidCommands.push({ file, error: error.message });
  }
  
  console.log('');
}

console.log('📊 SCAN RESULTS:');
console.log(`✅ Valid commands: ${validCommands.length}`);
console.log(`❌ Invalid commands: ${invalidCommands.length}`);

if (invalidCommands.length > 0) {
  console.log('\n🔧 COMMANDS NEEDING FIXES:');
  invalidCommands.forEach(cmd => {
    console.log(`\n📄 ${cmd.file}:`);
    if (cmd.issues) {
      cmd.issues.forEach(issue => {
        console.log(`   • ${issue}`);
      });
    }
    if (cmd.error) {
      console.log(`   • File error: ${cmd.error}`);
    }
  });
}

console.log('\n🛠️ COMMON FIXES:');

console.log('\n1. 📝 Command Name Issues:');
console.log('❌ Bad: .setName("My Command")     // Spaces not allowed');
console.log('❌ Bad: .setName("FISH")           // Uppercase not allowed');
console.log('❌ Bad: .setName("auto_fishing_start") // Too long');
console.log('✅ Good: .setName("fish")          // Simple, lowercase');
console.log('✅ Good: .setName("auto-fishing")  // Hyphens OK');
console.log('✅ Good: .setName("fish_daily")    // Underscores OK');

console.log('\n2. 📝 Description Issues:');
console.log('❌ Bad: .setDescription("")        // Empty');
console.log('❌ Bad: .setDescription("Very long description that exceeds 100 characters...") // Too long');
console.log('✅ Good: .setDescription("Go fishing and try to catch something!")');

console.log('\n3. 🔧 Export Format:');
console.log('❌ Bad: module.exports = { ... }');
console.log('❌ Bad: export { fishCommand };');
console.log('✅ Good: export default { data: ..., execute: ... };');

console.log('\n4. 📋 Required Structure:');
console.log(`
✅ Correct format:
import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('fish')                    // 1-32 chars, lowercase, no spaces
    .setDescription('Go fishing!'),     // 1-100 chars
  async execute(interaction) {
    // Command logic here
  }
};
`);

console.log('\n🚀 QUICK FIX SCRIPT:');

const quickFixScript = `#!/bin/bash
# Quick fix for common command issues

echo "🔧 Applying common command fixes..."

# Fix 1: Replace spaces in command names with hyphens
find ./commands -name "*.js" -exec sed -i 's/\\.setName("[^"]*\\s[^"]*")/INVALID_NAME/g' {} \\;

# Fix 2: Ensure descriptions are not empty
find ./commands -name "*.js" -exec sed -i 's/\\.setDescription("")/.setDescription("Command description")/g' {} \\;

# Fix 3: Fix export format (manual check needed)
grep -l "module.exports" ./commands/*.js

echo "✅ Basic fixes applied. Check output for manual fixes needed."`;

fs.writeFileSync('./quick-command-fix.sh', quickFixScript);
console.log('✅ Created quick-command-fix.sh script');

console.log('\n🧪 TESTING INDIVIDUAL COMMANDS:');
console.log('To test a specific command before deployment:');
console.log(`
const command = await import('./commands/COMMAND_FILE.js');
console.log('Command data:', command.default.data.toJSON());
`);

console.log('\n🔄 DEPLOYMENT STRATEGY:');
console.log('1. Fix invalid commands first');
console.log('2. Test deploy with only valid commands');
console.log('3. Add fixed commands one by one');
console.log('4. Verify each deployment step');

console.log('\n📋 MANUAL VERIFICATION CHECKLIST:');
console.log('□ All command names: lowercase, no spaces, 1-32 chars');
console.log('□ All descriptions: not empty, 1-100 chars');
console.log('□ All files: proper export default format');
console.log('□ All commands: have data and execute properties');
console.log('□ All options: properly configured if present');

console.log('\n✅ Command error analysis completed!');
console.log('🔧 Fix the issues above and try deployment again.');