import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('debug-admin-channel')
    .setDescription('🔧 [ADMIN] Debug quyền bot trong admin channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return await interaction.reply({
        content: '❌ Bạn không có quyền sử dụng lệnh này!',
        ephemeral: true
      });
    }

    const adminChannelId = process.env.ADMIN_CHANNEL_ID;
    const adminRoleId = process.env.ADMIN_ROLE_ID;

    console.log('🔧 Debug admin channel command executed');
    console.log('📍 ADMIN_CHANNEL_ID:', adminChannelId);
    console.log('👑 ADMIN_ROLE_ID:', adminRoleId);

    if (!adminChannelId) {
      return await interaction.reply({
        content: '❌ **ADMIN_CHANNEL_ID không được cấu hình!**\n\nHãy cấu hình trên Railway Dashboard.',
        ephemeral: true
      });
    }

    const adminChannel = interaction.client.channels.cache.get(adminChannelId);
    
    if (!adminChannel) {
      return await interaction.reply({
        content: `❌ **Không tìm thấy admin channel!**\n\n🆔 Channel ID: \`${adminChannelId}\`\n💡 Kiểm tra lại ID hoặc đảm bảo bot có trong server.`,
        ephemeral: true
      });
    }

    try {
      // Kiểm tra quyền của bot trong admin channel
      const botMember = adminChannel.guild.members.cache.get(interaction.client.user.id);
      const permissions = adminChannel.permissionsFor(botMember);

      const permissionChecks = {
        'View Channel': permissions.has('ViewChannel'),
        'Send Messages': permissions.has('SendMessages'),
        'Embed Links': permissions.has('EmbedLinks'),
        'Use External Emojis': permissions.has('UseExternalEmojis'),
        'Add Reactions': permissions.has('AddReactions'),
        'Read Message History': permissions.has('ReadMessageHistory')
      };

      console.log('🔍 Permission checks:', permissionChecks);

      const debugEmbed = new EmbedBuilder()
        .setTitle('🔧 Debug Admin Channel')
        .setDescription(`**Kiểm tra channel và quyền bot**`)
        .addFields(
          {
            name: '📍 Channel Info',
            value: `**Name:** ${adminChannel.name}\n**ID:** \`${adminChannelId}\`\n**Type:** ${adminChannel.type}\n**Guild:** ${adminChannel.guild.name}`,
            inline: false
          },
          {
            name: '🤖 Bot Permissions',
            value: Object.entries(permissionChecks)
              .map(([perm, has]) => `${has ? '✅' : '❌'} ${perm}`)
              .join('\n'),
            inline: false
          },
          {
            name: '👑 Admin Role',
            value: adminRoleId ? 
              `**ID:** \`${adminRoleId}\`\n**Exists:** ${interaction.guild.roles.cache.has(adminRoleId) ? '✅' : '❌'}` : 
              '❌ Chưa cấu hình',
            inline: false
          }
        )
        .setColor(Object.values(permissionChecks).every(Boolean) ? '#00ff00' : '#ff0000')
        .setTimestamp();

      // Test gửi tin nhắn
      try {
        console.log('🧪 Attempting to send test message to admin channel...');
        const testMessage = await adminChannel.send('🧪 **Test message từ debug command** - Bot có thể gửi tin nhắn trong channel này!');
        console.log('✅ Test message sent successfully, ID:', testMessage.id);
        
        // Xóa test message sau 5 giây
        setTimeout(async () => {
          try {
            await testMessage.delete();
            console.log('🗑️ Test message deleted');
          } catch (err) {
            console.log('⚠️ Could not delete test message:', err.message);
          }
        }, 5000);

        debugEmbed.addFields({
          name: '✅ Test Message',
          value: 'Bot có thể gửi tin nhắn thành công!\n*(Test message sẽ tự xóa sau 5 giây)*',
          inline: false
        });

      } catch (testError) {
        console.error('❌ Test message failed:', testError);
        debugEmbed.addFields({
          name: '❌ Test Message Failed',
          value: `Lỗi: \`${testError.message}\`\n\n💡 Bot không thể gửi tin nhắn trong channel này!`,
          inline: false
        });
      }

      await interaction.reply({ embeds: [debugEmbed], ephemeral: true });

    } catch (error) {
      console.error('❌ Error in debug admin channel:', error);
      await interaction.reply({
        content: `❌ **Lỗi khi debug admin channel:**\n\`\`\`${error.message}\`\`\``,
        ephemeral: true
      });
    }
  }
};