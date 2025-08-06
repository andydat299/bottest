import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { User } from '../schemas/userSchema.js';
import { isAdmin, createNoPermissionEmbed, createSuccessEmbed, createErrorEmbed } from '../utils/adminUtils.js';

export const data = new SlashCommandBuilder()
  .setName('addmoney')
  .setDescription('[ADMIN] Thêm tiền cho người dùng')
  .addUserOption(option =>
    option.setName('user')
      .setDescription('Người dùng cần thêm tiền')
      .setRequired(true))
  .addIntegerOption(option =>
    option.setName('amount')
      .setDescription('Số tiền cần thêm')
      .setRequired(true)
      .setMinValue(1));

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

    // Thêm tiền
    const oldBalance = user.balance;
    user.balance += amount;
    await user.save();

    const embed = createSuccessEmbed(
      EmbedBuilder,
      'Thêm tiền thành công',
      `Đã thêm **${amount.toLocaleString()}** coins cho ${targetUser}\n` +
      `Số dư cũ: **${oldBalance.toLocaleString()}** coins\n` +
      `Số dư mới: **${user.balance.toLocaleString()}** coins`
    );

    await interaction.reply({ embeds: [embed] });

  } catch (error) {
    console.error('Error adding money:', error);
    const embed = createErrorEmbed(
      EmbedBuilder,
      'Lỗi',
      'Có lỗi xảy ra khi thêm tiền!'
    );
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
}
