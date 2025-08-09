#!/usr/bin/env node

/**
 * Mass Check All Commands for Option Order Issues
 * Find ALL commands with potential option order problems
 */

import fs from 'fs';
import path from 'path';

console.log('🔍 MASS CHECK: ALL COMMANDS OPTION ORDER\n');

const commandsDir = './commands';
const files = fs.readdirSync(commandsDir)
  .filter(f => f.endsWith('.js') && !f.includes('disabled') && !f.includes('backup'))
  .sort();

let totalCommands = 0;
let problematicCommands = [];

console.log(`📁 Checking ${files.length} command files for option order issues...\n`);

for (const file of files) {
  const filePath = path.join(commandsDir, file);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Skip invalid files
    if (content.includes('export default null') || 
        content.includes('disabled: true') ||
        content.length < 100 ||
        !content.includes('SlashCommandBuilder')) {
      continue;
    }
    
    totalCommands++;
    const commandIndex = totalCommands;
    
    // Extract command name
    const nameMatch = content.match(/\.setName\(['"`]([^'"`]+)['"`]\)/);
    const commandName = nameMatch ? nameMatch[1] : 'unknown';
    
    // Check for option order issues
    const lines = content.split('\n');
    let foundOptional = false;
    let hasOrderIssue = false;
    let optionDetails = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check for option definitions
      if (line.includes('.addStringOption') || 
          line.includes('.addIntegerOption') || 
          line.includes('.addBooleanOption') ||
          line.includes('.addUserOption') ||
          line.includes('.addChannelOption')) {
        
        // Look ahead for setRequired in next few lines
        let isRequired = null;
        
        for (let j = i; j < Math.min(i + 10, lines.length); j++) {
          const nextLine = lines[j];
          if (nextLine.includes('.setRequired(true)')) {
            isRequired = true;
            break;
          } else if (nextLine.includes('.setRequired(false)')) {
            isRequired = false;
            break;
          }
        }
        
        // If no setRequired found, assume optional (Discord default)
        if (isRequired === null) {
          isRequired = false;
        }
        
        const optionType = line.match(/\.add(\w+)Option/)?.[1] || 'Unknown';
        
        optionDetails.push({
          type: optionType,
          required: isRequired,
          line: i + 1
        });
        
        // Check for option order violation
        if (!isRequired) {
          foundOptional = true;
        } else if (foundOptional && isRequired) {
          hasOrderIssue = true;
        }
      }
    }
    
    if (hasOrderIssue) {
      problematicCommands.push({
        index: commandIndex,
        file,
        commandName,
        optionDetails,
        hasOrderIssue: true
      });
      
      console.log(`❌ Command #${commandIndex}: ${file} (/${commandName})`);
      console.log(`   📋 Options:`);
      optionDetails.forEach((opt, idx) => {
        const status = opt.required ? '🔴 REQUIRED' : '🟡 OPTIONAL';
        console.log(`      ${idx + 1}. ${opt.type} - ${status} (line ${opt.line})`);
      });
      console.log('');
    } else if (optionDetails.length > 0) {
      console.log(`✅ Command #${commandIndex}: ${file} (/${commandName}) - OK`);
    } else {
      console.log(`⚪ Command #${commandIndex}: ${file} (/${commandName}) - No options`);
    }
    
  } catch (error) {
    console.log(`❌ Command #${totalCommands}: ${file} - ERROR: ${error.message}`);
  }
}

console.log(`\n📊 MASS CHECK RESULTS:`);
console.log(`   📁 Total commands checked: ${totalCommands}`);
console.log(`   ❌ Commands with option order issues: ${problematicCommands.length}`);

if (problematicCommands.length > 0) {
  console.log(`\n🚨 PROBLEMATIC COMMANDS:`);
  
  problematicCommands.forEach(cmd => {
    console.log(`\n   Command #${cmd.index}: ${cmd.file}`);
    console.log(`   /${cmd.commandName}`);
    console.log(`   Issue: Required option(s) after optional option(s)`);
    
    // Show order violation details
    let foundOptionalInSequence = false;
    cmd.optionDetails.forEach((opt, idx) => {
      if (!opt.required) {
        foundOptionalInSequence = true;
      } else if (foundOptionalInSequence && opt.required) {
        console.log(`   ⚠️ Violation: Option ${idx + 1} (${opt.type}) is required but comes after optional options`);
      }
    });
  });
  
  console.log(`\n🔧 QUICK FIX STRATEGIES:`);
  console.log(`\n   1. **EMERGENCY DISABLE ALL:**`);
  console.log(`      Disable all problematic commands at once:`);
  problematicCommands.forEach(cmd => {
    console.log(`      mv commands/${cmd.file} commands/disabled/`);
  });
  
  console.log(`\n   2. **FIX OPTION ORDER:**`);
  console.log(`      For each problematic command:`);
  console.log(`      - Move all .setRequired(true) options to the top`);
  console.log(`      - Put all .setRequired(false) options at the bottom`);
  console.log(`      - Test with: node deploy-commands.js`);
  
  console.log(`\n   3. **RAILWAY DEPLOY STEPS:**`);
  console.log(`      git add .`);
  console.log(`      git commit -m "Fix: Disable commands with option order issues"`);
  console.log(`      git push`);
  
} else {
  console.log(`\n✅ ALL COMMANDS HAVE CORRECT OPTION ORDER!`);
  console.log(`   The issue might be in:`);
  console.log(`   - Hidden files`);
  console.log(`   - Dynamically generated commands`);
  console.log(`   - Files in subdirectories`);
}

console.log(`\n✅ Mass check completed!`);