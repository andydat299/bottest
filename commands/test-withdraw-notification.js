import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('test-withdraw-notification')
    .setDescription('🧪 [ADMIN] Test withdrawal notification system')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to notify')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('status')
        .setDescription('Withdrawal status')
        .addChoices(
          { name: 'Approved', value: 'approved' },
          { name: 'Rejected', value: 'rejected' },
          { name: 'Processing', value: 'processing' }
        )
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('Withdrawal amount')
        .setMinValue(1000)
        .setMaxValue(1000000)
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    try {
      const user = interaction.options.getUser('user');
      const status = interaction.options.getString('status');
      const amount = interaction.options.getInteger('amount') || 50000;
      
      const statusConfig = {
        approved: {
          title: '✅ Withdrawal Approved',
          description: 'Your withdrawal has been approved and processed!',
          color: '#00ff00'
        },
        rejected: {
          title: '❌ Withdrawal Rejected',
          description: 'Your withdrawal request has been rejected.',
          color: '#ff0000'
        },
        processing: {
          title: '⏳ Withdrawal Processing',
          description: 'Your withdrawal is currently being processed.',
          color: '#ffdd57'
        }
      };

      const config = statusConfig[status];
      
      // Create notification embed
      const notificationEmbed = new EmbedBuilder()
        .setTitle(config.title)
        .setDescription(config.description)
        .addFields(
          { name: '💰 Amount', value: `${amount.toLocaleString()} xu`, inline: true },
          { name: '📅 Date', value: new Date().toLocaleDateString(), inline: true },
          { name: '🆔 Reference', value: `WD${Date.now()}`, inline: true }
        )
        .setColor(config.color)
        .setFooter({ text: 'Withdrawal Notification System' })
        .setTimestamp();

      // Test embed for admin
      const testEmbed = new EmbedBuilder()
        .setTitle('🧪 WITHDRAWAL NOTIFICATION TEST')
        .setDescription(`**Testing notification for ${user.username}:**`)
        .addFields(
          { name: '📧 Recipient', value: user.toString(), inline: true },
          { name: '📊 Status', value: status, inline: true },
          { name: '💰 Amount', value: `${amount.toLocaleString()} xu`, inline: true }
        )
        .setColor('#3498db')
        .setTimestamp();

      // Try to send DM notification
      try {
        await user.send({ embeds: [notificationEmbed] });
        testEmbed.addFields({ name: '✅ Result', value: 'Notification sent successfully', inline: false });
      } catch (dmError) {
        testEmbed.addFields({ name: '❌ Result', value: 'Failed to send DM (user may have DMs disabled)', inline: false });
      }

      await interaction.reply({ embeds: [testEmbed], ephemeral: true });

    } catch (error) {
      console.error('Error in test-withdraw-notification:', error);
      await interaction.reply({
        content: '❌ Error testing withdrawal notification.',
        ephemeral: true
      });
    }
  }
};