import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('test-quest-system')
    .setDescription('🧪 [ADMIN] Test quest system functionality')
    .addSubcommand(subcommand =>
      subcommand
        .setName('generate')
        .setDescription('Test quest generation')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('User to generate quests for')
            .setRequired(true)
        )
        .addIntegerOption(option =>
          option.setName('count')
            .setDescription('Number of quests to generate')
            .setMinValue(1)
            .setMaxValue(5)
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('simulate')
        .setDescription('Simulate quest progress')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('User to simulate for')
            .setRequired(true)
        )
        .addStringOption(option =>
          option.setName('type')
            .setDescription('Quest type to progress')
            .addChoices(
              { name: 'Fishing', value: 'fish' },
              { name: 'Chat', value: 'chat_messages' },
              { name: 'Blackjack', value: 'blackjack_wins' },
              { name: 'Wheel', value: 'wheel_spins' }
            )
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('overview')
        .setDescription('System overview and stats')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    
    try {
      if (subcommand === 'generate') {
        const user = interaction.options.getUser('user');
        const count = interaction.options.getInteger('count') || 3;
        
        const embed = new EmbedBuilder()
          .setTitle('🧪 QUEST GENERATION TEST')
          .setDescription(`**Testing quest generation for ${user.username}:**`)
          .addFields(
            { name: '🎯 Quests to Generate', value: `${count}`, inline: true },
            { name: '💰 Max Daily Reward', value: '1000 xu', inline: true },
            { name: '📊 Daily Limit', value: '3 quests', inline: true },
            { name: '🔧 Status', value: 'Use /quest command to test actual generation', inline: false }
          )
          .setColor('#00ff00')
          .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
        
      } else if (subcommand === 'simulate') {
        const user = interaction.options.getUser('user');
        const questType = interaction.options.getString('type');
        
        const embed = new EmbedBuilder()
          .setTitle('🧪 QUEST PROGRESS SIMULATION')
          .setDescription(`**Simulating progress for ${user.username}:**`)
          .addFields(
            { name: '🎯 Quest Type', value: questType, inline: true },
            { name: '📈 Progress Added', value: '+1', inline: true },
            { name: '🔧 Status', value: 'Use 🧪 Test button in /quest for real simulation', inline: false }
          )
          .setColor('#ff6b6b')
          .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
        
      } else if (subcommand === 'overview') {
        const embed = new EmbedBuilder()
          .setTitle('🧪 QUEST SYSTEM OVERVIEW')
          .setDescription('**System status and configuration:**')
          .addFields(
            { name: '🎯 Quest Types', value: '20+ different quest types', inline: true },
            { name: '📊 Daily Limit', value: '3 quests per user', inline: true },
            { name: '💰 Daily Reward Cap', value: '1000 xu maximum', inline: true },
            { name: '⏰ Quest Duration', value: '24 hours', inline: true },
            { name: '🎮 Categories', value: 'Fishing, Gaming, Social, Economy, Special', inline: true },
            { name: '🔧 Features', value: 'Auto-generate, Smart claiming, Progress tracking', inline: true }
          )
          .setColor('#9b59b6')
          .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
      }

    } catch (error) {
      console.error('Error in test-quest-system:', error);
      await interaction.reply({
        content: '❌ Error testing quest system.',
        ephemeral: true
      });
    }
  }
};