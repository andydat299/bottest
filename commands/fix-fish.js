import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { User } from '../schemas/userSchema.js';

export default {
  data: new SlashCommandBuilder()
    .setName('fix-fish')
    .setDescription('🔧 Fix fish command issues')
    .addSubcommand(subcommand =>
      subcommand
        .setName('status')
        .setDescription('Check current fishing status')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('reset')
        .setDescription('Reset fishing cooldown')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('test')
        .setDescription('Test simple fishing')
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    try {
      if (subcommand === 'status') {
        const user = await User.findOne({ discordId: interaction.user.id });
        
        const embed = new EmbedBuilder()
          .setTitle('🔧 FISHING STATUS')
          .setDescription(`**Status for ${interaction.user.username}:**`)
          .addFields(
            { name: '👤 User Found', value: user ? '✅ Yes' : '❌ No', inline: true },
            { name: '🎣 Total Caught', value: (user?.totalFished || 0).toString(), inline: true },
            { name: '🎒 Fish in Inventory', value: (user?.inventory?.length || 0).toString(), inline: true },
            { name: '💰 Balance', value: (user?.balance || 0).toLocaleString() + ' xu', inline: true },
            { name: '🎯 Rod Level', value: (user?.rodLevel || 1).toString(), inline: true },
            { name: '⏰ Last Fished', value: user?.lastFished ? `<t:${Math.floor(user.lastFished / 1000)}:R>` : 'Never', inline: true }
          )
          .setColor('#3498db')
          .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });

      } else if (subcommand === 'reset') {
        let user = await User.findOne({ discordId: interaction.user.id });
        
        if (!user) {
          user = new User({
            discordId: interaction.user.id,
            username: interaction.user.username,
            balance: 0,
            inventory: [],
            rodLevel: 1
          });
        }
        
        user.lastFished = null;
        await user.save();

        await interaction.reply({
          content: '✅ **Fishing cooldown cleared!** You can use `/fish` now.',
          ephemeral: true
        });

      } else if (subcommand === 'test') {
        let user = await User.findOne({ discordId: interaction.user.id });
        
        if (!user) {
          user = new User({
            discordId: interaction.user.id,
            username: interaction.user.username,
            balance: 0,
            inventory: [],
            rodLevel: 1
          });
        }

        // Add a test fish
        const testFish = {
          name: 'Debug Fish',
          rarity: 'common',
          value: 150,
          caughtAt: new Date()
        };

        if (!user.inventory) user.inventory = [];
        user.inventory.push(testFish);
        user.totalFished = (user.totalFished || 0) + 1;
        user.lastFished = Date.now();
        
        await user.save();

        await interaction.reply({
          content: '🎣 **Test fish caught!** Debug Fish added to inventory. Try `/inventory` to see it.',
          ephemeral: true
        });
      }

    } catch (error) {
      console.error('Error in fix-fish command:', error);
      await interaction.reply({
        content: '❌ Error: ' + error.message,
        ephemeral: true
      });
    }
  }
};