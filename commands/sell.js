// EMERGENCY DISABLED - Command #53 option order issue
// Original backed up to: ./commands/disabled/sell-backup-1754747473576.js
// Deploy error: Required options must be placed before non-required options

import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('sell-disabled')
    .setDescription('🚫 Temporarily disabled due to option order issue'),
  
  async execute(interaction) {
    await interaction.reply({
      content: '🚫 **Command Temporarily Disabled**\n\n' +
               'This command has been disabled due to Discord API option order requirements.\n' +
               'Required options must come before optional options.\n\n' +
               'The command will be re-enabled after fixing the option order.',
      ephemeral: true
    });
  }
};