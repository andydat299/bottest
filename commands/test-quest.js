import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('test-quest')
    .setDescription('🧪 Test quest system')
    .addSubcommand(subcommand =>
      subcommand
        .setName('progress')
        .setDescription('Test quest progress update')
        .addStringOption(option =>
          option.setName('type')
            .setDescription('Quest type to test')
            .addChoices(
              { name: 'Fish', value: 'fish' },
              { name: 'Chat', value: 'chat_messages' },
              { name: 'Blackjack Win', value: 'blackjack_wins' },
              { name: 'Wheel Spin', value: 'wheel_spins' },
              { name: 'Rare Fish', value: 'rare_fish' }
            )
            .setRequired(true)
        )
        .addIntegerOption(option =>
          option.setName('amount')
            .setDescription('Amount to add')
            .setMinValue(1)
            .setMaxValue(10)
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('generate')
        .setDescription('Generate test quests')
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    try {
      const { updateQuestProgress, generateDailyQuests, getUserQuests } = await import('../utils/enhancedQuestManager.js');

      if (subcommand === 'progress') {
        const questType = interaction.options.getString('type');
        const amount = interaction.options.getInteger('amount') || 1;

        await interaction.deferReply({ ephemeral: true });

        // Test quest progress update
        const completedQuests = await updateQuestProgress(interaction.user.id, questType, amount, {
          rarity: questType === 'rare_fish' ? 'rare' : undefined,
          value: questType === 'fish_value' ? amount * 100 : undefined
        });

        let response = `🧪 **Test Quest Progress**\n`;
        response += `**Type:** ${questType}\n`;
        response += `**Amount:** +${amount}\n\n`;

        if (completedQuests.length > 0) {
          response += `🎉 **Quest hoàn thành:**\n`;
          completedQuests.forEach(quest => {
            response += `• **${quest.name}** - ${quest.reward} xu\n`;
          });
        } else {
          response += `📊 Quest progress updated (no completion)`;
        }

        await interaction.editReply({ content: response });

      } else if (subcommand === 'generate') {
        await interaction.deferReply({ ephemeral: true });

        try {
          const result = await generateDailyQuests(interaction.user.id);

          const embed = new EmbedBuilder()
            .setTitle('🧪 TEST QUEST GENERATION')
            .setDescription(`**Generated ${result.newQuests.length} test quests:**`)
            .setColor('#00ff00');

          let questList = '';
          result.newQuests.forEach((quest, index) => {
            questList += `**${index + 1}.** ${quest.name}\n`;
            questList += `📜 ${quest.description}\n`;
            questList += `💰 ${quest.reward} xu • 🎯 ${quest.target}\n\n`;
          });

          embed.setDescription(questList);
          embed.addFields(
            { name: '📊 Total quests today', value: `${result.totalQuests}/3`, inline: true },
            { name: '💰 Total rewards today', value: `${result.totalRewardToday}/1000 xu`, inline: true },
            { name: '💡 Remaining budget', value: `${result.remainingBudget} xu`, inline: true }
          );

          await interaction.editReply({ embeds: [embed] });

        } catch (error) {
          await interaction.editReply({
            content: `❌ **Error generating quests:**\n\`${error.message}\``
          });
        }
      }

    } catch (error) {
      console.error('Error in test-quest command:', error);
      await interaction.reply({
        content: `❌ **Error:**\n\`${error.message}\``,
        ephemeral: true
      });
    }
  }
};