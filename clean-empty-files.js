#!/usr/bin/env node

/**
 * Clean Empty Files Script
 * Finds and removes all empty files in the project
 */

import fs from 'fs';
import path from 'path';

console.log('🧹 CLEANING EMPTY FILES\n');

// Directories to scan
const directoriesToScan = [
  './commands',
  './utils',
  './schemas',
  './scripts',
  './'
];

// File extensions to check
const fileExtensions = ['.js', '.json', '.md', '.txt', '.log'];

let emptyFilesFound = [];
let totalFilesScanned = 0;

function scanDirectory(dirPath, depth = 0) {
  try {
    if (!fs.existsSync(dirPath)) {
      console.log(`⚠️ Directory not found: ${dirPath}`);
      return;
    }

    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip node_modules and .git directories
        if (item !== 'node_modules' && item !== '.git' && item !== '.vscode' && depth < 3) {
          scanDirectory(fullPath, depth + 1);
        }
      } else if (stat.isFile()) {
        totalFilesScanned++;
        
        // Check if file has relevant extension
        const ext = path.extname(fullPath);
        if (fileExtensions.includes(ext)) {
          
          // Check if file is empty
          const fileSize = stat.size;
          if (fileSize === 0) {
            emptyFilesFound.push({
              path: fullPath,
              name: item,
              dir: dirPath
            });
          } else {
            // Check if file only contains whitespace
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.trim().length === 0) {
              emptyFilesFound.push({
                path: fullPath,
                name: item,
                dir: dirPath,
                whitespaceOnly: true
              });
            }
          }
        }
      }
    }
  } catch (error) {
    console.log(`❌ Error scanning ${dirPath}: ${error.message}`);
  }
}

// Scan all directories
console.log('🔍 Scanning directories for empty files...\n');

for (const dir of directoriesToScan) {
  console.log(`📁 Scanning: ${dir}`);
  scanDirectory(dir);
}

console.log(`\n📊 Scan Results:`);
console.log(`   Total files scanned: ${totalFilesScanned}`);
console.log(`   Empty files found: ${emptyFilesFound.length}\n`);

if (emptyFilesFound.length === 0) {
  console.log('✅ No empty files found! Project is clean.');
} else {
  console.log('🗑️ Empty files found:\n');
  
  emptyFilesFound.forEach((file, index) => {
    const indicator = file.whitespaceOnly ? '📄' : '📋';
    const type = file.whitespaceOnly ? '(whitespace only)' : '(completely empty)';
    console.log(`${indicator} ${index + 1}. ${file.path} ${type}`);
  });
  
  console.log('\n🗑️ Removing empty files...\n');
  
  let removedCount = 0;
  let failedCount = 0;
  
  for (const file of emptyFilesFound) {
    try {
      fs.unlinkSync(file.path);
      console.log(`✅ Removed: ${file.path}`);
      removedCount++;
    } catch (error) {
      console.log(`❌ Failed to remove ${file.path}: ${error.message}`);
      failedCount++;
    }
  }
  
  console.log(`\n📊 Cleanup Results:`);
  console.log(`   ✅ Successfully removed: ${removedCount} files`);
  console.log(`   ❌ Failed to remove: ${failedCount} files`);
  
  if (removedCount > 0) {
    console.log('\n🎉 Empty files cleanup completed!');
  }
}

// Additional cleanup - check for specific problematic files
console.log('\n🔧 Checking for specific problematic files...');

const problematicFiles = [
  './commands/eval-public.js',
  './commands/temp-eval.js',
  './commands/test-eval.js',
  './scripts/temp.js',
  './temp.js',
  './test.js'
];

let additionalRemoved = 0;

for (const filePath of problematicFiles) {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check if file contains only disabled content
      if (content.includes('THIS FILE HAS BEEN DISABLED') || 
          content.includes('export default null') ||
          content.trim().length < 50) {
        
        fs.unlinkSync(filePath);
        console.log(`🗑️ Removed problematic file: ${filePath}`);
        additionalRemoved++;
      }
    }
  } catch (error) {
    console.log(`⚠️ Could not check ${filePath}: ${error.message}`);
  }
}

if (additionalRemoved > 0) {
  console.log(`✅ Removed ${additionalRemoved} additional problematic files`);
}

console.log('\n🧹 File cleanup completed!');
console.log('📋 Remaining files are functional and contain content.');
console.log('🚀 Project is now clean and optimized!');

// Show remaining file structure
console.log('\n📁 Current project structure:');
try {
  const commands = fs.readdirSync('./commands').filter(f => f.endsWith('.js'));
  const utils = fs.existsSync('./utils') ? fs.readdirSync('./utils').filter(f => f.endsWith('.js')) : [];
  
  console.log(`   Commands: ${commands.length} files`);
  console.log(`   Utils: ${utils.length} files`);
  
  commands.forEach(cmd => console.log(`     📄 ${cmd}`));
  if (utils.length > 0) {
    utils.forEach(util => console.log(`     🛠️ ${util}`));
  }
} catch (error) {
  console.log('📁 Could not display structure');
}

console.log('\n✅ Cleanup script completed!');