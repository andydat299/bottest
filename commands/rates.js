import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { User } from '../schemas/userSchema.js';
import { getFishProbabilities } from '../utils/fishingLogic.js';

export default {
  data: new SlashCommandBuilder()
    .setName('rates')
    .setDescription('Xem danh sách cá có thể câu được theo cấp độ cần câu �'),

  async execute(interaction) {
    // Lấy thông tin user để biết rod level
    const user = await User.findOne({ discordId: interaction.user.id }) || await User.create({ discordId: interaction.user.id });
    const rodLevel = user.rodLevel || 1;

    // Lấy tỷ lệ theo rod level hiện tại
    const probabilities = getFishProbabilities(rodLevel);

    const embed = new EmbedBuilder()
      .setColor('#FFA500')
      .setTitle('� Danh sách cá có thể câu được')
      .setDescription(`**Cần câu cấp ${rodLevel}** - Các loại cá bạn có thể câu được:`)
      .setTimestamp()
      .setFooter({ 
        text: `${interaction.user.username} - Rod Level ${rodLevel}`, 
        iconURL: interaction.user.displayAvatarURL() 
      });

    // Nhóm theo rarity
    const rarityGroups = {
      'common': { name: '🐟 Cá thường', fish: [] },
      'rare': { name: '🐠 Cá hiếm', fish: [] },
      'legendary': { name: '🐋 Cá huyền thoại', fish: [] },
      'mythical': { name: '⭐ Cá cực hiếm', fish: [] }
    };

    // Phân loại cá theo rarity
    probabilities.forEach(fish => {
      if (rarityGroups[fish.rarity]) {
        rarityGroups[fish.rarity].fish.push(fish);
      }
    });

    // Thêm field cho từng nhóm
    Object.values(rarityGroups).forEach(group => {
      if (group.fish.length > 0) {
        const fishList = group.fish.map(fish => 
          `• **${fish.name}**`
        ).join('\n');

        embed.addFields({
          name: group.name,
          value: fishList,
          inline: false
        });
      }
    });

    // Thêm thông tin bonus
    if (rodLevel > 1) {
      embed.addFields({
        name: '🎣 Bonus cần câu',
        value: `**Cấp ${rodLevel}** - Tăng cơ hội câu được cá hiếm hơn!\n• Cần câu đã được nâng cấp\n• Ảnh hưởng tích cực đến tỷ lệ cá hiếm`,
        inline: false
      });
    }

    embed.addFields({
      name: '💡 Lưu ý',
      value: '• Nâng cấp cần câu để tăng cơ hội cá hiếm!\n• Cá boss rất hiếm và khó câu được\n• Rod level cao = cơ hội cá hiếm tốt hơn\n• Cá được sắp xếp theo độ hiếm tăng dần',
      inline: false
    });

    await interaction.reply({ embeds: [embed] });
  }
};
