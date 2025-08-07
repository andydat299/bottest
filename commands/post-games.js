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
    .setName('post-games')
    .setDescription('🎮 [ADMIN] Đăng bảng trò chơi')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('Kênh để đăng bảng game (mặc định: kênh hiện tại)')
        .setRequired(false)
    ),

  async execute(interaction) {
    // Kiểm tra quyền admin
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return await interaction.reply({
        content: '❌ Bạn không có quyền sử dụng lệnh này!',
        ephemeral: true
      });
    }

    const targetChannel = interaction.options.getChannel('channel') || interaction.channel;

    // Tạo embed bảng game
    const gameEmbed = new EmbedBuilder()
      .setTitle('🎮 TRUNG TÂM TRÒ CHƠI')
      .setDescription('**Chọn trò chơi bạn muốn chơi!**')
      .addFields(
        {
          name: '🎴 Xì Dách (Blackjack)',
          value: '• **Mục tiêu**: Đạt 21 điểm mà không vượt quá\n• **Cược**: 1 - 1,000 xu\n• **Tỷ lệ thắng**: 1:0.8 (cược 1000 → thắng 800)\n• **Tổng nhận**: Cược gốc + tiền thắng',
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
        }
      )
      .setColor('#ffdd57')
      .setThumbnail('https://cdn.discordapp.com/emojis/851461487498887168.png')
      .setFooter({ 
        text: 'Blackjack công bằng 100%! Luật chuẩn quốc tế được áp dụng.' 
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

    try {
      // Gửi embed với buttons
      const sentMessage = await targetChannel.send({
        embeds: [gameEmbed],
        components: [gameButtons]
      });

      await interaction.reply({
        content: `✅ Đã đăng bảng trò chơi tại ${targetChannel}!\n🔗 [Nhảy tới tin nhắn](${sentMessage.url})`,
        ephemeral: true
      });

    } catch (error) {
      console.error('Error posting game board:', error);
      await interaction.reply({
        content: '❌ Có lỗi xảy ra khi đăng bảng trò chơi!',
        ephemeral: true
      });
    }
  }
};
