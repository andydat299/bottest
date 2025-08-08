import { 
  SlashCommandBuilder, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} from 'discord.js';
import { User } from '../schemas/userSchema.js';
import { logMoneyReceived, logMoneyDeducted } from '../utils/logger.js';
import { isAdmin } from '../utils/adminUtils.js';

// Cấu hình vòng quay
const WHEEL_CONFIG = {
  minBet: 10,
  maxBet: 1000,
  sectors: [
    { emoji: '💀', name: 'Phá sản', multiplier: 0, chance: 25, color: '#000000' },
    { emoji: '😢', name: 'Mất nửa', multiplier: 0.5, chance: 28, color: '#ff4444' },
    { emoji: '😐', name: 'Hòa vốn', multiplier: 1, chance: 25, color: '#888888' },
    { emoji: '😊', name: 'Thắng ít', multiplier: 1.5, chance: 15, color: '#44ff44' },
    { emoji: '🤑', name: 'Thắng lớn', multiplier: 2.5, chance: 5, color: '#ffff44' },
    { emoji: '💎', name: 'Siêu thắng', multiplier: 5, chance: 1.8, color: '#44ffff' },
    { emoji: '🎰', name: 'JACKPOT!', multiplier: 10, chance: 0.2, color: '#ff44ff' }
  ]
};

// Lưu trữ game đang chơi
const activeGames = new Map();

export default {
  data: new SlashCommandBuilder()
    .setName('wheel')
    .setDescription('🎡 Quay bánh xe may mắn')
    .addIntegerOption(option =>
      option.setName('bet')
        .setDescription('Số xu đặt cược (1 - 1,000) - để trống để dùng free spin')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(1000)
    )
    .addBooleanOption(option =>
      option.setName('free')
        .setDescription('Sử dụng lượt quay miễn phí hàng ngày (nếu có)')
        .setRequired(false)
    ),

  async execute(interaction) {
    try {
      const { User } = await import('../schemas/userSchema.js');
      const { DailyReward } = await import('../schemas/dailyRewardSchema.js');
      const customBet = interaction.options.getInteger('bet');
      const useFree = interaction.options.getBoolean('free') || false;
      const defaultSpinCost = 5000; // Default cost when no custom bet

      await interaction.deferReply();

      // Check user exists
      let user = await User.findOne({ discordId: interaction.user.id });
      if (!user) {
        user = new User({
          discordId: interaction.user.id,
          username: interaction.user.username,
          balance: 0
        });
        await user.save();
      }

      // Determine spin cost and type
      let spinCost = defaultSpinCost;
      let usingFreeSpin = false;
      let usingCustomBet = false;

      if (customBet) {
        // Using custom bet (1-1000 xu)
        spinCost = customBet;
        usingCustomBet = true;
        
        if (user.balance < spinCost) {
          const embed = new EmbedBuilder()
            .setTitle('💸 Không đủ xu!')
            .setDescription(`**Bạn cần ${spinCost.toLocaleString()} xu để chơi**`)
            .addFields(
              { name: '💳 Số dư hiện tại', value: `${user.balance.toLocaleString()} xu`, inline: true },
              { name: '💡 Gợi ý', value: 'Dùng `/daily` để nhận xu miễn phí!', inline: true }
            )
            .setColor('#ff0000')
            .setTimestamp();

          return await interaction.editReply({ embeds: [embed] });
        }
      } else {
        // Check for free daily spin
        let dailyReward = await DailyReward.findOne({ userId: interaction.user.id });
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        let hasFreeSpin = false;
        if (dailyReward && dailyReward.lastClaimDate) {
          const lastClaimDate = new Date(dailyReward.lastClaimDate.getFullYear(), dailyReward.lastClaimDate.getMonth(), dailyReward.lastClaimDate.getDate());
          hasFreeSpin = lastClaimDate.getTime() === today.getTime() && (!dailyReward.wheelSpinUsed);
        }

        if (useFree && hasFreeSpin) {
          usingFreeSpin = true;
          spinCost = 0;
        } else if (useFree && !hasFreeSpin) {
          const embed = new EmbedBuilder()
            .setTitle('🎡 Không có lượt quay miễn phí!')
            .setDescription('**Bạn đã sử dụng lượt quay miễn phí hôm nay hoặc chưa claim daily!**')
            .addFields(
              { name: '💡 Gợi ý', value: `• Dùng \`/daily\` để claim và nhận free spin\n• Hoặc thêm \`bet\` để quay với 1-1000 xu`, inline: false },
              { name: '💳 Số dư hiện tại', value: `${user.balance.toLocaleString()} xu`, inline: true }
            )
            .setColor('#ff9900')
            .setTimestamp();

          return await interaction.editReply({ embeds: [embed] });
        } else {
          // Default paid spin
          if (user.balance < defaultSpinCost) {
            const embed = new EmbedBuilder()
              .setTitle('💸 Không đủ xu!')
              .setDescription(`**Bạn cần ${defaultSpinCost.toLocaleString()} xu để quay bánh xe**`)
              .addFields(
                { name: '💳 Số dư hiện tại', value: `${user.balance.toLocaleString()} xu`, inline: true },
                { name: '💡 Gợi ý', value: 'Dùng `/daily` để nhận xu miễn phí hoặc thêm bet nhỏ hơn (1-1000 xu)!', inline: true }
              )
              .setColor('#ff0000')
              .setTimestamp();

            return await interaction.editReply({ embeds: [embed] });
          }
        }
      }

      // Lucky wheel segments with weights
      const wheelSegments = [
        { emoji: '💰', name: 'Small Win', reward: 8000, weight: 25 },
        { emoji: '🍒', name: 'Cherry Bonus', reward: 12000, weight: 20 },
        { emoji: '⭐', name: 'Star Prize', reward: 20000, weight: 15 },
        { emoji: '💎', name: 'Diamond Jackpot', reward: 50000, weight: 8 },
        { emoji: '🎁', name: 'Mystery Box', reward: 25000, weight: 12 },
        { emoji: '🍀', name: 'Lucky Clover', reward: 35000, weight: 10 },
        { emoji: '🔥', name: 'Fire Bonus', reward: 15000, weight: 15 },
        { emoji: '👑', name: 'Royal Prize', reward: 100000, weight: 3 },
        { emoji: '💀', name: 'Skull (Lose)', reward: 0, weight: 12 },
        { emoji: '🎪', name: 'Carnival Special', reward: 75000, weight: 5 }
      ];

      // Weighted random selection
      const totalWeight = wheelSegments.reduce((sum, segment) => sum + segment.weight, 0);
      let random = Math.random() * totalWeight;
      
      let selectedSegment;
      for (const segment of wheelSegments) {
        random -= segment.weight;
        if (random <= 0) {
          selectedSegment = segment;
          break;
        }
      }

      // Calculate final reward based on spin cost
      let finalReward = selectedSegment.reward;
      
      if (usingCustomBet) {
        // Scale rewards based on bet amount (1-1000 xu)
        const scaleFactor = customBet / 100; // Scale based on bet
        finalReward = Math.floor(selectedSegment.reward * scaleFactor * 0.1); // Reduced for small bets
      }
      
      let bonusMultiplier = 1;
      
      // Streak bonus for daily users
      const dailyReward = await DailyReward.findOne({ userId: interaction.user.id });
      if (dailyReward && dailyReward.currentStreak > 0) {
        bonusMultiplier = 1 + (dailyReward.currentStreak * 0.02); // +2% per streak day
        finalReward = Math.floor(finalReward * bonusMultiplier);
      }

      // Apply costs and rewards
      if (!usingFreeSpin) {
        user.balance -= spinCost;
      }
      
      user.balance += finalReward;
      await user.save();

      // Mark free spin as used
      if (usingFreeSpin && dailyReward) {
        dailyReward.wheelSpinUsed = true;
        await dailyReward.save();
      }

      // Create wheel animation display
      const wheelDisplay = `
🎡 **LUCKY WHEEL** 🎡
     ${wheelSegments[0].emoji}
  ${wheelSegments[7].emoji}     ${wheelSegments[1].emoji}
${wheelSegments[6].emoji}   🎯   ${wheelSegments[2].emoji}
  ${wheelSegments[5].emoji}     ${wheelSegments[3].emoji}
     ${wheelSegments[4].emoji}

🎯 **LANDED ON: ${selectedSegment.emoji} ${selectedSegment.name}**
`;

      const netGain = usingFreeSpin ? finalReward : finalReward - spinCost;
      const resultColor = finalReward > 0 ? '#00ff00' : '#ff0000';

      let spinTypeText = '';
      if (usingFreeSpin) {
        spinTypeText = '🆓 Free Daily Spin';
      } else if (usingCustomBet) {
        spinTypeText = `💰 Custom Bet (${spinCost.toLocaleString()} xu)`;
      } else {
        spinTypeText = `💰 Standard Spin (${spinCost.toLocaleString()} xu)`;
      }

      const embed = new EmbedBuilder()
        .setTitle('🎡 Lucky Wheel Results')
        .setDescription(wheelDisplay)
        .addFields(
          { name: '🎟️ Spin Type', value: spinTypeText, inline: true },
          { name: '🎁 Base Reward', value: `${selectedSegment.reward.toLocaleString()} xu`, inline: true },
          { name: '🔥 Streak Bonus', value: bonusMultiplier > 1 ? `×${bonusMultiplier.toFixed(2)} (${Math.floor((bonusMultiplier - 1) * 100)}%)` : 'None', inline: true },
          { name: '💰 Final Reward', value: `${finalReward.toLocaleString()} xu`, inline: true },
          { name: '📊 Net Result', value: netGain >= 0 ? `+${netGain.toLocaleString()} xu` : `${netGain.toLocaleString()} xu`, inline: true },
          { name: '💳 New Balance', value: `${user.balance.toLocaleString()} xu`, inline: true }
        )
        .setColor(resultColor)
        .setThumbnail(interaction.user.displayAvatarURL())
        .setTimestamp();

      // Add special messages
      if (selectedSegment.reward === 0) {
        embed.addFields({ name: '💀 Bad Luck!', value: 'Better luck next time! The wheel can be cruel...', inline: false });
      } else if (selectedSegment.reward >= 75000) {
        embed.addFields({ name: '🎊 MEGA WIN!', value: 'Incredible! You hit one of the rarest prizes!', inline: false });
      } else if (selectedSegment.reward >= 35000) {
        embed.addFields({ name: '🎉 BIG WIN!', value: 'Fantastic! That\'s a great spin!', inline: false });
      }

      // Add wheel info
      const wheelInfo = `
**🎡 Wheel Probabilities:**
💰 Small prizes: ~60% chance
⭐ Medium prizes: ~25% chance
💎 Big prizes: ~13% chance
👑 Mega jackpot: ~3% chance
💀 Lose: ~12% chance

**💡 Tips:**
• Use free daily spin after \`/daily\`
• Streak bonus increases all rewards!
• Cost: ${spinCost.toLocaleString()} xu per spin
`;

      embed.addFields({ name: '📈 Wheel Info', value: wheelInfo, inline: false });

      await interaction.editReply({ embeds: [embed] });

      console.log(`🎡 Wheel spun by ${interaction.user.username}: ${usingFreeSpin ? 'free' : 'paid'}, landed on ${selectedSegment.name}, won ${finalReward}, net ${netGain}`);

    } catch (error) {
      console.error('❌ Wheel error:', error);
      
      try {
        await interaction.editReply({
          content: '❌ **Có lỗi khi quay bánh xe!**\n\nVui lòng thử lại sau.',
          ephemeral: true
        });
      } catch (replyError) {
        console.error('❌ Could not send error reply:', replyError);
      }
    }
  }
};
