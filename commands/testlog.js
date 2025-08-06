import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { isAdmin, createNoPermissionEmbed } from '../utils/adminUtils.js';
import { logInfo, logSuccess, logWarn, logError } from '../utils/logger.js';

const data = new SlashCommandBuilder()
  .setName('testlog')
  .setDescription('[ADMIN] Test hệ thống log')
  .addStringOption(option =>
    option.setName('type')
      .setDescription('Loại log để test')
      .setRequired(false)
      .addChoices(
        { name: 'Info', value: 'info' },
        { name: 'Success', value: 'success' },
        { name: 'Warning', value: 'warn' },
        { name: 'Error', value: 'error' }
      ));

async function execute(interaction) {
  // Kiểm tra quyền admin
  if (!isAdmin(interaction.user.id)) {
    const embed = createNoPermissionEmbed(EmbedBuilder);
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  const logType = interaction.options.getString('type') || 'info';

  try {
    // Test log dựa trên type
    switch (logType) {
      case 'info':
        await logInfo('Test Log Info', 'Đây là test log thông tin từ admin', {
          user: interaction.user,
          command: 'testlog'
        });
        break;
      case 'success':
        await logSuccess('Test Log Success', 'Đây là test log thành công từ admin', {
          user: interaction.user,
          command: 'testlog'
        });
        break;
      case 'warn':
        await logWarn('Test Log Warning', 'Đây là test log cảnh báo từ admin', {
          user: interaction.user,
          command: 'testlog'
        });
        break;
      case 'error':
        await logError(new Error('Test error message'), 'Test log error từ admin');
        break;
    }

    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('✅ Test Log Thành Công')
      .setDescription(`Đã gửi test log loại **${logType}** tới log channel!`)
      .addFields({
        name: '📋 Chi tiết',
        value: `**Loại:** ${logType}\n**Admin:** ${interaction.user.username}\n**Thời gian:** <t:${Math.floor(Date.now() / 1000)}:R>`,
        inline: false
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });

  } catch (error) {
    console.error('Error testing log:', error);
    
    const embed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle('❌ Lỗi Test Log')
      .setDescription('Có lỗi xảy ra khi test log system!')
      .addFields({
        name: '🐛 Chi tiết lỗi',
        value: `\`\`\`${error.message}\`\`\``,
        inline: false
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
}

export default { data, execute };
