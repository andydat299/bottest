#!/usr/bin/env node

/**
 * Find and Fix Command #53 - Emergency Solution
 * Locate exact command causing option order error
 */

import fs from 'fs';
import path from 'path';

console.log('🚨 EMERGENCY: FINDING COMMAND #53 OPTION ORDER ERROR\n');

const commandsDir = './commands';
let commandIndex = 0;
let command53Found = null;

// Get all command files sorted
const files = fs.readdirSync(commandsDir)
  .filter(f => f.endsWith('.js') && !f.includes('disabled') && !f.includes('backup'))
  .sort();

console.log(`📁 Scanning ${files.length} command files...\n`);

for (const file of files) {
  const filePath = path.join(commandsDir, file);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Skip invalid files
    if (content.includes('export default null') || 
        content.includes('disabled: true') ||
        content.length < 100 ||
        !content.includes('SlashCommandBuilder')) {
      console.log(`${String(commandIndex + 1).padStart(2, '0')}. ${file} - SKIPPED (invalid/disabled)`);
      continue;
    }
    
    commandIndex++;
    
    // Track all commands
    console.log(`${String(commandIndex).padStart(2, '0')}. ${file} - Valid command`);
    
    // When we reach command #53, analyze it in detail
    if (commandIndex === 53) {
      console.log(`\n🎯 FOUND COMMAND #53: ${file}`);
      command53Found = { file, content, filePath };
      
      // Extract command name
      const nameMatch = content.match(/\.setName\(['"`]([^'"`]+)['"`]\)/);
      const commandName = nameMatch ? nameMatch[1] : 'unknown';
      console.log(`📝 Command name: /${commandName}`);
      
      // Analyze all options in detail
      console.log('\n🔍 DETAILED OPTION ANALYSIS:');
      
      const lines = content.split('\n');
      let optionIndex = 0;
      let foundOptional = false;
      let hasOrderIssue = false;
      let issueDetails = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Check for option definitions
        if (line.includes('.addStringOption') || 
            line.includes('.addIntegerOption') || 
            line.includes('.addBooleanOption') ||
            line.includes('.addUserOption') ||
            line.includes('.addChannelOption') ||
            line.includes('.addSubcommand')) {
          
          optionIndex++;
          
          // Look ahead for setRequired in next few lines
          let isRequired = null;
          let setRequiredLine = '';
          
          for (let j = i; j < Math.min(i + 10, lines.length); j++) {
            const nextLine = lines[j];
            if (nextLine.includes('.setRequired(true)')) {
              isRequired = true;
              setRequiredLine = `Line ${j + 1}: ${nextLine.trim()}`;
              break;
            } else if (nextLine.includes('.setRequired(false)')) {
              isRequired = false;
              setRequiredLine = `Line ${j + 1}: ${nextLine.trim()}`;
              break;
            }
            // If we hit another option or end of option block, assume optional
            if (nextLine.includes('.add') && j > i) {
              isRequired = false; // Default to optional if not specified
              setRequiredLine = `Line ${i + 1}: No .setRequired() found - defaults to optional`;
              break;
            }
          }
          
          // If we couldn't determine, it's likely optional (Discord default)
          if (isRequired === null) {
            isRequired = false;
            setRequiredLine = `Line ${i + 1}: No .setRequired() found - defaults to optional`;
          }
          
          const optionType = line.match(/\.add(\w+)Option/)?.[1] || 'Unknown';
          
          console.log(`   Option ${optionIndex}:`);
          console.log(`      Type: ${optionType}`);
          console.log(`      Required: ${isRequired ? 'YES' : 'NO'}`);
          console.log(`      Line: ${i + 1}: ${line}`);
          console.log(`      Required info: ${setRequiredLine}`);
          
          // Check for option order violation
          if (isRequired === false) {
            foundOptional = true;
          } else if (foundOptional && isRequired === true) {
            hasOrderIssue = true;
            issueDetails.push({
              optionIndex,
              optionType,
              line: i + 1,
              issue: 'Required option after optional option'
            });
            console.log(`      ❌ ISSUE: Required option after optional option!`);
          }
          
          console.log('');
        }
      }
      
      console.log(`\n📊 ANALYSIS RESULTS:`);
      console.log(`   Total options: ${optionIndex}`);
      console.log(`   Has order issue: ${hasOrderIssue ? '❌ YES' : '✅ NO'}`);
      
      if (hasOrderIssue) {
        console.log(`\n🚨 OPTION ORDER VIOLATIONS:`);
        issueDetails.forEach((issue, index) => {
          console.log(`   ${index + 1}. Option ${issue.optionIndex} (${issue.optionType}) at line ${issue.line}`);
          console.log(`      Issue: ${issue.issue}`);
        });
      }
      
      break;
    }
  } catch (error) {
    console.log(`${String(commandIndex).padStart(2, '0')}. ${file} - ERROR: ${error.message}`);
  }
}

if (command53Found) {
  console.log(`\n🔧 FIXING COMMAND #53 IMMEDIATELY:`);
  
  const { file, filePath } = command53Found;
  
  // Create disabled version immediately
  const timestamp = Date.now();
  const backupPath = `./commands/disabled/${file.replace('.js', '')}-backup-${timestamp}.js`;
  
  // Ensure disabled directory exists
  if (!fs.existsSync('./commands/disabled')) {
    fs.mkdirSync('./commands/disabled', { recursive: true });
  }
  
  // Backup original
  fs.copyFileSync(filePath, backupPath);
  console.log(`📋 Backed up: ${backupPath}`);
  
  // Create simple disabled version
  const disabledContent = `// EMERGENCY DISABLED - Command #53 option order issue
// Original backed up to: ${backupPath}
// Deploy error: Required options must be placed before non-required options

import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('${file.replace('.js', '')}-disabled')
    .setDescription('🚫 Temporarily disabled due to option order issue'),
  
  async execute(interaction) {
    await interaction.reply({
      content: '🚫 **Command Temporarily Disabled**\\n\\n' +
               'This command has been disabled due to Discord API option order requirements.\\n' +
               'Required options must come before optional options.\\n\\n' +
               'The command will be re-enabled after fixing the option order.',
      ephemeral: true
    });
  }
};`;

  fs.writeFileSync(filePath, disabledContent);
  console.log(`✅ Replaced ${file} with disabled version`);
  
  console.log(`\n🚀 IMMEDIATE DEPLOY STEPS:`);
  console.log(`1. git add .`);
  console.log(`2. git commit -m "Emergency: Disable command #53 option order issue"`);
  console.log(`3. git push`);
  console.log(`4. Railway will redeploy successfully`);
  
  console.log(`\n🔧 TO FIX LATER:`);
  console.log(`1. Edit ${backupPath}`);
  console.log(`2. Move all .setRequired(true) options before .setRequired(false) options`);
  console.log(`3. Test locally with 'node deploy-commands.js'`);
  console.log(`4. Replace disabled version when fixed`);
  
} else {
  console.log(`\n⚠️ COULD NOT IDENTIFY COMMAND #53`);
  console.log(`   Commands found: ${commandIndex}`);
  
  if (commandIndex < 53) {
    console.log(`   🔍 Command #53 might be generated dynamically`);
    console.log(`   📁 Or there might be hidden/system files`);
  }
  
  console.log(`\n🚨 EMERGENCY SOLUTION:`);
  console.log(`   1. Use: node railway-minimal-deploy.js`);
  console.log(`   2. Keep only essential commands`);
  console.log(`   3. Deploy with minimal command set`);
}

console.log(`\n✅ Command #53 analysis completed!`);