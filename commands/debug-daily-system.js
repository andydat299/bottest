import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('debug-daily-system')
    .setDescription('🔍 [ADMIN] Kiểm tra toàn bộ hệ thống daily rewards')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User để debug (để trống = tất cả)')
        .setRequired(false)
    ),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return await interaction.reply({
        content: '❌ Bạn không có quyền sử dụng lệnh này!',
        ephemeral: true
      });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      console.log('🔍 Starting daily system debug...');
      
      const { DailyReward } = await import('../schemas/dailyRewardSchema.js');
      const { User } = await import('../schemas/userSchema.js');

      const targetUser = interaction.options.getUser('user');
      const issues = [];
      const warnings = [];
      const stats = {
        totalUsers: 0,
        activeStreaks: 0,
        brokenStreaks: 0,
        invalidData: 0,
        highestStreak: 0,
        totalRewards: 0
      };

      // 1. Database Schema Validation
      console.log('🔍 Checking database schemas...');
      try {
        const sampleDailyReward = await DailyReward.findOne();
        const sampleUser = await User.findOne();
        console.log('✅ Database schemas accessible');
      } catch (dbError) {
        issues.push(`❌ Database connection issue: ${dbError.message}`);
      }

      // 2. Check Daily Reward Records
      console.log('🔍 Analyzing daily reward records...');
      
      const query = targetUser ? { userId: targetUser.id } : {};
      const dailyRewards = await DailyReward.find(query);
      stats.totalUsers = dailyRewards.length;

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      for (const record of dailyRewards) {
        // Check data integrity
        if (!record.userId || !record.username) {
          issues.push(`❌ Missing required fields for record ${record._id}`);
          stats.invalidData++;
          continue;
        }

        // Check streak consistency
        if (record.currentStreak > record.longestStreak) {
          issues.push(`❌ Current streak (${record.currentStreak}) > longest streak (${record.longestStreak}) for user ${record.username}`);
        }

        // Check negative values
        if (record.currentStreak < 0 || record.totalClaims < 0 || record.totalRewards < 0) {
          issues.push(`❌ Negative values found for user ${record.username}`);
          stats.invalidData++;
        }

        // Check last claim date logic
        if (record.lastClaimDate) {
          const lastClaim = new Date(record.lastClaimDate.getFullYear(), record.lastClaimDate.getMonth(), record.lastClaimDate.getDate());
          const daysDiff = Math.floor((today - lastClaim) / (1000 * 60 * 60 * 24));
          
          if (daysDiff > 1 && record.currentStreak > 0) {
            warnings.push(`⚠️ User ${record.username} has streak ${record.currentStreak} but last claimed ${daysDiff} days ago`);
            stats.brokenStreaks++;
          } else if (daysDiff <= 1 && record.currentStreak > 0) {
            stats.activeStreaks++;
          }

          // Check future dates
          if (lastClaim > today) {
            issues.push(`❌ Future claim date for user ${record.username}: ${lastClaim.toDateString()}`);
          }
        }

        // Update stats
        if (record.longestStreak > stats.highestStreak) {
          stats.highestStreak = record.longestStreak;
        }
        stats.totalRewards += record.totalRewards;

        // Check reward calculation consistency
        if (record.totalClaims > 0) {
          const avgReward = record.totalRewards / record.totalClaims;
          if (avgReward > 50000) { // Suspiciously high average
            warnings.push(`⚠️ Very high average reward for user ${record.username}: ${Math.floor(avgReward).toLocaleString()} xu`);
          }
          if (avgReward < 1) { // Suspiciously low average
            warnings.push(`⚠️ Very low average reward for user ${record.username}: ${Math.floor(avgReward)} xu`);
          }
        }
      }

      // 3. Cross-reference with User records
      console.log('🔍 Cross-referencing with user database...');
      
      let userMismatches = 0;
      for (const dailyRecord of dailyRewards) {
        const userRecord = await User.findOne({ discordId: dailyRecord.userId });
        if (!userRecord) {
          warnings.push(`⚠️ Daily reward record exists but no user record for ${dailyRecord.username} (${dailyRecord.userId})`);
          userMismatches++;
        } else if (userRecord.username !== dailyRecord.username) {
          warnings.push(`⚠️ Username mismatch: Daily has '${dailyRecord.username}', User has '${userRecord.username}'`);
        }
      }

      // 4. Test Luck System Logic
      console.log('🔍 Testing luck system logic...');
      
      const luckTests = [
        { streak: 1, expectedLevel: 'Normal' },
        { streak: 15, expectedLevel: 'Good' },
        { streak: 50, expectedLevel: 'Great' }
      ];

      for (const test of luckTests) {
        let highRewards = 0;
        const samples = 100;
        
        for (let i = 0; i < samples; i++) {
          const rand = Math.random();
          let testReward;
          
          if (test.streak <= 7) {
            testReward = Math.floor(Math.random() * 1000) + 1;
          } else if (test.streak <= 30) {
            testReward = rand < 0.6 ? Math.floor(Math.random() * 501) + 500 : Math.floor(Math.random() * 499) + 1;
          } else {
            testReward = rand < 0.8 ? Math.floor(Math.random() * 501) + 500 : Math.floor(Math.random() * 499) + 1;
          }
          
          if (testReward >= 500) highRewards++;
        }
        
        const highPercentage = (highRewards / samples) * 100;
        let expectedRange = '';
        
        if (test.expectedLevel === 'Normal') expectedRange = '45-55%';
        else if (test.expectedLevel === 'Good') expectedRange = '55-65%';
        else expectedRange = '75-85%';
        
        console.log(`🎲 Streak ${test.streak} (${test.expectedLevel}): ${highPercentage}% high rewards (expected: ${expectedRange})`);
      }

      // 5. Check for potential exploits
      console.log('🔍 Checking for potential exploits...');
      
      // Users with suspiciously high daily totals
      const suspiciousUsers = dailyRewards.filter(r => 
        r.totalClaims > 0 && (r.totalRewards / r.totalClaims) > 25000
      );
      
      if (suspiciousUsers.length > 0) {
        warnings.push(`⚠️ ${suspiciousUsers.length} users with very high average daily rewards (potential exploit)`);
      }

      // Users claiming too frequently
      const recentClaims = dailyRewards.filter(r => {
        if (!r.lastClaimDate) return false;
        const hoursSinceLastClaim = (now - r.lastClaimDate) / (1000 * 60 * 60);
        return hoursSinceLastClaim < 12; // Claimed within last 12 hours
      });

      // Create diagnostic embed
      const embed = new EmbedBuilder()
        .setTitle('🔍 Daily System Diagnostic Report')
        .setDescription(targetUser ? `**Target User:** ${targetUser.username}` : '**System-wide Analysis**')
        .addFields(
          { name: '📊 Statistics', value: `**Total Users:** ${stats.totalUsers}\n**Active Streaks:** ${stats.activeStreaks}\n**Broken Streaks:** ${stats.brokenStreaks}\n**Invalid Records:** ${stats.invalidData}\n**Highest Streak:** ${stats.highestStreak}\n**Total Rewards Given:** ${stats.totalRewards.toLocaleString()} xu`, inline: false },
          { name: '❌ Critical Issues', value: issues.length > 0 ? issues.slice(0, 5).join('\n') + (issues.length > 5 ? `\n...and ${issues.length - 5} more` : '') : '✅ No critical issues found', inline: false },
          { name: '⚠️ Warnings', value: warnings.length > 0 ? warnings.slice(0, 5).join('\n') + (warnings.length > 5 ? `\n...and ${warnings.length - 5} more` : '') : '✅ No warnings', inline: false }
        )
        .setColor(issues.length > 0 ? '#ff0000' : warnings.length > 0 ? '#ff9900' : '#00ff00')
        .setTimestamp();

      // Add system health assessment
      let healthStatus = '';
      if (issues.length === 0 && warnings.length === 0) {
        healthStatus = '🟢 **EXCELLENT** - System running perfectly';
      } else if (issues.length === 0 && warnings.length <= 3) {
        healthStatus = '🟡 **GOOD** - Minor warnings detected';
      } else if (issues.length <= 2) {
        healthStatus = '🟠 **FAIR** - Some issues need attention';
      } else {
        healthStatus = '🔴 **POOR** - Critical issues require immediate fix';
      }

      embed.addFields({ name: '🏥 System Health', value: healthStatus, inline: false });

      // Add recommendations
      const recommendations = [];
      if (stats.brokenStreaks > stats.activeStreaks) {
        recommendations.push('• Consider implementing streak recovery mechanism');
      }
      if (userMismatches > 0) {
        recommendations.push('• Sync username mismatches between daily and user records');
      }
      if (stats.invalidData > 0) {
        recommendations.push('• Clean up invalid data records');
      }
      if (issues.length > 0) {
        recommendations.push('• Fix critical data integrity issues immediately');
      }

      if (recommendations.length > 0) {
        embed.addFields({ name: '💡 Recommendations', value: recommendations.join('\n'), inline: false });
      }

      await interaction.editReply({ embeds: [embed] });

      // Log summary
      console.log(`✅ Daily system debug completed:`);
      console.log(`   - ${stats.totalUsers} users analyzed`);
      console.log(`   - ${issues.length} critical issues`);
      console.log(`   - ${warnings.length} warnings`);
      console.log(`   - System health: ${healthStatus}`);

    } catch (error) {
      console.error('❌ Daily system debug failed:', error);
      await interaction.editReply({
        content: `❌ **Debug failed:**\n\`\`\`${error.message}\`\`\`\n\nStack trace:\n\`\`\`${error.stack?.substring(0, 1000) || 'No stack trace'}\`\`\``
      });
    }
  }
};