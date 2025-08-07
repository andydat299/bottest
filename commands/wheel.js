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
import { User } from '../schemas/userSchema.js';
import { logMoneyReceived, logMoneyDeducted } from '../utils/logger.js';
import { isAdmin } from '../utils/adminUtils.js';

// Cấu hình vòng quay
const WHEEL_CONFIG = {
  minBet: 10,
  maxBet: 1000,
  sectors: [
    { emoji: '💀', name: 'Phá sản', multiplier: 0, chance: 25, color: '#000000' },
    { emoji: '😢', name: 'Mất nửa', multiplier: 0.5, chance: 28, color: '#ff4444' },
    { emoji: '😐', name: 'Hòa vốn', multiplier: 1, chance: 25, color: '#888888' },
    { emoji: '😊', name: 'Thắng ít', multiplier: 1.5, chance: 15, color: '#44ff44' },
    { emoji: '🤑', name: 'Thắng lớn', multiplier: 2.5, chance: 5, color: '#ffff44' },
    { emoji: '💎', name: 'Siêu thắng', multiplier: 5, chance: 1.8, color: '#44ffff' },
    { emoji: '🎰', name: 'JACKPOT!', multiplier: 10, chance: 0.2, color: '#ff44ff' }
  ]
};

// Lưu trữ game đang chơi
const activeGames = new Map();

export default {
  data: new SlashCommandBuilder()
    .setName('wheel')
    .setDescription('🎡 Vòng quay may mắn - Thử vận may của bạn!')
    .addSubcommand(subcommand =>
      subcommand.setName('post')
        .setDescription('[ADMIN] Đăng bảng game vòng quay may mắn')
    )
    .addSubcommand(subcommand =>
      subcommand.setName('play')
        .setDescription('Chơi vòng quay may mắn')
        .addIntegerOption(option =>
          option.setName('bet')
            .setDescription(`Số xu cược (${WHEEL_CONFIG.minBet}-${WHEEL_CONFIG.maxBet})`)
            .setRequired(false)
            .setMinValue(WHEEL_CONFIG.minBet)
            .setMaxValue(WHEEL_CONFIG.maxBet)
        )
    )
    .addSubcommand(subcommand =>
      subcommand.setName('info')
        .setDescription('Xem thông tin và tỷ lệ của vòng quay')
    )
    .addSubcommand(subcommand =>
      subcommand.setName('stats')
        .setDescription('Xem thống kê vòng quay của bạn')
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case 'post':
        await handlePostCommand(interaction);
        break;
      case 'play':
        await handlePlayCommand(interaction);
        break;
      case 'info':
        await handleInfoCommand(interaction);
        break;
      case 'stats':
        await handleStatsCommand(interaction);
        break;
    }
  }
};

async function handlePostCommand(interaction) {
  // Kiểm tra quyền admin
  if (!isAdmin(interaction.user.id)) {
    return interaction.reply({
      content: '❌ Chỉ admin mới có thể đăng bảng game!',
      ephemeral: true
    });
  }

  // Tạo embed game board
  const gameEmbed = createWheelGameBoard();
  const gameButtons = createWheelGameButtons();

  await interaction.reply({ 
    embeds: [gameEmbed], 
    components: [gameButtons] 
  });
}

async function handlePlayCommand(interaction) {
  // Kiểm tra user có game đang chơi không
  if (activeGames.has(interaction.user.id)) {
    return interaction.reply({
      content: '🎡 Bạn đang có vòng quay chưa hoàn thành! Hãy hoàn thành game hiện tại trước.',
      ephemeral: true
    });
  }

  const betAmount = interaction.options.getInteger('bet');
  
  if (betAmount) {
    // Chơi trực tiếp với số xu đã nhập
    await startWheelGame(interaction, betAmount);
  } else {
    // Hiển thị buttons để chọn số xu
    await showBetButtons(interaction);
  }
}

async function showBetButtons(interaction) {
  const user = await User.findOne({ discordId: interaction.user.id });
  const userBalance = user?.balance || 0;

  const modal = new ModalBuilder()
    .setCustomId('wheel_bet_modal')
    .setTitle('🎡 Vòng quay may mắn');

  const betInput = new TextInputBuilder()
    .setCustomId('bet_amount')
    .setLabel('Nhập số xu muốn cược:')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder(`${WHEEL_CONFIG.minBet}-${WHEEL_CONFIG.maxBet} xu (Bạn có: ${userBalance.toLocaleString()} xu)`)
    .setRequired(true)
    .setMinLength(1)
    .setMaxLength(4);

  const firstActionRow = new ActionRowBuilder().addComponents(betInput);
  modal.addComponents(firstActionRow);

  await interaction.showModal(modal);
}

function createWheelGameBoard() {
  const embed = new EmbedBuilder()
    .setTitle('🎡 VÒNG QUAY MAY MẮN')
    .setDescription(
      `🎰 **Chào mừng đến với Wheel of Fortune!**\n\n` +
      `🎯 **Cách chơi:**\n` +
      `• Nhấn nút **🎡 CHƠI NGAY** để tham gia\n` +
      `• Nhập số xu cược (${WHEEL_CONFIG.minBet}-${WHEEL_CONFIG.maxBet} xu)\n` +
      `• Vòng quay sẽ quyết định số phận của bạn!\n\n` +
      `🎊 **7 ô may mắn:**\n` +
      WHEEL_CONFIG.sectors.map(s => 
        `${s.emoji} **${s.name}** - x${s.multiplier} (${s.chance}%)`
      ).join('\n') +
      `\n\n💡 **Mẹo:** Jackpot hiếm nhưng thưởng x10! Chúc may mắn! 🍀`
    )
    .setColor('#ffa500')
    .setThumbnail('https://i.imgur.com/wheel-icon.png') // Optional wheel icon
    .setFooter({ 
      text: '🎡 Wheel of Fortune • Chơi có trách nhiệm',
      iconURL: 'https://i.imgur.com/casino-icon.png' 
    })
    .setTimestamp();

  return embed;
}

function createWheelGameButtons() {
  const row1 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('wheel_join')
        .setLabel('🎡 CHƠI NGAY!')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('wheel_rules')
        .setLabel('📋 Luật chơi')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('wheel_stats')
        .setLabel('📊 Thống kê')
        .setStyle(ButtonStyle.Success)
    );

  return row1;
}

async function startWheelGame(interaction, betAmount) {
  // Validate bet amount
  if (betAmount < WHEEL_CONFIG.minBet || betAmount > WHEEL_CONFIG.maxBet) {
    const embed = new EmbedBuilder()
      .setTitle('❌ Số xu không hợp lệ')
      .setDescription(`Số xu cược phải từ **${WHEEL_CONFIG.minBet}** đến **${WHEEL_CONFIG.maxBet}** xu!`)
      .setColor('#ff0000');
    
    return interaction.editReply ? 
      interaction.editReply({ embeds: [embed] }) : 
      interaction.reply({ embeds: [embed], ephemeral: true });
  }

  // Kiểm tra số dư user
  const user = await User.findOne({ discordId: interaction.user.id });
  if (!user) {
    const embed = new EmbedBuilder()
      .setTitle('❌ Lỗi tài khoản')
      .setDescription('Không tìm thấy tài khoản của bạn! Hãy thử câu cá trước.')
      .setColor('#ff0000');
    
    return interaction.editReply ? 
      interaction.editReply({ embeds: [embed] }) : 
      interaction.reply({ embeds: [embed], ephemeral: true });
  }

  if (user.balance < betAmount) {
    const embed = new EmbedBuilder()
      .setTitle('💸 Không đủ xu')
      .setDescription(`Bạn chỉ có **${user.balance.toLocaleString()} xu** nhưng muốn cược **${betAmount.toLocaleString()} xu**!`)
      .setColor('#ff0000');
    
    return interaction.editReply ? 
      interaction.editReply({ embeds: [embed] }) : 
      interaction.reply({ embeds: [embed], ephemeral: true });
  }

  // Tạo game mới
  const gameData = {
    userId: interaction.user.id,
    betAmount: betAmount,
    startTime: Date.now(),
    spinning: false
  };

  activeGames.set(interaction.user.id, gameData);

  // Tạo embed hiển thị vòng quay
  const gameEmbed = createWheelEmbed(betAmount, user.balance, false);
  const gameButtons = createWheelButtons();

  const response = interaction.editReply ? 
    await interaction.editReply({ embeds: [gameEmbed], components: [gameButtons] }) :
    await interaction.reply({ embeds: [gameEmbed], components: [gameButtons] });

  // Tạo collector cho buttons
  const collector = response.createMessageComponentCollector({
    filter: i => i.user.id === interaction.user.id,
    time: 60000 // 1 phút timeout
  });

  collector.on('collect', async i => {
    if (i.customId === 'wheel_spin') {
      await handleSpinWheel(i, gameData);
    } else if (i.customId === 'wheel_cancel') {
      await handleCancelGame(i);
    }
  });

  collector.on('end', () => {
    activeGames.delete(interaction.user.id);
  });
}

function createWheelEmbed(betAmount, userBalance, isResult = false, result = null) {
  const embed = new EmbedBuilder()
    .setTitle('🎡 Vòng quay may mắn')
    .setColor('#ffa500');

  if (!isResult) {
    // Game bắt đầu
    embed.setDescription(
      `🎯 **Cược:** ${betAmount.toLocaleString()} xu\n` +
      `💰 **Số dư:** ${userBalance.toLocaleString()} xu\n\n` +
      `🎡 **Vòng quay sẵn sàng!**\n` +
      `Nhấn **QUAY** để bắt đầu thử vận may!\n\n` +
      `${WHEEL_CONFIG.sectors.map(s => `${s.emoji} ${s.name} (x${s.multiplier})`).join('\n')}`
    );
  } else {
    // Kết quả
    const winAmount = Math.floor(betAmount * result.multiplier);
    const profit = winAmount - betAmount;
    
    embed.setDescription(
      `🎯 **Cược:** ${betAmount.toLocaleString()} xu\n` +
      `🎡 **Kết quả:** ${result.emoji} **${result.name}**\n` +
      `💎 **Hệ số:** x${result.multiplier}\n` +
      `💰 **Nhận được:** ${winAmount.toLocaleString()} xu\n` +
      `📊 **Lời/Lỗ:** ${profit >= 0 ? '+' : ''}${profit.toLocaleString()} xu`
    )
    .setColor(result.color);

    if (result.multiplier >= 5) {
      embed.setFooter({ text: '🎉 Chúc mừng! Bạn đã trúng lớn!' });
    }
  }

  return embed;
}

function createWheelButtons(disabled = false) {
  return new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('wheel_spin')
        .setLabel('🎡 QUAY!')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(disabled),
      new ButtonBuilder()
        .setCustomId('wheel_cancel')
        .setLabel('❌ Hủy')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(disabled)
    );
}

async function handleSpinWheel(interaction, gameData) {
  if (gameData.spinning) {
    return interaction.reply({
      content: '🎡 Vòng quay đang chạy! Hãy đợi kết quả.',
      ephemeral: true
    });
  }

  gameData.spinning = true;
  await interaction.deferUpdate();

  // Trừ xu trước khi quay
  const user = await User.findOne({ discordId: gameData.userId });
  user.balance -= gameData.betAmount;
  await user.save();

  // Log tiền cược
  await logMoneyDeducted(interaction.user, gameData.betAmount, 'wheel-bet');

  // Hiệu ứng quay (spinning animation)
  const spinningEmbed = new EmbedBuilder()
    .setTitle('🎡 Vòng quay may mắn')
    .setDescription('🌀 **ĐANG QUAY...**\n\n🎡 Vòng quay đang xoay tròn...')
    .setColor('#ffaa00');

  await interaction.editReply({ 
    embeds: [spinningEmbed], 
    components: [createWheelButtons(true)] 
  });

  // Delay cho hiệu ứng
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Tính toán kết quả
  const result = spinWheel();
  const winAmount = Math.floor(gameData.betAmount * result.multiplier);

  // Cập nhật balance và stats
  if (winAmount > 0) {
    user.balance += winAmount;
    await user.save();
    
    // Log tiền thắng
    if (winAmount > gameData.betAmount) {
      await logMoneyReceived(interaction.user, winAmount - gameData.betAmount, 'wheel-win', {
        multiplier: result.multiplier,
        sector: result.name
      });
    }
  }

  // Cập nhật wheel stats
  if (!user.stats.wheelGames) {
    user.stats.wheelGames = 0;
    user.stats.wheelWinnings = 0;
  }
  user.stats.wheelGames += 1;
  user.stats.wheelWinnings += (winAmount - gameData.betAmount);
  await user.save();

  // Hiển thị kết quả
  const resultEmbed = createWheelEmbed(gameData.betAmount, user.balance, true, result);
  
  await interaction.editReply({ 
    embeds: [resultEmbed], 
    components: [] 
  });

  // Xóa game
  activeGames.delete(gameData.userId);
}

function spinWheel() {
  // Tính tổng chance
  const totalChance = WHEEL_CONFIG.sectors.reduce((sum, sector) => sum + sector.chance, 0);
  const random = Math.random() * totalChance;
  
  let currentChance = 0;
  for (const sector of WHEEL_CONFIG.sectors) {
    currentChance += sector.chance;
    if (random <= currentChance) {
      return sector;
    }
  }
  
  // Fallback (shouldn't happen)
  return WHEEL_CONFIG.sectors[2]; // Hòa vốn
}

async function handleCancelGame(interaction) {
  activeGames.delete(interaction.user.id);
  
  const embed = new EmbedBuilder()
    .setTitle('❌ Đã hủy vòng quay')
    .setDescription('Game vòng quay đã được hủy. Không có xu nào bị trừ.')
    .setColor('#888888');

  await interaction.update({ embeds: [embed], components: [] });
}

async function handleInfoCommand(interaction) {
  const embed = new EmbedBuilder()
    .setTitle('🎡 Thông tin Vòng quay may mắn')
    .setDescription(
      `🎯 **Cách chơi:**\n` +
      `• Đặt cược từ ${WHEEL_CONFIG.minBet} đến ${WHEEL_CONFIG.maxBet} xu\n` +
      `• Nhấn QUAY để bắt đầu\n` +
      `• Vòng quay sẽ dừng ở 1 trong 7 ô\n` +
      `• Nhận xu theo hệ số của ô đó\n\n` +
      `🎰 **Các ô trong vòng quay:**`
    )
    .setColor('#3498db');

  WHEEL_CONFIG.sectors.forEach(sector => {
    embed.addFields({
      name: `${sector.emoji} ${sector.name}`,
      value: `**x${sector.multiplier}** • ${sector.chance}% chance`,
      inline: true
    });
  });

  embed.addFields({
    name: '💡 Mẹo',
    value: 'Jackpot rất hiếm nhưng cho x10 tiền cược! Chơi có trách nhiệm!',
    inline: false
  });

  await interaction.reply({ embeds: [embed] });
}

async function handleStatsCommand(interaction) {
  const user = await User.findOne({ discordId: interaction.user.id });
  
  if (!user || !user.stats.wheelGames) {
    const embed = new EmbedBuilder()
      .setTitle('📊 Thống kê Vòng quay')
      .setDescription('🎡 Bạn chưa chơi vòng quay lần nào!')
      .setColor('#888888');
    
    return interaction.reply({ embeds: [embed] });
  }

  const winRate = user.stats.wheelGames > 0 ? 
    ((user.stats.wheelWinnings > 0 ? 1 : 0) * 100 / user.stats.wheelGames).toFixed(1) : 0;

  const embed = new EmbedBuilder()
    .setTitle('📊 Thống kê Vòng quay của bạn')
    .setColor(user.stats.wheelWinnings >= 0 ? '#00ff00' : '#ff0000')
    .addFields(
      { name: '🎡 Lượt chơi', value: user.stats.wheelGames.toLocaleString(), inline: true },
      { name: '💰 Tổng lời/lỗ', value: `${user.stats.wheelWinnings >= 0 ? '+' : ''}${user.stats.wheelWinnings.toLocaleString()} xu`, inline: true },
      { name: '📈 Tỷ lệ thắng', value: `${winRate}%`, inline: true },
      { name: '💎 Số dư hiện tại', value: `${user.balance.toLocaleString()} xu`, inline: true }
    )
    .setTimestamp()
    .setFooter({ 
      text: `${interaction.user.username} • Wheel Stats`,
      iconURL: interaction.user.displayAvatarURL() 
    });

  await interaction.reply({ embeds: [embed] });
}

// Export functions để xử lý modal và buttons
export async function handleWheelBetModal(interaction) {
  const betAmount = parseInt(interaction.fields.getTextInputValue('bet_amount'));
  
  if (isNaN(betAmount)) {
    const embed = new EmbedBuilder()
      .setTitle('❌ Số xu không hợp lệ')
      .setDescription('Vui lòng nhập một số nguyên hợp lệ!')
      .setColor('#ff0000');
    
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  await interaction.deferReply({ ephemeral: true });
  await startWheelGame(interaction, betAmount);
}

export async function handleWheelGameButtons(interaction) {
  if (!interaction.customId.startsWith('wheel_')) return false;

  const action = interaction.customId.replace('wheel_', '');
  
  switch (action) {
    case 'join':
      await handleJoinGame(interaction);
      break;
    case 'rules':
      await handleRulesFromButton(interaction);
      break;
    case 'stats':
      await handleStatsFromButton(interaction);
      break;
    default:
      return false;
  }
  
  return true;
}

async function handleJoinGame(interaction) {
  // Kiểm tra user có game đang chơi không
  if (activeGames.has(interaction.user.id)) {
    return interaction.reply({
      content: '🎡 Bạn đang có vòng quay chưa hoàn thành! Hãy hoàn thành game hiện tại trước.',
      ephemeral: true
    });
  }

  // Hiển thị modal để nhập cược
  const user = await User.findOne({ discordId: interaction.user.id });
  const userBalance = user?.balance || 0;

  const modal = new ModalBuilder()
    .setCustomId('wheel_bet_modal')
    .setTitle('🎡 Vòng quay may mắn');

  const betInput = new TextInputBuilder()
    .setCustomId('bet_amount')
    .setLabel('Nhập số xu muốn cược:')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder(`${WHEEL_CONFIG.minBet}-${WHEEL_CONFIG.maxBet} xu (Bạn có: ${userBalance.toLocaleString()} xu)`)
    .setRequired(true)
    .setMinLength(1)
    .setMaxLength(4);

  const firstActionRow = new ActionRowBuilder().addComponents(betInput);
  modal.addComponents(firstActionRow);

  await interaction.showModal(modal);
}

async function handleRulesFromButton(interaction) {
  const embed = new EmbedBuilder()
    .setTitle('📋 Luật chơi Vòng quay may mắn')
    .setDescription(
      `🎯 **Cách chơi:**\n` +
      `1. Nhấn **🎡 CHƠI NGAY** để tham gia\n` +
      `2. Nhập số xu cược (${WHEEL_CONFIG.minBet}-${WHEEL_CONFIG.maxBet} xu)\n` +
      `3. Vòng quay sẽ xoay trong 3 giây\n` +
      `4. Nhận xu theo ô mà vòng quay dừng lại\n\n` +
      `🎰 **Các ô trong vòng quay:**\n` +
      WHEEL_CONFIG.sectors.map(s => 
        `${s.emoji} **${s.name}** - Nhận x${s.multiplier} tiền cược (${s.chance}% cơ hội)`
      ).join('\n') +
      `\n\n💡 **Lưu ý:**\n` +
      `• Chỉ có thể chơi 1 game tại 1 thời điểm\n` +
      `• Game sẽ tự hủy sau 60 giây nếu không hoàn thành\n` +
      `• Chơi có trách nhiệm và tận hưởng niềm vui! 🎊`
    )
    .setColor('#3498db')
    .setFooter({ text: 'Wheel of Fortune Rules' });

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleStatsFromButton(interaction) {
  const user = await User.findOne({ discordId: interaction.user.id });
  
  if (!user || !user.stats.wheelGames) {
    const embed = new EmbedBuilder()
      .setTitle('📊 Thống kê Vòng quay của bạn')
      .setDescription('🎡 Bạn chưa chơi vòng quay lần nào!\n\nHãy nhấn **🎡 CHƠI NGAY** để bắt đầu!')
      .setColor('#888888');
    
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  const totalBet = user.stats.wheelGames * 100; // Ước tính trung bình
  const winRate = user.stats.wheelGames > 0 ? 
    ((user.stats.wheelWinnings > 0 ? 1 : 0) * 100 / user.stats.wheelGames).toFixed(1) : 0;

  const embed = new EmbedBuilder()
    .setTitle('📊 Thống kê Vòng quay của bạn')
    .setColor(user.stats.wheelWinnings >= 0 ? '#00ff00' : '#ff0000')
    .addFields(
      { name: '🎡 Lượt chơi', value: user.stats.wheelGames.toLocaleString(), inline: true },
      { name: '💰 Tổng lời/lỗ', value: `${user.stats.wheelWinnings >= 0 ? '+' : ''}${user.stats.wheelWinnings.toLocaleString()} xu`, inline: true },
      { name: '📈 Hiệu suất', value: `${winRate}%`, inline: true },
      { name: '💎 Số dư hiện tại', value: `${user.balance.toLocaleString()} xu`, inline: true },
      { name: '🎯 Trạng thái', value: user.stats.wheelWinnings >= 0 ? '🟢 Có lãi' : '🔴 Đang lỗ', inline: true },
      { name: '🏆 Cấp độ', value: user.stats.wheelGames >= 100 ? '💎 Master' : user.stats.wheelGames >= 50 ? '🥇 Pro' : user.stats.wheelGames >= 20 ? '🥈 Experienced' : '🥉 Beginner', inline: true }
    )
    .setTimestamp()
    .setFooter({ 
      text: `${interaction.user.username} • Personal Wheel Stats`,
      iconURL: interaction.user.displayAvatarURL() 
    });

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
