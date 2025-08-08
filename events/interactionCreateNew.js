import { Events } from 'discord.js';

export default {
  name: Events.InteractionCreate,
  async execute(interaction) {
    // Handle slash commands
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);

      if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
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
    
    // Handle button interactions from game panel
    else if (interaction.isButton()) {
      try {
        console.log(`Button clicked: ${interaction.customId}`);
        await interaction.reply({
          content: `✅ Button "${interaction.customId}" received! (Game panel features coming soon)`,
          ephemeral: true
        });
      } catch (error) {
        console.error('Button interaction error:', error);
        if (!interaction.replied) {
          await interaction.reply({
            content: '❌ **Có lỗi khi xử lý button!**',
            ephemeral: true
          });
        }
      }
    }
    
    // Handle modal submissions
    else if (interaction.isModalSubmit()) {
      try {
        console.log(`Modal submitted: ${interaction.customId}`);
        await interaction.reply({
          content: `✅ Modal "${interaction.customId}" received! (Processing coming soon)`,
          ephemeral: true
        });
      } catch (error) {
        console.error('Modal submit error:', error);
        if (!interaction.replied) {
          await interaction.reply({
            content: '❌ **Có lỗi khi xử lý form!**',
            ephemeral: true
          });
        }
      }
    }
  }
};