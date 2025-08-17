import { EmbedBuilder } from 'discord.js';
import mongoose from 'mongoose';
import { safeEditReply, safeReply } from '../utils/interactionHelpers.js';

export async function handleMarriageButtons(interaction) {
  try {
    console.log('💒 Marriage button clicked:', interaction.customId);
    
    if (interaction.customId.startsWith('proposal_accept_')) {
      await handleProposalAccept(interaction);
    } else if (interaction.customId.startsWith('proposal_reject_')) {
      await handleProposalReject(interaction);
    } else if (interaction.customId.startsWith('divorce_confirm_')) {
      await handleDivorceConfirm(interaction);
    } else if (interaction.customId === 'divorce_cancel') {
      await handleDivorceCancel(interaction);
    }

  } catch (error) {
    console.error('❌ Marriage button error:', error);
    await interaction.reply({
      content: '❌ Có lỗi xảy ra khi xử lý yêu cầu!',
      ephemeral: true
    });
  }
}

async function handleProposalAccept(interaction) {
  await interaction.deferUpdate();

  const proposalId = interaction.customId.split('_')[2];
  
  // Database access
  const db = mongoose.connection.db;
  const proposalsCollection = db.collection('proposals');
  const marriagesCollection = db.collection('marriages');
  const usersCollection = db.collection('users');

  // Find proposal
  const proposal = await proposalsCollection.findOne({ _id: new mongoose.Types.ObjectId(proposalId) });

  if (!proposal) {
    await safeReply(interaction, {
      content: '❌ **Không tìm thấy lời cầu hôn!**',
      ephemeral: true
    });
    return;
  }

  // Verify the person accepting is the partner
  if (proposal.partnerId !== interaction.user.id) {
    await safeReply(interaction, {
      content: '❌ **Chỉ người được cầu hôn mới có thể chấp nhận!**',
      ephemeral: true
    });
    return;
  }

  // Check if proposal is still valid
  if (proposal.status !== 'pending' || new Date() > new Date(proposal.expiresAt)) {
    await safeReply(interaction, {
      content: '❌ **Lời cầu hôn đã hết hạn hoặc không còn hiệu lực!**',
      ephemeral: true
    });
    return;
  }

  // Check if either person is already married
  const existingMarriage = await marriagesCollection.findOne({
    $or: [
      { partner1: proposal.proposerId },
      { partner2: proposal.proposerId },
      { partner1: proposal.partnerId },
      { partner2: proposal.partnerId }
    ],
    status: 'active'
  });

  if (existingMarriage) {
    await safeReply(interaction, {
      content: '❌ **Một trong hai người đã kết hôn rồi!**',
      ephemeral: true
    });
    return;
  }

  // Create marriage
  const marriage = {
    partner1: proposal.proposerId,
    partner1Username: proposal.proposerUsername,
    partner2: proposal.partnerId,
    partner2Username: proposal.partnerUsername,
    ringId: proposal.ringId,
    ringName: proposal.ringName,
    ringEmoji: proposal.ringEmoji,
    marriageBonus: proposal.marriageBonus,
    marriedAt: new Date(),
    status: 'active',
    anniversaries: [],
    createdAt: new Date()
  };

  // Use transaction for consistency
  const session = mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      // Insert marriage
      await marriagesCollection.insertOne(marriage, { session });

      // Update proposal status
      await proposalsCollection.updateOne(
        { _id: proposal._id },
        { $set: { status: 'accepted', acceptedAt: new Date() } },
        { session }
      );

      // Add marriage bonus to both users
      await usersCollection.updateMany(
        { discordId: { $in: [proposal.proposerId, proposal.partnerId] } },
        { 
          $set: { 
            marriageBonus: proposal.marriageBonus,
            marriedTo: marriage.partner1 === proposal.proposerId ? marriage.partner2 : marriage.partner1,
            marriedAt: marriage.marriedAt,
            updatedAt: new Date()
          }
        },
        { session }
      );
    });
  } finally {
    await session.endSession();
  }

  // Success embed
  const marriageEmbed = new EmbedBuilder()
    .setTitle('💒 Chúc Mừng! Đám Cưới Thành Công!')
    .setDescription(`**${proposal.proposerUsername} và ${proposal.partnerUsername} đã chính thức kết hôn!**`)
    .setColor('#FF69B4')
    .addFields(
      { name: '💕 Cặp đôi mới cưới', value: `<@${proposal.proposerId}> ❤️ <@${proposal.partnerId}>`, inline: false },
      { name: '💍 Nhẫn cưới', value: `${proposal.ringEmoji} ${proposal.ringName}`, inline: true },
      { name: '💖 Bonus xu', value: `+${proposal.marriageBonus}% từ mọi hoạt động`, inline: true },
      { name: '📅 Ngày cưới', value: new Date().toLocaleDateString(), inline: true },
      { name: '🎉 Lời chúc', value: 'Chúc hai bạn trăm năm hạnh phúc, bắc kỷ kim cương! 💎', inline: false }
    )
    .setImage('https://media.giphy.com/media/26BRv0ThflsHCqDrG/giphy.gif') // Wedding celebration GIF
    .setFooter({ text: 'Tình yêu mãi mãi! ❤️' })
    .setTimestamp();

  // Update original message using safe edit
  await safeEditReply(interaction, {
    content: '🎉 **Đám cưới thành công!**',
    embeds: [marriageEmbed],
    components: [] // Remove buttons
  });

  // Send DM to proposer
  try {
    const proposer = await interaction.client.users.fetch(proposal.proposerId);
    const dmEmbed = new EmbedBuilder()
      .setTitle('🎉 Chúc Mừng!')
      .setDescription(`**${proposal.partnerUsername}** đã đồng ý cầu hôn của bạn! Chúc mừng đám cưới!`)
      .setColor('#00FF00')
      .addFields(
        { name: '💒 Trạng thái', value: 'Đã kết hôn', inline: true },
        { name: '💖 Bonus xu', value: `+${proposal.marriageBonus}%`, inline: true }
      );

    await proposer.send({ embeds: [dmEmbed] });
  } catch (dmError) {
    console.log('Could not send DM to proposer');
  }

  console.log(`💒 Marriage successful: ${proposal.proposerUsername} ❤️ ${proposal.partnerUsername}`);
}

async function handleProposalReject(interaction) {
  await interaction.deferUpdate();

  const proposalId = interaction.customId.split('_')[2];
  
  // Database access
  const db = mongoose.connection.db;
  const proposalsCollection = db.collection('proposals');
  const usersCollection = db.collection('users');

  // Find proposal
  const proposal = await proposalsCollection.findOne({ _id: new mongoose.Types.ObjectId(proposalId) });

  if (!proposal) {
    await safeReply(interaction, {
      content: '❌ **Không tìm thấy lời cầu hôn!**',
      ephemeral: true
    });
    return;
  }

  // Verify the person rejecting is the partner
  if (proposal.partnerId !== interaction.user.id) {
    await safeReply(interaction, {
      content: '❌ **Chỉ người được cầu hôn mới có thể từ chối!**',
      ephemeral: true
    });
    return;
  }

  // Update proposal status
  await proposalsCollection.updateOne(
    { _id: proposal._id },
    { $set: { status: 'rejected', rejectedAt: new Date() } }
  );

  // Return ring to proposer (mark as unused)
  await usersCollection.updateOne(
    { discordId: proposal.proposerId, 'ringInventory.id': proposal.ringId },
    { $set: { 'ringInventory.$.isUsed': false } }
  );

  // Rejection embed
  const rejectionEmbed = new EmbedBuilder()
    .setTitle('💔 Lời Cầu Hôn Bị Từ Chối')
    .setDescription(`**${proposal.partnerUsername}** đã từ chối lời cầu hôn của **${proposal.proposerUsername}**.`)
    .setColor('#FF0000')
    .addFields(
      { name: '💍 Nhẫn đã trả lại', value: `${proposal.ringEmoji} ${proposal.ringName}`, inline: true },
      { name: '💬 Lời nhắn', value: 'Có lẽ chưa đến thời điểm phù hợp. Đừng bỏ cuộc!', inline: false }
    )
    .setFooter({ text: 'Tình yêu cần thời gian...' })
    .setTimestamp();

  // Update original message using safe edit
  await safeEditReply(interaction, {
    content: '💔 **Lời cầu hôn đã bị từ chối.**',
    embeds: [rejectionEmbed],
    components: [] // Remove buttons
  });

  // Send DM to proposer
  try {
    const proposer = await interaction.client.users.fetch(proposal.proposerId);
    const dmEmbed = new EmbedBuilder()
      .setTitle('💔 Lời Cầu Hôn Bị Từ Chối')
      .setDescription(`Rất tiếc, **${proposal.partnerUsername}** đã từ chối lời cầu hôn của bạn.`)
      .setColor('#FF0000')
      .addFields(
        { name: '💍 Nhẫn', value: 'Đã được trả lại vào túi đồ', inline: true },
        { name: '💪 Động viên', value: 'Đừng bỏ cuộc! Tình yêu cần thời gian.', inline: false }
      );

    await proposer.send({ embeds: [dmEmbed] });
  } catch (dmError) {
    console.log('Could not send DM to proposer');
  }

  console.log(`💔 Proposal rejected: ${proposal.proposerUsername} → ${proposal.partnerUsername}`);
}

async function handleDivorceConfirm(interaction) {
  await interaction.deferUpdate();

  const marriageId = interaction.customId.split('_')[2];
  
  // Database access
  const db = mongoose.connection.db;
  const marriagesCollection = db.collection('marriages');
  const usersCollection = db.collection('users');

  // Find marriage
  const marriage = await marriagesCollection.findOne({ _id: new mongoose.Types.ObjectId(marriageId) });

  if (!marriage || marriage.status !== 'active') {
    await safeReply(interaction, {
      content: '❌ **Không tìm thấy cuộc hôn nhân hoặc đã ly hôn!**',
      ephemeral: true
    });
    return;
  }

  // Verify the person divorcing is part of the marriage
  if (marriage.partner1 !== interaction.user.id && marriage.partner2 !== interaction.user.id) {
    await safeReply(interaction, {
      content: '❌ **Bạn không phải là thành viên của cuộc hôn nhân này!**',
      ephemeral: true
    });
    return;
  }

  const partnerId = marriage.partner1 === interaction.user.id ? marriage.partner2 : marriage.partner1;
  const partnerUsername = marriage.partner1 === interaction.user.id ? marriage.partner2Username : marriage.partner1Username;

  // Process divorce
  const session = mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      // Update marriage status
      await marriagesCollection.updateOne(
        { _id: marriage._id },
        { 
          $set: { 
            status: 'divorced',
            divorcedAt: new Date(),
            divorcedBy: interaction.user.id
          }
        },
        { session }
      );

      // Remove marriage bonus from both users
      await usersCollection.updateMany(
        { discordId: { $in: [marriage.partner1, marriage.partner2] } },
        { 
          $unset: { 
            marriageBonus: '',
            marriedTo: '',
            marriedAt: ''
          },
          $set: { updatedAt: new Date() }
        },
        { session }
      );

      // Remove ring from inventory (ring is destroyed in divorce)
      await usersCollection.updateOne(
        { discordId: { $in: [marriage.partner1, marriage.partner2] }, 'ringInventory.id': marriage.ringId },
        { $pull: { ringInventory: { id: marriage.ringId } } },
        { session }
      );
    });
  } finally {
    await session.endSession();
  }

  // Calculate marriage duration
  const marriageDuration = Math.floor((new Date() - new Date(marriage.marriedAt)) / (1000 * 60 * 60 * 24));

  // Divorce embed
  const divorceEmbed = new EmbedBuilder()
    .setTitle('💔 Ly Hôn Thành Công')
    .setDescription(`**${interaction.user.username}** và **${partnerUsername}** đã chính thức ly hôn.`)
    .setColor('#800080')
    .addFields(
      { name: '⏰ Thời gian kết hôn', value: `${marriageDuration} ngày`, inline: true },
      { name: '💍 Nhẫn cưới', value: `${marriage.ringEmoji} ${marriage.ringName} (đã mất)`, inline: true },
      { name: '💔 Lý do', value: 'Quyết định cá nhân', inline: true },
      { name: '📅 Ngày ly hôn', value: new Date().toLocaleDateString(), inline: true },
      { name: '💙 Lời chúc', value: 'Chúc cả hai tìm được hạnh phúc mới.', inline: false }
    )
    .setFooter({ text: 'Cuộc sống tiếp tục...' })
    .setTimestamp();

  await safeEditReply(interaction, {
    embeds: [divorceEmbed],
    components: [] // Remove buttons
  });

  // Send DM to ex-partner
  try {
    const exPartner = await interaction.client.users.fetch(partnerId);
    const dmEmbed = new EmbedBuilder()
      .setTitle('💔 Thông Báo Ly Hôn')
      .setDescription(`**${interaction.user.username}** đã quyết định ly hôn với bạn.`)
      .setColor('#800080')
      .addFields(
        { name: '⏰ Thời gian kết hôn', value: `${marriageDuration} ngày`, inline: true },
        { name: '💔 Trạng thái', value: 'Đã ly hôn', inline: true }
      );

    await exPartner.send({ embeds: [dmEmbed] });
  } catch (dmError) {
    console.log('Could not send DM to ex-partner');
  }

  console.log(`💔 Divorce completed: ${interaction.user.username} divorced ${partnerUsername} after ${marriageDuration} days`);
}

async function handleDivorceCancel(interaction) {
  await interaction.deferUpdate();

  const cancelEmbed = new EmbedBuilder()
    .setTitle('❌ Đã Hủy Ly Hôn')
    .setDescription('**Bạn đã hủy quyết định ly hôn.**')
    .setColor('#00FF00')
    .addFields(
      { name: '💕 Trạng thái', value: 'Vẫn đang kết hôn', inline: true },
      { name: '💡 Lời khuyên', value: 'Hãy cố gắng hàn gắn và giữ gìn tình yêu!', inline: false }
    );

  await safeEditReply(interaction, {
    embeds: [cancelEmbed],
    components: [] // Remove buttons
  });

  console.log(`${interaction.user.username} cancelled divorce`);
}