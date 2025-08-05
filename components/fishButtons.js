import { ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';

export const getFishButtons = () => {
  const click = new ButtonBuilder()
    .setCustomId('fish_click')
    .setLabel('🎣 Kéo cần')
    .setStyle(ButtonStyle.Primary);

  const cancel = new ButtonBuilder()
    .setCustomId('fish_cancel')
    .setLabel('❌ Hủy')
    .setStyle(ButtonStyle.Secondary);

  return new ActionRowBuilder().addComponents(click, cancel);
};
