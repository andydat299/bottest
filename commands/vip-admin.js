import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getOrCreateVIP, VIP_TIERS, purchaseVIP } from '../utils/vip.js';
import { isAdmin } from '../utils/admin.js';

export default {
  data: new SlashCommandBuilder()
    .setName('vip-admin')
    .setDescription('🔧 Quản lý VIP (Admin only)')
    .addSubcommand(subcommand =>
      subcommand
        .setName('give')
        .setDescription('Tặng VIP cho user')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('User nhận VIP')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('tier')
            .setDescription('Loại VIP')
            .setRequired(true)
            .addChoices(
              { name: '👑 Basic', value: 'basic' },
              { name: '💎 Premium', value: 'premium' },
              { name: '🌟 Ultimate', value: 'ultimate' },
              { name: '♾️ Lifetime', value: 'lifetime' }
            )))
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Xóa VIP của user')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('User bị xóa VIP')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('check')
        .setDescription('Kiểm tra VIP của user')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('User cần kiểm tra')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('extend')
        .setDescription('Gia hạn VIP')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('User được gia hạn')
            .setRequired(true))
        .addIntegerOption(option =>
          option.setName('days')
            .setDescription('Số ngày gia hạn')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(365))),

  async execute(interaction) {
    if (!isAdmin(interaction)) {
      await interaction.reply({
        content: '❌ Bạn không có quyền sử dụng lệnh này!',
        ephemeral: true
      });
      return;
    }

    const subcommand = interaction.options.getSubcommand();

    try {
      switch (subcommand) {
        case 'give':
          await handleGiveVIP(interaction);
          break;
        case 'remove':
          await handleRemoveVIP(interaction);
          break;
        case 'check':
          await handleCheckVIP(interaction);
          break;
        case 'extend':
          await handleExtendVIP(interaction);
          break;
      }
    } catch (error) {
      console.error('VIP Admin command error:', error);
      await interaction.reply({
        content: '❌ Có lỗi xảy ra khi thực hiện lệnh!',
        ephemeral: true
      });
    }
  }
};

async function handleGiveVIP(interaction) {
  const targetUser = interaction.options.getUser('user');
  const tier = interaction.options.getString('tier');

  const tierInfo = VIP_TIERS[tier];
  if (!tierInfo) {
    await interaction.reply({
      content: '❌ Tier VIP không hợp lệ!',
      ephemeral: true
    });
    return;
  }

  const result = await purchaseVIP(targetUser.id, targetUser.username, tier, 'admin_gift');

  if (result.success) {
    const embed = new EmbedBuilder()
      .setTitle('✅ Tặng VIP Thành Công')
      .setDescription(`Đã tặng **${tierInfo.name}** cho <@${targetUser.id}>!`)
      .setColor('#00FF00')
      .addFields(
        { name: '👤 User', value: `<@${targetUser.id}>`, inline: true },
        { name: '👑 VIP Tier', value: tierInfo.name, inline: true },
        { name: '⏱️ Thời hạn', value: tier === 'lifetime' ? 'Vĩnh viễn' : `${tierInfo.duration} ngày`, inline: true }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  } else {
    await interaction.reply({
      content: `❌ ${result.message}`,
      ephemeral: true
    });
  }
}

async function handleRemoveVIP(interaction) {
  const targetUser = interaction.options.getUser('user');
  const vip = await getOrCreateVIP(targetUser.id, targetUser.username);

  if (!vip.isVipActive()) {
    await interaction.reply({
      content: '❌ User này không có VIP!',
      ephemeral: true
    });
    return;
  }

  vip.vipTier = null;
  vip.vipExpireAt = null;
  vip.vipBenefits = {
    coinMultiplier: 1,
    fishingBonus: 1,
    dailyBonus: 1,
    workBonus: 1,
    autoFishingTime: 0,
    color: '#0099ff'
  };

  await vip.save();

  const embed = new EmbedBuilder()
    .setTitle('✅ Xóa VIP Thành Công')
    .setDescription(`Đã xóa VIP của <@${targetUser.id}>!`)
    .setColor('#FF0000')
    .addFields(
      { name: '👤 User', value: `<@${targetUser.id}>`, inline: true },
      { name: '📊 Trạng thái', value: 'VIP đã bị xóa', inline: true }
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

async function handleCheckVIP(interaction) {
  const targetUser = interaction.options.getUser('user');
  const vip = await getOrCreateVIP(targetUser.id, targetUser.username);

  if (!vip.isVipActive()) {
    await interaction.reply({
      content: `❌ <@${targetUser.id}> không có VIP!`,
      ephemeral: true
    });
    return;
  }

  const tierInfo = VIP_TIERS[vip.vipTier];
  const remainingDays = vip.getRemainingDays();

  const embed = new EmbedBuilder()
    .setTitle('🔍 Thông Tin VIP')
    .setDescription(`VIP của <@${targetUser.id}>`)
    .setColor(vip.vipBenefits.color)
    .addFields(
      { name: '👤 User', value: `<@${targetUser.id}>`, inline: true },
      { name: '👑 VIP Tier', value: tierInfo?.name || vip.vipTier, inline: true },
      { name: '⏱️ Thời gian còn lại', value: remainingDays, inline: true },
      { name: '💰 Coin Bonus', value: `x${vip.vipBenefits.coinMultiplier}`, inline: true },
      { name: '🎣 Fishing Bonus', value: `x${vip.vipBenefits.fishingBonus}`, inline: true },
      { name: '🤖 Auto Fishing', value: `${vip.vipBenefits.autoFishingTime} phút/ngày`, inline: true },
      { name: '📈 Tổng chi tiêu', value: `${vip.vipStats.totalSpent.toLocaleString()} coins`, inline: true },
      { name: '📊 Lịch sử mua', value: `${vip.vipPurchaseHistory.length} lần`, inline: true }
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleExtendVIP(interaction) {
  const targetUser = interaction.options.getUser('user');
  const days = interaction.options.getInteger('days');
  const vip = await getOrCreateVIP(targetUser.id, targetUser.username);

  if (!vip.isVipActive()) {
    await interaction.reply({
      content: '❌ User này không có VIP để gia hạn!',
      ephemeral: true
    });
    return;
  }

  vip.extendVip(days);
  await vip.save();

  const newRemainingDays = vip.getRemainingDays();

  const embed = new EmbedBuilder()
    .setTitle('✅ Gia Hạn VIP Thành Công')
    .setDescription(`Đã gia hạn VIP cho <@${targetUser.id}>!`)
    .setColor('#00FF00')
    .addFields(
      { name: '👤 User', value: `<@${targetUser.id}>`, inline: true },
      { name: '📅 Gia hạn', value: `${days} ngày`, inline: true },
      { name: '⏱️ Thời gian còn lại', value: newRemainingDays, inline: true }
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}