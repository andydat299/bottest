import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { User } from '../schemas/userSchema.js';
import { isAdmin, createNoPermissionEmbed, createSuccessEmbed, createErrorEmbed } from '../utils/adminUtils.js';

const data = new SlashCommandBuilder()
  .setName('removemoney')
  .setDescription('[ADMIN] Trừ tiền của người dùng')
  .addUserOption(option =>
    option.setName('user')
      .setDescription('Người dùng cần trừ tiền')
      .setRequired(true))
  .addIntegerOption(option =>
    option.setName('amount')
      .setDescription('Số tiền cần trừ')
      .setRequired(true)
      .setMinValue(1));

async function execute(interaction) {
  // Kiểm tra quyền admin
  if (!isAdmin(interaction.user.id)) {
    return interaction.reply({ 
      embeds: [createNoPermissionEmbed(EmbedBuilder)], 
      ephemeral: true 
    });
  }

  const targetUser = interaction.options.getUser('user');
  const amount = interaction.options.getInteger('amount');

  try {
    // Tìm user trong database
    let user = await User.findOne({ discordId: targetUser.id });
    
    if (!user) {
      const embed = createErrorEmbed(
        EmbedBuilder,
        'Không tìm thấy người dùng',
        `${targetUser} chưa có dữ liệu trong hệ thống!`
      );
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Kiểm tra số dư
    if (user.balance < amount) {
      const embed = createErrorEmbed(
        EmbedBuilder,
        'Không đủ tiền',
        `${targetUser} chỉ có **${user.balance.toLocaleString()}** coins, không thể trừ **${amount.toLocaleString()}** coins!`
      );
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Trừ tiền
    const oldBalance = user.balance;
    user.balance -= amount;
    await user.save();

    const embed = createSuccessEmbed(
      EmbedBuilder,
      'Trừ tiền thành công',
      `Đã trừ **${amount.toLocaleString()}** coins của ${targetUser}\n` +
      `Số dư cũ: **${oldBalance.toLocaleString()}** coins\n` +
      `Số dư mới: **${user.balance.toLocaleString()}** coins`
    );

    await interaction.reply({ embeds: [embed] });

  } catch (error) {
    console.error('Error removing money:', error);
    const embed = createErrorEmbed(
      EmbedBuilder,
      'Lỗi',
      'Có lỗi xảy ra khi trừ tiền!'
    );
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
}

export default { data, execute };
