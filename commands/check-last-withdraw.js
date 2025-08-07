import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('check-last-withdraw')
    .setDescription('🔍 [ADMIN] Check last withdrawal')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to check')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    try {
      const targetUser = interaction.options.getUser('user') || interaction.user;
      
      // Mock data for now
      const embed = new EmbedBuilder()
        .setTitle('🔍 WITHDRAWAL CHECK')
        .setDescription(`**Last withdrawal for ${targetUser.username}:**`)
        .addFields(
          { name: '💰 Amount', value: 'No withdrawals found', inline: true },
          { name: '📅 Date', value: 'N/A', inline: true },
          { name: '📋 Status', value: 'No history', inline: true }
        )
        .setColor('#e74c3c')
        .setThumbnail(targetUser.displayAvatarURL())
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
      console.error('Error in check-last-withdraw:', error);
      await interaction.reply({
        content: '❌ Error checking withdrawal history.',
        ephemeral: true
      });
    }
  }
};