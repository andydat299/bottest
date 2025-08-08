import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getRodBenefits } from '../utils/rodManager.js';

export default {
  data: new SlashCommandBuilder()
    .setName('sync-rod')
    .setDescription('🔧 Đồng bộ dữ liệu cần câu với hệ thống'),
  prefixEnabled: true,

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

      const oldRodLevel = user.rodLevel || 1;
      const oldDurability = user.rodDurability || 0;
      const oldRodsOwned = user.rodsOwned || [];

      // Sync rod level with actual rod benefits
      const currentRod = getRodBenefits(oldRodLevel);
      
      // Fix rodsOwned array
      const newRodsOwned = [];
      for (let i = 1; i <= oldRodLevel; i++) {
        if (!newRodsOwned.includes(i)) {
          newRodsOwned.push(i);
        }
      }

      // Fix durability if it's higher than max or invalid
      let newDurability = oldDurability;
      if (oldDurability > currentRod.durability || oldDurability <= 0) {
        newDurability = currentRod.durability; // Set to full durability
      }

      // Check if rod level 11-20 exists but not in rodsOwned
      const missingRods = [];
      for (let level = 11; level <= Math.min(oldRodLevel, 20); level++) {
        if (!oldRodsOwned.includes(level)) {
          missingRods.push(level);
          newRodsOwned.push(level);
        }
      }

      // Update user data
      user.rodsOwned = newRodsOwned.sort((a, b) => a - b);
      user.rodDurability = newDurability;

      // Save to database
      await user.save();

      // Create sync report
      const embed = new EmbedBuilder()
        .setTitle('🔧 **ĐỒNG BỘ CẦN CÂU HOÀN THÀNH**')
        .setDescription(`**${interaction.user.username}** - Báo cáo đồng bộ`)
        .setColor('#00ff00')
        .addFields({
          name: '🎣 **Thông Tin Cần Câu**',
          value: `**Tên:** ${currentRod.name}\n` +
                 `**Level:** ${oldRodLevel}/20\n` +
                 `**Tier:** ${currentRod.tier}`,
          inline: true
        })
        .addFields({
          name: '🔧 **Độ Bền**',
          value: `**Trước:** ${oldDurability}/${currentRod.durability}\n` +
                 `**Sau:** ${newDurability}/${currentRod.durability}\n` +
                 `**Trạng thái:** ${newDurability === oldDurability ? '✅ Không đổi' : '🔧 Đã sửa'}`,
          inline: true
        })
        .addFields({
          name: '📦 **Cần Câu Sở Hữu**',
          value: `**Trước:** ${oldRodsOwned.length} cần câu\n` +
                 `**Sau:** ${newRodsOwned.length} cần câu\n` +
                 `**Thêm:** ${missingRods.length > 0 ? missingRods.join(', ') : 'Không có'}`,
          inline: false
        });

      if (missingRods.length > 0) {
        embed.addFields({
          name: '🔄 **Cần Câu Đã Thêm**',
          value: missingRods.map(level => {
            const rod = getRodBenefits(level);
            return `**Level ${level}:** ${rod.name} (${rod.tier})`;
          }).join('\n'),
          inline: false
        });
      }

      embed.addFields({
        name: '✅ **Kết Quả Đồng Bộ**',
        value: `• Độ bền: ${newDurability === oldDurability ? 'Không thay đổi' : 'Đã cập nhật'}\n` +
               `• Cần câu sở hữu: ${missingRods.length > 0 ? `Đã thêm ${missingRods.length}` : 'Không thay đổi'}\n` +
               `• Dữ liệu: Đã đồng bộ với hệ thống`,
        inline: false
      })
      .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('❌ Sync rod command error:', error);
      
      await interaction.editReply({
        content: `❌ **Có lỗi khi đồng bộ cần câu:**\n\`\`\`${error.message}\`\`\``
      });
    }
  }
};