// Xóa file cũ và thay thế
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { VIP_TIERS, getOrCreateVIP } from '../utils/vip.js';

export default {
  data: new SlashCommandBuilder()
    .setName('vip-admin')
    .setDescription('Admin VIP management')
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Add VIP to user (free)')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('Target user')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('tier')
            .setDescription('VIP tier')
            .setRequired(true)
            .addChoices(
              { name: 'Basic VIP', value: 'basic' },
              { name: 'Premium VIP', value: 'premium' },
              { name: 'Ultimate VIP', value: 'ultimate' },
              { name: 'Lifetime VIP', value: 'lifetime' }
            ))
        .addIntegerOption(option =>
          option.setName('days')
            .setDescription('Custom days (optional)')
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(36500)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remove VIP from user')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('Target user')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('check')
        .setDescription('Check user VIP status')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('Target user')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('extend')
        .setDescription('Extend VIP duration')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('Target user')
            .setRequired(true))
        .addIntegerOption(option =>
          option.setName('days')
            .setDescription('Days to extend')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(36500))),
  async execute(interaction) {
    try {
      // Check admin permission
      if (!interaction.member.permissions.has('Administrator')) {
        await interaction.reply({
          content: 'You do not have permission to use this command!',
          flags: 64
        });
        return;
      }

      const subcommand = interaction.options.getSubcommand();

      switch (subcommand) {
        case 'add':
          await handleAddVIP(interaction);
          break;
        case 'remove':
          await handleRemoveVIP(interaction);
          break;
        case 'check':
          await handleCheckVIP(interaction);
          break;
        case 'extend':
          await handleExtendVIP(interaction);
          break;
      }

    } catch (error) {
      console.error('VIP Admin command error:', error);
      await interaction.reply({
        content: 'An error occurred while executing VIP admin command!',
        flags: 64
      });
    }
  }
};

// ...existing functions...