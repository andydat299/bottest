import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getRodBenefits } from '../utils/rodManager.js';

export default {
  data: new SlashCommandBuilder()
    .setName('repair-rod-clean')
    .setDescription('🔧 Sửa chữa cần câu hoàn toàn (no options)'),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const { User } = await import('../schemas/userSchema.js');
      
      let user = await User.findOne({ discordId: interaction.user.id });
      if (!user) {
        return await interaction.editReply({
          content: '❌ **Bạn cần có tài khoản trước!**\n\nHãy dùng lệnh `/fish` để tạo tài khoản.'
        });
      }

      const rodLevel = user.rodLevel || 1;
      const currentDurability = user.rodDurability || 0;
      const userBalance = user.balance || 0;

      // Get CORRECT rod benefits
      const currentRod = getRodBenefits(rodLevel);
      
      // FIXED: Use correct max durability based on rod level
      function getCorrectMaxDurability(level) {
        const durabilityMap = {
          1: 100, 2: 120, 3: 140, 4: 160, 5: 180,
          6: 200, 7: 220, 8: 240, 9: 260, 10: 280,
          11: 500, 12: 550, 13: 600, 14: 650, 15: 700,
          16: 800, 17: 900, 18: 1000, 19: 1200, 20: 1500
        };
        return durabilityMap[level] || 100;
      }

      const maxDurability = getCorrectMaxDurability(rodLevel);
      const durabilityNeeded = maxDurability - currentDurability;

      if (durabilityNeeded <= 0) {
        return await interaction.editReply({
          content: `✅ **Cần câu của bạn đã ở trạng thái tốt nhất!**\n\n` +
                   `🔧 **Độ bền:** ${currentDurability}/${maxDurability} (100%)\n` +
                   `🎣 **${currentRod.name}** không cần sửa chữa.`
        });
      }

      // Full repair calculation
      const repairCost = durabilityNeeded * 10;

      // Check if user can afford
      if (userBalance < repairCost) {
        const embed = new EmbedBuilder()
          .setTitle('❌ **Không Đủ Xu Để Sửa Chữa**')
          .setDescription(`**${interaction.user.username}** - Thông tin sửa chữa`)
          .setColor('#ff0000')
          .addFields({
            name: '🎣 **Cần Câu Hiện Tại**',
            value: `**${currentRod.name}** (Level ${rodLevel})\n` +
                   `🔧 **Độ bền:** ${currentDurability}/${maxDurability} (${Math.round((currentDurability/maxDurability)*100)}%)\n` +
                   `**Tier:** ${currentRod.tier}`,
            inline: false
          })
          .addFields({
            name: '💰 **Chi Phí Sửa Chữa Hoàn Toàn**',
            value: `💸 **Chi phí:** ${repairCost.toLocaleString()} xu\n` +
                   `💰 **Số dư:** ${userBalance.toLocaleString()} xu\n` +
                   `❌ **Thiếu:** ${(repairCost - userBalance).toLocaleString()} xu`,
            inline: false
          })
          .addFields({
            name: '💡 **Gợi Ý**',
            value: '• Câu cá để kiếm thêm xu: `/fish`\n• Xem trạng thái rod: `/rod-status`\n• Bán cá để có xu: `/sell-fish`',
            inline: false
          })
          .setTimestamp();

        return await interaction.editReply({ embeds: [embed] });
      }

      // Perform full repair
      user.rodDurability = maxDurability;
      user.balance -= repairCost;
      await user.save();

      // Success embed
      const embed = new EmbedBuilder()
        .setTitle('🔧 **Sửa Chữa Cần Câu Thành Công**')
        .setDescription(`**${interaction.user.username}** - Kết quả sửa chữa hoàn toàn`)
        .setColor('#00ff00')
        .addFields({
          name: '🎣 **Cần Câu**',
          value: `**${currentRod.name}** (Level ${rodLevel})\n` +
                 `**Tier:** ${currentRod.tier}`,
          inline: true
        })
        .addFields({
          name: '🔧 **Độ Bền**',
          value: `**Trước:** ${currentDurability}/${maxDurability}\n` +
                 `**Sau:** ${maxDurability}/${maxDurability}\n` +
                 `**Tăng:** +${durabilityNeeded}`,
          inline: true
        })
        .addFields({
          name: '💰 **Chi Phí**',
          value: `**Loại:** Sửa chữa hoàn toàn (100%)\n` +
                 `**Chi phí:** ${repairCost.toLocaleString()} xu\n` +
                 `**Số dư còn:** ${user.balance.toLocaleString()} xu`,
          inline: false
        });

      // Add status bar - always 100% after full repair
      const statusBar = '██████████';
      
      embed.addFields({
        name: '📊 **Trạng Thái Mới**',
        value: `${statusBar}\n` +
               `**${maxDurability}/${maxDurability}** (100%)\n` +
               `✅ Tuyệt vời - Cần câu như mới!`,
        inline: false
      });

      embed.addFields({
        name: '🎯 **Thông Tin Bổ Sung**',
        value: `**Rod benefits đã được fix:**\n` +
               `• Max durability: ${maxDurability} (correct for level ${rodLevel})\n` +
               `• Repair cost: 10 xu per durability point\n` +
               `• Ready for fishing!`,
        inline: false
      });

      embed.setTimestamp();

      await interaction.editReply({ embeds: [embed] });

      // Debug log
      console.log(`🔧 REPAIR SUCCESS (CLEAN):`, {
        user: interaction.user.username,
        rodLevel,
        durabilityBefore: currentDurability,
        durabilityAfter: maxDurability,
        maxDurability,
        cost: repairCost,
        correctMaxDurability: maxDurability
      });

    } catch (error) {
      console.error('❌ Repair rod clean error:', error);
      
      await interaction.editReply({
        content: `❌ **Có lỗi khi sửa chữa cần câu:**\n\`\`\`${error.message}\`\`\``
      });
    }
  }
};