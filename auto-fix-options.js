#!/usr/bin/env node

/**
 * Auto Fix Command Option Order
 * Automatically reorder options in command files
 */

import fs from 'fs';
import path from 'path';

console.log('🔧 AUTO-FIXING COMMAND OPTION ORDER\n');

function fixCommandFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath);
    
    // Skip non-JS files or disabled files
    if (!fileName.endsWith('.js') || 
        content.includes('export default null') ||
        content.includes('THIS FILE HAS BEEN DISABLED')) {
      return false;
    }
    
    console.log(`🔍 Processing: ${fileName}`);
    
    // Find SlashCommandBuilder section
    const builderStart = content.indexOf('new SlashCommandBuilder()');
    const builderEnd = content.indexOf('),', builderStart);
    
    if (builderStart === -1 || builderEnd === -1) {
      console.log(`   ⚠️ No SlashCommandBuilder found`);
      return false;
    }
    
    const builderSection = content.substring(builderStart, builderEnd + 1);
    const beforeBuilder = content.substring(0, builderStart);
    const afterBuilder = content.substring(builderEnd + 1);
    
    // Extract all options
    const optionRegex = /\.add\w+Option\([^}]+\}?\s*\)/gs;
    const options = [...builderSection.matchAll(optionRegex)];
    
    if (options.length === 0) {
      console.log(`   ✅ No options found`);
      return false;
    }
    
    // Separate required and optional options
    const requiredOptions = [];
    const optionalOptions = [];
    
    options.forEach(match => {
      const optionText = match[0];
      if (optionText.includes('.setRequired(true)')) {
        requiredOptions.push(optionText);
      } else {
        optionalOptions.push(optionText);
      }
    });
    
    console.log(`   📊 Found ${requiredOptions.length} required, ${optionalOptions.length} optional options`);
    
    // Check if reordering is needed
    const originalOrder = options.map(m => m[0]);
    const correctOrder = [...requiredOptions, ...optionalOptions];
    
    if (JSON.stringify(originalOrder) === JSON.stringify(correctOrder)) {
      console.log(`   ✅ Options already in correct order`);
      return false;
    }
    
    console.log(`   🔧 Reordering options...`);
    
    // Rebuild the command with correct option order
    let newBuilderSection = builderSection;
    
    // Remove all options from builder
    options.forEach(match => {
      newBuilderSection = newBuilderSection.replace(match[0], '');
    });
    
    // Add options in correct order
    const insertPoint = newBuilderSection.lastIndexOf(')');
    const beforeInsert = newBuilderSection.substring(0, insertPoint);
    const afterInsert = newBuilderSection.substring(insertPoint);
    
    let optionsText = '';
    
    // Add required options first
    if (requiredOptions.length > 0) {
      optionsText += '\n    // Required options\n';
      requiredOptions.forEach(option => {
        optionsText += `    ${option}\n`;
      });
    }
    
    // Add optional options after
    if (optionalOptions.length > 0) {
      optionsText += '    // Optional options\n';
      optionalOptions.forEach(option => {
        optionsText += `    ${option}\n`;
      });
    }
    
    const newBuilder = beforeInsert + optionsText + '  ' + afterInsert;
    const newContent = beforeBuilder + newBuilder + afterBuilder;
    
    // Write fixed file
    const backupPath = filePath.replace('.js', '.backup.js');
    fs.writeFileSync(backupPath, content); // Backup original
    fs.writeFileSync(filePath, newContent); // Write fixed version
    
    console.log(`   ✅ Fixed and backed up to ${path.basename(backupPath)}`);
    return true;
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

// Process all command files
const commandsDir = './commands';
if (!fs.existsSync(commandsDir)) {
  console.log('❌ Commands directory not found!');
  process.exit(1);
}

const files = fs.readdirSync(commandsDir).filter(f => f.endsWith('.js'));
let fixedCount = 0;

files.forEach(file => {
  const filePath = path.join(commandsDir, file);
  if (fs.statSync(filePath).isFile()) {
    if (fixCommandFile(filePath)) {
      fixedCount++;
    }
  }
});

console.log(`\n📊 AUTO-FIX RESULTS:`);
console.log(`   📁 Files processed: ${files.length}`);
console.log(`   🔧 Files fixed: ${fixedCount}`);
console.log(`   📋 Backup files created: ${fixedCount}`);

if (fixedCount > 0) {
  console.log(`\n✅ Option order fixed in ${fixedCount} files!`);
  console.log(`🚀 Try deploying commands now:`);
  console.log(`   node deploy-commands.js`);
  
  console.log(`\n📋 Backup files created (can be deleted if deploy works):`);
  const backupFiles = fs.readdirSync(commandsDir).filter(f => f.includes('.backup.js'));
  backupFiles.forEach(file => {
    console.log(`   • ${file}`);
  });
} else {
  console.log(`\n✅ No option order issues found!`);
  console.log(`🤔 The error might be caused by:`);
  console.log(`   • Syntax errors in command files`);
  console.log(`   • Missing export statements`);
  console.log(`   • Malformed option definitions`);
}

console.log(`\n✅ Auto-fix completed!`);