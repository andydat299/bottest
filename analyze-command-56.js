#!/usr/bin/env node

/**
 * Analyze Command #56 Specifically
 * Check test-command-order.js for option order issues
 */

import fs from 'fs';
import path from 'path';

console.log('🎯 ANALYZING COMMAND #56: test-command-order.js\n');

const targetFile = './commands/test-command-order.js';

if (!fs.existsSync(targetFile)) {
  console.log('❌ test-command-order.js not found');
  process.exit(1);
}

console.log('📄 Reading file content...');

try {
  const content = fs.readFileSync(targetFile, 'utf8');
  
  console.log('\n📋 FILE CONTENT PREVIEW:');
  console.log('=' .repeat(50));
  console.log(content.substring(0, 1000) + (content.length > 1000 ? '\n... (truncated)' : ''));
  console.log('=' .repeat(50));
  
  console.log('\n🔍 ANALYZING OPTION STRUCTURE:');
  
  // Look for option definitions
  const optionPattern = /\.add\w+Option\s*\(\s*option\s*=>\s*[\s\S]*?\.setRequired\s*\(\s*(true|false)\s*\)\s*\)/g;
  const options = [];
  let match;
  
  console.log('\n📋 FOUND OPTIONS:');
  
  while ((match = optionPattern.exec(content)) !== null) {
    const optionBlock = match[0];
    const isRequired = match[1] === 'true';
    
    // Extract option name
    const optionNameMatch = optionBlock.match(/\.setName\(['"`]([^'"`]+)['"`]\)/);
    const optionName = optionNameMatch ? optionNameMatch[1] : 'unknown';
    
    options.push({
      name: optionName,
      required: isRequired,
      block: optionBlock.substring(0, 100) + '...'
    });
    
    console.log(`${options.length}. ${optionName} - ${isRequired ? 'REQUIRED' : 'optional'}`);
  }
  
  if (options.length === 0) {
    console.log('⚪ No options found using regex pattern');
    
    // Try simpler pattern
    console.log('\n🔍 TRYING SIMPLER DETECTION:');
    
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (line.includes('.setRequired(')) {
        console.log(`Line ${index + 1}: ${line.trim()}`);
      }
    });
  } else {
    console.log(`\n📊 OPTION ORDER ANALYSIS:`);
    console.log(`Total options: ${options.length}`);
    
    if (options.length > 1) {
      let foundOptional = false;
      let hasOrderIssue = false;
      let issueCount = 0;
      
      options.forEach((opt, i) => {
        const status = opt.required ? 'REQUIRED' : 'optional';
        const position = i + 1;
        
        if (!opt.required) {
          foundOptional = true;
          console.log(`   ${position}. ${opt.name} (${status}) ✅`);
        } else if (opt.required && foundOptional) {
          hasOrderIssue = true;
          issueCount++;
          console.log(`   ${position}. ${opt.name} (${status}) ❌ ISSUE: Required after optional!`);
        } else {
          console.log(`   ${position}. ${opt.name} (${status}) ✅`);
        }
      });
      
      console.log(`\n🎯 RESULT:`);
      if (hasOrderIssue) {
        console.log(`❌ OPTION ORDER ISSUE CONFIRMED!`);
        console.log(`🚨 THIS IS CAUSING DISCORD API ERROR 50035!`);
        console.log(`📊 Issues found: ${issueCount} required options after optional ones`);
        
        // Generate fix
        const requiredOpts = options.filter(o => o.required);
        const optionalOpts = options.filter(o => !o.required);
        
        console.log(`\n🔧 CORRECT ORDER:`);
        console.log(`   Required options first (${requiredOpts.length}):`);
        requiredOpts.forEach((opt, i) => {
          console.log(`     ${i + 1}. ${opt.name}`);
        });
        console.log(`   Optional options last (${optionalOpts.length}):`);
        optionalOpts.forEach((opt, i) => {
          console.log(`     ${requiredOpts.length + i + 1}. ${opt.name}`);
        });
        
        // Create detailed fix instructions
        const fixInstructions = `
🔧 DETAILED FIX FOR test-command-order.js (Command #56)

PROBLEM: Required options come after optional options
SOLUTION: Reorder options in SlashCommandBuilder

CURRENT ORDER (CAUSING ERROR):
${options.map((opt, i) => `   ${i + 1}. ${opt.name} (${opt.required ? 'REQUIRED' : 'optional'})`).join('\n')}

CORRECT ORDER (WILL WORK):
${[...requiredOpts, ...optionalOpts].map((opt, i) => `   ${i + 1}. ${opt.name} (${opt.required ? 'REQUIRED' : 'optional'})`).join('\n')}

MANUAL FIX STEPS:
1. Open commands/test-command-order.js
2. Find the SlashCommandBuilder section
3. Locate all .addXxxOption() calls
4. Cut all options with .setRequired(true)
5. Paste them immediately after .setDescription()
6. Leave all .setRequired(false) options at the bottom
7. Save the file
8. Deploy: node deploy-commands.js

EXAMPLE FIX:
// ❌ BEFORE (Wrong order):
.setDescription('Test command')
.addStringOption(option => option.setName('optional1').setRequired(false))
.addStringOption(option => option.setName('required1').setRequired(true))

// ✅ AFTER (Correct order):
.setDescription('Test command')
.addStringOption(option => option.setName('required1').setRequired(true))
.addStringOption(option => option.setName('optional1').setRequired(false))

This fix will resolve Discord API Error 50035!
`;
        
        fs.writeFileSync('detailed-fix-command-56.txt', fixInstructions);
        console.log(`\n📝 Created: detailed-fix-command-56.txt`);
        console.log(`💡 This file contains step-by-step fix instructions`);
        
      } else {
        console.log(`✅ Option order is correct`);
        console.log(`💡 This command is not causing the error`);
      }
    } else {
      console.log(`⚪ Only 1 option found, no order issue possible`);
    }
  }
  
} catch (error) {
  console.log(`❌ Error reading file: ${error.message}`);
}

console.log(`\n🎯 COMMAND #56 ANALYSIS COMPLETED!`);
console.log(`📁 File: test-command-order.js`);
console.log(`🎮 This is the command causing Discord API Error 50035`);
console.log(`🔧 Fix the option order to resolve the deployment error`);