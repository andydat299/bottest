import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('quest')
    .setDescription('🎯 Xem nhiệm vụ của bạn'),

  async execute(interaction) {
    try {
      const { getUserQuests, generateDailyQuests } = await import('../utils/enhancedQuestManager.js');

      let quests = await getUserQuests(interaction.user.id);
      
      // Nếu chưa có quest, tự động generate
      if (quests.length === 0) {
        try {
          const result = await generateDailyQuests(interaction.user.id);
          quests = result.newQuests;
        } catch (error) {
          // Nếu không thể generate (đã đủ 3 quest hôm nay)
          return await interaction.reply({
            content: '📝 **Bạn đã hoàn thành hết quest hôm nay!**\n🎯 Quay lại vào ngày mai để nhận quest mới.',
            ephemeral: true
          });
        }
      }

      // Tạo embed hiển thị quest
      const embed = new EmbedBuilder()
        .setTitle('🎯 NHIỆM VỤ CỦA BẠN')
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
        if (quest.isCompleted && quest.isClaimed) {
          statusIcon = '✅';
        } else if (quest.isCompleted) {
          statusIcon = '🎁';
          claimableQuests.push(quest);
        }
        
        questList += `${statusIcon} **${quest.name}**\n`;
        questList += `📜 ${quest.description}\n`;
        questList += `${progressBar} **${quest.progress}/${quest.target}** (${progressPercent}%)\n`;
        questList += `💰 **${quest.reward} xu**\n\n`;
        
        if (new Date(quest.createdAt).toDateString() === today) {
          totalRewardToday += quest.reward;
        }
      });

      embed.setDescription(questList);
      
      if (claimableQuests.length > 0) {
        embed.setFooter({ text: `🎁 ${claimableQuests.length} quest hoàn thành! • Hôm nay: ${totalRewardToday}/1000 xu` });
      } else {
        embed.setFooter({ text: `📊 Quest hôm nay: ${todayQuests.length}/3 • Thưởng: ${totalRewardToday}/1000 xu` });
      }

      // Tạo buttons
      const buttons = new ActionRowBuilder();
      
      // Luôn có nút refresh
      buttons.addComponents(
        new ButtonBuilder()
          .setCustomId('quest_refresh')
          .setLabel('🔄 Làm mới')
          .setStyle(ButtonStyle.Secondary)
      );

      // Nếu có quest hoàn thành, hiển thị nút claim
      if (claimableQuests.length > 0) {
        buttons.addComponents(
          new ButtonBuilder()
            .setCustomId('quest_claim_all')
            .setLabel(`🎁 Nhận thưởng (${claimableQuests.length})`)
            .setStyle(ButtonStyle.Success)
        );
      }

      // Nếu chưa đủ 3 quest hôm nay, có nút tạo thêm
      if (todayQuests.length < 3) {
        buttons.addComponents(
          new ButtonBuilder()
            .setCustomId('quest_generate_more')
            .setLabel('➕ Tạo quest mới')
            .setStyle(ButtonStyle.Primary)
        );
      }

      await interaction.reply({ 
        embeds: [embed], 
        components: [buttons], 
        ephemeral: true 
      });

    } catch (error) {
      console.error('Error in quest command:', error);
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