import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('test-user-notifications')
    .setDescription('🧪 [ADMIN] Test user notification system')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to send test notification to')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Notification type')
        .addChoices(
          { name: 'Quest Complete', value: 'quest_complete' },
          { name: 'Level Up', value: 'level_up' },
          { name: 'Daily Bonus', value: 'daily_bonus' },
          { name: 'Achievement', value: 'achievement' }
        )
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    try {
      const user = interaction.options.getUser('user');
      const notificationType = interaction.options.getString('type');
      
      const notifications = {
        quest_complete: {
          title: '🎉 Quest Completed!',
          description: 'You have completed a quest and earned rewards!',
          color: '#00ff00'
        },
        level_up: {
          title: '⭐ Level Up!',
          description: 'Congratulations! You have leveled up!',
          color: '#ffdd57'
        },
        daily_bonus: {
          title: '🎁 Daily Bonus!',
          description: 'You received your daily login bonus!',
          color: '#3498db'
        },
        achievement: {
          title: '🏆 Achievement Unlocked!',
          description: 'You unlocked a new achievement!',
          color: '#9b59b6'
        }
      };

      const notification = notifications[notificationType];
      
      const embed = new EmbedBuilder()
        .setTitle('🧪 NOTIFICATION TEST')
        .setDescription(`**Testing notification for ${user.username}:**`)
        .addFields(
          { name: '📧 Type', value: notificationType, inline: true },
          { name: '📋 Title', value: notification.title, inline: true },
          { name: '📝 Message', value: notification.description, inline: false },
          { name: '🔧 Status', value: 'Test notification sent', inline: true }
        )
        .setColor(notification.color)
        .setTimestamp();

      // Try to DM the user with test notification
      try {
        const testEmbed = new EmbedBuilder()
          .setTitle(notification.title)
          .setDescription(notification.description)
          .setColor(notification.color)
          .setFooter({ text: 'This is a test notification from admin' })
          .setTimestamp();
          
        await user.send({ embeds: [testEmbed] });
        embed.addFields({ name: '✅ Result', value: 'DM sent successfully', inline: true });
      } catch (dmError) {
        embed.addFields({ name: '❌ Result', value: 'Failed to send DM (user may have DMs disabled)', inline: true });
      }

      await interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
      console.error('Error in test-user-notifications:', error);
      await interaction.reply({
        content: '❌ Error testing notifications.',
        ephemeral: true
      });
    }
  }
};