import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('debug-qr-generation')
    .setDescription('🔧 [ADMIN] Debug QR code generation')
    .addStringOption(option =>
      option.setName('data')
        .setDescription('Test data for QR generation')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    try {
      const testData = interaction.options.getString('data') || 'Test QR Data';
      
      const embed = new EmbedBuilder()
        .setTitle('🔧 QR GENERATION DEBUG')
        .setDescription('**QR Code Generation Test:**')
        .addFields(
          { name: '📊 Test Data', value: `\`${testData}\``, inline: false },
          { name: '🔧 Status', value: 'QR generation feature is being developed', inline: true },
          { name: '💡 Note', value: 'This is a debug command for testing', inline: true }
        )
        .setColor('#3498db')
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
      console.error('Error in debug-qr-generation:', error);
      await interaction.reply({
        content: '❌ Error debugging QR generation.',
        ephemeral: true
      });
    }
  }
};