#!/usr/bin/env node

import { unlinkSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔧 Emergency fix for duplicate export error...');

// Clean interactionCreate.js content
const cleanInteractionCreateContent = `import { Events } from 'discord.js';

export default {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);

      if (!command) {
        console.error(\`No command matching \${interaction.commandName} was found.\`);
        return;
      }

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error('Command execution error:', error);
        
        const errorMessage = { content: 'There was an error while executing this command!', ephemeral: true };
        
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(errorMessage);
        } else {
          await interaction.reply(errorMessage);
        }
      }
    }
    else if (interaction.isButton()) {
      try {
        console.log(\`Button clicked: \${interaction.customId}\`);
        await interaction.reply({
          content: \`✅ Button "\${interaction.customId}" received!\`,
          ephemeral: true
        });
      } catch (error) {
        console.error('Button interaction error:', error);
        if (!interaction.replied) {
          await interaction.reply({
            content: '❌ Có lỗi khi xử lý button!',
            ephemeral: true
          });
        }
      }
    }
    else if (interaction.isModalSubmit()) {
      try {
        console.log(\`Modal submitted: \${interaction.customId}\`);
        await interaction.reply({
          content: \`✅ Modal "\${interaction.customId}" received!\`,
          ephemeral: true
        });
      } catch (error) {
        console.error('Modal submit error:', error);
        if (!interaction.replied) {
          await interaction.reply({
            content: '❌ Có lỗi khi xử lý form!',
            ephemeral: true
          });
        }
      }
    }
  }
};
`;

const interactionFile = join(__dirname, 'events', 'interactionCreate.js');

try {
  // Delete old file if exists
  if (existsSync(interactionFile)) {
    unlinkSync(interactionFile);
    console.log('🗑️  Deleted corrupted interactionCreate.js');
  }
  
  // Write new clean file
  writeFileSync(interactionFile, cleanInteractionCreateContent, 'utf-8');
  console.log('✅ Created new clean interactionCreate.js');
  
} catch (error) {
  console.error('❌ Failed to fix interactionCreate.js:', error);
  process.exit(1);
}

// Remove other conflict files
const conflictFiles = [
  join(__dirname, 'events', 'gameInteractionCreate.js'),
  join(__dirname, 'events', 'interactionCreateNew.js'),
  join(__dirname, 'schemas', 'userSchemaNew.js')
];

for (const file of conflictFiles) {
  try {
    if (existsSync(file)) {
      unlinkSync(file);
      const fileName = file.split('/').pop() || file.split('\\').pop();
      console.log(`🗑️  Removed ${fileName}`);
    }
  } catch (error) {
    const fileName = file.split('/').pop() || file.split('\\').pop();
    console.log(`⏭️  Could not remove ${fileName}`);
  }
}

console.log('');
console.log('✅ Emergency fix completed!');
console.log('🎯 interactionCreate.js has been completely recreated');
console.log('');
console.log('📋 Next steps:');
console.log('1. npm run deploy');
console.log('2. npm start');
console.log('3. Bot should start without syntax errors');
console.log('');
console.log('⚠️ If error persists, check for other .js files with export issues');