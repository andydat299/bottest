import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import mongoose from 'mongoose';

export default {
  data: new SlashCommandBuilder()
    .setName('transfer')
    .setDescription('💸 Chuyển xu cho người khác')
    .addUserOption(option =>
      option.setName('recipient')
        .setDescription('Người nhận xu')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('Số xu muốn chuyển (1,000 - 100,000 xu)')
        .setRequired(true)
        .setMinValue(1000)
        .setMaxValue(100000))
    .addStringOption(option =>
      option.setName('message')
        .setDescription('Tin nhắn gửi kèm (tùy chọn)')
        .setRequired(false)
        .setMaxLength(100)),

  async execute(interaction) {
    try {
      await interaction.deferReply();

      const sender = interaction.user;
      const recipient = interaction.options.getUser('recipient');
      const amount = interaction.options.getInteger('amount');
      const message = interaction.options.getString('message') || '';

      // Validation checks
      if (sender.id === recipient.id) {
        await interaction.editReply({
          content: '❌ **Bạn không thể chuyển tiền cho chính mình!**'
        });
        return;
      }

      if (recipient.bot) {
        await interaction.editReply({
          content: '❌ **Bạn không thể chuyển tiền cho bot!**'
        });
        return;
      }

      // Database access
      const db = mongoose.connection.db;
      const usersCollection = db.collection('users');
      const transfersCollection = db.collection('transfers');

      // Check sender balance
      const senderData = await usersCollection.findOne({ discordId: sender.id });
      if (!senderData || (senderData.balance || 0) < amount) {
        const shortage = amount - (senderData?.balance || 0);
        await interaction.editReply({
          content: [
            '❌ **Số dư không đủ để chuyển!**',
            '',
            `💰 **Cần:** ${amount.toLocaleString()} xu`,
            `💳 **Hiện có:** ${(senderData?.balance || 0).toLocaleString()} xu`,
            `📉 **Thiếu:** ${shortage.toLocaleString()} xu`,
            '',
            '🎣 Hãy câu cá để kiếm thêm xu!'
          ].join('\n')
        });
        return;
      }

      // Check transfer limits (prevent spam)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentTransfers = await transfersCollection.countDocuments({
        senderId: sender.id,
        createdAt: { $gte: oneHourAgo }
      });

      if (recentTransfers >= 10) {
        await interaction.editReply({
          content: [
            '⏳ **Đã đạt giới hạn chuyển tiền!**',
            '',
            '📊 **Giới hạn:** 10 lần/giờ',
            `🔄 **Đã dùng:** ${recentTransfers}/10`,
            '',
            '💡 Vui lòng chờ một chút trước khi chuyển tiền tiếp.'
          ].join('\n')
        });
        return;
      }

      // Find or create recipient
      let recipientData = await usersCollection.findOne({ discordId: recipient.id });
      if (!recipientData) {
        recipientData = {
          discordId: recipient.id,
          username: recipient.username,
          balance: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        await usersCollection.insertOne(recipientData);
      }

      // Calculate transfer fee (2% fee)
      const transferFee = Math.floor(amount * 0.02);
      const amountAfterFee = amount - transferFee;

      // Perform transfer
      const session = mongoose.startSession();
      
      try {
        await session.withTransaction(async () => {
          // Deduct from sender (including fee)
          await usersCollection.updateOne(
            { discordId: sender.id },
            { 
              $inc: { balance: -amount },
              $set: { updatedAt: new Date() }
            },
            { session }
          );

          // Add to recipient (after fee)
          await usersCollection.updateOne(
            { discordId: recipient.id },
            { 
              $inc: { balance: amountAfterFee },
              $set: { updatedAt: new Date() }
            },
            { session }
          );

          // Log transfer
          const transferRecord = {
            senderId: sender.id,
            senderUsername: sender.username,
            recipientId: recipient.id,
            recipientUsername: recipient.username,
            amount: amount,
            fee: transferFee,
            amountReceived: amountAfterFee,
            message: message,
            status: 'completed',
            createdAt: new Date()
          };

          await transfersCollection.insertOne(transferRecord, { session });
        });
      } finally {
        await session.endSession();
      }

      // Get updated balances
      const updatedSender = await usersCollection.findOne({ discordId: sender.id });
      const updatedRecipient = await usersCollection.findOne({ discordId: recipient.id });

      // Success embed
      const successEmbed = new EmbedBuilder()
        .setTitle('💸 Chuyển Tiền Thành Công!')
        .setDescription('**Giao dịch đã được thực hiện thành công!**')
        .setColor('#00ff00')
        .addFields(
          { name: '👤 Người gửi', value: `${sender}`, inline: true },
          { name: '👤 Người nhận', value: `${recipient}`, inline: true },
          { name: '💰 Số tiền gửi', value: `${amount.toLocaleString()} xu`, inline: true },
          { name: '💸 Phí giao dịch (2%)', value: `${transferFee.toLocaleString()} xu`, inline: true },
          { name: '💵 Số tiền nhận được', value: `${amountAfterFee.toLocaleString()} xu`, inline: true },
          { name: '📊 Giao dịch trong giờ', value: `${recentTransfers + 1}/10`, inline: true },
          { name: '💳 Số dư còn lại', value: `${updatedSender.balance.toLocaleString()} xu`, inline: true },
          { name: '💳 Số dư người nhận', value: `${updatedRecipient.balance.toLocaleString()} xu`, inline: true },
          { name: '🆔 Giao dịch ID', value: `\`TRANS_${Date.now()}\``, inline: true }
        )
        .setFooter({ text: 'Cảm ơn bạn đã sử dụng dịch vụ chuyển tiền!' })
        .setTimestamp();

      if (message) {
        successEmbed.addFields({ name: '💬 Tin nhắn', value: message, inline: false });
      }

      await interaction.editReply({ embeds: [successEmbed] });

      // Send notification to recipient via DM
      try {
        const recipientEmbed = new EmbedBuilder()
          .setTitle('💰 Bạn Đã Nhận Được Xu!')
          .setDescription(`**${sender.username}** đã chuyển xu cho bạn!`)
          .setColor('#4ECDC4')
          .addFields(
            { name: '👤 Người gửi', value: sender.username, inline: true },
            { name: '💵 Số xu nhận được', value: `${amountAfterFee.toLocaleString()} xu`, inline: true },
            { name: '💳 Số dư hiện tại', value: `${updatedRecipient.balance.toLocaleString()} xu`, inline: true }
          )
          .setThumbnail(sender.displayAvatarURL())
          .setTimestamp();

        if (message) {
          recipientEmbed.addFields({ name: '💬 Tin nhắn', value: message, inline: false });
        }

        await recipient.send({ embeds: [recipientEmbed] });
        console.log(`📧 Sent transfer notification to ${recipient.username}`);
      } catch (dmError) {
        console.log(`❌ Could not send DM to ${recipient.username}:`, dmError.message);
      }

      console.log(`💸 Transfer: ${sender.username} → ${recipient.username}: ${amount.toLocaleString()} xu (fee: ${transferFee})`);

    } catch (error) {
      console.error('Transfer command error:', error);
      await interaction.editReply({
        content: '❌ **Có lỗi xảy ra khi chuyển tiền!**\n\nVui lòng thử lại sau.'
      });
    }
  }
};