import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('daily-stats')
    .setDescription('📊 Xem thống kê phần thưởng hàng ngày của bạn'),

  async execute(interaction) {
    try {
      const { DailyReward } = await import('../schemas/dailyRewardSchema.js');

      await interaction.deferReply({ ephemeral: true });

      // Tìm daily reward record
      const dailyReward = await DailyReward.findOne({ userId: interaction.user.id });
      
      if (!dailyReward) {
        const embed = new EmbedBuilder()
          .setTitle('📊 Thống Kê Daily Rewards')
          .setDescription('**Bạn chưa nhận phần thưởng hàng ngày nào!**\n\n💡 Dùng `/daily` để bắt đầu nhận thưởng.')
          .setColor('#ff9900')
          .setTimestamp();

        return await interaction.editReply({ embeds: [embed] });
      }

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const lastClaim = dailyReward.lastClaimDate ? 
        new Date(dailyReward.lastClaimDate.getFullYear(), dailyReward.lastClaimDate.getMonth(), dailyReward.lastClaimDate.getDate()) : null;

      // Check if claimed today
      const claimedToday = lastClaim && lastClaim.getTime() === today.getTime();

      // Calculate next reward preview with random system
      const nextStreak = claimedToday ? dailyReward.currentStreak : dailyReward.currentStreak + 1;
      
      // Estimate average based on luck level
      let estimatedBaseReward;
      if (nextStreak <= 7) {
        estimatedBaseReward = 500; // Average of 1-1000
      } else if (nextStreak <= 30) {
        estimatedBaseReward = 650; // 60% chance for 500-1000 (avg 750) + 40% chance for 1-499 (avg 250) = 650
      } else {
        estimatedBaseReward = 700; // 80% chance for 500-1000 (avg 750) + 20% chance for 1-499 (avg 250) = 700
      }
      
      const nextStreakBonus = Math.floor(estimatedBaseReward * 0.02 * Math.min(nextStreak, 50));
      
      // Weekend bonus preview
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowWeekendBonus = (tomorrow.getDay() === 0 || tomorrow.getDay() === 6) ? Math.floor(estimatedBaseReward * 0.5) : 0;
      
      // Lucky bonus estimate
      let estimatedLuckyBonus = 0;
      if (nextStreak >= 10) {
        const luckyChance = Math.min(nextStreak * 2, 20) / 100;
        estimatedLuckyBonus = Math.floor(luckyChance * 1500); // Average lucky bonus * chance
      }
      
      let nextMilestoneBonus = 0;
      let nextMilestoneText = '';
      
      if (nextStreak === 7) {
        nextMilestoneBonus = 5000;
        nextMilestoneText = ' + 🎉 **Weekly Bonus!**';
      } else if (nextStreak === 30) {
        nextMilestoneBonus = 20000;
        nextMilestoneText = ' + 🎊 **Monthly Bonus!**';
      } else if (nextStreak === 100) {
        nextMilestoneBonus = 100000;
        nextMilestoneText = ' + 👑 **Legendary Bonus!**';
      }

      const estimatedTotalReward = estimatedBaseReward + nextStreakBonus + nextMilestoneBonus + tomorrowWeekendBonus + estimatedLuckyBonus;

      // Calculate average reward per day
      const averageReward = dailyReward.totalClaims > 0 ? Math.floor(dailyReward.totalRewards / dailyReward.totalClaims) : 0;

      // Status emoji
      const statusEmoji = claimedToday ? '✅' : '⏰';
      const statusText = claimedToday ? 'Đã nhận hôm nay' : 'Chưa nhận hôm nay';

      // Determine current luck level
      let currentLuckLevel = '';
      if (dailyReward.currentStreak <= 7) {
        currentLuckLevel = '🎲 Normal Luck';
      } else if (dailyReward.currentStreak <= 30) {
        currentLuckLevel = '🍀 Good Luck (60% tỷ lệ cao)';
      } else {
        currentLuckLevel = '✨ Great Luck (80% tỷ lệ cao)';
      }

      const embed = new EmbedBuilder()
        .setTitle('📊 Thống Kê Daily Rewards')
        .setDescription(`**${interaction.user.username}**`)
        .addFields(
          { name: '🎯 Trạng thái hôm nay', value: `${statusEmoji} ${statusText}`, inline: true },
          { name: '🔥 Streak hiện tại', value: `${dailyReward.currentStreak} ngày`, inline: true },
          { name: '🏆 Streak cao nhất', value: `${dailyReward.longestStreak} ngày`, inline: true },
          { name: '📈 Tổng số lần nhận', value: `${dailyReward.totalClaims} lần`, inline: true },
          { name: '💰 Tổng xu đã nhận', value: `${dailyReward.totalRewards.toLocaleString()} xu`, inline: true },
          { name: '📊 Trung bình mỗi ngày', value: `${averageReward.toLocaleString()} xu`, inline: true },
          { name: '� Luck Level hiện tại', value: currentLuckLevel, inline: false },
          { name: '�🎁 Ước tính phần thưởng lần tới', value: `${estimatedTotalReward.toLocaleString()} xu${nextMilestoneText}`, inline: false }
        )
        .setColor('#3498db')
        .setThumbnail(interaction.user.displayAvatarURL())
        .setTimestamp();

      // Add next claim time if already claimed today
      if (claimedToday) {
        const nextClaimTime = new Date(today);
        nextClaimTime.setDate(nextClaimTime.getDate() + 1);
        embed.addFields({ name: '⏰ Nhận tiếp theo', value: `<t:${Math.floor(nextClaimTime.getTime()/1000)}:R>`, inline: true });
      } else {
        embed.addFields({ name: '⚡ Có thể nhận ngay', value: 'Dùng `/daily` để nhận!', inline: true });
      }

      // Add milestone progress
      let nextMilestone = '';
      if (dailyReward.currentStreak < 7) {
        nextMilestone = `🎯 **${7 - dailyReward.currentStreak} ngày** nữa để đạt Weekly Bonus (5,000 xu)`;
      } else if (dailyReward.currentStreak < 30) {
        nextMilestone = `🎯 **${30 - dailyReward.currentStreak} ngày** nữa để đạt Monthly Bonus (20,000 xu)`;
      } else if (dailyReward.currentStreak < 100) {
        nextMilestone = `🎯 **${100 - dailyReward.currentStreak} ngày** nữa để đạt Legendary Bonus (100,000 xu)`;
      } else {
        nextMilestone = '👑 **Bạn đã đạt tất cả milestone!** Tiếp tục duy trì streak để nhận thưởng hàng ngày.';
      }

      embed.addFields({ name: '🎯 Milestone tiếp theo', value: nextMilestone, inline: false });

      // Add fun facts
      const daysSinceStart = dailyReward.createdAt ? Math.floor((now - dailyReward.createdAt) / (1000 * 60 * 60 * 24)) : 0;
      const consistency = dailyReward.totalClaims > 0 && daysSinceStart > 0 ? Math.floor((dailyReward.totalClaims / daysSinceStart) * 100) : 0;
      
      if (daysSinceStart > 0) {
        embed.addFields({ 
          name: '📈 Thống kê thêm', 
          value: `**Consistency:** ${consistency}% (${dailyReward.totalClaims}/${daysSinceStart} ngày)\n**Tham gia từ:** <t:${Math.floor(dailyReward.createdAt.getTime()/1000)}:d>`, 
          inline: false 
        });
      }

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('❌ Daily stats error:', error);
      
      try {
        await interaction.editReply({
          content: '❌ **Có lỗi khi lấy thống kê daily rewards!**\n\nVui lòng thử lại sau.'
        });
      } catch (replyError) {
        console.error('❌ Could not send error reply:', replyError);
      }
    }
  }
};