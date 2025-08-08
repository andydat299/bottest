import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('slots')
    .setDescription('🎰 Chơi máy đánh bạc slots')
    .addIntegerOption(option =>
      option.setName('bet')
        .setDescription('Số xu đặt cược (1 - 1,000)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(1000)
    ),

  async execute(interaction) {
    try {
      const { User } = await import('../schemas/userSchema.js');
      const betAmount = interaction.options.getInteger('bet');

      await interaction.deferReply();

      // Check user exists and has enough balance
      let user = await User.findOne({ discordId: interaction.user.id });
      if (!user) {
        user = new User({
          discordId: interaction.user.id,
          username: interaction.user.username,
          balance: 0
        });
        await user.save();
      }

      if (user.balance < betAmount) {
        const embed = new EmbedBuilder()
          .setTitle('💸 Không đủ xu!')
          .setDescription(`**Bạn cần ${betAmount.toLocaleString()} xu để chơi**`)
          .addFields(
            { name: '💳 Số dư hiện tại', value: `${user.balance.toLocaleString()} xu`, inline: true },
            { name: '💡 Gợi ý', value: 'Dùng `/daily` để nhận xu miễn phí!', inline: true }
          )
          .setColor('#ff0000')
          .setTimestamp();

        return await interaction.editReply({ embeds: [embed] });
      }

      // Slots symbols and their values
      const symbols = {
        '🍒': { value: 1, name: 'Cherry' },
        '🍋': { value: 2, name: 'Lemon' },
        '🍊': { value: 3, name: 'Orange' },
        '🍇': { value: 4, name: 'Grapes' },
        '⭐': { value: 8, name: 'Star' },
        '💎': { value: 15, name: 'Diamond' },
        '🎰': { value: 25, name: 'Jackpot' }
      };

      const symbolKeys = Object.keys(symbols);

      // Generate 3 random symbols
      const reel1 = symbolKeys[Math.floor(Math.random() * symbolKeys.length)];
      const reel2 = symbolKeys[Math.floor(Math.random() * symbolKeys.length)];
      const reel3 = symbolKeys[Math.floor(Math.random() * symbolKeys.length)];

      // Calculate win
      let winMultiplier = 0;
      let winType = '';
      let resultColor = '#ff0000'; // Red for loss

      if (reel1 === reel2 && reel2 === reel3) {
        // Three of a kind - JACKPOT!
        winMultiplier = symbols[reel1].value * 10;
        winType = `🎉 **JACKPOT!** 3x ${symbols[reel1].name}`;
        resultColor = '#gold';
      } else if (reel1 === reel2 || reel2 === reel3 || reel1 === reel3) {
        // Two of a kind
        const matchingSymbol = reel1 === reel2 ? reel1 : (reel2 === reel3 ? reel2 : reel1);
        winMultiplier = symbols[matchingSymbol].value * 2;
        winType = `✨ **2x Match!** ${symbols[matchingSymbol].name}`;
        resultColor = '#00ff00';
      } else {
        // No match
        winType = '💔 **No match** - Better luck next time!';
        resultColor = '#ff0000';
      }

      const winAmount = Math.floor(betAmount * winMultiplier);
      const netGain = winAmount - betAmount;

      // Update user balance
      user.balance += netGain;
      await user.save();

      // Create animated slots display
      const slotsDisplay = `
🎰 **SLOTS MACHINE** 🎰
╔═══════════════╗
║  ${reel1}  │  ${reel2}  │  ${reel3}  ║
╚═══════════════╝
`;

      const embed = new EmbedBuilder()
        .setTitle('🎰 Slots Machine Results')
        .setDescription(`${slotsDisplay}\n${winType}`)
        .addFields(
          { name: '💰 Bet Amount', value: `${betAmount.toLocaleString()} xu`, inline: true },
          { name: '🎯 Win Amount', value: `${winAmount.toLocaleString()} xu`, inline: true },
          { name: '📊 Net Result', value: netGain >= 0 ? `+${netGain.toLocaleString()} xu` : `${netGain.toLocaleString()} xu`, inline: true },
          { name: '💳 New Balance', value: `${user.balance.toLocaleString()} xu`, inline: false }
        )
        .setColor(resultColor)
        .setThumbnail(interaction.user.displayAvatarURL())
        .setTimestamp();

      // Add special messages for big wins
      if (winMultiplier >= 100) {
        embed.addFields({ name: '👑 MEGA WIN!', value: 'Congratulations! You hit a massive jackpot!', inline: false });
      } else if (winMultiplier >= 50) {
        embed.addFields({ name: '🎊 BIG WIN!', value: 'Amazing! That\'s a big payout!', inline: false });
      } else if (winMultiplier > 0) {
        embed.addFields({ name: '🎉 Winner!', value: 'Nice job! You came out ahead!', inline: false });
      }

      // Add probability info
      const probabilityText = `
**🎲 Odds:**
• Two Match: ~27% chance
• Three Match: ~4.7% chance  
• Jackpot (💎/🎰): ~0.7% chance
`;

      embed.addFields({ name: '📈 Game Info', value: probabilityText, inline: false });

      await interaction.editReply({ embeds: [embed] });

      console.log(`🎰 Slots played by ${interaction.user.username}: bet ${betAmount}, won ${winAmount}, net ${netGain}`);

    } catch (error) {
      console.error('❌ Slots error:', error);
      
      try {
        await interaction.editReply({
          content: '❌ **Có lỗi khi chơi slots!**\n\nVui lòng thử lại sau.',
          ephemeral: true
        });
      } catch (replyError) {
        console.error('❌ Could not send error reply:', replyError);
      }
    }
  }
};