/**
 * Tạo QR code cho chuyển khoản ngân hàng Việt Nam
 * @param {Object} bankInfo - Thông tin ngân hàng
 * @param {number} amount - Số tiền chuyển
 * @param {string} content - Nội dung chuyển khoản
 * @returns {string} URL QR code
 */
export function generateBankQR(bankInfo, amount, content) {
  const { bankName, accountNumber, accountHolder } = bankInfo;
  
  // Map tên ngân hàng thành mã BIN
  const bankCodes = {
    'vietcombank': '970436',
    'techcombank': '970407', 
    'bidv': '970418',
    'vietinbank': '970415',
    'agribank': '970405',
    'mbbank': '970422',
    'tpbank': '970423',
    'sacombank': '970403',
    'acb': '970416',
    'vpbank': '970432'
  };

  const bankCode = bankCodes[bankName.toLowerCase()] || '970436'; // Default Vietcombank
  
  // Tạo VietQR URL
  const qrData = {
    bank: bankCode,
    account: accountNumber,
    amount: amount,
    memo: content || `Rut tien xu game - ${accountHolder}`,
    template: 'compact'
  };

  // VietQR API URL
  const baseUrl = 'https://img.vietqr.io/image';
  const qrUrl = `${baseUrl}/${bankCode}-${accountNumber}-${qrData.template}.png?amount=${amount}&addInfo=${encodeURIComponent(qrData.memo)}`;
  
  return qrUrl;
}

/**
 * Tạo link chuyển khoản nhanh cho các app banking
 * @param {Object} bankInfo - Thông tin ngân hàng
 * @param {number} amount - Số tiền
 * @param {string} content - Nội dung
 * @returns {string} Deep link cho app banking
 */
export function generateBankingLinks(bankInfo, amount, content) {
  const { bankName, accountNumber, accountHolder } = bankInfo;
  
  const links = {
    vietcombank: `vietcombank://transfer?account=${accountNumber}&amount=${amount}&content=${encodeURIComponent(content)}`,
    techcombank: `tcb://transfer?account=${accountNumber}&amount=${amount}&memo=${encodeURIComponent(content)}`,
    bidv: `bidv://transfer?account=${accountNumber}&amount=${amount}&content=${encodeURIComponent(content)}`,
    mbbank: `mbbank://transfer?account=${accountNumber}&amount=${amount}&content=${encodeURIComponent(content)}`,
    general: `intent://transfer?account=${accountNumber}&amount=${amount}&content=${encodeURIComponent(content)}#Intent;scheme=banking;end`
  };
  
  return links[bankName.toLowerCase()] || links.general;
}

/**
 * Tạo embed và banking link cho QR code chuyển khoản
 * @param {import('discord.js').EmbedBuilder} EmbedBuilder
 * @param {Object} request - Withdraw request
 * @returns {Object} { embed, bankingLink }
 */
export function createQREmbed(EmbedBuilder, request) {
  console.log('🔧 [QR] Creating QR embed for request:', request._id);
  
  try {
    const qrUrl = generateBankQR(
      {
        bankName: request.bankName,
        accountNumber: request.accountNumber,
        accountHolder: request.accountHolder
      },
      request.vndAmount,
      `Rut xu game - ID:${request._id.toString().slice(-8)}`
    );

    console.log('🔧 [QR] QR URL generated:', qrUrl.substring(0, 50) + '...');

    const bankingLink = generateBankingLinks(
      {
        bankName: request.bankName,
        accountNumber: request.accountNumber,
        accountHolder: request.accountHolder
      },
      request.vndAmount,
      `Rut xu game - ID:${request._id.toString().slice(-8)}`
    );

    console.log('🔧 [QR] Banking link generated:', bankingLink.substring(0, 50) + '...');

    const embed = new EmbedBuilder()
      .setTitle('📱 QR CODE CHUYỂN KHOẢN')
      .setDescription('**Quét QR hoặc click Quick Transfer để mở app banking**')
      .addFields(
        { name: '🏦 Ngân hàng', value: request.bankName.toUpperCase(), inline: true },
        { name: '🔢 Số tài khoản', value: `\`${request.accountNumber}\``, inline: true },
        { name: '👤 Tên người nhận', value: request.accountHolder, inline: true },
        { name: '💰 Số tiền', value: `**${request.vndAmount.toLocaleString()} VNĐ**`, inline: true },
        { name: '📝 Nội dung CK', value: `\`Rut xu game - ID:${request._id.toString().slice(-8)}\``, inline: true },
        { name: '📋 Copy thông tin', value: `**STK:** \`${request.accountNumber}\`\n**Tên:** \`${request.accountHolder}\`\n**Số tiền:** \`${request.vndAmount.toLocaleString()}\``, inline: false }
      )
      .setImage(qrUrl)
      .setColor('#00ff00')
      .setFooter({ text: 'Quét QR hoặc dùng Quick Transfer • Click ✅ Duyệt sau khi chuyển xong' })
      .setTimestamp();

    console.log('🔧 [QR] Embed created successfully');

    return { embed, bankingLink };
    
  } catch (error) {
    console.error('❌ [QR] Error in createQREmbed:', error);
    throw error;
  }
}