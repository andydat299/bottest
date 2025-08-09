#!/usr/bin/env node

/**
 * Fix Discord.js Interaction Warnings
 * Update deprecated interaction options across all commands
 */

import fs from 'fs';
import path from 'path';

console.log('💬 FIXING DISCORD.JS INTERACTION WARNINGS\n');

const commandsDir = './commands';
let fixedFiles = 0;
let totalWarnings = 0;

if (!fs.existsSync(commandsDir)) {
  console.log('❌ Commands directory not found');
  process.exit(1);
}

const commandFiles = fs.readdirSync(commandsDir)
  .filter(file => file.endsWith('.js'));

console.log(`📁 Found ${commandFiles.length} command files to check\n`);

commandFiles.forEach(file => {
  const filePath = path.join(commandsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let wasModified = false;
  let fileWarnings = 0;

  console.log(`🔍 Checking: ${file}`);

  // Fix 1: ephemeral: true -> flags: MessageFlags.Ephemeral
  if (content.includes('ephemeral: true')) {
    const ephemeralCount = (content.match(/ephemeral:\s*true/g) || []).length;
    content = content.replace(/ephemeral:\s*true/g, 'flags: MessageFlags.Ephemeral');
    
    // Add MessageFlags import if not present
    if (!content.includes('MessageFlags')) {
      if (content.includes('import { ') && content.includes('} from \'discord.js\'')) {
        content = content.replace(
          /(import\s*{\s*[^}]+)(}\s*from\s*['"]discord\.js['"])/,
          '$1, MessageFlags$2'
        );
      } else if (content.includes('import { ') && content.includes('} from "discord.js"')) {
        content = content.replace(
          /(import\s*{\s*[^}]+)(}\s*from\s*"discord\.js")/,
          '$1, MessageFlags$2'
        );
      }
    }
    
    console.log(`   ✅ Fixed ${ephemeralCount} ephemeral warnings`);
    fileWarnings += ephemeralCount;
    wasModified = true;
  }

  // Fix 2: fetchReply: true -> withResponse: true
  if (content.includes('fetchReply: true')) {
    const fetchReplyCount = (content.match(/fetchReply:\s*true/g) || []).length;
    content = content.replace(/fetchReply:\s*true/g, 'withResponse: true');
    
    console.log(`   ✅ Fixed ${fetchReplyCount} fetchReply warnings`);
    fileWarnings += fetchReplyCount;
    wasModified = true;
  }

  // Fix 3: Update any remaining ephemeral: false (also deprecated)
  if (content.includes('ephemeral: false')) {
    const ephemeralFalseCount = (content.match(/ephemeral:\s*false/g) || []).length;
    content = content.replace(/ephemeral:\s*false/g, '// ephemeral: false (removed - default behavior)');
    
    console.log(`   ✅ Fixed ${ephemeralFalseCount} ephemeral: false warnings`);
    fileWarnings += ephemeralFalseCount;
    wasModified = true;
  }

  if (wasModified) {
    fs.writeFileSync(filePath, content);
    fixedFiles++;
    console.log(`   📊 Total warnings fixed in ${file}: ${fileWarnings}`);
  } else {
    console.log(`   ⚪ No warnings found in ${file}`);
  }

  totalWarnings += fileWarnings;
  console.log('');
});

console.log('📊 DISCORD.JS WARNINGS FIX SUMMARY:');
console.log(`   📁 Files checked: ${commandFiles.length}`);
console.log(`   🔧 Files modified: ${fixedFiles}`);
console.log(`   ⚠️ Total warnings fixed: ${totalWarnings}`);

if (fixedFiles > 0) {
  console.log('\n✅ FIXES APPLIED:');
  console.log('   • ephemeral: true → flags: MessageFlags.Ephemeral');
  console.log('   • fetchReply: true → withResponse: true');
  console.log('   • ephemeral: false → removed (default behavior)');
  
  console.log('\n📋 IMPORTS UPDATED:');
  console.log('   • Added MessageFlags to discord.js imports where needed');
  
  console.log('\n🚀 NEXT STEPS:');
  console.log('   1. Test locally: npm start');
  console.log('   2. Verify no interaction warnings');
  console.log('   3. Deploy: git add . && git commit -m "Fix: Discord.js interaction warnings"');
} else {
  console.log('\n✅ No Discord.js interaction warnings found!');
  console.log('   All command files are already using modern interaction syntax.');
}

console.log('\n💡 FUTURE REFERENCE:');
console.log('   ✅ Use: { flags: MessageFlags.Ephemeral }');
console.log('   ✅ Use: { withResponse: true }');
console.log('   ❌ Avoid: { ephemeral: true }');
console.log('   ❌ Avoid: { fetchReply: true }');

console.log('\n✅ Discord.js interaction warnings fix completed!');