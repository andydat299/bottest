import { 
  SlashCommandBuilder, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  PermissionFlagsBits
} from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('update-games')
    .setDescription('🔄 [ADMIN] Cập nhật bảng trò chơi')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
      option.setName('message-id')
        .setDescription('ID tin nhắn cần cập nhật')
        .setRequired(true)
    ),

  async execute(interaction) {
    // Kiểm tra quyền admin
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return await interaction.reply({
        content: '❌ Bạn không có quyền sử dụng lệnh này!',
        ephemeral: true
      });
    }

    const messageId = interaction.options.getString('message-id');

    try {
      // Tìm tin nhắn cần cập nhật
      const message = await interaction.channel.messages.fetch(messageId);
      
      if (!message || message.author.id !== interaction.client.user.id) {
        await interaction.reply({
          content: '❌ Không tìm thấy tin nhắn hoặc tin nhắn không phải của bot!',
          ephemeral: true
        });
        return;
      }

      // Tạo embed mới
      const gameEmbed = new EmbedBuilder()
        .setTitle('🎮 TRUNG TÂM TRÒ CHƠI')
        .setDescription('**Chọn trò chơi bạn muốn chơi!**')
        .addFields(
          {
            name: '🎴 Xì Dách (Blackjack)',
            value: '• **Mục tiêu**: Đạt 21 điểm mà không vượt quá\n• **Cược**: 100 - 50,000 xu\n• **Blackjack**: Thưởng x1.5\n• **Thắng thường**: Thưởng x0.8',
            inline: false
          },
          {
            name: '🎯 Luật chơi nhanh',
            value: '• **A**: 1 hoặc 11 điểm\n• **J, Q, K**: 10 điểm\n• **Dealer** dừng tại 17 điểm\n• **Bust** (>21): Thua ngay',
            inline: false
          },
          {
            name: '💡 Hướng dẫn',
            value: '1️⃣ Ấn nút **"Chơi Xì Dách"** bên dưới\n2️⃣ Nhập số xu cược trong popup\n3️⃣ Sử dụng **Hit/Stand** để chơi',
            inline: false
          },
          {
            name: '📊 Cập nhật',
            value: `Lần cuối: <t:${Math.floor(Date.now() / 1000)}:R>`,
            inline: false
          }
        )
        .setColor('#ffdd57')
        .setThumbnail('https://cdn.discordapp.com/emojis/851461487498887168.png')
        .setFooter({ 
          text: 'Chơi có trách nhiệm! Đừng cược quá số xu bạn có thể mất.' 
        })
        .setTimestamp();

      // Tạo buttons
      const gameButtons = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('start_blackjack')
            .setLabel('🎴 Chơi Xì Dách')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🎴'),
          new ButtonBuilder()
            .setCustomId('blackjack_rules')
            .setLabel('📜 Luật chơi')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('📜'),
          new ButtonBuilder()
            .setCustomId('game_stats')
            .setLabel('📊 Thống kê')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('📊')
        );

      // Cập nhật tin nhắn
      await message.edit({
        embeds: [gameEmbed],
        components: [gameButtons]
      });

      await interaction.reply({
        content: `✅ Đã cập nhật bảng trò chơi!\n🔗 [Xem tin nhắn](${message.url})`,
        ephemeral: true
      });

    } catch (error) {
      console.error('Error updating game board:', error);
      await interaction.reply({
        content: '❌ Có lỗi xảy ra khi cập nhật bảng trò chơi! Kiểm tra lại Message ID.',
        ephemeral: true
      });
    }
  }
};
