import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { VIP_TIERS, getOrCreateVIP, purchaseVIP } from '../utils/vip.js';

export default {
  data: new SlashCommandBuilder()
    .setName('vip-admin')
    .setDescription('👨‍💼 Quản lý VIP (Admin only)')
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('➕ Thêm VIP cho user (không trừ tiền)')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('User cần thêm VIP')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('tier')
            .setDescription('VIP tier')
            .setRequired(true)
            .addChoices(
              { name: '👑 Basic VIP', value: 'basic' },
              { name: '💎 Premium VIP', value: 'premium' },
              { name: '🌟 Ultimate VIP', value: 'ultimate' },
              { name: '♾️ Lifetime VIP', value: 'lifetime' }
            ))
        .addIntegerOption(option =>
          option.setName('days')
            .setDescription('Số ngày (để trống = mặc định theo tier)')
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(36500)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('give')
        .setDescription('🎁 Tặng VIP cho user')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('User nhận VIP')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('tier')
            .setDescription('VIP tier')
            .setRequired(true)
            .addChoices(
              { name: '👑 Basic VIP', value: 'basic' },
              { name: '💎 Premium VIP', value: 'premium' },
              { name: '🌟 Ultimate VIP', value: 'ultimate' },
              { name: '♾️ Lifetime VIP', value: 'lifetime' }
            ))
        .addIntegerOption(option =>
          option.setName('days')
            .setDescription('Số ngày (để trống = mặc định theo tier)')
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(36500)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('❌ Xóa VIP của user')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('User cần xóa VIP')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('check')
        .setDescription('🔍 Kiểm tra VIP của user')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('User cần kiểm tra')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('extend')
        .setDescription('⏰ Gia hạn VIP')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('User cần gia hạn')
            .setRequired(true))
        .addIntegerOption(option =>
          option.setName('days')
            .setDescription('Số ngày gia hạn')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(36500))),
  async execute(interaction) {
    try {
      // Kiểm tra quyền admin
      if (!interaction.member.permissions.has('Administrator')) {
        await interaction.reply({
          content: '❌ Bạn không có quyền sử dụng lệnh này!',
          flags: 64
        });
        return;
      }

      const subcommand = interaction.options.getSubcommand();

      switch (subcommand) {
        case 'add':
          await handleAddVIP(interaction);
          break;
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
        content: '❌ Có lỗi xảy ra khi thực hiện lệnh VIP admin!',
        flags: 64
      });
    }
  }
};

// Thêm VIP cho user (không trừ tiền)
async function handleAddVIP(interaction) {
  const targetUser = interaction.options.getUser('user');
  const tier = interaction.options.getString('tier');
  const customDays = interaction.options.getInteger('days');

  if (!VIP_TIERS[tier]) {
    await interaction.reply({
      content: '❌ VIP tier không hợp lệ!',
      flags: 64
    });
    return;
  }

  const tierInfo = VIP_TIERS[tier];
  const duration = customDays || tierInfo.duration;

  try {
    // Tạo VIP mà không trừ tiền
    const vip = await getOrCreateVIP(targetUser.id, targetUser.username);
    
    // Cập nhật VIP tier và thời gian
    vip.vipTier = tier;
    vip.extendVip(duration);
    
    // Cập nhật benefits
    Object.assign(vip.vipBenefits, tierInfo.benefits);
    
    // Thêm vào lịch sử (đánh dấu là admin add)
    vip.vipPurchaseHistory.push({
      tier,
      duration,
      price: 0, // Admin add = miễn phí
      paymentMethod: 'admin_add',
      transactionId: `ADMIN_ADD_${Date.now()}_${targetUser.id.slice(-4)}`,
      adminId: interaction.user.id
    });
    
    // Cập nhật stats
    vip.vipStats.lastUsed = new Date();
    
    await vip.save();

    const embed = new EmbedBuilder()
      .setTitle('✅ Đã Thêm VIP Thành Công!')
      .setDescription(`Đã thêm **${tierInfo.name}** cho ${targetUser.username}`)
      .setColor('#00FF00')
      .addFields(
        { name: '👤 User', value: `${targetUser.username}\n\`${targetUser.id}\``, inline: true },
        { name: '👑 VIP Tier', value: tierInfo.name, inline: true },
        { name: '⏱️ Thời hạn', value: tier === 'lifetime' ? 'Vĩnh viễn' : `${duration} ngày`, inline: true },
        { name: '📅 Hết hạn', value: tier === 'lifetime' ? 'Không bao giờ' : `<t:${Math.floor(vip.vipExpireAt.getTime()/1000)}:F>`, inline: false },
        { name: '🎁 Lợi ích', value: [
          `💰 Coin multiplier: x${tierInfo.benefits.coinMultiplier}`,
          `🎣 Fishing bonus: x${tierInfo.benefits.fishingBonus}`,
          `🤖 Auto-fishing: ${tierInfo.benefits.autoFishingTime} phút/ngày`
        ].join('\n'), inline: false },
        { name: '👨‍💼 Admin', value: interaction.user.username, inline: true },
        { name: '🆔 Transaction ID', value: `\`ADMIN_ADD_${Date.now()}_${targetUser.id.slice(-4)}\``, inline: true }
      )
      .setFooter({ text: 'VIP đã được kích hoạt!' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    // Thông báo cho user qua DM
    try {
      const dmEmbed = new EmbedBuilder()
        .setTitle('🎉 Bạn Đã Nhận Được VIP!')
        .setDescription(`Chúc mừng! Admin đã tặng bạn **${tierInfo.name}**!`)
        .setColor(tierInfo.benefits.color)
        .addFields(
          { name: '👑 VIP Tier', value: tierInfo.name, inline: true },
          { name: '⏱️ Thời hạn', value: tier === 'lifetime' ? 'Vĩnh viễn' : `${duration} ngày`, inline: true },
          { name: '🎁 Lợi ích', value: 'Sử dụng `/vip` để xem chi tiết!', inline: false }
        )
        .setFooter({ text: 'Cảm ơn bạn đã sử dụng bot!' })
        .setTimestamp();

      await targetUser.send({ embeds: [dmEmbed] });
    } catch (dmError) {
      console.log('Could not send DM to user:', dmError.message);
    }

    console.log(`Admin ${interaction.user.username} added ${tierInfo.name} to ${targetUser.username} for ${duration} days`);

  } catch (error) {
    console.error('Error adding VIP:', error);
    await interaction.reply({
      content: `❌ Có lỗi xảy ra khi thêm VIP: \`${error.message}\`",
      flags: 64
    });
  }
}

// Tặng VIP cho user (tương tự add nhưng khác wording)
async function handleGiveVIP(interaction) {
  // Sử dụng lại logic handleAddVIP nhưng khác message
  await handleAddVIP(interaction);
}

// Xóa VIP của user
async function handleRemoveVIP(interaction) {
  const targetUser = interaction.options.getUser('user');

  try {
    const vip = await getOrCreateVIP(targetUser.id, targetUser.username);
    
    if (!vip.isVipActive()) {
      await interaction.reply({
        content: `❌ ${targetUser.username} không có VIP đang hoạt động!`,
        flags: 64
      });
      return;
    }

    const oldTier = vip.vipTier;
    const oldExpiry = vip.vipExpireAt;

    // Xóa VIP
    vip.vipTier = null;
    vip.vipExpireAt = null;
    
    // Reset benefits về mặc định
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
      .setTitle('❌ Đã Xóa VIP')
      .setDescription(`Đã xóa VIP của ${targetUser.username}`)
      .setColor('#FF0000')
      .addFields(
        { name: '👤 User', value: `${targetUser.username}\n\`${targetUser.id}\``, inline: true },
        { name: '👑 VIP cũ', value: `${VIP_TIERS[oldTier]?.name || oldTier}`, inline: true },
        { name: '📅 Hết hạn cũ', value: `<t:${Math.floor(oldExpiry.getTime()/1000)}:F>`, inline: true },
        { name: '👨‍💼 Admin', value: interaction.user.username, inline: true }
      )
      .setFooter({ text: 'VIP đã bị vô hiệu hóa' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    console.log(`Admin ${interaction.user.username} removed VIP from ${targetUser.username}`);

  } catch (error) {
    console.error('Error removing VIP:', error);
    await interaction.reply({
      content: `❌ Có lỗi xảy ra khi xóa VIP: \`${error.message}\`",
      flags: 64
    });
  }
}

// Kiểm tra VIP của user
async function handleCheckVIP(interaction) {
  const targetUser = interaction.options.getUser('user');

  try {
    const vip = await getOrCreateVIP(targetUser.id, targetUser.username);
    
    const embed = new EmbedBuilder()
      .setTitle('🔍 Kiểm Tra VIP')
      .setDescription(`Thông tin VIP của ${targetUser.username}`)
      .setColor(vip.isVipActive() ? '#00FF00' : '#FF0000')
      .addFields(
        { name: '👤 User', value: `${targetUser.username}\n\`${targetUser.id}\``, inline: true }
      );

    if (vip.isVipActive()) {
      const tierInfo = VIP_TIERS[vip.vipTier];
      const timeLeft = Math.max(0, Math.ceil((vip.vipExpireAt - Date.now()) / (1000 * 60 * 60 * 24)));
      
      embed.addFields(
        { name: '👑 VIP Tier', value: tierInfo?.name || vip.vipTier, inline: true },
        { name: '📅 Hết hạn', value: vip.vipTier === 'lifetime' ? 'Vĩnh viễn' : `<t:${Math.floor(vip.vipExpireAt.getTime()/1000)}:F>`, inline: true },
        { name: '⏱️ Thời gian còn lại', value: vip.vipTier === 'lifetime' ? 'Vĩnh viễn' : `${timeLeft} ngày`, inline: true },
        { name: '🎁 Lợi ích hiện tại', value: [
          `💰 Coin multiplier: x${vip.vipBenefits.coinMultiplier}`,
          `🎣 Fishing bonus: x${vip.vipBenefits.fishingBonus}`,
          `🤖 Auto-fishing: ${vip.vipBenefits.autoFishingTime} phút/ngày`
        ].join('\n'), inline: false }
      );
    } else {
      embed.addFields(
        { name: '📊 Trạng thái', value: '❌ Không có VIP hoặc đã hết hạn', inline: false }
      );
    }

    // Thống kê
    embed.addFields(
      { name: '📊 Thống kê', value: [
        `💸 Tổng chi tiêu: ${vip.vipStats.totalSpent.toLocaleString()} coins`,
        `📅 Tổng ngày VIP: ${vip.vipStats.totalDaysActive} ngày`,
        `📈 Lịch sử mua: ${vip.vipPurchaseHistory.length} lần`
      ].join('\n'), inline: false }
    );

    embed.setTimestamp();

    await interaction.reply({ embeds: [embed], flags: 64 });

  } catch (error) {
    console.error('Error checking VIP:', error);
    await interaction.reply({
      content: `❌ Có lỗi xảy ra khi kiểm tra VIP: \`${error.message}\`",
      flags: 64
    });
  }
}

// Gia hạn VIP
async function handleExtendVIP(interaction) {
  const targetUser = interaction.options.getUser('user');
  const days = interaction.options.getInteger('days');

  try {
    const vip = await getOrCreateVIP(targetUser.id, targetUser.username);
    
    if (!vip.isVipActive()) {
      await interaction.reply({
        content: `❌ ${targetUser.username} không có VIP đang hoạt động để gia hạn!`,
        flags: 64
      });
      return;
    }

    const oldExpiry = new Date(vip.vipExpireAt);
    vip.extendVip(days);
    await vip.save();

    const embed = new EmbedBuilder()
      .setTitle('⏰ Đã Gia Hạn VIP')
      .setDescription(`Đã gia hạn VIP cho ${targetUser.username}`)
      .setColor('#00FF00')
      .addFields(
        { name: '👤 User', value: `${targetUser.username}\n\`${targetUser.id}\``, inline: true },
        { name: '👑 VIP Tier', value: VIP_TIERS[vip.vipTier]?.name || vip.vipTier, inline: true },
        { name: '➕ Gia hạn', value: `${days} ngày`, inline: true },
        { name: '📅 Hết hạn cũ', value: `<t:${Math.floor(oldExpiry.getTime()/1000)}:F>`, inline: true },
        { name: '📅 Hết hạn mới', value: vip.vipTier === 'lifetime' ? 'Vĩnh viễn' : `<t:${Math.floor(vip.vipExpireAt.getTime()/1000)}:F>`, inline: true },
        { name: '👨‍💼 Admin', value: interaction.user.username, inline: true }
      )
      .setFooter({ text: 'VIP đã được gia hạn!' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    console.log(`Admin ${interaction.user.username} extended VIP for ${targetUser.username} by ${days} days`);

  } catch (error) {
    console.error('Error extending VIP:', error);
    await interaction.reply({
      content: `❌ Có lỗi xảy ra khi gia hạn VIP: \`${error.message}\`",
      flags: 64
    });
  }
}