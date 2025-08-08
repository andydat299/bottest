import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('auto-fishing')
    .setDescription('🤖 Quản lý Auto-Fishing (VIP Gold+)')
    .addSubcommand(subcommand =>
      subcommand
        .setName('start')
        .setDescription('Bắt đầu phiên Auto-Fishing')
        .addIntegerOption(option =>
          option.setName('minutes')
            .setDescription('Thời gian Auto-Fishing (phút)')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(1440) // Max 24 hours
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('stop')
        .setDescription('Dừng phiên Auto-Fishing và nhận thưởng')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('status')
        .setDescription('Xem trạng thái Auto-Fishing')
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    await interaction.deferReply({ ephemeral: true });

    try {
      const { AutoFishing } = await import('../schemas/autoFishingSchema.js');
      const { User } = await import('../schemas/userSchema.js');
      const { VIP } = await import('../schemas/vipSchema.js');
      const { 
        startAutoFishingSession, 
        stopAutoFishingSession, 
        getAutoFishingStatus,
        getAutoFishingLimits 
      } = await import('../utils/autoFishingManager.js');

      switch (subcommand) {
        case 'start':
          await handleStart(interaction, AutoFishing, VIP);
          break;
        case 'stop':
          await handleStop(interaction, AutoFishing, User, VIP);
          break;
        case 'status':
          await handleStatus(interaction, AutoFishing, VIP);
          break;
      }

    } catch (error) {
      console.error('❌ Auto-fishing command error:', error);
      
      await interaction.editReply({
        content: `❌ **Có lỗi với Auto-Fishing:**\n\`\`\`${error.message}\`\`\``
      });
    }
  }
};

async function handleStart(interaction, AutoFishing, VIP) {
  const minutes = interaction.options.getInteger('minutes');
  
  const { startAutoFishingSession } = await import('../utils/autoFishingManager.js');
  const result = await startAutoFishingSession(AutoFishing, VIP, interaction.user.id, minutes);

  if (!result.success) {
    return await interaction.editReply({
      content: `❌ **Không thể bắt đầu Auto-Fishing:**\n${result.error}`
    });
  }

  const embed = new EmbedBuilder()
    .setTitle('🤖 Auto-Fishing Đã Bắt Đầu!')
    .setDescription(`**${interaction.user.username}** đã kích hoạt Auto-Fishing`)
    .addFields(
      { name: '⏰ Thời gian', value: `${result.duration} phút`, inline: true },
      { name: '🏁 Kết thúc lúc', value: `<t:${Math.floor(result.endTime.getTime()/1000)}:F>`, inline: true },
      { name: '📅 Còn lại hôm nay', value: `${result.remainingToday} phút`, inline: true },
      { name: '🎣 Trạng thái', value: '**🟢 ĐANG CHẠY**\nBot đang tự động câu cá cho bạn!', inline: false },
      { name: '💡 Lưu ý', value: '• Dùng `/auto-fishing stop` để dừng sớm\n• Dùng `/auto-fishing status` để xem tiến độ\n• Phần thưởng sẽ được tự động thêm vào tài khoản', inline: false }
    )
    .setColor('#00ff00')
    .setThumbnail(interaction.user.displayAvatarURL())
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

async function handleStop(interaction, AutoFishing, User, VIP) {
  const { stopAutoFishingSession } = await import('../utils/autoFishingManager.js');
  const result = await stopAutoFishingSession(AutoFishing, User, VIP, interaction.user.id);

  if (!result.success) {
    return await interaction.editReply({
      content: `❌ **Không thể dừng Auto-Fishing:**\n${result.error}`
    });
  }

  const fishingResults = result.results;
  
  // Create fish summary
  const fishSummary = Object.entries(fishingResults.fishByType)
    .map(([fishName, data]) => `${data.emoji} **${fishName}**: ${data.count} con (${data.totalValue.toLocaleString()} xu)`)
    .join('\n') || 'Không có cá nào';

  const embed = new EmbedBuilder()
    .setTitle('🤖 Auto-Fishing Hoàn Thành!')
    .setDescription(`**${interaction.user.username}** đã hoàn thành phiên Auto-Fishing`)
    .addFields(
      { name: '⏰ Thời gian hoạt động', value: `${result.duration} phút`, inline: true },
      { name: '🎣 Tổng số lần câu', value: `${fishingResults.totalAttempts}`, inline: true },
      { name: '📈 Hiệu suất', value: `${fishingResults.efficiency.toFixed(1)}%`, inline: true },
      { name: '🐟 Cá đã câu', value: `${fishingResults.fishCaught} con`, inline: true },
      { name: '❌ Cá hụt', value: `${fishingResults.fishMissed} lần`, inline: true },
      { name: '💰 Xu kiếm được', value: `${fishingResults.totalXu.toLocaleString()} xu`, inline: true },
      { name: '🎣 Chi tiết cá câu được', value: fishSummary, inline: false },
      { name: '💳 Số dư mới', value: `${result.newBalance.toLocaleString()} xu`, inline: true }
    )
    .setColor('#ffd700')
    .setThumbnail(interaction.user.displayAvatarURL())
    .setTimestamp();

  // Add performance rating
  let performanceRating = '';
  if (fishingResults.efficiency >= 90) {
    performanceRating = '🏆 **Xuất sắc!**';
  } else if (fishingResults.efficiency >= 80) {
    performanceRating = '🥇 **Rất tốt!**';
  } else if (fishingResults.efficiency >= 70) {
    performanceRating = '🥈 **Tốt**';
  } else if (fishingResults.efficiency >= 60) {
    performanceRating = '🥉 **Khá**';
  } else {
    performanceRating = '📈 **Cần cải thiện**';
  }

  embed.addFields({
    name: '🏅 Đánh giá hiệu suất',
    value: performanceRating,
    inline: false
  });

  await interaction.editReply({ embeds: [embed] });
}

async function handleStatus(interaction, AutoFishing, VIP) {
  const { getAutoFishingStatus } = await import('../utils/autoFishingManager.js');
  const status = await getAutoFishingStatus(AutoFishing, VIP, interaction.user.id);

  if (!status) {
    return await interaction.editReply({
      content: '❌ Không thể lấy thông tin Auto-Fishing!'
    });
  }

  const embed = new EmbedBuilder()
    .setTitle('🤖 Trạng Thái Auto-Fishing')
    .setDescription(`**${interaction.user.username}** - ${status.limits.name}`)
    .setColor(status.isActive ? '#00ff00' : '#95a5a6')
    .setThumbnail(interaction.user.displayAvatarURL())
    .setTimestamp();

  // VIP permissions
  embed.addFields({
    name: '👑 Quyền VIP',
    value: status.limits.enabled ? 
      `✅ **Được phép sử dụng**\n⏰ **Giới hạn:** ${status.limits.dailyMinutes} phút/ngày` :
      `❌ **Không có quyền**\nCần VIP Vàng hoặc cao hơn`,
    inline: false
  });

  // Current session status
  if (status.isActive) {
    const now = new Date();
    const timeLeft = Math.max(0, Math.floor((status.sessionEndTime - now) / (1000 * 60)));
    
    embed.addFields({
      name: '🟢 Phiên Hiện Tại',
      value: `**Trạng thái:** Đang chạy\n**Bắt đầu:** <t:${Math.floor(status.sessionStartTime.getTime()/1000)}:F>\n**Kết thúc:** <t:${Math.floor(status.sessionEndTime.getTime()/1000)}:F>\n**Còn lại:** ${timeLeft} phút`,
      inline: false
    });
  } else {
    embed.addFields({
      name: '⚪ Phiên Hiện Tại',
      value: '**Trạng thái:** Không hoạt động\nDùng `/auto-fishing start` để bắt đầu',
      inline: false
    });
  }

  // Daily limits
  embed.addFields({
    name: '📅 Giới Hạn Hôm Nay',
    value: `**Còn lại:** ${status.remainingTimeToday} phút\n**Tổng:** ${status.limits.dailyMinutes} phút`,
    inline: true
  });

  // Total stats
  embed.addFields({
    name: '📊 Thống Kê Tổng',
    value: `**Cá đã câu:** ${status.totalStats.fishCaught.toLocaleString()} con\n**Xu kiếm được:** ${status.totalStats.xuEarned.toLocaleString()} xu`,
    inline: true
  });

  // Usage tips
  embed.addFields({
    name: '💡 Hướng Dẫn Sử Dụng',
    value: '• `/auto-fishing start <phút>` - Bắt đầu\n• `/auto-fishing stop` - Dừng và nhận thưởng\n• `/auto-fishing status` - Xem trạng thái\n• Giới hạn reset vào 00:00 hàng ngày',
    inline: false
  });

  await interaction.editReply({ embeds: [embed] });
}