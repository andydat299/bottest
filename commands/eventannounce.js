import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('eventannounce')
    .setDescription('📢 [ADMIN] Announce server events')
    .addStringOption(option =>
      option.setName('title')
        .setDescription('Event title')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('description')
        .setDescription('Event description')
        .setRequired(true)
    )
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('Channel to announce in')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    try {
      const title = interaction.options.getString('title');
      const description = interaction.options.getString('description');
      const targetChannel = interaction.options.getChannel('channel') || interaction.channel;
      
      const embed = new EmbedBuilder()
        .setTitle(`🎉 ${title}`)
        .setDescription(description)
        .setColor('#ff6b6b')
        .setThumbnail(interaction.guild.iconURL())
        .setFooter({ text: 'Server Event Announcement' })
        .setTimestamp();

      await targetChannel.send({ 
        content: '@everyone',
        embeds: [embed] 
      });
      
      await interaction.reply({
        content: `✅ Event announced in ${targetChannel}!`,
        ephemeral: true
      });

    } catch (error) {
      console.error('Error in eventannounce:', error);
      await interaction.reply({
        content: '❌ Failed to announce event.',
        ephemeral: true
      });
    }
  }
};