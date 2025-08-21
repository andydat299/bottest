console.log('🚨 BOT DEBUGGING - FINDING AND FIXING ERRORS...\n');

console.log('❌ PROBLEM: Bot stopped working after multi-server conversion');
console.log('🔍 LIKELY CAUSES:\n');

console.log('1. ❌ IMPORT ERRORS:');
console.log('   • New files not found (guildManager.js, mentionFilter.js)');
console.log('   • Wrong import paths');
console.log('   • Missing dependencies');

console.log('\n2. ❌ DATABASE CONNECTION:');
console.log('   • MongoDB connection failed');
console.log('   • New collections not created');
console.log('   • Missing guildId in queries');

console.log('\n3. ❌ INTERACTIONCREATE ISSUES:');
console.log('   • New checks causing crashes');
console.log('   • Missing error handling');
console.log('   • Guild functions not working');

console.log('\n4. ❌ COMMAND CONFLICTS:');
console.log('   • Old commands not updated');
console.log('   • GuildId missing in database calls');
console.log('   • Feature checks failing');

console.log('\n🔧 IMMEDIATE FIXES:');
console.log('==================\n');

console.log('FIX 1: REVERT TO WORKING STATE');
console.log('------------------------------');
console.log('If bot was working before, restore backup:');
console.log(`
# Restore original interactionCreate.js
cp events/interactionCreate-backup.js events/interactionCreate.js

# Remove new imports that might be causing issues
# Comment out any new guild-related code
`);

console.log('\nFIX 2: CHECK CONSOLE ERRORS');
console.log('----------------------------');
console.log('Start bot and look for specific error messages:');
console.log(`
npm start
# OR
node index.js

# Look for errors like:
# "Cannot find module"
# "ReferenceError" 
# "TypeError"
# "MongoDB connection failed"
`);

console.log('\nFIX 3: GRADUAL INTEGRATION');
console.log('---------------------------');
console.log('Add multi-server support step by step:');
console.log(`
Step 1: Get bot working again (revert changes)
Step 2: Add only guildManager.js
Step 3: Test guild-setup command
Step 4: Update one command at a time
Step 5: Add new interactionCreate features
`);

console.log('\n🩹 EMERGENCY FIXES:');
console.log('===================\n');

console.log('EMERGENCY FIX 1: Minimal interactionCreate.js');
console.log('----------------------------------------------');
console.log(`
import { Events } from 'discord.js';

export default {
  name: Events.InteractionCreate,
  async execute(interaction) {
    try {
      if (interaction.isChatInputCommand()) {
        const command = interaction.client.commands.get(interaction.commandName);
        
        if (!command) {
          console.error(\`No command matching \${interaction.commandName} was found.\`);
          return;
        }

        await command.execute(interaction);
      }
    } catch (error) {
      console.error('Interaction error:', error);
      
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ 
          content: '❌ Có lỗi xảy ra!', 
          ephemeral: true 
        });
      } else {
        await interaction.reply({ 
          content: '❌ Có lỗi xảy ra!', 
          ephemeral: true 
        });
      }
    }
  }
};
`);

console.log('\nEMERGENCY FIX 2: Remove All New Dependencies');
console.log('--------------------------------------------');
console.log('Comment out or remove these imports if they exist:');
console.log(`
// import { getGuildSettings } from '../utils/guildManager.js';
// import { isInteractionBlocked } from '../utils/mentionFilter.js';
// import { checkGuildBan } from '../utils/guildManager.js';
`);

console.log('\nEMERGENCY FIX 3: Database Query Fixes');
console.log('-------------------------------------');
console.log('If commands are failing, add fallback for guildId:');
console.log(`
// In commands like fish.js, balance.js:
// OLD: 
// const user = await usersCollection.findOne({ discordId: interaction.user.id });

// TEMPORARY FIX:
const user = await usersCollection.findOne({ 
  discordId: interaction.user.id,
  // Add fallback if guildId doesn't exist
  $or: [
    { guildId: interaction.guildId },
    { guildId: { $exists: false } }
  ]
});
`);

console.log('\n🔍 DEBUGGING CHECKLIST:');
console.log('=======================\n');

const debugSteps = [
  '1. ✅ Check if bot starts without errors',
  '2. ✅ Check console for import/require errors', 
  '3. ✅ Verify MongoDB connection working',
  '4. ✅ Test simple command like /balance',
  '5. ✅ Check if new files exist and are accessible',
  '6. ✅ Verify no syntax errors in new files',
  '7. ✅ Check if package.json has required dependencies',
  '8. ✅ Test with original working code first'
];

debugSteps.forEach(step => console.log(step));

console.log('\n📋 STEP-BY-STEP RECOVERY:');
console.log('=========================\n');

console.log('STEP 1: Backup current state');
console.log(`
cp events/interactionCreate.js events/interactionCreate-broken.js
cp -r utils utils-backup
cp -r commands commands-backup
`);

console.log('\nSTEP 2: Restore working version');
console.log(`
# Use original interactionCreate.js (remove all new code)
# Remove import statements for new files
# Test if bot starts and basic commands work
`);

console.log('\nSTEP 3: Check specific error messages');
console.log(`
# Start bot and note exact error:
node index.js

# Common errors and fixes:
Error: Cannot find module 'guildManager' 
→ Remove the import line

Error: guildId is not defined
→ Add: const guildId = interaction.guildId || 'default'

Error: getGuildUser is not a function  
→ Use original database queries

ReferenceError: isInteractionBlocked is not defined
→ Remove mention filter code
`);

console.log('\nSTEP 4: Test basic functionality');
console.log(`
# Try these commands one by one:
/balance  # Should work if database is OK
/fish     # Should work if no syntax errors
/help     # Should work if commands load properly
`);

console.log('\nSTEP 5: Gradual re-integration');
console.log(`
# Once bot works again:
1. Add guildManager.js (test guild-setup command)
2. Add mention filter (test with simple check)  
3. Update one command file at a time
4. Test after each change
`);

console.log('\n🚨 COMMON ERROR FIXES:');
console.log('======================\n');

console.log('ERROR: "Cannot find module"');
console.log('FIX: Remove or fix import path');
console.log(`
// Remove this line if file doesn't exist:
// import { getGuildSettings } from '../utils/guildManager.js';
`);

console.log('\nERROR: "guildId is not defined"');
console.log('FIX: Add fallback for guildId');
console.log(`
// Add this at start of command:
const guildId = interaction.guildId || 'default';
`);

console.log('\nERROR: "Database query failed"');
console.log('FIX: Use original query format');
console.log(`
// Revert to original:
const user = await usersCollection.findOne({ discordId: interaction.user.id });
`);

console.log('\nERROR: "Function is not defined"');
console.log('FIX: Check if function exists or add fallback');
console.log(`
// Add error handling:
try {
  const result = await someNewFunction();
} catch (error) {
  console.log('New function failed, using fallback');
  // Use old method
}
`);

export default function debugBot() {
  return {
    status: 'Emergency debugging guide created',
    priority: 'Get bot working first, then add features',
    approach: 'Revert → Test → Gradual integration'
  };
}

console.log('\n🔧 Priority: Get bot working with basic features first!');