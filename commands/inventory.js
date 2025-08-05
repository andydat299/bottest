import { SlashCommandBuilder } from 'discord.js';
import { User } from '../schemas/userSchema.js';

export default {
  data: new SlashCommandBuilder().setName('inventory').setDescription('Xem kho cá của bạn'),
  prefixEnabled: true, // Cho phép sử dụng với prefix

  async execute(interaction) {
    const user = await User.findOne({ discordId: interaction.user.id });
    if (!user || user.fish.size === 0) {
      return interaction.reply({ content: '🐟 Bạn chưa có con cá nào cả!' });
    }

    const lines = [...user.fish.entries()].map(([name, count]) => `• ${name}: ${count} con`);
    interaction.reply({
      content: `🎒 **Kho cá của bạn:**\n${lines.join('\n')}`
    });
  }
};
