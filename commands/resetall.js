import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';
import { User } from '../schemas/userSchema.js';
import { GlobalStats } from '../schemas/globalStatsSchema.js';

export default {
  data: new SlashCommandBuilder()
    .setName('resetall')
    .setDescription('⚠️ [ADMIN] Reset toàn bộ dữ liệu server (tất cả người chơi)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    // Kiểm tra quyền admin
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: '❌ Bạn cần quyền Administrator để sử dụng lệnh này!',
        ephemeral: true
      });
    }

    // Lấy thống kê hiện tại
    const totalUsers = await User.countDocuments();
    const globalStats = await GlobalStats.findOne({ statsId: 'global' });
    const totalFishCaught = globalStats ? 
      Array.from(globalStats.totalFishCaught.values()).reduce((sum, count) => sum + count, 0) : 0;

    if (totalUsers === 0 && totalFishCaught === 0) {
      return interaction.reply({
        content: '📊 Server chưa có dữ liệu nào để reset!',
        ephemeral: true
      });
    }

    // Tạo nút xác nhận
    const confirmRow = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('resetall_confirm')
          .setLabel('☢️ XÁC NHẬN RESET TOÀN BỘ')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('resetall_cancel')
          .setLabel('❌ Hủy bỏ')
          .setStyle(ButtonStyle.Secondary)
      );

    const confirmMessage = await interaction.reply({
      content: `🚨 **CẢNH BÁO CỰC KỲNG TRỌNG!**

**⚠️ BẠN ĐANG CHUẨN BỊ XÓA TOÀN BỘ DỮ LIỆU SERVER!**

**Dữ liệu sẽ bị xóa:**
👥 **${totalUsers}** người chơi
🐟 **${totalFishCaught.toLocaleString()}** cá đã câu
📊 **Toàn bộ** thống kê global
💾 **Tất cả** dữ liệu cá nhân

**🔴 HÀNH ĐỘNG NÀY KHÔNG THỂ HOÀN TÁC!**
**🔴 TẤT CẢ NGƯỜI CHƠI SẼ MẤT TOÀN BỘ TIẾN TRÌNH!**

Chỉ xác nhận nếu bạn thực sự chắc chắn!`,
      components: [confirmRow],
      fetchReply: true
    });

    // Tạo collector cho nút
    const collector = confirmMessage.createMessageComponentCollector({
      filter: (i) => i.user.id === interaction.user.id,
      time: 60000 // 60 giây để quyết định
    });

    collector.on('collect', async (buttonInteraction) => {
      if (buttonInteraction.customId === 'resetall_confirm') {
        // Thực hiện reset toàn bộ
        try {
          const deletedUsers = await User.deleteMany({});
          const deletedStats = await GlobalStats.deleteMany({});

          await buttonInteraction.update({
            content: `☢️ **RESET TOÀN BỘ SERVER HOÀN TẤT!**

**Đã xóa:**
👥 **${deletedUsers.deletedCount}** người chơi
📊 **${deletedStats.deletedCount}** bản ghi thống kê

**🔄 Server đã được reset về trạng thái ban đầu!**
🎣 Tất cả người chơi sẽ bắt đầu lại từ đầu.

⚠️ **Lưu ý:** Thông báo tất cả người chơi về việc reset này!`,
            components: []
          });

          console.log(`🚨 ADMIN RESET: ${interaction.user.tag} đã reset toàn bộ server data`);
        } catch (error) {
          console.error('Error during server reset:', error);
          await buttonInteraction.update({
            content: `❌ **Lỗi khi reset server!**\n\`\`\`${error.message}\`\`\``,
            components: []
          });
        }
      } else if (buttonInteraction.customId === 'resetall_cancel') {
        await buttonInteraction.update({
          content: `✅ **Đã hủy reset server!**\n\n🛡️ Dữ liệu server được giữ nguyên an toàn.`,
          components: []
        });
      }
    });

    collector.on('end', async (collected) => {
      if (collected.size === 0) {
        // Hết thời gian
        await interaction.editReply({
          content: `⏰ **Hết thời gian xác nhận!**\n\n🛡️ Reset server đã bị hủy. Dữ liệu được giữ nguyên.`,
          components: []
        });
      }
    });
  }
};
