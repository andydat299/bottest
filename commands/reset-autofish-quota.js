import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { User } from '../schemas/userSchema.js';

function getTodayDateString() {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

export default {
  data: new SlashCommandBuilder()
    .setName('reset-autofish-quota')
    .setDescription('🔄 Reset quota auto-fishing cho user (Admin only)')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User cần reset quota')
        .setRequired(true)),
  async execute(interaction) {
    try {
      // Kiểm tra admin
      if (!interaction.member.permissions.has('Administrator')) {
        await interaction.reply({
          content: '❌ Chỉ admin mới được sử dụng lệnh này!',
          flags: 64
        });
        return;
      }

      const targetUser = interaction.options.getUser('user');
      const todayKey = getTodayDateString();

      // Lấy user từ database
      const user = await User.findOne({ discordId: targetUser.id });
      if (!user) {
        await interaction.reply({
          content: '❌ Không tìm thấy user trong database!',
          flags: 64
        });
        return;
      }

      // Lưu thông tin cũ để hiển thị
      const oldUsage = user.autoFishingToday?.minutes || user[`autofish_${todayKey}`] || 0;

      // Reset quota
      if (user.autoFishingToday) {
        user.autoFishingToday.minutes = 0;
        user.autoFishingToday.date = todayKey;
      } else {
        user.autoFishingToday = { date: todayKey, minutes: 0 };
      }

      // Reset fallback field nếu có
      if (user[`autofish_${todayKey}`] !== undefined) {
        user[`autofish_${todayKey}`] = 0;
      }

      await user.save();

      const embed = new EmbedBuilder()
        .setTitle('🔄 Reset Auto-fishing Quota')
        .setDescription(`Đã reset quota auto-fishing cho **${targetUser.username}**`)
        .setColor('#00FF00')
        .addFields(
          { name: '👤 Target User', value: `${targetUser.username} (${targetUser.id})`, inline: false },
          { name: '📊 Thời gian cũ', value: `${oldUsage} phút`, inline: true },
          { name: '📊 Thời gian mới', value: '0 phút', inline: true },
          { name: '📅 Ngày', value: todayKey, inline: true },
          { name: '👨‍💼 Admin', value: interaction.user.username, inline: true }
        )
        .setFooter({ text: 'User có thể sử dụng lại auto-fishing với quota đầy đủ' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

      // Log action
      console.log(`Admin ${interaction.user.username} reset auto-fishing quota for ${targetUser.username} (${oldUsage} -> 0 minutes)`);

    } catch (error) {
      console.error('Reset autofish quota error:', error);
      await interaction.reply({
        content: `❌ Có lỗi xảy ra: \`${error.message}\``,
        flags: 64
      });
    }
  }
};