import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('mystery-box')
    .setDescription('🎁 Mua và mở Mystery Box')
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Loại Mystery Box')
        .setRequired(true)
        .addChoices(
          { name: '🎁 Hộp Bí Ẩn Cơ Bản (10,000 xu)', value: 'basic' },
          { name: '🎊 Hộp Bí Ẩn Khổng Lồ (50,000 xu)', value: 'mega' },
          { name: '💎 Hộp Bí Ẩn Kim Cương (200,000 xu - Chỉ VIP)', value: 'diamond' }
        )
    )
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('Số lượng box muốn mua (1-10)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(10)
    ),

  async execute(interaction) {
    const boxType = interaction.options.getString('type');
    const amount = interaction.options.getInteger('amount') || 1;

    await interaction.deferReply();

    try {
      const { User } = await import('../schemas/userSchema.js');
      const { VIP } = await import('../schemas/vipSchema.js');
      const { MysteryBox } = await import('../schemas/mysteryBoxSchema.js');
      const { MYSTERY_BOX_TYPES, openMysteryBox, getRarityColor, getRarityEmoji, getUserVipStatus } = await import('../utils/vipManager.js');

      // Get user
      let user = await User.findOne({ discordId: interaction.user.id });
      if (!user) {
        return await interaction.editReply({
          content: '❌ Bạn cần có tài khoản trước. Hãy dùng lệnh `/balance` trước!'
        });
      }

      // Get box config
      const boxConfig = MYSTERY_BOX_TYPES[boxType];
      if (!boxConfig) {
        return await interaction.editReply({
          content: '❌ Loại Mystery Box không hợp lệ!'
        });
      }

      const totalCost = boxConfig.cost * amount;

      // Check VIP requirement for Diamond boxes
      if (boxConfig.vipRequired) {
        const vipStatus = await getUserVipStatus(VIP, interaction.user.id);
        if (!vipStatus.isVip) {
          return await interaction.editReply({
            content: '❌ **Diamond Mystery Box chỉ dành cho VIP!**\n\nMua VIP ở `/vip-shop` trước để unlock Diamond Boxes.'
          });
        }
      }

      // Check balance
      if (user.balance < totalCost) {
        return await interaction.editReply({
          content: `❌ **Không đủ xu!**\n\n**Cần:** ${totalCost.toLocaleString()} xu\n**Có:** ${user.balance.toLocaleString()} xu\n**Thiếu:** ${(totalCost - user.balance).toLocaleString()} xu`
        });
      }

      // Open multiple boxes
      const results = [];
      let totalValue = 0;
      const rarityCount = {
        common: 0,
        uncommon: 0,
        rare: 0,
        epic: 0,
        legendary: 0,
        mythical: 0
      };

      for (let i = 0; i < amount; i++) {
        const boxResult = openMysteryBox(boxType);
        results.push(boxResult);
        rarityCount[boxResult.rarity]++;
        
        // Apply rewards (simplified)
        let rewardValue = 0;
        const reward = boxResult.reward;
        
        switch (reward.type) {
          case 'xu':
            rewardValue = reward.value;
            break;
          case 'vip':
            rewardValue = reward.value * 10000; // Days * 10k xu
            break;
          case 'item':
            rewardValue = reward.value;
            break;
          case 'multiplier':
            rewardValue = reward.value * 5000;
            break;
          case 'special':
            rewardValue = 10000;
            break;
          default:
            rewardValue = reward.value || 0;
        }
        
        totalValue += rewardValue;
      }

      // Update user balance
      user.balance -= totalCost;
      user.balance += totalValue;
      await user.save();

      // Save mystery box records
      for (const result of results) {
        const mysteryBoxRecord = new MysteryBox({
          userId: interaction.user.id,
          username: interaction.user.username,
          boxType: boxType,
          cost: boxConfig.cost,
          rewards: [result.reward],
          totalValue: result.reward.value || 0,
          rarity: result.rarity
        });
        await mysteryBoxRecord.save();
      }

      // Create results embed
      const embed = new EmbedBuilder()
        .setTitle('🎁 Kết Quả Hộp Bí Ẩn!')
        .setDescription(`**${interaction.user.username}** mở ${amount}x ${boxConfig.name}`)
        .setColor(amount === 1 ? getRarityColor(results[0].rarity) : '#ffd700')
        .setThumbnail(interaction.user.displayAvatarURL())
        .setTimestamp();

      // Summary fields
      embed.addFields(
        { name: '💰 Chi phí', value: `${totalCost.toLocaleString()} xu`, inline: true },
        { name: '🎯 Tổng giá trị', value: `${totalValue.toLocaleString()} xu`, inline: true },
        { name: '📊 Lợi nhuận', value: `${totalValue > totalCost ? '+' : ''}${((totalValue / totalCost - 1) * 100).toFixed(1)}%`, inline: true }
      );

      // Rarity breakdown
      const rarityText = Object.entries(rarityCount)
        .filter(([rarity, count]) => count > 0)
        .map(([rarity, count]) => `${getRarityEmoji(rarity)} ${getRarityVietnamese(rarity)}: ${count}`)
        .join('\n');

      if (rarityText) {
        embed.addFields({
          name: '🌟 Phân Tích Độ Hiếm',
          value: rarityText,
          inline: true
        });
      }

      embed.addFields({
        name: '💳 Số dư mới',
        value: `${user.balance.toLocaleString()} xu`,
        inline: true
      });

      // Show individual results if amount <= 3
      if (amount <= 3) {
        const detailedResults = results.map((result, index) => {
          const reward = result.reward;
          let rewardText = '';
          
          switch (reward.type) {
            case 'xu':
              rewardText = `${reward.value.toLocaleString()} xu`;
              break;
            case 'vip':
              rewardText = `${reward.name} (${reward.value} ngày)`;
              break;
            case 'item':
              rewardText = `${reward.name}`;
              break;
            case 'multiplier':
              rewardText = `${reward.name} (${reward.value}x)`;
              break;
            default:
              rewardText = reward.name || 'Unknown';
          }
          
          return `**Box ${index + 1}:** ${getRarityEmoji(result.rarity)} ${rewardText}`;
        }).join('\n');

        embed.addFields({
          name: '🎁 Chi Tiết Phần Thưởng',
          value: detailedResults,
          inline: false
        });
      }

      // Special achievements
      const achievements = [];
      
      if (rarityCount.legendary > 0) {
        achievements.push('🏆 Hộp Huyền Thoại!');
      }
      
      if (rarityCount.mythical > 0) {
        achievements.push('👑 HỘP THẦN THOẠI!!!');
      }
      
      if (amount >= 5 && rarityCount.rare + rarityCount.epic + rarityCount.legendary + rarityCount.mythical === amount) {
        achievements.push('🔥 Tất cả hộp đều Hiếm trở lên!');
      }

      if (achievements.length > 0) {
        embed.addFields({
          name: '🎉 Thành Tựu',
          value: achievements.join('\n'),
          inline: false
        });
      }

      await interaction.editReply({ embeds: [embed] });

      console.log(`🎁 Mystery boxes opened: ${interaction.user.username} opened ${amount}x ${boxType} → Total value: ${totalValue} xu`);

    } catch (error) {
      console.error('❌ Mystery box error:', error);
      
      await interaction.editReply({
        content: `❌ **Có lỗi khi mở Hộp Bí Ẩn:**\n\`\`\`${error.message}\`\`\``
      });
    }
  }
};

function getRarityVietnamese(rarity) {
  const vietnamese = {
    common: 'Thường',
    uncommon: 'Không Thường',
    rare: 'Hiếm',
    epic: 'Sử Thi',
    legendary: 'Huyền Thoại',
    mythical: 'Thần Thoại'
  };
  return vietnamese[rarity] || rarity;
}