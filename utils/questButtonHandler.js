import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

/**
 * Handle quest button interactions
 */
export async function handleQuestButtons(interaction) {
  try {
    const { getUserQuests, generateDailyQuests, claimAllQuests } = await import('./enhancedQuestManager.js');

    if (interaction.customId === 'quest_refresh') {
      // Refresh quest display
      const quests = await getUserQuests(interaction.user.id);
      
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

      embed.setDescription(questList || 'Không có quest nào.');
      
      if (claimableQuests.length > 0) {
        embed.setFooter({ text: `🎁 ${claimableQuests.length} quest hoàn thành! • Hôm nay: ${totalRewardToday}/1000 xu` });
      } else {
        embed.setFooter({ text: `📊 Quest hôm nay: ${todayQuests.length}/3 • Thưởng: ${totalRewardToday}/1000 xu` });
      }

      // Update buttons
      const buttons = new ActionRowBuilder();
      
      buttons.addComponents(
        new ButtonBuilder()
          .setCustomId('quest_refresh')
          .setLabel('🔄 Làm mới')
          .setStyle(ButtonStyle.Secondary)
      );

      if (claimableQuests.length > 0) {
        buttons.addComponents(
          new ButtonBuilder()
            .setCustomId('quest_claim_all')
            .setLabel(`🎁 Nhận thưởng (${claimableQuests.length})`)
            .setStyle(ButtonStyle.Success)
        );
      }

      if (todayQuests.length < 3) {
        buttons.addComponents(
          new ButtonBuilder()
            .setCustomId('quest_generate_more')
            .setLabel('➕ Tạo quest mới')
            .setStyle(ButtonStyle.Primary)
        );
      }

      await interaction.update({ 
        embeds: [embed], 
        components: [buttons] 
      });

    } else if (interaction.customId === 'quest_claim_all') {
      // Claim all completed quests
      await interaction.deferUpdate();
      
      const result = await claimAllQuests(interaction.user.id);
      
      if (result.count === 0) {
        await interaction.followUp({
          content: '❌ Không có quest nào để nhận thưởng!',
          ephemeral: true
        });
        return;
      }

      // Show success message
      const successEmbed = new EmbedBuilder()
        .setTitle('🎁 NHẬN THƯỞNG THÀNH CÔNG!')
        .setDescription(`**Bạn đã nhận thưởng từ ${result.count} quest!**`)
        .addFields(
          { name: '🎁 Số quest', value: `${result.count}`, inline: true },
          { name: '💰 Tổng thưởng', value: `${result.totalReward.toLocaleString()} xu`, inline: true }
        )
        .setColor('#00ff00')
        .setTimestamp();

      await interaction.followUp({
        embeds: [successEmbed],
        ephemeral: true
      });

      // Auto refresh quest display
      setTimeout(async () => {
        try {
          await refreshQuestDisplay(interaction);
        } catch (error) {
          console.error('Error auto-refreshing quest display:', error);
        }
      }, 1500);

    } else if (interaction.customId === 'quest_generate_more') {
      // Generate more quests
      await interaction.deferUpdate();
      
      try {
        const result = await generateDailyQuests(interaction.user.id);
        
        const successEmbed = new EmbedBuilder()
          .setTitle('✨ QUEST MỚI ĐÃ TẠO!')
          .setDescription(`**${result.newQuests.length} quest mới:**`)
          .setColor('#00ff00')
          .setTimestamp();

        let questDescription = '';
        result.newQuests.forEach((quest, index) => {
          questDescription += `**${index + 1}.** ${quest.name}\n`;
          questDescription += `📜 ${quest.description}\n`;
          questDescription += `💰 **${quest.reward} xu**\n\n`;
        });

        successEmbed.setDescription(questDescription);
        successEmbed.addFields(
          { name: '📊 Quest hôm nay', value: `${result.totalQuests}/3`, inline: true },
          { name: '💰 Thưởng hôm nay', value: `${result.totalRewardToday}/1000 xu`, inline: true }
        );

        await interaction.followUp({
          embeds: [successEmbed],
          ephemeral: true
        });

        // Auto refresh sau 1s
        setTimeout(async () => {
          try {
            await refreshQuestDisplay(interaction);
          } catch (error) {
            console.error('Error auto-refreshing after generate:', error);
          }
        }, 1500);

      } catch (error) {
        await interaction.followUp({
          content: `❌ **Lỗi tạo quest:**\n\`${error.message}\``,
          ephemeral: true
        });
      }
    }

  } catch (error) {
    console.error('Error handling quest button:', error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: '❌ Có lỗi xảy ra khi xử lý nút bấm!',
        ephemeral: true
      });
    }
  }
}

async function refreshQuestDisplay(interaction) {
  const { getUserQuests } = await import('./enhancedQuestManager.js');
  const quests = await getUserQuests(interaction.user.id);
  
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

  embed.setDescription(questList || 'Tất cả quest đã hoàn thành!');
  
  if (claimableQuests.length > 0) {
    embed.setFooter({ text: `🎁 ${claimableQuests.length} quest hoàn thành! • Hôm nay: ${totalRewardToday}/1000 xu` });
  } else {
    embed.setFooter({ text: `📊 Quest hôm nay: ${todayQuests.length}/3 • Thưởng: ${totalRewardToday}/1000 xu` });
  }

  const buttons = new ActionRowBuilder();
  
  buttons.addComponents(
    new ButtonBuilder()
      .setCustomId('quest_refresh')
      .setLabel('🔄 Làm mới')
      .setStyle(ButtonStyle.Secondary)
  );

  if (claimableQuests.length > 0) {
    buttons.addComponents(
      new ButtonBuilder()
        .setCustomId('quest_claim_all')
        .setLabel(`🎁 Nhận thưởng (${claimableQuests.length})`)
        .setStyle(ButtonStyle.Success)
    );
  }

  if (todayQuests.length < 3) {
    buttons.addComponents(
      new ButtonBuilder()
        .setCustomId('quest_generate_more')
        .setLabel('➕ Tạo quest mới')
        .setStyle(ButtonStyle.Primary)
    );
  }

  await interaction.editReply({ 
    embeds: [embed], 
    components: [buttons] 
  });
}

function createProgressBar(current, target, length = 15) {
  const progress = Math.min(current / target, 1);
  const filled = Math.round(progress * length);
  const empty = length - filled;
  
  const filledBar = '█'.repeat(filled);
  const emptyBar = '░'.repeat(empty);
  
  return `\`${filledBar}${emptyBar}\``;
}