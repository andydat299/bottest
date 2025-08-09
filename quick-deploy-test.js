#!/usr/bin/env node

/**
 * Quick Command Analysis - Find Command #56 Without Deployment
 * Analyze commands locally to find option order issues
 */

import fs from 'fs';
import path from 'path';

console.log('🔍 QUICK COMMAND ANALYSIS - FINDING COMMAND #56\n');

const commandsPath = path.join(process.cwd(), 'commands');

if (!fs.existsSync(commandsPath)) {
  console.error('❌ Commands directory not found');
  process.exit(1);
}

const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

console.log(`🧪 Analyzing ${commandFiles.length} commands to find #56 and option order issues...\n`);

const allCommands = [];
let validCommandIndex = 0;

// Load all valid commands first
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  
  try {
    console.log(`🔍 Loading: ${file}`);
    
    // Fix Windows path issue - convert to file:// URL
    const filePath = path.join(commandsPath, file);
    const fileUrl = new URL(filePath, import.meta.url).href;
    const command = await import(fileUrl);
    
    if ('data' in command.default && 'execute' in command.default) {
      const commandData = command.default.data.toJSON();
      
      // Only include commands that would pass basic validation
      if (commandData.name && commandData.description && 
          /^[a-z0-9_-]+$/.test(commandData.name) &&
          commandData.description.length <= 100) {
        
        validCommandIndex++;
        
        // Check for option order issues
        let hasOrderIssue = false;
        let optionDetails = [];
        
        if (commandData.options && commandData.options.length > 1) {
          let foundOptional = false;
          
          commandData.options.forEach((option, index) => {
            const isRequired = option.required === true;
            const isOptional = option.required === false || option.required === undefined;
            const status = isRequired ? 'REQUIRED' : 'optional';
            
            optionDetails.push(`${index + 1}. ${option.name} (${status})`);
            
            if (isOptional) {
              foundOptional = true;
            } else if (isRequired && foundOptional) {
              hasOrderIssue = true;
            }
          });
        }
        
        allCommands.push({
          index: validCommandIndex,
          file: file,
          name: commandData.name,
          description: commandData.description,
          data: commandData,
          hasOrderIssue,
          optionDetails
        });
        
        const status = hasOrderIssue ? '❌ OPTION ORDER ISSUE' : '✅ OK';
        console.log(`   Command #${validCommandIndex}: /${commandData.name} - ${status}`);
        
      } else {
        console.log(`   ⚠️ Invalid format (won't be deployed)`);
      }
    } else {
      console.log(`   ❌ Missing data or execute property`);
    }
  } catch (error) {
    console.log(`   ❌ Error loading: ${error.message}`);
  }
}

console.log(`\n📊 ANALYSIS RESULTS:`);
console.log(`✅ Total valid commands: ${allCommands.length}`);

const problematicCommands = allCommands.filter(cmd => cmd.hasOrderIssue);
console.log(`❌ Commands with option order issues: ${problematicCommands.length}`);

// Focus on command #56 specifically
if (allCommands.length >= 56) {
  const command56 = allCommands[55]; // Index 55 = Command #56
  
  console.log(`\n🎯 COMMAND #56 ANALYSIS:`);
  console.log(`📄 File: ${command56.file}`);
  console.log(`🏷️ Name: /${command56.name}`);
  console.log(`📝 Description: ${command56.description}`);
  console.log(`🔧 Has option order issue: ${command56.hasOrderIssue ? 'YES ❌' : 'NO ✅'}`);
  
  if (command56.data.options && command56.data.options.length > 0) {
    console.log(`📋 Options (${command56.data.options.length}):`);
    command56.optionDetails.forEach(detail => {
      console.log(`     ${detail}`);
    });
    
    if (command56.hasOrderIssue) {
      console.log(`\n🔧 OPTION ORDER FIX NEEDED:`);
      
      const requiredOptions = command56.data.options.filter(opt => opt.required === true);
      const optionalOptions = command56.data.options.filter(opt => opt.required !== true);
      
      console.log(`   ✅ Correct order should be:`);
      console.log(`   Required options first:`);
      requiredOptions.forEach((opt, i) => {
        console.log(`     ${i + 1}. ${opt.name} (REQUIRED)`);
      });
      console.log(`   Optional options last:`);
      optionalOptions.forEach((opt, i) => {
        console.log(`     ${requiredOptions.length + i + 1}. ${opt.name} (optional)`);
      });
      
      // Generate fix for command #56
      console.log(`\n🛠️ GENERATING FIX FOR COMMAND #56...`);
      const fixContent = generateFixForCommand56(command56);
      const fixFileName = `fix-command-56-${command56.file}`;
      
      fs.writeFileSync(fixFileName, fixContent);
      console.log(`✅ Created fix file: ${fixFileName}`);
    }
  } else {
    console.log(`   ⚪ No options to analyze`);
  }
} else {
  console.log(`\n⚠️ Only ${allCommands.length} valid commands found, command #56 doesn't exist`);
}

// Show all problematic commands
if (problematicCommands.length > 0) {
  console.log(`\n❌ ALL COMMANDS WITH OPTION ORDER ISSUES:`);
  
  problematicCommands.forEach((cmd, index) => {
    console.log(`\n${index + 1}. Command #${cmd.index}: ${cmd.file}`);
    console.log(`   Name: /${cmd.name}`);
    console.log(`   Options:`);
    cmd.optionDetails.forEach(detail => {
      console.log(`     ${detail}`);
    });
  });
}

function generateFixForCommand56(cmd) {
  const requiredOptions = cmd.data.options.filter(opt => opt.required === true);
  const optionalOptions = cmd.data.options.filter(opt => opt.required !== true);
  
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
 * FIX FOR COMMAND #56: ${cmd.file}
 * Corrects option order to resolve Discord API Error 50035
 */

// 🎯 THIS IS COMMAND #56 CAUSING THE ERROR!
// File: ${cmd.file}
// Name: /${cmd.name}
// Issue: Required options come after optional options

// ❌ CURRENT ORDER (CAUSING ERROR):
${cmd.data.options.map((opt, i) => 
  `//   ${i + 1}. ${opt.name} - ${opt.required === true ? 'REQUIRED' : 'optional'}`
).join('\n')}

// ✅ FIXED ORDER (WILL WORK):
${[...requiredOptions, ...optionalOptions].map((opt, i) => 
  `//   ${i + 1}. ${opt.name} - ${opt.required === true ? 'REQUIRED' : 'optional'}`
).join('\n')}

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
    // TODO: Copy your existing command logic from original ${cmd.file}
    // This is just the structure fix - you need to add the actual command logic
    await interaction.reply('Command has been fixed but logic needs to be copied from original file.');
  }
};

// 🚀 DEPLOYMENT STEPS:
// 1. Copy the execute() function from original ${cmd.file}
// 2. Replace the original file with this fixed version
// 3. Test: node safe-deploy.js
// 4. Deploy: node deploy-commands.js

// ⚡ QUICK MANUAL FIX ALTERNATIVE:
// Edit ${cmd.file} directly:
// 1. Cut all .addXxxOption() with .setRequired(true)
// 2. Paste them right after .setDescription()
// 3. Leave .setRequired(false) options at the bottom
`;
}

console.log(`\n🎯 NEXT STEPS:`);
console.log(`1. Fix command #56 using the generated fix file`);
console.log(`2. Apply fixes to other problematic commands if any`);
console.log(`3. Test with: node safe-deploy.js`);
console.log(`4. Deploy with: node deploy-commands.js`);

console.log(`\n✅ Command #56 analysis completed!`);

const commandsPath = path.join(process.cwd(), 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

console.log(`🧪 Testing deployment in batches to isolate problematic command...\n`);

const allCommands = [];
let validCommandIndex = 0;

// Load all valid commands first
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  
  try {
    const command = await import(filePath);
    
    if ('data' in command.default && 'execute' in command.default) {
      const commandData = command.default.data.toJSON();
      
      // Only include commands that would pass basic validation
      if (commandData.name && commandData.description && 
          /^[a-z0-9_-]+$/.test(commandData.name) &&
          commandData.description.length <= 100) {
        
        validCommandIndex++;
        allCommands.push({
          index: validCommandIndex,
          file: file,
          data: commandData
        });
      }
    }
  } catch (error) {
    console.log(`⚠️ Skipping ${file}: ${error.message}`);
  }
}

console.log(`📊 Loaded ${allCommands.length} valid commands`);
console.log(`🎯 Error mentions command #56, testing around that range...\n`);

const rest = new REST().setToken(token);

// Test deployment in smaller batches around command #56
async function testBatch(startIndex, endIndex, description) {
  const batch = allCommands.slice(startIndex, endIndex + 1);
  const commandsData = batch.map(cmd => cmd.data);
  
  console.log(`🧪 Testing ${description}: Commands #${startIndex + 1}-#${endIndex + 1} (${batch.length} commands)`);
  
  try {
    await rest.put(
      guildId ? 
        Routes.applicationGuildCommands(clientId, guildId) :
        Routes.applicationCommands(clientId),
      { body: commandsData }
    );
    
    console.log(`   ✅ SUCCESS: Batch deployed successfully`);
    return true;
  } catch (error) {
    console.log(`   ❌ FAILED: ${error.message}`);
    
    if (error.code === 50035) {
      const errorMessage = error.message;
      const commandNumberMatch = errorMessage.match(/(\d+)\.options/);
      if (commandNumberMatch) {
        const errorCommandIndex = parseInt(commandNumberMatch[1]);
        const actualCommand = batch[errorCommandIndex];
        
        console.log(`   🎯 Error in command #${errorCommandIndex + 1} of this batch`);
        if (actualCommand) {
          console.log(`   📄 Problematic command: ${actualCommand.file} (/${actualCommand.data.name})`);
          console.log(`   🔍 Global command index: #${actualCommand.index}`);
          
          // Show option details
          if (actualCommand.data.options) {
            console.log(`   📋 Options (${actualCommand.data.options.length}):`);
            actualCommand.data.options.forEach((opt, i) => {
              const required = opt.required === true ? 'REQUIRED' : 'optional';
              console.log(`     ${i + 1}. ${opt.name} (${required})`);
            });
          }
        }
      }
    }
    
    return false;
  }
}

// Binary search approach to find the problematic command
async function findProblematicCommand() {
  console.log('🎯 Starting binary search to isolate problematic command...\n');
  
  // First, test around command #56 specifically
  if (allCommands.length >= 56) {
    console.log('📍 Testing command #56 specifically...');
    
    // Test just command #56
    const success = await testBatch(55, 55, 'Command #56 only');
    
    if (!success) {
      console.log('\n🎯 FOUND IT! Command #56 is the problematic one');
      const problematicCmd = allCommands[55];
      
      console.log(`\n📄 PROBLEMATIC COMMAND DETAILS:`);
      console.log(`   File: ${problematicCmd.file}`);
      console.log(`   Name: /${problematicCmd.data.name}`);
      console.log(`   Description: ${problematicCmd.data.description}`);
      
      if (problematicCmd.data.options) {
        console.log(`   Options: ${problematicCmd.data.options.length}`);
        
        let foundOptional = false;
        let hasOrderIssue = false;
        
        problematicCmd.data.options.forEach((opt, i) => {
          const isRequired = opt.required === true;
          const isOptional = opt.required === false || opt.required === undefined;
          const status = isRequired ? 'REQUIRED' : 'optional';
          
          console.log(`     ${i + 1}. ${opt.name} (${status})`);
          
          if (isOptional) {
            foundOptional = true;
          } else if (isRequired && foundOptional) {
            hasOrderIssue = true;
            console.log(`       ❌ ORDER ISSUE: Required option after optional!`);
          }
        });
        
        if (hasOrderIssue) {
          console.log(`\n🔧 FIX NEEDED: Reorder options in ${problematicCmd.file}`);
          console.log(`   • Move all required options (.setRequired(true)) to the top`);
          console.log(`   • Place all optional options (.setRequired(false)) at the bottom`);
          
          // Generate quick fix
          const requiredOptions = problematicCmd.data.options.filter(opt => opt.required === true);
          const optionalOptions = problematicCmd.data.options.filter(opt => opt.required !== true);
          
          console.log(`\n✅ CORRECT ORDER:`);
          console.log(`   Required options first:`);
          requiredOptions.forEach((opt, i) => {
            console.log(`     ${i + 1}. ${opt.name} (REQUIRED)`);
          });
          console.log(`   Optional options last:`);
          optionalOptions.forEach((opt, i) => {
            console.log(`     ${requiredOptions.length + i + 1}. ${opt.name} (optional)`);
          });
        }
      }
      
      return;
    }
  }
  
  // If command #56 alone works, test in batches
  let start = 0;
  let end = allCommands.length - 1;
  
  while (start < end) {
    const mid = Math.floor((start + end) / 2);
    
    const firstHalfSuccess = await testBatch(start, mid, `First half (${start + 1}-${mid + 1})`);
    
    if (!firstHalfSuccess) {
      end = mid;
    } else {
      start = mid + 1;
    }
  }
  
  console.log(`\n🎯 Problematic command isolated to index: ${start + 1}`);
  const problematicCmd = allCommands[start];
  console.log(`📄 File: ${problematicCmd.file}`);
  console.log(`🏷️ Name: /${problematicCmd.data.name}`);
}

// Start the search
await findProblematicCommand();

console.log('\n🔧 NEXT STEPS:');
console.log('1. Fix the option order in the identified command file');
console.log('2. Ensure all .setRequired(true) options come before .setRequired(false)');
console.log('3. Test with: node safe-deploy.js');
console.log('4. Deploy with: node deploy-commands.js');

console.log('\n✅ Problematic command identification completed!');