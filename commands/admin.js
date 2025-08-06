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
        name: '📊 Thống kê',
        value: `Sự kiện hoạt động: ${eventStatus.activeEventsCount}`,
        inline: false
      }
    )
    .setColor(0x3498db)
    .setTimestamp()
    .setFooter({ text: 'Sử dụng /admin để quản lý hệ thống' });
  
  await interaction.reply({ embeds: [embed] });
}
