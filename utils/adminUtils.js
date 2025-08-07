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

/**
 * Tạo embed thông báo approve withdraw cho user
 * @param {import('discord.js').EmbedBuilder} EmbedBuilder
 * @param {Object} request - Withdraw request
 * @returns {import('discord.js').EmbedBuilder}
 */
export function createWithdrawApproveEmbed(EmbedBuilder, request) {
  return new EmbedBuilder()
    .setTitle('✅ YÊU CẦU ĐỔI TIỀN ĐÃ ĐƯỢC DUYỆT!')
    .setDescription('**Admin đã xác nhận và chuyển tiền thành công**')
    .addFields(
      { name: '🆔 Mã giao dịch', value: `\`${request._id.toString().slice(-8)}\``, inline: true },
      { name: '💰 Số tiền nhận', value: `**${request.vndAmount.toLocaleString()} VNĐ**`, inline: true },
      { name: '🏦 Ngân hàng', value: request.bankName.toUpperCase(), inline: true },
      { name: '🔢 Số tài khoản', value: `\`${request.accountNumber}\``, inline: true },
      { name: '👤 Tên người nhận', value: request.accountHolder, inline: true },
      { name: '⏰ Thời gian duyệt', value: `<t:${Math.floor((request.processedAt || new Date()).getTime()/1000)}:F>`, inline: true },
      { name: '🎉 Thông báo', value: '**Tiền đã được chuyển vào tài khoản của bạn!**\nCảm ơn bạn đã sử dụng dịch vụ 💖', inline: false }
    )
    .setColor('#00ff00')
    .setFooter({ text: 'Giao dịch hoàn tất • MiniGame MidNight' })
    .setTimestamp();
}

/**
 * Tạo embed thông báo reject withdraw cho user
 * @param {import('discord.js').EmbedBuilder} EmbedBuilder
 * @param {Object} request - Withdraw request
 * @returns {import('discord.js').EmbedBuilder}
 */
export function createWithdrawRejectEmbed(EmbedBuilder, request) {
  return new EmbedBuilder()
    .setTitle('❌ YÊU CẦU ĐỔI TIỀN BỊ TỪ CHỐI')
    .setDescription('**Admin đã từ chối yêu cầu rút tiền của bạn**')
    .addFields(
      { name: '🆔 Mã giao dịch', value: `\`${request._id.toString().slice(-8)}\``, inline: true },
      { name: '💰 Số xu đã hoàn', value: `**${request.amount.toLocaleString()} xu**`, inline: true },
      { name: '🏦 Ngân hàng', value: request.bankName.toUpperCase(), inline: true },
      { name: '⏰ Thời gian từ chối', value: `<t:${Math.floor((request.processedAt || new Date()).getTime()/1000)}:F>`, inline: true },
      { name: '🔄 Hoàn xu', value: '**Số xu đã được hoàn lại vào tài khoản**\nBạn có thể tạo yêu cầu mới', inline: false },
      { name: '💡 Lý do có thể', value: '• Thông tin ngân hàng không chính xác\n• Số tiền không hợp lệ\n• Vi phạm điều khoản\n• Lỗi hệ thống', inline: false }
    )
    .setColor('#ff0000')
    .setFooter({ text: 'Liên hệ admin nếu cần hỗ trợ • MiniGame MidNight' })
    .setTimestamp();
}
