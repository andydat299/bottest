import { SlashCommandBuilder } from 'discord.js';
import { checkFishingCooldown, formatCooldownTime } from '../utils/cooldownManager.js';

export default {
  data: new SlashCommandBuilder()
    .setName('cooldown')
    .setDescription('Kiểm tra thời gian cooldown câu cá của bạn ⏰'),

  async execute(interaction) {
    const discordId = interaction.user.id;
    const cooldownCheck = checkFishingCooldown(discordId);

    if (!cooldownCheck.isOnCooldown) {
      await interaction.reply({
        content: `✅ **Bạn có thể câu cá ngay bây giờ!**\n\n🎣 Sử dụng </fish:0> để bắt đầu câu cá!`,
        ephemeral: true
      });
    } else {
      await interaction.reply({
        content: `⏰ **Bạn đang trong thời gian chờ!**\n\n🕐 Thời gian còn lại: **${formatCooldownTime(cooldownCheck.remainingTime)}**\n\n💡 *Cooldown sẽ tự động xóa khi hết thời gian.*`,
        ephemeral: true
      });
    }
  }
};
