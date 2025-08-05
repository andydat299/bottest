import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { User } from '../schemas/userSchema.js';

export default {
  data: new SlashCommandBuilder()
    .setName('chatstats')
    .setDescription('Xem thống kê chat của bạn tại sảnh 💬'),
  prefixEnabled: true, // Cho phép sử dụng với prefix

  async execute(interaction) {
    const user = await User.findOne({ discordId: interaction.user.id });
    
    if (!user || !user.chatStats) {
      return interaction.reply({
        content: '📊 Bạn chưa có thống kê chat nào!\n💡 Hãy chat ít nhất 1 tin nhắn tại <#1363492195478540348> để bắt đầu theo dõi.',
        ephemeral: true
      });
    }

    const today = new Date().toISOString().split('T')[0];
    const todayMessages = user.chatStats.dailyMessages.get(today) || 0;
    const totalMessages = user.chatStats.totalMessages || 0;

    const embed = new EmbedBuilder()
      .setColor('#00BFFF')
      .setTitle('💬 Thống kê Chat')
      .setDescription(`Hoạt động chat của **${interaction.user.username}** tại <#1363492195478540348>`)
      .addFields(
        {
          name: '📅 Hôm nay',
          value: `**${todayMessages}** tin nhắn`,
          inline: true
        },
        {
          name: '📊 Tổng cộng',
          value: `**${totalMessages}** tin nhắn`,
          inline: true
        },
        {
          name: '🗓️ Lần chat cuối',
          value: user.chatStats.lastMessageDate || 'Chưa có dữ liệu',
          inline: true
        }
      )
      .setTimestamp()
      .setThumbnail(interaction.user.displayAvatarURL())
      .setFooter({ 
        text: 'Fishbot - Chat Stats',
        iconURL: interaction.client.user.displayAvatarURL() 
      });

    // Hiển thị 7 ngày gần nhất
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const count = user.chatStats.dailyMessages.get(dateStr) || 0;
      const dayName = date.toLocaleDateString('vi-VN', { weekday: 'short' });
      last7Days.push(`${dayName}: ${count}`);
    }

    embed.addFields({
      name: '📈 7 ngày gần nhất',
      value: last7Days.join('\n') || 'Chưa có dữ liệu',
      inline: false
    });

    // Thêm progress cho quest chat (nếu có)
    if (todayMessages > 0) {
      const questProgress = Math.min(todayMessages, 30);
      const progressBar = createProgressBar(questProgress, 30, 15);
      
      embed.addFields({
        name: '🎯 Tiến độ Quest Chat hôm nay',
        value: `${progressBar} ${questProgress}/30\n${questProgress >= 30 ? '✅ **Hoàn thành!**' : `⏳ Còn ${30 - questProgress} tin nhắn nữa`}`,
        inline: false
      });
    }

    await interaction.reply({ embeds: [embed] });
  }
};

// Tạo progress bar
function createProgressBar(current, target, length = 15) {
  const percentage = Math.min(current / target, 1);
  const filled = Math.round(length * percentage);
  const empty = length - filled;
  
  return '█'.repeat(filled) + '▒'.repeat(empty);
}
