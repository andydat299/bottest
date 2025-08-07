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
    .setDescription('🎮 Đăng bảng trò chơi cho người dùng tham gia')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
      option.setName('game')
        .setDescription('Trò chơi để đăng')
        .addChoices(
          { name: '🎴 Xì Dách', value: 'blackjack' },
          { name: '🎡 Vòng Quay May Mắn', value: 'wheel' },
          { name: '🎯 Tất cả trò chơi', value: 'all' }
        )
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

    try {
      const gameType = interaction.options.getString('game') || 'all';
      
      if (gameType === 'all' || gameType === 'blackjack') {
        const blackjackEmbed = new EmbedBuilder()
          .setTitle('🎴 BẢNG TRÒ CHƠI XÌ DÁCH')
          .setDescription('**Chào mừng đến với Casino! Hãy thử vận may của bạn với Xì Dách!**')
          .addFields(
            {
              name: '🎯 Cách chơi',
              value: '• Ấn "Chơi Xì Dách" để bắt đầu\n• Nhập số xu cược của bạn (1-1000 xu)\n• Cố gắng đạt được 21 điểm càng gần càng tốt\n• Đánh bại dealer để thắng!',
              inline: false
            },
            {
              name: '💰 Tiền thưởng',
              value: '• **Xì Dách**: 1.8x số xu cược\n• **Thắng thường**: 1.8x số xu cược\n• **Hòa**: Nhận lại số xu cược\n• **Thua**: Mất số xu cược',
              inline: true
            },
            {
              name: '📋 Luật chơi',
              value: '• Dealer rút thêm bài khi có 16 điểm, dừng lại ở 17 điểm\n• Át có giá trị là 1 hoặc 11\n• Các lá bài hình người có giá trị là 10\n• Cược tối đa: 1000 xu',
              inline: true
            }
          )
          .setColor('#ffdd57')
          .setFooter({ text: 'Chúc bạn may mắn và chơi có trách nhiệm!' })
          .setTimestamp();

        await interaction.channel.send({ embeds: [blackjackEmbed] });
      }

      if (gameType === 'all' || gameType === 'wheel') {
        const wheelEmbed = new EmbedBuilder()
          .setTitle('🎡 VÒNG QUAY MAY MẮN')
          .setDescription('**Hãy quay vòng và giành những phần thưởng lớn!**')
          .addFields(
            {
              name: '🎯 Cách chơi',
              value: '• Sử dụng `/wheel play` để quay\n• Chọn số xu cược của bạn\n• Theo dõi vòng quay\n• Thắng dựa trên vị trí mà nó dừng lại!',
              inline: false
            },
            {
              name: '🏆 Giải thưởng',
              value: '• **Jackpot** (1%): 10x số xu cược\n• **Thắng lớn** (5%): 5x số xu cược\n• **Thắng** (15%): 2x số xu cược\n• **Thắng nhỏ** (25%): 1.5x số xu cược',
              inline: true
            },
            {
              name: '📊 Tỷ lệ',
              value: '• **Thua** (54%): Mất số xu cược\n• **RTP tổng thể**: ~85%\n• **Lợi thế nhà cái**: 15%\n• **Cược tối đa**: 1000 xu',
              inline: true
            }
          )
          .setColor('#4ecdc4')
          .setFooter({ text: 'Hãy quay có trách nhiệm!' })
          .setTimestamp();

        await interaction.channel.send({ embeds: [wheelEmbed] });
      }
      
      await interaction.reply({
        content: `✅ ${gameType === 'all' ? 'Tất cả trò chơi' : gameType} đã được đăng thành công!`,
        ephemeral: true
      });

    } catch (error) {
      console.error('Lỗi trong post-games:', error);
      await interaction.reply({
        content: '❌ Đã xảy ra lỗi khi đăng trò chơi.',
        ephemeral: true
      });
    }
  }
};
