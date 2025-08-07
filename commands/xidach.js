import { 
  SlashCommandBuilder, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} from 'discord.js';
import { 
  startBlackjackGame, 
  hitBlackjack, 
  standBlackjack, 
  getCurrentGame, 
  cancelBlackjackGame,
  getBlackjackStats 
} from '../utils/blackjackGame.js';

export default {
  data: new SlashCommandBuilder()
    .setName('xidach')
    .setDescription('🎴 Xem thông tin game xì dách')
    .addSubcommand(subcommand =>
      subcommand.setName('stats')
        .setDescription('Xem thống kê xì dách của bạn')
    )
    .addSubcommand(subcommand =>
      subcommand.setName('rules')
        .setDescription('Xem luật chơi xì dách')
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case 'stats':
        await handleStatsCommand(interaction);
        break;
      case 'rules':
        await handleRulesCommand(interaction);
        break;
    }
  }
};

async function handleStatsCommand(interaction) {
  const stats = await getBlackjackStats(interaction.user.id);
  
  if (!stats) {
    await interaction.reply({
      content: '❌ Bạn chưa chơi game xì dách nào!',
      ephemeral: true
    });
    return;
  }

  const embed = new EmbedBuilder()
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

  await interaction.reply({ embeds: [embed] });
}

async function handleRulesCommand(interaction) {
  const embed = new EmbedBuilder()
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
        value: '• **Blackjack**: 1.5x tiền cược (3:2)\n• **Thắng thường**: 1x tiền cược (1:1)\n• **Hòa**: Hoàn tiền cược\n• **Thua**: Mất tiền cược',
        inline: false
      },
      {
        name: '⚙️ Cấu hình',
        value: '• Cược tối thiểu: **100 xu**\n• Cược tối đa: **50,000 xu**\n• Số bộ bài: **1 bộ** (tự động xáo lại khi hết)',
        inline: false
      }
    )
    .setColor('#ffdd57')
    .setFooter({ text: 'Ấn nút "Chơi Xì Dách" trong bảng game để chơi!' });

  await interaction.reply({ embeds: [embed] });
}

function createGameEmbed(gameStatus, user) {
  const embed = new EmbedBuilder()
    .setTitle('🎴 XÌ DÁCH (BLACKJACK)')
    .setDescription(`**${user.username}** vs **Dealer**`)
    .addFields(
      {
        name: `🙋‍♂️ ${user.username} (${gameStatus.playerValue} điểm)`,
        value: gameStatus.playerHand,
        inline: false
      },
      {
        name: `🤖 Dealer (${gameStatus.dealerValue}${gameStatus.isFinished ? '' : '?'} điểm)`,
        value: gameStatus.dealerHand,
        inline: false
      },
      {
        name: '💰 Tiền cược',
        value: `${gameStatus.betAmount.toLocaleString()} xu`,
        inline: true
      }
    )
    .setColor(gameStatus.isFinished ? '#ff9900' : '#3498db')
    .setTimestamp();

  // Thêm trạng thái game
  if (gameStatus.isFinished) {
    let statusText = '';
    switch (gameStatus.gameState) {
      case 'playerWin':
        statusText = '🎉 Bạn thắng!';
        embed.setColor('#00ff00');
        break;
      case 'dealerWin':
        statusText = '😢 Dealer thắng!';
        embed.setColor('#ff0000');
        break;
      case 'push':
        statusText = '🤝 Hòa!';
        embed.setColor('#ffdd57');
        break;
      case 'playerBust':
        statusText = '💥 Bạn bị bust!';
        embed.setColor('#ff0000');
        break;
      case 'dealerBust':
        statusText = '💥 Dealer bị bust!';
        embed.setColor('#00ff00');
        break;
    }
    embed.addFields({ name: '🏆 Kết quả', value: statusText, inline: true });
  }

  return embed;
}

function createGameButtons(gameStatus) {
  if (gameStatus.isFinished) return [];

  const row = new ActionRowBuilder();

  if (gameStatus.canHit) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId('blackjack_hit')
        .setLabel('🎴 Hit (Rút bài)')
        .setStyle(ButtonStyle.Primary)
    );
  }

  if (gameStatus.canStand) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId('blackjack_stand')
        .setLabel('✋ Stand (Dừng)')
        .setStyle(ButtonStyle.Success)
    );
  }

  row.addComponents(
    new ButtonBuilder()
      .setCustomId('blackjack_cancel')
      .setLabel('❌ Hủy game')
      .setStyle(ButtonStyle.Danger)
  );

  return row;
}

// Export functions để sử dụng trong interaction handlers
export { createGameEmbed, createGameButtons };
