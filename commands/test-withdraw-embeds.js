import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('test-withdraw-embeds')
    .setDescription('🧪 [ADMIN] Test withdrawal embed designs')
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Embed type to test')
        .addChoices(
          { name: 'Success', value: 'success' },
          { name: 'Pending', value: 'pending' },
          { name: 'Failed', value: 'failed' },
          { name: 'Insufficient Balance', value: 'insufficient' }
        )
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    try {
      const embedType = interaction.options.getString('type');
      
      const embeds = {
        success: new EmbedBuilder()
          .setTitle('✅ Withdrawal Successful!')
          .setDescription('Your withdrawal has been processed successfully.')
          .addFields(
            { name: '💰 Amount', value: '50,000 xu', inline: true },
            { name: '📱 Method', value: 'Mobile Banking', inline: true },
            { name: '🆔 Transaction ID', value: 'TXN123456789', inline: true }
          )
          .setColor('#00ff00')
          .setTimestamp(),
          
        pending: new EmbedBuilder()
          .setTitle('⏳ Withdrawal Pending')
          .setDescription('Your withdrawal is being processed. Please wait.')
          .addFields(
            { name: '💰 Amount', value: '25,000 xu', inline: true },
            { name: '📱 Method', value: 'Bank Transfer', inline: true },
            { name: '⏱️ Est. Time', value: '1-3 business days', inline: true }
          )
          .setColor('#ffdd57')
          .setTimestamp(),
          
        failed: new EmbedBuilder()
          .setTitle('❌ Withdrawal Failed')
          .setDescription('Your withdrawal could not be processed.')
          .addFields(
            { name: '💰 Amount', value: '10,000 xu', inline: true },
            { name: '🚫 Reason', value: 'Invalid account details', inline: true },
            { name: '💡 Action', value: 'Please check your account info', inline: true }
          )
          .setColor('#ff0000')
          .setTimestamp(),
          
        insufficient: new EmbedBuilder()
          .setTitle('💸 Insufficient Balance')
          .setDescription('You do not have enough xu for this withdrawal.')
          .addFields(
            { name: '💰 Requested', value: '100,000 xu', inline: true },
            { name: '🏦 Available', value: '75,000 xu', inline: true },
            { name: '❌ Shortfall', value: '25,000 xu', inline: true }
          )
          .setColor('#ff6b6b')
          .setTimestamp()
      };

      const selectedEmbed = embeds[embedType];
      
      await interaction.reply({ 
        content: `🧪 **Testing ${embedType} withdrawal embed:**`,
        embeds: [selectedEmbed], 
        ephemeral: true 
      });

    } catch (error) {
      console.error('Error in test-withdraw-embeds:', error);
      await interaction.reply({
        content: '❌ Error testing withdrawal embeds.',
        ephemeral: true
      });
    }
  }
};