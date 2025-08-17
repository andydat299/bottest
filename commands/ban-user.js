import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import mongoose from 'mongoose';

export default {
  data: new SlashCommandBuilder()
    .setName('ban-user')
    .setDescription('🔨 [ADMIN] Ban user khỏi bot')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Ban một user')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('User cần ban')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('reason')
            .setDescription('Lý do ban')
            .setRequired(true)
            .setMaxLength(200))
        .addStringOption(option =>
          option.setName('duration')
            .setDescription('Thời gian ban (để trống = vĩnh viễn)')
            .setRequired(false)
            .addChoices(
              { name: '1 giờ', value: '1h' },
              { name: '1 ngày', value: '1d' },
              { name: '3 ngày', value: '3d' },
              { name: '1 tuần', value: '7d' },
              { name: '1 tháng', value: '30d' },
              { name: 'Vĩnh viễn', value: 'permanent' }
            )))
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Unban một user')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('User cần unban')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('Xem danh sách user bị ban'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('check')
        .setDescription('Kiểm tra trạng thái ban của user')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('User cần kiểm tra')
            .setRequired(true))),

  async execute(interaction) {
    try {
      // Check admin permissions
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        await interaction.reply({
          content: '❌ **Bạn không có quyền sử dụng lệnh này!**',
          ephemeral: true
        });
        return;
      }

      const subcommand = interaction.options.getSubcommand();
      
      switch (subcommand) {
        case 'add':
          await handleBanUser(interaction);
          break;
        case 'remove':
          await handleUnbanUser(interaction);
          break;
        case 'list':
          await handleListBanned(interaction);
          break;
        case 'check':
          await handleCheckBan(interaction);
          break;
      }

    } catch (error) {
      console.error('Ban user command error:', error);
      await interaction.reply({
        content: '❌ Có lỗi xảy ra khi thực hiện lệnh ban!',
        ephemeral: true
      });
    }
  }
};

async function handleBanUser(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const targetUser = interaction.options.getUser('user');
  const reason = interaction.options.getString('reason');
  const duration = interaction.options.getString('duration') || 'permanent';

  // Can't ban yourself
  if (targetUser.id === interaction.user.id) {
    await interaction.editReply({
      content: '❌ **Bạn không thể ban chính mình!**'
    });
    return;
  }

  // Can't ban bots
  if (targetUser.bot) {
    await interaction.editReply({
      content: '❌ **Không thể ban bot!**'
    });
    return;
  }

  // Can't ban other admins
  const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
  if (targetMember && targetMember.permissions.has(PermissionFlagsBits.Administrator)) {
    await interaction.editReply({
      content: '❌ **Không thể ban admin khác!**'
    });
    return;
  }

  // Database access
  const db = mongoose.connection.db;
  const bannedUsersCollection = db.collection('bannedUsers');

  // Check if already banned
  const existingBan = await bannedUsersCollection.findOne({ userId: targetUser.id, isActive: true });
  if (existingBan) {
    await interaction.editReply({
      content: `❌ **${targetUser.username} đã bị ban rồi!**\n\n📅 **Ban từ:** ${new Date(existingBan.bannedAt).toLocaleString()}\n📝 **Lý do:** ${existingBan.reason}`
    });
    return;
  }

  // Calculate expiry date
  let expiresAt = null;
  if (duration !== 'permanent') {
    const timeMap = {
      '1h': 1 * 60 * 60 * 1000,
      '1d': 1 * 24 * 60 * 60 * 1000,
      '3d': 3 * 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };
    expiresAt = new Date(Date.now() + timeMap[duration]);
  }

  // Create ban record
  const banRecord = {
    userId: targetUser.id,
    username: targetUser.username,
    bannedBy: interaction.user.id,
    bannedByUsername: interaction.user.username,
    reason: reason,
    bannedAt: new Date(),
    expiresAt: expiresAt,
    isActive: true,
    duration: duration
  };

  await bannedUsersCollection.insertOne(banRecord);

  // Create ban embed
  const banEmbed = new EmbedBuilder()
    .setTitle('🔨 User Đã Bị Ban')
    .setDescription(`**${targetUser.username}** đã bị cấm sử dụng bot!`)
    .setColor('#FF0000')
    .addFields(
      { name: '👤 User bị ban', value: `${targetUser} (${targetUser.username})`, inline: true },
      { name: '👮 Admin thực hiện', value: `${interaction.user.username}`, inline: true },
      { name: '📝 Lý do', value: reason, inline: false },
      { name: '⏰ Thời gian ban', value: duration === 'permanent' ? 'Vĩnh viễn' : getDurationText(duration), inline: true },
      { name: '📅 Ngày ban', value: new Date().toLocaleString(), inline: true }
    )
    .setThumbnail(targetUser.displayAvatarURL())
    .setFooter({ text: `Ban ID: ${banRecord._id}` })
    .setTimestamp();

  if (expiresAt) {
    banEmbed.addFields({ name: '📅 Hết hạn', value: expiresAt.toLocaleString(), inline: true });
  }

  await interaction.editReply({ embeds: [banEmbed] });

  // Send DM to banned user
  try {
    const dmEmbed = new EmbedBuilder()
      .setTitle('🚫 Bạn Đã Bị Ban Khỏi Bot')
      .setDescription('**Bạn đã bị cấm sử dụng bot!**')
      .setColor('#FF0000')
      .addFields(
        { name: '📝 Lý do', value: reason, inline: false },
        { name: '⏰ Thời gian', value: duration === 'permanent' ? 'Vĩnh viễn' : getDurationText(duration), inline: true },
        { name: '📅 Ngày ban', value: new Date().toLocaleString(), inline: true }
      );

    if (expiresAt) {
      dmEmbed.addFields({ name: '📅 Hết hạn', value: expiresAt.toLocaleString(), inline: true });
    }

    dmEmbed.setFooter({ text: 'Liên hệ admin để biết thêm chi tiết' });

    await targetUser.send({ embeds: [dmEmbed] });
  } catch (dmError) {
    console.log(`Could not send ban DM to ${targetUser.username}`);
  }

  console.log(`🔨 ${interaction.user.username} banned ${targetUser.username} for: ${reason}`);
}

async function handleUnbanUser(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const targetUser = interaction.options.getUser('user');

  // Database access
  const db = mongoose.connection.db;
  const bannedUsersCollection = db.collection('bannedUsers');

  // Find active ban
  const activeBan = await bannedUsersCollection.findOne({ userId: targetUser.id, isActive: true });
  if (!activeBan) {
    await interaction.editReply({
      content: `❌ **${targetUser.username} không bị ban!**`
    });
    return;
  }

  // Deactivate ban
  await bannedUsersCollection.updateOne(
    { _id: activeBan._id },
    { 
      $set: { 
        isActive: false,
        unbannedAt: new Date(),
        unbannedBy: interaction.user.id,
        unbannedByUsername: interaction.user.username
      }
    }
  );

  // Create unban embed
  const unbanEmbed = new EmbedBuilder()
    .setTitle('✅ User Đã Được Unban')
    .setDescription(`**${targetUser.username}** đã được bỏ ban!`)
    .setColor('#00FF00')
    .addFields(
      { name: '👤 User được unban', value: `${targetUser} (${targetUser.username})`, inline: true },
      { name: '👮 Admin thực hiện', value: `${interaction.user.username}`, inline: true },
      { name: '📅 Ngày unban', value: new Date().toLocaleString(), inline: true },
      { name: '📝 Lý do ban gốc', value: activeBan.reason, inline: false },
      { name: '⏰ Thời gian đã ban', value: calculateBanDuration(activeBan.bannedAt), inline: true }
    )
    .setThumbnail(targetUser.displayAvatarURL())
    .setFooter({ text: `Original Ban ID: ${activeBan._id}` })
    .setTimestamp();

  await interaction.editReply({ embeds: [unbanEmbed] });

  // Send DM to unbanned user
  try {
    const dmEmbed = new EmbedBuilder()
      .setTitle('✅ Bạn Đã Được Unban')
      .setDescription('**Bạn đã được bỏ ban và có thể sử dụng bot trở lại!**')
      .setColor('#00FF00')
      .addFields(
        { name: '📅 Ngày unban', value: new Date().toLocaleString(), inline: true },
        { name: '💡 Lưu ý', value: 'Hãy tuân thủ quy tắc để tránh bị ban lại!', inline: false }
      );

    await targetUser.send({ embeds: [dmEmbed] });
  } catch (dmError) {
    console.log(`Could not send unban DM to ${targetUser.username}`);
  }

  console.log(`✅ ${interaction.user.username} unbanned ${targetUser.username}`);
}

async function handleListBanned(interaction) {
  await interaction.deferReply({ ephemeral: true });

  // Database access
  const db = mongoose.connection.db;
  const bannedUsersCollection = db.collection('bannedUsers');

  // Get active bans
  const activeBans = await bannedUsersCollection
    .find({ isActive: true })
    .sort({ bannedAt: -1 })
    .limit(20)
    .toArray();

  if (activeBans.length === 0) {
    await interaction.editReply({
      content: '✅ **Không có user nào bị ban!**'
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle('🔨 Danh Sách User Bị Ban')
    .setDescription(`**${activeBans.length} user đang bị ban:**`)
    .setColor('#FF6B6B')
    .setTimestamp();

  let banList = '';
  for (let i = 0; i < activeBans.length; i++) {
    const ban = activeBans[i];
    const timeLeft = ban.expiresAt ? 
      (new Date(ban.expiresAt) > new Date() ? 
        `Còn ${getTimeLeft(ban.expiresAt)}` : 
        'Đã hết hạn') : 
      'Vĩnh viễn';
    
    banList += `**${i + 1}.** ${ban.username} (${ban.userId})\n`;
    banList += `   📝 **Lý do:** ${ban.reason}\n`;
    banList += `   👮 **Ban bởi:** ${ban.bannedByUsername}\n`;
    banList += `   ⏰ **Thời gian:** ${timeLeft}\n`;
    banList += `   📅 **Ban từ:** ${new Date(ban.bannedAt).toLocaleDateString()}\n\n`;
  }

  embed.setDescription(`**${activeBans.length} user đang bị ban:**\n\n${banList}`);

  // Add statistics
  const totalBans = await bannedUsersCollection.countDocuments({});
  const expiredBans = await bannedUsersCollection.countDocuments({ 
    isActive: true, 
    expiresAt: { $lt: new Date() } 
  });

  embed.addFields({
    name: '📊 Thống Kê',
    value: [
      `🔨 **Tổng số ban:** ${totalBans}`,
      `⚡ **Đang hoạt động:** ${activeBans.length}`,
      `⏰ **Cần xem xét:** ${expiredBans}`,
      `📋 **Hiển thị:** ${Math.min(activeBans.length, 20)}/20`
    ].join('\n'),
    inline: false
  });

  embed.setFooter({ text: 'Sử dụng /ban-user remove để unban user' });

  await interaction.editReply({ embeds: [embed] });
}

async function handleCheckBan(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const targetUser = interaction.options.getUser('user');

  // Database access
  const db = mongoose.connection.db;
  const bannedUsersCollection = db.collection('bannedUsers');

  // Find ban record
  const banRecord = await bannedUsersCollection.findOne({ userId: targetUser.id, isActive: true });

  if (!banRecord) {
    await interaction.editReply({
      content: `✅ **${targetUser.username} không bị ban.**`
    });
    return;
  }

  // Check if expired
  const isExpired = banRecord.expiresAt && new Date() > new Date(banRecord.expiresAt);
  
  const embed = new EmbedBuilder()
    .setTitle(`🔍 Trạng Thái Ban: ${targetUser.username}`)
    .setColor(isExpired ? '#FFA500' : '#FF0000')
    .addFields(
      { name: '👤 User', value: `${targetUser} (${targetUser.username})`, inline: true },
      { name: '🚫 Status', value: isExpired ? '⏰ Đã hết hạn' : '🔨 Đang bị ban', inline: true },
      { name: '📝 Lý do', value: banRecord.reason, inline: false },
      { name: '👮 Ban bởi', value: banRecord.bannedByUsername, inline: true },
      { name: '📅 Ngày ban', value: new Date(banRecord.bannedAt).toLocaleString(), inline: true },
      { name: '⏰ Thời gian ban', value: calculateBanDuration(banRecord.bannedAt), inline: true }
    )
    .setThumbnail(targetUser.displayAvatarURL())
    .setTimestamp();

  if (banRecord.expiresAt) {
    embed.addFields({
      name: '📅 Hết hạn',
      value: new Date(banRecord.expiresAt).toLocaleString(),
      inline: true
    });
  }

  if (isExpired) {
    embed.setDescription('⚠️ **Ban đã hết hạn nhưng chưa được tự động xóa**');
  }

  await interaction.editReply({ embeds: [embed] });
}

// Helper functions
function getDurationText(duration) {
  const map = {
    '1h': '1 giờ',
    '1d': '1 ngày', 
    '3d': '3 ngày',
    '7d': '1 tuần',
    '30d': '1 tháng'
  };
  return map[duration] || duration;
}

function getTimeLeft(expiryDate) {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diff = expiry - now;
  
  if (diff <= 0) return 'Đã hết hạn';
  
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  
  if (days > 0) return `${days} ngày`;
  if (hours > 0) return `${hours} giờ`;
  return 'Dưới 1 giờ';
}

function calculateBanDuration(bannedAt) {
  const now = new Date();
  const banned = new Date(bannedAt);
  const diff = now - banned;
  
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  
  if (days > 0) return `${days} ngày ${hours} giờ`;
  if (hours > 0) return `${hours} giờ`;
  return 'Dưới 1 giờ';
}