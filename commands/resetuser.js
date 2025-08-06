import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { User } from '../schemas/userSchema.js';
import { isAdmin, createNoPermissionEmbed, createSuccessEmbed, createErrorEmbed } from '../utils/adminUtils.js';

const data = new SlashCommandBuilder()
  .setName('resetuser')
  .setDescription('[ADMIN] Reset dữ liệu của người dùng')
  .addUserOption(option =>
    option.setName('user')
      .setDescription('Người dùng cần reset')
      .setRequired(true))
  .addStringOption(option =>
    option.setName('type')
      .setDescription('Loại reset')
      .setRequired(true)
      .addChoices(
        { name: 'Tất cả dữ liệu', value: 'all' },
        { name: 'Chỉ tiền', value: 'money' },
        { name: 'Chỉ cá và cấp cần', value: 'fishing' },
        { name: 'Chỉ thống kê', value: 'stats' }
      ));

async function execute(interaction) {
  // Kiểm tra quyền admin
  if (!isAdmin(interaction.user.id)) {
    return interaction.reply({ 
      embeds: [createNoPermissionEmbed(EmbedBuilder)], 
      ephemeral: true 
    });
  }

  const targetUser = interaction.options.getUser('user');
  const resetType = interaction.options.getString('type');

  try {
    // Tìm user trong database
    const user = await User.findOne({ discordId: targetUser.id });
    
    if (!user) {
      const embed = createErrorEmbed(
        EmbedBuilder,
        'Không tìm thấy người dùng',
        `${targetUser} chưa có dữ liệu trong hệ thống!`
      );
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Tạo embed xác nhận
    let resetDescription = '';
    switch (resetType) {
      case 'all':
        resetDescription = 'toàn bộ dữ liệu (tiền, cá, thống kê, cấp cần)';
        break;
      case 'money':
        resetDescription = 'tiền và số tiền đã bán';
        break;
      case 'fishing':
        resetDescription = 'cá trong kho và cấp cần câu';
        break;
      case 'stats':
        resetDescription = 'thống kê câu cá và chat';
        break;
    }

    const confirmEmbed = new EmbedBuilder()
      .setColor('#FFFF00')
      .setTitle('⚠️ Xác nhận reset')
      .setDescription(`Bạn có chắc chắn muốn reset **${resetDescription}** của ${targetUser}?\n\n**Hành động này không thể hoàn tác!**`)
      .setTimestamp();

    const confirmRow = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`reset_confirm_${targetUser.id}_${resetType}`)
          .setLabel('Xác nhận')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('reset_cancel')
          .setLabel('Hủy')
          .setStyle(ButtonStyle.Secondary)
      );

    await interaction.reply({ 
      embeds: [confirmEmbed], 
      components: [confirmRow],
      ephemeral: true 
    });

  } catch (error) {
    console.error('Error in reset user command:', error);
    const embed = createErrorEmbed(
      EmbedBuilder,
      'Lỗi',
      'Có lỗi xảy ra khi thực hiện lệnh reset!'
    );
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
}

// Xử lý button interaction cho reset user
async function handleResetButton(interaction) {
  const [action, confirm, userId, resetType] = interaction.customId.split('_');
  
  if (action !== 'reset') return false;
  
  if (confirm === 'cancel') {
    const embed = new EmbedBuilder()
      .setColor('#808080')
      .setTitle('❌ Đã hủy')
      .setDescription('Reset đã được hủy bỏ.')
      .setTimestamp();
    
    await interaction.update({ embeds: [embed], components: [] });
    return true;
  }
  
  if (confirm !== 'confirm') return false;
  
  // Kiểm tra quyền admin
  if (!isAdmin(interaction.user.id)) {
    return interaction.update({ 
      embeds: [createNoPermissionEmbed(EmbedBuilder)], 
      components: [] 
    });
  }

  try {
    const user = await User.findOne({ discordId: userId });
    if (!user) {
      const embed = createErrorEmbed(
        EmbedBuilder,
        'Lỗi',
        'Không tìm thấy người dùng!'
      );
      return interaction.update({ embeds: [embed], components: [] });
    }

    // Thực hiện reset theo loại
    switch (resetType) {
      case 'all':
        user.balance = 0;
        user.totalSold = 0;
        user.rodLevel = 1;
        user.fish = new Map();
        user.fishingStats = {
          totalFishingAttempts: 0,
          successfulCatches: 0,
          missedCatches: 0
        };
        user.chatStats = {
          totalMessages: 0,
          dailyMessages: new Map(),
          lastMessageDate: ''
        };
        break;
      case 'money':
        user.balance = 0;
        user.totalSold = 0;
        break;
      case 'fishing':
        user.rodLevel = 1;
        user.fish = new Map();
        break;
      case 'stats':
        user.fishingStats = {
          totalFishingAttempts: 0,
          successfulCatches: 0,
          missedCatches: 0
        };
        user.chatStats = {
          totalMessages: 0,
          dailyMessages: new Map(),
          lastMessageDate: ''
        };
        break;
    }

    await user.save();

    const targetUser = await interaction.client.users.fetch(userId);
    const embed = createSuccessEmbed(
      EmbedBuilder,
      'Reset thành công',
      `Đã reset dữ liệu của ${targetUser} thành công!`
    );

    await interaction.update({ embeds: [embed], components: [] });

  } catch (error) {
    console.error('Error resetting user:', error);
    const embed = createErrorEmbed(
      EmbedBuilder,
      'Lỗi',
      'Có lỗi xảy ra khi reset dữ liệu!'
    );
    await interaction.update({ embeds: [embed], components: [] });
  }
  
  return true;
}

export default { data, execute };
export { handleResetButton };
