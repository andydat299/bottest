import { SlashCommandBuilder } from 'discord.js';
import { getFishButtons } from '../components/fishButtons.js';
import { User } from '../schemas/userSchema.js';
import { GlobalStats } from '../schemas/globalStatsSchema.js';
import { selectRandomFish } from '../utils/fishingLogic.js';
import { checkFishingCooldown, setFishingCooldown, clearFishingCooldown, formatCooldownTime } from '../utils/cooldownManager.js';
import { updateQuestProgress } from '../utils/questManager.js';

export default {
  data: new SlashCommandBuilder().setName('fish').setDescription('Câu cá 🎣'),
  prefixEnabled: true, // Cho phép sử dụng với prefix

  async execute(interaction) {
    const discordId = interaction.user.id;
    
    // Kiểm tra cooldown
    const cooldownCheck = checkFishingCooldown(discordId);
    if (cooldownCheck.isOnCooldown) {
      return interaction.reply({
        content: `⏰ **Bạn đang trong thời gian chờ!**\n\n🎣 Bạn có thể câu cá lại sau: **${formatCooldownTime(cooldownCheck.remainingTime)}**\n\n💡 *Hãy hoàn thành lần câu cá trước đó hoặc đợi cooldown hết!*`,
        ephemeral: true
      });
    }

    let user = await User.findOne({ discordId });
    if (!user) {
      user = await User.create({ 
        discordId,
        fishingStats: {
          totalFishingAttempts: 0,
          successfulCatches: 0,
          missedCatches: 0
        }
      });
    }

    // Đảm bảo fishingStats tồn tại
    if (!user.fishingStats) {
      user.fishingStats = {
        totalFishingAttempts: 0,
        successfulCatches: 0,
        missedCatches: 0
      };
      await user.save();
    }

    // Kiểm tra phí câu cá (sau 5 lần đầu miễn phí)
    const FISHING_FEE = 10;
    const FREE_ATTEMPTS = 5;
    const totalAttempts = user.fishingStats?.totalFishingAttempts || 0;
    
    if (totalAttempts >= FREE_ATTEMPTS && user.balance < FISHING_FEE) {
      clearFishingCooldown(discordId); // Xóa cooldown nếu không đủ tiền
      return interaction.reply({
        content: `💰 **Không đủ xu để câu cá!**\n\n🎣 Phí câu cá: **${FISHING_FEE} xu**\n💳 Số dư hiện tại: **${user.balance} xu**\n\n💡 *5 lần đầu tiên là miễn phí! Bạn đã sử dụng hết.*`,
        ephemeral: true
      });
    }

    // Trừ phí nếu không phải lần miễn phí
    if (totalAttempts >= FREE_ATTEMPTS) {
      user.balance -= FISHING_FEE;
      await user.save();
    }

    const clicksNeeded = Math.floor(Math.random() * 3) + 2;

    // Đặt cooldown ngay khi bắt đầu câu cá
    setFishingCooldown(discordId, 20); // 20 giây cooldown

    const feeInfo = totalAttempts >= FREE_ATTEMPTS ? `💰 Phí: ${FISHING_FEE} xu` : `🆓 Miễn phí (${FREE_ATTEMPTS - totalAttempts} lần còn lại)`;

    const msg = await interaction.reply({
      content: `🎣 Nhấn **${clicksNeeded} lần** để câu cá!\n${feeInfo}\n⏰ *Cooldown: 20 giây*`,
      components: [getFishButtons()],
      fetchReply: true
    });

    const collector = msg.createMessageComponentCollector({
      filter: (i) => i.user.id === discordId,
      time: 30000 // Tăng từ 10s lên 30s
    });

    let clicks = 0;
    collector.on('collect', async (btn) => {
      if (btn.customId === 'fish_click') {
        clicks++;
        console.log(`🎣 ${interaction.user.username} đã click ${clicks}/${clicksNeeded}`);
        
        await btn.update({ 
          content: `🎣 Đã kéo ${clicks}/${clicksNeeded} lần!\n⏰ *Cooldown: 20 giây*`, 
          components: [getFishButtons()] 
        });
        
        if (clicks >= clicksNeeded) {
          console.log(`✅ ${interaction.user.username} đã click đủ, dừng collector`);
          // Xóa cooldown ngay khi hoàn thành
          clearFishingCooldown(discordId);
          collector.stop('caught');
        }
      } else if (btn.customId === 'fish_cancel') {
        // Xóa cooldown khi cancel
        clearFishingCooldown(discordId);
        console.log(`❌ ${interaction.user.username} đã hủy câu cá`);
        await btn.update({ content: '🚫 Đã hủy câu cá. Cooldown đã được xóa.', components: [] });
        collector.stop('cancel');
      }
    });

    collector.on('end', async (_, reason) => {
      console.log(`🔚 Collector ended với reason: ${reason} cho user ${interaction.user.username}`);
      
      if (reason === 'caught') {
        // Cập nhật thống kê câu cá
        user.fishingStats.totalFishingAttempts = (user.fishingStats.totalFishingAttempts || 0) + 1;

        // Tính tỷ lệ câu hụt (20% base, giảm theo rod level)
        const baseMissRate = 0.20; // 20% cơ bản
        const rodLevel = user.rodLevel || 1;
        const missRateReduction = (rodLevel - 1) * 0.02; // Giảm 2% mỗi level
        const finalMissRate = Math.max(baseMissRate - missRateReduction, 0.05); // Tối thiểu 5%
        const missRatePercent = (finalMissRate * 100).toFixed(1);
        
        const isMiss = Math.random() < finalMissRate;
        
        if (isMiss) {
          // Câu hụt
          console.log(`❌ ${interaction.user.username} câu hụt (${missRatePercent}%)`);
          user.fishingStats.missedCatches = (user.fishingStats.missedCatches || 0) + 1;
          await user.save();
          
          // Xóa cooldown
          clearFishingCooldown(discordId);
          
          const missMessages = [
            '🎣 Cá đã thoát! Bạn câu hụt rồi.',
            '🐟 Không có cá nào cắn câu lần này.',
            '⚡ Cá quá nhanh, bạn đã bỏ lỡ!',
            '🌊 Nước động quá mạnh, câu hụt!',
            '🎯 Chưa đủ may mắn lần này.'
          ];
          
          const randomMessage = missMessages[Math.floor(Math.random() * missMessages.length)];
          
          await interaction.editReply({
            content: `${randomMessage}\n\n📊 Tỷ lệ câu hụt: **${missRatePercent}%** (giảm theo rod level)\n💡 Nâng cấp cần câu để giảm tỷ lệ câu hụt!`,
            components: []
          });
          return;
        }
        
        // Câu thành công
        console.log(`✅ ${interaction.user.username} câu thành công!`);
        user.fishingStats.successfulCatches = (user.fishingStats.successfulCatches || 0) + 1;
        
        // Sử dụng hệ thống câu cá mới với weight
        const fish = selectRandomFish(rodLevel);

        const fishCount = user.fish.get(fish.name) || 0;
        user.fish.set(fish.name, fishCount + 1);
        await user.save();

        // Cập nhật quest progress
        await updateQuestProgress(discordId, 'fish', 1);
        
        // Kiểm tra nếu là cá hiếm để cập nhật quest fish_rare
        const isRareFish = fish.rarity !== 'common';
        if (isRareFish) {
          await updateQuestProgress(discordId, 'fish_rare', 1, { isRare: true });
        }

        // Cập nhật thống kê toàn cục
        try {
          let globalStats = await GlobalStats.findOne({ statsId: 'global' });
          if (!globalStats) {
            globalStats = await GlobalStats.create({ statsId: 'global' });
          }
          
          const currentCount = globalStats.totalFishCaught.get(fish.name) || 0;
          globalStats.totalFishCaught.set(fish.name, currentCount + 1);
          globalStats.lastUpdated = new Date();
          await globalStats.save();
        } catch (error) {
          console.error('Error updating global stats:', error);
        }

        // Hiển thị kết quả với emoji rarity
        const rarityEmoji = {
          'common': '🐟',
          'rare': '🐠', 
          'legendary': '🐋',
          'mythical': '⭐'
        };
        
        const emoji = rarityEmoji[fish.rarity] || '🐟';
        let message = `${emoji} Bạn đã bắt được **${fish.name}** (💰 ${fish.price} xu)!`;
        
        // Thêm thông báo đặc biệt cho cá hiếm
        if (fish.rarity === 'mythical') {
          message += '\n🎉 **CỰC HIẾM!** Bạn đã câu được cá huyền thoại! 🎉';
        } else if (fish.rarity === 'legendary') {
          message += '\n✨ **HIẾM!** Cá huyền thoại đã xuất hiện!';
        } else if (fish.rarity === 'rare') {
          message += '\n💎 Cá hiếm đấy!';
        }

        await interaction.editReply({ content: message, components: [] });
        
        // Xóa cooldown khi hoàn thành thành công
        clearFishingCooldown(discordId);
        
        console.log(`✅ ${interaction.user.username} đã câu được ${fish.name}, cooldown đã được xóa`);
      } else if (reason !== 'cancel') {
        // Timeout - tính là câu hụt và cập nhật stats
        user.fishingStats.totalFishingAttempts = (user.fishingStats.totalFishingAttempts || 0) + 1;
        user.fishingStats.missedCatches = (user.fishingStats.missedCatches || 0) + 1;
        await user.save();
        
        // Xóa cooldown
        clearFishingCooldown(discordId);
        await interaction.editReply({ 
          content: '⏰ **Hết thời gian câu cá!**\n\n🎣 Cá đã bơi mất rồi... Thử lại nhé!\n💡 *Cooldown đã được xóa*', 
          components: [] 
        });
      }
    });
  }
};
