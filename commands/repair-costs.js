ện tôi import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getRepairCost, getAllRepairCosts, getDurabilityColor, getDurabilityEmoji } from '../utils/repairUtils.js';

export default {
  data: new SlashCommandBuilder()
    .setName('repair-costs')
    .setDescription('💰 Xem bảng giá sửa chữa cần câu')
    .addIntegerOption(option =>
      option.setName('level')
        .setDescription('Xem giá cho level cụ thể (1-10)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(10)),
  async execute(interaction) {
    try {
      const specificLevel = interaction.options.getInteger('level');

      if (specificLevel) {
        // Hiển thị giá cho level cụ thể
        await showSpecificLevelCost(interaction, specificLevel);
      } else {
        // Hiển thị bảng giá đầy đủ
        await showAllRepairCosts(interaction);
      }

    } catch (error) {
      console.error('Repair costs command error:', error);
      await interaction.reply({
        content: '❌ Có lỗi xảy ra khi lấy thông tin giá sửa chữa!',
        flags: 64
      });
    }
  }
};

async function showAllRepairCosts(interaction) {
  const allCosts = getAllRepairCosts();
  
  const embed = new EmbedBuilder()
    .setTitle('💰 Bảng Giá Sửa Chữa Cần Câu')
    .setDescription('**Chi phí sửa chữa cho từng level cần câu:**')
    .setColor('#3498db')
    .setTimestamp();

  // Tạo danh sách giá với emoji và màu sắc
  let costList = '';
  let totalCost = 0;
  
  for (let level = 1; level <= 10; level++) {
    const cost = getRepairCost(level);
    const emoji = level <= 3 ? '🟢' : level <= 6 ? '🟡' : level <= 8 ? '🟠' : '🔴';
    const tier = level <= 3 ? 'Dễ' : level <= 6 ? 'Trung bình' : level <= 8 ? 'Khó' : 'Cực khó';
    
    costList += `${emoji} **Level ${level}** (${tier}): **${cost.toLocaleString()}** xu\n`;
    totalCost += cost;
  }

  embed.addFields(
    { name: '📊 Chi Phí Theo Level', value: costList, inline: false },
    { name: '📈 Thống Kê Tổng Quan', value: [
      `💸 **Giá rẻ nhất:** ${Math.min(...Object.values(allCosts)).toLocaleString()} xu (Level 1)`,
      `💎 **Giá đắt nhất:** ${Math.max(...Object.values(allCosts)).toLocaleString()} xu (Level 10)`,
      `🧮 **Tổng chi phí (1→10):** ${totalCost.toLocaleString()} xu`,
      `📊 **Tỷ lệ tăng:** x${(Math.max(...Object.values(allCosts)) / Math.min(...Object.values(allCosts))).toFixed(1)}`
    ].join('\n'), inline: false },
    { name: '💡 Lưu Ý', value: [
      '🔧 Giá sửa chữa phụ thuộc vào level cần câu',
      '⚡ Level cao hơn = Chi phí sửa chữa cao hơn',
      '💰 Sử dụng `/repair` để sửa chữa cần câu',
      '📱 Dùng `/repair-costs level:X` để xem chi tiết level cụ thể'
    ].join('\n'), inline: false }
  );

  embed.setFooter({ text: 'Giá có thể thay đổi theo quyết định của admin' });

  await interaction.reply({ embeds: [embed] });
}

async function showSpecificLevelCost(interaction, level) {
  const cost = getRepairCost(level);
  const maxDurability = level * 10;
  
  // Tính toán statistics cho level này
  const allCosts = getAllRepairCosts();
  const avgCost = Object.values(allCosts).reduce((a, b) => a + b, 0) / Object.keys(allCosts).length;
  const costRank = Object.values(allCosts).filter(c => c <= cost).length;
  
  const embed = new EmbedBuilder()
    .setTitle(`🎣 Chi Phí Sửa Chữa - Level ${level}`)
    .setDescription(`**Thông tin chi tiết cho cần câu Level ${level}**`)
    .setColor(getDurabilityColor(level * 10))
    .setTimestamp();

  // Thông tin cơ bản
  embed.addFields(
    { name: '💰 Giá Sửa Chữa', value: `**${cost.toLocaleString()}** xu`, inline: true },
    { name: '🛡️ Độ Bền Tối Đa', value: `${maxDurability} điểm`, inline: true },
    { name: '🏷️ Hạng Giá', value: `${costRank}/10 (${costRank <= 3 ? 'Rẻ' : costRank <= 7 ? 'Trung bình' : 'Đắt'})`, inline: true }
  );

  // So sánh với levels khác
  const prevCost = level > 1 ? getRepairCost(level - 1) : 0;
  const nextCost = level < 10 ? getRepairCost(level + 1) : 0;
  
  let comparison = '';
  if (level > 1) {
    const increase = cost - prevCost;
    const percentage = ((increase / prevCost) * 100).toFixed(1);
    comparison += `📈 **Level ${level-1} → ${level}:** +${increase.toLocaleString()} xu (+${percentage}%)\n`;
  }
  if (level < 10) {
    const increase = nextCost - cost;
    const percentage = ((increase / cost) * 100).toFixed(1);
    comparison += `📊 **Level ${level} → ${level+1}:** +${increase.toLocaleString()} xu (+${percentage}%)\n`;
  }

  if (comparison) {
    embed.addFields({ name: '🔄 So Sánh Level', value: comparison, inline: false });
  }

  // Thống kê chi tiết
  embed.addFields(
    { name: '📊 Thống Kê Chi Tiết', value: [
      `💵 **So với giá trung bình:** ${cost > avgCost ? `+${(cost - avgCost).toFixed(0)}` : `-${(avgCost - cost).toFixed(0)}`} xu`,
      `🎯 **Cost per durability:** ${(cost / maxDurability).toFixed(1)} xu/điểm`,
      `⚡ **Efficiency rating:** ${level <= 3 ? '⭐⭐⭐' : level <= 6 ? '⭐⭐' : '⭐'} (cost/benefit)`,
      `🏆 **Recommended for:** ${level <= 5 ? 'Người mới' : level <= 8 ? 'Trung cấp' : 'Chuyên gia'}`
    ].join('\n'), inline: false }
  );

  // Tips cho level này
  let tips = '';
  if (level <= 3) {
    tips = '💡 **Tips:** Giá rẻ, phù hợp để học cách quản lý độ bền cần câu';
  } else if (level <= 6) {
    tips = '💡 **Tips:** Cân nhắng giữa hiệu suất và chi phí, nên có dự trữ xu';
  } else if (level <= 8) {
    tips = '💡 **Tips:** Chi phí cao, hãy câu cá cẩn thận để tối ưu độ bền';
  } else {
    tips = '💡 **Tips:** Chi phí rất cao! Chỉ sửa khi thực sự cần thiết';
  }

  embed.addFields({ name: '🎯 Khuyến Nghị', value: tips, inline: false });

  embed.setFooter({ text: `Dùng /repair để sửa chữa cần câu Level ${level}` });

  await interaction.reply({ embeds: [embed] });
}