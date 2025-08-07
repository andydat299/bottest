import { updateQuestProgress } from '../utils/questManager.js';
import { User } from '../schemas/userSchema.js';
import { config } from '../config.js';
import { processChatMessage } from '../utils/chatRewards.js';
import { EmbedBuilder } from 'discord.js';
import { 
  sendEncouragementMessage, 
  createSpecialRewardEmbed, 
  trackRecentReward, 
  checkHotStreak 
} from '../utils/chatActivity.js';

export default {
  name: 'messageCreate',
  async execute(message) {
    // Bỏ qua bot messages và DM
    if (message.author.bot || !message.guild) return;

    // Kiểm tra nếu bot được mention
    if (message.mentions.has(message.client.user)) {
      await handleBotMention(message);
      return; // Return early để không xử lý các logic khác
    }

    // Xử lý prefix commands trước
    if (message.content.startsWith(config.prefix)) {
      const args = message.content.slice(config.prefix.length).trim().split(/ +/);
      const commandName = args.shift().toLowerCase();
      
      const command = message.client.commands.get(commandName);
      if (command && command.prefixEnabled) {
        try {
          // Tạo fake interaction object để tương thích với slash command code
          const fakeInteraction = {
            user: message.author,
            member: message.member,
            guild: message.guild,
            channel: message.channel,
            client: message.client,
            reply: async (options) => {
              if (typeof options === 'string') {
                return await message.reply(options);
              }
              
              const replyOptions = {};
              if (options.content) replyOptions.content = options.content;
              if (options.embeds) replyOptions.embeds = options.embeds;
              if (options.components) replyOptions.components = options.components;
              if (options.files) replyOptions.files = options.files;
              
              return await message.reply(replyOptions);
            },
            followUp: async (options) => {
              return await message.channel.send(options);
            },
            editReply: async (options) => {
              return await message.channel.send(options);
            },
            deferReply: async () => {
              return await message.channel.sendTyping();
            }
          };
          
          await command.execute(fakeInteraction, args);
          return; // Dừng xử lý nếu đã thực hiện prefix command
          
        } catch (error) {
          console.error(`❌ Error executing prefix command ${commandName}:`, error);
          await message.reply('❌ Có lỗi xảy ra khi thực hiện lệnh!');
          return;
        }
      }
    }

    // Cập nhật quest chat cho channel cụ thể (sảnh chat)
    if (message.channel.id === '1363492195478540348') {
      try {
        // Lấy hoặc tạo user
        let user = await User.findOne({ discordId: message.author.id });
        if (!user) {
          user = await User.create({ discordId: message.author.id });
        }

        // Cập nhật thống kê chat
        const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
        
        // Tăng tổng tin nhắn
        user.chatStats.totalMessages = (user.chatStats.totalMessages || 0) + 1;
        
        // Tăng tin nhắn hôm nay
        const todayCount = user.chatStats.dailyMessages.get(today) || 0;
        user.chatStats.dailyMessages.set(today, todayCount + 1);
        
        // Cập nhật ngày chat cuối
        user.chatStats.lastMessageDate = today;
        
        await user.save();

        // Cập nhật quest progress
        await updateQuestProgress(message.author.id, 'chat', 1, { 
          channelId: message.channel.id 
        });

        // Xử lý chat rewards
        const rewardResult = await processChatMessage(message);
        if (rewardResult && rewardResult.success) {
          // Tạo thông báo đẹp mắt với hiệu ứng
          const rewardEmbed = new EmbedBuilder()
            .setTitle('🎉 XU MIDNIGHT RƠI! 🎉')
            .setDescription(`💫 **${rewardResult.username}** vừa nhận được **${rewardResult.coins.toLocaleString()} xu** từ chat!`)
            .addFields(
              { name: '💎 Số dư hiện tại', value: `${rewardResult.newBalance.toLocaleString()} xu`, inline: true },
              { name: '� Tỉ lệ may mắn', value: '10% (Rare!)', inline: true },
              { name: '🌟 Bonus', value: 'Chat Reward', inline: true }
            )
            .setColor('#ffd700') // Màu vàng kim
            .setThumbnail(message.author.displayAvatarURL())
            .setFooter({ 
              text: 'Chat thêm để có cơ hội nhận xu! Cooldown: 30s',
              iconURL: message.client.user.displayAvatarURL()
            })
            .setTimestamp();
          
          // Gửi thông báo với ping và hiệu ứng
          await message.channel.send({ 
            content: `🎊 **CHÚC MỪNG** ${message.author}! 🎊`,
            embeds: [rewardEmbed] 
          });
          
          // Reaction cho tin nhắn gốc
          try {
            await message.react('💰');
            await message.react('🎉');
            await message.react('✨');
          } catch (error) {
            console.log('Không thể react:', error.message);
          }
          
          // Gửi tin nhắn khích lệ sau một lúc (30% cơ hội)
          sendEncouragementMessage(message.channel);
        }

        // Log để debug (có thể bỏ sau)
        console.log(`📱 ${message.author.username} đã chat ${todayCount + 1} tin nhắn hôm nay tại sảnh`);
        
      } catch (error) {
        console.error('Lỗi khi cập nhật chat stats:', error);
      }
    }
  }
};

// Function xử lý khi bot được mention
async function handleBotMention(message) {
  try {
    // Tạo embed thông tin bot
    const botInfoEmbed = new EmbedBuilder()
      .setTitle('🤖 Thông tin Bot')
      .setDescription(
        `Xin chào ${message.author}! 👋\n\n` +
        `🎣 **Tôi là Bot câu cá và minigame!**\n` +
        `Giúp bạn thư giãn và kiếm xu thông qua các hoạt động vui vẻ.\n\n` +
        `🎮 **Các tính năng chính:**\n` +
        `🐟 Hệ thống câu cá với nhiều loại cá\n` +
        `🎴 Blackjack (Xì dách) - Casino game\n` +
        `🎡 Wheel of Fortune - Vòng quay may mắn\n` +
        `💰 Hệ thống xu và nhiệm vụ\n` +
        `💬 Chat rewards - Nhận xu khi chat\n` +
        `📊 Thống kê và leaderboard\n\n` +
        `📋 **Bắt đầu:**\n` +
        `• Gõ \`/help\` để xem tất cả lệnh\n` +
        `• Thử \`/fish\` để bắt đầu câu cá\n` +
        `• Dùng \`/profile\` để xem hồ sơ của bạn`
      )
      .setColor('#00d4ff')
      .setThumbnail(message.client.user.displayAvatarURL({ dynamic: true, size: 256 }))
      .addFields(
        {
          name: '👨‍💻 Nhà phát triển',
          value: '**andydat299** - *Bot Developer & Creator*\n🔧 Thiết kế và phát triển toàn bộ hệ thống',
          inline: false
        },
        {
          name: '📈 Thống kê Bot',
          value: 
            `🌐 **Servers:** ${message.client.guilds.cache.size}\n` +
            `👥 **Users:** ${message.client.users.cache.size}\n` +
            `⏱️ **Uptime:** ${formatUptime(message.client.uptime)}`,
          inline: true
        },
        {
          name: '🛠️ Tech Stack',
          value: 
            `📡 **Discord.js** v14\n` +
            `🗄️ **MongoDB** Database\n` +
            `🚀 **Node.js** Runtime`,
          inline: true
        },
        {
          name: '🔗 Links & Support',
          value: 
            `💬 **Support:** Tag tôi nếu cần hỗ trợ\n` +
            `📚 **Commands:** \`/help\`\n` +
            `🎮 **Play Now:** \`/fish\`, \`/wheel post\``,
          inline: false
        }
      )
      .setFooter({ 
        text: `Bot được tạo bởi andydat299 • Phiên bản 2.0`,
        iconURL: message.author.displayAvatarURL() 
      })
      .setTimestamp();

    // Tạo buttons hữu ích
    const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = await import('discord.js');
    
    const buttonsRow = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('bot_help')
          .setLabel('📋 Xem Commands')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('bot_stats')
          .setLabel('📊 Server Stats')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('bot_games')
          .setLabel('🎮 Games')
          .setStyle(ButtonStyle.Success)
      );

    await message.reply({ 
      embeds: [botInfoEmbed],
      components: [buttonsRow]
    });

  } catch (error) {
    console.error('Lỗi khi hiển thị thông tin bot:', error);
    
    // Fallback response nếu có lỗi
    await message.reply({
      content: 
        `🤖 **Bot Information**\n\n` +
        `👋 Xin chào! Tôi là bot câu cá và minigame!\n` +
        `👨‍💻 **Developer:** andydat299\n` +
        `📋 **Commands:** \`/help\`\n` +
        `🎣 **Start:** \`/fish\`\n\n` +
        `Cảm ơn bạn đã sử dụng bot! 💙`
    });
  }
}

// Helper function để format uptime
function formatUptime(ms) {
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
