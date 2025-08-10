import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getOrCreateVIP, getVIPPerks } from '../utils/vip.js';
import { User } from '../schemas/userSchema.js';

function getTodayDateString() {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

export default {
  data: new SlashCommandBuilder()
    .setName('auto-fishing')
    .setDescription('🎣 Tự động câu cá (chỉ dành cho VIP)')
    .addIntegerOption(option =>
      option.setName('duration')
        .setDescription('Thời gian tự động câu (phút)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(720)),
  async execute(interaction) {
    try {
      // Kiểm tra VIP
      const vip = await getOrCreateVIP(interaction.user.id, interaction.user.username);
      if (!vip || !vip.isVipActive()) {
        await interaction.reply({
          content: '❌ Chỉ thành viên VIP mới được sử dụng auto-fishing. Hãy mua VIP tại `/vip-shop`!',
          ephemeral: true
        });
        return;
      }

      const vipPerks = getVIPPerks(vip);
      const maxDuration = vipPerks.autoFishingTime;
      const todayKey = getTodayDateString();

      // Lấy user từ schema hiện có
      let user = await User.findOne({ discordId: interaction.user.id });
      if (!user) {
        await interaction.reply({
          content: '❌ Không tìm thấy thông tin user. Hãy sử dụng lệnh khác trước!',
          ephemeral: true
        });
        return;
      }

      // Khởi tạo hoặc reset autoFishingToday nếu sang ngày mới
      if (!user.autoFishingToday || user.autoFishingToday.date !== todayKey) {
        user.autoFishingToday = { date: todayKey, minutes: 0 };
      }

      // Kiểm tra quota
      const usedToday = user.autoFishingToday.minutes;
      if (usedToday >= maxDuration) {
        await interaction.reply({
          content: `❌ Bạn đã dùng hết ${maxDuration} phút auto-fishing cho hôm nay. Hãy quay lại vào ngày mai!`,
          ephemeral: true
        });
        return;
      }

      // Xác định thời lượng hợp lệ
      const requestedDuration = interaction.options.getInteger('duration') || 10;
      const available = maxDuration - usedToday;
      const duration = Math.min(requestedDuration, available);

      // Simulate auto-fishing với logic giống lệnh fish hiện có
      const fishCaught = Math.floor(Math.random() * (duration * 2)) + duration;
      const baseCoinsPerFish = Math.floor(Math.random() * 50) + 25;
      let coinsEarned = fishCaught * baseCoinsPerFish;
      
      // Áp dụng VIP bonus
      coinsEarned = Math.floor(coinsEarned * vipPerks.coinMultiplier);

      // Cập nhật coins cho user (giữ logic cũ)
      user.money = (user.money || 0) + coinsEarned;
      user.fish = user.fish || new Map();
      
      // Thêm cá vào inventory (giữ logic cũ)
      const fishTypes = ['Cá chép', 'Cá rô', 'Cá trắm', 'Cá lóc'];
      for (let i = 0; i < fishCaught; i++) {
        const fishType = fishTypes[Math.floor(Math.random() * fishTypes.length)];
        user.fish.set(fishType, (user.fish.get(fishType) || 0) + 1);
      }

      // Cập nhật quota auto-fishing
      user.autoFishingToday.minutes += duration;
      await user.save();

      // Kết quả
      const embed = new EmbedBuilder()
        .setTitle('🎣 Tự Động Câu Cá')
        .setDescription(`Đã hoàn thành ${duration} phút tự động câu cá!`)
        .setColor(vipPerks.color)
        .addFields(
          { name: '🐟 Cá đã câu', value: `${fishCaught} con`, inline: true },
          { name: '💰 Tiền kiếm được', value: `${coinsEarned.toLocaleString()} coins`, inline: true },
          { name: '⏱️ Thời gian', value: `${duration} phút`, inline: true },
          { name: '🕒 Đã dùng hôm nay', value: `${user.autoFishingToday.minutes}/${maxDuration} phút`, inline: true },
          { name: '👑 VIP Tier', value: vipPerks.tier, inline: true },
          { name: '🟢 Quota còn lại', value: `${Math.max(0, maxDuration - user.autoFishingToday.minutes)} phút`, inline: true }
        )
        .setFooter({ text: `${vipPerks.tier} - Coin bonus x${vipPerks.coinMultiplier}` })
        .setTimestamp();

      if (requestedDuration > available) {
        embed.addFields({
          name: '⚠️ Giới hạn thời gian',
          value: `Bạn chỉ còn ${available} phút auto-fishing cho hôm nay.`,
          inline: false
        });
      }

      await interaction.reply({ embeds: [embed] });

    } catch (error) {
      console.error('Auto-fishing command error:', error);
      await interaction.reply({
        content: '❌ Có lỗi xảy ra với tự động câu cá. Vui lòng thử lại!',
        ephemeral: true
      });
    }
  }
};