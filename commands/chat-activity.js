import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('chat-activity')
    .setDescription('💬 Xem thống kê hoạt động chat')
    .addSubcommand(subcommand =>
      subcommand
        .setName('stats')
        .setDescription('Xem thống kê chat của bạn')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('User to check stats for')
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('leaderboard')
        .setDescription('Bảng xếp hạng chat activity')
        .addIntegerOption(option =>
          option.setName('limit')
            .setDescription('Number of users to show')
            .setMinValue(5)
            .setMaxValue(20)
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('rewards')
        .setDescription('Xem hệ thống thưởng chat')
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    try {
      if (subcommand === 'stats') {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        
        // Mock stats for now
        const embed = new EmbedBuilder()
          .setTitle('💬 CHAT ACTIVITY STATS')
          .setDescription(`**${targetUser.username}**`)
          .addFields(
            { name: '📊 Total Messages', value: '0', inline: true },
            { name: '🏆 Daily Streak', value: '0 days', inline: true },
            { name: '💰 Total Earned', value: '0 xu', inline: true },
            { name: '⚡ Today\'s Activity', value: '0 messages', inline: true },
            { name: '🎁 Today\'s Rewards', value: '0 xu', inline: true },
            { name: '📈 Avg per Day', value: '0 messages', inline: true }
          )
          .setColor('#3498db')
          .setThumbnail(targetUser.displayAvatarURL())
          .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });

      } else if (subcommand === 'leaderboard') {
        const limit = interaction.options.getInteger('limit') || 10;
        
        const embed = new EmbedBuilder()
          .setTitle('🏆 CHAT ACTIVITY LEADERBOARD')
          .setDescription('**Most active chatters this week:**')
          .addFields(
            { name: 'Coming Soon', value: 'Chat leaderboard feature is being developed!', inline: false }
          )
          .setColor('#f39c12')
          .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });

      } else if (subcommand === 'rewards') {
        const embed = new EmbedBuilder()
          .setTitle('💰 CHAT REWARD SYSTEM')
          .setDescription('**Earn xu by being active in chat!**')
          .addFields(
            {
              name: '💬 Basic Rewards',
              value: '• **50 xu** per message\n• **500 xu** daily bonus (first message)\n• **150 xu** bonus for replies',
              inline: true
            },
            {
              name: '⭐ Quality Bonuses',
              value: '• **+100 xu** long messages (50+ chars)\n• **+50 xu** messages with emojis\n• **+75 xu** questions (?)',
              inline: true
            },
            {
              name: '🎮 Chat Games',
              value: '• **Word Master**: 8+ words\n• **Emoji King**: 3+ emojis\n• **Question Master**: Ask questions',
              inline: false
            },
            {
              name: '🍀 Random Events',
              value: '• **Lucky Chat** (2%): 500-1500 xu\n• **Chat Jackpot** (0.5%): 5K-15K xu',
              inline: false
            },
            {
              name: '🔥 Streak Bonuses',
              value: '• **+10%** reward per consecutive day\n• **Max 500 xu** bonus cap\n• Reset if inactive for 24h',
              inline: false
            }
          )
          .setColor('#00ff00')
          .setFooter({ text: 'Start chatting to earn rewards automatically!' })
          .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
      }

    } catch (error) {
      console.error('Error in chat-activity command:', error);
      await interaction.reply({
        content: '❌ Error occurred while processing chat activity command.',
        ephemeral: true
      });
    }
  }
};