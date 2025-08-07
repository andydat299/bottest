import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('announce-chat-rewards')
    .setDescription('📢 [ADMIN] Announce chat reward system')
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('Channel to announce in')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    try {
      const targetChannel = interaction.options.getChannel('channel') || interaction.channel;
      
      const embed = new EmbedBuilder()
        .setTitle('🎉 CHAT REWARD SYSTEM ACTIVATED!')
        .setDescription('**Get rewarded for being active in chat!**')
        .addFields(
          {
            name: '💰 Base Rewards',
            value: '• **50 xu** per message\n• **500 xu** daily bonus (first message)\n• **+10%** streak bonus per consecutive day',
            inline: true
          },
          {
            name: '⭐ Quality Bonuses',
            value: '• **+100 xu** long messages (50+ chars)\n• **+50 xu** messages with emojis\n• **+75 xu** questions with ?',
            inline: true
          },
          {
            name: '🎮 Mini Games',
            value: '• **Word Master**: 8+ words bonus\n• **Emoji King**: 3+ emojis bonus\n• **Question Master**: Ask questions',
            inline: false
          },
          {
            name: '🍀 Random Events',
            value: '• **Lucky Chat**: 2% chance = 500-1500 xu\n• **Chat Jackpot**: 0.5% chance = 5K-15K xu',
            inline: false
          },
          {
            name: '🚀 How to Start',
            value: 'Just start chatting! Rewards are automatic.\nUse `/chat-activity stats` to track your progress.',
            inline: false
          }
        )
        .setColor('#00ff00')
        .setFooter({ text: 'Chat more, earn more! 💬✨' })
        .setTimestamp();

      await targetChannel.send({ embeds: [embed] });
      
      await interaction.reply({
        content: `✅ Chat rewards announced in ${targetChannel}!`,
        ephemeral: true
      });

    } catch (error) {
      console.error('Error in announce-chat-rewards:', error);
      await interaction.reply({
        content: '❌ Failed to announce chat rewards.',
        ephemeral: true
      });
    }
  }
};