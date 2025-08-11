import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getOrCreateVIP, getVIPPerks } from '../utils/vip.js';
import { User } from '../schemas/userSchema.js';

function getTodayDateString() {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

// Map để theo dõi users đang auto-fishing
const activeAutoFishing = new Map();

// Export để các lệnh khác có thể sử dụng
export { activeAutoFishing };

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
      // Kiểm tra nếu user đang auto-fishing
      if (activeAutoFishing.has(interaction.user.id)) {
        await interaction.reply({
          content: '❌ Bạn đang có phiên auto-fishing khác đang chạy! Vui lòng chờ hoàn thành.',
          flags: 64
        });
        return;
      }

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
      if (!user.autoFishingToday) {
        user.autoFishingToday = { date: todayKey, minutes: 0 };
      } else if (user.autoFishingToday.date !== todayKey) {
        user.autoFishingToday = { date: todayKey, minutes: 0 };
      }

      // Nếu schema cũ không có autoFishingToday, tạo field tạm thời
      if (!user.autoFishingToday) {
        // Fallback: sử dụng field khác hoặc tạo object tạm
        const tempKey = `autofish_${todayKey}`;
        if (!user[tempKey]) {
          user[tempKey] = 0;
        }
        user.autoFishingToday = { date: todayKey, minutes: user[tempKey] || 0 };
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

      // Trừ thời gian ngay từ đầu để tránh lỗi
      user.autoFishingToday.minutes += duration;
      
      // Nếu sử dụng fallback field, cập nhật cả hai
      const tempKey = `autofish_${todayKey}`;
      if (user[tempKey] !== undefined) {
        user[tempKey] = user.autoFishingToday.minutes;
      }
      
      // Log để debug
      console.log(`Auto-fishing time used: ${user.autoFishingToday.minutes}/${maxDuration} minutes for user ${interaction.user.username}`);
      
      await user.save();

      // Đánh dấu user đang auto-fishing
      activeAutoFishing.set(interaction.user.id, {
        startTime: Date.now(),
        duration: duration,
        endTime: Date.now() + (duration * 60 * 1000)
      });

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
          // Xóa user khỏi danh sách đang auto-fishing
          activeAutoFishing.delete(interaction.user.id);
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

        // Cập nhật coins cho user (sử dụng field xu thay vì money)
                user.balance = (user.balance || 0) + coinsEarned;
        user.fish = user.fish || new Map();
        
        // Import fishtype để sử dụng fish data thực
        let fishTypes = ['Cá chép', 'Cá rô', 'Cá trắm', 'Cá lóc']; // Fallback
        try {
          const fishModule = await import('../fishtype.js').catch(() => null);
          if (fishModule && fishModule.fishtype) {
            fishTypes = Object.keys(fishModule.fishtype);
          }
        } catch (error) {
          console.log('Không thể load fishtype, sử dụng default fish list');
        }
        
        // Thêm cá vào inventory với weighted random dựa trên rarity
        const caughtFish = {};
        for (let i = 0; i < fishCaught; i++) {
          let selectedFish;
          
          try {
            const fishModule = await import('../fishtype.js').catch(() => null);
            if (fishModule && fishModule.fishtype) {
              // Sử dụng weighted random dựa trên rarity
              const fishEntries = Object.entries(fishModule.fishtype);
              const weights = fishEntries.map(([name, data]) => {
                const rarity = data.rarity || 'common';
                switch (rarity) {
                  case 'legendary': return 1;
                  case 'epic': return 3;
                  case 'rare': return 10;
                  case 'uncommon': return 25;
                  case 'common': 
                  default: return 60;
                }
              });
              
              const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
              let random = Math.random() * totalWeight;
              
              for (let j = 0; j < fishEntries.length; j++) {
                random -= weights[j];
                if (random <= 0) {
                  selectedFish = fishEntries[j][0];
                  break;
                }
              }
            }
          } catch (error) {
            console.log('Error in weighted selection, using random');
          }
          
          // Fallback nếu không có fishtype
          if (!selectedFish) {
            selectedFish = fishTypes[Math.floor(Math.random() * fishTypes.length)];
          }
          
          // Cập nhật user.fish (logic cũ)
          user.fish.set(selectedFish, (user.fish.get(selectedFish) || 0) + 1);
          
          // Track cho hiển thị
          caughtFish[selectedFish] = (caughtFish[selectedFish] || 0) + 1;
        }

        // Lưu kết quả (thời gian đã được trừ từ đầu)
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

      // Cleanup khi có lỗi hoặc user rời
      setTimeout(() => {
        if (activeAutoFishing.has(interaction.user.id)) {
          activeAutoFishing.delete(interaction.user.id);
          console.log(`Cleaned up auto-fishing session for ${interaction.user.username}`);
        }
      }, (duration + 1) * 60 * 1000); // Cleanup sau duration + 1 phút

    } catch (error) {
      console.error('Auto-fishing command error:', error);
      // Xóa user khỏi danh sách nếu có lỗi
      activeAutoFishing.delete(interaction.user.id);
      await interaction.reply({
        content: '❌ Có lỗi xảy ra với tự động câu cá. Vui lòng thử lại!',
        flags: 64
      });
    }
  }
};