import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('upgrades')
    .setDescription('Xem bảng giá nâng cấp cần câu 💰'),

  async execute(interaction) {
    const upgradeCosts = {
      1: 500,   // Level 1 -> 2: 500 xu
      2: 5000,  // Level 2 -> 3: 1000 xu
      3: 10000,  // Level 3 -> 4: 2000 xu
      4: 15000,  // Level 4 -> 5: 5000 xu
      5: 20000, // Level 5 -> 6: 10000 xu
      6: 50000, // Level 6 -> 7: 20000 xu
      7: 100000, // Level 7 -> 8: 50000 xu
      8: 150000,// Level 8 -> 9: 100000 xu
      9: 300000,// Level 9 -> 10: 200000 xu
      10: 'MAX LEVEL'
    };

    const embed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle('🎣 Bảng Giá Nâng Cấp Cần Câu')
      .setDescription('Giá nâng cấp cho từng level cần câu')
      .setTimestamp();

    let upgradeList = '';
    for (let level = 1; level <= 10; level++) {
      const cost = upgradeCosts[level];
      const emoji = level === 10 ? '🏆' : '⭐'.repeat(Math.min(level, 5));
      
      if (level === 10) {
        upgradeList += `${emoji} **Level ${level}**: ${cost}\n`;
      } else {
        upgradeList += `${emoji} **Level ${level} → ${level + 1}**: ${cost.toLocaleString()} xu\n`;
      }
    }

    embed.addFields([
      { 
        name: '💎 Bảng Giá Nâng Cấp', 
        value: upgradeList,
        inline: false 
      },
      {
        name: '🎯 Lợi Ích',
        value: '• Tăng cơ hội câu được cá hiếm\n• Mở khóa những loại cá đặc biệt\n• Tăng tỷ lệ câu được cá Boss',
        inline: false
      }
    ]);

    await interaction.reply({ embeds: [embed] });
  }
};
