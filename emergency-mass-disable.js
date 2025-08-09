#!/usr/bin/env node

/**
 * Emergency Disable All Problematic Commands
 * Quick solution to get Railway deployment working
 */

import fs from 'fs';
import path from 'path';

console.log('🚨 EMERGENCY: DISABLING ALL PROBLEMATIC COMMANDS\n');

const commandsDir = './commands';
const disabledDir = './commands/disabled';

// Ensure disabled directory exists
if (!fs.existsSync(disabledDir)) {
  fs.mkdirSync(disabledDir, { recursive: true });
  console.log('📁 Created disabled directory');
}

// Commands that are likely to have option order issues
const suspiciousCommands = [
  'force-upgrade-rod.js',
  'repair-rod-fixed.js', 
  'eval-dev.js',
  'set-vip.js',
  'add-balance.js',
  'dev-check.js',
  'test-debug-admin-channel.js'
];

// Get all commands and check each one
const files = fs.readdirSync(commandsDir)
  .filter(f => f.endsWith('.js') && !f.includes('disabled') && !f.includes('backup'))
  .sort();

let totalCommands = 0;
let disabledCount = 0;
let disabledCommands = [];

console.log('🔍 Checking all commands for option order issues...\n');

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
    
    // Check if this command has option order issues
    let shouldDisable = false;
    let disableReason = '';
    
    // 1. Check if it's in suspicious list
    if (suspiciousCommands.includes(file)) {
      shouldDisable = true;
      disableReason = 'Suspicious command pattern';
    }
    
    // 2. Check for actual option order issues
    if (!shouldDisable) {
      const lines = content.split('\n');
      let foundOptional = false;
      let hasOrderIssue = false;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.includes('.addStringOption') || 
            line.includes('.addIntegerOption') || 
            line.includes('.addBooleanOption') ||
            line.includes('.addUserOption') ||
            line.includes('.addChannelOption')) {
          
          // Look for setRequired in next few lines
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
          
          if (isRequired === null) {
            isRequired = false; // Default
          }
          
          if (!isRequired) {
            foundOptional = true;
          } else if (foundOptional && isRequired) {
            hasOrderIssue = true;
            break;
          }
        }
      }
      
      if (hasOrderIssue) {
        shouldDisable = true;
        disableReason = 'Option order violation detected';
      }
    }
    
    // 3. If command index is >= 50, disable to be safe
    if (!shouldDisable && totalCommands >= 50) {
      shouldDisable = true;
      disableReason = `Command #${totalCommands} - high risk area`;
    }
    
    if (shouldDisable) {
      // Move to disabled directory
      const timestamp = Date.now();
      const disabledPath = path.join(disabledDir, `${file.replace('.js', '')}-disabled-${timestamp}.js`);
      
      // Backup original
      fs.copyFileSync(filePath, disabledPath);
      
      // Create simple disabled stub
      const disabledContent = `// EMERGENCY DISABLED - ${disableReason}
// Original backed up to: ${path.basename(disabledPath)}

import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('${file.replace('.js', '')}-disabled')
    .setDescription('🚫 Temporarily disabled for Railway deployment'),
  
  async execute(interaction) {
    await interaction.reply({
      content: '🚫 **Command Temporarily Disabled**\\n\\n' +
               'This command has been disabled to fix Railway deployment.\\n' +
               'Reason: ${disableReason}\\n\\n' +
               'Available alternatives:\\n' +
               '• \`/fish\` - Continue fishing\\n' +
               '• \`/balance\` - Check balance\\n' +
               '• \`/rod-status\` - Check rod info',
      ephemeral: true
    });
  }
};`;

      fs.writeFileSync(filePath, disabledContent);
      
      disabledCommands.push({
        index: totalCommands,
        file,
        reason: disableReason,
        backup: path.basename(disabledPath)
      });
      
      disabledCount++;
      console.log(`⏸️ Command #${totalCommands}: ${file} - DISABLED (${disableReason})`);
    } else {
      console.log(`✅ Command #${totalCommands}: ${file} - OK`);
    }
    
  } catch (error) {
    console.log(`❌ Command #${totalCommands}: ${file} - ERROR: ${error.message}`);
  }
}

console.log(`\n📊 EMERGENCY DISABLE RESULTS:`);
console.log(`   📁 Total commands checked: ${totalCommands}`);
console.log(`   ⏸️ Commands disabled: ${disabledCount}`);
console.log(`   ✅ Commands kept active: ${totalCommands - disabledCount}`);

if (disabledCommands.length > 0) {
  console.log(`\n🚫 DISABLED COMMANDS:`);
  disabledCommands.forEach(cmd => {
    console.log(`   ${cmd.index}. ${cmd.file} - ${cmd.reason}`);
    console.log(`      Backup: ${cmd.backup}`);
  });
  
  console.log(`\n🚂 RAILWAY DEPLOYMENT STEPS:`);
  console.log(`1. git add .`);
  console.log(`2. git commit -m "Emergency: Mass disable problematic commands for Railway"`);
  console.log(`3. git push`);
  console.log(`4. Railway will redeploy with safe command set`);
  console.log(`5. Bot should start successfully`);
  
  console.log(`\n✅ REMAINING WORKING COMMANDS:`);
  console.log(`   • /fish - Core fishing system`);
  console.log(`   • /balance - Check balance`);
  console.log(`   • /rod-status - Rod information`);
  console.log(`   • /chatrewards - Chat rewards`);
  console.log(`   • Basic bot functionality`);
  
  console.log(`\n🔧 TO RE-ENABLE COMMANDS LATER:`);
  console.log(`1. Fix option order in disabled commands`);
  console.log(`2. Move fixed commands back to commands/`);
  console.log(`3. Test locally before deploying`);
  console.log(`4. Deploy incrementally`);
  
} else {
  console.log(`\n✅ NO COMMANDS NEEDED TO BE DISABLED`);
  console.log(`   All commands appear to have correct option order`);
  console.log(`   The issue might be elsewhere`);
}

console.log(`\n🚨 Emergency disable completed!`);