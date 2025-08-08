import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('🎁 Nhận phần thưởng hàng ngày'),

  async execute(interaction) {
    try {
      const { DailyReward } = await import('../schemas/dailyRewardSchema.js');
      const { User } = await import('../schemas/userSchema.js');

      await interaction.deferReply();

      // Tìm hoặc tạo daily reward record
      let dailyReward = await DailyReward.findOne({ userId: interaction.user.id });
      
      if (!dailyReward) {
        dailyReward = new DailyReward({
          userId: interaction.user.id,
          username: interaction.user.username
        });
      }

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const lastClaim = dailyReward.lastClaimDate ? 
        new Date(dailyReward.lastClaimDate.getFullYear(), dailyReward.lastClaimDate.getMonth(), dailyReward.lastClaimDate.getDate()) : null;

      // Check if already claimed today
      if (lastClaim && lastClaim.getTime() === today.getTime()) {
        const nextClaimTime = new Date(today);
        nextClaimTime.setDate(nextClaimTime.getDate() + 1);
        
        const embed = new EmbedBuilder()
          .setTitle('⏰ Đã nhận thưởng hôm nay!')
          .setDescription('**Bạn đã nhận phần thưởng hàng ngày rồi!**')
          .addFields(
            { name: '🔄 Thời gian nhận tiếp theo', value: `<t:${Math.floor(nextClaimTime.getTime()/1000)}:R>`, inline: true },
            { name: '🔥 Streak hiện tại', value: `${dailyReward.currentStreak} ngày`, inline: true },
            { name: '📊 Tổng đã nhận', value: `${dailyReward.totalClaims} lần`, inline: true }
          )
          .setColor('#ff9900')
          .setTimestamp();

        return await interaction.editReply({ embeds: [embed] });
      }

      // Calculate streak
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (!lastClaim) {
        // First time claiming
        dailyReward.currentStreak = 1;
      } else if (lastClaim.getTime() === yesterday.getTime()) {
        // Consecutive day
        dailyReward.currentStreak += 1;
      } else {
        // Streak broken
        dailyReward.currentStreak = 1;
      }

      // Update longest streak
      if (dailyReward.currentStreak > dailyReward.longestStreak) {
        dailyReward.longestStreak = dailyReward.currentStreak;
      }

      // Calculate rewards with random system and streak luck
      const minReward = 1;
      const maxReward = 1000;
      
      // Streak luck system - càng cao streak càng có tỷ lệ ra số lớn
      // Streak 1-7: Normal luck
      // Streak 8-30: Good luck (bias toward higher numbers)
      // Streak 31+: Great luck (heavy bias toward higher numbers)
      
      let baseRandomReward;
      const rand = Math.random();
      
      if (dailyReward.currentStreak <= 7) {
        // Normal distribution (1-1000)
        baseRandomReward = Math.floor(Math.random() * maxReward) + minReward;
      } else if (dailyReward.currentStreak <= 30) {
        // Good luck - 60% chance for upper half (500-1000), 40% for lower half (1-499)
        if (rand < 0.6) {
          baseRandomReward = Math.floor(Math.random() * 501) + 500; // 500-1000
        } else {
          baseRandomReward = Math.floor(Math.random() * 499) + 1; // 1-499
        }
      } else {
        // Great luck - 80% chance for upper half, 20% for lower half
        if (rand < 0.8) {
          baseRandomReward = Math.floor(Math.random() * 501) + 500; // 500-1000
        } else {
          baseRandomReward = Math.floor(Math.random() * 499) + 1; // 1-499
        }
      }
      
      // Streak multiplier bonus (separate from random)
      const streakMultiplier = Math.min(dailyReward.currentStreak, 50); // Cap at 50 days
      const streakBonus = Math.floor(baseRandomReward * 0.02 * streakMultiplier); // 2% per day
      
      // Special milestone bonuses (unchanged)
      let milestoneBonus = 0;
      let milestoneText = '';
      
      if (dailyReward.currentStreak === 7) {
        milestoneBonus = 5000;
        milestoneText = '🎉 **WEEKLY BONUS!**';
      } else if (dailyReward.currentStreak === 30) {
        milestoneBonus = 20000;
        milestoneText = '🎊 **MONTHLY BONUS!**';
      } else if (dailyReward.currentStreak === 100) {
        milestoneBonus = 100000;
        milestoneText = '👑 **LEGENDARY STREAK BONUS!**';
      }

      // Weekend bonus (percentage of base reward)
      const dayOfWeek = now.getDay();
      const weekendBonus = (dayOfWeek === 0 || dayOfWeek === 6) ? Math.floor(baseRandomReward * 0.5) : 0;
      const weekendText = weekendBonus > 0 ? '🌟 **WEEKEND BONUS!**' : '';

      // Lucky streak bonus (extra chance for big rewards)
      let luckyBonus = 0;
      let luckyText = '';
      if (dailyReward.currentStreak >= 10) {
        const luckyChance = Math.min(dailyReward.currentStreak * 2, 20) / 100; // Max 20% chance
        if (Math.random() < luckyChance) {
          luckyBonus = Math.floor(Math.random() * 2000) + 500; // 500-2500 xu
          luckyText = '🍀 **LUCKY STREAK BONUS!**';
        }
      }

      const totalReward = baseRandomReward + streakBonus + milestoneBonus + weekendBonus + luckyBonus;

      // Update user balance
      let user = await User.findOne({ discordId: interaction.user.id });
      if (!user) {
        user = new User({
          discordId: interaction.user.id,
          username: interaction.user.username,
          balance: 0
        });
      }

      user.balance += totalReward;
      await user.save();

      // Update daily reward record
      dailyReward.lastClaimDate = now;
      dailyReward.totalClaims += 1;
      dailyReward.totalRewards += totalReward;
      dailyReward.wheelSpinUsed = false; // Reset daily wheel spin
      dailyReward.username = interaction.user.username; // Update username
      await dailyReward.save();

      // Determine luck level text
      let luckLevel = '';
      if (dailyReward.currentStreak <= 7) {
        luckLevel = '🎲 **Normal Luck**';
      } else if (dailyReward.currentStreak <= 30) {
        luckLevel = '🍀 **Good Luck** (60% tỷ lệ ra số cao)';
      } else {
        luckLevel = '✨ **Great Luck** (80% tỷ lệ ra số cao)';
      }

      // Create success embed
      const embed = new EmbedBuilder()
        .setTitle('🎁 Phần Thưởng Hàng Ngày!')
        .setDescription(`**Chúc mừng ${interaction.user.username}!**\n${milestoneText}\n${weekendText}\n${luckyText}`)
        .addFields(
          { name: '🎲 Random reward', value: `${baseRandomReward.toLocaleString()} xu`, inline: true },
          { name: '🔥 Streak bonus', value: `+${streakBonus.toLocaleString()} xu (${dailyReward.currentStreak} ngày)`, inline: true },
          { name: '🎊 Bonus khác', value: `+${(milestoneBonus + weekendBonus + luckyBonus).toLocaleString()} xu`, inline: true },
          { name: '🎯 Tổng nhận được', value: `**${totalReward.toLocaleString()} xu**`, inline: false },
          { name: '💳 Số dư mới', value: `${user.balance.toLocaleString()} xu`, inline: true },
          { name: '📈 Streak & Luck', value: `${dailyReward.currentStreak} ngày\n${luckLevel}`, inline: true },
          { name: '🏆 Streak cao nhất', value: `${dailyReward.longestStreak} ngày`, inline: true }
        )
        .setColor('#00ff00')
        .setThumbnail(interaction.user.displayAvatarURL())
        .setFooter({ text: 'Streak càng cao = tỷ lệ ra xu nhiều càng cao!' })
        .setTimestamp();

      // Add special messages for milestones
      if (dailyReward.currentStreak === 7) {
        embed.addFields({ name: '🎁 Thành tích mở khóa', value: '**Weekly Warrior** - Bạn đã duy trì streak 1 tuần!', inline: false });
      } else if (dailyReward.currentStreak === 30) {
        embed.addFields({ name: '🏅 Thành tích mở khóa', value: '**Monthly Master** - Bạn đã duy trì streak 1 tháng!', inline: false });
      } else if (dailyReward.currentStreak === 100) {
        embed.addFields({ name: '👑 Thành tích mở khóa', value: '**Legendary Collector** - Streak 100 ngày! Bạn quá đỉnh!', inline: false });
      }

      await interaction.editReply({ embeds: [embed] });

      console.log(`🎁 Daily reward claimed by ${interaction.user.username}: ${totalReward} xu (streak: ${dailyReward.currentStreak})`);

    } catch (error) {
      console.error('❌ Daily reward error:', error);
      
      try {
        await interaction.editReply({
          content: '❌ **Có lỗi khi nhận phần thưởng hàng ngày!**\n\nVui lòng thử lại sau.',
          ephemeral: true
        });
      } catch (replyError) {
        console.error('❌ Could not send error reply:', replyError);
      }
    }
  }
};