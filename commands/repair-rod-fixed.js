import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

// Command disabled for Railway deployment due to option order issues
export default {
  data: new SlashCommandBuilder()
    .setName('repair-rod-fixed-disabled')
    .setDescription('🚫 Command temporarily disabled for Railway deployment'),
  
  async execute(interaction) {
    await interaction.reply({
      content: '🚫 **Command Temporarily Disabled**\n\n' +
               'This command has been disabled to fix deployment issues on Railway.\n' +
               'Please use the alternative commands below:\n\n' +
               '**Available repair commands:**\n' +
               '• `/repair-rod-clean` - Full repair (100%)\n' +
               '• `/repair-rod-check` - Check repair system status\n' +
               '• `/rod-status` - View current rod information\n\n' +
               '**Why was this disabled?**\n' +
               'Discord API requires all required options to come before optional options.\n' +
               'This command will be re-enabled after fixing the option order.',
      ephemeral: true
    });
  }
};