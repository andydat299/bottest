import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getOrCreateVIP, getVIPPerks } from '../utils/vip.js';
import { User } from '../schemas/userSchema.js';

function getTodayDateString() {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

export default {
  data: new SlashCommandBuilder()
    .setName('check-quota')
    .setDescription('🔍 Kiểm tra quota auto-fishing hôm nay'),
  async execute(interaction) {
    try {
      // Kiểm tra VIP
      const vip = await getOrCreateVIP(interaction.user.id, interaction.user.username);
      if (!vip || !vip.isVipActive()) {
        await interaction.reply({
          content: '❌ Chỉ thành viên VIP mới có quota auto-fishing.',
          flags: 64
        });
        return;
      }

      const vipPerks = getVIPPerks(vip);
      const maxDuration = vipPerks.autoFishingTime;
      const todayKey = getTodayDateString();

      // Lấy user
      const user = await User.findOne({ discordId: interaction.user.id });
      if (!user) {
        await interaction.reply({
          content: '❌ Không tìm thấy thông tin user.',
          flags: 64
        });
        return;
      }

      // Kiểm tra quota
      let usedToday = 0;
      if (user.autoFishingToday && user.autoFishingToday.date === todayKey) {
        usedToday = user.autoFishingToday.minutes;
      } else if (user[`autofish_${todayKey}`]) {
        usedToday = user[`autofish_${todayKey}`];
      }

      const remaining = Math.max(0, maxDuration - usedToday);
      const percentage = Math.floor((usedToday / maxDuration) * 100);

      // Tạo thanh tiến độ
      const filledBars = Math.floor((usedToday / maxDuration) * 10);
      const emptyBars = 10 - filledBars;
      const progressBar = '▰'.repeat(filledBars) + '▱'.repeat(emptyBars);

      const embed = new EmbedBuilder()
        .setTitle('🔍 Quota Auto-Fishing Hôm Nay')
        .setColor(vipPerks.color)
        .addFields(
          { name: '👑 VIP Tier', value: vipPerks.tier, inline: true },
          { name: '⏱️ Giới hạn/ngày', value: `${maxDuration} phút`, inline: true },
          { name: '🕒 Đã sử dụng', value: `${usedToday} phút`, inline: true },
          { name: '🟢 Còn lại', value: `${remaining} phút`, inline: true },
          { name: '📊 Phần trăm', value: `${percentage}%`, inline: true },
          { name: '📅 Ngày', value: todayKey, inline: true },
          { name: '📈 Tiến độ', value: `${progressBar} ${percentage}%`, inline: false }
        )
        .setFooter({ text: 'Quota sẽ reset vào 00:00 hàng ngày' })
        .setTimestamp();

      // Kiểm tra field data
      const debugInfo = {
        hasAutoFishingToday: !!user.autoFishingToday,
        autoFishingTodayData: user.autoFishingToday,
        hasFallbackField: !!user[`autofish_${todayKey}`],
        fallbackValue: user[`autofish_${todayKey}`]
      };

      if (process.env.NODE_ENV === 'development') {
        embed.addFields({
          name: '🛠️ Debug Info',
          value: `\`\`\`json\n${JSON.stringify(debugInfo, null, 2)}\`\`\``,
          inline: false
        });
      }

      await interaction.reply({ embeds: [embed], flags: 64 });

    } catch (error) {
      console.error('Check quota error:', error);
      await interaction.reply({
        content: '❌ Có lỗi xảy ra khi kiểm tra quota!',
        flags: 64
      });
    }
  }
};