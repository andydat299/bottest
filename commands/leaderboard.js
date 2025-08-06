import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { User } from '../schemas/userSchema.js';
import { isAdmin, createNoPermissionEmbed, createErrorEmbed } from '../utils/adminUtils.js';

const data = new SlashCommandBuilder()
  .setName('leaderboard')
  .setDescription('[ADMIN] Xem bảng xếp hạng người dùng')
  .addStringOption(option =>
    option.setName('type')
      .setDescription('Loại bảng xếp hạng')
      .setRequired(true)
      .addChoices(
        { name: 'Top tiền', value: 'money' },
        { name: 'Top cấp cần', value: 'rod' },
        { name: 'Top số cá', value: 'fish' },
        { name: 'Top tin nhắn', value: 'messages' },
        { name: 'Top câu cá thành công', value: 'catches' }
      ))
  .addIntegerOption(option =>
    option.setName('limit')
      .setDescription('Số lượng người dùng hiển thị (tối đa 20)')
      .setMinValue(1)
      .setMaxValue(20));

async function execute(interaction) {
  // Kiểm tra quyền admin
  if (!isAdmin(interaction.user.id)) {
    return interaction.reply({ 
      embeds: [createNoPermissionEmbed(EmbedBuilder)], 
      ephemeral: true 
    });
  }

  const type = interaction.options.getString('type');
  const limit = interaction.options.getInteger('limit') || 10;

  try {
    let users = [];
    let sortField = {};
    let title = '';
    let emoji = '';

    // Xác định cách sắp xếp và tiêu đề
    switch (type) {
      case 'money':
        sortField = { balance: -1 };
        title = 'Top người dùng giàu nhất';
        emoji = '💰';
        break;
      case 'rod':
        sortField = { rodLevel: -1 };
        title = 'Top cấp cần cao nhất';
        emoji = '🎣';
        break;
      case 'fish':
        // Sẽ tính tổng cá sau khi lấy dữ liệu
        sortField = {};
        title = 'Top số cá nhiều nhất';
        emoji = '🐟';
        break;
      case 'messages':
        sortField = { 'chatStats.totalMessages': -1 };
        title = 'Top tin nhắn nhiều nhất';
        emoji = '💬';
        break;
      case 'catches':
        sortField = { 'fishingStats.successfulCatches': -1 };
        title = 'Top câu cá thành công';
        emoji = '🏆';
        break;
    }

    if (type === 'fish') {
      // Xử lý đặc biệt cho tổng số cá
      users = await User.find({}).lean();
      users = users.map(user => {
        const totalFish = Array.from(Object.values(user.fish || {})).reduce((sum, count) => sum + count, 0);
        return { ...user, totalFish };
      }).sort((a, b) => b.totalFish - a.totalFish).slice(0, limit);
    } else {
      users = await User.find({}).sort(sortField).limit(limit).lean();
    }

    if (users.length === 0) {
      const embed = createErrorEmbed(
        EmbedBuilder,
        'Không có dữ liệu',
        'Không tìm thấy người dùng nào trong hệ thống!'
      );
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Tạo embed
    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle(`${emoji} ${title}`)
      .setTimestamp()
      .setFooter({ text: `Yêu cầu bởi ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

    let description = '';
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const rank = i + 1;
      let medal = '';
      
      if (rank === 1) medal = '🥇';
      else if (rank === 2) medal = '🥈';
      else if (rank === 3) medal = '🥉';
      else medal = `**${rank}.**`;

      let value = '';
      switch (type) {
        case 'money':
          value = `${user.balance.toLocaleString()} coins`;
          break;
        case 'rod':
          value = `Cấp ${user.rodLevel}`;
          break;
        case 'fish':
          value = `${user.totalFish.toLocaleString()} cá`;
          break;
        case 'messages':
          value = `${user.chatStats.totalMessages.toLocaleString()} tin nhắn`;
          break;
        case 'catches':
          value = `${user.fishingStats.successfulCatches.toLocaleString()} lần`;
          break;
      }

      try {
        const discordUser = await interaction.client.users.fetch(user.discordId);
        description += `${medal} ${discordUser.username} - ${value}\n`;
      } catch (error) {
        description += `${medal} Unknown User (${user.discordId}) - ${value}\n`;
      }
    }

    embed.setDescription(description);

    await interaction.reply({ embeds: [embed] });

  } catch (error) {
    console.error('Error getting leaderboard:', error);
    const embed = createErrorEmbed(
      EmbedBuilder,
      'Lỗi',
      'Có lỗi xảy ra khi lấy bảng xếp hạng!'
    );
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
}

export default { data, execute };
