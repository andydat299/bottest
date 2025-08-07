import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { User } from '../schemas/userSchema.js';

// Simple fish list for testing
const SIMPLE_FISH = [
  { name: 'Cá Nhỏ', rarity: 'common', value: 50, chance: 40 },
  { name: 'Cá Vừa', rarity: 'common', value: 100, chance: 30 },
  { name: 'Cá Lớn', rarity: 'uncommon', value: 200, chance: 20 },
  { name: 'Cá Hiếm', rarity: 'rare', value: 500, chance: 8 },
  { name: 'Cá Vàng', rarity: 'epic', value: 1000, chance: 2 }
];

export default {
  data: new SlashCommandBuilder()
    .setName('fish-simple')
    .setDescription('🎣 Câu cá đơn giản (backup command)'),

  async execute(interaction) {
    try {
      // Get or create user
      let user = await User.findOne({ discordId: interaction.user.id });
      if (!user) {
        user = new User({
          discordId: interaction.user.id,
          username: interaction.user.username,
          balance: 0,
          inventory: [],
          rodLevel: 1,
          rodDurability: 100
        });
      }

      // Check cooldown (simple 30 second cooldown)
      const now = Date.now();
      if (user.lastFished && (now - user.lastFished) < 30000) {
        const remaining = Math.ceil((30000 - (now - user.lastFished)) / 1000);
        return await interaction.reply({
          content: `⏰ **Chờ ${remaining} giây** trước khi câu cá tiếp!`,
          ephemeral: true
        });
      }

      // Simple fishing logic
      const random = Math.random() * 100;
      let caughtFish = null;
      let cumulative = 0;

      for (const fish of SIMPLE_FISH) {
        cumulative += fish.chance;
        if (random <= cumulative) {
          caughtFish = fish;
          break;
        }
      }

      if (!caughtFish) {
        caughtFish = SIMPLE_FISH[0]; // Default to first fish
      }

      // Add to inventory
      if (!user.inventory) user.inventory = [];
      user.inventory.push({
        name: caughtFish.name,
        rarity: caughtFish.rarity,
        value: caughtFish.value,
        caughtAt: new Date()
      });

      // Update user data
      user.lastFished = now;
      user.totalFished = (user.totalFished || 0) + 1;
      
      await user.save();

      // Update quest progress (safe)
      try {
        const { updateQuestProgress } = await import('../utils/enhancedQuestManager.js');
        await updateQuestProgress(interaction.user.id, 'fish', 1);
        
        if (['rare', 'epic', 'legendary'].includes(caughtFish.rarity)) {
          await updateQuestProgress(interaction.user.id, 'rare_fish', 1, { rarity: caughtFish.rarity });
        }
        
        await updateQuestProgress(interaction.user.id, 'fish_value', caughtFish.value, { value: caughtFish.value });
      } catch (questError) {
        console.log('Quest update error (non-critical):', questError.message);
      }

      // Create result embed
      const embed = new EmbedBuilder()
        .setTitle('🎣 Câu Cá Thành Công!')
        .setDescription(`**Bạn đã câu được:**`)
        .addFields(
          { name: '🐟 Cá', value: caughtFish.name, inline: true },
          { name: '⭐ Độ hiếm', value: caughtFish.rarity, inline: true },
          { name: '💰 Giá trị', value: `${caughtFish.value} xu`, inline: true },
          { name: '📊 Tổng đã câu', value: `${user.totalFished} con`, inline: true },
          { name: '🎒 Trong kho', value: `${user.inventory.length} con`, inline: true }
        )
        .setColor(caughtFish.rarity === 'epic' ? '#9b59b6' : caughtFish.rarity === 'rare' ? '#e74c3c' : '#3498db')
        .setTimestamp();

      // Add buttons
      const buttons = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('fish_again')
            .setLabel('🎣 Câu tiếp')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('view_inventory')
            .setLabel('🎒 Xem kho')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('sell_all')
            .setLabel('💰 Bán hết')
            .setStyle(ButtonStyle.Success)
        );

      await interaction.reply({
        embeds: [embed],
        components: [buttons],
        ephemeral: true
      });

      console.log(`✅ ${user.username} caught: ${caughtFish.name} (${caughtFish.rarity}) - ${caughtFish.value} xu`);

    } catch (error) {
      console.error('Error in fish-simple command:', error);
      await interaction.reply({
        content: `❌ **Lỗi câu cá:**\n\`${error.message}\`\n\n💡 Thử lại sau vài giây!`,
        ephemeral: true
      });
    }
  }
};