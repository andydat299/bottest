import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('set-vip')
    .setDescription('🔧 [ADMIN] Set VIP tier for user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User để set VIP')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('tier')
        .setDescription('VIP tier to set')
        .setRequired(true)
        .addChoices(
          { name: 'Bronze', value: 'bronze' },
          { name: 'Silver', value: 'silver' },
          { name: 'Gold', value: 'gold' },
          { name: 'Diamond', value: 'diamond' },
          { name: 'Remove VIP', value: 'none' }
        )
    ),
  prefixEnabled: true,

  async execute(interaction) {
    await interaction.deferReply();

    try {
      // Check if user is admin (you may want to add admin check here)
      const allowedUsers = ['YOUR_ADMIN_ID']; // Replace with actual admin IDs
      // if (!allowedUsers.includes(interaction.user.id)) {
      //   return await interaction.editReply({
      //     content: '❌ **Bạn không có quyền sử dụng lệnh này!**'
      //   });
      // }

      const { User } = await import('../schemas/userSchema.js');
      
      // Debug: Check schema first
      console.log('=== SCHEMA DEBUG ===');
      console.log('User schema paths:', Object.keys(User.schema.paths));
      console.log('===================');
      
      const targetUser = interaction.options.getUser('user') || interaction.user;
      const vipTier = interaction.options.getString('tier');
      
      // Get or create user
      let user = await User.findOne({ discordId: targetUser.id });
      if (!user) {
        return await interaction.editReply({
          content: `❌ **User ${targetUser.username} không có tài khoản!**\n\nHãy bảo họ dùng \`/fish\` để tạo tài khoản.`
        });
      }

      // Debug: Show current user data
      console.log('=== USER DATA BEFORE ===');
      console.log('Raw user object:', JSON.stringify(user.toObject(), null, 2));
      console.log('========================');

      // Store old VIP for comparison
      const oldVip = user.currentVipTier || user.vipTier;

      // Set new VIP tier - use currentVipTier which exists in schema
      if (vipTier === 'none') {
        user.currentVipTier = null;
        user.isVip = false;
      } else {
        user.currentVipTier = vipTier;
        user.isVip = true;
      }

      // Mark as modified explicitly
      user.markModified('currentVipTier');
      user.markModified('isVip');

      // Save to database
      await user.save();

      // Verify save worked
      const verifyUser = await User.findOne({ discordId: targetUser.id });
      console.log('=== USER DATA AFTER SAVE ===');
      console.log('Verified user data:', JSON.stringify(verifyUser.toObject(), null, 2));
      console.log('============================');

      // Create success embed
      const embed = new EmbedBuilder()
        .setTitle('👑 **VIP TIER UPDATED**')
        .setDescription(`VIP tier đã được cập nhật cho **${targetUser.username}**`)
        .setColor('#00ff00')
        .setThumbnail(targetUser.displayAvatarURL())
        .setTimestamp();

      embed.addFields({
        name: '👤 **User Information**',
        value: `**Username:** ${targetUser.username}\n` +
               `**Discord ID:** ${targetUser.id}\n` +
               `**Current Balance:** ${user.balance?.toLocaleString() || 0} xu\n` +
               `**Rod Level:** ${user.rodLevel || 1}`,
        inline: false
      });

      embed.addFields({
        name: '👑 **VIP Changes**',
        value: `**Old VIP:** ${oldVip ? oldVip.toUpperCase() : 'NONE'}\n` +
               `**New VIP:** ${user.currentVipTier ? user.currentVipTier.toUpperCase() : 'NONE'}\n` +
               `**Is VIP:** ${user.isVip ? '✅ TRUE' : '❌ FALSE'}\n` +
               `**Status:** ${user.currentVipTier ? '✅ VIP Active' : '❌ VIP Removed'}`,
        inline: true
      });

      // Show rod access changes
      const vipHierarchy = { 'bronze': 1, 'silver': 2, 'gold': 3, 'diamond': 4 };
      const newVipLevel = vipHierarchy[user.currentVipTier?.toLowerCase()] || 0;
      
      let accessInfo = '';
      if (newVipLevel >= 1) {
        accessInfo = '✅ Can access all premium rods (Levels 11-20)\n';
        accessInfo += '✅ Full rod collection available\n';
        accessInfo += '✅ No VIP restrictions';
      } else {
        accessInfo = '🔒 Limited to standard rods (Levels 1-10)\n';
        accessInfo += '❌ Premium rods locked\n'; 
        accessInfo += '💎 Upgrade to VIP Bronze for full access';
      }

      embed.addFields({
        name: '🎣 **Rod Access**',
        value: accessInfo,
        inline: true
      });

      // Add usage instructions
      embed.addFields({
        name: '💡 **Next Steps**',
        value: `• User can now use \`/upgrade-rod\` for ${user.currentVipTier ? 'all levels' : 'levels 1-10'}\n` +
               `• Check access with \`/debug-vip\`\n` +
               `• Browse rods with \`/rod-shop\`\n` +
               `• Changes take effect immediately`,
        inline: false
      });

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('❌ Set VIP command error:', error);
      
      await interaction.editReply({
        content: `❌ **Có lỗi khi set VIP:**\n\`\`\`${error.message}\`\`\``
      });
    }
  }
};