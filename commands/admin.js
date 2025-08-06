import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { 
  enableWeatherSystem, 
  disableWeatherSystem, 
  enableTimeSystem, 
  disableTimeSystem, 
  getSystemStatus,
  forceUpdateWeather 
} from '../utils/weatherSystem.js';
import { 
  enableEventSystem, 
  disableEventSystem, 
  getEventSystemStatus,
  activateSpecialEvent 
} from '../utils/seasonalEvents.js';
import {
  disableCommand,
  enableCommand,
  getCommandStatus,
  getControllableCommands,
  resetAllCommands
} from '../utils/commandControl.js';
import {
  enablePenaltySystem,
  disablePenaltySystem,
  setDailyLossLimit,
  setPenaltyMultiplier,
  getPenaltySystemStatus
} from '../utils/fishingPenalty.js';

export default {
  data: new SlashCommandBuilder()
    .setName('admin')
    .setDescription('Quản lý hệ thống bot (chỉ admin)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommandGroup(group =>
      group.setName('weather')
        .setDescription('Quản lý hệ thống thời tiết')
        .addSubcommand(subcommand =>
          subcommand.setName('enable')
            .setDescription('Bật hệ thống thời tiết')
        )
        .addSubcommand(subcommand =>
          subcommand.setName('disable')
            .setDescription('Tắt hệ thống thời tiết')
        )
        .addSubcommand(subcommand =>
          subcommand.setName('time-enable')
            .setDescription('Bật hệ thống thời gian')
        )
        .addSubcommand(subcommand =>
          subcommand.setName('time-disable')
            .setDescription('Tắt hệ thống thời gian')
        )
        .addSubcommand(subcommand =>
          subcommand.setName('update')
            .setDescription('Cập nhật thời tiết ngay lập tức')
        )
        .addSubcommand(subcommand =>
          subcommand.setName('status')
            .setDescription('Xem trạng thái hệ thống thời tiết')
        )
    )
    .addSubcommandGroup(group =>
      group.setName('event')
        .setDescription('Quản lý hệ thống sự kiện')
        .addSubcommand(subcommand =>
          subcommand.setName('enable')
            .setDescription('Bật hệ thống sự kiện')
        )
        .addSubcommand(subcommand =>
          subcommand.setName('disable')
            .setDescription('Tắt hệ thống sự kiện')
        )
        .addSubcommand(subcommand =>
          subcommand.setName('activate')
            .setDescription('Kích hoạt sự kiện đặc biệt')
            .addStringOption(option =>
              option.setName('event')
                .setDescription('Tên sự kiện')
                .setRequired(true)
                .addChoices(
                  { name: '🧧 Tết Nguyên Đán', value: 'LUNAR_NEW_YEAR' },
                  { name: '🎃 Halloween Ma Quái', value: 'HALLOWEEN_SPOOKY' }
                )
            )
            .addIntegerOption(option =>
              option.setName('duration')
                .setDescription('Thời gian hoạt động (giờ)')
                .setMinValue(1)
                .setMaxValue(168) // 1 tuần
            )
        )
        .addSubcommand(subcommand =>
          subcommand.setName('status')
            .setDescription('Xem trạng thái hệ thống sự kiện')
        )
    )
    .addSubcommandGroup(group =>
      group.setName('command')
        .setDescription('Quản lý bật/tắt lệnh')
        .addSubcommand(subcommand =>
          subcommand.setName('disable')
            .setDescription('Tắt một lệnh cụ thể')
            .addStringOption(option =>
              option.setName('command')
                .setDescription('Tên lệnh cần tắt')
                .setRequired(true)
                .addChoices(
                  { name: 'sell - Bán cá', value: 'sell' },
                  { name: 'fish - Câu cá', value: 'fish' },
                  { name: 'upgrade - Nâng cấp', value: 'upgrade' },
                  { name: 'repair - Sửa chữa', value: 'repair' },
                  { name: 'inventory - Túi đồ', value: 'inventory' },
                  { name: 'stats - Thống kê', value: 'stats' },
                  { name: 'profile - Hồ sơ', value: 'profile' },
                  { name: 'quests - Nhiệm vụ', value: 'quests' }
                )
            )
        )
        .addSubcommand(subcommand =>
          subcommand.setName('enable')
            .setDescription('Bật lại một lệnh')
            .addStringOption(option =>
              option.setName('command')
                .setDescription('Tên lệnh cần bật')
                .setRequired(true)
                .addChoices(
                  { name: 'sell - Bán cá', value: 'sell' },
                  { name: 'fish - Câu cá', value: 'fish' },
                  { name: 'upgrade - Nâng cấp', value: 'upgrade' },
                  { name: 'repair - Sửa chữa', value: 'repair' },
                  { name: 'inventory - Túi đồ', value: 'inventory' },
                  { name: 'stats - Thống kê', value: 'stats' },
                  { name: 'profile - Hồ sơ', value: 'profile' },
                  { name: 'quests - Nhiệm vụ', value: 'quests' }
                )
            )
        )
        .addSubcommand(subcommand =>
          subcommand.setName('status')
            .setDescription('Xem trạng thái tất cả lệnh')
        )
        .addSubcommand(subcommand =>
          subcommand.setName('reset')
            .setDescription('Bật lại tất cả lệnh')
        )
    )
    .addSubcommandGroup(group =>
      group.setName('fishing')
        .setDescription('Quản lý hệ thống phạt xu khi hụt cá')
        .addSubcommand(subcommand =>
          subcommand.setName('penalty-enable')
            .setDescription('Bật hệ thống phạt xu khi hụt cá')
        )
        .addSubcommand(subcommand =>
          subcommand.setName('penalty-disable')
            .setDescription('Tắt hệ thống phạt xu khi hụt cá')
        )
        .addSubcommand(subcommand =>
          subcommand.setName('set-limit')
            .setDescription('Đặt giới hạn xu mất tối đa/ngày')
            .addIntegerOption(option =>
              option.setName('limit')
                .setDescription('Giới hạn xu (100-50000)')
                .setRequired(true)
                .setMinValue(100)
                .setMaxValue(50000)
            )
        )
        .addSubcommand(subcommand =>
          subcommand.setName('set-multiplier')
            .setDescription('Đặt hệ số phạt xu')
            .addNumberOption(option =>
              option.setName('multiplier')
                .setDescription('Hệ số phạt (0.1-5.0)')
                .setRequired(true)
                .setMinValue(0.1)
                .setMaxValue(5.0)
            )
        )
        .addSubcommand(subcommand =>
          subcommand.setName('status')
            .setDescription('Xem trạng thái hệ thống phạt xu')
        )
    )
    .addSubcommand(subcommand =>
      subcommand.setName('status')
        .setDescription('Xem trạng thái tổng quan tất cả hệ thống')
    ),

  async execute(interaction) {
    // Kiểm tra quyền admin
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return await interaction.reply({
        content: '❌ Bạn không có quyền sử dụng lệnh này!',
        ephemeral: true
      });
    }

    const group = interaction.options.getSubcommandGroup();
    const subcommand = interaction.options.getSubcommand();

    try {
      if (group === 'weather') {
        await handleWeatherCommands(interaction, subcommand);
      } else if (group === 'event') {
        await handleEventCommands(interaction, subcommand);
      } else if (group === 'command') {
        await handleCommandControls(interaction, subcommand);
      } else if (group === 'fishing') {
        if (subcommand === 'penalty-enable') {
          const enabled = enableFishingPenalty();
          if (enabled) {
            const statusEmbed = new EmbedBuilder()
              .setTitle('🟢 Hệ Thống Phạt Xu Đã Bật')
              .setDescription('Player sẽ bị phạt xu khi câu cá hụt.')
              .setColor('#00ff00')
              .setTimestamp();
            
            await interaction.reply({ embeds: [statusEmbed] });
          } else {
            await interaction.reply('Hệ thống phạt xu đã được bật từ trước.');
          }
        } else if (subcommand === 'penalty-disable') {
          const disabled = disableFishingPenalty();
          if (disabled) {
            const statusEmbed = new EmbedBuilder()
              .setTitle('🔴 Hệ Thống Phạt Xu Đã Tắt')
              .setDescription('Player sẽ không bị phạt xu khi câu cá hụt.')
              .setColor('#ff0000')
              .setTimestamp();
            
            await interaction.reply({ embeds: [statusEmbed] });
          } else {
            await interaction.reply('Hệ thống phạt xu đã được tắt từ trước.');
          }
        } else if (subcommand === 'set-limit') {
          const limit = interaction.options.getInteger('limit');
          const set = setDailyLossLimit(limit);
          if (set) {
            const statusEmbed = new EmbedBuilder()
              .setTitle('💰 Đã Cập Nhật Giới Hạn Phạt Xu')
              .setDescription(`Giới hạn mới: **${limit.toLocaleString()} xu/ngày**`)
              .setColor('#00ff00')
              .setTimestamp();
            
            await interaction.reply({ embeds: [statusEmbed] });
          } else {
            await interaction.reply('Không thể cập nhật giới hạn phạt xu.');
          }
        } else if (subcommand === 'set-multiplier') {
          const multiplier = interaction.options.getNumber('multiplier');
          const set = setPenaltyMultiplier(multiplier);
          if (set) {
            const statusEmbed = new EmbedBuilder()
              .setTitle('🔧 Đã Cập Nhật Hệ Số Phạt')
              .setDescription(`Hệ số mới: **x${multiplier}**`)
              .setColor('#00ff00')
              .setTimestamp();
            
            await interaction.reply({ embeds: [statusEmbed] });
          } else {
            await interaction.reply('Không thể cập nhật hệ số phạt xu.');
          }
        } else if (subcommand === 'status') {
          const status = getFishingPenaltyStatus();
          const statusEmbed = new EmbedBuilder()
            .setTitle('📊 Trạng Thái Hệ Thống Phạt Xu')
            .addFields(
              { name: '⚡ Trạng thái', value: status.enabled ? '🟢 Bật' : '🔴 Tắt', inline: true },
              { name: '💰 Giới hạn/ngày', value: `${status.dailyLimit.toLocaleString()} xu`, inline: true },
              { name: '🔧 Hệ số phạt', value: `x${status.multiplier}`, inline: true },
              { name: '📈 Phạt cơ bản', value: '8-50 xu/lần hụt', inline: true },
              { name: '🌍 Bonus địa điểm', value: '0-22 xu thêm', inline: true },
              { name: '🎣 Bonus cần câu', value: '0-10 xu thêm', inline: true }
            )
            .setColor(status.enabled ? '#00ff00' : '#ff0000')
            .setTimestamp();
          
          await interaction.reply({ embeds: [statusEmbed] });
        }
      } else if (subcommand === 'status') {
        await handleOverallStatus(interaction);
      }
    } catch (error) {
      console.error('Admin command error:', error);
      await interaction.reply({
        content: '❌ Có lỗi xảy ra khi thực hiện lệnh!',
        ephemeral: true
      });
    }
  }
};

async function handleWeatherCommands(interaction, subcommand) {
  let result;
  
  switch (subcommand) {
    case 'enable':
      result = enableWeatherSystem();
      break;
    case 'disable':
      result = disableWeatherSystem();
      break;
    case 'time-enable':
      result = enableTimeSystem();
      break;
    case 'time-disable':
      result = disableTimeSystem();
      break;
    case 'update':
      const newWeather = forceUpdateWeather();
      result = { 
        success: true, 
        message: `🌤️ Đã cập nhật thời tiết mới: ${newWeather.emoji} ${newWeather.name}` 
      };
      break;
    case 'status':
      const status = getSystemStatus();
      const embed = new EmbedBuilder()
        .setTitle('🌤️ Trạng thái hệ thống thời tiết')
        .setDescription(status.status)
        .setColor(status.weatherEnabled && status.timeEnabled ? 0x00ff00 : 0xff9900)
        .setTimestamp();
      
      return await interaction.reply({ embeds: [embed] });
  }
  
  await interaction.reply({
    content: result.message,
    ephemeral: true
  });
}

async function handleEventCommands(interaction, subcommand) {
  let result;
  
  switch (subcommand) {
    case 'enable':
      result = enableEventSystem();
      break;
    case 'disable':
      result = disableEventSystem();
      break;
    case 'activate':
      const eventId = interaction.options.getString('event');
      const duration = interaction.options.getInteger('duration');
      result = activateSpecialEvent(eventId, duration);
      break;
    case 'status':
      const status = getEventSystemStatus();
      const embed = new EmbedBuilder()
        .setTitle('🎉 Trạng thái hệ thống sự kiện')
        .setDescription(status.status)
        .addFields({
          name: 'Sự kiện đang hoạt động',
          value: status.activeEventsCount > 0 ? `${status.activeEventsCount} sự kiện` : 'Không có',
          inline: true
        })
        .setColor(status.eventEnabled ? 0x00ff00 : 0xff0000)
        .setTimestamp();
      
      return await interaction.reply({ embeds: [embed] });
  }
  
  await interaction.reply({
    content: result.message,
    ephemeral: true
  });
}

async function handleOverallStatus(interaction) {
  const weatherStatus = getSystemStatus();
  const eventStatus = getEventSystemStatus();
  const commandStatus = getCommandStatus();
  
  const embed = new EmbedBuilder()
    .setTitle('⚙️ Trạng thái tổng quan hệ thống')
    .addFields(
      {
        name: '🌤️ Hệ thống thời tiết',
        value: weatherStatus.status,
        inline: false
      },
      {
        name: '🎉 Hệ thống sự kiện',
        value: eventStatus.status,
        inline: false
      },
      {
        name: '🎮 Hệ thống Commands',
        value: `Enabled: ${commandStatus.enabledCount}/${commandStatus.totalCommands}\nDisabled: ${commandStatus.disabledCount} lệnh`,
        inline: false
      },
      {
        name: '📊 Thống kê',
        value: `Sự kiện hoạt động: ${eventStatus.activeEventsCount}`,
        inline: false
      }
    )
    .setColor(0x3498db)
    .setTimestamp()
    .setFooter({ text: 'Sử dụng /admin để quản lý hệ thống' });
  
  if (commandStatus.disabledList.length > 0) {
    embed.addFields({
      name: '🔒 Lệnh bị tắt',
      value: commandStatus.disabledList.map(cmd => `/${cmd}`).join(', '),
      inline: false
    });
  }
  
  await interaction.reply({ embeds: [embed] });
}

// Command Control Handler
async function handleCommandControls(interaction, subcommand) {
  const commandName = interaction.options.getString('command');
  
  switch (subcommand) {
    case 'disable':
      const disableResult = disableCommand(commandName);
      await interaction.reply({
        content: disableResult.success ? `✅ ${disableResult.message}` : `❌ ${disableResult.message}`,
        ephemeral: true
      });
      break;
      
    case 'enable':
      const enableResult = enableCommand(commandName);
      await interaction.reply({
        content: enableResult.success ? `✅ ${enableResult.message}` : `❌ ${enableResult.message}`,
        ephemeral: true
      });
      break;
      
    case 'status':
      const status = getCommandStatus();
      
      const statusEmbed = new EmbedBuilder()
        .setTitle('🎮 Trạng thái Commands')
        .addFields(
          {
            name: '📊 Tổng quan',
            value: `Total: ${status.totalCommands}\nEnabled: ${status.enabledCount}\nDisabled: ${status.disabledCount}`,
            inline: false
          }
        )
        .setColor(0x3498db)
        .setTimestamp();
        
      // Thêm danh sách lệnh
      const commandList = Object.entries(status.commands)
        .map(([cmd, stat]) => `/${cmd}: ${stat}`)
        .join('\n');
        
      statusEmbed.addFields({
        name: '📋 Chi tiết Commands',
        value: commandList || 'Không có lệnh nào',
        inline: false
      });
      
      if (status.disabledList.length > 0) {
        statusEmbed.addFields({
          name: '🔒 Lệnh bị tắt',
          value: status.disabledList.map(cmd => `/${cmd}`).join(', '),
          inline: false
        });
      }
        
      await interaction.reply({ embeds: [statusEmbed] });
      break;
      
    case 'reset':
      const resetResult = resetAllCommands();
      
      const resetEmbed = new EmbedBuilder()
        .setTitle('🔄 Reset Commands')
        .setDescription(resetResult.message)
        .setColor(0x2ecc71)
        .setTimestamp();
        
      if (resetResult.resetCommands.length > 0) {
        resetEmbed.addFields({
          name: '✅ Lệnh đã được bật lại',
          value: resetResult.resetCommands.map(cmd => `/${cmd}`).join(', '),
          inline: false
        });
      }
        
      await interaction.reply({ embeds: [resetEmbed], ephemeral: true });
      break;
  }
}
