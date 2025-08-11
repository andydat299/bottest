import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { VIP_TIERS, getOrCreateVIP } from '../utils/vip.js';

export default {
  data: new SlashCommandBuilder()
    .setName('vip-admin')
    .setDescription('Admin VIP management')
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Add VIP to user (free)')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('Target user')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('tier')
            .setDescription('VIP tier')
            .setRequired(true)
            .addChoices(
              { name: 'Basic VIP', value: 'basic' },
              { name: 'Premium VIP', value: 'premium' },
              { name: 'Ultimate VIP', value: 'ultimate' },
              { name: 'Lifetime VIP', value: 'lifetime' }
            ))
        .addIntegerOption(option =>
          option.setName('days')
            .setDescription('Custom days (optional)')
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(36500)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remove VIP from user')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('Target user')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('check')
        .setDescription('Check user VIP status')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('Target user')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('extend')
        .setDescription('Extend VIP duration')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('Target user')
            .setRequired(true))
        .addIntegerOption(option =>
          option.setName('days')
            .setDescription('Days to extend')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(36500))),
  async execute(interaction) {
    try {
      // Check admin permission
      if (!interaction.member.permissions.has('Administrator')) {
        await interaction.reply({
          content: 'You do not have permission to use this command!',
          flags: 64
        });
        return;
      }

      const subcommand = interaction.options.getSubcommand();

      switch (subcommand) {
        case 'add':
          await handleAddVIP(interaction);
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
        content: 'An error occurred while executing VIP admin command!',
        flags: 64
      });
    }
  }
};

async function handleAddVIP(interaction) {
  const targetUser = interaction.options.getUser('user');
  const tier = interaction.options.getString('tier');
  const customDays = interaction.options.getInteger('days');

  if (!VIP_TIERS[tier]) {
    await interaction.reply({
      content: 'Invalid VIP tier!',
      flags: 64
    });
    return;
  }

  const tierInfo = VIP_TIERS[tier];
  const duration = customDays || tierInfo.duration;

  try {
    const vip = await getOrCreateVIP(targetUser.id, targetUser.username);
    
    // Update VIP tier and duration
    vip.vipTier = tier;
    vip.extendVip(duration);
    
    // Update benefits
    Object.assign(vip.vipBenefits, tierInfo.benefits);
    
    // Add to purchase history (mark as admin add)
    vip.vipPurchaseHistory.push({
      tier,
      duration,
      price: 0, // Admin add = free
      paymentMethod: 'admin_add',
      transactionId: `ADMIN_ADD_${Date.now()}_${targetUser.id.slice(-4)}`,
      adminId: interaction.user.id
    });
    
    vip.vipStats.lastUsed = new Date();
    await vip.save();

    const embed = new EmbedBuilder()
      .setTitle('VIP Added Successfully!')
      .setDescription(`Added ${tierInfo.name} to ${targetUser.username}`)
      .setColor('#00FF00')
      .addFields(
        { name: 'User', value: `${targetUser.username}\n\`${targetUser.id}\``, inline: true },
        { name: 'VIP Tier', value: tierInfo.name, inline: true },
        { name: 'Duration', value: tier === 'lifetime' ? 'Lifetime' : `${duration} days`, inline: true },
        { name: 'Expires', value: tier === 'lifetime' ? 'Never' : `<t:${Math.floor(vip.vipExpireAt.getTime()/1000)}:F>`, inline: false },
        { name: 'Benefits', value: [
          `Coin multiplier: x${tierInfo.benefits.coinMultiplier}`,
          `Fishing bonus: x${tierInfo.benefits.fishingBonus}`,
          `Auto-fishing: ${tierInfo.benefits.autoFishingTime} min/day`
        ].join('\n'), inline: false },
        { name: 'Admin', value: interaction.user.username, inline: true }
      )
      .setFooter({ text: 'VIP has been activated!' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    // Send DM to user
    try {
      const dmEmbed = new EmbedBuilder()
        .setTitle('You Received VIP!')
        .setDescription(`Congratulations! Admin gave you ${tierInfo.name}!`)
        .setColor(tierInfo.benefits.color)
        .addFields(
          { name: 'VIP Tier', value: tierInfo.name, inline: true },
          { name: 'Duration', value: tier === 'lifetime' ? 'Lifetime' : `${duration} days`, inline: true },
          { name: 'Benefits', value: 'Use `/vip` to see details!', inline: false }
        )
        .setFooter({ text: 'Thank you for using our bot!' })
        .setTimestamp();

      await targetUser.send({ embeds: [dmEmbed] });
    } catch (dmError) {
      console.log('Could not send DM to user:', dmError.message);
    }

    console.log(`Admin ${interaction.user.username} added ${tierInfo.name} to ${targetUser.username} for ${duration} days`);

  } catch (error) {
    console.error('Error adding VIP:', error);
    await interaction.reply({
      content: `Error adding VIP: ${error.message}`,
      flags: 64
    });
  }
}

async function handleRemoveVIP(interaction) {
  const targetUser = interaction.options.getUser('user');

  try {
    const vip = await getOrCreateVIP(targetUser.id, targetUser.username);
    
    if (!vip.isVipActive()) {
      await interaction.reply({
        content: `${targetUser.username} does not have active VIP!`,
        flags: 64
      });
      return;
    }

    const oldTier = vip.vipTier;
    const oldExpiry = vip.vipExpireAt;

    // Remove VIP
    vip.vipTier = null;
    vip.vipExpireAt = null;
    
    // Reset benefits to default
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
      .setTitle('VIP Removed')
      .setDescription(`Removed VIP from ${targetUser.username}`)
      .setColor('#FF0000')
      .addFields(
        { name: 'User', value: `${targetUser.username}\n\`${targetUser.id}\``, inline: true },
        { name: 'Old VIP', value: `${VIP_TIERS[oldTier]?.name || oldTier}`, inline: true },
        { name: 'Old Expiry', value: `<t:${Math.floor(oldExpiry.getTime()/1000)}:F>`, inline: true },
        { name: 'Admin', value: interaction.user.username, inline: true }
      )
      .setFooter({ text: 'VIP has been deactivated' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    console.log(`Admin ${interaction.user.username} removed VIP from ${targetUser.username}`);

  } catch (error) {
    console.error('Error removing VIP:', error);
    await interaction.reply({
      content: `Error removing VIP: ${error.message}`,
      flags: 64
    });
  }
}

async function handleCheckVIP(interaction) {
  const targetUser = interaction.options.getUser('user');

  try {
    const vip = await getOrCreateVIP(targetUser.id, targetUser.username);
    
    const embed = new EmbedBuilder()
      .setTitle('VIP Status Check')
      .setDescription(`VIP information for ${targetUser.username}`)
      .setColor(vip.isVipActive() ? '#00FF00' : '#FF0000')
      .addFields(
        { name: 'User', value: `${targetUser.username}\n\`${targetUser.id}\``, inline: true }
      );

    if (vip.isVipActive()) {
      const tierInfo = VIP_TIERS[vip.vipTier];
      const timeLeft = Math.max(0, Math.ceil((vip.vipExpireAt - Date.now()) / (1000 * 60 * 60 * 24)));
      
      embed.addFields(
        { name: 'VIP Tier', value: tierInfo?.name || vip.vipTier, inline: true },
        { name: 'Expires', value: vip.vipTier === 'lifetime' ? 'Never' : `<t:${Math.floor(vip.vipExpireAt.getTime()/1000)}:F>`, inline: true },
        { name: 'Time Left', value: vip.vipTier === 'lifetime' ? 'Lifetime' : `${timeLeft} days`, inline: true },
        { name: 'Current Benefits', value: [
          `Coin multiplier: x${vip.vipBenefits.coinMultiplier}`,
          `Fishing bonus: x${vip.vipBenefits.fishingBonus}`,
          `Auto-fishing: ${vip.vipBenefits.autoFishingTime} min/day`
        ].join('\n'), inline: false }
      );
    } else {
      embed.addFields(
        { name: 'Status', value: 'No active VIP or expired', inline: false }
      );
    }

    // Statistics
    embed.addFields(
      { name: 'Statistics', value: [
        `Total spent: ${vip.vipStats.totalSpent.toLocaleString()} coins`,
        `Total VIP days: ${vip.vipStats.totalDaysActive} days`,
        `Purchase history: ${vip.vipPurchaseHistory.length} times`
      ].join('\n'), inline: false }
    );

    embed.setTimestamp();

    await interaction.reply({ embeds: [embed], flags: 64 });

  } catch (error) {
    console.error('Error checking VIP:', error);
    await interaction.reply({
      content: `Error checking VIP: ${error.message}`,
      flags: 64
    });
  }
}

async function handleExtendVIP(interaction) {
  const targetUser = interaction.options.getUser('user');
  const days = interaction.options.getInteger('days');

  try {
    const vip = await getOrCreateVIP(targetUser.id, targetUser.username);
    
    if (!vip.isVipActive()) {
      await interaction.reply({
        content: `${targetUser.username} does not have active VIP to extend!`,
        flags: 64
      });
      return;
    }

    const oldExpiry = new Date(vip.vipExpireAt);
    vip.extendVip(days);
    await vip.save();

    const embed = new EmbedBuilder()
      .setTitle('VIP Extended')
      .setDescription(`Extended VIP for ${targetUser.username}`)
      .setColor('#00FF00')
      .addFields(
        { name: 'User', value: `${targetUser.username}\n\`${targetUser.id}\``, inline: true },
        { name: 'VIP Tier', value: VIP_TIERS[vip.vipTier]?.name || vip.vipTier, inline: true },
        { name: 'Extension', value: `${days} days`, inline: true },
        { name: 'Old Expiry', value: `<t:${Math.floor(oldExpiry.getTime()/1000)}:F>`, inline: true },
        { name: 'New Expiry', value: vip.vipTier === 'lifetime' ? 'Lifetime' : `<t:${Math.floor(vip.vipExpireAt.getTime()/1000)}:F>`, inline: true },
        { name: 'Admin', value: interaction.user.username, inline: true }
      )
      .setFooter({ text: 'VIP has been extended!' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    console.log(`Admin ${interaction.user.username} extended VIP for ${targetUser.username} by ${days} days`);

  } catch (error) {
    console.error('Error extending VIP:', error);
    await interaction.reply({
      content: `Error extending VIP: ${error.message}`,
      flags: 64
    });
  }
}