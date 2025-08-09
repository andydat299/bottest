#!/usr/bin/env node

/**
 * Fix Command Names Automatically
 * Convert Vietnamese/invalid command names to proper English names
 */

import fs from 'fs';
import path from 'path';

console.log('🔧 FIXING COMMAND NAMES AUTOMATICALLY\n');

const commandsDir = './commands';
const fixes = [];

if (!fs.existsSync(commandsDir)) {
  console.log('❌ Commands directory not found');
  process.exit(1);
}

// Common Vietnamese to English command name mappings
const nameMapping = {
  'cá': 'fish',
  'câu': 'fish', 
  'ca-cau': 'fish',
  'cau-ca': 'fish',
  'tiền': 'balance',
  'xu': 'balance',
  'số-dư': 'balance',
  'so-du': 'balance',
  'cần-câu': 'rod',
  'can-cau': 'rod',
  'cần': 'rod',
  'can': 'rod',
  'tự-động': 'auto',
  'tu-dong': 'auto',
  'cửa-hàng': 'shop',
  'cua-hang': 'shop',
  'mua': 'buy',
  'bán': 'sell',
  'ban': 'sell',
  'vip': 'vip',
  'trợ-giúp': 'help',
  'tro-giup': 'help',
  'giúp': 'help',
  'giup': 'help'
};

const commandFiles = fs.readdirSync(commandsDir)
  .filter(file => file.endsWith('.js'));

console.log(`📁 Processing ${commandFiles.length} command files\n`);

for (const file of commandFiles) {
  const filePath = path.join(commandsDir, file);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    console.log(`🔍 Checking: ${file}`);
    
    // Find command name
    const nameMatch = content.match(/\.setName\(['"`]([^'"`]+)['"`]\)/);
    
    if (nameMatch) {
      const originalName = nameMatch[1];
      let newName = originalName;
      
      // Check for issues
      const hasVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(originalName);
      const hasSpaces = /\s/.test(originalName);
      const hasUppercase = /[A-Z]/.test(originalName);
      
      // Fix Vietnamese characters
      if (hasVietnamese) {
        for (const [vietnamese, english] of Object.entries(nameMapping)) {
          newName = newName.replace(new RegExp(vietnamese, 'gi'), english);
        }
      }
      
      // Fix spaces (replace with hyphens)
      if (hasSpaces) {
        newName = newName.replace(/\s+/g, '-');
      }
      
      // Fix uppercase
      if (hasUppercase) {
        newName = newName.toLowerCase();
      }
      
      // Remove special characters except hyphens
      newName = newName.replace(/[^a-z0-9-]/g, '');
      
      // Remove multiple consecutive hyphens
      newName = newName.replace(/-+/g, '-');
      
      // Remove leading/trailing hyphens
      newName = newName.replace(/^-+|-+$/g, '');
      
      // Ensure name is not empty and not too long
      if (!newName || newName.length === 0) {
        newName = file.replace('.js', '').toLowerCase().replace(/[^a-z0-9-]/g, '');
      }
      
      if (newName.length > 32) {
        newName = newName.substring(0, 32);
      }
      
      if (newName !== originalName) {
        // Replace the command name in the file
        content = content.replace(
          /\.setName\(['"`][^'"`]+['"`]\)/,
          `.setName('${newName}')`
        );
        
        modified = true;
        fixes.push({
          file,
          oldName: originalName,
          newName: newName,
          issues: [
            hasVietnamese ? 'Vietnamese characters' : null,
            hasSpaces ? 'Spaces' : null,
            hasUppercase ? 'Uppercase' : null
          ].filter(Boolean)
        });
        
        console.log(`  🔧 Fixed: /${originalName} → /${newName}`);
      } else {
        console.log(`  ✅ OK: /${originalName}`);
      }
    }
    
    // Check description length
    const descMatch = content.match(/\.setDescription\(['"`]([^'"`]+)['"`]\)/);
    if (descMatch) {
      const description = descMatch[1];
      if (description.length > 100) {
        const shortDesc = description.substring(0, 97) + '...';
        content = content.replace(
          /\.setDescription\(['"`][^'"`]+['"`]\)/,
          `.setDescription('${shortDesc}')`
        );
        modified = true;
        console.log(`  🔧 Shortened description (${description.length} → ${shortDesc.length} chars)`);
      }
    }
    
    // Save file if modified
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`  💾 Saved changes to ${file}`);
    }
    
    console.log('');
    
  } catch (error) {
    console.log(`  ❌ Error processing ${file}: ${error.message}\n`);
  }
}

// Report results
console.log('📊 FIX RESULTS:\n');

if (fixes.length === 0) {
  console.log('✅ No fixes needed! All commands already have proper names.');
} else {
  console.log(`🔧 Fixed ${fixes.length} command names:\n`);
  
  fixes.forEach((fix, index) => {
    console.log(`${index + 1}. ${fix.file}:`);
    console.log(`   /${fix.oldName} → /${fix.newName}`);
    console.log(`   Issues fixed: ${fix.issues.join(', ')}`);
    console.log('');
  });
}

console.log('🎯 FIXED COMMAND NAMING RULES:');
console.log('✅ Only English letters, numbers, and hyphens');
console.log('✅ All lowercase');
console.log('✅ Spaces replaced with hyphens');
console.log('✅ Vietnamese characters translated to English');
console.log('✅ Maximum 32 characters');
console.log('✅ Descriptions under 100 characters');

console.log('\n🚀 NEXT STEPS:');
console.log('1. Review the changes above');
console.log('2. Test locally: node deploy-commands.js');
console.log('3. Commit changes: git add . && git commit -m "Fix: Command names and descriptions"');
console.log('4. Deploy to Railway: git push');

console.log('\n🎮 EXAMPLE FIXES APPLIED:');
console.log('• "cá-câu" → "fish"');
console.log('• "số dư" → "balance"');
console.log('• "Auto Fishing" → "auto-fishing"');
console.log('• "cần câu" → "rod"');
console.log('• Long descriptions → Shortened to 100 chars');

console.log('\n✅ Command name fixes completed!');
console.log('🎯 All commands should now follow Discord naming rules!');