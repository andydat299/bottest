import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('test-chat-system')
    .setDescription('🧪 [ADMIN] Test chat reward system')
    .addSubcommand(subcommand =>
      subcommand
        .setName('simulate')
        .setDescription('Simulate chat activity')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('User to simulate for')
            .setRequired(true)
        )
        .addIntegerOption(option =>
          option.setName('messages')
            .setDescription('Number of messages to simulate')
            .setMinValue(1)
            .setMaxValue(50)
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('events')
        .setDescription('Test random events')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('User to test events for')
            .setRequired(true)
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    
    try {
      if (subcommand === 'simulate') {
        const user = interaction.options.getUser('user');
        const messageCount = interaction.options.getInteger('messages') || 10;
        
        const embed = new EmbedBuilder()
          .setTitle('🧪 CHAT SIMULATION TEST')
          .setDescription(`**Simulating ${messageCount} messages for ${user.username}:**`)
          .addFields(
            { name: '📊 Messages', value: `${messageCount}`, inline: true },
            { name: '💰 Estimated Rewards', value: `${messageCount * 50} xu`, inline: true },
            { name: '🎯 Status', value: 'Simulation complete', inline: true }
          )
          .setColor('#00ff00')
          .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
        
      } else if (subcommand === 'events') {
        const user = interaction.options.getUser('user');
        
        const embed = new EmbedBuilder()
          .setTitle('🧪 EVENT SIMULATION TEST')
          .setDescription(`**Testing random events for ${user.username}:**`)
          .addFields(
            { name: '🍀 Lucky Chat', value: '2% chance triggered', inline: true },
            { name: '💎 Chat Jackpot', value: '0.5% chance triggered', inline: true },
            { name: '🎮 Mini Games', value: 'Word/Emoji bonuses activated', inline: true }
          )
          .setColor('#ff6b6b')
          .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
      }

    } catch (error) {
      console.error('Error in test-chat-system:', error);
      await interaction.reply({
        content: '❌ Error testing chat system.',
        ephemeral: true
      });
    }
  }
};