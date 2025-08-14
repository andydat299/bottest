import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getOrCreateVIP, getVIPPerks } from '../utils/vip.js';

export default {
  data: new SlashCommandBuilder()
    .setName('vip')
    .setDescription('👑 Xem trạng thái VIP của bạn'),
  async execute(interaction) {
    try {
      const vip = await getOrCreateVIP(interaction.user.id, interaction.user.username);
      
      if (!vip || !vip.isVipActive()) {
        const embed = new EmbedBuilder()
          .setTitle('❌ Chưa có VIP')
          .setDescription('Bạn chưa có VIP hoặc VIP đã hết hạn.')
          .setColor('#FF0000')
          .addFields(
            { name: '🛒 Mua VIP', value: 'Sử dụng `/vip-shop` để xem và mua các gói VIP', inline: false },
            { name: '🎁 Lợi ích VIP', value: '• Bonus coins khi fishing, daily, work\n• Auto-fishing với thời gian dài hơn\n• Màu sắc đặc biệt trong embed\n• Và nhiều ưu đãi khác!', inline: false }
          )
          .setFooter({ text: 'Hãy mua VIP để nhận nhiều ưu đãi hấp dẫn!' })
          .setTimestamp();
        
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
      }
      
      const perks = getVIPPerks(vip);
      const remainingDays = vip.getRemainingDays();
      const expire = vip.vipTier === 'lifetime' ? 'Vĩnh viễn' : `${remainingDays} ngày`;
      
      const embed = new EmbedBuilder()
        .setTitle('👑 Trạng Thái VIP')
        .setDescription(`Chào mừng ${perks.tier}!`)
        .setColor(perks.color)
        .addFields(
          { name: '🎯 VIP Tier', value: perks.tier, inline: true },
          { name: '⏱️ Thời hạn còn lại', value: expire, inline: true },
          { name: '📊 Tổng chi tiêu', value: `${vip.vipStats.totalSpent.toLocaleString()} coins`, inline: true },
          { name: '💰 Coin Bonus', value: `x1`, inline: true },
          { name: '🎣 Fishing Bonus', value: `x1`, inline: true },
          { name: '💎 Daily Bonus', value: `x1`, inline: true },
          { name: '💼 Work Bonus', value: `x1`, inline: true },
          { name: '🤖 Auto Fishing', value: `${perks.autoFishingTime >= 60 ? Math.floor(perks.autoFishingTime/60) + ' giờ' : perks.autoFishingTime + ' phút'}/ngày`, inline: true },
          { name: '📈 Lịch sử mua', value: `${vip.vipPurchaseHistory.length} lần`, inline: true }
        )
        .setFooter({ text: 'Cảm ơn bạn đã sử dụng VIP! 💎' })
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed], ephemeral: true });
      
    } catch (error) {
      console.error('VIP command error:', error);
      await interaction.reply({
        content: '❌ Có lỗi xảy ra khi kiểm tra VIP!',
        ephemeral: true
      });
    }
  }
};