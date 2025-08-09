#!/usr/bin/env node

/**
 * Scan All Commands for Option Order Issues
 * Find all commands with required options after optional ones
 */

import fs from 'fs';
import path from 'path';

console.log('🔍 SCANNING ALL COMMANDS FOR OPTION ORDER ISSUES\n');

const commandsPath = path.join(process.cwd(), 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

console.log(`📁 Scanning ${commandFiles.length} command files...\n`);

const problematicCommands = [];
let commandIndex = 0;

// Check each command file
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  
  try {
    console.log(`🔍 Checking: ${file}`);
    
    // Fix Windows path issue - convert to file:// URL  
    const filePath = path.join(commandsPath, file);
    const fileUrl = new URL(filePath, import.meta.url).href;
    const command = await import(fileUrl);
    
    if ('data' in command.default && 'execute' in command.default) {
      try {
        const commandData = command.default.data.toJSON();
        
        // Only count commands that would actually be deployed
        if (commandData.name && commandData.description && 
            /^[a-z0-9_-]+$/.test(commandData.name) &&
            commandData.description.length <= 100) {
          
          commandIndex++;
          
          // Check options for ordering issues
          if (commandData.options && commandData.options.length > 1) {
            let foundOptional = false;
            let hasOrderIssue = false;
            let issueDetails = [];
            
            commandData.options.forEach((option, index) => {
              const isRequired = option.required === true;
              const isOptional = option.required === false || option.required === undefined;
              
              if (isOptional) {
                foundOptional = true;
              } else if (isRequired && foundOptional) {
                hasOrderIssue = true;
                issueDetails.push(`Option ${index + 1}: "${option.name}" is required but comes after optional options`);
              }
            });
            
            if (hasOrderIssue) {
              console.log(`   ❌ OPTION ORDER ISSUE FOUND!`);
              console.log(`   Command Index: #${commandIndex}`);
              console.log(`   Name: /${commandData.name}`);
              
              problematicCommands.push({
                file,
                commandIndex,
                name: commandData.name,
                description: commandData.description,
                optionCount: commandData.options.length,
                issues: issueDetails,
                options: commandData.options.map(opt => ({
                  name: opt.name,
                  type: opt.type,
                  required: opt.required,
                  description: opt.description
                }))
              });
            } else {
              console.log(`   ✅ Option order correct`);
            }
          } else {
            console.log(`   ⚪ No options or only 1 option`);
          }
        } else {
          console.log(`   ⚠️ Invalid command format (won't be deployed)`);
        }
      } catch (jsonError) {
        console.log(`   ❌ Error converting to JSON: ${jsonError.message}`);
      }
    } else {
      console.log(`   ❌ Missing data or execute property`);
    }
  } catch (error) {
    console.log(`   ❌ Error loading: ${error.message}`);
  }
  
  console.log('');
}

console.log('📊 SCAN RESULTS:');
console.log(`✅ Total valid commands: ${commandIndex}`);
console.log(`❌ Commands with option order issues: ${problematicCommands.length}`);

if (problematicCommands.length > 0) {
  console.log('\n❌ PROBLEMATIC COMMANDS:');
  
  problematicCommands.forEach((cmd, index) => {
    console.log(`\n${index + 1}. Command #${cmd.commandIndex}: ${cmd.file}`);
    console.log(`   Name: /${cmd.name}`);
    console.log(`   Description: ${cmd.description}`);
    console.log(`   Options: ${cmd.optionCount}`);
    
    console.log(`   Current option order:`);
    cmd.options.forEach((opt, i) => {
      const requiredText = opt.required === true ? 'REQUIRED' : 'optional';
      console.log(`     ${i + 1}. ${opt.name} (${requiredText})`);
    });
    
    console.log(`   Issues:`);
    cmd.issues.forEach(issue => {
      console.log(`     • ${issue}`);
    });
  });
  
  console.log('\n🔧 FIXES NEEDED:');
  
  problematicCommands.forEach((cmd, index) => {
    console.log(`\n📄 FIX FOR: ${cmd.file}`);
    
    // Separate required and optional options
    const requiredOptions = cmd.options.filter(opt => opt.required === true);
    const optionalOptions = cmd.options.filter(opt => opt.required !== true);
    
    console.log(`   ✅ Correct order should be:`);
    console.log(`   // Required options first:`);
    requiredOptions.forEach((opt, i) => {
      console.log(`     ${i + 1}. ${opt.name} (REQUIRED)`);
    });
    console.log(`   // Optional options last:`);
    optionalOptions.forEach((opt, i) => {
      console.log(`     ${requiredOptions.length + i + 1}. ${opt.name} (optional)`);
    });
  });
}

// Generate auto-fix script for each problematic command
if (problematicCommands.length > 0) {
  console.log('\n🛠️ GENERATING AUTO-FIX SCRIPTS...');
  
  problematicCommands.forEach((cmd, index) => {
    const fixContent = generateFixScript(cmd);
    const fixFileName = `fix-option-order-${cmd.file.replace('.js', '')}.js`;
    
    fs.writeFileSync(fixFileName, fixContent);
    console.log(`✅ Created: ${fixFileName}`);
  });
}

function generateFixScript(cmd) {
  const requiredOptions = cmd.options.filter(opt => opt.required === true);
  const optionalOptions = cmd.options.filter(opt => opt.required !== true);
  
  const getOptionTypeMethod = (type) => {
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
  };
  
  return `#!/usr/bin/env node

/**
 * Fix for ${cmd.file}
 * Corrects option order: required options before optional ones
 */

// CURRENT ISSUE: Required options come after optional options
// COMMAND: /${cmd.name} (Command #${cmd.commandIndex})

// ❌ CURRENT ORDER:
${cmd.options.map((opt, i) => 
  `//   ${i + 1}. ${opt.name} - ${opt.required === true ? 'REQUIRED' : 'optional'}`
).join('\n')}

// ✅ CORRECT ORDER:
${[...requiredOptions, ...optionalOptions].map((opt, i) => 
  `//   ${i + 1}. ${opt.name} - ${opt.required === true ? 'REQUIRED' : 'optional'}`
).join('\n')}

// FIXED CODE:
import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('${cmd.name}')
    .setDescription('${cmd.description}')
    // ✅ ALL REQUIRED OPTIONS FIRST:
${requiredOptions.map(opt => 
  `    .add${getOptionTypeMethod(opt.type)}(option =>
      option.setName('${opt.name}')
            .setDescription('${opt.description || 'Option description'}')
            .setRequired(true))`
).join('\n')}
    // ✅ ALL OPTIONAL OPTIONS LAST:
${optionalOptions.map(opt => 
  `    .add${getOptionTypeMethod(opt.type)}(option =>
      option.setName('${opt.name}')
            .setDescription('${opt.description || 'Option description'}')
            .setRequired(false))`
).join('\n')},
  
  async execute(interaction) {
    // TODO: Copy your existing command logic from ${cmd.file}
    await interaction.reply('Command logic needs to be copied from original file.');
  }
};

// MANUAL STEPS:
// 1. Copy the execute function logic from original ${cmd.file}
// 2. Replace the original file content with this fixed version
// 3. Test with: node safe-deploy.js
// 4. Deploy with: node deploy-commands.js
`;
}

console.log('\n🎯 SUMMARY:');

if (problematicCommands.length > 0) {
  console.log(`❌ Found ${problematicCommands.length} commands with option order issues`);
  console.log(`🔧 Generated fix scripts for each problematic command`);
  console.log(`💡 Apply fixes and redeploy to resolve Discord API error 50035`);
  
  console.log('\n📋 COMMANDS TO FIX:');
  problematicCommands.forEach(cmd => {
    console.log(`   • Command #${cmd.commandIndex}: ${cmd.file} (/${cmd.name})`);
  });
} else {
  console.log(`✅ No option order issues found in any commands!`);
  console.log(`💡 The Discord API error might be caused by something else`);
}

console.log('\n✅ Option order scan completed!');