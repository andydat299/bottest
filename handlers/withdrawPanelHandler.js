import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import mongoose from 'mongoose';

/**
 * Handle withdraw panel button interactions
 */
export async function handleWithdrawPanelButtons(interaction) {
  try {
    if (interaction.customId.startsWith('withdraw_')) {
      await handleWithdrawRequest(interaction);
    } else if (interaction.customId.startsWith('confirm_withdraw_')) {
      await handleWithdrawConfirm(interaction);
    } else if (interaction.customId.startsWith('cancel_withdraw_')) {
      await handleWithdrawCancel(interaction);
    }
  } catch (error) {
    console.error('Error handling withdraw panel buttons:', error);
    
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: '❌ **Có lỗi xảy ra khi xử lý withdraw request!**',
        ephemeral: true
      });
    }
  }
}

/**
 * Handle withdraw modal submissions
 */
export async function handleWithdrawModal(interaction) {
  try {
    await interaction.deferReply({ ephemeral: true });

    const amount = interaction.fields.getTextInputValue('withdrawAmount');
    const reason = interaction.fields.getTextInputValue('withdrawReason') || 'Không có lý do';

    // Validate amount
    const withdrawAmount = parseInt(amount);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      await interaction.editReply({
        content: '❌ **Số tiền không hợp lệ! Vui lòng nhập số nguyên dương.**'
      });
      return;
    }

    // Minimum withdraw amount
    const MIN_WITHDRAW = 50000;
    if (withdrawAmount < MIN_WITHDRAW) {
      await interaction.editReply({
        content: `❌ **Số tiền rút tối thiểu là ${MIN_WITHDRAW.toLocaleString()} xu!**`
      });
      return;
    }

    // Check user balance
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    // Compatible with both single-server and multi-server data
    const user = await usersCollection.findOne({ 
      discordId: interaction.user.id
      // Remove guildId filter for now to work with existing MongoDB URI data
    });

    if (!user || user.balance < withdrawAmount) {
      await interaction.editReply({
        content: '❌ **Số dư không đủ để thực hiện giao dịch!**'
      });
      return;
    }

    // Create withdraw request
    const withdrawRequest = {
      userId: interaction.user.id,
      username: interaction.user.username,
      amount: withdrawAmount,
      reason: reason,
      status: 'pending',
      requestedAt: new Date(),
      userBalance: user.balance
    };

    const withdrawCollection = db.collection('withdrawRequests');
    const result = await withdrawCollection.insertOne(withdrawRequest);

    // Create admin notification embed
    const adminEmbed = new EmbedBuilder()
      .setTitle('💰 Yêu Cầu Rút Xu Mới')
      .setColor('#ff6b6b')
      .addFields(
        { name: '👤 User', value: `${interaction.user} (${interaction.user.username})`, inline: true },
        { name: '💎 Số tiền', value: `${withdrawAmount.toLocaleString()} xu`, inline: true },
        { name: '💰 Số dư hiện tại', value: `${user.balance.toLocaleString()} xu`, inline: true },
        { name: '📝 Lý do', value: reason, inline: false },
        { name: '⏰ Thời gian', value: new Date().toLocaleString(), inline: true },
        { name: '🏠 Server', value: interaction.guild?.name || 'Unknown', inline: true }
      )
      .setThumbnail(interaction.user.displayAvatarURL())
      .setFooter({ text: `Request ID: ${result.insertedId}` })
      .setTimestamp();

    // Admin action buttons
    const adminButtons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`confirm_withdraw_${result.insertedId}`)
          .setLabel('✅ Phê Duyệt')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`cancel_withdraw_${result.insertedId}`)
          .setLabel('❌ Từ Chối')
          .setStyle(ButtonStyle.Danger)
      );

    // Try to send to admin channel
    const ADMIN_CHANNEL_ID = process.env.ADMIN_CHANNEL_ID;
    if (ADMIN_CHANNEL_ID) {
      try {
        const adminChannel = await interaction.client.channels.fetch(ADMIN_CHANNEL_ID);
        await adminChannel.send({
          embeds: [adminEmbed],
          components: [adminButtons]
        });
      } catch (channelError) {
        console.error('Could not send to admin channel:', channelError);
      }
    }

    // Confirm to user
    const userEmbed = new EmbedBuilder()
      .setTitle('✅ Yêu Cầu Rút Xu Đã Được Gửi')
      .setColor('#00ff00')
      .addFields(
        { name: '💎 Số tiền', value: `${withdrawAmount.toLocaleString()} xu`, inline: true },
        { name: '📝 Lý do', value: reason, inline: true },
        { name: '⏳ Trạng thái', value: 'Đang chờ admin xử lý', inline: true }
      )
      .setFooter({ text: 'Bạn sẽ được thông báo khi có kết quả' })
      .setTimestamp();

    await interaction.editReply({ embeds: [userEmbed] });

    console.log(`💰 Withdraw request: ${interaction.user.username} requested ${withdrawAmount} xu`);

  } catch (error) {
    console.error('Error handling withdraw modal:', error);
    
    if (interaction.deferred) {
      await interaction.editReply({
        content: '❌ **Có lỗi xảy ra khi xử lý yêu cầu rút xu!**'
      });
    } else if (!interaction.replied) {
      await interaction.reply({
        content: '❌ **Có lỗi xảy ra khi xử lý yêu cầu rút xu!**',
        ephemeral: true
      });
    }
  }
}

/**
 * Handle withdraw request button (show modal)
 */
async function handleWithdrawRequest(interaction) {
  // Create withdraw modal
  const modal = new ModalBuilder()
    .setCustomId(`withdrawModal_${interaction.user.id}`)
    .setTitle('💰 Yêu Cầu Rút Xu');

  const amountInput = new TextInputBuilder()
    .setCustomId('withdrawAmount')
    .setLabel('Số tiền muốn rút (xu)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Ví dụ: 100000')
    .setRequired(true)
    .setMinLength(4)
    .setMaxLength(10);

  const reasonInput = new TextInputBuilder()
    .setCustomId('withdrawReason')
    .setLabel('Lý do rút xu (tùy chọn)')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('Ví dụ: Cần tiền mua đồ ăn...')
    .setRequired(false)
    .setMaxLength(200);

  const firstRow = new ActionRowBuilder().addComponents(amountInput);
  const secondRow = new ActionRowBuilder().addComponents(reasonInput);

  modal.addComponents(firstRow, secondRow);

  await interaction.showModal(modal);
}

/**
 * Handle admin confirm withdraw
 */
async function handleWithdrawConfirm(interaction) {
  await interaction.deferUpdate();

  const requestId = interaction.customId.split('_')[2];

  try {
    const db = mongoose.connection.db;
    const withdrawCollection = db.collection('withdrawRequests');
    const usersCollection = db.collection('users');

    // Get withdraw request
    const request = await withdrawCollection.findOne({ 
      _id: new mongoose.Types.ObjectId(requestId) 
    });

    if (!request) {
      await interaction.followUp({
        content: '❌ **Không tìm thấy yêu cầu rút xu!**',
        ephemeral: true
      });
      return;
    }

    if (request.status !== 'pending') {
      await interaction.followUp({
        content: '❌ **Yêu cầu này đã được xử lý!**',
        ephemeral: true
      });
      return;
    }

    // Update user balance
    const user = await usersCollection.findOne({ 
      discordId: request.userId
    });

    if (!user || user.balance < request.amount) {
      await interaction.followUp({
        content: '❌ **User không đủ số dư để thực hiện giao dịch!**',
        ephemeral: true
      });
      return;
    }

    // Process withdrawal
    await usersCollection.updateOne(
      { _id: user._id },
      { 
        $inc: { balance: -request.amount },
        $set: { updatedAt: new Date() }
      }
    );

    // Update request status
    await withdrawCollection.updateOne(
      { _id: request._id },
      { 
        $set: { 
          status: 'approved',
          approvedBy: interaction.user.id,
          approvedByUsername: interaction.user.username,
          approvedAt: new Date()
        }
      }
    );

    // Update original message
    const approvedEmbed = new EmbedBuilder()
      .setTitle('✅ Yêu Cầu Rút Xu Đã Được Phê Duyệt')
      .setColor('#00ff00')
      .addFields(
        { name: '👤 User', value: `<@${request.userId}> (${request.username})`, inline: true },
        { name: '💎 Số tiền', value: `${request.amount.toLocaleString()} xu`, inline: true },
        { name: '👮 Phê duyệt bởi', value: interaction.user.username, inline: true },
        { name: '📝 Lý do', value: request.reason, inline: false },
        { name: '⏰ Phê duyệt lúc', value: new Date().toLocaleString(), inline: true }
      )
      .setFooter({ text: `Request ID: ${requestId}` })
      .setTimestamp();

    await interaction.editReply({
      embeds: [approvedEmbed],
      components: [] // Remove buttons
    });

    // Notify user
    try {
      const targetUser = await interaction.client.users.fetch(request.userId);
      const userNotification = new EmbedBuilder()
        .setTitle('✅ Yêu Cầu Rút Xu Đã Được Phê Duyệt')
        .setColor('#00ff00')
        .addFields(
          { name: '💎 Số tiền', value: `${request.amount.toLocaleString()} xu`, inline: true },
          { name: '👮 Phê duyệt bởi', value: interaction.user.username, inline: true },
          { name: '💰 Số dư mới', value: `${(user.balance - request.amount).toLocaleString()} xu`, inline: true }
        )
        .setTimestamp();

      await targetUser.send({ embeds: [userNotification] });
    } catch (dmError) {
      console.log('Could not send DM to user');
    }

    console.log(`✅ Withdraw approved: ${request.username} withdrew ${request.amount} xu`);

  } catch (error) {
    console.error('Error confirming withdraw:', error);
    await interaction.followUp({
      content: '❌ **Có lỗi xảy ra khi phê duyệt withdraw!**',
      ephemeral: true
    });
  }
}

/**
 * Handle admin cancel withdraw
 */
async function handleWithdrawCancel(interaction) {
  await interaction.deferUpdate();

  const requestId = interaction.customId.split('_')[2];

  try {
    const db = mongoose.connection.db;
    const withdrawCollection = db.collection('withdrawRequests');

    // Get withdraw request
    const request = await withdrawCollection.findOne({ 
      _id: new mongoose.Types.ObjectId(requestId) 
    });

    if (!request) {
      await interaction.followUp({
        content: '❌ **Không tìm thấy yêu cầu rút xu!**',
        ephemeral: true
      });
      return;
    }

    if (request.status !== 'pending') {
      await interaction.followUp({
        content: '❌ **Yêu cầu này đã được xử lý!**',
        ephemeral: true
      });
      return;
    }

    // Update request status
    await withdrawCollection.updateOne(
      { _id: request._id },
      { 
        $set: { 
          status: 'rejected',
          rejectedBy: interaction.user.id,
          rejectedByUsername: interaction.user.username,
          rejectedAt: new Date()
        }
      }
    );

    // Update original message
    const rejectedEmbed = new EmbedBuilder()
      .setTitle('❌ Yêu Cầu Rút Xu Đã Bị Từ Chối')
      .setColor('#ff0000')
      .addFields(
        { name: '👤 User', value: `<@${request.userId}> (${request.username})`, inline: true },
        { name: '💎 Số tiền', value: `${request.amount.toLocaleString()} xu`, inline: true },
        { name: '👮 Từ chối bởi', value: interaction.user.username, inline: true },
        { name: '📝 Lý do gốc', value: request.reason, inline: false },
        { name: '⏰ Từ chối lúc', value: new Date().toLocaleString(), inline: true }
      )
      .setFooter({ text: `Request ID: ${requestId}` })
      .setTimestamp();

    await interaction.editReply({
      embeds: [rejectedEmbed],
      components: [] // Remove buttons
    });

    // Notify user
    try {
      const targetUser = await interaction.client.users.fetch(request.userId);
      const userNotification = new EmbedBuilder()
        .setTitle('❌ Yêu Cầu Rút Xu Đã Bị Từ Chối')
        .setColor('#ff0000')
        .addFields(
          { name: '💎 Số tiền', value: `${request.amount.toLocaleString()} xu`, inline: true },
          { name: '👮 Từ chối bởi', value: interaction.user.username, inline: true },
          { name: '💡 Lưu ý', value: 'Số dư của bạn không bị ảnh hưởng', inline: false }
        )
        .setTimestamp();

      await targetUser.send({ embeds: [userNotification] });
    } catch (dmError) {
      console.log('Could not send DM to user');
    }

    console.log(`❌ Withdraw rejected: ${request.username}'s request for ${request.amount} xu`);

  } catch (error) {
    console.error('Error canceling withdraw:', error);
    await interaction.followUp({
      content: '❌ **Có lỗi xảy ra khi từ chối withdraw!**',
      ephemeral: true
    });
  }
}