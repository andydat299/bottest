import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('set-fish-miss-rate')
    .setDescription('🎣 [ADMIN] Chỉnh tỷ lệ hụt cá cho user cụ thể')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User muốn chỉnh tỷ lệ hụt cá')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('miss_rate')
        .setDescription('Tỷ lệ hụt cá (0-100%). Để 0 = không bao giờ hụt, 100 = luôn hụt')
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(100)
    )
    .addIntegerOption(option =>
      option.setName('duration_hours')
        .setDescription('Thời gian áp dụng (giờ). Để 0 = vĩnh viễn')
        .setRequired(false)
        .setMinValue(0)
        .setMaxValue(168) // 1 week max
    )
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Lý do chỉnh tỷ lệ (tùy chọn)')
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
    const missRate = interaction.options.getInteger('miss_rate');
    const durationHours = interaction.options.getInteger('duration_hours') || 0;
    const reason = interaction.options.getString('reason') || 'Không có lý do';

    await interaction.deferReply({ ephemeral: true });

    try {
      const { User } = await import('../schemas/userSchema.js');

      // Tìm hoặc tạo user record
      let user = await User.findOne({ discordId: targetUser.id });
      if (!user) {
        user = new User({
          discordId: targetUser.id,
          username: targetUser.username,
          balance: 0
        });
      }

      // Tính thời gian hết hạn
      let expiresAt = null;
      if (durationHours > 0) {
        expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);
      }

      // Cập nhật custom miss rate
      user.customFishMissRate = {
        rate: missRate,
        setBy: interaction.user.id,
        setAt: new Date(),
        expiresAt: expiresAt,
        reason: reason,
        isActive: true
      };

      // Update username
      user.username = targetUser.username;
      
      await user.save();

      // Tạo embed thông báo
      const embed = new EmbedBuilder()
        .setTitle('🎣 Tỷ Lệ Hụt Cá Đã Được Cập Nhật')
        .setDescription(`**Target User:** ${targetUser.username}`)
        .addFields(
          { name: '🎯 Tỷ lệ hụt mới', value: `${missRate}%`, inline: true },
          { name: '⏰ Thời gian áp dụng', value: durationHours > 0 ? `${durationHours} giờ` : 'Vĩnh viễn', inline: true },
          { name: '👨‍💼 Admin thực hiện', value: `<@${interaction.user.id}>`, inline: true },
          { name: '📝 Lý do', value: reason, inline: false }
        )
        .setColor(missRate === 0 ? '#00ff00' : missRate >= 80 ? '#ff0000' : '#ff9900')
        .setThumbnail(targetUser.displayAvatarURL())
        .setTimestamp();

      if (expiresAt) {
        embed.addFields({ 
          name: '⏳ Hết hạn vào', 
          value: `<t:${Math.floor(expiresAt.getTime()/1000)}:F>`, 
          inline: false 
        });
      }

      // Thêm thông tin về hiệu ứng
      let effectDescription = '';
      if (missRate === 0) {
        effectDescription = '✨ **User này sẽ KHÔNG BAO GIỜ hụt cá!**';
      } else if (missRate === 100) {
        effectDescription = '💀 **User này sẽ LUÔN LUÔN hụt cá!**';
      } else if (missRate <= 10) {
        effectDescription = '🍀 **Tỷ lệ hụt rất thấp - may mắn cao!**';
      } else if (missRate >= 90) {
        effectDescription = '😈 **Tỷ lệ hụt rất cao - xui xẻo!**';
      } else {
        effectDescription = `🎲 **Tỷ lệ hụt tùy chỉnh: ${missRate}%**`;
      }

      embed.addFields({ name: '🎭 Hiệu ứng', value: effectDescription, inline: false });

      await interaction.editReply({ embeds: [embed] });

      // Log to console
      console.log(`🎣 Fish miss rate set by ${interaction.user.username}:`);
      console.log(`   - Target: ${targetUser.username} (${targetUser.id})`);
      console.log(`   - Miss rate: ${missRate}%`);
      console.log(`   - Duration: ${durationHours > 0 ? durationHours + ' hours' : 'permanent'}`);
      console.log(`   - Reason: ${reason}`);

      // Gửi DM cho target user (nếu có thể)
      try {
        const dmEmbed = new EmbedBuilder()
          .setTitle('🎣 Thông Báo: Tỷ Lệ Câu Cá Của Bạn Đã Thay Đổi')
          .setDescription(`Admin đã điều chỉnh tỷ lệ câu cá của bạn.`)
          .addFields(
            { name: '🎯 Tỷ lệ hụt mới', value: `${missRate}%`, inline: true },
            { name: '⏰ Thời gian', value: durationHours > 0 ? `${durationHours} giờ` : 'Vĩnh viễn', inline: true },
            { name: '📝 Lý do', value: reason, inline: false }
          )
          .setColor(missRate === 0 ? '#00ff00' : missRate >= 80 ? '#ff0000' : '#ff9900')
          .setTimestamp();

        await targetUser.send({ embeds: [dmEmbed] });
        console.log(`📧 DM sent to ${targetUser.username} about miss rate change`);
      } catch (dmError) {
        console.log(`❌ Could not DM ${targetUser.username} about miss rate change:`, dmError.message);
      }

    } catch (error) {
      console.error('❌ Set fish miss rate error:', error);
      
      await interaction.editReply({
        content: `❌ **Có lỗi khi chỉnh tỷ lệ hụt cá:**\n\`\`\`${error.message}\`\`\``
      });
    }
  }
};