#!/usr/bin/env node

/**
 * Debug Command #51 Option Order Issue
 * Find and fix the specific command causing the error
 */

import fs from 'fs';
import path from 'path';

console.log('🔍 DEBUGGING COMMAND #51 OPTION ORDER ISSUE\n');

const commandsDir = './commands';
let commandCount = 0;
let problematicCommand = null;

function analyzeCommand(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath);
    
    // Skip non-JS files, broken files, or disabled files
    if (!fileName.endsWith('.js') || 
        content.includes('export default null') ||
        content.includes('THIS FILE HAS BEEN DISABLED') ||
        content.length < 100) {
      return null;
    }
    
    commandCount++;
    
    // Extract command name
    const nameMatch = content.match(/\.setName\(['"`]([^'"`]+)['"`]\)/);
    const commandName = nameMatch ? nameMatch[1] : fileName;
    
    console.log(`${commandCount.toString().padStart(2, '0')}. ${commandName} (${fileName})`);
    
    // Check for option order issues
    const lines = content.split('\n');
    let inOptionsSection = false;
    let foundNonRequired = false;
    let hasOrderIssue = false;
    let issueDetails = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Start of options section
      if (line.includes('.addStringOption') || 
          line.includes('.addIntegerOption') || 
          line.includes('.addBooleanOption') ||
          line.includes('.addUserOption') ||
          line.includes('.addChannelOption')) {
        inOptionsSection = true;
        
        // Check if this option is required
        let isRequired = false;
        let j = i;
        
        // Look ahead for .setRequired(true) in the next few lines
        while (j < Math.min(i + 10, lines.length)) {
          if (lines[j].includes('.setRequired(true)')) {
            isRequired = true;
            break;
          }
          if (lines[j].includes(')') && lines[j].includes(',')) {
            break; // End of this option
          }
          j++;
        }
        
        if (foundNonRequired && isRequired) {
          hasOrderIssue = true;
          issueDetails.push(`   ❌ Line ${i + 1}: Required option after non-required`);
          issueDetails.push(`      ${line.trim()}`);
        }
        
        if (!isRequired) {
          foundNonRequired = true;
        }
      }
    }
    
    if (hasOrderIssue) {
      console.log(`   ⚠️ OPTION ORDER ISSUE FOUND!`);
      issueDetails.forEach(detail => console.log(detail));
      
      if (commandCount === 51) {
        problematicCommand = {
          file: filePath,
          name: commandName,
          issues: issueDetails
        };
      }
    } else {
      console.log(`   ✅ Options order OK`);
    }
    
    return {
      count: commandCount,
      name: commandName,
      file: filePath,
      hasIssue: hasOrderIssue
    };
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return null;
  }
}

// Scan all commands
if (!fs.existsSync(commandsDir)) {
  console.log('❌ Commands directory not found!');
  process.exit(1);
}

const files = fs.readdirSync(commandsDir).sort();
const commands = [];

files.forEach(file => {
  const filePath = path.join(commandsDir, file);
  if (fs.statSync(filePath).isFile()) {
    const result = analyzeCommand(filePath);
    if (result) {
      commands.push(result);
    }
  }
});

console.log(`\n📊 SCAN RESULTS:`);
console.log(`   📁 Total commands: ${commandCount}`);
console.log(`   ⚠️ Commands with issues: ${commands.filter(c => c.hasIssue).length}`);

if (problematicCommand) {
  console.log(`\n🎯 COMMAND #51 IDENTIFIED:`);
  console.log(`   📝 File: ${problematicCommand.file}`);
  console.log(`   🏷️ Name: ${problematicCommand.name}`);
  console.log(`   🐛 Issues:`);
  problematicCommand.issues.forEach(issue => console.log(`     ${issue}`));
  
  // Show fix suggestion
  console.log(`\n🔧 FIX COMMAND #51:`);
  console.log(`   1. Edit: ${problematicCommand.file}`);
  console.log(`   2. Move all .setRequired(true) options to the top`);
  console.log(`   3. Put optional options after required ones`);
  console.log(`   4. Redeploy commands`);
} else if (commandCount >= 51) {
  const command51 = commands[50]; // 0-indexed
  if (command51) {
    console.log(`\n🎯 COMMAND #51:`);
    console.log(`   📝 File: ${command51.file}`);
    console.log(`   🏷️ Name: ${command51.name}`);
    console.log(`   ⚠️ Status: ${command51.hasIssue ? 'HAS ISSUES' : 'Needs manual check'}`);
  }
} else {
  console.log(`\n⚠️ Only found ${commandCount} commands, but error mentions command #51`);
}

// List all commands with issues
const issueCommands = commands.filter(c => c.hasIssue);
if (issueCommands.length > 0) {
  console.log(`\n🚨 ALL COMMANDS WITH OPTION ORDER ISSUES:`);
  issueCommands.forEach((cmd, index) => {
    console.log(`   ${index + 1}. ${cmd.name} (${path.basename(cmd.file)})`);
  });
}

console.log(`\n💡 NEXT STEPS:`);
console.log(`   1. Fix the identified command(s)`);
console.log(`   2. Move required options before optional ones`);
console.log(`   3. Test with: node deploy-commands.js`);
console.log(`   4. Check bot startup logs`);

console.log(`\n✅ Debug completed!`);