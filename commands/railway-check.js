import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('railway-check')
    .setDescription('🚀 [ADMIN] Kiểm tra Railway environment variables')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return await interaction.reply({
        content: '❌ Bạn không có quyền sử dụng lệnh này!',
        ephemeral: true
      });
    }

    // Log tất cả env variables to console for debugging
    console.log('🚀 Railway Environment Check:');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('RAILWAY_ENVIRONMENT:', process.env.RAILWAY_ENVIRONMENT);
    console.log('RAILWAY_PROJECT_NAME:', process.env.RAILWAY_PROJECT_NAME);
    console.log('RAILWAY_SERVICE_NAME:', process.env.RAILWAY_SERVICE_NAME);
    
    // Check withdraw variables
    console.log('ADMIN_CHANNEL_ID:', process.env.ADMIN_CHANNEL_ID);
    console.log('ADMIN_ROLE_ID:', process.env.ADMIN_ROLE_ID);
    console.log('ADMIN_IDS:', process.env.ADMIN_IDS);
    
    // List all variables starting with ADMIN
    const allEnvKeys = Object.keys(process.env);
    const adminKeys = allEnvKeys.filter(key => key.includes('ADMIN'));
    const discordKeys = allEnvKeys.filter(key => key.includes('DISCORD'));
    const mongoKeys = allEnvKeys.filter(key => key.includes('MONGO'));
    
    console.log('Admin variables found:', adminKeys);
    console.log('Discord variables found:', discordKeys);
    console.log('Mongo variables found:', mongoKeys);

    const railwayEmbed = new EmbedBuilder()
      .setTitle('🚀 Railway Environment Check')
      .setDescription('**Chi tiết environment variables từ Railway**')
      .addFields(
        {
          name: '🌐 Railway Platform Info',
          value: `**Environment:** ${process.env.RAILWAY_ENVIRONMENT || 'Not detected'}\n**Project:** ${process.env.RAILWAY_PROJECT_NAME || 'Unknown'}\n**Service:** ${process.env.RAILWAY_SERVICE_NAME || 'Unknown'}\n**Node ENV:** ${process.env.NODE_ENV || 'Not set'}`,
          inline: false
        },
        {
          name: '🔑 Variable Categories Found',
          value: `**Admin vars:** ${adminKeys.length > 0 ? adminKeys.join(', ') : 'None'}\n**Discord vars:** ${discordKeys.length > 0 ? discordKeys.length + ' found' : 'None'}\n**Mongo vars:** ${mongoKeys.length > 0 ? mongoKeys.length + ' found' : 'None'}`,
          inline: false
        },
        {
          name: '💰 Withdraw System Variables',
          value: `**ADMIN_CHANNEL_ID:**\n\`${process.env.ADMIN_CHANNEL_ID || 'NOT SET'}\`\n**ADMIN_ROLE_ID:**\n\`${process.env.ADMIN_ROLE_ID || 'NOT SET'}\`\n**ADMIN_IDS:**\n\`${process.env.ADMIN_IDS || 'NOT SET'}\``,
          inline: false
        },
        {
          name: '🔍 Core Bot Variables',
          value: `**DISCORD_TOKEN:** ${process.env.DISCORD_TOKEN ? '✅ Set' : '❌ Missing'}\n**CLIENT_ID:** ${process.env.CLIENT_ID ? '✅ Set' : '❌ Missing'}\n**MONGO_URI:** ${process.env.MONGO_URI ? '✅ Set' : '❌ Missing'}`,
          inline: false
        }
      )
      .setColor(process.env.ADMIN_CHANNEL_ID ? '#00ff00' : '#ff0000')
      .setTimestamp();

    // Thêm troubleshooting nếu missing variables
    if (!process.env.ADMIN_CHANNEL_ID || !process.env.ADMIN_ROLE_ID) {
      railwayEmbed.addFields({
        name: '🛠️ Troubleshooting Steps',
        value: '**If variables are missing:**\n1. Go to Railway Dashboard\n2. Select your bot service\n3. Click "Variables" tab\n4. Add missing variables:\n   - `ADMIN_CHANNEL_ID`\n   - `ADMIN_ROLE_ID`\n5. Click "Deploy" or wait for auto-restart\n6. Run this command again',
        inline: false
      });
    }

    // Test channel access if ADMIN_CHANNEL_ID exists
    if (process.env.ADMIN_CHANNEL_ID) {
      const channel = interaction.client.channels.cache.get(process.env.ADMIN_CHANNEL_ID);
      railwayEmbed.addFields({
        name: '📋 Channel Access Test',
        value: channel ? '✅ Channel found and accessible' : '❌ Channel not found or no access',
        inline: false
      });
    }

    await interaction.reply({ embeds: [railwayEmbed], ephemeral: true });
  }
};