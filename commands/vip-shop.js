import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { VIP_TIERS, getOrCreateVIP } from '../utils/vip.js';

export default {
  data: new SlashCommandBuilder()
    .setName('vip-shop')
    .setDescription('🛒 Cửa hàng VIP - Mua gói VIP bằng coins'),
  async execute(interaction) {
    try {
      // Check current VIP status
      const vip = await getOrCreateVIP(interaction.user.id, interaction.user.username);
      
      const embed = new EmbedBuilder()
        .setTitle('🛒 VIP Shop')
        .setDescription('**Chọn gói VIP phù hợp với bạn!**\n\n*Nhấn button để mua ngay bằng coins!*')
        .setColor('#FFD700');

      // Add VIP tier information
      Object.entries(VIP_TIERS).forEach(([tier, info]) => {
        const benefits = [
          `💰 Coin bonus: **x${info.benefits.coinMultiplier}**`,
          `🎣 Fishing bonus: **x${info.benefits.fishingBonus}**`,
          `💎 Daily bonus: **x${info.benefits.dailyBonus}**`,
          `💼 Work bonus: **x${info.benefits.workBonus}**`,
          `🤖 Auto fishing: **${info.benefits.autoFishingTime >= 60 ? Math.floor(info.benefits.autoFishingTime/60) + ' giờ' : info.benefits.autoFishingTime + ' phút'}/ngày**`
        ].join('\n');

        const isCurrentTier = vip.isVipActive() && vip.vipTier === tier;
        const tierName = isCurrentTier ? `${info.name} ✅ (Đang sử dụng)` : info.name;

        embed.addFields({
          name: `${tierName} - 💰 ${info.price.toLocaleString()} coins`,
          value: `*${info.description}*\n\n${benefits}\n\n⏱️ **Thời hạn:** ${info.duration === 36500 ? 'Vĩnh viễn' : `${info.duration} ngày`}`,
          inline: false
        });
      });

      // Create purchase buttons
      const row1 = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('buy_vip_basic')
            .setLabel('👑 Mua Basic - 100k')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('👑'),
          new ButtonBuilder()
            .setCustomId('buy_vip_premium')
            .setLabel('💎 Mua Premium - 250k')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('💎')
        );

      const row2 = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('buy_vip_ultimate')
            .setLabel('🌟 Mua Ultimate - 500k')
            .setStyle(ButtonStyle.Success)
            .setEmoji('🌟'),
          new ButtonBuilder()
            .setCustomId('buy_vip_lifetime')
            .setLabel('♾️ Mua Lifetime - 2M')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('♾️')
        );

      // Add current VIP status if any
      if (vip.isVipActive()) {
        const remainingDays = vip.getRemainingDays();
        embed.addFields({
          name: '📊 VIP hiện tại',
          value: `Bạn đang sử dụng **${VIP_TIERS[vip.vipTier]?.name || vip.vipTier}**\nThời gian còn lại: **${remainingDays}**\n\n*Mua VIP mới sẽ gia hạn hoặc nâng cấp VIP hiện tại*`,
          inline: false
        });
      }

      embed.setFooter({ text: 'Nhấn button để mua VIP ngay! Cần đủ coins trong tài khoản.' });

      await interaction.reply({ 
        embeds: [embed], 
        components: [row1, row2]
      });
      
    } catch (error) {
      console.error('VIP shop command error:', error);
      await interaction.reply({
        content: '❌ Có lỗi xảy ra trong cửa hàng VIP!',
        ephemeral: true
      });
    }
  },
};