/**
 * Chat Activity System - Tạo hoạt động và sự hứng thú khi có người nhận xu
 */

import { EmbedBuilder } from 'discord.js';

// Danh sách tin nhắn khích lệ ngẫu nhiên
const ENCOURAGEMENT_MESSAGES = [
  "🔥 Ai sẽ là người tiếp theo nhận xu?",
  "✨ Chat thêm đi, may ra bạn cũng nhận được xu!",
  "🎲 Tỉ lệ 10% nhưng ai biết được!",
  "💫 Cơ hội của bạn đang chờ đấy!",
  "🌟 Tiếp tục chat, xu đang chờ rơi!",
  "🎯 30 giây cooldown đã hết, ai muốn thử vận may?",
  "🎪 Event đang nóng, đừng bỏ lỡ!",
  "🎊 Chat nhiều lên, xu sẽ rơi thôi!"
];

// Danh sách phản ứng khi có người nhận xu
const CELEBRATION_REACTIONS = [
  "🎉 Wowww, may mắn quá!",
  "💰 Giàu rồi đấy!",
  "⚡ Tỉ lệ 10% mà trúng luôn!",
  "🔥 Hot streak đây rồi!",
  "✨ Vận may đang mỉm cười!",
  "🎯 Skilled or lucky?",
  "💎 Diamond hands!",
  "🌟 Main character moment!"
];

/**
 * Gửi tin nhắn khích lệ sau khi có người nhận xu
 */
export async function sendEncouragementMessage(channel) {
  try {
    // Chờ 3-5 giây để tạo khoảng cách tự nhiên
    const delay = Math.random() * 2000 + 3000; // 3-5 giây
    
    setTimeout(async () => {
      const randomMessage = ENCOURAGEMENT_MESSAGES[Math.floor(Math.random() * ENCOURAGEMENT_MESSAGES.length)];
      
      // 30% cơ hội gửi tin nhắn khích lệ
      if (Math.random() < 0.3) {
        await channel.send(randomMessage);
      }
    }, delay);
    
  } catch (error) {
    console.error('Error sending encouragement:', error);
  }
}

/**
 * Tạo tin nhắn chúc mừng ngẫu nhiên
 */
export function getRandomCelebration() {
  return CELEBRATION_REACTIONS[Math.floor(Math.random() * CELEBRATION_REACTIONS.length)];
}

/**
 * Tạo embed thông báo đặc biệt cho những lần nhận xu cao
 */
export function createSpecialRewardEmbed(username, coins, newBalance, avatar) {
  let specialTitle = '';
  let specialColor = '#ffd700';
  let specialDescription = '';
  
  if (coins >= 800) {
    specialTitle = '🎊 JACKPOT! ULTRA RARE! 🎊';
    specialColor = '#ff1493'; // Deep pink
    specialDescription = `💥 **${username}** vừa trúng **JACKPOT ${coins.toLocaleString()} xu**! Quá may mắn! 💥`;
  } else if (coins >= 500) {
    specialTitle = '🌟 SUPER LUCKY! 🌟';
    specialColor = '#ff6b35'; // Orange red
    specialDescription = `🔥 **${username}** vừa nhận **${coins.toLocaleString()} xu**! Siêu may mắn! 🔥`;
  } else if (coins >= 300) {
    specialTitle = '⚡ RARE DROP! ⚡';
    specialColor = '#9370db'; // Medium purple
    specialDescription = `✨ **${username}** vừa nhận **${coins.toLocaleString()} xu**! Rare drop! ✨`;
  } else {
    return null; // Dùng embed thường
  }
  
  return new EmbedBuilder()
    .setTitle(specialTitle)
    .setDescription(specialDescription)
    .addFields(
      { name: '💎 Số dư hiện tại', value: `${newBalance.toLocaleString()} xu`, inline: true },
      { name: '🎲 Tỉ lệ', value: '10% - Cực hiếm!', inline: true },
      { name: '🏆 Rank', value: coins >= 800 ? 'JACKPOT' : coins >= 500 ? 'SUPER' : 'RARE', inline: true }
    )
    .setColor(specialColor)
    .setThumbnail(avatar)
    .setFooter({ 
      text: getRandomCelebration(),
    })
    .setTimestamp();
}

/**
 * Thống kê hoạt động chat trong khoảng thời gian ngắn
 */
const recentRewards = [];

export function trackRecentReward(userId, coins) {
  const now = Date.now();
  recentRewards.push({ userId, coins, timestamp: now });
  
  // Xóa những reward cũ hơn 5 phút
  const fiveMinutesAgo = now - 5 * 60 * 1000;
  while (recentRewards.length > 0 && recentRewards[0].timestamp < fiveMinutesAgo) {
    recentRewards.shift();
  }
  
  return recentRewards.length;
}

/**
 * Kiểm tra xem có đang hot streak không (nhiều người nhận xu liên tiếp)
 */
export function checkHotStreak() {
  const recentCount = recentRewards.length;
  
  if (recentCount >= 5) {
    return {
      isHotStreak: true,
      level: 'ULTRA HOT',
      message: '🔥🔥🔥 ULTRA HOT STREAK! Xu đang rơi như mưa! 🔥🔥🔥'
    };
  } else if (recentCount >= 3) {
    return {
      isHotStreak: true,
      level: 'HOT',
      message: '🔥🔥 HOT STREAK! Event đang rất hot! 🔥🔥'
    };
  }
  
  return { isHotStreak: false };
}
