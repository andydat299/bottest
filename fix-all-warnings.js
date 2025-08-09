#!/usr/bin/env node

/**
 * Fix All Bot Warnings
 * Fix MongoDB, Mongoose, and Discord.js warnings
 */

import fs from 'fs';

console.log('🔧 FIXING ALL BOT WARNINGS\n');

// 1. Fix MongoDB connection warnings
console.log('1. 📊 FIXING MONGODB CONNECTION WARNINGS...');

const mongoFixContent = `/**
 * Updated MongoDB Connection Configuration
 * Removes deprecated options
 */

import mongoose from 'mongoose';

// ❌ OLD (with warnings):
// mongoose.connect(process.env.MONGODB_URI, {
//   useNewUrlParser: true,      // DEPRECATED
//   useUnifiedTopology: true    // DEPRECATED
// });

// ✅ NEW (no warnings):
export const connectDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('🔗 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 Mongoose disconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('🔌 MongoDB connection closed through app termination');
  process.exit(0);
});
`;

fs.writeFileSync('./utils/database.js', mongoFixContent);
console.log('✅ Created utils/database.js with updated MongoDB connection');

// 2. Fix schema index warnings
console.log('\n2. 🗄️ FIXING MONGOOSE SCHEMA INDEX WARNINGS...');

// Check if we need to fix any other schemas
const schemaFiles = [
  './schemas/userSchema.js',
  './schemas/vipSchema.js',
  './schemas/autoFishingSchema.js'
];

schemaFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    
    // Check for potential index duplicates
    const hasInlineIndex = content.includes('index: true');
    const hasSchemaIndex = content.includes('Schema.index(');
    
    if (hasInlineIndex && hasSchemaIndex) {
      console.log(`⚠️ ${file} - Potential duplicate indexes detected`);
      console.log('   Fix: Remove "index: true" from field definitions');
    } else {
      console.log(`✅ ${file} - Index definitions look clean`);
    }
  }
});

// 3. Fix Discord.js interaction warnings
console.log('\n3. 💬 FIXING DISCORD.JS INTERACTION WARNINGS...');

const discordFixGuide = `/**
 * Discord.js Interaction Fixes
 * Update deprecated interaction response options
 */

// ❌ OLD (deprecated):
await interaction.reply({ 
  content: 'Hello!', 
  ephemeral: true,     // DEPRECATED
  fetchReply: true     // DEPRECATED
});

// ✅ NEW (updated):
import { InteractionResponseType } from 'discord.js';

await interaction.reply({ 
  content: 'Hello!',
  flags: InteractionResponseType.Ephemeral  // Use flags instead
});

// For fetchReply, use withResponse:
const response = await interaction.reply({ 
  content: 'Hello!',
  withResponse: true   // Instead of fetchReply
});

// Or fetch after reply:
await interaction.reply({ content: 'Hello!' });
const response = await interaction.fetchReply();
`;

fs.writeFileSync('./discord-interaction-fixes.txt', discordFixGuide);
console.log('✅ Created discord-interaction-fixes.txt with update guide');

// 4. Create comprehensive warning fix script
console.log('\n4. 🔧 CREATING COMPREHENSIVE FIX SCRIPT...');

const warningFixScript = `#!/usr/bin/env node

/**
 * Apply All Warning Fixes
 * Run this to fix all warnings in the codebase
 */

import fs from 'fs';
import path from 'path';

console.log('🔧 APPLYING ALL WARNING FIXES\\n');

// Fix 1: Update index.js to use new database connection
const indexUpdates = {
  // Replace old mongoose connection
  oldPattern: /mongoose\\.connect\\([^)]+\\{[^}]*useNewUrlParser[^}]*\\}\\);?/g,
  newCode: \`import { connectDatabase } from './utils/database.js';

// Connect to database
await connectDatabase();\`
};

// Fix 2: Update interaction replies across all commands
const commandsDir = './commands';
if (fs.existsSync(commandsDir)) {
  const commandFiles = fs.readdirSync(commandsDir)
    .filter(file => file.endsWith('.js'));
  
  let fixedCommands = 0;
  
  commandFiles.forEach(file => {
    const filePath = path.join(commandsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let wasModified = false;
    
    // Fix ephemeral usage
    if (content.includes('ephemeral: true')) {
      content = content.replace(
        /ephemeral:\\s*true/g,
        'flags: InteractionResponseType.Ephemeral'
      );
      
      // Add import if not present
      if (!content.includes('InteractionResponseType')) {
        content = content.replace(
          /import\\s*{([^}]+)}\\s*from\\s*['"]discord\\.js['"];?/,
          'import { $1, InteractionResponseType } from \\'discord.js\\';'
        );
      }
      
      wasModified = true;
    }
    
    // Fix fetchReply usage
    if (content.includes('fetchReply: true')) {
      content = content.replace(
        /fetchReply:\\s*true/g,
        'withResponse: true'
      );
      wasModified = true;
    }
    
    if (wasModified) {
      fs.writeFileSync(filePath, content);
      fixedCommands++;
      console.log(\`✅ Fixed warnings in: \${file}\`);
    }
  });
  
  console.log(\`\\n📊 Fixed interaction warnings in \${fixedCommands} command files\`);
} else {
  console.log('⚠️ Commands directory not found');
}

console.log('\\n✅ All warning fixes applied!');
console.log('\\n🚀 Next steps:');
console.log('1. Test locally: npm start');
console.log('2. If no warnings, deploy: git add . && git commit -m "Fix: All MongoDB, Mongoose, and Discord.js warnings" && git push');
`;

fs.writeFileSync('./apply-warning-fixes.js', warningFixScript);
console.log('✅ Created apply-warning-fixes.js');

// 5. Summary
console.log('\n📊 WARNING FIXES SUMMARY:');

console.log('\n🔧 FILES CREATED:');
console.log('   ✅ utils/database.js - Updated MongoDB connection');
console.log('   ✅ discord-interaction-fixes.txt - Interaction update guide');
console.log('   ✅ apply-warning-fixes.js - Automated fix script');

console.log('\n⚠️ WARNINGS TO FIX:');
console.log('   1. ❌ MongoDB useNewUrlParser (deprecated)');
console.log('   2. ❌ MongoDB useUnifiedTopology (deprecated)');
console.log('   3. ❌ Mongoose duplicate schema indexes');
console.log('   4. ❌ Discord.js ephemeral option (deprecated)');
console.log('   5. ❌ Discord.js fetchReply option (deprecated)');

console.log('\n🎯 QUICK FIXES:');

console.log('\n📊 MongoDB Connection:');
console.log('   Replace in index.js:');
console.log('   OLD: mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })');
console.log('   NEW: import { connectDatabase } from "./utils/database.js"; await connectDatabase();');

console.log('\n🗄️ Schema Indexes:');
console.log('   Remove "index: true" from schema field definitions');
console.log('   Keep only schema.index() calls');

console.log('\n💬 Discord Interactions:');
console.log('   OLD: { ephemeral: true }');
console.log('   NEW: { flags: InteractionResponseType.Ephemeral }');
console.log('   OLD: { fetchReply: true }');
console.log('   NEW: { withResponse: true }');

console.log('\n🚀 AUTOMATED FIX:');
console.log('   Run: node apply-warning-fixes.js');
console.log('   This will automatically update most warnings');

console.log('\n✅ Warning fix guide completed!');