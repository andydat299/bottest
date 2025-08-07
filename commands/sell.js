import { SlashCommandBuilder } from 'discord.js';
import { User } from '../schemas/userSchema.js';
import { fishTypes } from '../utils/fishTypes.js';
import { updateQuestProgress } from '../utils/questManager.js';
import { isCommandDisabled } from '../utils/commandControl.js';
import { logMoneyReceived } from '../utils/logger.js';

export default {
  data: new SlashCommandBuilder().setName('sell').setDescription('Bán toàn bộ cá để lấy tiền'),
  prefixEnabled: false, // Cho phép sử dụng với prefix

  async execute(interaction) {
    // Lệnh sell đã bị tắt hoàn toàn
    return interaction.reply({
      content: '🚫 **Lệnh sell đã bị vô hiệu hóa hoàn toàn!**\n\n💡 *Tính năng bán cá đã được tắt bởi admin và không thể sử dụng.*\n\n🎣 *Hãy tiếp tục câu cá và tham gia các hoạt động khác!*',
      ephemeral: true
    });

    /*
    // Code cũ của sell command (đã bị vô hiệu hóa)
    // Kiểm tra lệnh có bị disable không
    if (isCommandDisabled('sell')) {
      return interaction.reply({
        content: '🔒 **Lệnh sell hiện đang bị tắt!**\n\n💡 *Admin đã tạm thời vô hiệu hóa tính năng bán cá.*',
        ephemeral: true
      });
    }

    const user = await User.findOne({ discordId: interaction.user.id });
    if (!user || user.fish.size === 0) {
      return interaction.reply({ content: '🐟 Bạn không có cá nào để bán.' });
    }

    let total = 0;
    for (const [name, count] of user.fish.entries()) {
      const fish = fishTypes.find(f => f.name === name);
      if (fish) total += fish.price * count;
    }

    user.balance += total;
    user.totalSold += total;
    user.fish = new Map();
    await user.save();

    // Log money received from selling fish
    await logMoneyReceived(interaction.user, total, 'sell-fish', {
      fishCount: [...user.fish.values()].reduce((sum, count) => sum + count, 0)
    });

    // Cập nhật quest earn money
    await updateQuestProgress(interaction.user.id, 'earn', total);

    interaction.reply({ content: `💰 Bạn đã bán cá được **${total} xu**!` });
    */
};
