#!/usr/bin/env node

/**
 * Emergency Fix Command #52 Issue
 * Find and disable problematic command #52
 */

import fs from 'fs';
import path from 'path';

console.log('🚨 EMERGENCY FIX COMMAND #52\n');

const commandsDir = './commands';
const disabledDir = './commands/disabled';

// Create disabled directory
if (!fs.existsSync(disabledDir)) {
  fs.mkdirSync(disabledDir, { recursive: true });
}

let commandIndex = 0;
let problematicCommand = null;

// Get sorted command files
const files = fs.readdirSync(commandsDir)
  .filter(f => f.endsWith('.js') && !f.includes('disabled'))
  .sort();

console.log('🔍 Finding command #52...\n');

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
    
    // Check if this is command #52
    if (commandIndex === 52) {
      console.log(`\n🎯 FOUND COMMAND #52: ${file}`);
      
      // Quick check for option order issues
      const hasStringOption = content.includes('.addStringOption');
      const hasRequiredFalse = content.includes('.setRequired(false)');
      const hasRequiredTrue = content.includes('.setRequired(true)');
      
      console.log(`   📝 Has string options: ${hasStringOption}`);
      console.log(`   ✅ Has required(false): ${hasRequiredFalse}`);
      console.log(`   ❌ Has required(true): ${hasRequiredTrue}`);
      
      // Check if this might be the problematic one
      if (hasStringOption && (hasRequiredFalse || hasRequiredTrue)) {
        console.log(`   ⚠️ Potential option order issue detected`);
        
        // Move to disabled directory
        const disabledPath = path.join(disabledDir, file);
        fs.renameSync(filePath, disabledPath);
        
        problematicCommand = file;
        console.log(`   ✅ Moved ${file} to disabled/`);
        break;
      }
    }
  } catch (error) {
    console.log(`${String(commandIndex).padStart(2, '0')}. ${file} - ERROR: ${error.message}`);
  }
}

console.log(`\n📊 RESULTS:`);
console.log(`   📁 Commands scanned: ${commandIndex}`);
console.log(`   ⏸️ Command disabled: ${problematicCommand || 'None'}`);

if (problematicCommand) {
  console.log(`\n✅ COMMAND #52 DISABLED: ${problematicCommand}`);
  console.log(`🚀 Try deploying now: node deploy-commands.js`);
  console.log(`🔧 To fix and re-enable:`);
  console.log(`   1. Edit commands/disabled/${problematicCommand}`);
  console.log(`   2. Fix option order (required before optional)`);
  console.log(`   3. Move back: mv commands/disabled/${problematicCommand} commands/`);
  console.log(`   4. Deploy again`);
} else {
  console.log(`\n⚠️ Could not identify or disable command #52`);
  console.log(`💡 Manual steps:`);
  console.log(`   1. Check commands manually for option order`);
  console.log(`   2. Look for .setRequired(true) after .setRequired(false)`);
  console.log(`   3. Temporarily disable suspected commands`);
}

console.log(`\n🎯 Common files that might be #52:`);
console.log(`   • repair-rod-fixed.js (just created)`);
console.log(`   • eval-dev.js (has multiple options)`);
console.log(`   • any command with string + boolean options`);

console.log(`\n✅ Emergency fix completed!`);