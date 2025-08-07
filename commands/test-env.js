import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('test-env')
    .setDescription('🧪 [ADMIN] Test environment variables')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    try {
      const embed = new EmbedBuilder()
        .setTitle('🧪 ENVIRONMENT TEST')
        .setDescription('**Environment variables status:**')
        .addFields(
          { name: '🔑 Bot Token', value: process.env.BOT_TOKEN ? '✅ Set' : '❌ Missing', inline: true },
          { name: '🗄️ Database URL', value: process.env.MONGODB_URI ? '✅ Set' : '❌ Missing', inline: true },
          { name: '🆔 Client ID', value: process.env.CLIENT_ID ? '✅ Set' : '❌ Missing', inline: true },
          { name: '🏠 Guild ID', value: process.env.GUILD_ID ? '✅ Set' : '❌ Missing', inline: true },
          { name: '⚙️ Node ENV', value: process.env.NODE_ENV || 'development', inline: true },
          { name: '🖥️ Platform', value: process.platform, inline: true }
        )
        .setColor(process.env.BOT_TOKEN && process.env.MONGODB_URI ? '#00ff00' : '#ff0000')
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
      console.error('Error in test-env:', error);
      await interaction.reply({
        content: '❌ Error testing environment.',
        ephemeral: true
      });
    }
  }
};