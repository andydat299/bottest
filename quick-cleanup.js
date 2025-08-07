#!/usr/bin/env node

import { readdirSync, statSync, unlinkSync, readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Quick cleanup - removing completely empty files...');

let deleted = 0;

function quickCleanDirectory(dirPath) {
  try {
    const items = readdirSync(dirPath);
    
    for (const item of items) {
      const itemPath = join(dirPath, item);
      const stat = statSync(itemPath);
      
      if (stat.isFile() && (item.endsWith('.js') || item.endsWith('.json'))) {
        try {
          const content = readFileSync(itemPath, 'utf-8');
          
          // Only delete completely empty files (0 bytes or only whitespace)
          if (content.trim().length === 0) {
            unlinkSync(itemPath);
            console.log(`🗑️  Deleted empty file: ${itemPath}`);
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
    if (item.endsWith('.js')) {
      const itemPath = join(__dirname, item);
      
      try {
        const content = readFileSync(itemPath, 'utf-8');
        
        if (content.trim().length === 0) {
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

console.log(`\n✅ Quick cleanup completed! Deleted ${deleted} completely empty files.`);

if (deleted === 0) {
  console.log('✨ No empty files found!');
}