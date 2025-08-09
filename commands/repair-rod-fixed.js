import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getRodBenefits } from '../utils/rodManager.js';

export default {
  data: new SlashCommandBuilder()
    .setName('repair-rod-fixed')
    .setDescription('🔧 Sửa chữa cần câu (version fixed)')
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Loại sửa chữa')
        .setRequired(false)
        .addChoices(
          { name: 'Hoàn toàn (100%)', value: 'full' },
          { name: 'Một phần (50%)', value: 'partial' },
          { name: 'Tối thiểu (25%)', value: 'minimal' }
        )
    ),

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
      const repairType = interaction.options.getString('type') || 'full';

      // Get CORRECT rod benefits
      const currentRod = getRodBenefits(rodLevel);
      
      // FIXED: Use correct max durability based on rod level
      const correctMaxDurability = getCorrectMaxDurability(rodLevel);
      
      function getCorrectMaxDurability(level) {
        const durabilityMap = {
          1: 100, 2: 120, 3: 140, 4: 160, 5: 180,
          6: 200, 7: 220, 8: 240, 9: 260, 10: 280,
          11: 500, 12: 550, 13: 600, 14: 650, 15: 700,
          16: 800, 17: 900, 18: 1000, 19: 1200, 20: 1500
        };
        return durabilityMap[level] || 100;
      }

      // Calculate repair amounts
      const maxDurability = correctMaxDurability; // Use CORRECT max durability
      const durabilityNeeded = maxDurability - currentDurability;

      if (durabilityNeeded <= 0) {
        return await interaction.editReply({
          content: `✅ **Cần câu của bạn đã ở trạng thái tốt nhất!**\n\n` +
                   `🔧 **Độ bền:** ${currentDurability}/${maxDurability} (100%)\n` +
                   `🎣 **${currentRod.name}** không cần sửa chữa.`
        });
      }

      // Calculate repair options
      const repairOptions = {
        full: {
          percentage: 100,
          durabilityToAdd: durabilityNeeded,
          cost: durabilityNeeded * 10,
          description: 'Sửa chữa hoàn toàn về 100%'
        },
        partial: {
          percentage: 50,
          durabilityToAdd: Math.ceil(durabilityNeeded * 0.5),
          cost: Math.ceil(durabilityNeeded * 0.5) * 8,
          description: 'Sửa chữa 50% độ bền còn thiếu'
        },
        minimal: {
          percentage: 25,
          durabilityToAdd: Math.ceil(durabilityNeeded * 0.25),
          cost: Math.ceil(durabilityNeeded * 0.25) * 6,
          description: 'Sửa chữa 25% độ bền còn thiếu'
        }
      };

      const selectedRepair = repairOptions[repairType];
      const newDurability = currentDurability + selectedRepair.durabilityToAdd;
      const finalDurability = Math.min(newDurability, maxDurability); // Ensure not over max

      // Check if user can afford
      if (userBalance < selectedRepair.cost) {
        const embed = new EmbedBuilder()
          .setTitle('❌ **Không Đủ Xu Để Sửa Chữa**')
          .setDescription(`**${interaction.user.username}** - Thông tin sửa chữa`)
          .setColor('#ff0000')
          .addFields({
            name: '🎣 **Cần Câu Hiện Tại**',
            value: `**${currentRod.name}** (Level ${rodLevel})\n` +
                   `🔧 **Độ bền:** ${currentDurability}/${maxDurability} (${Math.round((currentDurability/maxDurability)*100)}%)`,
            inline: false
          })
          .addFields({
            name: '💰 **Chi Phí Sửa Chữa**',
            value: `**${selectedRepair.description}**\n` +
                   `💸 **Chi phí:** ${selectedRepair.cost.toLocaleString()} xu\n` +
                   `💰 **Số dư:** ${userBalance.toLocaleString()} xu\n` +
                   `❌ **Thiếu:** ${(selectedRepair.cost - userBalance).toLocaleString()} xu`,
            inline: false
          })
          .addFields({
            name: '💡 **Gợi Ý**',
            value: '• Câu cá để kiếm thêm xu\n• Chọn loại sửa chữa rẻ hơn\n• Sử dụng `/repair-rod-fixed type:minimal`',
            inline: false
          })
          .setTimestamp();

        return await interaction.editReply({ embeds: [embed] });
      }

      // Perform repair
      user.rodDurability = finalDurability;
      user.balance -= selectedRepair.cost;
      await user.save();

      // Success embed
      const embed = new EmbedBuilder()
        .setTitle('🔧 **Sửa Chữa Cần Câu Thành Công**')
        .setDescription(`**${interaction.user.username}** - Kết quả sửa chữa`)
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
                 `**Sau:** ${finalDurability}/${maxDurability}\n` +
                 `**Tăng:** +${selectedRepair.durabilityToAdd}`,
          inline: true
        })
        .addFields({
          name: '💰 **Chi Phí**',
          value: `**Loại:** ${selectedRepair.description}\n` +
                 `**Chi phí:** ${selectedRepair.cost.toLocaleString()} xu\n` +
                 `**Số dư còn:** ${user.balance.toLocaleString()} xu`,
          inline: false
        });

      // Add status bar
      const durabilityPercent = Math.round((finalDurability / maxDurability) * 100);
      const statusBar = '█'.repeat(Math.floor(durabilityPercent / 10)) + '░'.repeat(10 - Math.floor(durabilityPercent / 10));
      
      embed.addFields({
        name: '📊 **Trạng Thái Mới**',
        value: `${statusBar}\n` +
               `**${finalDurability}/${maxDurability}** (${durabilityPercent}%)\n` +
               `${durabilityPercent >= 80 ? '✅ Tuyệt vời' : durabilityPercent >= 50 ? '🔶 Ổn định' : '⚠️ Cần theo dõi'}`,
        inline: false
      });

      embed.setTimestamp();

      await interaction.editReply({ embeds: [embed] });

      // Debug log
      console.log(`🔧 REPAIR SUCCESS:`, {
        user: interaction.user.username,
        rodLevel,
        durabilityBefore: currentDurability,
        durabilityAfter: finalDurability,
        maxDurability,
        cost: selectedRepair.cost,
        type: repairType
      });

    } catch (error) {
      console.error('❌ Repair rod error:', error);
      
      await interaction.editReply({
        content: `❌ **Có lỗi khi sửa chữa cần câu:**\n\`\`\`${error.message}\`\`\``
      });
    }
  }
};