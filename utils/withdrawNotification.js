import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

/**
 * Gửi thông báo withdraw request đến admin channel
 * @param {Object} interaction - Discord interaction object
 * @param {Object} request - Withdraw request data
 */
export async function sendWithdrawNotification(interaction, request) {
  console.log('🔔 [WITHDRAW] Starting admin notification...');
  console.log('🆔 [WITHDRAW] Request ID:', request._id);
  console.log('👤 [WITHDRAW] User:', request.userId, request.username);
  console.log('💰 [WITHDRAW] Amount:', request.vndAmount, 'VNĐ');
  
  const adminChannelId = process.env.ADMIN_CHANNEL_ID;
  const adminRoleId = process.env.ADMIN_ROLE_ID;
  
  console.log('📍 [WITHDRAW] Admin Channel ID:', adminChannelId);
  console.log('👑 [WITHDRAW] Admin Role ID:', adminRoleId);
  
  if (!adminChannelId) {
    console.error('❌ [WITHDRAW] ADMIN_CHANNEL_ID not configured!');
    return false;
  }

  const adminChannel = interaction.client.channels.cache.get(adminChannelId);
  console.log('🔍 [WITHDRAW] Admin Channel found:', !!adminChannel);
  
  if (!adminChannel) {
    console.error('❌ [WITHDRAW] Admin channel not found with ID:', adminChannelId);
    return false;
  }

  console.log('✅ [WITHDRAW] Admin channel:', adminChannel.name);

  try {
    console.log('📝 [WITHDRAW] Creating notification embed...');
    
    const adminEmbed = new EmbedBuilder()
      .setTitle('🚨 YÊU CẦU ĐỔI TIỀN MỚI')
      .setDescription('**Có người dùng mới tạo yêu cầu đổi tiền!**')
      .addFields(
        { 
          name: '👤 Người dùng', 
          value: `<@${request.userId}>\n\`${request.username}\` (${request.userId})`, 
          inline: false 
        },
        { 
          name: '💰 Chi tiết giao dịch', 
          value: `**Xu gốc:** ${request.amount.toLocaleString()} xu\n**Phí:** ${request.fee.toLocaleString()} xu (5%)\n**VNĐ chuyển:** **${request.vndAmount.toLocaleString()} VNĐ**`, 
          inline: false 
        },
        { 
          name: '🏦 Thông tin nhận tiền', 
          value: `**Ngân hàng:** ${request.bankName.toUpperCase()}\n**Số TK:** \`${request.accountNumber}\`\n**Tên:** ${request.accountHolder}`, 
          inline: false 
        }
      )
      .setColor('#ff6b6b')
      .setThumbnail(interaction.user.displayAvatarURL())
      .setFooter({ text: `ID: ${request._id} • Nhấn nút để xử lý` })
      .setTimestamp();

    // Thêm ghi chú nếu có
    if (request.adminNote && request.adminNote.trim()) {
      adminEmbed.addFields({ 
        name: '📝 Ghi chú từ user', 
        value: request.adminNote, 
        inline: false 
      });
    }

    console.log('🎮 [WITHDRAW] Creating action buttons...');
    
    const buttons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`withdraw_qr_${request._id}`)
          .setLabel('📱 Tạo QR')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`withdraw_approve_${request._id}`)
          .setLabel('✅ Duyệt')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`withdraw_reject_${request._id}`)
          .setLabel('❌ Từ chối')
          .setStyle(ButtonStyle.Danger)
      );

    const mention = adminRoleId ? `<@&${adminRoleId}>` : '@Admin';
    console.log('💬 [WITHDRAW] Mention string:', mention);

    console.log('📤 [WITHDRAW] Sending notification to admin channel...');
    
    const sentMessage = await adminChannel.send({ 
      content: `${mention} 🔔 **YÊU CẦU ĐỔI TIỀN MỚI**`,
      embeds: [adminEmbed], 
      components: [buttons] 
    });

    console.log('✅ [WITHDRAW] Notification sent successfully!');
    console.log('📨 [WITHDRAW] Message ID:', sentMessage.id);
    console.log('📍 [WITHDRAW] Channel:', adminChannel.name);
    
    return true;

  } catch (error) {
    console.error('❌ [WITHDRAW] Error sending notification:', error);
    console.error('❌ [WITHDRAW] Error name:', error.name);
    console.error('❌ [WITHDRAW] Error message:', error.message);
    console.error('❌ [WITHDRAW] Error code:', error.code);
    
    // Fallback: gửi tin nhắn đơn giản
    try {
      console.log('🧪 [WITHDRAW] Sending fallback notification...');
      
      const fallbackMessage = `🚨 **WITHDRAW REQUEST** (Fallback)

👤 **User:** <@${request.userId}> (\`${request.username}\`)
💰 **Amount:** ${request.vndAmount.toLocaleString()} VNĐ
🏦 **Bank:** ${request.bankName.toUpperCase()}
🔢 **Account:** \`${request.accountNumber}\`
👤 **Name:** ${request.accountHolder}
🆔 **ID:** \`${request._id}\`

⚠️ **Manual processing required** - Embed failed, use /check-last-withdraw for buttons`;

      const fallbackSent = await adminChannel.send(fallbackMessage);
      
      console.log('✅ [WITHDRAW] Fallback message sent:', fallbackSent.id);
      return true;
      
    } catch (fallbackError) {
      console.error('❌ [WITHDRAW] Fallback also failed:', fallbackError.message);
      console.error('💡 [WITHDRAW] Check bot permissions in admin channel!');
      return false;
    }
  }
}