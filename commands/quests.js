import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getUserQuests, claimQuestReward } from '../utils/questManager.js';
import { User } from '../schemas/userSchema.js';

export default {
  data: new SlashCommandBuilder()
    .setName('quests')
    .setDescription('Xem nhiệm vụ hàng ngày và nhận thưởng 📋'),

  async execute(interaction) {
    try {
      // Defer reply để có thêm thời gian xử lý
      await interaction.deferReply();

      const userQuests = await getUserQuests(interaction.user.id);
      const quests = userQuests.dailyQuests.quests;

    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('📋 Nhiệm vụ hàng ngày')
      .setDescription(`**${new Date().toLocaleDateString('vi-VN')}** - Hoàn thành nhiệm vụ để nhận thưởng!`)
      .setTimestamp()
      .setFooter({ 
        text: `${interaction.user.username} - Tổng quest hoàn thành: ${userQuests.totalQuestsCompleted}`, 
        iconURL: interaction.user.displayAvatarURL() 
      });

    // Hiển thị từng quest
    quests.forEach((quest, index) => {
      const progress = `${quest.current}/${quest.target}`;
      const progressBar = createProgressBar(quest.current, quest.target, 10);
      const status = quest.completed ? '✅ Hoàn thành' : '🔄 Đang làm';
      const rewardText = quest.completed ? `🎁 **${quest.reward} xu**` : `🎁 ${quest.reward} xu`;

      embed.addFields({
        name: `${index + 1}. ${quest.description}`,
        value: `${status}\n${progressBar} ${progress}\n${rewardText}`,
        inline: false
      });
    });

    // Tạo buttons cho claim rewards
    const completedQuests = quests.filter(q => q.completed && !q.claimed);
    const rows = [];

    if (completedQuests.length > 0) {
      const buttons = completedQuests.map((quest, index) => 
        new ButtonBuilder()
          .setCustomId(`claim_quest_${quest.id}`)
          .setLabel(`Nhận thưởng Quest ${quests.indexOf(quest) + 1}`)
          .setStyle(ButtonStyle.Success)
          .setEmoji('🎁')
      );

      // Tạo action rows (Discord giới hạn 5 buttons per row)
      for (let i = 0; i < buttons.length; i += 5) {
        const row = new ActionRowBuilder().addComponents(buttons.slice(i, i + 5));
        rows.push(row);
      }

      embed.addFields({
        name: '🎉 Nhiệm vụ hoàn thành!',
        value: `Bạn có **${completedQuests.length}** nhiệm vụ đã hoàn thành. Nhấn nút để nhận thưởng!`,
        inline: false
      });
    }

    // Thống kê tổng quan
    const completedCount = quests.filter(q => q.completed).length;
    const totalReward = quests.filter(q => q.completed).reduce((sum, q) => sum + q.reward, 0);

    embed.addFields({
      name: '📊 Tổng quan hôm nay',
      value: `• Hoàn thành: **${completedCount}/3** nhiệm vụ\n• Tổng thưởng: **${totalReward} xu**\n• Quest reset vào **00:00 ngày mai**`,
      inline: false
    });

    const response = { embeds: [embed] };
    if (rows.length > 0) {
      response.components = rows;
    }

    await interaction.editReply(response);
    
    } catch (error) {
      console.error('❌ Error in quests command:', error);
      const errorMessage = '❌ Có lỗi xảy ra khi lấy thông tin quest. Vui lòng thử lại!';
      
      if (interaction.deferred) {
        await interaction.editReply({ content: errorMessage });
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    }
  }
};

// Tạo progress bar
function createProgressBar(current, target, length = 10) {
  const percentage = Math.min(current / target, 1);
  const filled = Math.round(length * percentage);
  const empty = length - filled;
  
  return '█'.repeat(filled) + '▒'.repeat(empty);
}
