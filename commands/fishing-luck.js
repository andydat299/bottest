import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('fishing-luck')
    .setDescription('🎣 [ADMIN] Chỉnh tỷ lệ câu cá cho user target')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User cần chỉnh tỷ lệ')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('success_rate')
        .setDescription('Tỷ lệ thành công (0-100%) - để trống để xem hiện tại')
        .setRequired(false)
        .setMinValue(0)
        .setMaxValue(100)
    )
    .addIntegerOption(option =>
      option.setName('rare_rate')
        .setDescription('Tỷ lệ cá hiếm (0-50%) - để trống để giữ nguyên')
        .setRequired(false)
        .setMinValue(0)
        .setMaxValue(50)
    )
    .addIntegerOption(option =>
      option.setName('duration')
        .setDescription('Thời gian hiệu lực (phút) - 0 = vĩnh viễn')
        .setRequired(false)
        .setMinValue(0)
        .setMaxValue(1440) // Max 24h
    ),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return await interaction.reply({
        content: '❌ Bạn không có quyền sử dụng lệnh này!',
        ephemeral: true
      });
    }

    try {
      const { User } = await import('../schemas/userSchema.js');
      
      const targetUser = interaction.options.getUser('user');
      const successRate = interaction.options.getInteger('success_rate');
      const rareRate = interaction.options.getInteger('rare_rate');
      const duration = interaction.options.getInteger('duration');

      await interaction.deferReply({ ephemeral: true });

      // Find or create user record
      let user = await User.findOne({ discordId: targetUser.id });
      if (!user) {
        user = new User({
          discordId: targetUser.id,
          username: targetUser.username,
          balance: 0
        });
      }

      // Initialize fishing luck object if not exists
      if (!user.fishingLuck) {
        user.fishingLuck = {
          successRate: null, // null = use default
          rareRate: null,
          expiresAt: null,
          setBy: null,
          setAt: null
        };
      }

      // If no parameters provided, show current settings
      if (successRate === null && rareRate === null && duration === null) {
        const currentSuccess = user.fishingLuck.successRate || 'Default (70%)';
        const currentRare = user.fishingLuck.rareRate || 'Default (15%)';
        const isActive = user.fishingLuck.expiresAt && user.fishingLuck.expiresAt > new Date();
        const expiresText = user.fishingLuck.expiresAt ? 
          (isActive ? `<t:${Math.floor(user.fishingLuck.expiresAt.getTime()/1000)}:R>` : 'Expired') : 
          'Permanent';

        const embed = new EmbedBuilder()
          .setTitle('🎣 Fishing Luck Settings')
          .setDescription(`**Target User:** ${targetUser.username}`)
          .addFields(
            { name: '🎯 Success Rate', value: `${currentSuccess}`, inline: true },
            { name: '✨ Rare Fish Rate', value: `${currentRare}`, inline: true },
            { name: '⏰ Status', value: isActive ? '🟢 Active' : '🔴 Inactive', inline: true },
            { name: '📅 Expires', value: expiresText, inline: true },
            { name: '👨‍💼 Set By', value: user.fishingLuck.setBy || 'Never set', inline: true },
            { name: '🕐 Set At', value: user.fishingLuck.setAt ? `<t:${Math.floor(user.fishingLuck.setAt.getTime()/1000)}:f>` : 'Never', inline: true }
          )
          .setColor('#3498db')
          .setThumbnail(targetUser.displayAvatarURL())
          .setTimestamp();

        return await interaction.editReply({ embeds: [embed] });
      }

      // Calculate expiry time
      let expiresAt = null;
      if (duration !== null && duration > 0) {
        expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + duration);
      }

      // Update fishing luck settings
      const now = new Date();
      
      if (successRate !== null) {
        user.fishingLuck.successRate = successRate;
      }
      
      if (rareRate !== null) {
        user.fishingLuck.rareRate = rareRate;
      }
      
      user.fishingLuck.expiresAt = expiresAt;
      user.fishingLuck.setBy = interaction.user.username;
      user.fishingLuck.setAt = now;

      await user.save();

      // Create success embed
      const embed = new EmbedBuilder()
        .setTitle('🎣 Fishing Luck Updated!')
        .setDescription(`**Target User:** ${targetUser.username}`)
        .addFields(
          { name: '🎯 Success Rate', value: successRate !== null ? `${successRate}%` : 'Unchanged', inline: true },
          { name: '✨ Rare Fish Rate', value: rareRate !== null ? `${rareRate}%` : 'Unchanged', inline: true },
          { name: '⏰ Duration', value: duration === 0 || duration === null ? 'Permanent' : `${duration} minutes`, inline: true },
          { name: '📅 Expires', value: expiresAt ? `<t:${Math.floor(expiresAt.getTime()/1000)}:f>` : 'Never', inline: true },
          { name: '👨‍💼 Set By', value: interaction.user.username, inline: true },
          { name: '🕐 Set At', value: `<t:${Math.floor(now.getTime()/1000)}:f>`, inline: true }
        )
        .setColor('#00ff00')
        .setThumbnail(targetUser.displayAvatarURL())
        .setTimestamp();

      // Add usage notes
      const notes = `
**📝 Notes:**
• Default success rate: 70%
• Default rare rate: 15%
• Settings expire automatically
• Use \`0%\` success rate for guaranteed fail
• Use \`100%\` success rate for guaranteed catch
• Rare rate affects legendary fish chances
`;

      embed.addFields({ name: '💡 Usage Info', value: notes, inline: false });

      await interaction.editReply({ embeds: [embed] });

      console.log(`🎣 Fishing luck updated by ${interaction.user.username} for ${targetUser.username}: success=${successRate}%, rare=${rareRate}%, duration=${duration}min`);

    } catch (error) {
      console.error('❌ Fishing luck error:', error);
      
      try {
        await interaction.editReply({
          content: '❌ **Có lỗi khi chỉnh fishing luck!**\n\nVui lòng thử lại sau.',
          ephemeral: true
        });
      } catch (replyError) {
        console.error('❌ Could not send error reply:', replyError);
      }
    }
  }
};