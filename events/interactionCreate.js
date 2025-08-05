import { claimQuestReward } from '../utils/questManager.js';
import { User } from '../schemas/userSchema.js';

export default {
  name: 'interactionCreate',
  async execute(interaction) {
    // Xử lý slash commands
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction);
      } catch (err) {
        console.error(err);
        await interaction.reply({ content: '❌ Lỗi khi thực thi lệnh.' });
      }
      return;
    }

    // Xử lý button interactions
    if (interaction.isButton()) {
      try {
        // Xử lý các nút help để gợi ý lệnh slash
        if (interaction.customId.startsWith('help_')) {
          const commandName = interaction.customId.replace('help_', '');
          
          const commandMap = {
            'fish': { cmd: '</fish:0>', desc: 'Bắt đầu câu cá và thử vận may!' },
            'inventory': { cmd: '</inventory:0>', desc: 'Xem kho cá hiện tại của bạn' },
            'sell': { cmd: '</sell:0>', desc: 'Bán toàn bộ cá để lấy xu' },
            'cooldown': { cmd: '</cooldown:0>', desc: 'Kiểm tra thời gian chờ câu cá' },
            'profile': { cmd: '</profile:0>', desc: 'Xem hồ sơ và thông tin cá nhân' },
            'upgrade': { cmd: '</upgrade:0>', desc: 'Nâng cấp cần câu để câu cá hiếm hơn' },
            'list': { cmd: '</list:0>', desc: 'Xem danh sách tất cả loại cá và thống kê' },
            'stats': { cmd: '</stats:0>', desc: 'Xem thống kê chi tiết cộng đồng' },
            'rates': { cmd: '</rates:0>', desc: 'Xem tỷ lệ câu cá theo rod level' },
            'reset': { cmd: '</reset:0>', desc: 'Reset toàn bộ dữ liệu của bạn' },
            'refresh': { cmd: '</help:0>', desc: 'Xem lại hướng dẫn này' }
          };

          const command = commandMap[commandName];
          if (command) {
            await interaction.reply({
              content: `🎯 **${command.cmd}**\n📖 ${command.desc}\n\n� **Cách sử dụng:** Nhấn vào lệnh màu xanh ở trên hoặc gõ \`/${commandName}\` trong chat!`,
              ephemeral: true
            });
          } else {
            await interaction.reply({
              content: '❌ Không tìm thấy lệnh tương ứng.',
              ephemeral: true
            });
          }
          return;
        }

        // Xử lý claim quest rewards
        if (interaction.customId.startsWith('claim_quest_')) {
          await interaction.deferReply({ ephemeral: true });
          
          const questId = interaction.customId.replace('claim_quest_', '');
          const reward = await claimQuestReward(interaction.user.id, questId);
          
          if (reward > 0) {
            // Cập nhật balance user
            const user = await User.findOne({ discordId: interaction.user.id });
            if (user) {
              user.balance += reward;
              await user.save();
            }
            
            await interaction.editReply({
              content: `🎉 **Chúc mừng!** Bạn đã nhận được **${reward} xu** từ nhiệm vụ!\n💰 Số dư hiện tại: **${user.balance.toLocaleString()} xu**`
            });
          } else {
            await interaction.editReply({
              content: '❌ Không thể nhận thưởng. Quest chưa hoàn thành hoặc đã được nhận rồi.'
            });
          }
          return;
        }

        // Xử lý các button khác (fish, reset, etc.)
        // Reset buttons đã được xử lý trong reset command collector
        // Fish buttons đã được xử lý trong fish command collector
        
        // Để cho các command khác xử lý
      } catch (err) {
        console.error('Button interaction error:', err);
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ 
            content: '❌ Có lỗi xảy ra với nút bấm.',
            ephemeral: true 
          });
        }
      }
    }
  }
};
