import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { User } from '../schemas/userSchema.js';

export default {
  data: new SlashCommandBuilder().setName('profile').setDescription('Xem thông tin người chơi'),
  prefixEnabled: true, // Cho phép sử dụng với prefix

  async execute(interaction) {
    const user = await User.findOne({ discordId: interaction.user.id }) || await User.create({ discordId: interaction.user.id });

    // Tính toán thống kê
    const totalAttempts = user.fishingStats?.totalFishingAttempts || 0;
    const successfulCatches = user.fishingStats?.successfulCatches || 0;
    const missedCatches = user.fishingStats?.missedCatches || 0;
    const successRate = totalAttempts > 0 ? ((successfulCatches / totalAttempts) * 100).toFixed(1) : '0.0';
    const freeAttemptsLeft = Math.max(5 - totalAttempts, 0);

    // Tính toán chat stats
    const totalMessages = user.chatStats?.totalMessages || 0;
    const today = new Date().toISOString().split('T')[0];
    const todayMessages = user.chatStats?.dailyMessages?.get(today) || 0;

    // Tạo embed
    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle(`👤 Hồ sơ của ${interaction.user.username}`)
      .setThumbnail(interaction.user.displayAvatarURL())
      .setTimestamp()
      .setFooter({ 
        text: 'Fishbot - Player Profile',
        iconURL: interaction.client.user.displayAvatarURL() 
      });

    // Thông tin cần câu
    const rodEmojis = ['🎣', '🎯', '⭐', '💎', '👑'];
    const rodEmoji = rodEmojis[Math.min(user.rodLevel - 1, rodEmojis.length - 1)] || '🎣';
    
    embed.addFields(
      {
        name: `${rodEmoji} Thông tin câu cá`,
        value: `• **Cần câu:** Cấp ${user.rodLevel}\n• **Tổng lần câu:** ${totalAttempts.toLocaleString()}\n• **Câu thành công:** ${successfulCatches.toLocaleString()}\n• **Câu hụt:** ${missedCatches.toLocaleString()}\n• **Tỷ lệ thành công:** ${successRate}%`,
        inline: true
      },
      {
        name: '💰 Thông tin tài chính',
        value: `• **Số dư hiện tại:** ${user.balance.toLocaleString()} xu\n• **Tổng đã bán:** ${user.totalSold.toLocaleString()} xu\n• **Kho cá:** ${user.fish.size} loại`,
        inline: true
      },
      {
        name: '💬 Thống kê chat',
        value: `• **Hôm nay:** ${todayMessages} tin nhắn\n• **Tổng cộng:** ${totalMessages.toLocaleString()} tin nhắn`,
        inline: true
      },
      {
        name: '🆓 Lần câu miễn phí',
        value: freeAttemptsLeft > 0 
          ? `✅ Còn **${freeAttemptsLeft}** lần miễn phí` 
          : '❌ **Đã hết** (phí 10 xu/lần)',
        inline: false
      }
    );

    // Thêm progress bar cho success rate
    const progressBar = createProgressBar(successRate, 100, 15);
    embed.addFields({
      name: '📊 Tỷ lệ thành công',
      value: `${progressBar} ${successRate}%`,
      inline: false
    });

    // Hiển thị rank dựa trên experience
    const totalExp = successfulCatches + Math.floor(user.totalSold / 100);
    let rank = '🌱 Người mới';
    if (totalExp >= 1000) rank = '👑 Cao thủ';
    else if (totalExp >= 500) rank = '⭐ Chuyên gia';
    else if (totalExp >= 200) rank = '🎯 Thành thạo';
    else if (totalExp >= 50) rank = '🎣 Có kinh nghiệm';

    embed.addFields({
      name: '🏆 Cấp độ',
      value: `${rank}\n**EXP:** ${totalExp.toLocaleString()}`,
      inline: true
    });

    await interaction.reply({ embeds: [embed] });
  }
};

// Tạo progress bar
function createProgressBar(current, max, length = 15) {
  const percentage = Math.min(current / max, 1);
  const filled = Math.round(length * percentage);
  const empty = length - filled;
  
  return '█'.repeat(filled) + '▒'.repeat(empty);
}
