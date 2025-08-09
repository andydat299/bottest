#!/usr/bin/env node

/**
 * Simple Option Order Scanner
 * No environment variables needed - just scan for option order issues
 */

import fs from 'fs';
import path from 'path';

console.log('🔍 SIMPLE OPTION ORDER SCANNER\n');

const commandsDir = './commands';
if (!fs.existsSync(commandsDir)) {
  console.log('❌ Commands directory not found');
  process.exit(1);
}

const commandFiles = fs.readdirSync(commandsDir)
  .filter(file => file.endsWith('.js') && !file.includes('backup') && !file.includes('fix-'));

console.log(`📁 Scanning ${commandFiles.length} command files...\n`);

let commandCount = 0;
let issuesFound = 0;

for (const file of commandFiles) {
  const filePath = path.join(commandsDir, file);
  
  try {
    // Fix Windows path issue - convert to file:// URL
    const fileUrl = new URL(filePath, import.meta.url).href;
    const command = await import(fileUrl);
    
    if ('data' in command.default && 'execute' in command.default) {
      try {
        const commandData = command.default.data.toJSON();
        
        // Only check valid commands
        if (commandData.name && commandData.description && 
            /^[a-z0-9_-]+$/.test(commandData.name) &&
            commandData.description.length <= 100) {
          
          commandCount++;
          
          console.log(`Command #${commandCount}: ${file} (/${commandData.name})`);
          
          // Check options
          if (commandData.options && commandData.options.length > 1) {
            let foundOptional = false;
            let hasIssue = false;
            
            console.log(`   Options (${commandData.options.length}):`);
            
            commandData.options.forEach((opt, i) => {
              const isRequired = opt.required === true;
              const isOptional = opt.required === false || opt.required === undefined;
              const status = isRequired ? 'REQUIRED' : 'optional';
              const mark = isRequired && foundOptional ? '❌' : '✅';
              
              console.log(`     ${i + 1}. ${opt.name} (${status}) ${mark}`);
              
              if (isOptional) {
                foundOptional = true;
              } else if (isRequired && foundOptional) {
                hasIssue = true;
              }
            });
            
            if (hasIssue) {
              console.log(`   ❌ ISSUE: Required options after optional ones!`);
              console.log(`   🎯 THIS COULD BE CAUSING ERROR 50035!`);
              
              if (commandCount === 56) {
                console.log(`   🚨 THIS IS COMMAND #56 - LIKELY THE CULPRIT!`);
              }
              
              issuesFound++;
              
              // Show fix
              const required = commandData.options.filter(o => o.required === true);
              const optional = commandData.options.filter(o => o.required !== true);
              
              console.log(`   🔧 FIX: Reorder options:`);
              console.log(`       Required first: ${required.map(o => o.name).join(', ')}`);
              console.log(`       Optional last: ${optional.map(o => o.name).join(', ')}`);
            } else {
              console.log(`   ✅ Option order is correct`);
            }
          } else {
            console.log(`   ⚪ No options or only 1 option`);
          }
          
          // Special attention to command #56
          if (commandCount === 56) {
            console.log(`\n🎯 COMMAND #56 DETAILS (Error mentions this one):`);
            console.log(`   File: ${file}`);
            console.log(`   Name: /${commandData.name}`);
            console.log(`   Has issue: ${hasIssue ? 'YES ❌' : 'NO ✅'}`);
            
            if (hasIssue) {
              console.log(`   🚨 THIS IS LIKELY CAUSING THE DEPLOYMENT ERROR!`);
              
              // Generate quick fix content
              const quickFix = `
// QUICK FIX FOR ${file}:
// 1. Open ${file}
// 2. Find all .addXxxOption() with .setRequired(true)
// 3. Move them right after .setDescription()
// 4. Leave all .setRequired(false) at the bottom
// 5. Save and redeploy
`;
              
              fs.writeFileSync(`quick-fix-command-56.txt`, quickFix);
              console.log(`   📝 Created: quick-fix-command-56.txt`);
            }
          }
        }
      } catch (error) {
        console.log(`   ❌ JSON conversion error: ${error.message}`);
      }
    }
  } catch (error) {
    console.log(`   ❌ Load error: ${error.message}`);
  }
  
  console.log('');
}

console.log(`📊 SCAN SUMMARY:`);
console.log(`✅ Total valid commands: ${commandCount}`);
console.log(`❌ Commands with option order issues: ${issuesFound}`);

if (issuesFound > 0) {
  console.log(`\n🎯 ISSUE ANALYSIS:`);
  console.log(`• Discord API Error 50035 is caused by option order`);
  console.log(`• Required options must come before optional ones`);
  console.log(`• Found ${issuesFound} commands violating this rule`);
  
  if (commandCount >= 56) {
    console.log(`• Error specifically mentions command #56`);
    console.log(`• Check command #56 details above for the main culprit`);
  }
  
  console.log(`\n🔧 QUICK FIX PROCESS:`);
  console.log(`1. Identify commands with ❌ marks above`);
  console.log(`2. Edit those files to reorder options`);
  console.log(`3. Move all .setRequired(true) to top`);
  console.log(`4. Keep all .setRequired(false) at bottom`);
  console.log(`5. Redeploy: node deploy-commands.js`);
} else {
  console.log(`\n✅ No option order issues found!`);
  console.log(`💡 Discord API error 50035 might be caused by something else`);
}

console.log(`\n✅ Scan completed!`);