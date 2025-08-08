import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('fix-daily-system')
    .setDescription('🔧 [ADMIN] Auto-fix các lỗi trong daily system')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addBooleanOption(option =>
      option.setName('dry_run')
        .setDescription('Chỉ xem sẽ fix gì, không thực sự fix (default: true)')
        .setRequired(false)
    ),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return await interaction.reply({
        content: '❌ Bạn không có quyền sử dụng lệnh này!',
        ephemeral: true
      });
    }

    const dryRun = interaction.options.getBoolean('dry_run') ?? true;

    await interaction.deferReply({ ephemeral: true });

    try {
      console.log(`🔧 Starting daily system fix (dry run: ${dryRun})...`);
      
      const { DailyReward } = await import('../schemas/dailyRewardSchema.js');
      const { User } = await import('../schemas/userSchema.js');

      const fixes = [];
      const errors = [];
      let recordsFixed = 0;

      // Get all daily reward records
      const dailyRewards = await DailyReward.find({});
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      console.log(`🔍 Analyzing ${dailyRewards.length} daily reward records...`);

      for (const record of dailyRewards) {
        let needsUpdate = false;
        const originalRecord = { ...record.toObject() };

        // Fix 1: Ensure currentStreak <= longestStreak
        if (record.currentStreak > record.longestStreak) {
          fixes.push(`Fixed ${record.username}: Set longestStreak from ${record.longestStreak} to ${record.currentStreak}`);
          record.longestStreak = record.currentStreak;
          needsUpdate = true;
        }

        // Fix 2: Reset negative values
        if (record.currentStreak < 0) {
          fixes.push(`Fixed ${record.username}: Reset negative currentStreak ${record.currentStreak} to 0`);
          record.currentStreak = 0;
          needsUpdate = true;
        }

        if (record.totalClaims < 0) {
          fixes.push(`Fixed ${record.username}: Reset negative totalClaims ${record.totalClaims} to 0`);
          record.totalClaims = 0;
          needsUpdate = true;
        }

        if (record.totalRewards < 0) {
          fixes.push(`Fixed ${record.username}: Reset negative totalRewards ${record.totalRewards} to 0`);
          record.totalRewards = 0;
          needsUpdate = true;
        }

        // Fix 3: Validate streak based on last claim date
        if (record.lastClaimDate && record.currentStreak > 0) {
          const lastClaim = new Date(record.lastClaimDate.getFullYear(), record.lastClaimDate.getMonth(), record.lastClaimDate.getDate());
          const daysSinceLastClaim = Math.floor((today - lastClaim) / (1000 * 60 * 60 * 24));
          
          if (daysSinceLastClaim > 1) {
            fixes.push(`Fixed ${record.username}: Reset broken streak (${record.currentStreak} days, last claim ${daysSinceLastClaim} days ago)`);
            record.currentStreak = 0;
            needsUpdate = true;
          }

          // Fix future claim dates
          if (lastClaim > today) {
            fixes.push(`Fixed ${record.username}: Reset future claim date ${lastClaim.toDateString()}`);
            record.lastClaimDate = null;
            record.currentStreak = 0;
            needsUpdate = true;
          }
        }

        // Fix 4: Validate reward consistency
        if (record.totalClaims > 0) {
          const avgReward = record.totalRewards / record.totalClaims;
          
          // Suspiciously high average (likely exploited)
          if (avgReward > 100000) {
            fixes.push(`Fixed ${record.username}: Reset suspicious high rewards (avg: ${Math.floor(avgReward).toLocaleString()} xu)`);
            record.totalRewards = record.totalClaims * 1000; // Reset to reasonable average
            needsUpdate = true;
          }

          // Zero total claims but has rewards
          if (record.totalClaims === 0 && record.totalRewards > 0) {
            fixes.push(`Fixed ${record.username}: Reset rewards without claims`);
            record.totalRewards = 0;
            needsUpdate = true;
          }
        }

        // Fix 5: Sync username with User collection
        try {
          const userRecord = await User.findOne({ discordId: record.userId });
          if (userRecord && userRecord.username !== record.username) {
            fixes.push(`Fixed ${record.username}: Updated username to ${userRecord.username}`);
            record.username = userRecord.username;
            needsUpdate = true;
          }
        } catch (userError) {
          errors.push(`Error syncing username for ${record.username}: ${userError.message}`);
        }

        // Fix 6: Ensure required fields
        if (!record.monthlyRewardsClaimed) {
          record.monthlyRewardsClaimed = 0;
          needsUpdate = true;
        }

        if (!record.lastMonthReset) {
          record.lastMonthReset = new Date();
          needsUpdate = true;
        }

        // Apply fixes
        if (needsUpdate) {
          recordsFixed++;
          
          if (!dryRun) {
            try {
              await record.save();
              console.log(`✅ Fixed record for ${record.username}`);
            } catch (saveError) {
              errors.push(`Failed to save fixes for ${record.username}: ${saveError.message}`);
            }
          } else {
            console.log(`🔍 Would fix record for ${record.username}`);
          }
        }
      }

      // Create result embed
      const embed = new EmbedBuilder()
        .setTitle(`🔧 Daily System Fix Report ${dryRun ? '(DRY RUN)' : '(APPLIED)'}`)
        .setDescription(dryRun ? '**Preview of fixes - no changes made**' : '**Fixes have been applied to database**')
        .addFields(
          { name: '📊 Summary', value: `**Records Analyzed:** ${dailyRewards.length}\n**Records Fixed:** ${recordsFixed}\n**Total Fixes:** ${fixes.length}\n**Errors:** ${errors.length}`, inline: false }
        )
        .setColor(dryRun ? '#3498db' : errors.length > 0 ? '#ff9900' : '#00ff00')
        .setTimestamp();

      // Add fixes list
      if (fixes.length > 0) {
        const fixesText = fixes.slice(0, 10).join('\n') + (fixes.length > 10 ? `\n...and ${fixes.length - 10} more fixes` : '');
        embed.addFields({ name: '🔧 Fixes Applied', value: fixesText.substring(0, 1024), inline: false });
      } else {
        embed.addFields({ name: '✅ System Status', value: 'No fixes needed - system is healthy!', inline: false });
      }

      // Add errors if any
      if (errors.length > 0) {
        const errorsText = errors.slice(0, 5).join('\n') + (errors.length > 5 ? `\n...and ${errors.length - 5} more errors` : '');
        embed.addFields({ name: '❌ Errors', value: errorsText.substring(0, 1024), inline: false });
      }

      // Add next steps
      if (dryRun && fixes.length > 0) {
        embed.addFields({ 
          name: '🎯 Next Steps', 
          value: `Run \`/fix-daily-system dry_run:false\` to apply these ${fixes.length} fixes to the database.`, 
          inline: false 
        });
      } else if (!dryRun && recordsFixed > 0) {
        embed.addFields({ 
          name: '✅ Complete', 
          value: `Successfully fixed ${recordsFixed} records. Run \`/debug-daily-system\` to verify system health.`, 
          inline: false 
        });
      }

      await interaction.editReply({ embeds: [embed] });

      // Log summary
      console.log(`${dryRun ? '🔍' : '✅'} Daily system fix completed:`);
      console.log(`   - ${dailyRewards.length} records analyzed`);
      console.log(`   - ${recordsFixed} records ${dryRun ? 'would be' : 'were'} fixed`);
      console.log(`   - ${fixes.length} total fixes`);
      console.log(`   - ${errors.length} errors encountered`);

    } catch (error) {
      console.error('❌ Daily system fix failed:', error);
      await interaction.editReply({
        content: `❌ **Fix failed:**\n\`\`\`${error.message}\`\`\`\n\nThis is a critical error that needs manual investigation.`
      });
    }
  }
};