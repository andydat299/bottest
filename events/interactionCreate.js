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
import { handleWheelBetModal } from '../commands/wheel.js';
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
