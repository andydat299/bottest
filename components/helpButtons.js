import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export function getHelpButtons() {
  const row1 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('help_fish')
        .setLabel('🎣 Câu cá')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('help_inventory')
        .setLabel('🎒 Kho cá')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('help_sell')
        .setLabel('💰 Bán cá')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('help_profile')
        .setLabel('👤 Hồ sơ')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('help_upgrade')
        .setLabel('⬆️ Nâng cấp')
        .setStyle(ButtonStyle.Danger)
    );

  const row2 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('help_list')
        .setLabel('📋 Danh sách cá')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('help_stats')
        .setLabel('📊 Thống kê')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('help_reset')
        .setLabel('🔄 Reset')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('help_refresh')
        .setLabel('🔄 Làm mới')
        .setStyle(ButtonStyle.Primary)
    );

  return [row1, row2];
}
