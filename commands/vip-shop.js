import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('vip-shop')
    .setDescription('👑 Mua VIP status và mystery boxes'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const { User } = await import('../schemas/userSchema.js');
      const { VIP } = await import('../schemas/vipSchema.js');
      const { getUserVipStatus, VIP_TIERS, MYSTERY_BOX_TYPES } = await import('../utils/vipManager.js');

      // Get user balance
      let user = await User.findOne({ discordId: interaction.user.id });
      if (!user) {
        return await interaction.editReply({
          content: '❌ Bạn cần có tài khoản trước khi mua VIP. Hãy dùng lệnh `/balance` trước!'
        });
      }

      // Get current VIP status
      const vipStatus = await getUserVipStatus(VIP, interaction.user.id);

      // Create VIP options
      const vipOptions = new StringSelectMenuBuilder()
        .setCustomId('vip_purchase')
        .setPlaceholder('Chọn gói VIP muốn mua...')
        .addOptions([
          {
            label: '🥉 VIP Đồng (30 ngày)',
            description: `${VIP_TIERS.bronze.cost.toLocaleString()} xu - Đặc quyền cơ bản`,
            value: 'bronze_30d',
            emoji: '🥉'
          },
          {
            label: '🥈 VIP Bạc (30 ngày)', 
            description: `${VIP_TIERS.silver.cost.toLocaleString()} xu - Đặc quyền nâng cao`,
            value: 'silver_30d',
            emoji: '🥈'
          },
          {
            label: '🥇 VIP Vàng (30 ngày)',
            description: `${VIP_TIERS.gold.cost.toLocaleString()} xu - Đặc quyền cao cấp`,
            value: 'gold_30d', 
            emoji: '🥇'
          },
          {
            label: '💎 VIP Kim Cương (30 ngày)',
            description: `${VIP_TIERS.diamond.cost.toLocaleString()} xu - Đặc quyền tối thượng`,
            value: 'diamond_30d',
            emoji: '💎'
          }
        ]);

      // Create Mystery Box options
      const mysteryOptions = new StringSelectMenuBuilder()
        .setCustomId('mystery_purchase')
        .setPlaceholder('Mua Mystery Boxes...')
        .addOptions([
          {
            label: '🎁 Hộp Bí Ẩn Cơ Bản',
            description: `${MYSTERY_BOX_TYPES.basic.cost.toLocaleString()} xu - Phần thưởng ngẫu nhiên`,
            value: 'basic_box',
            emoji: '🎁'
          },
          {
            label: '🎊 Hộp Bí Ẩn Khổng Lồ',
            description: `${MYSTERY_BOX_TYPES.mega.cost.toLocaleString()} xu - Phần thưởng lớn hơn`,
            value: 'mega_box',
            emoji: '🎊'
          },
          {
            label: '💎 Hộp Bí Ẩn Kim Cương (Chỉ VIP)',
            description: `${MYSTERY_BOX_TYPES.diamond.cost.toLocaleString()} xu - Phần thưởng khủng`,
            value: 'diamond_box',
            emoji: '💎'
          }
        ]);

      // Create main embed
      const embed = new EmbedBuilder()
        .setTitle('👑 VIP SHOP - Đặc Quyền & Mystery Boxes')
        .setDescription('**Chọn gói VIP hoặc Mystery Box bên dưới:**')
        .addFields(
          {
            name: '💰 Số dư hiện tại',
            value: `${user.balance.toLocaleString()} xu`,
            inline: true
          },
          {
            name: '👑 VIP hiện tại',
            value: vipStatus.isVip ? 
              `${VIP_TIERS[vipStatus.tier]?.name || vipStatus.tier} (${vipStatus.expiresAt ? `<t:${Math.floor(vipStatus.expiresAt.getTime()/1000)}:R>` : 'Vĩnh viễn'})` : 
              'Không có VIP',
            inline: true
          },
          {
            name: '\u200b',
            value: '\u200b',
            inline: true
          },
          {
            name: '🥉 VIP Đồng',
            value: '• -10% tỷ lệ hụt câu cá\n• +1,000 xu bonus hàng ngày\n• +5% tỷ lệ thắng casino\n• -25% thời gian chờ\n• Giảm 10% giá shop',
            inline: true
          },
          {
            name: '🥈 VIP Bạc', 
            value: '• -20% tỷ lệ hụt câu cá\n• +2,500 xu bonus hàng ngày\n• +10% tỷ lệ thắng casino\n• -50% thời gian chờ\n• Giảm 20% giá shop\n• Truy cập bàn VIP',
            inline: true
          },
          {
            name: '🥇 VIP Vàng',
            value: '• -30% tỷ lệ hụt câu cá\n• +5,000 xu bonus hàng ngày\n• +15% tỷ lệ thắng casino\n• -75% thời gian chờ\n• Giảm 30% giá shop\n• Tính năng tự động',
            inline: true
          },
          {
            name: '💎 VIP Kim Cương',
            value: '• -50% tỷ lệ hụt câu cá\n• +10,000 xu bonus hàng ngày\n• +25% tỷ lệ thắng casino\n• Không có thời gian chờ\n• Giảm 50% giá shop\n• Tự động hoàn toàn\n• Sự kiện độc quyền',
            inline: false
          },
          {
            name: '🎁 Hộp Bí Ẩn',
            value: `**🎁 Cơ Bản:** ${MYSTERY_BOX_TYPES.basic.cost.toLocaleString()} xu - Phần thưởng ngẫu nhiên\n**🎊 Khổng Lồ:** ${MYSTERY_BOX_TYPES.mega.cost.toLocaleString()} xu - Phần thưởng tốt hơn\n**💎 Kim Cương:** ${MYSTERY_BOX_TYPES.diamond.cost.toLocaleString()} xu - Phần thưởng cực khủng (chỉ VIP)`,
            inline: false
          }
        )
        .setColor('#ffd700')
        .setThumbnail(interaction.user.displayAvatarURL())
        .setTimestamp();

      const row1 = new ActionRowBuilder().addComponents(vipOptions);
      const row2 = new ActionRowBuilder().addComponents(mysteryOptions);

      await interaction.editReply({ 
        embeds: [embed], 
        components: [row1, row2]
      });

      // Handle select menu interactions
      const collector = interaction.channel.createMessageComponentCollector({
        filter: (i) => i.user.id === interaction.user.id,
        time: 300000 // 5 minutes
      });

      collector.on('collect', async (selectInteraction) => {
        try {
          await selectInteraction.deferUpdate();

          if (selectInteraction.customId === 'vip_purchase') {
            await handleVipPurchase(selectInteraction, selectInteraction.values[0]);
          } else if (selectInteraction.customId === 'mystery_purchase') {
            await handleMysteryBoxPurchase(selectInteraction, selectInteraction.values[0]);
          }
        } catch (error) {
          console.error('❌ VIP shop interaction error:', error);
          await selectInteraction.followUp({
            content: '❌ Có lỗi khi xử lý mua hàng!',
            ephemeral: true
          });
        }
      });

      collector.on('end', async () => {
        try {
          await interaction.editReply({
            components: [] // Remove buttons when expired
          });
        } catch (error) {
          // Ignore if interaction is already gone
        }
      });

    } catch (error) {
      console.error('❌ VIP shop error:', error);
      
      await interaction.editReply({
        content: `❌ **Có lỗi khi mở VIP shop:**\n\`\`\`${error.message}\`\`\``
      });
    }
  }
};

async function handleVipPurchase(interaction, value) {
  try {
    const [tier, duration] = value.split('_');
    
    const { User } = await import('../schemas/userSchema.js');
    const { VIP } = await import('../schemas/vipSchema.js');
    const { VIP_TIERS, getUserVipStatus } = await import('../utils/vipManager.js');

    // Get user and current balance
    const user = await User.findOne({ discordId: interaction.user.id });
    if (!user) {
      return await interaction.followUp({
        content: '❌ Không tìm thấy tài khoản của bạn!',
        ephemeral: true
      });
    }

    // Get tier config
    const tierConfig = VIP_TIERS[tier];
    if (!tierConfig) {
      return await interaction.followUp({
        content: '❌ Gói VIP không hợp lệ!',
        ephemeral: true
      });
    }

    // Check balance
    if (user.balance < tierConfig.cost) {
      return await interaction.followUp({
        content: `❌ **Không đủ xu!**\n\nCần: ${tierConfig.cost.toLocaleString()} xu\nCó: ${user.balance.toLocaleString()} xu\nThiếu: ${(tierConfig.cost - user.balance).toLocaleString()} xu`,
        ephemeral: true
      });
    }

    // Check current VIP status
    const currentVip = await getUserVipStatus(VIP, interaction.user.id);
    
    // Calculate new expiry date
    const now = new Date();
    let newExpiryDate;
    
    if (currentVip.isVip && currentVip.expiresAt && currentVip.expiresAt > now) {
      // Extend current VIP
      newExpiryDate = new Date(currentVip.expiresAt.getTime() + tierConfig.duration * 24 * 60 * 60 * 1000);
    } else {
      // New VIP or expired
      newExpiryDate = new Date(now.getTime() + tierConfig.duration * 24 * 60 * 60 * 1000);
    }

    // Deduct balance
    user.balance -= tierConfig.cost;
    user.isVip = true;
    user.currentVipTier = tier;
    await user.save();

    // Create or update VIP record
    let vipRecord = await VIP.findOne({ userId: interaction.user.id });
    
    if (!vipRecord) {
      vipRecord = new VIP({
        userId: interaction.user.id,
        username: interaction.user.username,
        currentTier: tier,
        expiresAt: newExpiryDate,
        benefits: tierConfig.benefits,
        totalSpent: tierConfig.cost,
        purchaseHistory: [{
          tier: tier,
          duration: tierConfig.duration,
          cost: tierConfig.cost,
          purchasedAt: now,
          purchasedBy: 'self'
        }]
      });
    } else {
      // Update existing VIP
      vipRecord.currentTier = tier;
      vipRecord.expiresAt = newExpiryDate;
      vipRecord.benefits = tierConfig.benefits;
      vipRecord.totalSpent += tierConfig.cost;
      vipRecord.isActive = true;
      vipRecord.purchaseHistory.push({
        tier: tier,
        duration: tierConfig.duration,
        cost: tierConfig.cost,
        purchasedAt: now,
        purchasedBy: 'self'
      });
    }

    await vipRecord.save();

    // Success embed
    const successEmbed = new EmbedBuilder()
      .setTitle('🎉 VIP Mua Thành Công!')
      .setDescription(`**Chúc mừng ${interaction.user.username}!**`)
      .addFields(
        { name: '👑 Gói VIP', value: tierConfig.name, inline: true },
        { name: '💰 Chi phí', value: `${tierConfig.cost.toLocaleString()} xu`, inline: true },
        { name: '💳 Số dư còn lại', value: `${user.balance.toLocaleString()} xu`, inline: true },
        { name: '⏰ Có hiệu lực đến', value: `<t:${Math.floor(newExpiryDate.getTime()/1000)}:F>`, inline: false },
        { name: '🎁 Đặc quyền nhận được', value: getVipBenefitsText(tierConfig.benefits), inline: false }
      )
      .setColor('#ffd700')
      .setThumbnail(interaction.user.displayAvatarURL())
      .setTimestamp();

    await interaction.followUp({
      embeds: [successEmbed],
      ephemeral: true
    });

    console.log(`👑 VIP purchased: ${interaction.user.username} bought ${tier} for ${tierConfig.cost} xu`);

  } catch (error) {
    console.error('❌ VIP purchase error:', error);
    await interaction.followUp({
      content: `❌ **Có lỗi khi mua VIP:**\n\`\`\`${error.message}\`\`\``,
      ephemeral: true
    });
  }
}

async function handleMysteryBoxPurchase(interaction, value) {
  try {
    const boxType = value.replace('_box', '');
    
    const { User } = await import('../schemas/userSchema.js');
    const { VIP } = await import('../schemas/vipSchema.js');
    const { MysteryBox } = await import('../schemas/mysteryBoxSchema.js');
    const { MYSTERY_BOX_TYPES, openMysteryBox, getRarityColor, getRarityEmoji, getUserVipStatus } = await import('../utils/vipManager.js');

    // Get user
    const user = await User.findOne({ discordId: interaction.user.id });
    if (!user) {
      return await interaction.followUp({
        content: '❌ Không tìm thấy tài khoản của bạn!',
        ephemeral: true
      });
    }

    // Get box config
    const boxConfig = MYSTERY_BOX_TYPES[boxType];
    if (!boxConfig) {
      return await interaction.followUp({
        content: '❌ Loại Mystery Box không hợp lệ!',
        ephemeral: true
      });
    }

    // Check VIP requirement for Diamond boxes
    if (boxConfig.vipRequired) {
      const vipStatus = await getUserVipStatus(VIP, interaction.user.id);
      if (!vipStatus.isVip) {
        return await interaction.followUp({
          content: '❌ **Diamond Mystery Box chỉ dành cho VIP!**\n\nMua VIP trước để unlock Diamond Boxes.',
          ephemeral: true
        });
      }
    }

    // Check balance
    if (user.balance < boxConfig.cost) {
      return await interaction.followUp({
        content: `❌ **Không đủ xu!**\n\nCần: ${boxConfig.cost.toLocaleString()} xu\nCó: ${user.balance.toLocaleString()} xu`,
        ephemeral: true
      });
    }

    // Open mystery box
    const boxResult = openMysteryBox(boxType);
    const reward = boxResult.reward;

    // Deduct cost
    user.balance -= boxConfig.cost;

    // Apply reward
    let rewardText = '';
    let totalValue = 0;

    switch (reward.type) {
      case 'xu':
        user.balance += reward.value;
        rewardText = `${reward.value.toLocaleString()} xu`;
        totalValue = reward.value;
        break;
        
      case 'vip':
        // Apply VIP (simplified - just add xu value for now)
        const vipValue = reward.value * 10000; // Days * 10k xu equivalent
        user.balance += vipValue;
        rewardText = `${reward.name} (${reward.value} ngày) = ${vipValue.toLocaleString()} xu`;
        totalValue = vipValue;
        break;
        
      case 'item':
        // Apply item (simplified - convert to xu for now)
        user.balance += reward.value;
        rewardText = `${reward.name} = ${reward.value.toLocaleString()} xu`;
        totalValue = reward.value;
        break;
        
      case 'multiplier':
        // Apply multiplier (simplified - give xu equivalent)
        const multiplierValue = reward.value * 5000;
        user.balance += multiplierValue;
        rewardText = `${reward.name} (${reward.value}x) = ${multiplierValue.toLocaleString()} xu`;
        totalValue = multiplierValue;
        break;
        
      case 'special':
        rewardText = reward.name;
        totalValue = 10000; // Special items worth 10k
        break;
        
      default:
        rewardText = `${reward.name || 'Unknown'} = ${reward.value || 0} xu`;
        totalValue = reward.value || 0;
    }

    await user.save();

    // Save mystery box record
    const mysteryBoxRecord = new MysteryBox({
      userId: interaction.user.id,
      username: interaction.user.username,
      boxType: boxType,
      cost: boxConfig.cost,
      rewards: [reward],
      totalValue: totalValue,
      rarity: reward.rarity
    });

    await mysteryBoxRecord.save();

    // Create result embed
    const resultEmbed = new EmbedBuilder()
      .setTitle('🎁 Đã Mở Hộp Bí Ẩn!')
      .setDescription(`**${interaction.user.username}** mở ${boxConfig.name}`)
      .addFields(
        { name: '💰 Chi phí', value: `${boxConfig.cost.toLocaleString()} xu`, inline: true },
        { name: `${getRarityEmoji(reward.rarity)} Độ Hiếm`, value: reward.rarity.toUpperCase(), inline: true },
        { name: '🎯 Giá trị', value: `${totalValue.toLocaleString()} xu`, inline: true },
        { name: '🎁 Phần thưởng', value: rewardText, inline: false },
        { name: '💳 Số dư mới', value: `${user.balance.toLocaleString()} xu`, inline: true },
        { name: '📊 Lợi nhuận', value: `${totalValue > boxConfig.cost ? '+' : ''}${((totalValue / boxConfig.cost - 1) * 100).toFixed(1)}%`, inline: true }
      )
      .setColor(getRarityColor(reward.rarity))
      .setThumbnail(interaction.user.displayAvatarURL())
      .setTimestamp();

    await interaction.followUp({
      embeds: [resultEmbed],
      ephemeral: true
    });

    console.log(`🎁 Mystery box opened: ${interaction.user.username} opened ${boxType} → ${reward.rarity} → ${rewardText}`);

  } catch (error) {
    console.error('❌ Mystery box error:', error);
    await interaction.followUp({
      content: `❌ **Có lỗi khi mở Mystery Box:**\n\`\`\`${error.message}\`\`\``,
      ephemeral: true
    });
  }
}

function getVipBenefitsText(benefits) {
  const benefitTexts = [];
  
  if (benefits.fishingMissReduction > 0) {
    benefitTexts.push(`🎣 -${benefits.fishingMissReduction}% tỷ lệ hụt câu cá`);
  }
  
  if (benefits.dailyBonus > 0) {
    benefitTexts.push(`🎁 +${benefits.dailyBonus.toLocaleString()} xu bonus hàng ngày`);
  }
  
  if (benefits.casinoWinBoost > 0) {
    benefitTexts.push(`🎰 +${benefits.casinoWinBoost}% tỷ lệ thắng casino`);
  }
  
  if (benefits.cooldownReduction > 0) {
    benefitTexts.push(`⏰ -${benefits.cooldownReduction}% thời gian chờ`);
  }
  
  if (benefits.shopDiscount > 0) {
    benefitTexts.push(`🏪 ${benefits.shopDiscount}% giảm giá shop`);
  }
  
  if (benefits.hasNoCooldowns) {
    benefitTexts.push(`🚀 Không có thời gian chờ`);
  }
  
  if (benefits.accessVipTables) {
    benefitTexts.push(`🎰 Truy cập bàn VIP`);
  }
  
  return benefitTexts.join('\n') || 'Đặc quyền cơ bản';
}