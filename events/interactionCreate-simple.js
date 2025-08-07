export default {
  name: 'interactionCreate',
  async execute(interaction) {
    // Handle button interactions
    if (interaction.isButton()) {
      // Quest buttons
      if (interaction.customId.startsWith('quest_')) {
        try {
          const { handleQuestButtons } = await import('../utils/questButtonHandler.js');
          await handleQuestButtons(interaction);
        } catch (error) {
          console.error('Error handling quest button:', error);
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
              content: '❌ Có lỗi xảy ra khi xử lý nút bấm!',
              ephemeral: true
            });
          }
        }
        return;
      }
      
      // Other button handlers can be added here
    }
    
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
        console.error('Error executing command:', error);
        const reply = {
          content: 'There was an error while executing this command!',
          ephemeral: true
        };
        
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(reply);
        } else {
          await interaction.reply(reply);
        }
      }
    }
  }
};