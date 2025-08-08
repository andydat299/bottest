import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('remove-fish-miss-rate')
    .setDescription('🗑️ [ADMIN] Xóa tỷ lệ hụt cá tùy chỉnh của user')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User muốn xóa tỷ lệ hụt cá tùy chỉnh')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Lý do xóa (tùy chọn)')
        .setRequired(false)
        .setMaxLength(200)
    ),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return await interaction.reply({
        content: '❌ Bạn không có quyền sử dụng lệnh này!',
        ephemeral: true
      });
    }

    const targetUser = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'Admin reset';

    await interaction.deferReply({ ephemeral: true });

    try {
      const { User } = await import('../schemas/userSchema.js');

      // Tìm user
      const user = await User.findOne({ discordId: targetUser.id });
      
      if (!user || !user.customFishMissRate) {
        const embed = new EmbedBuilder()
          .setTitle('❌ Không Tìm Thấy')
          .setDescription(`**${targetUser.username}** không có tỷ lệ hụt cá tùy chỉnh để xóa.`)
          .setColor('#ff0000')
          .setTimestamp();

        return await interaction.editReply({ embeds: [embed] });
      }

      // Lưu thông tin cũ để hiển thị
      const oldMissRate = user.customFishMissRate.rate;
      const oldSetBy = user.customFishMissRate.setBy;
      const oldSetAt = user.customFishMissRate.setAt;
      const oldReason = user.customFishMissRate.reason;

      // Xóa custom miss rate
      user.customFishMissRate = undefined;
      await user.save();

      // Tạo embed thông báo
      const embed = new EmbedBuilder()
        .setTitle('🗑️ Đã Xóa Tỷ Lệ Hụt Cá Tùy Chỉnh')
        .setDescription(`**${targetUser.username}** đã được reset về tỷ lệ hụt cá mặc định.`)
        .addFields(
          { name: '🎯 Tỷ lệ cũ', value: `${oldMissRate}%`, inline: true },
          { name: '👨‍💼 Xóa bởi', value: `<@${interaction.user.id}>`, inline: true },
          { name: '📝 Lý do xóa', value: reason, inline: true },
          { name: '📊 Thông tin cũ', value: `**Set by:** <@${oldSetBy}>\n**Set at:** <t:${Math.floor(oldSetAt.getTime()/1000)}:F>\n**Old reason:** ${oldReason}`, inline: false },
          { name: '🔄 Hiệu ứng', value: '**User sẽ quay về tỷ lệ hụt cá mặc định của game.**', inline: false }
        )
        .setColor('#00ff00')
        .setThumbnail(targetUser.displayAvatarURL())
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

      // Log to console
      console.log(`🗑️ Fish miss rate removed by ${interaction.user.username}:`);
      console.log(`   - Target: ${targetUser.username} (${targetUser.id})`);
      console.log(`   - Old rate: ${oldMissRate}%`);
      console.log(`   - Reason: ${reason}`);

      // Gửi DM cho target user
      try {
        const dmEmbed = new EmbedBuilder()
          .setTitle('🗑️ Thông Báo: Tỷ Lệ Câu Cá Đã Được Reset')
          .setDescription(`Admin đã reset tỷ lệ câu cá của bạn về mặc định.`)
          .addFields(
            { name: '🎯 Tỷ lệ cũ', value: `${oldMissRate}%`, inline: true },
            { name: '🔄 Tỷ lệ mới', value: 'Mặc định', inline: true },
            { name: '📝 Lý do', value: reason, inline: false }
          )
          .setColor('#3498db')
          .setTimestamp();

        await targetUser.send({ embeds: [dmEmbed] });
        console.log(`📧 DM sent to ${targetUser.username} about miss rate removal`);
      } catch (dmError) {
        console.log(`❌ Could not DM ${targetUser.username} about miss rate removal:`, dmError.message);
      }

    } catch (error) {
      console.error('❌ Remove fish miss rate error:', error);
      
      await interaction.editReply({
        content: `❌ **Có lỗi khi xóa tỷ lệ hụt cá:**\n\`\`\`${error.message}\`\`\``
      });
    }
  }
};