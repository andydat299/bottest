// File đã bị xóa để làm nhẹ code
// Bot startup debug không cần thiết khi đã stable

export default {
  data: new SlashCommandBuilder()
    .setName('debug-bot-startup')
    .setDescription('🔍 [ADMIN] Debug bot startup issues')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return await interaction.reply({
        content: '❌ Bạn không có quyền sử dụng lệnh này!',
        ephemeral: true
      });
    }

    try {
      console.log('🔍 Starting bot startup debug...');
      
      const debugInfo = {
        timestamp: new Date().toISOString(),
        nodeVersion: process.version,
        platform: process.platform,
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
        botReady: !!interaction.client.isReady(),
        botUser: interaction.client.user?.username || 'Not ready'
      };

      console.log('🔍 Debug info:', debugInfo);

      // Check critical files existence
      const criticalChecks = {};
      
      try {
        // Test main imports
        await import('../schemas/userSchema.js');
        criticalChecks.userSchema = '✅ OK';
      } catch (e) {
        criticalChecks.userSchema = `❌ ${e.message}`;
      }

      try {
        await import('../utils/adminUtils.js');
        criticalChecks.adminUtils = '✅ OK';
      } catch (e) {
        criticalChecks.adminUtils = `❌ ${e.message}`;
      }

      try {
        await import('../utils/bankQR.js');
        criticalChecks.bankQR = '✅ OK';
      } catch (e) {
        criticalChecks.bankQR = `❌ ${e.message}`;
      }

      try {
        await import('../events/interactionCreate.js');
        criticalChecks.interactionCreate = '✅ OK';
      } catch (e) {
        criticalChecks.interactionCreate = `❌ ${e.message}`;
      }

      console.log('📁 File checks:', criticalChecks);

      // Test database connection
      let dbTest = {};
      try {
        const { User } = await import('../schemas/userSchema.js');
        const testQuery = await User.findOne().limit(1);
        dbTest.connection = '✅ Connected';
        dbTest.query = '✅ Can query';
      } catch (dbError) {
        dbTest.connection = `❌ ${dbError.message}`;
        console.error('💾 DB test error:', dbError);
      }

      // Check environment critical vars
      const envCritical = {
        TOKEN: process.env.TOKEN ? '✅ Set' : '❌ Missing',
        MONGODB_URI: process.env.MONGODB_URI ? '✅ Set' : '❌ Missing',
        CLIENT_ID: process.env.CLIENT_ID ? '✅ Set' : '❌ Missing'
      };

      const debugEmbed = new EmbedBuilder()
        .setTitle('🔍 Bot Startup Debug Report')
        .setDescription('**Debugging thông tin khởi động bot**')
        .addFields(
          {
            name: '🤖 Bot Status',
            value: `**Ready:** ${debugInfo.botReady}\n**User:** ${debugInfo.botUser}\n**Uptime:** ${Math.floor(debugInfo.uptime)}s`,
            inline: true
          },
          {
            name: '⚙️ System Info',
            value: `**Node:** ${debugInfo.nodeVersion}\n**Platform:** ${debugInfo.platform}\n**Memory:** ${Math.round(debugInfo.memoryUsage.heapUsed / 1024 / 1024)}MB`,
            inline: true
          },
          {
            name: '🔑 Critical Env Vars',
            value: Object.entries(envCritical).map(([k, v]) => `${v} ${k}`).join('\n'),
            inline: false
          },
          {
            name: '📁 File Imports',
            value: Object.entries(criticalChecks).map(([k, v]) => `${v.startsWith('✅') ? '✅' : '❌'} ${k}`).join('\n'),
            inline: true
          },
          {
            name: '💾 Database',
            value: Object.entries(dbTest).map(([k, v]) => `${v}`).join('\n'),
            inline: true
          }
        )
        .setColor('#3498db')
        .setTimestamp();

      await interaction.reply({ embeds: [debugEmbed], ephemeral: true });

      // Log detailed errors
      for (const [key, value] of Object.entries(criticalChecks)) {
        if (value.startsWith('❌')) {
          console.error(`❌ ${key}:`, value);
        }
      }

      console.log('✅ Startup debug completed');

    } catch (error) {
      console.error('❌ Debug startup failed:', error);
      await interaction.reply({
        content: `❌ **Debug failed:**\n\`\`\`${error.message}\`\`\``,
        ephemeral: true
      });
    }
  }
};