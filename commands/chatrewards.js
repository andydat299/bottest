import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getChatRewardStats } from '../utils/chatRewards.js';

export default {
  data: new SlashCommandBuilder()
    .setName('chatrewards')
    .setDescription('Xem thống kê chat rewards của bạn'),

  async execute(interaction) {
    try {
      const stats = await getChatRewardStats(interaction.user.id);
      
      if (!stats) {
        await interaction.reply({
          content: '❌ Bạn chưa có thống kê chat rewards nào!',
          ephemeral: true
        });
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle(`💬 Chat Rewards - ${interaction.user.username}`)
        .addFields(
          { 
            name: '💰 Tổng xu nhận được', 
            value: `${stats.totalRewards.toLocaleString()} xu`, 
            inline: true 
          },
          { 
            name: '🎯 Số lần nhận thưởng', 
            value: `${stats.rewardCount.toLocaleString()} lần`, 
            inline: true 
          },
          { 
            name: '📊 Trung bình mỗi lần', 
            value: `${stats.averageReward.toLocaleString()} xu`, 
            inline: true 
          },
          {
            name: '📍 Kênh chat rewards',
            value: '<#1363492195478540348>',
            inline: false
          },
          {
            name: '⚡ Thông tin',
            value: '• Tỉ lệ rơi: **10%**\n• Khoảng xu: **1-1,000 xu**\n• Cooldown: **30 giây**',
            inline: false
          }
        )
        .setColor('#ffdd57')
        .setThumbnail(interaction.user.displayAvatarURL())
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

    } catch (error) {
      console.error('Error in chatrewards command:', error);
      await interaction.reply({
        content: '❌ Có lỗi xảy ra khi lấy thống kê chat rewards!',
        ephemeral: true
      });
    }
  }
};
