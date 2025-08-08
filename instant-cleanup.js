#!/usr/bin/env node

import { readdirSync, statSync, unlinkSync, readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧹 Instant cleanup - removing empty/stub files...');

let deleted = 0;

// Files to remove (debug/test commands that were stubbed)
const targetFiles = [
  'commands/debug-daily-system.js',
  'commands/fix-daily-system.js', 
  'commands/validate-daily-logic.js',
  'commands/test-daily-luck.js',
  'commands/test-user-notifications.js',
  'commands/bot-health-check.js',
  'commands/debug-bot-startup.js',
  'commands/test-qr.js',
  'commands/debug-qr-generation.js',
  'commands/debug-admin-channel.js',
  'commands/debug-withdraw.js'
];

// Remove specific stub files
for (const file of targetFiles) {
  const filePath = join(__dirname, file);
  try {
    if (statSync(filePath).isFile()) {
      const content = readFileSync(filePath, 'utf-8');
      // If file is stubbed or very small, delete it
      if (content.includes('// File đã bị xóa để làm nhẹ code') || 
          content.includes('// File đã bị xóa') ||
          content.trim().length < 150) {
        unlinkSync(filePath);
        console.log(`🗑️  Removed stub file: ${file}`);
        deleted++;
      }
    }
  } catch (error) {
    // File doesn't exist, skip
  }
}

function cleanDirectory(dirPath, dirName) {
  try {
    const items = readdirSync(dirPath);
    
    for (const item of items) {
      const itemPath = join(dirPath, item);
      const stat = statSync(itemPath);
      
      if (stat.isFile() && (item.endsWith('.js') || item.endsWith('.json'))) {
        try {
          const content = readFileSync(itemPath, 'utf-8');
          
          // Remove files that are empty, just comments, or stub files
          if (content.trim().length === 0 || 
              (content.includes('// File đã bị xóa') && content.trim().length < 200) ||
              content.match(/^\/\/ .+[\r\n]*$/)) {
            unlinkSync(itemPath);
            console.log(`🗑️  Deleted empty file: ${dirName}/${item}`);
            deleted++;
          }
        } catch (readError) {
          // Skip files that can't be read
        }
      }
    }
  } catch (error) {
    console.log(`⏭️  Directory not accessible: ${dirName}`);
  }
}

// Clean directories
const dirsToClean = [
  { path: 'commands', name: 'commands' },
  { path: 'events', name: 'events' },
  { path: 'utils', name: 'utils' },
  { path: 'schemas', name: 'schemas' },
  { path: 'config', name: 'config' }
];

for (const dir of dirsToClean) {
  const dirPath = join(__dirname, dir.path);
  
  try {
    if (statSync(dirPath).isDirectory()) {
      console.log(`📂 Cleaning: ${dir.name}`);
      cleanDirectory(dirPath, dir.name);
    }
  } catch (error) {
    console.log(`⏭️  Directory not found: ${dir.name}`);
  }
}

// Clean root files
console.log('📂 Cleaning root directory...');
try {
  const rootItems = readdirSync(__dirname);
  
  for (const item of rootItems) {
    if (item.endsWith('.js') && 
        item !== 'instant-cleanup.js' && 
        item !== 'index.js' && 
        item !== 'deploy-commands.js' &&
        !item.includes('cleanup')) {
      
      const itemPath = join(__dirname, item);
      
      try {
        const content = readFileSync(itemPath, 'utf-8');
        
        if (content.trim().length === 0 || 
            (content.includes('// File đã bị xóa') && content.trim().length < 200)) {
          unlinkSync(itemPath);
          console.log(`🗑️  Deleted root file: ${item}`);
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

// Summary
console.log(`\n✅ Cleanup completed! Deleted ${deleted} files.`);

if (deleted === 0) {
  console.log('✨ No files to clean - codebase is already clean!');
} else {
  console.log('🎯 Codebase is now lighter and cleaner!');
}

// List core files
console.log('\n📋 Essential files remaining:');
try {
  const commands = readdirSync(join(__dirname, 'commands')).filter(f => f.endsWith('.js'));
  const coreCommands = commands.filter(f => 
    !f.includes('debug') && 
    !f.includes('test') && 
    !f.startsWith('temp-')
  );
  
  console.log(`📂 commands: ${coreCommands.length} core files`);
  console.log('   Core commands:', coreCommands.slice(0, 8).join(', '));
  if (coreCommands.length > 8) {
    console.log(`   ... and ${coreCommands.length - 8} more`);
  }
} catch (error) {
  console.log('📂 commands: directory not accessible');
}

console.log('\n🚀 Ready for production!');