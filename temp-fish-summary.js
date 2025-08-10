// Tạo fish summary để hiển thị
const fishSummary = Object.entries(caughtFish)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5) // Top 5 loại cá
  .map(([name, count]) => `• ${name}: ${count} con`)
  .join('\n') || 'Không có cá nào';

const completedEmbed = new EmbedBuilder()
  .setTitle('🎉 Tự Động Câu Cá Hoàn Thành!')
  .setDescription(`Đã hoàn thành ${duration} phút tự động câu cá!`)
  .setColor('#00FF00')
  .addFields(
    { name: '🐟 Tổng cá câu được', value: `${fishCaught} con`, inline: true },
    { name: '💰 Tiền kiếm được', value: `${coinsEarned.toLocaleString()} coins`, inline: true },
    { name: '⏱️ Thời gian sử dụng', value: `${duration} phút`, inline: true },
    { name: '🕒 Đã dùng hôm nay', value: `${user.autoFishingToday.minutes}/${maxDuration} phút`, inline: true },
    { name: '👑 VIP Tier', value: vipPerks.tier, inline: true },
    { name: '🟢 Thời gian còn lại', value: `${remainingMinutes} phút`, inline: true },
    { name: '🎣 Cá câu được (Top 5)', value: fishSummary, inline: false },
    { name: '📊 Tiến độ', value: '▰▰▰▰▰▰▰▰▰▰ 100% ✅', inline: false }
  )
  .setFooter({ text: `${vipPerks.tier} - Sử dụng fishtype.js với weighted rarity` })
  .setTimestamp();