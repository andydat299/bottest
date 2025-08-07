import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('🏓 Kiểm tra bot có hoạt động không'),

  async execute(interaction) {
    const start = Date.now();
    
    try {
      await interaction.reply({
        content: '🏓 Pinging...',
        ephemeral: true
      });
      
      const latency = Date.now() - start;
      const apiLatency = Math.round(interaction.client.ws.ping);
      
      await interaction.editReply({
        content: `🏓 **Pong!**\n\n📶 **Latency:** ${latency}ms\n🌐 **API Latency:** ${apiLatency}ms\n⏰ **Uptime:** ${formatUptime(interaction.client.uptime)}\n\n✅ **Bot đang hoạt động bình thường!**`
      });
      
      console.log(`🏓 Ping command executed by ${interaction.user.username}`);
      
    } catch (error) {
      console.error('❌ Ping command error:', error);
      
      try {
        await interaction.editReply({
          content: `❌ **Có lỗi xảy ra:**\n\`\`\`${error.message}\`\`\``
        });
      } catch (editError) {
        console.error('❌ Could not edit ping reply:', editError);
      }
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