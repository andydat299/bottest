import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { getAllCooldowns, clearFishingCooldown, formatCooldownTime } from '../utils/cooldownManager.js';

export default {
  data: new SlashCommandBuilder()
    .setName('managecooldown')
    .setDescription('⚙️ [ADMIN] Quản lý cooldown của người dùng')
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('Xem danh sách tất cả cooldowns hiện tại')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('clear')
        .setDescription('Xóa cooldown của một người dùng')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('Người dùng cần xóa cooldown')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('clearall')
        .setDescription('Xóa tất cả cooldowns')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    // Kiểm tra quyền admin
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: '❌ Bạn cần quyền Administrator để sử dụng lệnh này!',
        ephemeral: true
      });
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'list') {
      const cooldowns = getAllCooldowns();
      
      if (cooldowns.size === 0) {
        return interaction.reply({
          content: '📊 **Không có cooldown nào đang hoạt động!**',
          ephemeral: true
        });
      }

      let cooldownList = '📊 **Danh sách Cooldowns hiện tại:**\n\n';
      const now = Date.now();
      
      for (const [userId, cooldownEnd] of cooldowns) {
        const remainingTime = Math.ceil((cooldownEnd - now) / 1000);
        if (remainingTime > 0) {
          cooldownList += `<@${userId}>: ${formatCooldownTime(remainingTime)}\n`;
        }
      }

      await interaction.reply({
        content: cooldownList || '📊 **Không có cooldown nào đang hoạt động!**',
        ephemeral: true
      });

    } else if (subcommand === 'clear') {
      const targetUser = interaction.options.getUser('user');
      clearFishingCooldown(targetUser.id);
      
      await interaction.reply({
        content: `✅ **Đã xóa cooldown cho <@${targetUser.id}>!**\n\n🎣 Người dùng này có thể câu cá ngay bây giờ.`,
        ephemeral: true
      });

    } else if (subcommand === 'clearall') {
      const cooldowns = getAllCooldowns();
      const count = cooldowns.size;
      cooldowns.clear();
      
      await interaction.reply({
        content: `✅ **Đã xóa tất cả cooldowns!**\n\n📊 Đã xóa: ${count} cooldown(s)\n🎣 Tất cả người dùng có thể câu cá ngay bây giờ.`,
        ephemeral: true
      });
    }
  }
};
