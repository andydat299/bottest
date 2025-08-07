import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('announce-chat')
    .setDescription('📢 Thông báo event Chat Rewards - Xu Midnight')
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('Kênh để gửi thông báo (mặc định: kênh hiện tại)')
        .setRequired(false)
    ),

  async execute(interaction) {
    // Kiểm tra quyền admin
    if (!interaction.member.permissions.has('Administrator')) {
      return await interaction.reply({
        content: '❌ Bạn không có quyền sử dụng lệnh này!',
        ephemeral: true
      });
    }

    const targetChannel = interaction.options.getChannel('channel') || interaction.channel;

    const eventEmbed = new EmbedBuilder()
      .setTitle('🌙 **XU MIDNIGHT - CHAT REWARDS EVENT** 🌙')
      .setDescription('**🎉 Hệ thống thưởng xu khi chat đã được kích hoạt! 🎉**')
      .addFields(
        {
          name: '💬 Cách nhận xu',
          value: '• Chat bình thường tại <#1363492195478540348>\n• Có **10% cơ hội** nhận xu mỗi tin nhắn\n• Xu rơi từ **1-1,000 xu** ngẫu nhiên',
          inline: false
        },
        {
          name: '⏱️ Thời gian cooldown',
          value: '• **30 giây** sau khi nhận xu\n• Mỗi user chỉ có thể nhận xu sau khi hết cooldown\n• Hệ thống tự động theo dõi',
          inline: false
        },
        {
          name: '🎯 Khi nhận được xu',
          value: '• Bot sẽ **thông báo công khai** trong sảnh\n• Tin nhắn của bạn sẽ được **react emoji** 💰🎉✨\n• Hiển thị số xu nhận được và số dư mới',
          inline: false
        },
        {
          name: '📊 Xem thống kê',
          value: '• Dùng `/chatrewards` để xem thống kê cá nhân\n• Theo dõi tổng xu đã nhận\n• Xem số lần may mắn',
          inline: false
        },
        {
          name: '🚫 Lưu ý quan trọng',
          value: '• **Không spam** để farm xu\n• Chat **có nội dung, tự nhiên**\n• Vi phạm sẽ bị tạm ngưng tham gia',
          inline: false
        }
      )
      .setColor('#ffd700')
      .setThumbnail('https://cdn.discordapp.com/emojis/851461487498887168.png')
      .setImage('https://media.discordapp.net/attachments/1244512399503921152/1295777120764690514/Thiet_ke_chua_co_ten_7.gif?ex=6895753b&is=689423bb&hm=65433afcab97f24bde7dcd5bd36081ea3db2018b914d65dac834f2e758b837d1&width=1177&height=662&') // GIF vàng kim
      .setFooter({ 
        text: 'Chúc các bạn may mắn và nhận được nhiều xu! ✨',
        iconURL: interaction.client.user.displayAvatarURL()
      })
      .setTimestamp();

    try {
      await targetChannel.send({ 
        content: '🎊 **@everyone CHAT ĐỂ NHẬN XU!** 🎊\n\n💫 **Event Xu Midnight đã bắt đầu!**\nHãy chat tại <#1363492195478540348> để có cơ hội nhận xu!',
        embeds: [eventEmbed] 
      });

      await interaction.reply({
        content: `✅ Đã thông báo Chat Rewards Event tại ${targetChannel}!`,
        ephemeral: true
      });

    } catch (error) {
      console.error('Error sending chat rewards announcement:', error);
      await interaction.reply({
        content: '❌ Có lỗi xảy ra khi gửi thông báo!',
        ephemeral: true
      });
    }
  }
};
