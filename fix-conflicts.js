#!/usr/bin/env node

import { unlinkSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔧 Fixing export conflicts and cleaning up...');

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

console.log('✅ Conflict cleanup completed!');
console.log('');
console.log('📋 Next steps:');
console.log('1. Manually add fishingLuck field to schemas/userSchema.js if needed');
console.log('2. Deploy commands: npm run deploy');
console.log('3. Test fishing-luck command: /fishing-luck user:@someone');
console.log('4. Test game panel: /game-panel');