import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getOrCreateVIP, getVIPPerks } from '../utils/vip.js';

export default {
  data: new SlashCommandBuilder()
    .setName('vip-status')
    .setDescription('Xem trạng thái VIP của bạn'),
  async execute(interaction) {
    const vip = await getOrCreateVIP(interaction.user.id, interaction.user.username);
    if (!vip || !vip.isVipActive()) {
      await interaction.reply({
        content: '❌ Bạn chưa có VIP. Hãy mua tại /vip-shop để nhận nhiều ưu đãi!',
        ephemeral: true
      });
      return;
    }
    const perks = getVIPPerks(vip);
    const expire = vip.expireAt ? `<t:${Math.floor(new Date(vip.expireAt).getTime()/1000)}:R>` : 'Vĩnh viễn';
    const embed = new EmbedBuilder()
      .setTitle('👑 Trạng Thái VIP')
      .setColor(perks?.color || '#FFD700')
      .addFields(
        { name: 'VIP Tier', value: perks.tier, inline: true },
        { name: 'Thời hạn', value: expire, inline: true },
        { name: 'Coin bonus', value: `x${perks.coinMultiplier}`, inline: true },
        { name: 'Fishing bonus', value: `x${perks.fishingBonus}`, inline: true },
        { name: 'Daily bonus', value: `x${perks.dailyBonus}`, inline: true },
        { name: 'Auto-fishing/ngày', value: `${perks.autoFishingTime >= 60 ? (perks.autoFishingTime/60) + ' giờ' : perks.autoFishingTime + ' phút'}`, inline: true }
      )
      .setFooter({ text: 'Cảm ơn bạn đã sử dụng VIP!' })
      .setTimestamp();
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};