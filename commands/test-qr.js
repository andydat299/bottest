import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('test-qr')
    .setDescription('🧪 [ADMIN] Test QR code generation')
    .addStringOption(option =>
      option.setName('text')
        .setDescription('Text to encode in QR')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    try {
      const text = interaction.options.getString('text') || 'Test QR Code';
      
      const embed = new EmbedBuilder()
        .setTitle('🧪 QR CODE TEST')
        .setDescription('**QR Code generation test:**')
        .addFields(
          { name: '📊 Input Text', value: `\`${text}\``, inline: false },
          { name: '🔧 Status', value: 'QR generation feature coming soon', inline: true },
          { name: '💡 Length', value: `${text.length} characters`, inline: true }
        )
        .setColor('#3498db')
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
      console.error('Error in test-qr:', error);
      await interaction.reply({
        content: '❌ Error testing QR generation.',
        ephemeral: true
      });
    }
  }
};