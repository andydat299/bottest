import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { User } from '../schemas/userSchema.js';
import { isAdmin, createNoPermissionEmbed, createSuccessEmbed, createErrorEmbed } from '../utils/adminUtils.js';

export const data = new SlashCommandBuilder()
  .setName('setmoney')
  .setDescription('[ADMIN] Đặt số tiền của người dùng')
  .addUserOption(option =>
    option.setName('user')
      .setDescription('Người dùng cần đặt tiền')
      .setRequired(true))
  .addIntegerOption(option =>
    option.setName('amount')
      .setDescription('Số tiền muốn đặt')
      .setRequired(true)
      .setMinValue(0));

export async function execute(interaction) {
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
    // Tìm hoặc tạo user trong database
    let user = await User.findOne({ discordId: targetUser.id });
    
    if (!user) {
      user = new User({
        discordId: targetUser.id,
        balance: 0
      });
    }

    // Đặt tiền
    const oldBalance = user.balance;
    user.balance = amount;
    await user.save();

    const embed = createSuccessEmbed(
      EmbedBuilder,
      'Đặt tiền thành công',
      `Đã đặt tiền của ${targetUser} thành **${amount.toLocaleString()}** coins\n` +
      `Số dư cũ: **${oldBalance.toLocaleString()}** coins\n` +
      `Số dư mới: **${user.balance.toLocaleString()}** coins`
    );

    await interaction.reply({ embeds: [embed] });

  } catch (error) {
    console.error('Error setting money:', error);
    const embed = createErrorEmbed(
      EmbedBuilder,
      'Lỗi',
      'Có lỗi xảy ra khi đặt tiền!'
    );
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
}
