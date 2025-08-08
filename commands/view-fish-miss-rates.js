import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('view-fish-miss-rates')
    .setDescription('👀 [ADMIN] Xem tỷ lệ hụt cá đã được chỉnh của users')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User cụ thể để xem (để trống = xem tất cả)')
        .setRequired(false)
    ),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return await interaction.reply({
        content: '❌ Bạn không có quyền sử dụng lệnh này!',
        ephemeral: true
      });
    }

    const targetUser = interaction.options.getUser('user');

    await interaction.deferReply({ ephemeral: true });

    try {
      const { User } = await import('../schemas/userSchema.js');

      let users;
      if (targetUser) {
        // Xem user cụ thể
        users = await User.find({ 
          discordId: targetUser.id,
          customFishMissRate: { $exists: true, $ne: null }
        });
      } else {
        // Xem tất cả users có custom miss rate
        users = await User.find({ 
          customFishMissRate: { $exists: true, $ne: null }
        }).limit(20); // Giới hạn 20 users để không quá dài
      }

      if (users.length === 0) {
        const embed = new EmbedBuilder()
          .setTitle('👀 Tỷ Lệ Hụt Cá Tùy Chỉnh')
          .setDescription(targetUser ? 
            `**${targetUser.username}** không có tỷ lệ hụt cá tùy chỉnh.` :
            '**Không có user nào có tỷ lệ hụt cá tùy chỉnh.**'
          )
          .setColor('#3498db')
          .setTimestamp();

        return await interaction.editReply({ embeds: [embed] });
      }

      const now = new Date();
      const activeUsers = [];
      const expiredUsers = [];

      for (const user of users) {
        const missRate = user.customFishMissRate;
        
        // Check if expired
        if (missRate.expiresAt && now > missRate.expiresAt) {
          expiredUsers.push(user);
        } else {
          activeUsers.push(user);
        }
      }

      // Create main embed
      const embed = new EmbedBuilder()
        .setTitle('👀 Tỷ Lệ Hụt Cá Tùy Chỉnh')
        .setDescription(targetUser ? 
          `**Thông tin cho:** ${targetUser.username}` :
          `**Tổng quan:** ${users.length} users có tỷ lệ tùy chỉnh`
        )
        .setColor('#3498db')
        .setTimestamp();

      // Add active users
      if (activeUsers.length > 0) {
        const activeText = activeUsers.map(user => {
          const missRate = user.customFishMissRate;
          const expiresText = missRate.expiresAt ? 
            `<t:${Math.floor(missRate.expiresAt.getTime()/1000)}:R>` : 
            'Vĩnh viễn';
          
          let statusEmoji = '';
          if (missRate.rate === 0) statusEmoji = '✨';
          else if (missRate.rate === 100) statusEmoji = '💀';
          else if (missRate.rate <= 10) statusEmoji = '🍀';
          else if (missRate.rate >= 90) statusEmoji = '😈';
          else statusEmoji = '🎯';

          return `${statusEmoji} **${user.username}**: ${missRate.rate}% (${expiresText})`;
        }).join('\n');

        embed.addFields({
          name: `✅ Active (${activeUsers.length})`,
          value: activeText.substring(0, 1024), // Discord limit
          inline: false
        });
      }

      // Add expired users
      if (expiredUsers.length > 0) {
        const expiredText = expiredUsers.map(user => {
          const missRate = user.customFishMissRate;
          return `⏰ **${user.username}**: ${missRate.rate}% (Đã hết hạn)`;
        }).join('\n');

        embed.addFields({
          name: `⏰ Expired (${expiredUsers.length})`,
          value: expiredText.substring(0, 1024),
          inline: false
        });
      }

      // Add detailed info for specific user
      if (targetUser && activeUsers.length > 0) {
        const user = activeUsers[0];
        const missRate = user.customFishMissRate;
        
        embed.addFields({
          name: '📋 Chi Tiết',
          value: `**Set by:** <@${missRate.setBy}>\n**Set at:** <t:${Math.floor(missRate.setAt.getTime()/1000)}:F>\n**Reason:** ${missRate.reason}`,
          inline: false
        });
      }

      // Add legend
      embed.addFields({
        name: '📖 Ký hiệu',
        value: '✨ Không bao giờ hụt (0%)\n💀 Luôn hụt (100%)\n🍀 Tỷ lệ thấp (≤10%)\n😈 Tỷ lệ cao (≥90%)\n🎯 Tỷ lệ khác',
        inline: false
      });

      await interaction.editReply({ embeds: [embed] });

      // Auto-cleanup expired rates
      if (expiredUsers.length > 0) {
        console.log(`🧹 Auto-cleaning ${expiredUsers.length} expired fish miss rates...`);
        
        for (const user of expiredUsers) {
          user.customFishMissRate = undefined;
          await user.save();
        }
        
        console.log(`✅ Cleaned up expired fish miss rates`);
      }

    } catch (error) {
      console.error('❌ View fish miss rates error:', error);
      
      await interaction.editReply({
        content: `❌ **Có lỗi khi xem tỷ lệ hụt cá:**\n\`\`\`${error.message}\`\`\``
      });
    }
  }
};