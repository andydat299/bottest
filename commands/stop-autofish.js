import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { activeAutoFishing } from './auto-fishing.js';
import { User } from '../schemas/userSchema.js';
import { getOrCreateVIP, getVIPPerks } from '../utils/vip.js';

export default {
  data: new SlashCommandBuilder()
    .setName('stop-autofish')
    .setDescription('🛑 Dừng auto-fishing đang chạy'),
  async execute(interaction) {
    try {
      // Kiểm tra user có đang auto-fishing không
      if (!activeAutoFishing.has(interaction.user.id)) {
        await interaction.reply({
          content: '❌ Bạn không có phiên auto-fishing nào đang chạy!',
          flags: 64
        });
        return;
      }

      // Lấy thông tin phiên auto-fishing
      const session = activeAutoFishing.get(interaction.user.id);
      const currentTime = Date.now();
      const elapsedTime = currentTime - session.startTime;
      const elapsedMinutes = Math.floor(elapsedTime / (60 * 1000));
      const totalMinutes = session.duration;

      // Tính toán kết quả dựa trên thời gian đã trôi qua
      const progress = Math.min(elapsedMinutes / totalMinutes, 1);
      const fishCaught = Math.floor(progress * (Math.floor(Math.random() * (totalMinutes * 2)) + totalMinutes));
      const baseCoinsPerFish = Math.floor(Math.random() * 50) + 25;
      let coinsEarned = fishCaught * baseCoinsPerFish;

      // Lấy VIP perks để áp dụng bonus
      const vip = await getOrCreateVIP(interaction.user.id, interaction.user.username);
      const vipPerks = getVIPPerks(vip);
      if (vipPerks) {
        coinsEarned = Math.floor(coinsEarned * vipPerks.coinMultiplier);
      }

      // Cập nhật database
      let caughtFish = {}; // Khởi tạo caughtFish ở đây
      const user = await User.findOne({ discordId: interaction.user.id });
      if (user && fishCaught > 0) {
        // Cập nhật balance
        user.balance = (user.balance || 0) + coinsEarned;
        user.fish = user.fish || new Map();

        // Thêm cá vào inventory
        let fishTypes = ['Cá chép', 'Cá rô', 'Cá trắm', 'Cá lóc']; // Fallback
        try {
          const fishModule = await import('../fishtype.js').catch(() => null);
          if (fishModule && fishModule.fishtype) {
            fishTypes = Object.keys(fishModule.fishtype);
          }
        } catch (error) {
          console.log('Không thể load fishtype, sử dụng default fish list');
        }

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
          
          // Cập nhật user.fish
          user.fish.set(selectedFish, (user.fish.get(selectedFish) || 0) + 1);
          
          // Track cho hiển thị
          caughtFish[selectedFish] = (caughtFish[selectedFish] || 0) + 1;
        }

        await user.save();
      } else if (!user) {
        console.warn(`User not found in database: ${interaction.user.username} (${interaction.user.id})`);
      }

      // Xóa khỏi danh sách active
      activeAutoFishing.delete(interaction.user.id);

      // Tạo embed thông báo kết quả
      const embed = new EmbedBuilder()
        .setTitle('🛑 Đã Dừng Auto-Fishing')
        .setDescription(`Đã dừng phiên auto-fishing sau **${elapsedMinutes}/${totalMinutes} phút**`)
        .setColor('#FFA500')
        .addFields(
          { name: '⏱️ Thời gian chạy', value: `${elapsedMinutes} phút (${Math.round(progress * 100)}% hoàn thành)`, inline: true },
          { name: '🐟 Cá đã câu', value: `${fishCaught} con`, inline: true },
          { name: '💰 Tiền kiếm được', value: `${coinsEarned.toLocaleString()} xu`, inline: true },
          { name: '📊 Hiệu suất', value: `${elapsedMinutes > 0 ? Math.round(fishCaught / elapsedMinutes) : 0} cá/phút`, inline: true },
          { name: '👑 VIP Bonus', value: vipPerks ? `x${vipPerks.coinMultiplier} (${vipPerks.tier})` : 'Không có', inline: true },
          { name: '💳 Số dư mới', value: `${(user?.balance || 0).toLocaleString()} xu`, inline: true }
        )
        .setFooter({ text: 'Auto-fishing đã được dừng và kết quả đã được lưu' })
        .setTimestamp();

      // Hiển thị top 3 loại cá đã câu (nếu có)
      if (fishCaught > 0 && Object.keys(caughtFish).length > 0) {
        const topFish = Object.entries(caughtFish)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([fish, count]) => `${fish}: ${count} con`)
          .join('\n');
        
        if (topFish) {
          embed.addFields({ name: '🎣 Top cá đã câu', value: topFish, inline: false });
        }
      }

      await interaction.reply({ embeds: [embed] });

      console.log(`User ${interaction.user.username} stopped auto-fishing after ${elapsedMinutes} minutes. Earned ${coinsEarned} coins, caught ${fishCaught} fish.`);

    } catch (error) {
      console.error('Stop auto-fishing error:', error);
      
      // Vẫn xóa khỏi active list nếu có lỗi
      activeAutoFishing.delete(interaction.user.id);
      
      await interaction.reply({
        content: '❌ Có lỗi khi dừng auto-fishing, nhưng phiên đã được dừng!',
        flags: 64
      });
    }
  }
};