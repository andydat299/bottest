import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { User } from '../schemas/userSchema.js';

export default {
  data: new SlashCommandBuilder()
    .setName('reset')
    .setDescription('Reset toàn bộ dữ liệu của bạn (cần câu, cá, tiền) 🔄'),

  async execute(interaction) {
    const discordId = interaction.user.id;
    
    // Lấy thông tin hiện tại để hiển thị
    const currentUser = await User.findOne({ discordId });
    
    if (!currentUser) {
      return interaction.reply({
        content: '❌ Bạn chưa có dữ liệu nào để reset!'
      });
    }

    // Tính tổng số cá
    const totalFish = Array.from(currentUser.fish.values()).reduce((sum, count) => sum + count, 0);

    // Tạo nút xác nhận
    const confirmRow = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('reset_confirm')
          .setLabel('✅ Xác nhận Reset')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('reset_cancel')
          .setLabel('❌ Hủy bỏ')
          .setStyle(ButtonStyle.Secondary)
      );

    const confirmMessage = await interaction.reply({
      content: `⚠️ **CẢNH BÁO: Bạn sắp xóa toàn bộ dữ liệu!**

**Dữ liệu hiện tại của bạn:**
🎣 Cần câu: Cấp ${currentUser.rodLevel || 1}
💰 Số dư: ${currentUser.balance || 0} xu
🐟 Tổng cá: ${totalFish} con
💸 Tổng đã bán: ${currentUser.totalSold || 0} xu

**⚠️ Hành động này KHÔNG THỂ HOÀN TÁC!**
Bạn có chắc chắn muốn reset toàn bộ?`,
      components: [confirmRow],
      fetchReply: true
    });

    // Tạo collector cho nút
    const collector = confirmMessage.createMessageComponentCollector({
      filter: (i) => i.user.id === discordId,
      time: 30000 // 30 giây để quyết định
    });

    collector.on('collect', async (buttonInteraction) => {
      if (buttonInteraction.customId === 'reset_confirm') {
        // Thực hiện reset
        await User.deleteOne({ discordId });
        const newUser = await User.create({ discordId });

        await buttonInteraction.update({
          content: `🔄 **Đã reset toàn bộ dữ liệu thành công!**

**Dữ liệu mới:**
🎣 Cần câu: Cấp 1
💰 Số dư: 0 xu
🐟 Kho cá: Trống
💸 Tổng đã bán: 0 xu

🍀 Chúc bạn may mắn trong hành trình câu cá mới!
🎣 Sử dụng \`/fish\` để bắt đầu câu cá!`,
          components: []
        });
      } else if (buttonInteraction.customId === 'reset_cancel') {
        await buttonInteraction.update({
          content: `✅ **Đã hủy reset!**\n\n🎣 Dữ liệu của bạn được giữ nguyên.`,
          components: []
        });
      }
    });

    collector.on('end', async (collected) => {
      if (collected.size === 0) {
        // Hết thời gian
        await interaction.editReply({
          content: `⏰ **Hết thời gian xác nhận!**\n\n� Reset đã bị hủy. Dữ liệu của bạn được giữ nguyên.`,
          components: []
        });
      }
    });
  }
};
