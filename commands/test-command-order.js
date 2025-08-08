import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('test-command-order')
    .setDescription('🧪 Test command with proper option order')
    // REQUIRED OPTIONS FIRST
    .addStringOption(option =>
      option.setName('required-text')
        .setDescription('Required text parameter')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('required-number')
        .setDescription('Required number parameter')
        .setRequired(true)
    )
    // OPTIONAL OPTIONS AFTER
    .addStringOption(option =>
      option.setName('optional-text')
        .setDescription('Optional text parameter')
        .setRequired(false)
    )
    .addIntegerOption(option =>
      option.setName('optional-number')
        .setDescription('Optional number parameter')
        .setMinValue(1)
        .setMaxValue(100)
    ),
  
  async execute(interaction) {
    await interaction.reply({
      content: '✅ **Command Options Order Test**\n\n' +
               'This command demonstrates proper option ordering:\n' +
               '• Required options come first\n' +
               '• Optional options come after\n' +
               '• This prevents Discord API errors',
      ephemeral: true
    });
  }
};