import { config } from '../config.js';

/**
 * Kiểm tra xem user có phải admin không
 * @param {string} userId - Discord user ID
 * @returns {boolean}
 */
export function isAdmin(userId) {
  const adminIds = process.env.ADMIN_IDS?.split(',') || config.admins || [];
  return adminIds.includes(userId);
}

/**
 * Tạo embed để hiển thị lỗi không có quyền
 * @param {import('discord.js').EmbedBuilder} EmbedBuilder
 * @returns {import('discord.js').EmbedBuilder}
 */
export function createNoPermissionEmbed(EmbedBuilder) {
  return new EmbedBuilder()
    .setColor('#FF0000')
    .setTitle('❌ Không có quyền')
    .setDescription('Bạn không có quyền sử dụng lệnh này!')
    .setTimestamp();
}

/**
 * Tạo embed thành công cho admin commands
 * @param {import('discord.js').EmbedBuilder} EmbedBuilder
 * @param {string} title
 * @param {string} description
 * @returns {import('discord.js').EmbedBuilder}
 */
export function createSuccessEmbed(EmbedBuilder, title, description) {
  return new EmbedBuilder()
    .setColor('#00FF00')
    .setTitle(`✅ ${title}`)
    .setDescription(description)
    .setTimestamp();
}

/**
 * Tạo embed lỗi cho admin commands
 * @param {import('discord.js').EmbedBuilder} EmbedBuilder
 * @param {string} title
 * @param {string} description
 * @returns {import('discord.js').EmbedBuilder}
 */
export function createErrorEmbed(EmbedBuilder, title, description) {
  return new EmbedBuilder()
    .setColor('#FF0000')
    .setTitle(`❌ ${title}`)
    .setDescription(description)
    .setTimestamp();
}

/**
 * Tạo embed QR code cho admin
 * @param {import('discord.js').EmbedBuilder} EmbedBuilder
 * @param {Object} request - Withdraw request
 * @returns {import('discord.js').EmbedBuilder}
 */
export function createAdminQREmbed(EmbedBuilder, request) {
  const { generateBankQR, generateBankingLinks } = require('./bankQR.js');
  
  const qrUrl = generateBankQR(
    {
      bankName: request.bankName,
      accountNumber: request.accountNumber,
      accountHolder: request.accountHolder
    },
    request.vndAmount,
    `Rut xu game - ID:${request._id.toString().slice(-8)}`
  );

  const bankingLink = generateBankingLinks(
    {
      bankName: request.bankName,
      accountNumber: request.accountNumber,
      accountHolder: request.accountHolder
    },
    request.vndAmount,
    `Rut xu game - ID:${request._id.toString().slice(-8)}`
  );

  return new EmbedBuilder()
    .setTitle('📱 QR CODE CHUYỂN KHOẢN')
    .setDescription('**Quét QR hoặc copy thông tin để chuyển tiền**')
    .addFields(
      { name: '🏦 Ngân hàng', value: request.bankName.toUpperCase(), inline: true },
      { name: '🔢 Số tài khoản', value: `\`${request.accountNumber}\``, inline: true },
      { name: '👤 Tên người nhận', value: request.accountHolder, inline: true },
      { name: '💰 Số tiền', value: `**${request.vndAmount.toLocaleString()} VNĐ**`, inline: true },
      { name: '📝 Nội dung CK', value: `\`Rut xu game - ID:${request._id.toString().slice(-8)}\``, inline: true },
      { name: '📱 Mở App Banking', value: `[Chuyển khoản nhanh](${bankingLink})`, inline: true }
    )
    .setImage(qrUrl)
    .setColor('#00ff00')
    .setFooter({ text: 'Quét QR code bằng app ngân hàng • Click "✅ Duyệt" sau khi chuyển xong' })
    .setTimestamp();
}
