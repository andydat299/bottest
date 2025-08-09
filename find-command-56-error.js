#!/usr/bin/env node

/**
 * Find and Fix Command #56 Option Order Error
 * Identify which command is causing the option order issue
 */

import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import fs from 'fs';
import path from 'path';

console.log('🔍 FINDING COMMAND #56 WITH OPTION ORDER ERROR\n');

const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;
const token = process.env.DISCORD_TOKEN;

if (!clientId || !token) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const commandsPath = path.join(process.cwd(), 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

console.log(`🔍 Loading ${commandFiles.length} commands to find #56...\n`);

const commands = [];
let commandIndex = 0;

// Load all commands and identify which one is #56
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  
  try {
    const command = await import(filePath);
    
    if ('data' in command.default && 'execute' in command.default) {
      const commandData = command.default.data.toJSON();
      
      // Check if command has valid name and description
      if (commandData.name && commandData.description && 
          /^[a-z0-9_-]+$/.test(commandData.name) &&
          commandData.description.length <= 100) {
        
        commandIndex++;
        console.log(`Command #${commandIndex}: ${file} (/${commandData.name})`);
        
        // Check if this is command #56
        if (commandIndex === 56) {
          console.log(`\n🎯 FOUND COMMAND #56: ${file}`);
          console.log(`   Name: /${commandData.name}`);
          console.log(`   Description: ${commandData.description}`);
          
          // Check options for ordering issues
          if (commandData.options && commandData.options.length > 0) {
            console.log(`   Options: ${commandData.options.length}`);
            
            let foundOptional = false;
            let hasOrderIssue = false;
            
            commandData.options.forEach((option, index) => {
              const isRequired = option.required === true;
              const isOptional = option.required === false || option.required === undefined;
              
              console.log(`     ${index + 1}. ${option.name} (${option.type}) - Required: ${isRequired}`);
              
              if (isOptional) {
                foundOptional = true;
              } else if (isRequired && foundOptional) {
                hasOrderIssue = true;
                console.log(`       ❌ ORDER ISSUE: Required option after optional!`);
              }
            });
            
            if (hasOrderIssue) {
              console.log(`\n🔧 FIXING OPTION ORDER IN: ${file}`);
              
              // Read the file content
              const fileContent = fs.readFileSync(filePath, 'utf8');
              
              console.log(`\n📄 Current file content preview:`);
              console.log(fileContent.substring(0, 500) + '...');
              
              // Create a fixed version
              console.log(`\n🛠️ CREATING FIXED VERSION...`);
              
              // This is a complex fix that requires parsing the SlashCommandBuilder
              // For now, let's create a template for manual fixing
              const fixTemplate = `
// OPTION ORDER FIX FOR: ${file}
// Current issue: Required options come after optional ones
// 
// CURRENT ORDER (WRONG):
${commandData.options.map((opt, i) => 
  `//   ${i + 1}. ${opt.name} - Required: ${opt.required === true}`
).join('\n')}

// FIXED ORDER (CORRECT):
// Move all required options (Required: true) to the top
// Then place all optional options (Required: false) at the bottom

// Example fix:
export default {
  data: new SlashCommandBuilder()
    .setName('${commandData.name}')
    .setDescription('${commandData.description}')
    // ✅ ALL REQUIRED OPTIONS FIRST:
${commandData.options
  .filter(opt => opt.required === true)
  .map(opt => `    .add${getOptionTypeMethod(opt.type)}(option =>
      option.setName('${opt.name}')
            .setDescription('${opt.description}')
            .setRequired(true))`)
  .join('\n')}
    // ✅ ALL OPTIONAL OPTIONS LAST:
${commandData.options
  .filter(opt => opt.required !== true)
  .map(opt => `    .add${getOptionTypeMethod(opt.type)}(option =>
      option.setName('${opt.name}')
            .setDescription('${opt.description}')
            .setRequired(false))`)
  .join('\n')},
  async execute(interaction) {
    // Your existing command logic here
  }
};`;

              fs.writeFileSync(`./fix-command-56-${file}`, fixTemplate);
              console.log(`✅ Created fix template: fix-command-56-${file}`);
              
              // Try to auto-fix if possible
              console.log(`\n🔄 ATTEMPTING AUTO-FIX...`);
              
              try {
                const autoFixedContent = autoFixOptionOrder(fileContent, commandData);
                if (autoFixedContent !== fileContent) {
                  // Create backup
                  fs.writeFileSync(`${filePath}.backup`, fileContent);
                  fs.writeFileSync(filePath, autoFixedContent);
                  console.log(`✅ AUTO-FIX APPLIED! Backup created: ${file}.backup`);
                } else {
                  console.log(`⚠️ Auto-fix not possible, manual fix required`);
                }
              } catch (error) {
                console.log(`❌ Auto-fix failed: ${error.message}`);
                console.log(`💡 Use the fix template created above for manual fixing`);
              }
            } else {
              console.log(`   ✅ Option order is correct`);
            }
          } else {
            console.log(`   ⚪ No options to check`);
          }
          
          break;
        }
        
        commands.push(commandData);
      }
    }
  } catch (error) {
    console.log(`❌ Error loading ${file}: ${error.message}`);
  }
}

function getOptionTypeMethod(type) {
  const typeMap = {
    3: 'StringOption',
    4: 'IntegerOption', 
    5: 'BooleanOption',
    6: 'UserOption',
    7: 'ChannelOption',
    8: 'RoleOption',
    9: 'MentionableOption',
    10: 'NumberOption'
  };
  return typeMap[type] || 'StringOption';
}

function autoFixOptionOrder(content, commandData) {
  // Simple auto-fix: find the command builder and reorder options
  // This is a basic implementation that may need manual adjustment
  
  if (!commandData.options || commandData.options.length <= 1) {
    return content; // No need to fix
  }
  
  // Check if reordering is actually needed
  let needsReorder = false;
  let foundOptional = false;
  
  for (const option of commandData.options) {
    if (option.required === false || option.required === undefined) {
      foundOptional = true;
    } else if (option.required === true && foundOptional) {
      needsReorder = true;
      break;
    }
  }
  
  if (!needsReorder) {
    return content; // Already in correct order
  }
  
  // For complex auto-fixing, we'd need a full parser
  // For now, return original content and rely on manual fix
  return content;
}

console.log(`\n📊 SUMMARY:`);
console.log(`   Total commands loaded: ${commands.length}`);
console.log(`   Command #56 analysis completed`);

console.log(`\n🔧 NEXT STEPS:`);
console.log(`1. Check the fix template created above`);
console.log(`2. Apply the option order fix to command #56`);
console.log(`3. Ensure all required options come before optional ones`);
console.log(`4. Test with: node safe-deploy.js`);
console.log(`5. Deploy with: node deploy-commands.js`);

console.log(`\n💡 OPTION ORDER RULE:`);
console.log(`✅ Required options (.setRequired(true)) FIRST`);
console.log(`✅ Optional options (.setRequired(false)) LAST`);

console.log(`\n✅ Command #56 analysis completed!`);