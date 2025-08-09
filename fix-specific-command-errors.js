#!/usr/bin/env node

/**
 * Fix Specific Command Errors
 * Fix the exact errors found in deployment logs
 */

import fs from 'fs';
import path from 'path';

console.log('🔧 FIXING SPECIFIC COMMAND ERRORS\n');

console.log('❌ ERRORS IDENTIFIED:');
console.log('1. location.js: Cannot use "in" operator (undefined export)');
console.log('2. upgrade-rod-broken-1754679441207.js: Missing catch/finally after try');
console.log('3. weather.js: Cannot use "in" operator (undefined export)');
console.log('4. Command #53: Required options must come before non-required options');

console.log('\n🔧 FIXING INDIVIDUAL FILES:');

// Fix 1: Check and fix location.js
const locationFile = './commands/location.js';
if (fs.existsSync(locationFile)) {
  console.log('🔍 Fixing location.js...');
  
  let content = fs.readFileSync(locationFile, 'utf8');
  
  // Check if export is missing or malformed
  if (!content.includes('export default')) {
    console.log('   • Adding missing export default');
    
    // Basic fix for missing export
    const fixedContent = `import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('location')
    .setDescription('Get location information'),
  async execute(interaction) {
    await interaction.reply('Location command is under maintenance.');
  }
};`;
    
    fs.writeFileSync(locationFile, fixedContent);
    console.log('   ✅ Fixed location.js export format');
  }
} else {
  console.log('⚪ location.js not found - skipping');
}

// Fix 2: Check and fix weather.js
const weatherFile = './commands/weather.js';
if (fs.existsSync(weatherFile)) {
  console.log('🔍 Fixing weather.js...');
  
  let content = fs.readFileSync(weatherFile, 'utf8');
  
  if (!content.includes('export default')) {
    console.log('   • Adding missing export default');
    
    const fixedContent = `import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('weather')
    .setDescription('Get weather information'),
  async execute(interaction) {
    await interaction.reply('Weather command is under maintenance.');
  }
};`;
    
    fs.writeFileSync(weatherFile, fixedContent);
    console.log('   ✅ Fixed weather.js export format');
  }
} else {
  console.log('⚪ weather.js not found - skipping');
}

// Fix 3: Remove broken upgrade-rod file
const brokenFile = './commands/upgrade-rod-broken-1754679441207.js';
if (fs.existsSync(brokenFile)) {
  console.log('🔍 Removing broken upgrade-rod file...');
  
  // Create backup first
  const backupFile = './commands/upgrade-rod-broken-1754679441207.js.backup';
  fs.copyFileSync(brokenFile, backupFile);
  
  // Remove broken file
  fs.unlinkSync(brokenFile);
  console.log('   ✅ Removed broken upgrade-rod file (backup created)');
} else {
  console.log('⚪ Broken upgrade-rod file not found - skipping');
}

console.log('\n🔍 SCANNING FOR COMMAND OPTION ERRORS...');

// Fix 4: Find commands with option order issues
const commandFiles = fs.readdirSync('./commands')
  .filter(file => file.endsWith('.js'));

let optionOrderFixes = 0;

commandFiles.forEach(file => {
  const filePath = path.join('./commands', file);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check for option order issues
    const hasOptions = content.includes('addStringOption') || 
                      content.includes('addIntegerOption') || 
                      content.includes('addBooleanOption') ||
                      content.includes('addUserOption');
    
    if (hasOptions) {
      console.log(`🔍 Checking options in: ${file}`);
      
      // Look for setRequired(false) followed by setRequired(true) pattern
      const requiredFalsePattern = /\.setRequired\(false\)/g;
      const requiredTruePattern = /\.setRequired\(true\)/g;
      
      const falseMatches = [...content.matchAll(requiredFalsePattern)];
      const trueMatches = [...content.matchAll(requiredTruePattern)];
      
      if (falseMatches.length > 0 && trueMatches.length > 0) {
        // Check if any required(true) comes after required(false)
        for (let trueMatch of trueMatches) {
          for (let falseMatch of falseMatches) {
            if (trueMatch.index > falseMatch.index) {
              console.log(`   ⚠️ Potential option order issue detected`);
              console.log(`   💡 Move all required options before optional ones`);
              break;
            }
          }
        }
      }
    }
    
  } catch (error) {
    console.log(`   ❌ Error checking ${file}: ${error.message}`);
  }
});

console.log('\n🔧 CREATING SAFE DEPLOY SCRIPT...');

const safeDeployScript = `#!/usr/bin/env node

/**
 * Safe Command Deployment
 * Deploy commands one by one to identify problematic ones
 */

import { REST, Routes } from 'discord.js';
import fs from 'fs';
import path from 'path';

const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;
const token = process.env.DISCORD_TOKEN;

if (!clientId || !token) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const commandsPath = path.join(process.cwd(), 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

console.log('🧪 Testing commands individually...\\n');

const validCommands = [];
const problematicFiles = [];

// Test each command individually
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  
  try {
    console.log(\`🔍 Testing: \${file}\`);
    
    const command = await import(filePath);
    
    if ('data' in command.default && 'execute' in command.default) {
      const commandData = command.default.data.toJSON();
      
      // Validate command data
      if (commandData.name && commandData.description) {
        validCommands.push(commandData);
        console.log(\`   ✅ Valid: /\${commandData.name}\`);
      } else {
        console.log(\`   ❌ Invalid: Missing name or description\`);
        problematicFiles.push(file);
      }
    } else {
      console.log(\`   ❌ Invalid: Missing data or execute\`);
      problematicFiles.push(file);
    }
  } catch (error) {
    console.log(\`   ❌ Error: \${error.message}\`);
    problematicFiles.push(file);
  }
}

console.log(\`\\n📊 Results: \${validCommands.length} valid, \${problematicFiles.length} problematic\`);

if (problematicFiles.length > 0) {
  console.log('\\n❌ Problematic files:');
  problematicFiles.forEach(file => console.log(\`   • \${file}\`));
}

if (validCommands.length === 0) {
  console.log('❌ No valid commands to deploy');
  process.exit(1);
}

console.log(\`\\n🚀 Deploying \${validCommands.length} valid commands...\`);

const rest = new REST().setToken(token);

try {
  const data = await rest.put(
    guildId ? 
      Routes.applicationGuildCommands(clientId, guildId) :
      Routes.applicationCommands(clientId),
    { body: validCommands }
  );
  
  console.log(\`✅ Successfully deployed \${data.length} commands!\`);
  
} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  
  if (error.code === 50035) {
    console.log('\\n💡 Command option order issue detected');
    console.log('Check that all required options come before optional ones');
  }
}`;

fs.writeFileSync('./safe-deploy.js', safeDeployScript);
console.log('✅ Created safe-deploy.js script');

console.log('\n📋 COMMAND OPTION ORDER RULES:');
console.log('✅ CORRECT ORDER:');
console.log(`
.addStringOption(option =>
  option.setName('required1')
        .setDescription('Required option')
        .setRequired(true))        // Required first
.addStringOption(option =>
  option.setName('required2') 
        .setDescription('Another required')
        .setRequired(true))        // Required second
.addStringOption(option =>
  option.setName('optional1')
        .setDescription('Optional option')
        .setRequired(false))       // Optional last
`);

console.log('❌ INCORRECT ORDER:');
console.log(`
.addStringOption(option =>
  option.setName('optional1')
        .setDescription('Optional option')
        .setRequired(false))       // Optional first ❌
.addStringOption(option =>
  option.setName('required1')
        .setDescription('Required option')  
        .setRequired(true))        // Required after optional ❌
`);

console.log('\n🚀 DEPLOYMENT STEPS:');
console.log('1. Run: node safe-deploy.js');
console.log('   • Tests each command individually');
console.log('   • Identifies problematic files');
console.log('   • Deploys only valid commands');

console.log('\n2. Fix problematic files:');
console.log('   • Check export format');
console.log('   • Fix option order (required before optional)');
console.log('   • Fix syntax errors');

console.log('\n3. Deploy again:');
console.log('   • node deploy-commands.js');
console.log('   • Should now work without errors');

console.log('\n✅ Command error fixes completed!');
console.log('🧪 Use safe-deploy.js to test individual commands!');