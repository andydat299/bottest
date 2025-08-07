import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('debug-admin-channel')
    .setDescription('🔧 [ADMIN] Debug admin channel setup')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    try {
      const guild = interaction.guild;
      const adminChannels = guild.channels.cache.filter(c => 
        c.name.includes('admin') || 
        c.name.includes('staff') || 
        c.name.includes('mod')
      );

      const embed = new EmbedBuilder()
        .setTitle('🔧 ADMIN CHANNEL DEBUG')
        .setDescription('**Admin/Staff channels found:**')
        .addFields(
          {
            name: '📺 Channels',
            value: adminChannels.size > 0 
              ? adminChannels.map(c => `<#${c.id}>`).join('\n') 
              : 'No admin channels found',
            inline: false
          },
          {
            name: '⚙️ Current Channel',
            value: `<#${interaction.channel.id}>`,
            inline: true
          },
          {
            name: '🛡️ Permissions',
            value: interaction.member.permissions.has(PermissionFlagsBits.Administrator) ? '✅ Admin' : '❌ No Admin',
            inline: true
          }
        )
        .setColor('#9b59b6')
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
      console.error('Error in debug-admin-channel:', error);
      await interaction.reply({
        content: '❌ Error debugging admin channels.',
        ephemeral: true
      });
    }
  }
};