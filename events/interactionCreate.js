import { claimQuestReward } from '../utils/questManager.js';
import { User } from '../schemas/userSchema.js';
import { handleResetButton } from '../commands/resetuser.js';
import { 
  startBlackjackGame, 
  hitBlackjack, 
  standBlackjack, 
  cancelBlackjackGame,
  getBlackjackStats
} from '../utils/blackjackGame.js';
import { createGameEmbed, createGameButtons } from '../commands/xidach.js';
import { handleEvalButtons } from '../commands/evalvm.js';
import { handleWheelBetModal, handleWheelGameButtons } from '../commands/wheel.js';
import { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';

export default {
  name: 'interactionCreate',
  async execute(interaction) {
    // Xử lý slash commands
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction);
      } catch (err) {
        console.error(err);
        await interaction.reply({ content: '❌ Lỗi khi thực thi lệnh.' });
      }
      return;
    }

    // Xử lý button interactions
    if (interaction.isButton()) {
      try {
        // Xử lý các nút help để gợi ý lệnh slash
        if (interaction.customId.startsWith('help_')) {
          const commandName = interaction.customId.replace('help_', '');
          
          const commandMap = {
            'fish': { cmd: '</fish:0>', desc: 'Bắt đầu câu cá và thử vận may!' },
            'inventory': { cmd: '</inventory:0>', desc: 'Xem kho cá hiện tại của bạn' },
            'sell': { cmd: '</sell:0>', desc: 'Bán toàn bộ cá để lấy xu' },
            'cooldown': { cmd: '</cooldown:0>', desc: 'Kiểm tra thời gian chờ câu cá' },
            'profile': { cmd: '</profile:0>', desc: 'Xem hồ sơ và thông tin cá nhân' },
            'upgrade': { cmd: '</upgrade:0>', desc: 'Nâng cấp cần câu để câu cá hiếm hơn' },
            'list': { cmd: '</list:0>', desc: 'Xem danh sách tất cả loại cá và thống kê' },
            'stats': { cmd: '</stats:0>', desc: 'Xem thống kê chi tiết cộng đồng' },
            'rates': { cmd: '</rates:0>', desc: 'Xem tỷ lệ câu cá theo rod level' },
            'reset': { cmd: '</reset:0>', desc: 'Reset toàn bộ dữ liệu của bạn' },
            'refresh': { cmd: '</help:0>', desc: 'Xem lại hướng dẫn này' }
          };

          const command = commandMap[commandName];
          if (command) {
            await interaction.reply({
              content: `🎯 **${command.cmd}**\n📖 ${command.desc}\n\n� **Cách sử dụng:** Nhấn vào lệnh màu xanh ở trên hoặc gõ \`/${commandName}\` trong chat!`,
              ephemeral: true
            });
          } else {
            await interaction.reply({
              content: '❌ Không tìm thấy lệnh tương ứng.',
              ephemeral: true
            });
          }
          return;
        }

        // Xử lý claim quest rewards
        if (interaction.customId.startsWith('claim_quest_')) {
          await interaction.deferReply({ ephemeral: true });
          
          const questId = interaction.customId.replace('claim_quest_', '');
          const reward = await claimQuestReward(interaction.user.id, questId);
          
          if (reward > 0) {
            // Cập nhật balance user
            const user = await User.findOne({ discordId: interaction.user.id });
            if (user) {
              user.balance += reward;
              await user.save();
            }
            
            await interaction.editReply({
              content: `🎉 **Chúc mừng!** Bạn đã nhận được **${reward} xu** từ nhiệm vụ!\n💰 Số dư hiện tại: **${user.balance.toLocaleString()} xu**`
            });
          } else {
            await interaction.editReply({
              content: '❌ Không thể nhận thưởng. Quest chưa hoàn thành hoặc đã được nhận rồi.'
            });
          }
          return;
        }

        // Xử lý reset user buttons
        if (interaction.customId.startsWith('reset_')) {
          const handled = await handleResetButton(interaction);
          if (handled) return;
        }

        // Xử lý eval VM buttons
        if (interaction.customId.startsWith('eval_')) {
          const handled = await handleEvalButtons(interaction);
          if (handled) return;
        }

        // Xử lý wheel game buttons
        if (interaction.customId.startsWith('wheel_')) {
          const handled = await handleWheelGameButtons(interaction);
          if (handled) return;
        }

        // Xử lý bot info buttons
        if (interaction.customId.startsWith('bot_')) {
          await handleBotInfoButtons(interaction);
          return;
        }

        // Xử lý blackjack buttons
        if (interaction.customId.startsWith('blackjack_')) {
          await handleBlackjackButtons(interaction);
          return;
        }

        // Xử lý game board buttons
        if (interaction.customId.startsWith('start_') || 
            interaction.customId === 'blackjack_rules' || 
            interaction.customId === 'game_stats') {
          await handleGameBoardButtons(interaction);
          return;
        }

        // Xử lý quest buttons
        if (interaction.customId.startsWith('quest_')) {
          await handleQuestButtons(interaction);
          return;
        }

        // Xử lý các button khác (fish, reset, etc.)
        // Reset buttons đã được xử lý trong reset command collector
        // Fish buttons đã được xử lý trong fish command collector
        
        // Để cho các command khác xử lý
      } catch (err) {
        console.error('Button interaction error:', err);
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ 
            content: '❌ Có lỗi xảy ra với nút bấm.',
            ephemeral: true 
          });
        }
      }
    }

    // Xử lý modal submissions
    if (interaction.isModalSubmit()) {
      try {
        if (interaction.customId === 'blackjack_bet_modal') {
          await handleBlackjackBetModal(interaction);
          return;
        }
        if (interaction.customId === 'wheel_bet_modal') {
          await handleWheelBetModal(interaction);
          return;
        }
      } catch (err) {
        console.error('Modal submission error:', err);
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ 
            content: '❌ Có lỗi xảy ra với modal.',
            ephemeral: true 
          });
        }
      }
    }
  }
};

// Xử lý modal nhập số xu cược
async function handleBlackjackBetModal(interaction) {
  const betAmountStr = interaction.fields.getTextInputValue('bet_amount');
  const betAmount = parseInt(betAmountStr);

  if (isNaN(betAmount) || betAmount <= 0) {
    await interaction.reply({
      content: '❌ Số xu cược không hợp lệ! Vui lòng nhập số nguyên dương.',
      ephemeral: true
    });
    return;
  }

  const result = await startBlackjackGame(interaction.user.id, betAmount);

  if (!result.success) {
    await interaction.reply({
      content: result.message,
      ephemeral: true
    });
    return;
  }

  const embed = createGameEmbed(result.game, interaction.user);
  const buttons = createGameButtons(result.game);

  await interaction.reply({
    content: result.message,
    embeds: [embed],
    components: buttons ? [buttons] : [],
    ephemeral: true
  });
}

// Xử lý buttons trong game blackjack
async function handleBlackjackButtons(interaction) {
  const action = interaction.customId.replace('blackjack_', '');

  switch (action) {
    case 'hit':
      const hitResult = hitBlackjack(interaction.user.id);
      if (!hitResult.success) {
        await interaction.reply({
          content: hitResult.message,
          ephemeral: true
        });
        return;
      }

      const hitEmbed = createGameEmbed(hitResult.game, interaction.user);
      const hitButtons = createGameButtons(hitResult.game);

      await interaction.update({
        embeds: [hitEmbed],
        components: hitButtons ? [hitButtons] : []
      });
      break;

    case 'stand':
      const standResult = await standBlackjack(interaction.user.id);
      if (!standResult.success) {
        await interaction.reply({
          content: standResult.message,
          ephemeral: true
        });
        return;
      }

      const standEmbed = createGameEmbed(standResult.game, interaction.user);
      
      // Thêm kết quả cuối game
      if (standResult.result) {
        standEmbed.addFields({
          name: '💰 Kết quả cược',
          value: `${standResult.result.resultMessage}\n**${standResult.result.winAmount >= 0 ? '+' : ''}${standResult.result.winAmount.toLocaleString()} xu**`,
          inline: false
        });
      }

      await interaction.update({
        embeds: [standEmbed],
        components: [] // Xóa buttons khi game kết thúc
      });
      break;

    case 'cancel':
      const cancelResult = await cancelBlackjackGame(interaction.user.id);
      
      const cancelEmbed = new EmbedBuilder()
        .setTitle('❌ Game đã hủy')
        .setDescription(cancelResult.message)
        .setColor('#ff0000')
        .setTimestamp();

      await interaction.update({
        embeds: [cancelEmbed],
        components: []
      });
      break;
  }
}

// Xử lý buttons từ game board
async function handleGameBoardButtons(interaction) {
  switch (interaction.customId) {
    case 'start_blackjack':
      // Hiển thị modal để nhập số xu cược
      const modal = new ModalBuilder()
        .setCustomId('blackjack_bet_modal')
        .setTitle('🎴 Nhập số xu cược');

      const betInput = new TextInputBuilder()
        .setCustomId('bet_amount')
        .setLabel('Số Xu Cược')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Nhập 1-1000 xu')
        .setRequired(true)
        .setMinLength(1)
        .setMaxLength(4);

      const actionRow = new ActionRowBuilder().addComponents(betInput);
      modal.addComponents(actionRow);

      await interaction.showModal(modal);
      break;

    case 'blackjack_rules':
      const rulesEmbed = new EmbedBuilder()
        .setTitle('🎴 LUẬT CHƠI XÌ DÁCH')
        .setDescription('**Mục tiêu:** Đạt tổng điểm gần 21 nhất mà không vượt quá 21')
        .addFields(
          {
            name: '🃏 Giá trị bài',
            value: '• **A**: 1 hoặc 11 điểm (tự động chọn tốt nhất)\n• **2-10**: Theo số trên bài\n• **J, Q, K**: 10 điểm',
            inline: false
          },
          {
            name: '🎯 Cách chơi',
            value: '• **Hit**: Rút thêm bài\n• **Stand**: Dừng lại\n• **Blackjack**: A + 10/J/Q/K (21 điểm với 2 bài)\n• **Bust**: Vượt quá 21 điểm (thua ngay)',
            inline: false
          },
          {
            name: '🤖 Luật Dealer',
            value: '• Phải rút bài nếu < 17 điểm\n• Phải dừng nếu ≥ 17 điểm\n• Lá thứ 2 bị úp',
            inline: false
          },
          {
            name: '💰 Tỷ lệ thưởng',
            value: '• **Blackjack**: 1.8x tiền cược\n• **Thắng thường**: 1.8x tiền cược\n• **Hòa**: Hoàn tiền cược\n• **Thua**: Mất tiền cược',
            inline: false
          },
          {
            name: '⚙️ Cấu hình',
            value: '• Cược tối thiểu: **1 xu**\n• Cược tối đa: **1,000 xu**\n• Tỷ lệ thắng: **30%** (khó thắng)\n• Số bộ bài: **1 bộ** (tự động xáo lại)',
            inline: false
          }
        )
        .setColor('#ffdd57')
        .setFooter({ text: 'Ấn nút "Chơi Xì Dách" để bắt đầu!' });

      await interaction.reply({ embeds: [rulesEmbed], ephemeral: true });
      break;

    case 'game_stats':
      const stats = await getBlackjackStats(interaction.user.id);
      
      if (!stats) {
        await interaction.reply({
          content: '❌ Bạn chưa chơi game xì dách nào!',
          ephemeral: true
        });
        return;
      }

      const statsEmbed = new EmbedBuilder()
        .setTitle('🎴 Thống kê Xì Dách')
        .setDescription(`**${interaction.user.username}**`)
        .addFields(
          { name: '🎮 Số game đã chơi', value: `${stats.gamesPlayed.toLocaleString()} game`, inline: true },
          { name: '💰 Tổng thắng/thua', value: `${stats.totalWinnings.toLocaleString()} xu`, inline: true },
          { name: '📊 Tỷ lệ thắng', value: `${stats.winRate}%`, inline: true }
        )
        .setColor(stats.totalWinnings >= 0 ? '#00ff00' : '#ff0000')
        .setThumbnail(interaction.user.displayAvatarURL())
        .setTimestamp();

      await interaction.reply({ embeds: [statsEmbed], ephemeral: true });
      break;
  }
}

// Function xử lý bot info buttons
async function handleBotInfoButtons(interaction) {
  const action = interaction.customId.replace('bot_', '');
  
  switch (action) {
    case 'help':
      await showCommandsHelp(interaction);
      break;
    case 'stats':
      await showServerStats(interaction);
      break;
    case 'games':
      await showGamesInfo(interaction);
      break;
  }
}

async function showCommandsHelp(interaction) {
  const embed = new EmbedBuilder()
    .setTitle('📋 Danh sách Commands')
    .setDescription('**Tất cả lệnh có sẵn trong bot:**')
    .addFields(
      {
        name: '🎣 Fishing Commands',
        value: 
          '`/fish` - Câu cá để kiếm xu\n' +
          '`/inventory` - Xem túi đồ\n' +
          '`/upgrade` - Nâng cấp cần câu\n' +
          '`/repair` - Sửa chữa cần câu\n' +
          '`/rates` - Xem tỷ lệ câu cá',
        inline: true
      },
      {
        name: '🎮 Casino & Games',
        value: 
          '`/wheel post` - Game vòng quay (Admin)\n' +
          '`/wheel play` - Chơi vòng quay\n' +
          '`/xidach` - Blackjack game\n' +
          '`/wheel stats` - Thống kê games',
        inline: true
      },
      {
        name: '👤 User Commands',
        value: 
          '`/profile` - Xem hồ sơ cá nhân\n' +
          '`/stats` - Thống kê fishing\n' +
          '`/quests` - Xem nhiệm vụ\n' +
          '`/cooldown` - Kiểm tra thời gian chờ',
        inline: true
      },
      {
        name: '📊 Info Commands',
        value: 
          '`/help` - Hướng dẫn chi tiết\n' +
          '`/list` - Danh sách tất cả cá\n' +
          '`/leaderboard` - Bảng xếp hạng\n' +
          '`/fishstats` - Thống kê cộng đồng',
        inline: true
      },
      {
        name: '💡 Tips',
        value: 
          '• Chat để nhận xu thưởng\n' +
          '• Hoàn thành quests để kiếm thêm\n' +
          '• Nâng cấp cần để câu cá hiếm\n' +
          '• Chơi minigames để thử vận may',
        inline: false
      }
    )
    .setColor('#3498db')
    .setFooter({ text: 'Sử dụng /help [command] để xem chi tiết từng lệnh' });

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function showServerStats(interaction) {
  const guild = interaction.guild;
  const client = interaction.client;
  
  // Đếm users trong database (cần import User schema)
  let totalUsers = 0;
  try {
    totalUsers = await User.countDocuments();
  } catch (error) {
    console.log('Không thể đếm users trong DB');
  }

  const embed = new EmbedBuilder()
    .setTitle(`📊 Thống kê Server: ${guild.name}`)
    .setThumbnail(guild.iconURL({ dynamic: true }))
    .addFields(
      {
        name: '👥 Thành viên',
        value: 
          `**Total:** ${guild.memberCount.toLocaleString()}\n` +
          `**Online:** ${guild.members.cache.filter(m => m.presence?.status !== 'offline').size}\n` +
          `**Bots:** ${guild.members.cache.filter(m => m.user.bot).size}`,
        inline: true
      },
      {
        name: '📺 Channels',
        value: 
          `**Text:** ${guild.channels.cache.filter(c => c.type === 0).size}\n` +
          `**Voice:** ${guild.channels.cache.filter(c => c.type === 2).size}\n` +
          `**Categories:** ${guild.channels.cache.filter(c => c.type === 4).size}`,
        inline: true
      },
      {
        name: '🎮 Bot Stats',
        value: 
          `**Servers:** ${client.guilds.cache.size}\n` +
          `**Users:** ${client.users.cache.size.toLocaleString()}\n` +
          `**DB Users:** ${totalUsers.toLocaleString()}`,
        inline: true
      },
      {
        name: '📅 Server Info',
        value: 
          `**Created:** <t:${Math.floor(guild.createdTimestamp / 1000)}:R>\n` +
          `**Owner:** <@${guild.ownerId}>\n` +
          `**Boost Level:** ${guild.premiumTier}`,
        inline: true
      },
      {
        name: '⚡ Performance',
        value: 
          `**Uptime:** ${formatUptime(client.uptime)}\n` +
          `**Ping:** ${client.ws.ping}ms\n` +
          `**Memory:** ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB`,
        inline: true
      }
    )
    .setColor('#e74c3c')
    .setFooter({ 
      text: `Stats được cập nhật lúc`,
      iconURL: client.user.displayAvatarURL() 
    })
    .setTimestamp();

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function showGamesInfo(interaction) {
  const embed = new EmbedBuilder()
    .setTitle('🎮 Games & Minigames')
    .setDescription('**Khám phá các trò chơi thú vị trong bot!**')
    .addFields(
      {
        name: '🎣 Fishing System',
        value: 
          '• Câu cá để kiếm xu và sưu tập\n' +
          '• 20+ loại cá với độ hiếm khác nhau\n' +
          '• Nâng cấp cần câu để tăng tỷ lệ\n' +
          '• Hệ thống nhiệm vụ đa dạng',
        inline: false
      },
      {
        name: '🎴 Blackjack (Xì Dách)',
        value: 
          '• Casino game kinh điển\n' +
          '• Cược 1-1000 xu, thắng x1.8\n' +
          '• AI dealer thông minh\n' +
          '• Thống kê chi tiết',
        inline: true
      },
      {
        name: '🎡 Wheel of Fortune',
        value: 
          '• Vòng quay may mắn 7 ôn' +
          '• Jackpot x10 cực hiếm\n' +
          '• Admin post game board\n' +
          '• House edge cân bằng',
        inline: true
      },
      {
        name: '💬 Chat Rewards',
        value: 
          '• Nhận xu khi chat tích cực\n' +
          '• Bonus streak cho hoạt động liên tục\n' +
          '• Anti-spam protection\n' +
          '• Daily bonus multiplier',
        inline: false
      },
      {
        name: '🎯 Cách bắt đầu',
        value: 
          '**Fishing:** `/fish` để câu cá đầu tiên\n' +
          '**Blackjack:** `/xidach rules` xem luật chơi\n' +
          '**Wheel:** Đợi admin post game board\n' +
          '**Profile:** `/profile` xem tiến độ',
        inline: false
      }
    )
    .setColor('#f39c12')
    .setFooter({ text: 'Chơi có trách nhiệm và tận hưởng!' });

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

// Xử lý quest buttons
async function handleQuestButtons(interaction) {
  try {
    const { getUserQuests, generateDailyQuests, claimAllQuests } = await import('../utils/enhancedQuestManager.js');

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

      // Refresh the quest display
      setTimeout(async () => {
        try {
          const updatedQuests = await getUserQuests(interaction.user.id);
          
          const embed = new EmbedBuilder()
            .setTitle('🎯 NHIỆM VỤ CỦA BẠN')
            .setColor('#4CAF50')
            .setThumbnail(interaction.user.displayAvatarURL())
            .setTimestamp();

          let questList = '';
          let claimableQuests = [];
          let totalRewardToday = 0;
          
          const today = new Date().toDateString();
          const todayQuests = updatedQuests.filter(q => new Date(q.createdAt).toDateString() === today);
          
          updatedQuests.forEach((quest) => {
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
          embed.setFooter({ text: `📊 Quest hôm nay: ${todayQuests.length}/3 • Thưởng: ${totalRewardToday}/1000 xu` });

          const buttons = new ActionRowBuilder();
          
          buttons.addComponents(
            new ButtonBuilder()
              .setCustomId('quest_refresh')
              .setLabel('🔄 Làm mới')
              .setStyle(ButtonStyle.Secondary)
          );

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
        } catch (error) {
          console.error('Error refreshing quest display:', error);
        }
      }, 1000);

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
          const buttons = new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('quest_refresh')
                .setLabel('🔄 Làm mới để xem quest mới')
                .setStyle(ButtonStyle.Success)
            );

          await interaction.editReply({ 
            components: [buttons] 
          });
        }, 1000);

      } catch (error) {
        await interaction.followUp({
          content: `❌ **Lỗi tạo quest:**\n\`${error.message}\`",
          ephemeral: true
        });
      }
    }

  } catch (error) {
    console.error('Error handling quest button:', error);
    await interaction.reply({
      content: '❌ Có lỗi xảy ra khi xử lý nút bấm!',
      ephemeral: true
    });
  }
}

function createProgressBar(current, target, length = 15) {
  const progress = Math.min(current / target, 1);
  const filled = Math.round(progress * length);
  const empty = length - filled;
  
  const filledBar = '█'.repeat(filled);
  const emptyBar = '░'.repeat(empty);
  
  return `\`${filledBar}${emptyBar}\``;
}

// Helper function để format uptime (duplicate, có thể move ra utils)
function formatUptime(ms) {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m ${seconds}s`;
  }
}
