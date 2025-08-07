import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('quests')
    .setDescription('🎯 Hệ thống nhiệm vụ (3 quest/ngày, max 1000 xu)')
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('Xem nhiệm vụ hiện tại')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('generate')
        .setDescription('Tạo nhiệm vụ mới (3/ngày)')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('claim')
        .setDescription('Nhận thưởng quest hoàn thành')
        .addStringOption(option =>
          option.setName('quest_id')
            .setDescription('ID quest muốn claim (hoặc "all" để claim tất cả)')
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('stats')
        .setDescription('Xem thống kê quest')
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    
    try {
      const { getUserQuests, generateDailyQuests, getQuestStats, claimQuestReward, claimAllQuests } = await import('../utils/enhancedQuestManager.js');

      if (subcommand === 'list') {
        const quests = await getUserQuests(interaction.user.id);
        
        if (quests.length === 0) {
          const noQuestEmbed = new EmbedBuilder()
            .setTitle('📝 Không có nhiệm vụ')
            .setDescription('🎯 **Bạn chưa có nhiệm vụ nào!**\n\n💡 Sử dụng `/quests generate` để tạo nhiệm vụ mới (tối đa 3/ngày).')
            .setColor('#ffaa00')
            .setTimestamp();

          return await interaction.reply({ embeds: [noQuestEmbed], ephemeral: true });
        }

        const embed = new EmbedBuilder()
          .setTitle('🎯 NHIỆM VỤ CỦA BẠN')
          .setDescription('**Tối đa 3 nhiệm vụ/ngày • Tổng thưởng ≤ 1000 xu**')
          .setColor('#4CAF50')
          .setThumbnail(interaction.user.displayAvatarURL())
          .setTimestamp();

        let questList = '';
        let claimableQuests = [];
        let totalRewardToday = 0;
        
        const today = new Date().toDateString();
        const todayQuests = quests.filter(q => new Date(q.createdAt).toDateString() === today);
        
        quests.forEach((quest) => {
          const progressBar = createProgressBar(quest.progress, quest.target);
          const progressPercent = Math.round((quest.progress / quest.target) * 100);
          
          let statusIcon = '⏳';
          if (quest.isCompleted && quest.isClaimed) statusIcon = '✅';
          else if (quest.isCompleted) {
            statusIcon = '🎁';
            claimableQuests.push(quest);
          }
          
          questList += `${statusIcon} **${quest.name}**\n`;
          questList += `📜 ${quest.description}\n`;
          questList += `${progressBar} **${quest.progress}/${quest.target}** (${progressPercent}%)\n`;
          questList += `💰 **${quest.reward} xu** • 🆔 \`${quest.id.slice(-8)}\`\n\n`;
          
          if (new Date(quest.createdAt).toDateString() === today) {
            totalRewardToday += quest.reward;
          }
        });

        embed.setDescription(questList);
        
        if (claimableQuests.length > 0) {
          embed.setFooter({ text: `🎁 ${claimableQuests.length} quest có thể claim • Hôm nay: ${totalRewardToday}/1000 xu` });
        } else {
          embed.setFooter({ text: `📊 Quests hôm nay: ${todayQuests.length}/3 • Thưởng: ${totalRewardToday}/1000 xu` });
        }

        await interaction.reply({ embeds: [embed], ephemeral: true });

      } else if (subcommand === 'generate') {
        await interaction.deferReply({ ephemeral: true });
        
        try {
          const result = await generateDailyQuests(interaction.user.id);
          
          const embed = new EmbedBuilder()
            .setTitle('✨ NHIỆM VỤ MỚI ĐÃ TẠO!')
            .setDescription(`**${result.newQuests.length} nhiệm vụ ngẫu nhiên đã được tạo:**`)
            .setColor('#00ff00')
            .setTimestamp();

          let questDescription = '';
          result.newQuests.forEach((quest, index) => {
            questDescription += `**${index + 1}.** ${quest.name}\n`;
            questDescription += `📜 ${quest.description}\n`;
            questDescription += `💰 **${quest.reward} xu** • ⏰ 24h\n`;
            questDescription += `🆔 \`${quest.id.slice(-8)}\`\n\n`;
          });

          embed.setDescription(questDescription);
          embed.addFields(
            { name: '📊 Tổng quest hôm nay', value: `${result.totalQuests}`, inline: true },
            { name: '💰 Tổng thưởng hôm nay', value: `${result.totalRewardToday}/1000 xu`, inline: true },
            { name: '💡 Budget còn lại', value: `${result.remainingBudget} xu`, inline: true }
          );
          embed.setFooter({ text: '💡 Sử dụng /quests list để xem tiến độ!' });

          await interaction.editReply({ embeds: [embed] });
          
        } catch (error) {
          await interaction.editReply({
            content: `❌ **Lỗi tạo quest:**\n\`${error.message}\``
          });
        }

      } else if (subcommand === 'claim') {
        const questId = interaction.options.getString('quest_id');
        
        if (!questId || questId === 'all') {
          // Claim all quests
          const result = await claimAllQuests(interaction.user.id);
          
          if (result.count === 0) {
            return await interaction.reply({
              content: '❌ Bạn không có quest nào để claim!',
              ephemeral: true
            });
          }
          
          const embed = new EmbedBuilder()
            .setTitle('🎁 NHẬN THƯỞNG THÀNH CÔNG!')
            .setDescription(`**Đã claim ${result.count} quest**`)
            .addFields(
              { name: '🎁 Số quest đã claim', value: `${result.count}`, inline: true },
              { name: '💰 Tổng thưởng nhận', value: `${result.totalReward.toLocaleString()} xu`, inline: true }
            )
            .setColor('#00ff00')
            .setTimestamp();
            
          await interaction.reply({ embeds: [embed], ephemeral: true });
          
        } else {
          // Claim specific quest
          const reward = await claimQuestReward(interaction.user.id, questId);
          
          if (reward === 0) {
            return await interaction.reply({
              content: '❌ Quest không tồn tại hoặc đã được claim!',
              ephemeral: true
            });
          }
          
          await interaction.reply({
            content: `🎁 **Claim thành công!** Nhận được **${reward.toLocaleString()} xu**`,
            ephemeral: true
          });
        }

      } else if (subcommand === 'stats') {
        const stats = await getQuestStats(interaction.user.id);
        
        if (!stats) {
          return await interaction.reply({
            content: '❌ Không tìm thấy dữ liệu quest!',
            ephemeral: true
          });
        }

        const embed = new EmbedBuilder()
          .setTitle('📊 THỐNG KÊ NHIỆM VỤ')
          .setDescription(`**Quest stats của ${interaction.user.username}**`)
          .addFields(
            { name: '🎯 Tổng quest', value: `${stats.totalQuests}`, inline: true },
            { name: '📅 Quest hôm nay', value: `${stats.todayQuests}/3`, inline: true },
            { name: '✅ Đã hoàn thành', value: `${stats.completedQuests}`, inline: true },
            { name: '🎁 Đã claim', value: `${stats.claimedQuests}`, inline: true },
            { name: '📈 Tỷ lệ hoàn thành', value: `${stats.completionRate}%`, inline: true },
            { name: '💰 Tổng thưởng nhận', value: `${stats.totalRewards.toLocaleString()} xu`, inline: true },
            { name: '🌅 Thưởng hôm nay', value: `${stats.todayRewards}/1000 xu`, inline: true },
            { name: '⭐ Hiệu suất', value: getPerformanceRating(stats.completionRate), inline: true }
          )
          .setColor(stats.completionRate >= 80 ? '#00ff00' : stats.completionRate >= 50 ? '#ffaa00' : '#ff6666')
          .setThumbnail(interaction.user.displayAvatarURL())
          .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
      }

    } catch (error) {
      console.error('Error in quests command:', error);
      await interaction.reply({
        content: `❌ **Có lỗi xảy ra:**\n\`${error.message}\``,
        ephemeral: true
      });
    }
  }
};

function createProgressBar(current, target, length = 15) {
  const progress = Math.min(current / target, 1);
  const filled = Math.round(progress * length);
  const empty = length - filled;
  
  const filledBar = '█'.repeat(filled);
  const emptyBar = '░'.repeat(empty);
  
  return `\`${filledBar}${emptyBar}\``;
}

function getPerformanceRating(completionRate) {
  if (completionRate >= 90) return '🏆 Legendary';
  if (completionRate >= 80) return '💎 Master';
  if (completionRate >= 70) return '🥇 Expert';
  if (completionRate >= 60) return '🥈 Advanced';
  if (completionRate >= 50) return '🥉 Intermediate';
  if (completionRate >= 30) return '📚 Beginner';
  return '🌱 Newbie';
}