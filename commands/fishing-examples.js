import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('fishing-examples')
    .setDescription('📖 [ADMIN] Xem examples về fishing luck system')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return await interaction.reply({
        content: '❌ Bạn không có quyền sử dụng lệnh này!',
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setTitle('📖 Fishing Luck Examples')
      .setDescription('**Hướng dẫn sử dụng fishing luck system**')
      .addFields(
        {
          name: '👀 Xem tỷ lệ hiện tại',
          value: '```/fishing-luck user:@user```',
          inline: false
        },
        {
          name: '😈 Troll user (0% success)',
          value: '```/fishing-luck user:@user success_rate:0 duration:30```\nUser này sẽ hụt câu 100% trong 30 phút',
          inline: false
        },
        {
          name: '🎁 Boost user (100% success)',
          value: '```/fishing-luck user:@user success_rate:100 rare_rate:50 duration:60```\nUser này sẽ câu được 100% và 50% cá hiếm trong 1 giờ',
          inline: false
        },
        {
          name: '🔒 Permanent bad luck',
          value: '```/fishing-luck user:@user success_rate:10 duration:0```\nChỉ 10% tỷ lệ thành công vĩnh viễn',
          inline: false
        },
        {
          name: '⚖️ Balanced nerf',
          value: '```/fishing-luck user:@user success_rate:40 rare_rate:5 duration:120```\nGiảm tỷ lệ xuống 40% success, 5% rare trong 2 giờ',
          inline: false
        },
        {
          name: '🗑️ Reset về default',
          value: '```/fishing-luck user:@user success_rate:70 rare_rate:15 duration:1```\nSet về default và hết hạn sau 1 phút',
          inline: false
        }
      )
      .addFields(
        {
          name: '📊 Default Rates',
          value: '• **Success Rate:** 70%\n• **Rare Fish Rate:** 15%',
          inline: true
        },
        {
          name: '⏰ Duration Options',
          value: '• **0:** Vĩnh viễn\n• **1-1440:** Phút (max 24h)',
          inline: true
        },
        {
          name: '🎯 Rate Limits',
          value: '• **Success:** 0-100%\n• **Rare:** 0-50%',
          inline: true
        }
      )
      .addFields(
        {
          name: '💡 Use Cases',
          value: `
**🎮 Event Rewards:**
- Boost winners với 100% rates
- Special VIP fishing rates

**⚖️ Punishment System:**
- Temporary bad luck for rule breakers
- Reduce rates for spam fishing

**🎪 Fun Activities:**
- April Fools with 0% rates
- Lucky hour events với mega rates

**🧪 Testing:**
- Test rare fish drops
- Verify fishing mechanics
`,
          inline: false
        }
      )
      .setColor('#3498db')
      .setThumbnail('🎣')
      .setFooter({ text: 'Fishing Luck System • Use responsibly!' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};