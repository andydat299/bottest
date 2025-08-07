// Debug wrapper for original fish command
import originalFish from './fish-original.js';
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { User } from '../schemas/userSchema.js';

export default {
  data: new SlashCommandBuilder()
    .setName('fish-debug')
    .setDescription('🔧 Debug fish command issues')
    .addSubcommand(subcommand =>
      subcommand
        .setName('check')
        .setDescription('Check fishing status')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('reset-cooldown')
        .setDescription('Reset fishing cooldown')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('test-simple')
        .setDescription('Test simple fishing')
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    try {
      if (subcommand === 'check') {
        const user = await User.findOne({ discordId: interaction.user.id });
        
        const embed = new EmbedBuilder()
          .setTitle('🔧 FISH DEBUG CHECK')
          .setDescription(`**Fishing status for ${interaction.user.username}:**`)
          .addFields(
            { name: '🗄️ User in DB', value: user ? '✅ Found' : '❌ Not found', inline: true },
            { name: '🎣 Total Fished', value: user?.totalFished?.toString() || '0', inline: true },
            { name: '🎒 Inventory Size', value: user?.inventory?.length?.toString() || '0', inline: true },
            { name: '⏰ Last Fished', value: user?.lastFished ? new Date(user.lastFished).toLocaleString() : 'Never', inline: true },
            { name: '💰 Balance', value: user?.balance?.toLocaleString() || '0', inline: true },
            { name: '🎯 Rod Level', value: user?.rodLevel?.toString() || '1', inline: true }
          )
          .setColor('#3498db')
          .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });

      } else if (subcommand === 'reset-cooldown') {
        const user = await User.findOne({ discordId: interaction.user.id });
        
        if (user) {
          user.lastFished = null;
          await user.save();
        }

        await interaction.reply({
          content: '✅ Fishing cooldown reset! You can fish now.',
          ephemeral: true
        });

      } else if (subcommand === 'test-simple') {
        // Simple fishing test
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

        // Add test fish
        const testFish = {
          name: 'Test Fish',
          rarity: 'common',
          value: 100,
          caughtAt: new Date()
        };

        if (!user.inventory) user.inventory = [];
        user.inventory.push(testFish);
        user.totalFished = (user.totalFished || 0) + 1;
        
        await user.save();

        const embed = new EmbedBuilder()
          .setTitle('🧪 SIMPLE FISH TEST')
          .setDescription('**Test fishing completed successfully!**')
          .addFields(
            { name: '🐟 Test Fish', value: testFish.name, inline: true },
            { name: '⭐ Rarity', value: testFish.rarity, inline: true },
            { name: '💰 Value', value: `${testFish.value} xu`, inline: true },
            { name: '📊 Total Fished', value: `${user.totalFished}`, inline: true },
            { name: '🎒 Inventory', value: `${user.inventory.length} fish`, inline: true }
          )
          .setColor('#00ff00')
          .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
      }

    } catch (error) {
      console.error('Error in fish-debug command:', error);
      await interaction.reply({
        content: `❌ **Debug Error:**\n\`${error.message}\``,