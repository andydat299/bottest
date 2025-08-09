#!/usr/bin/env node

/**
 * Safe Command Deployment
 * Deploy commands one by one to identify problematic ones
 */

import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import fs from 'fs';
import path from 'path';

const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;
const token = process.env.DISCORD_TOKEN;

if (!clientId || !token) {
  console.error('❌ Missing environment variables');
  console.error('   CLIENT_ID:', clientId ? '✅ Set' : '❌ Missing');
  console.error('   DISCORD_TOKEN:', token ? '✅ Set' : '❌ Missing');
  process.exit(1);
}

const commandsPath = path.join(process.cwd(), 'commands');

if (!fs.existsSync(commandsPath)) {
  console.error('❌ Commands directory not found');
  process.exit(1);
}

const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

console.log(`🧪 Testing ${commandFiles.length} commands individually...\n`);

const validCommands = [];
const problematicFiles = [];

// Test each command individually
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  
  try {
    console.log(`🔍 Testing: ${file}`);
    
    const command = await import(filePath);
    
    // Check if command has proper structure
    if (!command.default) {
      console.log(`   ❌ No default export`);
      problematicFiles.push({ file, error: 'No default export' });
      continue;
    }
    
    if (!('data' in command.default)) {
      console.log(`   ❌ Missing 'data' property`);
      problematicFiles.push({ file, error: 'Missing data property' });
      continue;
    }
    
    if (!('execute' in command.default)) {
      console.log(`   ❌ Missing 'execute' function`);
      problematicFiles.push({ file, error: 'Missing execute function' });
      continue;
    }
    
    // Try to convert to JSON (this will catch SlashCommandBuilder issues)
    const commandData = command.default.data.toJSON();
    
    // Validate command data structure
    if (!commandData.name) {
      console.log(`   ❌ Missing command name`);
      problematicFiles.push({ file, error: 'Missing command name' });
      continue;
    }
    
    if (!commandData.description) {
      console.log(`   ❌ Missing command description`);
      problematicFiles.push({ file, error: 'Missing command description' });
      continue;
    }
    
    // Check name format
    if (!/^[a-z0-9_-]+$/.test(commandData.name)) {
      console.log(`   ❌ Invalid name format: "${commandData.name}"`);
      problematicFiles.push({ file, error: `Invalid name format: ${commandData.name}` });
      continue;
    }
    
    // Check description length
    if (commandData.description.length > 100) {
      console.log(`   ❌ Description too long: ${commandData.description.length} chars`);
      problematicFiles.push({ file, error: `Description too long: ${commandData.description.length} chars` });
      continue;
    }
    
    // Check option order if options exist
    if (commandData.options && commandData.options.length > 0) {
      let foundOptional = false;
      let hasOrderIssue = false;
      
      for (const option of commandData.options) {
        if (option.required === false || option.required === undefined) {
          foundOptional = true;
        } else if (option.required === true && foundOptional) {
          hasOrderIssue = true;
          break;
        }
      }
      
      if (hasOrderIssue) {
        console.log(`   ❌ Option order issue: Required options must come before optional ones`);
        problematicFiles.push({ file, error: 'Required options after optional ones' });
        continue;
      }
    }
    
    validCommands.push(commandData);
    console.log(`   ✅ Valid: /${commandData.name} - ${commandData.description.substring(0, 50)}${commandData.description.length > 50 ? '...' : ''}`);
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    problematicFiles.push({ file, error: error.message });
  }
}

console.log(`\n📊 SCAN RESULTS:`);
console.log(`✅ Valid commands: ${validCommands.length}`);
console.log(`❌ Problematic files: ${problematicFiles.length}`);

if (problematicFiles.length > 0) {
  console.log('\n❌ PROBLEMATIC FILES:');
  problematicFiles.forEach(item => {
    console.log(`   • ${item.file}: ${item.error}`);
  });
  
  console.log('\n🔧 FIXES NEEDED:');
  console.log('1. Fix export format: export default { data, execute }');
  console.log('2. Fix command names: lowercase, no spaces, 1-32 chars');
  console.log('3. Fix descriptions: 1-100 characters');
  console.log('4. Fix option order: all required options before optional ones');
  console.log('5. Fix syntax errors in files');
}

if (validCommands.length === 0) {
  console.log('\n❌ No valid commands to deploy');
  process.exit(1);
}

console.log(`\n🚀 Deploying ${validCommands.length} valid commands...`);

const rest = new REST().setToken(token);

try {
  const data = await rest.put(
    guildId ? 
      Routes.applicationGuildCommands(clientId, guildId) :
      Routes.applicationCommands(clientId),
    { body: validCommands }
  );
  
  console.log(`\n✅ Successfully deployed ${data.length} commands!`);
  
  console.log('\n📋 Deployed commands:');
  data.forEach(cmd => {
    console.log(`   • /${cmd.name} - ${cmd.description}`);
  });
  
  if (problematicFiles.length > 0) {
    console.log(`\n⚠️ Note: ${problematicFiles.length} commands were skipped due to errors`);
    console.log('Fix the issues above and run deployment again to include them');
  }
  
} catch (error) {
  console.error('\n❌ Deployment failed:', error.message);
  
  if (error.code === 50035) {
    console.log('\n💡 API Error 50035: Invalid Form Body');
    console.log('This usually means:');
    console.log('• Command option order issue (required before optional)');
    console.log('• Invalid command name or description format');
    console.log('• Missing required fields in command data');
    
    console.log('\n🔍 Check the individual command validation above');
  } else if (error.code === 50001) {
    console.log('\n💡 API Error 50001: Missing Access');
    console.log('• Check CLIENT_ID is correct');
    console.log('• Verify bot has applications.commands scope');
  }
  
  process.exit(1);
}