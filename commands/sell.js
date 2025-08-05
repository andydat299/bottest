import { SlashCommandBuilder } from 'discord.js';
import { User } from '../schemas/userSchema.js';
import { fishTypes } from '../utils/fishTypes.js';
import { updateQuestProgress } from '../utils/questManager.js';

export default {
  data: new SlashCommandBuilder().setName('sell').setDescription('Bán toàn bộ cá để lấy tiền'),
  prefixEnabled: true, // Cho phép sử dụng với prefix

  async execute(interaction) {
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

    // Cập nhật quest earn money
    await updateQuestProgress(interaction.user.id, 'earn', total);

    interaction.reply({ content: `💰 Bạn đã bán cá được **${total} xu**!` });
  }
};
