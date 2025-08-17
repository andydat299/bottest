import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import mongoose from 'mongoose';

export default {
  data: new SlashCommandBuilder()
    .setName('transfer-leaderboard')
    .setDescription('🏆 Xem bảng xếp hạng chuyển tiền')
    .addStringOption(option =>
      option.setName('category')
        .setDescription('Loại bảng xếp hạng')
        .setRequired(false)
        .addChoices(
          { name: '👑 Người gửi nhiều nhất', value: 'top_senders' },
          { name: '💎 Người nhận nhiều nhất', value: 'top_receivers' },
          { name: '🎯 Hoạt động tích cực', value: 'most_active' },
          { name: '💰 Giá trị giao dịch cao', value: 'highest_transfers' }
        )),

  async execute(interaction) {
    try {
      await interaction.deferReply();

      const category = interaction.options.getString('category') || 'top_senders';

      // Database access
      const db = mongoose.connection.db;
      const transfersCollection = db.collection('transfers');

      let leaderboard = [];
      let title = '';
      let description = '';
      let color = '#FFD700';

      switch (category) {
        case 'top_senders':
          title = '👑 Top Người Gửi Xu';
          description = '**Những người gửi xu nhiều nhất:**';
          
          leaderboard = await transfersCollection.aggregate([
            {
              $group: {
                _id: { id: '$senderId', username: '$senderUsername' },
                totalSent: { $sum: '$amount' },
                totalFees: { $sum: '$fee' },
                transferCount: { $sum: 1 }
              }
            },
            { $sort: { totalSent: -1 } },
            { $limit: 10 }
          ]).toArray();
          break;

        case 'top_receivers':
          title = '💎 Top Người Nhận Xu';
          description = '**Những người nhận xu nhiều nhất:**';
          color = '#9B59B6';
          
          leaderboard = await transfersCollection.aggregate([
            {
              $group: {
                _id: { id: '$recipientId', username: '$recipientUsername' },
                totalReceived: { $sum: '$amountReceived' },
                receiveCount: { $sum: 1 }
              }
            },
            { $sort: { totalReceived: -1 } },
            { $limit: 10 }
          ]).toArray();
          break;

        case 'most_active':
          title = '🎯 Hoạt Động Tích Cực';
          description = '**Những người tham gia chuyển tiền nhiều nhất:**';
          color = '#E74C3C';
          
          // Get both sent and received counts
          const senders = await transfersCollection.aggregate([
            { $group: { _id: { id: '$senderId', username: '$senderUsername' }, count: { $sum: 1 } } }
          ]).toArray();
          
          const receivers = await transfersCollection.aggregate([
            { $group: { _id: { id: '$recipientId', username: '$recipientUsername' }, count: { $sum: 1 } } }
          ]).toArray();
          
          // Combine and calculate total activity
          const activityMap = {};
          [...senders, ...receivers].forEach(item => {
            const key = item._id.id;
            if (!activityMap[key]) {
              activityMap[key] = { 
                username: item._id.username, 
                totalActivity: 0 
              };
            }
            activityMap[key].totalActivity += item.count;
          });
          
          leaderboard = Object.entries(activityMap)
            .map(([id, data]) => ({ _id: { id, username: data.username }, totalActivity: data.totalActivity }))
            .sort((a, b) => b.totalActivity - a.totalActivity)
            .slice(0, 10);
          break;

        case 'highest_transfers':
          title = '💰 Giao Dịch Giá Trị Cao';
          description = '**Những giao dịch có giá trị cao nhất:**';
          color = '#F39C12';
          
          leaderboard = await transfersCollection
            .find({})
            .sort({ amount: -1 })
            .limit(10)
            .toArray();
          break;
      }

      if (leaderboard.length === 0) {
        await interaction.editReply({
          content: [
            '🏆 **Bảng Xếp Hạng Chuyển Tiền**',
            '',
            '❌ **Chưa có dữ liệu.**',
            '',
            '💡 Hãy sử dụng `/transfer` để bắt đầu chuyển xu!'
          ].join('\n')
        });
        return;
      }

      // Create embed
      const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(color)
        .setTimestamp();

      // Format leaderboard based on category
      let leaderboardText = '';
      
      if (category === 'highest_transfers') {
        // Single transfers
        for (let i = 0; i < leaderboard.length; i++) {
          const transfer = leaderboard[i];
          const rank = getRankEmoji(i + 1);
          const date = new Date(transfer.createdAt).toLocaleDateString();
          
          leaderboardText += `${rank} **${transfer.amount.toLocaleString()} xu**\n`;
          leaderboardText += `   👤 ${transfer.senderUsername} → ${transfer.recipientUsername}\n`;
          leaderboardText += `   📅 ${date}\n\n`;
        }
      } else {
        // Aggregated data
        for (let i = 0; i < leaderboard.length; i++) {
          const user = leaderboard[i];
          const rank = getRankEmoji(i + 1);
          
          leaderboardText += `${rank} **${user._id.username}**\n`;
          
          if (category === 'top_senders') {
            leaderboardText += `   💰 Gửi: ${user.totalSent.toLocaleString()} xu (${user.transferCount} lần)\n`;
            leaderboardText += `   💸 Phí: ${user.totalFees.toLocaleString()} xu\n\n`;
          } else if (category === 'top_receivers') {
            leaderboardText += `   💎 Nhận: ${user.totalReceived.toLocaleString()} xu (${user.receiveCount} lần)\n\n`;
          } else if (category === 'most_active') {
            leaderboardText += `   🎯 Hoạt động: ${user.totalActivity} giao dịch\n\n`;
          }
        }
      }

      embed.addFields({ name: '📊 Bảng Xếp Hạng', value: leaderboardText, inline: false });

      // Add overall statistics
      const totalTransfers = await transfersCollection.countDocuments({});
      const totalVolume = await transfersCollection.aggregate([
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]).toArray();
      
      const statsText = [
        `📊 **Tổng giao dịch:** ${totalTransfers.toLocaleString()}`,
        `💰 **Tổng khối lượng:** ${(totalVolume[0]?.total || 0).toLocaleString()} xu`,
        `🏆 **Top ${leaderboard.length} hiển thị**`
      ].join('\n');

      embed.addFields({ name: '📈 Thống Kê Chung', value: statsText, inline: false });

      embed.setFooter({ text: 'Dữ liệu cập nhật realtime • Sử dụng /transfer để tham gia!' });

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Transfer leaderboard command error:', error);
      await interaction.editReply({
        content: '❌ **Có lỗi xảy ra khi tải bảng xếp hạng!**\n\nVui lòng thử lại sau.'
      });
    }
  }
};

function getRankEmoji(rank) {
  const emojis = {
    1: '🥇',
    2: '🥈', 
    3: '🥉',
    4: '4️⃣',
    5: '5️⃣',
    6: '6️⃣',
    7: '7️⃣',
    8: '8️⃣',
    9: '9️⃣',
    10: '🔟'
  };
  return emojis[rank] || `${rank}️⃣`;
}