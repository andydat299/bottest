import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('test-daily-luck')
    .setDescription('🎲 [ADMIN] Test daily luck system với streak khác nhau')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addIntegerOption(option =>
      option.setName('streak')
        .setDescription('Streak để test (1-100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    )
    .addIntegerOption(option =>
      option.setName('simulations')
        .setDescription('Số lần simulation (default 10)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(50)
    ),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return await interaction.reply({
        content: '❌ Bạn không có quyền sử dụng lệnh này!',
        ephemeral: true
      });
    }

    const testStreak = interaction.options.getInteger('streak');
    const simulations = interaction.options.getInteger('simulations') || 10;

    await interaction.deferReply({ ephemeral: true });

    try {
      console.log(`🎲 Testing daily luck system with streak ${testStreak}, ${simulations} simulations`);

      const results = [];
      let totalRewards = 0;
      let highRewards = 0; // Count rewards >= 500

      for (let i = 0; i < simulations; i++) {
        const minReward = 1;
        const maxReward = 1000;
        
        let baseRandomReward;
        const rand = Math.random();
        
        if (testStreak <= 7) {
          // Normal distribution (1-1000)
          baseRandomReward = Math.floor(Math.random() * maxReward) + minReward;
        } else if (testStreak <= 30) {
          // Good luck - 60% chance for upper half (500-1000), 40% for lower half (1-499)
          if (rand < 0.6) {
            baseRandomReward = Math.floor(Math.random() * 501) + 500; // 500-1000
          } else {
            baseRandomReward = Math.floor(Math.random() * 499) + 1; // 1-499
          }
        } else {
          // Great luck - 80% chance for upper half, 20% for lower half
          if (rand < 0.8) {
            baseRandomReward = Math.floor(Math.random() * 501) + 500; // 500-1000
          } else {
            baseRandomReward = Math.floor(Math.random() * 499) + 1; // 1-499
          }
        }
        
        // Calculate full rewards like in daily command
        const streakBonus = Math.floor(baseRandomReward * 0.02 * Math.min(testStreak, 50));
        
        // Lucky bonus
        let luckyBonus = 0;
        if (testStreak >= 10) {
          const luckyChance = Math.min(testStreak * 2, 20) / 100;
          if (Math.random() < luckyChance) {
            luckyBonus = Math.floor(Math.random() * 2000) + 500;
          }
        }
        
        const totalReward = baseRandomReward + streakBonus + luckyBonus;
        
        results.push({
          base: baseRandomReward,
          streak: streakBonus,
          lucky: luckyBonus,
          total: totalReward
        });
        
        totalRewards += totalReward;
        if (baseRandomReward >= 500) highRewards++;
      }

      // Calculate statistics
      const averageReward = Math.floor(totalRewards / simulations);
      const minTotal = Math.min(...results.map(r => r.total));
      const maxTotal = Math.max(...results.map(r => r.total));
      const highRewardPercentage = Math.floor((highRewards / simulations) * 100);

      // Determine luck level
      let luckLevel = '';
      let expectedHighPercentage = '';
      
      if (testStreak <= 7) {
        luckLevel = '🎲 Normal Luck';
        expectedHighPercentage = '50%';
      } else if (testStreak <= 30) {
        luckLevel = '🍀 Good Luck';
        expectedHighPercentage = '60%';
      } else {
        luckLevel = '✨ Great Luck';
        expectedHighPercentage = '80%';
      }

      const embed = new EmbedBuilder()
        .setTitle('🎲 Daily Luck System Test')
        .setDescription(`**Testing với streak ${testStreak} ngày**`)
        .addFields(
          { name: '🍀 Luck Level', value: luckLevel, inline: true },
          { name: '🎯 Expected High %', value: expectedHighPercentage, inline: true },
          { name: '📊 Actual High %', value: `${highRewardPercentage}%`, inline: true },
          { name: '📈 Simulations', value: `${simulations} lần test`, inline: true },
          { name: '💰 Average Total', value: `${averageReward.toLocaleString()} xu`, inline: true },
          { name: '📊 Range', value: `${minTotal.toLocaleString()} - ${maxTotal.toLocaleString()} xu`, inline: true }
        )
        .setColor('#3498db')
        .setTimestamp();

      // Add detailed results for small simulations
      if (simulations <= 10) {
        const detailsText = results.map((r, i) => 
          `**#${i+1}:** ${r.base} + ${r.streak} + ${r.lucky} = **${r.total}** xu`
        ).join('\n');
        
        embed.addFields({ 
          name: '📋 Chi tiết kết quả', 
          value: detailsText.length > 1024 ? detailsText.substring(0, 1020) + '...' : detailsText, 
          inline: false 
        });
      }

      // Add luck bonus info
      if (testStreak >= 10) {
        const luckyChance = Math.min(testStreak * 2, 20);
        const luckyCount = results.filter(r => r.lucky > 0).length;
        embed.addFields({ 
          name: '🍀 Lucky Bonus Stats', 
          value: `**Chance:** ${luckyChance}%\n**Triggered:** ${luckyCount}/${simulations} lần`, 
          inline: true 
        });
      }

      await interaction.editReply({ embeds: [embed] });

      console.log(`✅ Daily luck test completed: streak ${testStreak}, avg ${averageReward}, high% ${highRewardPercentage}%`);

    } catch (error) {
      console.error('❌ Daily luck test error:', error);
      await interaction.editReply({
        content: `❌ **Lỗi khi test daily luck:**\n\`\`\`${error.message}\`\`\``
      });
    }
  }
};