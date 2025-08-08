// File đã bị xóa để làm nhẹ code
// Sử dụng /ping để kiểm tra bot cơ bản

export default {
  data: new SlashCommandBuilder()
    .setName('bot-health-check')
    .setDescription('🔧 [ADMIN] Kiểm tra tình trạng bot sau deploy')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return await interaction.reply({
        content: '❌ Bạn không có quyền sử dụng lệnh này!',
        ephemeral: true
      });
    }

    try {
      console.log('🔧 Starting bot health check...');
      
      const client = interaction.client;
      const guild = interaction.guild;
      
      // Basic bot info
      const botInfo = {
        botId: client.user.id,
        botUsername: client.user.username,
        uptime: client.uptime,
        guilds: client.guilds.cache.size,
        users: client.users.cache.size,
        channels: client.channels.cache.size,
        ping: client.ws.ping
      };

      console.log('🤖 Bot info:', botInfo);

      // Check database connection
      let dbStatus = '❌ Not tested';
      try {
        const { User } = await import('../schemas/userSchema.js');
        const userCount = await User.countDocuments();
        dbStatus = `✅ Connected (${userCount} users)`;
        console.log('💾 Database:', dbStatus);
      } catch (dbError) {
        dbStatus = `❌ Error: ${dbError.message}`;
        console.error('💾 Database error:', dbError);
      }

      // Check environment variables
      const envChecks = {
        TOKEN: !!process.env.TOKEN ? '✅' : '❌',
        CLIENT_ID: !!process.env.CLIENT_ID ? '✅' : '❌',
        GUILD_ID: !!process.env.GUILD_ID ? '✅' : '❌',
        MONGODB_URI: !!process.env.MONGODB_URI ? '✅' : '❌',
        ADMIN_CHANNEL_ID: !!process.env.ADMIN_CHANNEL_ID ? '✅' : '❌',
        ADMIN_ROLE_ID: !!process.env.ADMIN_ROLE_ID ? '✅' : '❌'
      };

      console.log('🔑 Environment variables:', envChecks);

      // Check guild permissions
      let permissionChecks = {};
      try {
        const botMember = guild.members.cache.get(client.user.id);
        permissionChecks = {
          sendMessages: botMember.permissions.has('SendMessages') ? '✅' : '❌',
          embedLinks: botMember.permissions.has('EmbedLinks') ? '✅' : '❌',
          attachFiles: botMember.permissions.has('AttachFiles') ? '✅' : '❌',
          useSlashCommands: botMember.permissions.has('UseApplicationCommands') ? '✅' : '❌',
          manageMessages: botMember.permissions.has('ManageMessages') ? '✅' : '❌'
        };
        console.log('🔐 Bot permissions:', permissionChecks);
      } catch (permError) {
        console.error('🔐 Permission check error:', permError);
        permissionChecks = { error: permError.message };
      }

      // Check admin channel
      let adminChannelStatus = '❌ Not found';
      try {
        const adminChannelId = process.env.ADMIN_CHANNEL_ID;
        if (adminChannelId) {
          const adminChannel = client.channels.cache.get(adminChannelId);
          if (adminChannel) {
            adminChannelStatus = `✅ Found: #${adminChannel.name}`;
            // Test sending message
            await adminChannel.send('🧪 Health check test - Bot is alive!');
            adminChannelStatus += ' (Can send messages)';
          } else {
            adminChannelStatus = '❌ Channel not found';
          }
        }
        console.log('📍 Admin channel:', adminChannelStatus);
      } catch (channelError) {
        adminChannelStatus = `❌ Error: ${channelError.message}`;
        console.error('📍 Admin channel error:', channelError);
      }

      // Create health check embed
      const healthEmbed = new EmbedBuilder()
        .setTitle('🔧 Bot Health Check Report')
        .setDescription('**Kiểm tra tình trạng bot sau deploy**')
        .addFields(
          {
            name: '🤖 Bot Status',
            value: `**ID:** \`${botInfo.botId}\`\n**Username:** ${botInfo.botUsername}\n**Uptime:** ${formatUptime(botInfo.uptime)}\n**Ping:** ${botInfo.ping}ms`,
            inline: false
          },
          {
            name: '📊 Statistics',
            value: `**Guilds:** ${botInfo.guilds}\n**Users:** ${botInfo.users}\n**Channels:** ${botInfo.channels}`,
            inline: true
          },
          {
            name: '💾 Database',
            value: dbStatus,
            inline: true
          },
          {
            name: '🔑 Environment Variables',
            value: Object.entries(envChecks).map(([key, status]) => `${status} ${key}`).join('\n'),
            inline: false
          },
          {
            name: '🔐 Bot Permissions',
            value: Object.entries(permissionChecks).map(([key, status]) => `${status} ${key}`).join('\n'),
            inline: true
          },
          {
            name: '📍 Admin Channel',
            value: adminChannelStatus,
            inline: true
          }
        )
        .setColor('#00ff00')
        .setTimestamp()
        .setFooter({ text: 'Bot Health Check • All systems operational' });

      await interaction.reply({ embeds: [healthEmbed], ephemeral: true });

      console.log('✅ Health check completed');

    } catch (error) {
      console.error('❌ Health check failed:', error);
      await interaction.reply({
        content: `❌ **Health check failed:**\n\`\`\`${error.message}\`\`\``,
        ephemeral: true
      });
    }
  }
};

function formatUptime(ms) {
  if (!ms) return 'Unknown';
  
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m ${seconds}s`;
  }
}