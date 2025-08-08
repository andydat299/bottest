import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('dice')
    .setDescription('🎲 Chơi tài xỉu với 3 con xúc xắc')
    .addIntegerOption(option =>
      option.setName('bet')
        .setDescription('Số xu đặt cược (1 - 1,000)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(1000)
    )
    .addStringOption(option =>
      option.setName('choice')
        .setDescription('Chọn Tài (11-18) hoặc Xỉu (3-10)')
        .setRequired(true)
        .addChoices(
          { name: '🔺 TÀI (11-18)', value: 'tai' },
          { name: '🔻 XỈU (3-10)', value: 'xiu' }
        )
    ),

  async execute(interaction) {
    try {
      const { User } = await import('../schemas/userSchema.js');
      const betAmount = interaction.options.getInteger('bet');
      const userChoice = interaction.options.getString('choice');

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

      // Roll 3 dice
      const dice1 = Math.floor(Math.random() * 6) + 1;
      const dice2 = Math.floor(Math.random() * 6) + 1;
      const dice3 = Math.floor(Math.random() * 6) + 1;
      const total = dice1 + dice2 + dice3;

      // Determine actual result
      const actualResult = total >= 11 ? 'tai' : 'xiu';
      const actualResultText = total >= 11 ? '🔺 TÀI' : '🔻 XỈU';

      // Check win/loss
      const isWin = userChoice === actualResult;
      const winAmount = isWin ? betAmount * 2 : 0; // 1:1 payout (double your bet)
      const netGain = winAmount - betAmount;

      // Update user balance
      user.balance += netGain;
      await user.save();

      // Dice emoji mapping
      const diceEmojis = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
      const dice1Emoji = diceEmojis[dice1 - 1];
      const dice2Emoji = diceEmojis[dice2 - 1];
      const dice3Emoji = diceEmojis[dice3 - 1];

      // Create dice display
      const diceDisplay = `
🎲 **DICE RESULTS** 🎲
╔════════════════╗
║  ${dice1Emoji}  +  ${dice2Emoji}  +  ${dice3Emoji}  ║
║    ${dice1}  +  ${dice2}  +  ${dice3} = ${total}    ║
╚════════════════╝
`;

      const userChoiceText = userChoice === 'tai' ? '🔺 TÀI' : '🔻 XỈU';
      const resultColor = isWin ? '#00ff00' : '#ff0000';
      const resultEmoji = isWin ? '🎉' : '💔';
      const resultText = isWin ? '**YOU WIN!**' : '**YOU LOSE!**';

      const embed = new EmbedBuilder()
        .setTitle('🎲 Tài Xỉu Results')
        .setDescription(`${diceDisplay}\n${resultEmoji} ${resultText}`)
        .addFields(
          { name: '🎯 Your Choice', value: userChoiceText, inline: true },
          { name: '🎲 Actual Result', value: `${actualResultText} (${total})`, inline: true },
          { name: '💰 Outcome', value: isWin ? '✅ CORRECT!' : '❌ WRONG!', inline: true },
          { name: '💸 Bet Amount', value: `${betAmount.toLocaleString()} xu`, inline: true },
          { name: '🎁 Win Amount', value: `${winAmount.toLocaleString()} xu`, inline: true },
          { name: '📊 Net Result', value: netGain >= 0 ? `+${netGain.toLocaleString()} xu` : `${netGain.toLocaleString()} xu`, inline: true },
          { name: '💳 New Balance', value: `${user.balance.toLocaleString()} xu`, inline: false }
        )
        .setColor(resultColor)
        .setThumbnail(interaction.user.displayAvatarURL())
        .setTimestamp();

      // Add game stats
      const gameInfo = `
**🎯 How to Play:**
• TÀI: Total 11-18 (High)
• XỈU: Total 3-10 (Low)  
• Win Rate: 50/50
• Payout: 1:1 (Double your bet)

**📊 This Round:**
• Probability: 50%
• House Edge: 0% (Fair game!)
`;

      embed.addFields({ name: '📈 Game Info', value: gameInfo, inline: false });

      // Add special messages for edge cases
      if (total === 3 || total === 18) {
        embed.addFields({ name: '🎲 Extreme Roll!', value: `You rolled ${total} - that's rare! (2.8% chance)`, inline: false });
      } else if (total === 10 || total === 11) {
        embed.addFields({ name: '⚖️ Edge Case!', value: `You rolled ${total} - right on the border!`, inline: false });
      }

      await interaction.editReply({ embeds: [embed] });

      console.log(`🎲 Dice played by ${interaction.user.username}: chose ${userChoice}, rolled ${total} (${actualResult}), bet ${betAmount}, net ${netGain}`);

    } catch (error) {
      console.error('❌ Dice error:', error);
      
      try {
        await interaction.editReply({
          content: '❌ **Có lỗi khi chơi tài xỉu!**\n\nVui lòng thử lại sau.',
          ephemeral: true
        });
      } catch (replyError) {
        console.error('❌ Could not send error reply:', replyError);
      }
    }
  }
};