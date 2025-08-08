#!/usr/bin/env node

/**
 * Disable Command #51 Temporarily
 * Move problematic command to disabled folder
 */

import fs from 'fs';
import path from 'path';

console.log('⏸️ TEMPORARILY DISABLE COMMAND #51\n');

const commandsDir = './commands';
const disabledDir = './commands/disabled';

// Create disabled directory if it doesn't exist
if (!fs.existsSync(disabledDir)) {
  fs.mkdirSync(disabledDir, { recursive: true });
  console.log('📁 Created disabled directory');
}

// Get all command files sorted
const files = fs.readdirSync(commandsDir)
  .filter(f => f.endsWith('.js') && !f.includes('disabled'))
  .sort();

let commandIndex = 0;
let disabledFile = null;

console.log(`📁 Scanning ${files.length} command files...\n`);

for (const file of files) {
  const filePath = path.join(commandsDir, file);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Skip invalid files
    if (content.includes('export default null') || 
        content.includes('THIS FILE HAS BEEN DISABLED') ||
        content.length < 50 ||
        !content.includes('SlashCommandBuilder')) {
      console.log(`${String(commandIndex + 1).padStart(2, '0')}. ${file} - SKIPPED`);
      continue;
    }
    
    commandIndex++;
    console.log(`${String(commandIndex).padStart(2, '0')}. ${file} - Valid`);
    
    // If this is command #51, disable it
    if (commandIndex === 51) {
      console.log(`\n🎯 DISABLING COMMAND #51: ${file}`);
      
      const disabledPath = path.join(disabledDir, file);
      
      // Move file to disabled directory
      fs.renameSync(filePath, disabledPath);
      
      console.log(`✅ Moved ${file} to disabled/`);
      disabledFile = file;
      break;
    }
  } catch (error) {
    console.log(`${String(commandIndex).padStart(2, '0')}. ${file} - ERROR: ${error.message}`);
  }
}

console.log(`\n📊 RESULTS:`);
console.log(`   📁 Commands scanned: ${commandIndex}`);
console.log(`   ⏸️ Command disabled: ${disabledFile || 'None'}`);

if (disabledFile) {
  console.log(`\n✅ COMMAND #51 TEMPORARILY DISABLED`);
  console.log(`🚀 Try deploying now: node deploy-commands.js`);
  console.log(`🔧 To re-enable: mv commands/disabled/${disabledFile} commands/`);
  
  console.log(`\n💡 After successful deploy:`);
  console.log(`   1. Fix the disabled command manually`);
  console.log(`   2. Move it back to commands/`);
  console.log(`   3. Deploy again`);
} else {
  console.log(`\n⚠️ Could not identify command #51`);
  console.log(`🔍 Try manual inspection of command files`);
}

console.log(`\n✅ Disable script completed!`);