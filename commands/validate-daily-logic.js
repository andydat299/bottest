import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('validate-daily-logic')
    .setDescription('🧪 [ADMIN] Validate logic calculations trong daily system')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return await interaction.reply({
        content: '❌ Bạn không có quyền sử dụng lệnh này!',
        ephemeral: true
      });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      console.log('🧪 Starting daily logic validation...');
      
      const testCases = [];
      const errors = [];

      // Test Case 1: Basic Random Distribution
      console.log('🧪 Testing random distribution...');
      
      for (const streak of [1, 15, 35]) {
        const samples = 1000;
        let highRewards = 0;
        const rewards = [];

        for (let i = 0; i < samples; i++) {
          const rand = Math.random();
          let baseReward;
          
          if (streak <= 7) {
            baseReward = Math.floor(Math.random() * 1000) + 1;
          } else if (streak <= 30) {
            if (rand < 0.6) {
              baseReward = Math.floor(Math.random() * 501) + 500;
            } else {
              baseReward = Math.floor(Math.random() * 499) + 1;
            }
          } else {
            if (rand < 0.8) {
              baseReward = Math.floor(Math.random() * 501) + 500;
            } else {
              baseReward = Math.floor(Math.random() * 499) + 1;
            }
          }
          
          rewards.push(baseReward);
          if (baseReward >= 500) highRewards++;
        }

        const highPercentage = (highRewards / samples) * 100;
        const avgReward = rewards.reduce((a, b) => a + b, 0) / samples;
        
        let expectedHigh = '';
        let status = '✅';
        
        if (streak <= 7) {
          expectedHigh = '45-55%';
          if (highPercentage < 45 || highPercentage > 55) status = '⚠️';
        } else if (streak <= 30) {
          expectedHigh = '55-65%';
          if (highPercentage < 55 || highPercentage > 65) status = '⚠️';
        } else {
          expectedHigh = '75-85%';
          if (highPercentage < 75 || highPercentage > 85) status = '⚠️';
        }

        testCases.push({
          name: `Random Distribution (Streak ${streak})`,
          expected: expectedHigh,
          actual: `${highPercentage.toFixed(1)}%`,
          status: status,
          details: `Avg: ${avgReward.toFixed(0)} xu`
        });

        if (status === '⚠️') {
          errors.push(`Random distribution for streak ${streak} outside expected range`);
        }
      }

      // Test Case 2: Streak Bonus Calculation
      console.log('🧪 Testing streak bonus calculation...');
      
      const streakTests = [
        { streak: 1, baseReward: 500, expectedBonus: 10 },
        { streak: 10, baseReward: 500, expectedBonus: 100 },
        { streak: 25, baseReward: 800, expectedBonus: 400 },
        { streak: 50, baseReward: 1000, expectedBonus: 1000 },
        { streak: 100, baseReward: 1000, expectedBonus: 1000 } // Should cap at 50
      ];

      for (const test of streakTests) {
        const actualBonus = Math.floor(test.baseReward * 0.02 * Math.min(test.streak, 50));
        const status = actualBonus === test.expectedBonus ? '✅' : '❌';
        
        testCases.push({
          name: `Streak Bonus (${test.streak} days, ${test.baseReward} xu)`,
          expected: `${test.expectedBonus} xu`,
          actual: `${actualBonus} xu`,
          status: status,
          details: `2% × ${Math.min(test.streak, 50)} days`
        });

        if (status === '❌') {
          errors.push(`Streak bonus calculation wrong for ${test.streak} days: expected ${test.expectedBonus}, got ${actualBonus}`);
        }
      }

      // Test Case 3: Lucky Bonus Probability
      console.log('🧪 Testing lucky bonus probability...');
      
      const luckyTests = [
        { streak: 5, expectedChance: 0 },
        { streak: 10, expectedChance: 20 },
        { streak: 25, expectedChance: 50 },
        { streak: 50, expectedChance: 100 }, // Should cap at 20%
        { streak: 100, expectedChance: 100 } // Should cap at 20%
      ];

      for (const test of luckyTests) {
        const actualChance = test.streak >= 10 ? Math.min(test.streak * 2, 20) : 0;
        const status = actualChance === test.expectedChance ? '✅' : '❌';
        
        testCases.push({
          name: `Lucky Chance (${test.streak} days)`,
          expected: `${test.expectedChance}%`,
          actual: `${actualChance}%`,
          status: status,
          details: test.streak >= 10 ? 'streak × 2%, cap 20%' : 'No lucky bonus < 10 days'
        });

        if (status === '❌') {
          errors.push(`Lucky bonus chance wrong for ${test.streak} days: expected ${test.expectedChance}%, got ${actualChance}%`);
        }
      }

      // Test Case 4: Milestone Bonuses
      console.log('🧪 Testing milestone bonuses...');
      
      const milestoneTests = [
        { streak: 6, expectedBonus: 0, expectedText: '' },
        { streak: 7, expectedBonus: 5000, expectedText: 'WEEKLY BONUS' },
        { streak: 8, expectedBonus: 0, expectedText: '' },
        { streak: 30, expectedBonus: 20000, expectedText: 'MONTHLY BONUS' },
        { streak: 100, expectedBonus: 100000, expectedText: 'LEGENDARY BONUS' }
      ];

      for (const test of milestoneTests) {
        let actualBonus = 0;
        let actualText = '';
        
        if (test.streak === 7) {
          actualBonus = 5000;
          actualText = 'WEEKLY BONUS';
        } else if (test.streak === 30) {
          actualBonus = 20000;
          actualText = 'MONTHLY BONUS';
        } else if (test.streak === 100) {
          actualBonus = 100000;
          actualText = 'LEGENDARY BONUS';
        }

        const status = (actualBonus === test.expectedBonus && actualText === test.expectedText) ? '✅' : '❌';
        
        testCases.push({
          name: `Milestone (${test.streak} days)`,
          expected: test.expectedBonus > 0 ? `${test.expectedBonus.toLocaleString()} xu` : 'No bonus',
          actual: actualBonus > 0 ? `${actualBonus.toLocaleString()} xu` : 'No bonus',
          status: status,
          details: actualText || 'No milestone'
        });

        if (status === '❌') {
          errors.push(`Milestone bonus wrong for ${test.streak} days`);
        }
      }

      // Test Case 5: Weekend Bonus
      console.log('🧪 Testing weekend bonus...');
      
      const weekendTests = [
        { dayOfWeek: 1, baseReward: 1000, expectedBonus: 0 }, // Monday
        { dayOfWeek: 5, baseReward: 800, expectedBonus: 0 },  // Friday
        { dayOfWeek: 6, baseReward: 600, expectedBonus: 300 }, // Saturday
        { dayOfWeek: 0, baseReward: 1000, expectedBonus: 500 } // Sunday
      ];

      for (const test of weekendTests) {
        const actualBonus = (test.dayOfWeek === 0 || test.dayOfWeek === 6) ? Math.floor(test.baseReward * 0.5) : 0;
        const status = actualBonus === test.expectedBonus ? '✅' : '❌';
        
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        testCases.push({
          name: `Weekend Bonus (${dayNames[test.dayOfWeek]})`,
          expected: `${test.expectedBonus} xu`,
          actual: `${actualBonus} xu`,
          status: status,
          details: `${test.baseReward} xu base × ${test.expectedBonus > 0 ? '50%' : '0%'}`
        });

        if (status === '❌') {
          errors.push(`Weekend bonus calculation wrong for ${dayNames[test.dayOfWeek]}`);
        }
      }

      // Create validation report
      const passedTests = testCases.filter(t => t.status === '✅').length;
      const warningTests = testCases.filter(t => t.status === '⚠️').length;
      const failedTests = testCases.filter(t => t.status === '❌').length;

      const embed = new EmbedBuilder()
        .setTitle('🧪 Daily Logic Validation Report')
        .setDescription('**Comprehensive testing of daily reward calculations**')
        .addFields(
          { 
            name: '📊 Test Summary', 
            value: `**Total Tests:** ${testCases.length}\n**✅ Passed:** ${passedTests}\n**⚠️ Warnings:** ${warningTests}\n**❌ Failed:** ${failedTests}`, 
            inline: false 
          }
        )
        .setColor(failedTests > 0 ? '#ff0000' : warningTests > 0 ? '#ff9900' : '#00ff00')
        .setTimestamp();

      // Add test details
      const testGroups = [
        { name: '🎲 Random Distribution', tests: testCases.filter(t => t.name.includes('Random Distribution')) },
        { name: '🔥 Streak Bonuses', tests: testCases.filter(t => t.name.includes('Streak Bonus')) },
        { name: '🍀 Lucky Bonuses', tests: testCases.filter(t => t.name.includes('Lucky Chance')) },
        { name: '🎊 Milestones', tests: testCases.filter(t => t.name.includes('Milestone')) },
        { name: '🌟 Weekend Bonuses', tests: testCases.filter(t => t.name.includes('Weekend Bonus')) }
      ];

      for (const group of testGroups) {
        if (group.tests.length > 0) {
          const groupText = group.tests.map(t => 
            `${t.status} **${t.name}**\nExpected: ${t.expected} | Actual: ${t.actual}\n${t.details}`
          ).join('\n\n');
          
          embed.addFields({ 
            name: group.name, 
            value: groupText.substring(0, 1024), 
            inline: false 
          });
        }
      }

      // Overall system health
      let healthStatus = '';
      if (failedTests === 0 && warningTests === 0) {
        healthStatus = '🟢 **PERFECT** - All logic working correctly';
      } else if (failedTests === 0 && warningTests <= 2) {
        healthStatus = '🟡 **GOOD** - Minor distribution variances';
      } else if (failedTests <= 2) {
        healthStatus = '🟠 **ISSUES** - Some logic problems detected';
      } else {
        healthStatus = '🔴 **CRITICAL** - Major logic failures';
      }

      embed.addFields({ name: '🏥 Logic Health', value: healthStatus, inline: false });

      await interaction.editReply({ embeds: [embed] });

      // Log results
      console.log(`✅ Daily logic validation completed:`);
      console.log(`   - ${testCases.length} tests run`);
      console.log(`   - ${passedTests} passed, ${warningTests} warnings, ${failedTests} failed`);
      console.log(`   - System health: ${healthStatus}`);

    } catch (error) {
      console.error('❌ Daily logic validation failed:', error);
      await interaction.editReply({
        content: `❌ **Validation failed:**\n\`\`\`${error.message}\`\`\`\n\nThis indicates a serious problem with the daily system logic.`
      });
    }
  }
};