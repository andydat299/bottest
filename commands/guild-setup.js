import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { getGuildSettings, updateGuildSettings } from '../utils/guildManager.js';

export default {
  data: new SlashCommandBuilder()
    .setName('guild-setup')
    .setDescription('🏠 [ADMIN] Thiết lập bot cho server')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('Xem cài đặt hiện tại của server'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('admin-channel')
        .setDescription('Đặt channel admin cho withdraw và thông báo')
        .addChannelOption(option =>
          option.setName('channel')
            .setDescription('Channel dành cho admin')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('economy')
        .setDescription('Cài đặt hệ thống kinh tế')
        .addNumberOption(option =>
          option.setName('fishing_multiplier')
            .setDescription('Hệ số nhân cho câu cá (1.0 = bình thường)')
            .setMinValue(0.1)
            .setMaxValue(5.0)
            .setRequired(false))
        .addIntegerOption(option =>
          option.setName('daily_reward')
            .setDescription('Phần thưởng daily (xu)')
            .setMinValue(100)
            .setMaxValue(10000)
            .setRequired(false))
        .addIntegerOption(option =>
          option.setName('max_transfer')
            .setDescription('Số xu transfer tối đa')
            .setMinValue(1000)
            .setMaxValue(1000000)
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('features')
        .setDescription('Bật/tắt các tính năng')
        .addBooleanOption(option =>
          option.setName('fishing')
            .setDescription('Cho phép câu cá')
            .setRequired(false))
        .addBooleanOption(option =>
          option.setName('marriage')
            .setDescription('Cho phép kết hôn')
            .setRequired(false))
        .addBooleanOption(option =>
          option.setName('transfer')
            .setDescription('Cho phép chuyển xu')
            .setRequired(false))
        .addBooleanOption(option =>
          option.setName('withdraw')
            .setDescription('Cho phép rút xu')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('permissions')
        .setDescription('Quản lý quyền admin')
        .addStringOption(option =>
          option.setName('action')
            .setDescription('Hành động')
            .addChoices(
              { name: 'Thêm Withdraw Admin', value: 'add_withdraw' },
              { name: 'Xóa Withdraw Admin', value: 'remove_withdraw' },
              { name: 'Thêm Economy Admin', value: 'add_economy' },
              { name: 'Xóa Economy Admin', value: 'remove_economy' }
            )
            .setRequired(true))
        .addUserOption(option =>
          option.setName('user')
            .setDescription('User để thêm/xóa quyền')
            .setRequired(true))),

  async execute(interaction) {
    try {
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        await interaction.reply({
          content: '❌ **Chỉ admin server mới có thể sử dụng lệnh này!**',
          ephemeral: true
        });
        return;
      }

      const subcommand = interaction.options.getSubcommand();
      
      switch (subcommand) {
        case 'view':
          await handleViewSettings(interaction);
          break;
        case 'admin-channel':
          await handleAdminChannel(interaction);
          break;
        case 'economy':
          await handleEconomySettings(interaction);
          break;
        case 'features':
          await handleFeatureSettings(interaction);
          break;
        case 'permissions':
          await handlePermissions(interaction);
          break;
      }

    } catch (error) {
      console.error('Guild setup command error:', error);
      await interaction.reply({
        content: '❌ Có lỗi xảy ra khi thiết lập server!',
        ephemeral: true
      });
    }
  }
};

async function handleViewSettings(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const settings = await getGuildSettings(interaction.guildId);
  
  const embed = new EmbedBuilder()
    .setTitle(`🏠 Cài Đặt Server: ${interaction.guild.name}`)
    .setColor('#3498db')
    .setThumbnail(interaction.guild.iconURL())
    .setTimestamp();

  // Admin Channel
  const adminChannel = settings.adminChannel ? 
    `<#${settings.adminChannel}>` : 
    '❌ Chưa đặt';
  embed.addFields({ name: '🛡️ Admin Channel', value: adminChannel, inline: true });

  // Economy Settings
  embed.addFields({
    name: '💰 Cài Đặt Kinh Tế',
    value: [
      `🎣 **Fishing Multiplier:** x${settings.economy.fishingMultiplier}`,
      `💎 **Daily Reward:** ${settings.economy.dailyRewardAmount.toLocaleString()} xu`,
      `📤 **Max Transfer:** ${settings.economy.maxTransferAmount.toLocaleString()} xu`
    ].join('\n'),
    inline: false
  });

  // Features Status
  const features = settings.features;
  const featureStatus = [
    `🎣 **Fishing:** ${features.fishing ? '✅' : '❌'}`,
    `💒 **Marriage:** ${features.marriage ? '✅' : '❌'}`,
    `💸 **Transfer:** ${features.transfer ? '✅' : '❌'}`,
    `🏦 **Withdraw:** ${features.withdraw ? '✅' : '❌'}`,
    `🛒 **Shop:** ${features.shop ? '✅' : '❌'}`
  ].join('\n');
  
  embed.addFields({ name: '🎮 Tính Năng', value: featureStatus, inline: true });

  // Permissions
  const perms = settings.permissions;
  const permissionInfo = [
    `🏦 **Withdraw Admins:** ${perms.withdrawAdmins.length}`,
    `💰 **Economy Admins:** ${perms.economyAdmins.length}`,
    `🔧 **Bot Admins:** ${perms.botAdmins.length}`
  ].join('\n');
  
  embed.addFields({ name: '👮 Quyền Hạn', value: permissionInfo, inline: true });

  // Limits
  embed.addFields({
    name: '📊 Giới Hạn',
    value: [
      `🎣 **Max Fish/Hour:** ${settings.limits.maxFishPerHour}`,
      `💸 **Max Transfers/Day:** ${settings.limits.maxTransfersPerDay}`,
      `🏦 **Min Withdraw:** ${settings.limits.minWithdrawAmount.toLocaleString()} xu`
    ].join('\n'),
    inline: false
  });

  embed.setFooter({ text: 'Sử dụng /guild-setup để thay đổi cài đặt' });

  await interaction.editReply({ embeds: [embed] });
}

async function handleAdminChannel(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const channel = interaction.options.getChannel('channel');
  
  if (channel.type !== ChannelType.GuildText) {
    await interaction.editReply({
      content: '❌ **Chỉ có thể chọn text channel!**'
    });
    return;
  }

  const success = await updateGuildSettings(interaction.guildId, {
    adminChannel: channel.id
  });

  if (success) {
    const embed = new EmbedBuilder()
      .setTitle('✅ Đã Cập Nhật Admin Channel')
      .setColor('#00ff00')
      .addFields(
        { name: '📍 Channel mới', value: `${channel}`, inline: true },
        { name: '🎯 Mục đích', value: 'Withdraw notifications\nAdmin alerts\nSystem messages', inline: true }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

    // Test message to admin channel
    try {
      await channel.send({
        embeds: [new EmbedBuilder()
          .setTitle('🛡️ Admin Channel Configured')
          .setDescription(`**${interaction.user.username}** đã đặt channel này làm admin channel.`)
          .setColor('#3498db')
          .setTimestamp()]
      });
    } catch (error) {
      console.log('Could not send test message to admin channel');
    }
  } else {
    await interaction.editReply({
      content: '❌ **Có lỗi khi cập nhật admin channel!**'
    });
  }
}

async function handleEconomySettings(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const fishingMultiplier = interaction.options.getNumber('fishing_multiplier');
  const dailyReward = interaction.options.getInteger('daily_reward');
  const maxTransfer = interaction.options.getInteger('max_transfer');

  const updates = {};
  if (fishingMultiplier !== null) updates['economy.fishingMultiplier'] = fishingMultiplier;
  if (dailyReward !== null) updates['economy.dailyRewardAmount'] = dailyReward;
  if (maxTransfer !== null) updates['economy.maxTransferAmount'] = maxTransfer;

  if (Object.keys(updates).length === 0) {
    await interaction.editReply({
      content: '❌ **Bạn cần chọn ít nhất một cài đặt để thay đổi!**'
    });
    return;
  }

  const success = await updateGuildSettings(interaction.guildId, updates);

  if (success) {
    const embed = new EmbedBuilder()
      .setTitle('✅ Đã Cập Nhật Cài Đặt Kinh Tế')
      .setColor('#00ff00')
      .setTimestamp();

    let changes = [];
    if (fishingMultiplier !== null) changes.push(`🎣 **Fishing Multiplier:** x${fishingMultiplier}`);
    if (dailyReward !== null) changes.push(`💎 **Daily Reward:** ${dailyReward.toLocaleString()} xu`);
    if (maxTransfer !== null) changes.push(`📤 **Max Transfer:** ${maxTransfer.toLocaleString()} xu`);

    embed.setDescription(changes.join('\n'));

    await interaction.editReply({ embeds: [embed] });
  } else {
    await interaction.editReply({
      content: '❌ **Có lỗi khi cập nhật cài đặt!**'
    });
  }
}

async function handleFeatureSettings(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const fishing = interaction.options.getBoolean('fishing');
  const marriage = interaction.options.getBoolean('marriage');
  const transfer = interaction.options.getBoolean('transfer');
  const withdraw = interaction.options.getBoolean('withdraw');

  const updates = {};
  if (fishing !== null) updates['features.fishing'] = fishing;
  if (marriage !== null) updates['features.marriage'] = marriage;
  if (transfer !== null) updates['features.transfer'] = transfer;
  if (withdraw !== null) updates['features.withdraw'] = withdraw;

  if (Object.keys(updates).length === 0) {
    await interaction.editReply({
      content: '❌ **Bạn cần chọn ít nhất một tính năng để thay đổi!**'
    });
    return;
  }

  const success = await updateGuildSettings(interaction.guildId, updates);

  if (success) {
    const embed = new EmbedBuilder()
      .setTitle('✅ Đã Cập Nhật Tính Năng')
      .setColor('#00ff00')
      .setTimestamp();

    let changes = [];
    if (fishing !== null) changes.push(`🎣 **Fishing:** ${fishing ? '✅ Bật' : '❌ Tắt'}`);
    if (marriage !== null) changes.push(`💒 **Marriage:** ${marriage ? '✅ Bật' : '❌ Tắt'}`);
    if (transfer !== null) changes.push(`💸 **Transfer:** ${transfer ? '✅ Bật' : '❌ Tắt'}`);
    if (withdraw !== null) changes.push(`🏦 **Withdraw:** ${withdraw ? '✅ Bật' : '❌ Tắt'}`);

    embed.setDescription(changes.join('\n'));

    await interaction.editReply({ embeds: [embed] });
  } else {
    await interaction.editReply({
      content: '❌ **Có lỗi khi cập nhật tính năng!**'
    });
  }
}

async function handlePermissions(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const action = interaction.options.getString('action');
  const user = interaction.options.getUser('user');

  const settings = await getGuildSettings(interaction.guildId);
  let permArray = [];
  let permName = '';

  switch (action) {
    case 'add_withdraw':
    case 'remove_withdraw':
      permArray = settings.permissions.withdrawAdmins || [];
      permName = 'Withdraw Admin';
      break;
    case 'add_economy':
    case 'remove_economy':
      permArray = settings.permissions.economyAdmins || [];
      permName = 'Economy Admin';
      break;
  }

  const isAdd = action.startsWith('add_');
  const hasPermission = permArray.includes(user.id);

  if (isAdd && hasPermission) {
    await interaction.editReply({
      content: `❌ **${user.username} đã có quyền ${permName} rồi!**`
    });
    return;
  }

  if (!isAdd && !hasPermission) {
    await interaction.editReply({
      content: `❌ **${user.username} không có quyền ${permName}!**`
    });
    return;
  }

  // Update permissions
  let updateField = '';
  if (action.includes('withdraw')) updateField = 'permissions.withdrawAdmins';
  if (action.includes('economy')) updateField = 'permissions.economyAdmins';

  if (isAdd) {
    permArray.push(user.id);
  } else {
    permArray = permArray.filter(id => id !== user.id);
  }

  const success = await updateGuildSettings(interaction.guildId, {
    [updateField]: permArray
  });

  if (success) {
    const embed = new EmbedBuilder()
      .setTitle(`✅ Đã ${isAdd ? 'Thêm' : 'Xóa'} Quyền`)
      .setColor(isAdd ? '#00ff00' : '#ff6b6b')
      .addFields(
        { name: '👤 User', value: `${user}`, inline: true },
        { name: '🔧 Quyền', value: permName, inline: true },
        { name: '⚡ Hành động', value: isAdd ? 'Thêm' : 'Xóa', inline: true }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } else {
    await interaction.editReply({
      content: '❌ **Có lỗi khi cập nhật quyền!**'
    });
  }
}