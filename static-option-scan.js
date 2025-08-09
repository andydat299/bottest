#!/usr/bin/env node

/**
 * Static File Scanner for Option Order Issues
 * Scan command files using text analysis instead of dynamic imports
 */

import fs from 'fs';
import path from 'path';

console.log('🔍 STATIC FILE SCANNER FOR OPTION ORDER ISSUES\n');

const commandsDir = './commands';
if (!fs.existsSync(commandsDir)) {
  console.log('❌ Commands directory not found');
  process.exit(1);
}

const commandFiles = fs.readdirSync(commandsDir)
  .filter(file => file.endsWith('.js') && !file.includes('backup') && !file.includes('fix-'));

console.log(`📁 Scanning ${commandFiles.length} command files using text analysis...\n`);

let commandCount = 0;
let issuesFound = 0;
const problematicFiles = [];

for (const file of commandFiles) {
  const filePath = path.join(commandsDir, file);
  
  try {
    console.log(`🔍 Analyzing: ${file}`);
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if it's a valid command file
    const hasExportDefault = content.includes('export default');
    const hasSlashCommandBuilder = content.includes('SlashCommandBuilder');
    const hasSetName = content.includes('.setName(');
    const hasSetDescription = content.includes('.setDescription(');
    const hasExecute = content.includes('execute');
    
    if (hasExportDefault && hasSlashCommandBuilder && hasSetName && hasSetDescription && hasExecute) {
      commandCount++;
      
      // Extract command name
      const nameMatch = content.match(/\.setName\(['"`]([^'"`]+)['"`]\)/);
      const commandName = nameMatch ? nameMatch[1] : 'unknown';
      
      console.log(`   Command #${commandCount}: /${commandName}`);
      
      // Look for option definitions
      const optionPattern = /\.add\w+Option\s*\(\s*option\s*=>\s*[\s\S]*?\.setRequired\s*\(\s*(true|false)\s*\)\s*\)/g;
      const options = [];
      let match;
      
      while ((match = optionPattern.exec(content)) !== null) {
        const optionBlock = match[0];
        const isRequired = match[1] === 'true';
        
        // Extract option name
        const optionNameMatch = optionBlock.match(/\.setName\(['"`]([^'"`]+)['"`]\)/);
        const optionName = optionNameMatch ? optionNameMatch[1] : 'unknown';
        
        options.push({
          name: optionName,
          required: isRequired,
          block: optionBlock
        });
      }
      
      if (options.length > 1) {
        console.log(`   Options (${options.length}):`);
        
        let foundOptional = false;
        let hasOrderIssue = false;
        
        options.forEach((opt, i) => {
          const status = opt.required ? 'REQUIRED' : 'optional';
          const mark = opt.required && foundOptional ? '❌' : '✅';
          
          console.log(`     ${i + 1}. ${opt.name} (${status}) ${mark}`);
          
          if (!opt.required) {
            foundOptional = true;
          } else if (opt.required && foundOptional) {
            hasOrderIssue = true;
          }
        });
        
        if (hasOrderIssue) {
          console.log(`   ❌ OPTION ORDER ISSUE DETECTED!`);
          
          if (commandCount === 56) {
            console.log(`   🚨 THIS IS COMMAND #56 - LIKELY CAUSING ERROR 50035!`);
          }
          
          issuesFound++;
          
          problematicFiles.push({
            file,
            commandIndex: commandCount,
            commandName,
            options,
            hasOrderIssue: true
          });
          
          // Show correct order
          const requiredOpts = options.filter(o => o.required);
          const optionalOpts = options.filter(o => !o.required);
          
          console.log(`   🔧 Correct order should be:`);
          console.log(`      Required first: ${requiredOpts.map(o => o.name).join(', ')}`);
          console.log(`      Optional last: ${optionalOpts.map(o => o.name).join(', ')}`);
        } else {
          console.log(`   ✅ Option order is correct`);
        }
      } else if (options.length === 1) {
        console.log(`   ⚪ Only 1 option (no order issue possible)`);
      } else {
        console.log(`   ⚪ No options found`);
      }
      
      // Special handling for command #56
      if (commandCount === 56) {
        console.log(`\n🎯 COMMAND #56 SPECIAL ANALYSIS:`);
        console.log(`   File: ${file}`);
        console.log(`   Name: /${commandName}`);
        console.log(`   Has order issue: ${hasOrderIssue ? 'YES ❌' : 'NO ✅'}`);
        
        if (hasOrderIssue) {
          console.log(`   🚨 THIS IS THE COMMAND CAUSING ERROR 50035!`);
          
          // Create quick fix instructions
          const quickFix = `
QUICK FIX FOR ${file} (Command #56):

1. Open the file: ${file}
2. Find the SlashCommandBuilder section
3. Locate all .addXxxOption() calls
4. Move all options with .setRequired(true) to the TOP
5. Keep all options with .setRequired(false) at the BOTTOM

Current order (WRONG):
${options.map((opt, i) => `   ${i + 1}. ${opt.name} (${opt.required ? 'REQUIRED' : 'optional'})`).join('\n')}

Correct order (FIXED):
${[...options.filter(o => o.required), ...options.filter(o => !o.required)]
  .map((opt, i) => `   ${i + 1}. ${opt.name} (${opt.required ? 'REQUIRED' : 'optional'})`).join('\n')}

After fixing, redeploy: node deploy-commands.js
`;
          
          fs.writeFileSync('fix-command-56-instructions.txt', quickFix);
          console.log(`   📝 Created: fix-command-56-instructions.txt`);
        }
      }
      
    } else {
      console.log(`   ⚠️ Not a valid command file (missing required components)`);
    }
    
  } catch (error) {
    console.log(`   ❌ Error reading file: ${error.message}`);
  }
  
  console.log('');
}

console.log(`📊 STATIC SCAN RESULTS:`);
console.log(`✅ Total valid commands: ${commandCount}`);
console.log(`❌ Commands with option order issues: ${issuesFound}`);

if (issuesFound > 0) {
  console.log(`\n❌ PROBLEMATIC COMMANDS:`);
  
  problematicFiles.forEach((cmd, index) => {
    console.log(`\n${index + 1}. Command #${cmd.commandIndex}: ${cmd.file}`);
    console.log(`   Name: /${cmd.commandName}`);
    console.log(`   Options: ${cmd.options.length}`);
    
    const requiredOpts = cmd.options.filter(o => o.required);
    const optionalOpts = cmd.options.filter(o => !o.required);
    
    console.log(`   Issue: ${requiredOpts.length} required options after ${optionalOpts.length} optional ones`);
  });
  
  console.log(`\n🎯 FOCUS ON COMMAND #56:`);
  const command56 = problematicFiles.find(cmd => cmd.commandIndex === 56);
  if (command56) {
    console.log(`🚨 Command #56 (${command56.file}) has option order issues!`);
    console.log(`🚨 This is most likely causing Discord API Error 50035!`);
    console.log(`📝 Check fix-command-56-instructions.txt for detailed fix steps`);
  } else {
    console.log(`✅ Command #56 does not have option order issues`);
    console.log(`💡 Error 50035 might be caused by another command`);
  }
  
  console.log(`\n🔧 GENERAL FIX PROCESS:`);
  console.log(`1. Edit each problematic command file`);
  console.log(`2. Move all .setRequired(true) options to the top`);
  console.log(`3. Keep all .setRequired(false) options at the bottom`);
  console.log(`4. Maintain all other option properties`);
  console.log(`5. Test with: node deploy-commands.js`);
  
} else {
  console.log(`\n✅ No option order issues found in command files!`);
  console.log(`💡 Discord API error 50035 might be caused by:`);
  console.log(`   • Dynamic option generation`);
  console.log(`   • Runtime option modifications`);
  console.log(`   • Other command validation issues`);
}

console.log(`\n✅ Static file scan completed!`);