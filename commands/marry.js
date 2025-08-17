import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import mongoose from 'mongoose';

export default {
  data: new SlashCommandBuilder()
    .setName('marry')
    .setDescription('💒 Hệ thống kết hôn')
    .addSubcommand(subcommand =>
      subcommand
        .setName('propose')
        .setDescription('💍 Cầu hôn ai đó')
        .addUserOption(option =>
          option.setName('partner')
            .setDescription('Người bạn muốn cầu hôn')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('ring_id')
            .setDescription('ID nhẫn muốn sử dụng (dùng /ring-shop inventory để xem)')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('status')
        .setDescription('💕 Xem tình trạng hôn nhân')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('Xem tình trạng của người khác (tùy chọn)')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('divorce')
        .setDescription('💔 Ly hôn'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('anniversary')
        .setDescription('🎉 Xem ngày kỷ niệm')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('Xem kỷ niệm của cặp đôi khác')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('leaderboard')
        .setDescription('🏆 Bảng xếp hạng cặp đôi')),

  async execute(interaction) {
    try {
      const subcommand = interaction.options.getSubcommand();
      
      switch (subcommand) {
        case 'propose':
          await handlePropose(interaction);
          break;
        case 'status':
          await handleStatus(interaction);
          break;
        case 'divorce':
          await handleDivorce(interaction);
          break;
        case 'anniversary':
          await handleAnniversary(interaction);
          break;
        case 'leaderboard':
          await handleLeaderboard(interaction);
          break;
      }

    } catch (error) {
      console.error('Marry command error:', error);
      await interaction.reply({
        content: '❌ Có lỗi xảy ra trong hệ thống kết hôn!',
        flags: 64
      });
    }
  }
};

async function handlePropose(interaction) {
  await interaction.deferReply();

  const proposer = interaction.user;
  const partner = interaction.options.getUser('partner');
  const ringId = interaction.options.getString('ring_id');

  // Validations
  if (proposer.id === partner.id) {
    await interaction.editReply({
      content: '❌ **Bạn không thể cầu hôn chính mình!**'
    });
    return;
  }

  if (partner.bot) {
    await interaction.editReply({
      content: '❌ **Bạn không thể cầu hôn bot!**'
    });
    return;
  }

  // Database access
  const db = mongoose.connection.db;
  const usersCollection = db.collection('users');
  const marriagesCollection = db.collection('marriages');
  const proposalsCollection = db.collection('proposals');

  // Check if already married
  const existingMarriage = await marriagesCollection.findOne({
    $or: [
      { partner1: proposer.id },
      { partner2: proposer.id },
      { partner1: partner.id },
      { partner2: partner.id }
    ],
    status: 'active'
  });

  if (existingMarriage) {
    const marriedPersonId = existingMarriage.partner1 === proposer.id || existingMarriage.partner2 === proposer.id ? proposer.id : partner.id;
    const marriedPerson = marriedPersonId === proposer.id ? 'Bạn' : partner.username;
    
    await interaction.editReply({
      content: `❌ **${marriedPerson} đã kết hôn rồi!**\n\n💒 Chỉ có thể kết hôn với một người tại một thời điểm.`
    });
    return;
  }

  // Check for pending proposals
  const pendingProposal = await proposalsCollection.findOne({
    $or: [
      { proposerId: proposer.id, status: 'pending' },
      { partnerId: proposer.id, status: 'pending' },
      { proposerId: partner.id, status: 'pending' },
      { partnerId: partner.id, status: 'pending' }
    ]
  });

  if (pendingProposal) {
    await interaction.editReply({
      content: '❌ **Đã có lời cầu hôn đang chờ xử lý!**\n\n💡 Vui lòng đợi lời cầu hôn hiện tại được giải quyết.'
    });
    return;
  }

  // Get proposer's data and rings
  const proposerData = await usersCollection.findOne({ discordId: proposer.id });
  const rings = proposerData?.ringInventory || [];
  const availableRings = rings.filter(ring => !ring.isUsed && new Date(ring.expiresAt) > new Date());

  if (availableRings.length === 0) {
    await interaction.editReply({
      content: [
        '❌ **Bạn không có nhẫn để cầu hôn!**',
        '',
        '💍 Cầu hôn cần có nhẫn cưới.',
        '',
        '🛒 Mua nhẫn tại `/ring-shop buy`'
      ].join('\n')
    });
    return;
  }

  // Select ring
  let selectedRing;
  if (ringId) {
    selectedRing = availableRings.find(ring => ring.id === ringId);
    if (!selectedRing) {
      await interaction.editReply({
        content: '❌ **Không tìm thấy nhẫn với ID đã cho!**\n\n💡 Sử dụng `/ring-shop inventory` để xem nhẫn có sẵn.'
      });
      return;
    }
  } else {
    // Use the best ring available
    selectedRing = availableRings.reduce((best, current) => 
      current.marriageBonus > best.marriageBonus ? current : best
    );
  }

  // Create proposal
  const proposal = {
    proposerId: proposer.id,
    proposerUsername: proposer.username,
    partnerId: partner.id,
    partnerUsername: partner.username,
    ringId: selectedRing.id,
    ringName: selectedRing.name,
    ringEmoji: selectedRing.emoji,
    marriageBonus: selectedRing.marriageBonus,
    status: 'pending',
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  };

  await proposalsCollection.insertOne(proposal);

  // Mark ring as used
  await usersCollection.updateOne(
    { discordId: proposer.id, 'ringInventory.id': selectedRing.id },
    { $set: { 'ringInventory.$.isUsed': true } }
  );

  // Create proposal embed
  const proposalEmbed = new EmbedBuilder()
    .setTitle('💍 Lời Cầu Hôn!')
    .setDescription(`**${proposer} đang cầu hôn ${partner}!**`)
    .setColor('#FF69B4')
    .addFields(
      { name: '👤 Người cầu hôn', value: proposer.toString(), inline: true },
      { name: '💕 Người được cầu hôn', value: partner.toString(), inline: true },
      { name: '💍 Nhẫn cưới', value: `${selectedRing.emoji} ${selectedRing.name}`, inline: true },
      { name: '💖 Bonus khi kết hôn', value: `+${selectedRing.marriageBonus}% xu từ các hoạt động`, inline: true },
      { name: '⏰ Hết hạn', value: '<t:' + Math.floor(proposal.expiresAt.getTime() / 1000) + ':R>', inline: true },
      { name: '🎯 Lời nhắn', value: `"${partner.username}, bạn có muốn kết hôn với tôi không? 💕"`, inline: false }
    )
    .setThumbnail(proposer.displayAvatarURL())
    .setImage('https://media.giphy.com/media/26BRv0ThflsHCqDrG/giphy.gif') // Wedding proposal GIF
    .setFooter({ text: 'Trả lời trong vòng 24 giờ!' })
    .setTimestamp();

  // Create buttons
  const buttons = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`proposal_accept_${proposal._id}`)
        .setLabel('💒 Đồng Ý')
        .setStyle(ButtonStyle.Success)
        .setEmoji('💕'),
      new ButtonBuilder()
        .setCustomId(`proposal_reject_${proposal._id}`)
        .setLabel('💔 Từ Chối')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('😢')
    );

  await interaction.editReply({
    content: `${partner} 💍 **Bạn đã được cầu hôn!**`,
    embeds: [proposalEmbed],
    components: [buttons]
  });

  // Send DM to partner
  try {
    const dmEmbed = new EmbedBuilder()
      .setTitle('💍 Bạn Đã Được Cầu Hôn!')
      .setDescription(`**${proposer.username}** đã cầu hôn bạn với nhẫn ${selectedRing.emoji} ${selectedRing.name}!`)
      .setColor('#FF69B4')
      .addFields(
        { name: '💖 Bonus khi kết hôn', value: `+${selectedRing.marriageBonus}% xu`, inline: true },
        { name: '⏰ Hết hạn', value: '24 giờ', inline: true }
      )
      .setFooter({ text: 'Trả lời trong server để chấp nhận hoặc từ chối!' });

    await partner.send({ embeds: [dmEmbed] });
  } catch (dmError) {
    console.log(`Could not send DM to ${partner.username}`);
  }

  console.log(`💍 ${proposer.username} proposed to ${partner.username} with ${selectedRing.name}`);
}

async function handleStatus(interaction) {
  await interaction.deferReply({ ephemeral: !interaction.options.getUser('user') });

  const targetUser = interaction.options.getUser('user') || interaction.user;

  // Database access
  const db = mongoose.connection.db;
  const marriagesCollection = db.collection('marriages');

  const marriage = await marriagesCollection.findOne({
    $or: [
      { partner1: targetUser.id },
      { partner2: targetUser.id }
    ],
    status: 'active'
  });

  if (!marriage) {
    await interaction.editReply({
      content: [
        '💔 **Tình Trạng Hôn Nhân**',
        '',
        `${targetUser.id === interaction.user.id ? '❌ **Bạn chưa kết hôn.**' : `❌ **${targetUser.username} chưa kết hôn.**`}`,
        '',
        '💡 Sử dụng `/marry propose` để cầu hôn!'
      ].join('\n')
    });
    return;
  }

  const partnerId = marriage.partner1 === targetUser.id ? marriage.partner2 : marriage.partner1;
  const partnerUser = await interaction.client.users.fetch(partnerId);
  
  const marriedDate = new Date(marriage.marriedAt);
  const daysTogether = Math.floor((new Date() - marriedDate) / (1000 * 60 * 60 * 24));
  
  const embed = new EmbedBuilder()
    .setTitle('💒 Tình Trạng Hôn Nhân')
    .setDescription('**Thông tin về cuộc hôn nhân:**')
    .setColor('#FF1493')
    .addFields(
      { name: '💕 Cặp đôi', value: `${targetUser} ❤️ ${partnerUser}`, inline: false },
      { name: '💍 Nhẫn cưới', value: `${marriage.ringEmoji} ${marriage.ringName}`, inline: true },
      { name: '💖 Bonus xu', value: `+${marriage.marriageBonus}% từ hoạt động`, inline: true },
      { name: '📅 Ngày cưới', value: marriedDate.toLocaleDateString(), inline: true },
      { name: '⏰ Thời gian bên nhau', value: `${daysTogether} ngày`, inline: true },
      { name: '🌟 Trạng thái', value: '💒 Đã kết hôn', inline: true },
      { name: '💎 Hạnh phúc', value: calculateHappiness(daysTogether), inline: true }
    )
    .setThumbnail('https://i.imgur.com/marriage-icon.png')
    .setFooter({ text: 'Chúc mừng cặp đôi hạnh phúc!' })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

async function handleDivorce(interaction) {
  await interaction.deferReply({ ephemeral: true });

  // Database access
  const db = mongoose.connection.db;
  const marriagesCollection = db.collection('marriages');
  const usersCollection = db.collection('users');

  const marriage = await marriagesCollection.findOne({
    $or: [
      { partner1: interaction.user.id },
      { partner2: interaction.user.id }
    ],
    status: 'active'
  });

  if (!marriage) {
    await interaction.editReply({
      content: '❌ **Bạn chưa kết hôn nên không thể ly hôn!**'
    });
    return;
  }

  const partnerId = marriage.partner1 === interaction.user.id ? marriage.partner2 : marriage.partner1;
  const partnerUser = await interaction.client.users.fetch(partnerId);

  // Confirm divorce
  const confirmEmbed = new EmbedBuilder()
    .setTitle('💔 Xác Nhận Ly Hôn')
    .setDescription(`**Bạn có chắc chắn muốn ly hôn với ${partnerUser}?**`)
    .setColor('#FF0000')
    .addFields(
      { name: '⚠️ Lưu ý', value: 'Ly hôn sẽ mất đi bonus xu và không thể hoàn tác!', inline: false },
      { name: '💍 Nhẫn cưới', value: 'Nhẫn sẽ bị xóa và không thể lấy lại', inline: false }
    );

  const confirmButtons = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`divorce_confirm_${marriage._id}`)
        .setLabel('💔 Xác Nhận Ly Hôn')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('divorce_cancel')
        .setLabel('❌ Hủy Bỏ')
        .setStyle(ButtonStyle.Secondary)
    );

  await interaction.editReply({
    embeds: [confirmEmbed],
    components: [confirmButtons]
  });
}

async function handleAnniversary(interaction) {
  await interaction.deferReply();

  const targetUser = interaction.options.getUser('user') || interaction.user;

  // Database access
  const db = mongoose.connection.db;
  const marriagesCollection = db.collection('marriages');

  const marriage = await marriagesCollection.findOne({
    $or: [
      { partner1: targetUser.id },
      { partner2: targetUser.id }
    ],
    status: 'active'
  });

  if (!marriage) {
    await interaction.editReply({
      content: '❌ **Chưa có cuộc hôn nhân nào để kỷ niệm!**'
    });
    return;
  }

  const partnerId = marriage.partner1 === targetUser.id ? marriage.partner2 : marriage.partner1;
  const partnerUser = await interaction.client.users.fetch(partnerId);
  
  const marriedDate = new Date(marriage.marriedAt);
  const today = new Date();
  const daysTogether = Math.floor((today - marriedDate) / (1000 * 60 * 60 * 24));
  
  // Calculate next anniversary
  const nextAnniversary = new Date(marriedDate);
  nextAnniversary.setFullYear(today.getFullYear());
  if (nextAnniversary < today) {
    nextAnniversary.setFullYear(today.getFullYear() + 1);
  }
  const daysToAnniversary = Math.ceil((nextAnniversary - today) / (1000 * 60 * 60 * 24));

  const embed = new EmbedBuilder()
    .setTitle('🎉 Kỷ Niệm Ngày Cưới')
    .setDescription(`**Kỷ niệm tình yêu của ${targetUser.username} và ${partnerUser.username}**`)
    .setColor('#FFD700')
    .addFields(
      { name: '💕 Cặp đôi', value: `${targetUser} ❤️ ${partnerUser}`, inline: false },
      { name: '📅 Ngày cưới', value: marriedDate.toLocaleDateString(), inline: true },
      { name: '⏰ Thời gian bên nhau', value: `${daysTogether} ngày`, inline: true },
      { name: '🎂 Kỷ niệm tiếp theo', value: `${daysToAnniversary} ngày nữa`, inline: true },
      { name: '🏆 Cột mốc đạt được', value: getMilestones(daysTogether), inline: false },
      { name: '💝 Thành tựu tình yêu', value: getLoveAchievements(daysTogether), inline: false }
    )
    .setThumbnail('https://i.imgur.com/anniversary-icon.png')
    .setFooter({ text: 'Tình yêu mãi mãi!' })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

async function handleLeaderboard(interaction) {
  await interaction.deferReply();

  // Database access
  const db = mongoose.connection.db;
  const marriagesCollection = db.collection('marriages');

  const marriages = await marriagesCollection
    .find({ status: 'active' })
    .sort({ marriedAt: 1 })
    .limit(10)
    .toArray();

  if (marriages.length === 0) {
    await interaction.editReply({
      content: [
        '🏆 **Bảng Xếp Hạng Cặp Đôi**',
        '',
        '❌ **Chưa có cặp đôi nào kết hôn!**',
        '',
        '💡 Hãy là cặp đôi đầu tiên!'
      ].join('\n')
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle('🏆 Bảng Xếp Hạng Cặp Đôi')
    .setDescription('**Top 10 cặp đôi kết hôn lâu nhất:**')
    .setColor('#FFD700')
    .setTimestamp();

  let leaderboardText = '';
  
  for (let i = 0; i < marriages.length; i++) {
    const marriage = marriages[i];
    const rank = getRankEmoji(i + 1);
    
    try {
      const partner1 = await interaction.client.users.fetch(marriage.partner1);
      const partner2 = await interaction.client.users.fetch(marriage.partner2);
      
      const marriedDate = new Date(marriage.marriedAt);
      const daysTogether = Math.floor((new Date() - marriedDate) / (1000 * 60 * 60 * 24));
      
      leaderboardText += `${rank} **${partner1.username} ❤️ ${partner2.username}**\n`;
      leaderboardText += `   💍 ${marriage.ringEmoji} ${marriage.ringName}\n`;
      leaderboardText += `   ⏰ ${daysTogether} ngày bên nhau\n`;
      leaderboardText += `   📅 Cưới ngày ${marriedDate.toLocaleDateString()}\n\n`;
    } catch (error) {
      console.log('Could not fetch user for marriage:', marriage._id);
    }
  }

  embed.addFields({ name: '💕 Bảng Xếp Hạng', value: leaderboardText || 'Không có dữ liệu', inline: false });

  // Add statistics
  const totalMarriages = await marriagesCollection.countDocuments({ status: 'active' });
  const totalDivorces = await marriagesCollection.countDocuments({ status: 'divorced' });
  const successRate = totalMarriages + totalDivorces > 0 ? Math.round((totalMarriages / (totalMarriages + totalDivorces)) * 100) : 0;

  embed.addFields({
    name: '📊 Thống Kê Chung',
    value: [
      `💒 **Tổng số cặp đôi:** ${totalMarriages}`,
      `💔 **Tổng số ly hôn:** ${totalDivorces}`,
      `📈 **Tỷ lệ thành công:** ${successRate}%`,
      `🏆 **Top ${marriages.length} hiển thị**`
    ].join('\n'),
    inline: false
  });

  embed.setFooter({ text: 'Chúc mừng tất cả các cặp đôi!' });

  await interaction.editReply({ embeds: [embed] });
}

// Helper functions
function calculateHappiness(days) {
  if (days < 7) return '💕 Trăng mật';
  if (days < 30) return '🌸 Hạnh phúc';
  if (days < 90) return '🌺 Ngọt ngào';
  if (days < 365) return '🌹 Bền vững';
  return '💎 Vĩnh cửu';
}

function getMilestones(days) {
  const milestones = [];
  if (days >= 7) milestones.push('📅 1 tuần');
  if (days >= 30) milestones.push('🗓️ 1 tháng'); 
  if (days >= 100) milestones.push('💯 100 ngày');
  if (days >= 365) milestones.push('🎂 1 năm');
  if (days >= 1000) milestones.push('🏆 1000 ngày');
  
  return milestones.length > 0 ? milestones.join(', ') : '🌱 Mới bắt đầu';
}

function getLoveAchievements(days) {
  const achievements = [];
  if (days >= 7) achievements.push('🥉 Tuần trăng mật');
  if (days >= 30) achievements.push('🥈 Tình yêu bền vững');
  if (days >= 365) achievements.push('🥇 Cặp đôi của năm');
  if (days >= 1000) achievements.push('💎 Tình yêu vĩnh cửu');
  
  return achievements.length > 0 ? achievements.join(', ') : '💝 Mới yêu';
}

function getRankEmoji(rank) {
  const emojis = {
    1: '🥇', 2: '🥈', 3: '🥉', 4: '4️⃣', 5: '5️⃣',
    6: '6️⃣', 7: '7️⃣', 8: '8️⃣', 9: '9️⃣', 10: '🔟'
  };
  return emojis[rank] || `${rank}️⃣`;
}