import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { isAdmin, createNoPermissionEmbed } from '../utils/adminUtils.js';
import { config } from '../config.js';

const data = new SlashCommandBuilder()
  .setName('logconfig')
  .setDescription('[ADMIN] Xem cấu hình log channel hiện tại');

async function execute(interaction) {
  // Kiểm tra quyền admin
  if (!isAdmin(interaction.user.id)) {
    const embed = createNoPermissionEmbed(EmbedBuilder);
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  try {
    const embed = new EmbedBuilder()
      .setColor('#3498db')
      .setTitle('📋 Cấu hình Log System')
      .setTimestamp()
      .setFooter({ 
        text: `Requested by ${interaction.user.username}`, 
        iconURL: interaction.user.displayAvatarURL() 
      });

    // Kiểm tra log channel
    if (!config.logChannelId) {
      embed.setDescription('❌ **Log channel chưa được cấu hình!**')
        .addFields({
          name: '⚙️ Cách cấu hình',
          value: '1. Tạo một channel cho log\n2. Copy Channel ID\n3. Thêm vào environment variable `LOG_CHANNEL_ID`\n4. Restart bot',
          inline: false
        });
    } else {
      const logChannel = await interaction.client.channels.fetch(config.logChannelId).catch(() => null);
      
      if (logChannel) {
        embed.setDescription('✅ **Log system đã được cấu hình!**')
          .addFields(
            {
              name: '📍 Log Channel',
              value: `<#${config.logChannelId}>\n(\`${config.logChannelId}\`)`,
              inline: true
            },
            {
              name: '📊 Trạng thái',
              value: `✅ **Hoạt động**\n🔗 Bot có thể truy cập channel`,
              inline: true
            },
            {
              name: '📝 Loại log được ghi',
              value: '• **💰 Giao dịch tiền**: Nhận/trừ/chi tiêu xu\n• **🎣 Câu cá**: Thành công/hụt\n• **⬆️ Nâng cấp**: Cần câu và chi phí\n• **🔧 Sửa chữa**: Cần câu và chi phí\n• **👑 Admin**: Hoạt động quản trị\n• **📋 Quest**: Hoàn thành nhiệm vụ\n• **🎮 Games**: Blackjack win/loss\n• **💬 Chat**: Rewards từ chat\n• **🛠️ System**: Lỗi và khởi động',
              inline: false
            }
          );
      } else {
        embed.setDescription('⚠️ **Log channel đã cấu hình nhưng không truy cập được!**')
          .addFields({
            name: '🔍 Channel ID cấu hình',
            value: `\`${config.logChannelId}\``,
            inline: false
          }, {
            name: '❌ Vấn đề có thể',
            value: '• Channel đã bị xóa\n• Bot không có quyền truy cập\n• Channel ID không đúng',
            inline: false
          });
      }
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });

  } catch (error) {
    console.error('Error checking log config:', error);
    
    const embed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle('❌ Lỗi kiểm tra cấu hình')
      .setDescription('Có lỗi xảy ra khi kiểm tra cấu hình log!')
      .addFields({
        name: '🐛 Chi tiết lỗi',
        value: `\`\`\`${error.message}\`\`\``,
        inline: false
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
}

export default { data, execute };
