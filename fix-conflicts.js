#!/usr/bin/env node

import { unlinkSync, readFileSync, statSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔧 Fixing export conflicts and duplicate exports...');

// Fix duplicate export in interactionCreate.js
const interactionFile = join(__dirname, 'events', 'interactionCreate.js');
const newInteractionFile = join(__dirname, 'events', 'interactionCreateNew.js');

try {
  if (statSync(newInteractionFile).isFile()) {
    const newContent = readFileSync(newInteractionFile, 'utf-8');
    
    // Replace old file with new clean version
    writeFileSync(interactionFile, newContent, 'utf-8');
    console.log('✅ Fixed interactionCreate.js - replaced with clean version');
    
    // Remove backup file
    unlinkSync(newInteractionFile);
    console.log('🗑️  Removed interactionCreateNew.js backup');
  }
} catch (error) {
  console.log('⚠️  Could not fix interactionCreate.js:', error.message);
}

// Remove conflicting gameInteractionCreate.js
const conflictFile = join(__dirname, 'events', 'gameInteractionCreate.js');
try {
  const content = readFileSync(conflictFile, 'utf-8');
  if (content.includes('// File đã bị xóa để fix conflict')) {
    unlinkSync(conflictFile);
    console.log('🗑️  Removed conflicting gameInteractionCreate.js');
  }
} catch (error) {
  console.log('⏭️  gameInteractionCreate.js already cleaned');
}

// Remove userSchemaNew.js after backing up content
const newSchemaFile = join(__dirname, 'schemas', 'userSchemaNew.js');
try {
  if (statSync(newSchemaFile).isFile()) {
    const newContent = readFileSync(newSchemaFile, 'utf-8');
    
    // Check if we can update the original schema
    const originalSchemaFile = join(__dirname, 'schemas', 'userSchema.js');
    try {
      const originalContent = readFileSync(originalSchemaFile, 'utf-8');
      
      // If original doesn't have fishingLuck, this means we need manual update
      if (!originalContent.includes('fishingLuck')) {
        console.log('📝 Original userSchema.js needs manual update to include fishingLuck field');
        console.log('⚠️  Please add the fishingLuck field from userSchemaNew.js');
      }
      
      // Remove the backup file
      unlinkSync(newSchemaFile);
      console.log('🗑️  Removed userSchemaNew.js backup');
      
    } catch (originalError) {
      console.log('⚠️  Could not read original userSchema.js');
    }
  }
} catch (error) {
  console.log('⏭️  userSchemaNew.js not found');
}

console.log('✅ Export conflict fixes completed!');
console.log('');
console.log('📋 Next steps:');
console.log('1. Run: npm run deploy');
console.log('2. Run: npm start');
console.log('3. Test commands: /fishing-luck, /game-panel');
console.log('4. If userSchema needs fishingLuck field, add it manually');