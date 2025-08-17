import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import mongoose from 'mongoose';

export default {
  data: new SlashCommandBuilder()
    .setName('transfer-history')
    .setDescription('📋 Xem lịch sử chuyển tiền của bạn')
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Loại lịch sử muốn xem')
        .setRequired(false)
        .addChoices(
          { name: '📤 Đã gửi', value: 'sent' },
          { name: '📥 Đã nhận', value: 'received' },
          { name: '📊 Tất cả', value: 'all' }
        )),

  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const type = interaction.options.getString('type') || 'all';
      const userId = interaction.user.id;

      // Database access
      const db = mongoose.connection.db;
      const transfersCollection = db.collection('transfers');

      // Build query based on type
      let query = {};
      if (type === 'sent') {
        query = { senderId: userId };
      } else if (type === 'received') {
        query = { recipientId: userId };
      } else {
        query = { $or: [{ senderId: userId }, { recipientId: userId }] };
      }

      // Get transfers
      const transfers = await transfersCollection
        .find(query)
        .sort({ createdAt: -1 })
        .limit(15)
        .toArray();

      if (transfers.length === 0) {
        await interaction.editReply({
          content: [
            '📋 **Lịch Sử Chuyển Tiền**',
            '',
            '❌ **Chưa có giao dịch nào.**',
            '',
            '💡 Sử dụng `/transfer` để chuyển xu cho người khác!'
          ].join('\n')
        });
        return;
      }

      // Calculate statistics
      const sentTransfers = transfers.filter(t => t.senderId === userId);
      const receivedTransfers = transfers.filter(t => t.recipientId === userId);
      
      const totalSent = sentTransfers.reduce((sum, t) => sum + t.amount, 0);
      const totalReceived = receivedTransfers.reduce((sum, t) => sum + t.amountReceived, 0);
      const totalFees = sentTransfers.reduce((sum, t) => sum + (t.fee || 0), 0);

      // Create embed
      const embed = new EmbedBuilder()
        .setTitle('📋 Lịch Sử Chuyển Tiền')
        .setDescription(`**${transfers.length} giao dịch gần đây:**`)
        .setColor('#3498db')
        .setTimestamp();

      // Add statistics
      if (type === 'all') {
        embed.addFields(
          { name: '📊 Thống Kê Tổng Quan', value: [
            `📤 **Đã gửi:** ${sentTransfers.length} lần - ${totalSent.toLocaleString()} xu`,
            `📥 **Đã nhận:** ${receivedTransfers.length} lần - ${totalReceived.toLocaleString()} xu`,
            `💸 **Tổng phí:** ${totalFees.toLocaleString()} xu`,
            `💰 **Net:** ${(totalReceived - totalSent).toLocaleString()} xu`
          ].join('\n'), inline: false }
        );
      } else if (type === 'sent') {
        embed.addFields(
          { name: '📤 Thống Kê Gửi', value: [
            `🔢 **Số lần:** ${sentTransfers.length}`,
            `💰 **Tổng gửi:** ${totalSent.toLocaleString()} xu`,
            `💸 **Tổng phí:** ${totalFees.toLocaleString()} xu`
          ].join('\n'), inline: false }
        );
      } else {
        embed.addFields(
          { name: '📥 Thống Kê Nhận', value: [
            `🔢 **Số lần:** ${receivedTransfers.length}`,
            `💰 **Tổng nhận:** ${totalReceived.toLocaleString()} xu`
          ].join('\n'), inline: false }
        );
      }

      // Add transfer list
      let transferList = '';
      for (const transfer of transfers.slice(0, 10)) {
        const isSender = transfer.senderId === userId;
        const date = new Date(transfer.createdAt).toLocaleDateString();
        
        if (isSender) {
          transferList += `📤 **→ ${transfer.recipientUsername}**: ${transfer.amount.toLocaleString()} xu (phí: ${transfer.fee.toLocaleString()}) - ${date}\n`;
        } else {
          transferList += `📥 **← ${transfer.senderUsername}**: ${transfer.amountReceived.toLocaleString()} xu - ${date}\n`;
        }

        if (transfer.message) {
          transferList += `   💬 "${transfer.message}"\n`;
        }
        transferList += '\n';
      }

      if (transferList) {
        embed.addFields({ name: '📝 Chi Tiết Giao Dịch', value: transferList, inline: false });
      }

      if (transfers.length > 10) {
        embed.setFooter({ text: `Hiển thị 10/${transfers.length} giao dịch gần đây` });
      }

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Transfer history command error:', error);
      await interaction.editReply({
        content: '❌ **Có lỗi xảy ra khi tải lịch sử!**\n\nVui lòng thử lại sau.'
      });
    }
  }
};