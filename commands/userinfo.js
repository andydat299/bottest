import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { User } from '../schemas/userSchema.js';
import { isAdmin, createNoPermissionEmbed, createErrorEmbed } from '../utils/adminUtils.js';

const data = new SlashCommandBuilder()
  .setName('userinfo')
  .setDescription('[ADMIN] Xem thông tin chi tiết của người dùng')
  .addUserOption(option =>
    option.setName('user')
      .setDescription('Người dùng cần xem thông tin')
      .setRequired(true));

async function execute(interaction) {
  // Kiểm tra quyền admin
  if (!isAdmin(interaction.user.id)) {
    return interaction.reply({ 
      embeds: [createNoPermissionEmbed(EmbedBuilder)], 
      ephemeral: true 
    });
  }

  const targetUser = interaction.options.getUser('user');

  try {
    // Tìm user trong database
    const user = await User.findOne({ discordId: targetUser.id });
    
    if (!user) {
      const embed = createErrorEmbed(
        EmbedBuilder,
        'Không tìm thấy người dùng',
        `${targetUser} chưa có dữ liệu trong hệ thống!`
      );
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Tính tổng số cá
    const totalFish = Array.from(user.fish.values()).reduce((sum, count) => sum + count, 0);
    
    // Tính tỷ lệ thành công câu cá
    const successRate = user.fishingStats.totalFishingAttempts > 0 
      ? ((user.fishingStats.successfulCatches / user.fishingStats.totalFishingAttempts) * 100).toFixed(1)
      : '0';

    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle(`📊 Thông tin người dùng: ${targetUser.username}`)
      .setThumbnail(targetUser.displayAvatarURL())
      .addFields(
        { 
          name: '💰 Thông tin tài chính', 
          value: `**Số dư:** ${user.balance.toLocaleString()} coins\n**Tổng tiền bán:** ${user.totalSold.toLocaleString()} coins`, 
          inline: true 
        },
        { 
          name: '🎣 Thông tin câu cá', 
          value: `**Cấp cần:** ${user.rodLevel}\n**Tổng cá:** ${totalFish}\n**Tỷ lệ thành công:** ${successRate}%`, 
          inline: true 
        },
        { 
          name: '📈 Thống kê câu cá', 
          value: `**Tổng lần câu:** ${user.fishingStats.totalFishingAttempts}\n**Câu thành công:** ${user.fishingStats.successfulCatches}\n**Câu hụt:** ${user.fishingStats.missedCatches}`, 
          inline: false 
        },
        { 
          name: '💬 Thống kê chat', 
          value: `**Tổng tin nhắn:** ${user.chatStats.totalMessages}\n**Ngày chat cuối:** ${user.chatStats.lastMessageDate || 'Chưa có'}`, 
          inline: false 
        },
        { 
          name: '🆔 Thông tin Discord', 
          value: `**User ID:** ${targetUser.id}\n**Tạo tài khoản:** <t:${Math.floor(targetUser.createdTimestamp / 1000)}:F>`, 
          inline: false 
        }
      )
      .setTimestamp()
      .setFooter({ text: `Yêu cầu bởi ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

    await interaction.reply({ embeds: [embed] });

  } catch (error) {
    console.error('Error getting user info:', error);
    const embed = createErrorEmbed(
      EmbedBuilder,
      'Lỗi',
      'Có lỗi xảy ra khi lấy thông tin người dùng!'
    );
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
}

export default { data, execute };
