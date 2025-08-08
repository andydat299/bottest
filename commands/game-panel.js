import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('game-panel')
    .setDescription('🎮 [ADMIN] Hiển thị panel game cho người chơi')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return await interaction.reply({
        content: '❌ Bạn không có quyền sử dụng lệnh này!',
        ephemeral: true
      });
    }

    try {
      // Create game panel embed
      const panelEmbed = new EmbedBuilder()
        .setTitle('🎮 GAME CENTER - CASINO MINI GAMES')
        .setDescription('**Chọn game bạn muốn chơi bằng cách nhấn vào các button bên dưới!**')
        .addFields(
          {
            name: '🎰 Slots Machine',
            value: '• **Bet:** 1 - 1,000 xu\n• **Cách chơi:** 3 cuộn slots với symbols\n• **Thắng:** 2-3 symbols giống nhau\n• **Jackpot:** 3 💎 hoặc 🎰 = Big win!',
            inline: true
          },
          {
            name: '🎲 Dice (Tài Xỉu)',
            value: '• **Bet:** 1 - 1,000 xu\n• **Cách chơi:** Đoán tổng 3 xúc xắc\n• **Tài:** 11-18 điểm\n• **Xỉu:** 3-10 điểm\n• **Payout:** 1:1 (fair game)',
            inline: true
          },
          {
            name: '🎡 Lucky Wheel',
            value: '• **Cost:** 1 - 1,000 xu\n• **Cách chơi:** Quay bánh xe may mắn\n• **Rewards:** Từ 0 đến 100,000 xu\n• **Free spin:** Sau khi `/daily`\n• **Streak bonus:** +2% mỗi ngày',
            inline: true
          },
          {
            name: '🎯 Game Rules',
            value: '• **Bet limit:** 1 - 1,000 xu mỗi lần chơi\n• **Fair play:** RNG công bằng\n• **Balance check:** Tự động kiểm tra số dư\n• **Daily bonus:** Dùng `/daily` để nhận xu',
            inline: false
          },
          {
            name: '💡 Tips',
            value: '• Bắt đầu với bet nhỏ để học cách chơi\n• Sử dụng `/balance` để kiểm tra số dư\n• Nhận xu miễn phí với `/daily` mỗi ngày\n• Chơi có trách nhiệm và vui vẻ!',
            inline: false
          }
        )
        .setColor('#00aaff')
        .setThumbnail('🎮')
        .setFooter({ text: 'Casino Games • Chơi có trách nhiệm' })
        .setTimestamp();

      // Create action rows with game buttons
      const gameButtons = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('play_slots')
            .setLabel('🎰 Slots')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('play_dice')
            .setLabel('🎲 Dice')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('play_wheel')
            .setLabel('🎡 Wheel')
            .setStyle(ButtonStyle.Secondary)
        );

      const utilityButtons = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('check_balance')
            .setLabel('💳 Balance')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('daily_claim')
            .setLabel('🎁 Daily')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('game_stats')
            .setLabel('📊 Stats')
            .setStyle(ButtonStyle.Secondary)
        );

      await interaction.reply({
        embeds: [panelEmbed],
        components: [gameButtons, utilityButtons]
      });

      console.log(`🎮 Game panel displayed by admin ${interaction.user.username}`);

    } catch (error) {
      console.error('❌ Game panel error:', error);
      await interaction.reply({
        content: '❌ **Có lỗi khi hiển thị game panel!**',
        ephemeral: true
      });
    }
  }
};