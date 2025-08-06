import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { isAdmin, createNoPermissionEmbed } from '../utils/adminUtils.js';

const data = new SlashCommandBuilder()
  .setName('adminhelp')
  .setDescription('[ADMIN] Hiển thị danh sách lệnh admin');

async function execute(interaction) {
  // Kiểm tra quyền admin
  if (!isAdmin(interaction.user.id)) {
    return interaction.reply({ 
      embeds: [createNoPermissionEmbed(EmbedBuilder)], 
      ephemeral: true 
    });
  }

  const embed = new EmbedBuilder()
    .setColor('#FF6600')
    .setTitle('🛠️ Danh sách lệnh Admin')
    .setDescription('Các lệnh quản trị viên có thể sử dụng:')
    .addFields(
      {
        name: '💰 Quản lý tiền',
        value: `</addmoney:0> - Thêm tiền cho người dùng\n</removemoney:0> - Trừ tiền của người dùng\n</setmoney:0> - Đặt số tiền của người dùng`,
        inline: false
      },
      {
        name: '👤 Quản lý người dùng',
        value: `</userinfo:0> - Xem thông tin chi tiết người dùng\n</resetuser:0> - Reset dữ liệu người dùng\n</leaderboard:0> - Xem bảng xếp hạng`,
        inline: false
      },
      {
        name: '📊 Thống kê',
        value: `</leaderboard:0> - Xem top người dùng theo nhiều tiêu chí\n- Top tiền, cấp cần, số cá, tin nhắn, câu cá thành công`,
        inline: false
      },
      {
        name: '⚙️ Khác',
        value: `</adminhelp:0> - Hiển thị danh sách lệnh này`,
        inline: false
      }
    )
    .addFields(
      {
        name: '⚠️ Lưu ý quan trọng',
        value: `• Tất cả lệnh admin đều được ghi log\n• Hãy cẩn thận khi sử dụng lệnh reset\n• Chỉ admin được cấu hình trong ADMIN_IDS mới có thể sử dụng`,
        inline: false
      }
    )
    .setTimestamp()
    .setFooter({ 
      text: `Admin: ${interaction.user.username}`, 
      iconURL: interaction.user.displayAvatarURL() 
    });

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

export default { data, execute };
