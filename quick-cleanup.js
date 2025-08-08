#!/usr/bin/env node

import { readdirSync, statSync, unlinkSync, readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Quick cleanup - removing debug/test files and empty files...');

let deleted = 0;

// Files to remove (debug/test commands)
const filesToRemove = [
  'commands/debug-daily-system.js',
  'commands/fix-daily-system.js', 
  'commands/validate-daily-logic.js',
  'commands/test-daily-luck.js',
  'commands/test-user-notifications.js',
  'commands/bot-health-check.js',
  'commands/debug-bot-startup.js',
  'commands/test-qr.js',
  'commands/debug-qr-generation.js'
];

// Remove specific debug files
for (const file of filesToRemove) {
  const filePath = join(__dirname, file);
  try {
    if (statSync(filePath).isFile()) {
      const content = readFileSync(filePath, 'utf-8');
      if (content.includes('// File đã bị xóa để làm nhẹ code') || content.trim().length < 100) {
        unlinkSync(filePath);
        console.log(`🗑️  Removed debug file: ${file}`);
        deleted++;
      }
    }
  } catch (error) {
    // File doesn't exist, skip
  }
}

function quickCleanDirectory(dirPath) {
  try {
    const items = readdirSync(dirPath);
    
    for (const item of items) {
      const itemPath = join(dirPath, item);
      const stat = statSync(itemPath);
      
      if (stat.isFile() && (item.endsWith('.js') || item.endsWith('.json'))) {
        try {
          const content = readFileSync(itemPath, 'utf-8');
          
          // Remove files that are just comments or empty
          if (content.trim().length === 0 || 
              (content.includes('// File đã bị xóa') && content.trim().length < 100)) {
            unlinkSync(itemPath);
            console.log(`🗑️  Deleted empty/stub file: ${itemPath}`);
            deleted++;
          }
        } catch (readError) {
          console.error(`❌ Error reading ${itemPath}:`, readError.message);
        }
      } else if (stat.isDirectory() && !item.startsWith('.')) {
        quickCleanDirectory(itemPath);
      }
    }
  } catch (error) {
    console.error(`❌ Error scanning ${dirPath}:`, error.message);
  }
}

// Clean specific directories
const dirsToClean = ['commands', 'events', 'utils', 'schemas', 'config'];

for (const dir of dirsToClean) {
  const dirPath = join(__dirname, dir);
  
  try {
    if (statSync(dirPath).isDirectory()) {
      console.log(`📂 Cleaning: ${dir}`);
      quickCleanDirectory(dirPath);
    }
  } catch (error) {
    console.log(`⏭️  Directory not found: ${dir}`);
  }
}

// Clean root directory JS files
try {
  const rootItems = readdirSync(__dirname);
  
  for (const item of rootItems) {
    if (item.endsWith('.js') && item !== 'quick-cleanup.js' && item !== 'index.js') {
      const itemPath = join(__dirname, item);
      
      try {
        const content = readFileSync(itemPath, 'utf-8');
        
        if (content.trim().length === 0 || 
            (content.includes('// File đã bị xóa') && content.trim().length < 100)) {
          unlinkSync(itemPath);
          console.log(`🗑️  Deleted empty root file: ${itemPath}`);
          deleted++;
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }
  }
} catch (error) {
  console.error('❌ Error cleaning root:', error.message);
}

console.log(`\n✅ Cleanup completed! Deleted ${deleted} debug/empty files.`);

if (deleted === 0) {
  console.log('✨ No files to clean!');
} else {
  console.log('🎯 Code is now lighter and cleaner!');
}

// List remaining important files
console.log('\n📋 Core commands remaining:');
try {
  const commands = readdirSync(join(__dirname, 'commands')).filter(f => f.endsWith('.js'));
  const coreCommands = commands.filter(f => !f.includes('debug') && !f.includes('test'));
  console.log(`📂 commands: ${coreCommands.length} files`);
  coreCommands.slice(0, 10).forEach(f => console.log(`   - ${f}`));
  if (coreCommands.length > 10) {
    console.log(`   ... and ${coreCommands.length - 10} more`);
  }
} catch (error) {
  console.log('📂 commands: directory not accessible');
}