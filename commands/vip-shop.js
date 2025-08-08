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
            label: '🥉 VIP Bronze (30 ngày)',
            description: `${VIP_TIERS.bronze.cost.toLocaleString()} xu - Đặc quyền cơ bản`,
            value: 'bronze_30d',
            emoji: '🥉'
          },
          {
            label: '🥈 VIP Silver (30 ngày)', 
            description: `${VIP_TIERS.silver.cost.toLocaleString()} xu - Đặc quyền nâng cao`,
            value: 'silver_30d',
            emoji: '🥈'
          },
          {
            label: '🥇 VIP Gold (30 ngày)',
            description: `${VIP_TIERS.gold.cost.toLocaleString()} xu - Đặc quyền cao cấp`,
            value: 'gold_30d', 
            emoji: '🥇'
          },
          {
            label: '💎 VIP Diamond (30 ngày)',
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
            label: '🎁 Basic Mystery Box',
            description: `${MYSTERY_BOX_TYPES.basic.cost.toLocaleString()} xu - Phần thưởng ngẫu nhiên`,
            value: 'basic_box',
            emoji: '🎁'
          },
          {
            label: '🎊 Mega Mystery Box',
            description: `${MYSTERY_BOX_TYPES.mega.cost.toLocaleString()} xu - Phần thưởng lớn`,
            value: 'mega_box',
            emoji: '🎊'
          },
          {
            label: '💎 Diamond Mystery Box (VIP Only)',
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
            name: '🥉 VIP Bronze',
            value: '• -10% fishing miss rate\n• +500 xu daily bonus\n• +5% casino win rate\n• -25% cooldowns\n• 10% shop discount',
            inline: true
          },
          {
            name: '🥈 VIP Silver', 
            value: '• -20% fishing miss rate\n• +1,000 xu daily bonus\n• +10% casino win rate\n• -50% cooldowns\n• 20% shop discount\n• VIP tables access',
            inline: true
          },
          {
            name: '🥇 VIP Gold',
            value: '• -30% fishing miss rate\n• +2,000 xu daily bonus\n• +15% casino win rate\n• -75% cooldowns\n• 30% shop discount\n• Automation features',
            inline: true
          },
          {
            name: '💎 VIP Diamond',
            value: '• -50% fishing miss rate\n• +5,000 xu daily bonus\n• +25% casino win rate\n• No cooldowns\n• 50% shop discount\n• Full automation\n• Exclusive events',
            inline: false
          },
          {
            name: '🎁 Mystery Boxes',
            value: `**🎁 Basic:** ${MYSTERY_BOX_TYPES.basic.cost.toLocaleString()} xu - Random rewards\n**🎊 Mega:** ${MYSTERY_BOX_TYPES.mega.cost.toLocaleString()} xu - Better rewards\n**💎 Diamond:** ${MYSTERY_BOX_TYPES.diamond.cost.toLocaleString()} xu - Epic rewards (VIP only)`,
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
  // Implementation for VIP purchase
  const [tier, duration] = value.split('_');
  
  await interaction.followUp({
    content: `🚧 VIP Purchase feature đang được phát triển!\n\nBạn đã chọn: **${tier.toUpperCase()}** (${duration})`,
    ephemeral: true
  });
}

async function handleMysteryBoxPurchase(interaction, value) {
  // Implementation for mystery box purchase
  const boxType = value.replace('_box', '');
  
  await interaction.followUp({
    content: `🚧 Mystery Box feature đang được phát triển!\n\nBạn đã chọn: **${boxType.toUpperCase()} BOX**`,
    ephemeral: true
  });
}