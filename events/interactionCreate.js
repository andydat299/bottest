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
import { Events } from 'discord.js';

export default {
  name: Events.InteractionCreate,
  async execute(interaction) {
    // Handle slash commands
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);

      if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
      }

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error('Command execution error:', error);
        
        const errorMessage = { content: 'There was an error while executing this command!', ephemeral: true };
        
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(errorMessage);
        } else {
          await interaction.reply(errorMessage);
        }
      }
    }
    
    // Handle button interactions from game panel
    else if (interaction.isButton()) {
      try {
        console.log(`Button clicked: ${interaction.customId}`);
        await interaction.reply({
          content: `✅ Button "${interaction.customId}" received! (Game panel features coming soon)`,
          ephemeral: true
        });
      } catch (error) {
        console.error('Button interaction error:', error);
        if (!interaction.replied) {
          await interaction.reply({
            content: '❌ **Có lỗi khi xử lý button!**',
            ephemeral: true
          });
        }
      }
    }
    
    // Handle modal submissions
    else if (interaction.isModalSubmit()) {
      try {
        console.log(`Modal submitted: ${interaction.customId}`);
        await interaction.reply({
          content: `✅ Modal "${interaction.customId}" received! (Processing coming soon)`,
          ephemeral: true
        });
      } catch (error) {
        console.error('Modal submit error:', error);
        if (!interaction.replied) {
          await interaction.reply({
            content: '❌ **Có lỗi khi xử lý form!**',
            ephemeral: true
          });
        }
      }
    }
  }
};
import { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle 
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

        // Xử lý withdraw buttons
        if (interaction.customId === 'open_withdraw_panel') {
          await handleWithdrawPanelButton(interaction);
          return;
        }

        if (interaction.customId === 'withdraw_status_check') {
          await handleWithdrawStatusButton(interaction);
          return;
        }

        if (interaction.customId === 'withdraw_history_view') {
          await handleWithdrawHistoryButton(interaction);
          return;
        }

        if (interaction.customId.startsWith('withdraw_')) {
          await handleWithdrawButtons(interaction);
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
        if (interaction.customId === 'withdraw_modal') {
          await handleWithdrawModalSubmit(interaction);
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

// Thêm functions xử lý withdraw
async function handleWithdrawPanelButton(interaction) {
  const { createWithdrawModal } = await import('../utils/withdrawModal.js');
  const modal = createWithdrawModal();
  await interaction.showModal(modal);
}

async function handleWithdrawStatusButton(interaction) {
  const { WithdrawRequest } = await import('../schemas/withdrawSchema.js');
  
  try {
    const request = await WithdrawRequest.findOne({
      userId: interaction.user.id,
      status: 'pending'
    }).sort({ createdAt: -1 });

    if (!request) {
      return await interaction.reply({
        content: '📝 **Không có yêu cầu đang chờ xử lý**\n\n💡 Bạn không có yêu cầu rút tiền nào đang chờ admin xử lý.',
        ephemeral: true
      });
    }

    const statusEmbed = new EmbedBuilder()
      .setTitle('⏳ Trạng Thái Yêu Cầu Rút Tiền')
      .setDescription('**Yêu cầu của bạn đang được xử lý bởi admin**')
      .addFields(
        { name: '🆔 Mã giao dịch', value: `\`${request._id.toString().slice(-8)}\``, inline: true },
        { name: '💰 Số tiền', value: `${request.vndAmount.toLocaleString()} VNĐ`, inline: true },
        { name: '🏦 Ngân hàng', value: request.bankName.toUpperCase(), inline: true },
        { name: '📅 Thời gian tạo', value: `<t:${Math.floor(request.createdAt.getTime()/1000)}:F>`, inline: false },
        { name: '🔄 Trạng thái', value: '⏳ **Đang chờ admin xử lý**', inline: false },
        { name: '⏰ Thời gian dự kiến', value: '1-24 giờ (ngày thường)', inline: false }
      )
      .setColor('#ffd700')
      .setFooter({ text: 'Bạn sẽ được thông báo khi có kết quả' })
      .setTimestamp();

    await interaction.reply({ embeds: [statusEmbed], ephemeral: true });

  } catch (error) {
    console.error('Error checking withdraw status:', error);
    await interaction.reply({
      content: '❌ Có lỗi khi kiểm tra trạng thái!',
      ephemeral: true
    });
  }
}

async function handleWithdrawHistoryButton(interaction) {
  const { WithdrawRequest } = await import('../schemas/withdrawSchema.js');
  
  try {
    const requests = await WithdrawRequest.find({
      userId: interaction.user.id
    }).sort({ createdAt: -1 }).limit(10);

    if (requests.length === 0) {
      return await interaction.reply({
        content: '📝 **Chưa có lịch sử giao dịch**\n\n💡 Bạn chưa thực hiện giao dịch đổi tiền nào.',
        ephemeral: true
      });
    }

    const historyEmbed = new EmbedBuilder()
      .setTitle('📊 Lịch Sử Đổi Tiền')
      .setDescription('**10 giao dịch gần nhất của bạn**')
      .setColor('#3498db')
      .setTimestamp();

    let description = '';
    for (const req of requests) {
      const statusEmoji = {
        'pending': '⏳',
        'approved': '✅',
        'rejected': '❌'
      }[req.status] || '❓';

      const statusText = {
        'pending': 'Đang chờ',
        'approved': 'Đã duyệt',
        'rejected': 'Bị từ chối'
      }[req.status] || 'Không rõ';

      description += `${statusEmoji} **${req.vndAmount.toLocaleString()} VNĐ** - ${statusText}\n`;
      description += `   📅 <t:${Math.floor(req.createdAt.getTime()/1000)}:d> | 🆔 \`${req._id.toString().slice(-8)}\`\n\n`;
    }

    historyEmbed.setDescription(description);
    await interaction.reply({ embeds: [historyEmbed], ephemeral: true });

  } catch (error) {
    console.error('Error getting withdraw history:', error);
    await interaction.reply({
      content: '❌ Có lỗi khi lấy lịch sử!',
      ephemeral: true
    });
  }
}

async function handleWithdrawModalSubmit(interaction) {
  console.log('🎯 Starting withdraw modal submit...');
  
  const { User } = await import('../schemas/userSchema.js');
  const { WithdrawRequest } = await import('../schemas/withdrawSchema.js');
  
  // Lấy dữ liệu từ modal
  const amount = parseInt(interaction.fields.getTextInputValue('withdraw_amount'));
  const bank = interaction.fields.getTextInputValue('withdraw_bank').trim();
  const account = interaction.fields.getTextInputValue('withdraw_account').trim();
  const name = interaction.fields.getTextInputValue('withdraw_name').trim().toUpperCase();
  const note = interaction.fields.getTextInputValue('withdraw_note')?.trim() || '';

  console.log('📝 Withdraw request data:', { amount, bank, account, name, note });

  try {
    // Validate input
    if (isNaN(amount) || amount < 50000 || amount > 1000000) {
      return await interaction.reply({
        content: '❌ **Số xu không hợp lệ!**\n\n💡 Số xu phải từ 50,000 đến 1,000,000.',
        ephemeral: true
      });
    }

    if (!/^\d{6,20}$/.test(account)) {
      return await interaction.reply({
        content: '❌ **Số tài khoản không hợp lệ!**\n\n💡 Số tài khoản phải từ 6-20 chữ số.',
        ephemeral: true
      });
    }

    // Kiểm tra user
    const user = await User.findOne({ discordId: interaction.user.id });
    if (!user) {
      return await interaction.reply({
        content: '❌ **Không tìm thấy tài khoản!**\n\n💡 Hãy sử dụng bot trước để tạo tài khoản.',
        ephemeral: true
      });
    }

    console.log('👤 User found:', user.discordId, 'Balance:', user.balance);

    // Kiểm tra số dư
    if (user.balance < amount) {
      return await interaction.reply({
        content: `❌ **Số dư không đủ!**\n\n💰 **Số dư hiện tại**: ${user.balance.toLocaleString()} xu\n📤 **Số xu muốn rút**: ${amount.toLocaleString()} xu\n\n🎮 Hãy chơi game để kiếm thêm xu!`,
        ephemeral: true
      });
    }

    // Kiểm tra yêu cầu đang chờ
    const pendingRequest = await WithdrawRequest.findOne({
      userId: interaction.user.id,
      status: 'pending'
    });

    if (pendingRequest) {
      return await interaction.reply({
        content: '⏳ **Bạn đã có yêu cầu đang chờ xử lý!**\n\n💡 Vui lòng đợi admin xử lý xong trước khi tạo yêu cầu mới.\n🔍 Dùng nút "Kiểm tra trạng thái" để xem tiến độ.',
        ephemeral: true
      });
    }

    // Tính toán
    const exchangeRate = 1;
    const fee = Math.floor(amount * 0.05);
    const xuAfterFee = amount - fee;
    const vndAmount = xuAfterFee * exchangeRate;

    console.log('💰 Calculation:', { amount, fee, xuAfterFee, vndAmount });

    // Tạo withdraw request
    const withdrawRequest = new WithdrawRequest({
      userId: interaction.user.id,
      username: interaction.user.username,
      amount: amount,
      fee: fee,
      xuAfterFee: xuAfterFee,
      vndAmount: vndAmount,
      bankName: bank,
      accountNumber: account,
      accountHolder: name,
      adminNote: note,
      status: 'pending',
      createdAt: new Date()
    });

    await withdrawRequest.save();
    console.log('💾 Withdraw request saved:', withdrawRequest._id);

    // Trừ xu từ tài khoản
    user.balance -= amount;
    await user.save();
    console.log('💳 User balance updated:', user.balance);

    // Gửi thông báo đến admin channel
    console.log('📨 Attempting to send admin notification...');
    console.log('🆔 Request created with ID:', withdrawRequest._id);
    
    const { sendWithdrawNotification } = await import('../utils/withdrawNotification.js');
    const notificationSent = await sendWithdrawNotification(interaction, withdrawRequest);
    
    if (notificationSent) {
      console.log('✅ Admin notification sent successfully');
    } else {
      console.error('❌ Admin notification failed - admin can use /check-last-withdraw to retry');
    }

    // Reply thành công
    const successEmbed = new EmbedBuilder()
      .setTitle('✅ Tạo Yêu Cầu Đổi Tiền Thành Công!')
      .setDescription('**Yêu cầu của bạn đã được gửi đến admin để xử lý**')
      .addFields(
        { name: '💰 Số xu rút', value: `${amount.toLocaleString()} xu`, inline: true },
        { name: '💸 Phí giao dịch', value: `${fee.toLocaleString()} xu (5%)`, inline: true },
        { name: '💵 Số tiền nhận', value: `**${vndAmount.toLocaleString()} VNĐ**`, inline: true },
        { name: '🏦 Thông tin nhận tiền', value: `**${bank}**\n${account}\n${name}`, inline: false },
        { name: '🆔 Mã giao dịch', value: `\`${withdrawRequest._id.toString().slice(-8)}\``, inline: true },
        { name: '⏰ Thời gian xử lý', value: '1-24 giờ', inline: true }
      )
      .setColor('#00ff00')
      .setFooter({ text: 'Bạn sẽ được thông báo qua DM khi có kết quả' })
      .setTimestamp();

    await interaction.reply({ embeds: [successEmbed], ephemeral: true });
    console.log('✅ Success response sent to user');

  } catch (error) {
    console.error('❌ Error in withdraw modal submit:', error);
    await interaction.reply({
      content: '❌ **Có lỗi xảy ra!**\n\n💡 Vui lòng thử lại sau hoặc liên hệ admin.',
      ephemeral: true
    });
  }
}

async function sendAdminNotification(interaction, request) {
  console.log('🔔 Starting sendAdminNotification...');
  console.log('🆔 Request ID:', request._id);
  
  const adminChannelId = process.env.ADMIN_CHANNEL_ID;
  const adminRoleId = process.env.ADMIN_ROLE_ID;
  
  console.log('📍 Admin Channel ID from env:', adminChannelId);
  console.log('� Admin Role ID from env:', adminRoleId);
  
  if (!adminChannelId) {
    console.error('❌ ADMIN_CHANNEL_ID not configured in environment variables');
    return;
  }

  const adminChannel = interaction.client.channels.cache.get(adminChannelId);
  console.log('🔍 Admin Channel found:', !!adminChannel);
  
  if (!adminChannel) {
    console.error('❌ Admin channel not found with ID:', adminChannelId);
    console.log('📋 Available channels:', interaction.client.channels.cache.map(c => `${c.name} (${c.id})`).slice(0, 5));
    return;
  }

  console.log('✅ Admin channel details:', {
    name: adminChannel.name,
    type: adminChannel.type,
    guild: adminChannel.guild.name
  });

  try {
    const adminEmbed = new EmbedBuilder()
      .setTitle('🚨 YÊU CẦU ĐỔI TIỀN MỚI')
      .setDescription('**Có người dùng mới tạo yêu cầu đổi tiền!**')
      .addFields(
        { name: '� Người dùng', value: `<@${request.userId}>\n\`${request.username}\` (${request.userId})`, inline: false },
        { name: '� Chi tiết giao dịch', value: `**Xu gốc:** ${request.amount.toLocaleString()} xu\n**Phí:** ${request.fee.toLocaleString()} xu (5%)\n**VNĐ chuyển:** **${request.vndAmount.toLocaleString()} VNĐ**`, inline: false },
        { name: '🏦 Thông tin nhận tiền', value: `**Ngân hàng:** ${request.bankName}\n**Số TK:** \`${request.accountNumber}\`\n**Tên:** ${request.accountHolder}`, inline: false }
      )
      .setColor('#ff6b6b')
      .setThumbnail(interaction.user.displayAvatarURL())
      .setFooter({ text: `ID: ${request._id} • Nhấn nút để xử lý` })
      .setTimestamp();

    if (request.adminNote) {
      adminEmbed.addFields({ name: '📝 Ghi chú từ user', value: request.adminNote, inline: false });
    }

    const buttons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`withdraw_qr_${request._id}`)
          .setLabel('📱 Tạo QR')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`withdraw_approve_${request._id}`)
          .setLabel('✅ Duyệt')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`withdraw_reject_${request._id}`)
          .setLabel('❌ Từ chối')
          .setStyle(ButtonStyle.Danger)
      );

    const mention = adminRoleId ? `<@&${adminRoleId}>` : '@Admin';

    console.log('📤 Sending notification to admin channel...');
    console.log('💬 Mention:', mention);
    
    const sentMessage = await adminChannel.send({ 
      content: `${mention} 🔔 **YÊU CẦU ĐỔI TIỀN MỚI**`,
      embeds: [adminEmbed], 
      components: [buttons] 
    });

    console.log('✅ Admin notification sent successfully!');
    console.log('📨 Message ID:', sentMessage.id);
    console.log('📍 Sent to channel:', adminChannel.name);

  } catch (error) {
    console.error('❌ Error sending admin notification:', error);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    
    // Thử gửi simple message để test
    try {
      console.log('🧪 Attempting to send simple test message...');
      await adminChannel.send('🧪 Test message - Bot can send messages to this channel!');
      console.log('✅ Simple message sent successfully');
    } catch (simpleError) {
      console.error('❌ Even simple message failed:', simpleError.message);
    }
  }
}

async function handleWithdrawButtons(interaction) {
  const [action, operation, requestId] = interaction.customId.split('_');
  
  // Import EmbedBuilder
  const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = await import('discord.js');
  
  // Kiểm tra quyền admin
  const { isAdmin } = await import('../utils/adminUtils.js');
  if (!isAdmin(interaction.user.id)) {
    return await interaction.reply({
      content: '❌ Bạn không có quyền thực hiện hành động này!',
      ephemeral: true
    });
  }

  const { WithdrawRequest } = await import('../schemas/withdrawSchema.js');
  const { User } = await import('../schemas/userSchema.js');
  const { createWithdrawApproveEmbed, createWithdrawRejectEmbed } = await import('../utils/adminUtils.js');

  try {
    const request = await WithdrawRequest.findById(requestId);
    if (!request) {
      return await interaction.reply({
        content: '❌ Không tìm thấy yêu cầu rút tiền!',
        ephemeral: true
      });
    }

    if (request.status !== 'pending') {
      return await interaction.reply({
        content: '❌ Yêu cầu này đã được xử lý rồi!',
        ephemeral: true
      });
    }

    if (operation === 'approve') {
      console.log('👨‍💼 Admin approving withdraw request:', requestId);
      
      // Duyệt yêu cầu
      request.status = 'approved';
      request.adminId = interaction.user.id;
      request.processedAt = new Date();
      await request.save();

      console.log('✅ Request approved and saved');

      // Thông báo cho user qua DM
      try {
        const user = interaction.client.users.cache.get(request.userId);
        console.log('🔍 Looking for user:', request.userId, 'Found:', !!user);
        
        if (user) {
          const successEmbed = createWithdrawApproveEmbed(EmbedBuilder, request);
          await user.send({ embeds: [successEmbed] });
          console.log('📧 ✅ Success DM sent to user:', user.username);
        } else {
          console.log('❌ User not found in cache, trying to fetch...');
          const fetchedUser = await interaction.client.users.fetch(request.userId);
          if (fetchedUser) {
            const successEmbed = createWithdrawApproveEmbed(EmbedBuilder, request);
            await fetchedUser.send({ embeds: [successEmbed] });
            console.log('📧 ✅ Success DM sent to fetched user:', fetchedUser.username);
          } else {
            console.log('❌ Could not fetch user:', request.userId);
          }
        }
      } catch (dmError) {
        console.error('❌ Could not send DM to user:', dmError.message);
        console.error('❌ DM Error details:', dmError);
        
        // Thử gửi thông báo vào channel chính nếu DM fail
        try {
          const mainChannel = interaction.channel;
          await mainChannel.send(`🎉 <@${request.userId}> **Yêu cầu rút tiền của bạn đã được duyệt!**\n💰 **${request.vndAmount.toLocaleString()} VNĐ** đã được chuyển vào tài khoản **${request.bankName.toUpperCase()}** của bạn.\n🆔 Mã GD: \`${request._id.toString().slice(-8)}\``);
          console.log('📢 Sent fallback notification to channel');
        } catch (channelError) {
          console.error('❌ Could not send channel notification:', channelError.message);
        }
      }

      // Update original message
      const originalEmbed = interaction.message.embeds[0];
      const updatedEmbed = EmbedBuilder.from(originalEmbed)
        .setTitle('✅ YÊU CẦU ĐÃ ĐƯỢC DUYỆT')
        .setColor('#00ff00')
        .addFields({ name: '👨‍💼 Xử lý bởi', value: `<@${interaction.user.id}>`, inline: true });

      await interaction.update({ 
        embeds: [updatedEmbed], 
        components: [] 
      });

      console.log('🔄 Admin notification message updated');

    } else if (operation === 'qr') {
      try {
        console.log('📱 Admin generating QR for request:', requestId);
        
        // Tạo QR code cho chuyển khoản
        const { createQREmbed } = await import('../utils/bankQR.js');
        console.log('✅ bankQR module imported');
        
        const qrData = createQREmbed(EmbedBuilder, request);
        console.log('✅ QR data generated:', typeof qrData);
        
        // Tạo Web Banking button (Discord compatible)
        const quickTransferButton = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setLabel('🌐 Web Banking')
              .setStyle(ButtonStyle.Link)
              .setURL(qrData.bankingLink)
              .setEmoji('💳'),
            new ButtonBuilder()
              .setLabel('🔄 Refresh QR')
              .setStyle(ButtonStyle.Secondary)
              .setCustomId(`withdraw_qr_${request._id}`)
              .setEmoji('🔄')
          );
        
        console.log('✅ Quick Transfer button created');
        
        await interaction.reply({ 
          embeds: [qrData.embed],
          components: [quickTransferButton],
          ephemeral: true 
        });
        
        console.log('✅ QR response sent to admin');
        
      } catch (qrError) {
        console.error('❌ Error generating QR:', qrError);
        console.error('❌ QR Error name:', qrError.name);
        console.error('❌ QR Error message:', qrError.message);
        
        // Fallback: Gửi thông tin text đơn giản
        const fallbackEmbed = new EmbedBuilder()
          .setTitle('❌ QR Generation Failed')
          .setDescription('**Lỗi khi tạo QR, đây là thông tin chuyển khoản:**')
          .addFields(
            { name: '🏦 Ngân hàng', value: request.bankName.toUpperCase(), inline: true },
            { name: '🔢 Số tài khoản', value: `\`${request.accountNumber}\``, inline: true },
            { name: '👤 Tên người nhận', value: request.accountHolder, inline: true },
            { name: '💰 Số tiền', value: `**${request.vndAmount.toLocaleString()} VNĐ**`, inline: true },
            { name: '📝 Nội dung CK', value: `\`Rut xu game - ID:${request._id.toString().slice(-8)}\``, inline: true },
            { name: '🔧 Lỗi', value: `\`${qrError.message}\``, inline: false }
          )
          .setColor('#ff9900')
          .setTimestamp();

        await interaction.reply({ 
          embeds: [fallbackEmbed], 
          ephemeral: true 
        });
      }

    } else if (operation === 'reject') {
      console.log('❌ Admin rejecting withdraw request:', requestId);
      
      // Từ chối yêu cầu
      request.status = 'rejected';
      request.adminId = interaction.user.id;
      request.processedAt = new Date();
      await request.save();

      console.log('❌ Request rejected and saved');

      // Hoàn xu cho user
      const user = await User.findOne({ discordId: request.userId });
      if (user) {
        user.balance += request.amount; // Hoàn lại toàn bộ xu
        await user.save();
        console.log('💰 Refunded xu to user:', request.amount, 'New balance:', user.balance);
      }

      // Thông báo cho user qua DM
      try {
        const userObj = interaction.client.users.cache.get(request.userId);
        console.log('🔍 Looking for user to reject notify:', request.userId, 'Found:', !!userObj);
        
        if (userObj) {
          const rejectEmbed = createWithdrawRejectEmbed(EmbedBuilder, request);
          await userObj.send({ embeds: [rejectEmbed] });
          console.log('📧 ❌ Rejection DM sent to user:', userObj.username);
        } else {
          console.log('❌ User not found in cache, trying to fetch...');
          const fetchedUser = await interaction.client.users.fetch(request.userId);
          if (fetchedUser) {
            const rejectEmbed = createWithdrawRejectEmbed(EmbedBuilder, request);
            await fetchedUser.send({ embeds: [rejectEmbed] });
            console.log('📧 ❌ Rejection DM sent to fetched user:', fetchedUser.username);
          } else {
            console.log('❌ Could not fetch user:', request.userId);
          }
        }
      } catch (dmError) {
        console.error('❌ Could not send rejection DM to user:', dmError.message);
        console.error('❌ Rejection DM Error details:', dmError);
        
        // Thử gửi thông báo vào channel chính nếu DM fail
        try {
          const mainChannel = interaction.channel;
          await mainChannel.send(`❌ <@${request.userId}> **Yêu cầu rút tiền của bạn đã bị từ chối.**\n💰 **${request.amount.toLocaleString()} xu** đã được hoàn lại vào tài khoản.\n🆔 Mã GD: \`${request._id.toString().slice(-8)}\`\n💡 Liên hệ admin để biết thêm chi tiết.`);
          console.log('📢 Sent fallback rejection notification to channel');
        } catch (channelError) {
          console.error('❌ Could not send channel rejection notification:', channelError.message);
        }
      }

      // Update original message
      const originalEmbed = interaction.message.embeds[0];
      const updatedEmbed = EmbedBuilder.from(originalEmbed)
        .setTitle('❌ YÊU CẦU ĐÃ BỊ TỪ CHỐI')
        .setColor('#ff0000')
        .addFields({ name: '👨‍💼 Xử lý bởi', value: `<@${interaction.user.id}>`, inline: true });

      await interaction.update({ 
        embeds: [updatedEmbed], 
        components: [] 
      });

      console.log('🔄 Admin notification message updated');

    } else if (operation === 'info') {
      // Hiển thị thông tin chi tiết
      const detailEmbed = new EmbedBuilder()
        .setTitle('ℹ️ Chi Tiết Yêu Cầu Rút Tiền')
        .addFields(
          { name: '🆔 Request ID', value: `\`${request._id}\``, inline: false },
          { name: '👤 User ID', value: `\`${request.userId}\``, inline: true },
          { name: '💰 Xu gốc', value: `${request.amount.toLocaleString()} xu`, inline: true },
          { name: '💸 Phí', value: `${request.fee.toLocaleString()} xu`, inline: true },
          { name: '💵 VNĐ nhận', value: `${request.vndAmount.toLocaleString()} VNĐ`, inline: true },
          { name: '🏦 Ngân hàng', value: request.bankName.toUpperCase(), inline: true },
          { name: '🔢 Số TK', value: `\`${request.accountNumber}\``, inline: true },
          { name: '👤 Tên chủ TK', value: request.accountHolder, inline: false },
          { name: '📅 Tạo lúc', value: `<t:${Math.floor(request.createdAt.getTime()/1000)}:F>`, inline: true }
        )
        .setColor('#3498db')
        .setTimestamp();

      if (request.adminNote) {
        detailEmbed.addFields({ name: '📝 Ghi chú', value: request.adminNote, inline: false });
      }

      await interaction.reply({ embeds: [detailEmbed], ephemeral: true });
    }

  } catch (error) {
    console.error('❌ Error handling withdraw button:', error);
    console.error('❌ Error details:', error.message);
    console.error('❌ Error stack:', error.stack);
    
    await interaction.reply({
      content: `❌ **Có lỗi xảy ra khi xử lý yêu cầu!**\n\`\`\`${error.message}\`\`\``,
      ephemeral: true
    });
  }
}
