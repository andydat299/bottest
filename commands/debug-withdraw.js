import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('debug-withdraw')
    .setDescription('🔧 [ADMIN] Debug withdrawal system')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to debug')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    try {
      const targetUser = interaction.options.getUser('user') || interaction.user;
      
      const embed = new EmbedBuilder()
        .setTitle('🔧 WITHDRAWAL DEBUG')
        .setDescription(`**Debug info for ${targetUser.username}:**`)
        .addFields(
          { name: '💰 Balance', value: 'Loading...', inline: true },
          { name: '📋 Withdraw History', value: 'No history found', inline: true },
          { name: '🔒 Status', value: 'System ready', inline: true },
          { name: '⚙️ Debug Info', value: 'Withdrawal system is being developed', inline: false }
        )
        .setColor('#e67e22')
        .setThumbnail(targetUser.displayAvatarURL())
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
      console.error('Error in debug-withdraw:', error);
      await interaction.reply({
        content: '❌ Error debugging withdrawal system.',
        ephemeral: true
      });
    }
  }
};