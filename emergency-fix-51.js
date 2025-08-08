#!/usr/bin/env node

/**
 * Emergency Fix Command #51
 * Find and immediately fix the exact command causing the error
 */

import fs from 'fs';
import path from 'path';

console.log('🚨 EMERGENCY FIX FOR COMMAND #51\n');

const commandsDir = './commands';
let commandIndex = 0;
let fixedFile = null;

// Get all command files sorted
const files = fs.readdirSync(commandsDir)
  .filter(f => f.endsWith('.js'))
  .sort();

console.log(`📁 Found ${files.length} command files\n`);

// Process each file to find #51
for (const file of files) {
  const filePath = path.join(commandsDir, file);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Skip invalid files
    if (content.includes('export default null') || 
        content.includes('THIS FILE HAS BEEN DISABLED') ||
        content.length < 50 ||
        !content.includes('SlashCommandBuilder')) {
      console.log(`${String(commandIndex + 1).padStart(2, '0')}. ${file} - SKIPPED (invalid/disabled)`);
      continue;
    }
    
    commandIndex++;
    console.log(`${String(commandIndex).padStart(2, '0')}. ${file} - Valid command`);
    
    // Check if this is command #51
    if (commandIndex === 51) {
      console.log(`\n🎯 FOUND COMMAND #51: ${file}`);
      
      // Extract command name
      const nameMatch = content.match(/\.setName\(['"`]([^'"`]+)['"`]\)/);
      const commandName = nameMatch ? nameMatch[1] : 'unknown';
      console.log(`📝 Command name: ${commandName}`);
      
      // Analyze options
      const optionLines = [];
      const lines = content.split('\n');
      let inOption = false;
      let currentOption = '';
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (line.includes('.addStringOption') || 
            line.includes('.addIntegerOption') || 
            line.includes('.addBooleanOption') ||
            line.includes('.addUserOption') ||
            line.includes('.addChannelOption')) {
          
          if (currentOption) {
            optionLines.push(currentOption);
          }
          currentOption = line;
          inOption = true;
        } else if (inOption) {
          currentOption += '\n' + line;
          
          if (line.includes(')') && (line.includes(',') || line.includes(')'))) {
            optionLines.push(currentOption);
            currentOption = '';
            inOption = false;
          }
        }
      }
      
      if (currentOption) {
        optionLines.push(currentOption);
      }
      
      console.log(`\n📊 Found ${optionLines.length} options:`);
      
      const requiredOptions = [];
      const optionalOptions = [];
      let hasIssue = false;
      
      optionLines.forEach((option, index) => {
        const isRequired = option.includes('.setRequired(true)');
        console.log(`   ${index + 1}. ${isRequired ? 'REQUIRED' : 'OPTIONAL'}: ${option.split('\n')[0].trim()}`);
        
        if (isRequired) {
          requiredOptions.push(option);
        } else {
          optionalOptions.push(option);
        }
        
        // Check for ordering issue
        if (!isRequired && requiredOptions.length === 0) {
          // Optional found before any required - potential issue
        } else if (isRequired && optionalOptions.length > 0) {
          hasIssue = true;
          console.log(`      ❌ ISSUE: Required option after optional options!`);
        }
      });
      
      if (hasIssue) {
        console.log(`\n🔧 FIXING OPTION ORDER...`);
        
        // Create fixed content
        let newContent = content;
        
        // Remove all options from the original content
        optionLines.forEach(option => {
          newContent = newContent.replace(option, '');
        });
        
        // Find insertion point (after setDescription)
        const descriptionMatch = newContent.match(/(\.setDescription\([^)]+\))/);
        if (descriptionMatch) {
          const insertAfter = descriptionMatch[0];
          const insertPoint = newContent.indexOf(insertAfter) + insertAfter.length;
          
          // Build new options section
          let optionsSection = '';
          
          // Add required options first
          if (requiredOptions.length > 0) {
            optionsSection += '\n    // Required options';
            requiredOptions.forEach(option => {
              optionsSection += '\n    ' + option.split('\n').map(line => line.trim()).join('\n    ');
            });
          }
          
          // Add optional options after
          if (optionalOptions.length > 0) {
            optionsSection += '\n    // Optional options';
            optionalOptions.forEach(option => {
              optionsSection += '\n    ' + option.split('\n').map(line => line.trim()).join('\n    ');
            });
          }
          
          // Insert fixed options
          const beforeInsert = newContent.substring(0, insertPoint);
          const afterInsert = newContent.substring(insertPoint);
          newContent = beforeInsert + optionsSection + afterInsert;
          
          // Backup original and save fixed version
          const backupPath = filePath.replace('.js', `.broken-${Date.now()}.js`);
          fs.writeFileSync(backupPath, content);
          fs.writeFileSync(filePath, newContent);
          
          console.log(`✅ Fixed ${file}!`);
          console.log(`📋 Backup saved: ${path.basename(backupPath)}`);
          fixedFile = file;
        } else {
          console.log(`❌ Could not find insertion point in ${file}`);
        }
      } else {
        console.log(`\n✅ No option order issues found in command #51`);
        console.log(`🤔 The error might be in a different command or file structure issue`);
      }
      
      break;
    }
  } catch (error) {
    console.log(`${String(commandIndex).padStart(2, '0')}. ${file} - ERROR: ${error.message}`);
  }
}

console.log(`\n📊 RESULTS:`);
console.log(`   📁 Total valid commands: ${commandIndex}`);
console.log(`   🎯 Command #51: ${commandIndex >= 51 ? 'Found and analyzed' : 'Not reached'}`);
console.log(`   🔧 Fixed: ${fixedFile || 'None'}`);

if (fixedFile) {
  console.log(`\n🚀 NEXT STEPS:`);
  console.log(`   1. Command #51 (${fixedFile}) has been fixed`);
  console.log(`   2. Try deploying again: node deploy-commands.js`);
  console.log(`   3. If still failing, check for other syntax errors`);
} else {
  console.log(`\n🔍 TROUBLESHOOTING:`);
  console.log(`   • Command #51 might not have option order issues`);
  console.log(`   • Check for syntax errors in command files`);
  console.log(`   • Verify all files have proper exports`);
  console.log(`   • Look for malformed option definitions`);
}

console.log(`\n✅ Emergency fix completed!`);