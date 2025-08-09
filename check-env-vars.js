#!/usr/bin/env node

/**
 * Check Environment Variables for Command Deployment
 * Verify all required variables are set
 */

import fs from 'fs';

console.log('🔍 ENVIRONMENT VARIABLES CHECK\n');

// Check if .env file exists
const envFile = './.env';
if (fs.existsSync(envFile)) {
  console.log('📄 Found .env file locally');
  const envContent = fs.readFileSync(envFile, 'utf8');
  console.log('   Variables in .env:', envContent.split('\n').filter(line => line.includes('=')).length);
} else {
  console.log('📄 No .env file found (using system environment or Railway variables)');
}

console.log('\n🔧 REQUIRED VARIABLES FOR COMMAND DEPLOYMENT:');

const requiredVars = [
  {
    name: 'CLIENT_ID',
    value: process.env.CLIENT_ID,
    description: 'Your Discord bot Application ID',
    where: 'Discord Developer Portal → Your App → General Information'
  },
  {
    name: 'DISCORD_TOKEN', 
    value: process.env.DISCORD_TOKEN,
    description: 'Your Discord bot token',
    where: 'Discord Developer Portal → Your App → Bot → Token'
  }
];

const optionalVars = [
  {
    name: 'GUILD_ID',
    value: process.env.GUILD_ID,
    description: 'Your Discord server ID (for faster testing)',
    where: 'Discord → Right-click server → Copy Server ID'
  }
];

console.log('\n📋 REQUIRED VARIABLES:');
let missingRequired = 0;

requiredVars.forEach(variable => {
  const status = variable.value ? '✅ Set' : '❌ Missing';
  const preview = variable.value ? `(${variable.value.substring(0, 10)}...)` : '';
  
  console.log(`${variable.name.padEnd(15)} | ${status} ${preview}`);
  console.log(`${' '.repeat(15)} | ${variable.description}`);
  console.log(`${' '.repeat(15)} | Where: ${variable.where}`);
  console.log('');
  
  if (!variable.value) missingRequired++;
});

console.log('📋 OPTIONAL VARIABLES:');
optionalVars.forEach(variable => {
  const status = variable.value ? '✅ Set' : '⚪ Not set';
  const preview = variable.value ? `(${variable.value})` : '';
  
  console.log(`${variable.name.padEnd(15)} | ${status} ${preview}`);
  console.log(`${' '.repeat(15)} | ${variable.description}`);
  console.log(`${' '.repeat(15)} | Where: ${variable.where}`);
  console.log('');
});

console.log('📊 SUMMARY:');
if (missingRequired === 0) {
  console.log('✅ All required environment variables are set!');
  console.log('🚀 You can proceed with command deployment');
} else {
  console.log(`❌ Missing ${missingRequired} required environment variables`);
  console.log('🔧 Add missing variables before deploying commands');
}

console.log('\n🛠️ HOW TO SET ENVIRONMENT VARIABLES:');

console.log('\n📝 LOCAL DEVELOPMENT (.env file):');
console.log('CLIENT_ID=your_application_id_here');
console.log('DISCORD_TOKEN=your_bot_token_here');
console.log('GUILD_ID=your_server_id_here');

console.log('\n🚂 RAILWAY DEPLOYMENT:');
console.log('1. Go to Railway dashboard');
console.log('2. Click your project');
console.log('3. Go to "Variables" tab');
console.log('4. Add variables:');
console.log('   • CLIENT_ID');
console.log('   • DISCORD_TOKEN');
console.log('   • GUILD_ID (optional)');

console.log('\n💡 HOW TO GET THESE VALUES:');

console.log('\n🔍 CLIENT_ID:');
console.log('1. Go to https://discord.com/developers/applications');
console.log('2. Click your bot application');
console.log('3. Go to "General Information"');
console.log('4. Copy "Application ID"');

console.log('\n🔍 DISCORD_TOKEN:');
console.log('1. Same Discord Developer Portal');
console.log('2. Go to "Bot" section');
console.log('3. Click "Reset Token" if needed');
console.log('4. Copy the token (keep it secret!)');

console.log('\n🔍 GUILD_ID (optional but recommended for testing):');
console.log('1. In Discord, enable Developer Mode (User Settings → Advanced)');
console.log('2. Right-click your server name');
console.log('3. Click "Copy Server ID"');

console.log('\n🚀 DEPLOYMENT COMMANDS:');
if (missingRequired === 0) {
  console.log('✅ Ready to deploy! Run:');
  console.log('');
  if (process.env.GUILD_ID) {
    console.log('# Deploy to your guild (fast):');
    console.log('node deploy-commands.js');
  } else {
    console.log('# Deploy to guild (fast, for testing):');
    console.log('GUILD_ID=your_server_id node deploy-commands.js');
    console.log('');
    console.log('# Deploy globally (slow, for production):');
    console.log('node deploy-commands.js');
  }
} else {
  console.log('❌ Set missing environment variables first, then run:');
  console.log('node deploy-commands.js');
}

console.log('\n✅ Environment check completed!');