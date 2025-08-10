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

      if (requestedDuration > available) {
        await interaction.reply({
          content: `⚠️ Bạn chỉ còn ${available} phút auto-fishing cho hôm nay. Sẽ chạy ${duration} phút.`,
          ephemeral: true
        });
      }

      // Bắt đầu tiến trình câu cá
      const startTime = Date.now();
      const endTime = startTime + (duration * 60 * 1000);
      
      // Embed ban đầu
      const progressEmbed = new EmbedBuilder()
        .setTitle('🎣 Đang Tự Động Câu Cá...')
        .setDescription('Tiến trình câu cá đang diễn ra!')
        .setColor(vipPerks.color)
        .addFields(
          { name: '⏱️ Thời gian', value: `${duration} phút`, inline: true },
          { name: '👑 VIP Tier', value: vipPerks.tier, inline: true },
          { name: '📊 Tiến độ', value: '▱▱▱▱▱▱▱▱▱▱ 0%', inline: false }
        )
        .setFooter({ text: 'Đang câu cá... Vui lòng chờ!' })
        .setTimestamp();

      const reply = await interaction.reply({ 
        embeds: [progressEmbed],
        fetchReply: true 
      });

      // Cập nhật tiến trình mỗi 10 giây
      const updateInterval = setInterval(async () => {
        const currentTime = Date.now();
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / (duration * 60 * 1000), 1);
        const percentage = Math.floor(progress * 100);
        
        // Tạo thanh tiến trình
        const filledBars = Math.floor(progress * 10);
        const emptyBars = 10 - filledBars;
        const progressBar = '▰'.repeat(filledBars) + '▱'.repeat(emptyBars);
        
        // Tính số cá đã câu tạm thời
        const tempFishCaught = Math.floor(progress * (Math.floor(Math.random() * (duration * 2)) + duration));
        
        const updatedEmbed = new EmbedBuilder()
          .setTitle('🎣 Đang Tự Động Câu Cá...')
          .setDescription(`Tiến trình: ${Math.floor(elapsed / 60000)}/${duration} phút`)
          .setColor(vipPerks.color)
          .addFields(
            { name: '⏱️ Thời gian còn lại', value: `${Math.max(0, Math.ceil((endTime - currentTime) / 60000))} phút`, inline: true },
            { name: '🐟 Cá đã câu', value: `~${tempFishCaught} con`, inline: true },
            { name: '👑 VIP Tier', value: vipPerks.tier, inline: true },
            { name: '📊 Tiến độ', value: `${progressBar} ${percentage}%`, inline: false }
          )
          .setFooter({ text: percentage < 100 ? 'Đang câu cá... Vui lòng chờ!' : 'Sắp hoàn thành!' })
          .setTimestamp();

        await interaction.editReply({ embeds: [updatedEmbed] });

        if (currentTime >= endTime) {
          clearInterval(updateInterval);
          await completeAutoFishing();
        }
      }, 10000); // Cập nhật mỗi 10 giây

      async function completeAutoFishing() {
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

        // Cập nhật quota auto-fishing (trừ thời gian đã sử dụng)
        user.autoFishingToday.minutes += duration;
        await user.save();

        // Kết quả hoàn thành
        const remainingMinutes = Math.max(0, maxDuration - user.autoFishingToday.minutes);
        const completedEmbed = new EmbedBuilder()
          .setTitle('� Tự Động Câu Cá Hoàn Thành!')
          .setDescription(`Đã hoàn thành ${duration} phút tự động câu cá!`)
          .setColor('#00FF00')
          .addFields(
            { name: '🐟 Cá đã câu', value: `${fishCaught} con`, inline: true },
            { name: '💰 Tiền kiếm được', value: `${coinsEarned.toLocaleString()} coins`, inline: true },
            { name: '⏱️ Thời gian sử dụng', value: `${duration} phút`, inline: true },
            { name: '🕒 Đã dùng hôm nay', value: `${user.autoFishingToday.minutes}/${maxDuration} phút`, inline: true },
            { name: '👑 VIP Tier', value: vipPerks.tier, inline: true },
            { name: '🟢 Thời gian còn lại', value: `${remainingMinutes} phút`, inline: true },
            { name: '📊 Tiến độ', value: '▰▰▰▰▰▰▰▰▰▰ 100% ✅', inline: false }
          )
          .setFooter({ text: `${vipPerks.tier} - Giới hạn ${maxDuration} phút/ngày` })
          .setTimestamp();

        await interaction.editReply({ embeds: [completedEmbed] });
      }

    } catch (error) {
      console.error('Auto-fishing command error:', error);
      await interaction.reply({
        content: '❌ Có lỗi xảy ra với tự động câu cá. Vui lòng thử lại!',
        ephemeral: true
      });
    }
  }
};