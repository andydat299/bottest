#!/usr/bin/env node

// Simple startup checker
console.log('🔍 Pre-flight checks...');

// Check Node.js version
const nodeVersion = process.version;
console.log(`📦 Node.js version: ${nodeVersion}`);

if (parseInt(nodeVersion.slice(1).split('.')[0]) < 16) {
  console.error('❌ Node.js 16+ required');
  process.exit(1);
}

// Check environment variables
const requiredEnvs = ['TOKEN', 'MONGODB_URI', 'CLIENT_ID'];
const missingEnvs = [];

for (const env of requiredEnvs) {
  if (!process.env[env]) {
    missingEnvs.push(env);
  } else {
    console.log(`✅ ${env}: Set`);
  }
}

if (missingEnvs.length > 0) {
  console.error('❌ Missing environment variables:', missingEnvs);
  process.exit(1);
}

// Check critical files
import { existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const criticalFiles = [
  'config/database.js',
  'events/interactionCreate.js',
  'schemas/userSchema.js',
  'utils/adminUtils.js'
];

for (const file of criticalFiles) {
  const filePath = join(__dirname, file);
  if (existsSync(filePath)) {
    console.log(`✅ ${file}: Found`);
  } else {
    console.error(`❌ ${file}: Missing`);
    process.exit(1);
  }
}

// Test basic imports
try {
  console.log('🧪 Testing imports...');
  
  const { Client } = await import('discord.js');
  console.log('✅ Discord.js: OK');
  
  const mongoose = await import('mongoose');
  console.log('✅ Mongoose: OK');
  
  console.log('✅ All pre-flight checks passed!');
  console.log('🚀 Starting main bot...');
  
  // Import and run main bot
  await import('./index.js');
  
} catch (error) {
  console.error('❌ Import test failed:', error.message);
  console.error('❌ Stack:', error.stack);
  process.exit(1);
}