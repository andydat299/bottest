import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getRodBenefits } from '../utils/rodManager.js';

export default {
  data: new SlashCommandBuilder()
    .setName('fix-durability')
    .setDescription('🔧 Sửa lỗi độ bền cần câu vượt quá giới hạn'),
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

      const rodLevel = user.rodLevel || 1;
      const currentDurability = user.rodDurability || 0;
      const currentRod = getRodBenefits(rodLevel);

      // Check if durability is invalid
      const isDurabilityInvalid = currentDurability > currentRod.durability || currentDurability < 0;

      if (!isDurabilityInvalid) {
        return await interaction.editReply({
          content: `✅ **Độ bền cần câu bình thường**\n\n` +
                   `**Hiện tại:** ${currentDurability}/${currentRod.durability}\n` +
                   `**Trạng thái:** Không cần sửa chữa`
        });
      }

      // Fix durability
      const oldDurability = currentDurability;
      const newDurability = Math.min(currentDurability, currentRod.durability);
      
      user.rodDurability = newDurability;
      await user.save();

      const embed = new EmbedBuilder()
        .setTitle('🔧 **ĐỘ BỀN ĐÃ ĐƯỢC SỬA CHỮA**')
        .setDescription(`**${interaction.user.username}** - Sửa lỗi độ bền`)
        .setColor('#ff9500')
        .addFields({
          name: '🎣 **Thông Tin Cần Câu**',
          value: `**${currentRod.name}**\n` +
                 `Level ${rodLevel}/20\n` +
                 `Tier: ${currentRod.tier}`,
          inline: true
        })
        .addFields({
          name: '🔧 **Sửa Chữa Độ Bền**',
          value: `**Trước:** ${oldDurability}/${currentRod.durability} (${Math.round((oldDurability/currentRod.durability)*100)}%)\n` +
                 `**Sau:** ${newDurability}/${currentRod.durability} (${Math.round((newDurability/currentRod.durability)*100)}%)\n` +
                 `**Vấn đề:** ${oldDurability > currentRod.durability ? 'Vượt quá giới hạn' : 'Giá trị âm'}`,
          inline: true
        })
        .addFields({
          name: '✅ **Kết Quả**',
          value: `• Độ bền đã được điều chỉnh về mức hợp lệ\n` +
                 `• Cần câu hoạt động bình thường\n` +
                 `• Có thể tiếp tục câu cá`,
          inline: false
        })
        .addFields({
          name: '💡 **Gợi Ý**',
          value: `• Sử dụng \`/repair-rod\` để sửa chữa khi độ bền thấp\n` +
                 `• Kiểm tra \`/rod-status\` để theo dõi tình trạng\n` +
                 `• Nâng cấp cần câu để có độ bền cao hơn`,
          inline: false
        })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('❌ Fix durability command error:', error);
      
      await interaction.editReply({
        content: `❌ **Có lỗi khi sửa độ bền:**\n\`\`\`${error.message}\`\`\``
      });
    }
  }
};