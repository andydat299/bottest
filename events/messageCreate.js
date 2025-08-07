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
