import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('test-real-withdraw')
    .setDescription('🧪 [ADMIN] Test real withdrawal system')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to test withdrawal for')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('Amount to test')
        .setMinValue(1000)
        .setMaxValue(100000)
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    try {
      const user = interaction.options.getUser('user');
      const amount = interaction.options.getInteger('amount');
      
      const embed = new EmbedBuilder()
        .setTitle('🧪 REAL WITHDRAWAL TEST')
        .setDescription(`**Testing withdrawal for ${user.username}:**`)
        .addFields(
          { name: '💰 Amount', value: `${amount.toLocaleString()} xu`, inline: true },
          { name: '🏦 Method', value: 'Test Mode', inline: true },
          { name: '📊 Status', value: 'Simulation Only', inline: true },
          { name: '⚠️ Warning', value: 'This is a test command - no real withdrawal will occur', inline: false },
          { name: '🔧 Next Steps', value: 'Implement actual withdrawal logic here', inline: false }
        )
        .setColor('#e67e22')
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
      console.error('Error in test-real-withdraw:', error);
      await interaction.reply({
        content: '❌ Error testing withdrawal.',
        ephemeral: true
      });
    }
  }
};