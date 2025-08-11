import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { User } from '../schemas/userSchema.js';
import { getOrCreateVIP, getVIPPerks } from '../utils/vip.js';

function getTodayDateString() {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

export default {
  data: new SlashCommandBuilder()
    .setName('debug-autofish')
    .setDescription('🔧 Debug thời gian auto-fishing (Admin only)')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User cần check (để trống = bản thân)')
        .setRequired(false)),
  async execute(interaction) {
    try {
      // Kiểm tra admin (đơn giản)
      if (!interaction.member.permissions.has('Administrator')) {
        await interaction.reply({
          content: '❌ Chỉ admin mới được sử dụng lệnh này!',
          flags: 64
        });
        return;
      }

      const targetUser = interaction.options.getUser('user') || interaction.user;
      const todayKey = getTodayDateString();

      // Lấy VIP info
      const vip = await getOrCreateVIP(targetUser.id, targetUser.username);
      const vipPerks = getVIPPerks(vip);
      const maxDuration = vipPerks ? vipPerks.autoFishingTime : 0;

      // Lấy user từ database
      const user = await User.findOne({ discordId: targetUser.id });
      if (!user) {
        await interaction.reply({
          content: '❌ Không tìm thấy user trong database!',
          flags: 64
        });
        return;
      }

      // Kiểm tra thời gian đã dùng
      let usedToday = 0;
      let dataSource = 'none';
      
      if (user.autoFishingToday && user.autoFishingToday.date === todayKey) {
        usedToday = user.autoFishingToday.minutes;
        dataSource = 'autoFishingToday';
      } else if (user[`autofish_${todayKey}`]) {
        usedToday = user[`autofish_${todayKey}`];
        dataSource = 'fallback field';
      }

      const remaining = Math.max(0, maxDuration - usedToday);
      const percentage = maxDuration > 0 ? Math.floor((usedToday / maxDuration) * 100) : 0;

      // Tạo embed debug
      const embed = new EmbedBuilder()
        .setTitle('🔧 Debug Auto-fishing Time')
        .setDescription(`**Target User:** ${targetUser.username} (${targetUser.id})`)
        .setColor('#3498db')
        .addFields(
          { name: '👑 VIP Status', value: vip && vip.isVipActive() ? `${vipPerks.tier} ✅` : 'Không có VIP ❌', inline: true },
          { name: '⏱️ Giới hạn/ngày', value: `${maxDuration} phút`, inline: true },
          { name: '🕒 Đã sử dụng', value: `${usedToday} phút (${percentage}%)`, inline: true },
          { name: '🟢 Còn lại', value: `${remaining} phút`, inline: true },
          { name: '📅 Ngày hiện tại', value: todayKey, inline: true },
          { name: '📊 Data source', value: dataSource, inline: true }
        )
        .setTimestamp();

      // Thêm raw data debug
      const debugData = {
        autoFishingToday: user.autoFishingToday,
        fallbackField: user[`autofish_${todayKey}`],
        balance: user.balance,
        vipTier: vip?.vipTier,
        vipExpire: vip?.vipExpireAt
      };

      embed.addFields({
        name: '🛠️ Raw Debug Data',
        value: `\`\`\`json\n${JSON.stringify(debugData, null, 2)}\`\`\``,
        inline: false
      });

      // Kiểm tra VIP active
      if (vip && vip.isVipActive()) {
        embed.addFields({
          name: '✅ VIP Info',
          value: `**Tier:** ${vip.vipTier}\n**Expire:** <t:${Math.floor(vip.vipExpireAt.getTime()/1000)}:F>\n**Auto-fish quota:** ${maxDuration} phút/ngày`,
          inline: false
        });
      }

      await interaction.reply({ embeds: [embed], flags: 64 });

    } catch (error) {
      console.error('Debug autofish error:', error);
      await interaction.reply({
        content: `❌ Có lỗi xảy ra: \`${error.message}\``,
        flags: 64
      });
    }
  }
};