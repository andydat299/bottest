import { User } from '../schemas/userSchema.js';

// Simple Quest System với nhiều nhiệm vụ đa dạng
// Tối đa 3 quest/ngày, tổng thưởng không quá 1000 xu
const QUEST_TEMPLATES = [
  // 🎣 FISHING QUESTS - 40%
  { id: 'fish_basic', type: 'fish', name: 'Thợ Câu Mới', desc: 'Câu {target} con cá', target: [5, 8, 10, 12, 15], reward: [100, 150, 200, 250, 300], weight: 15 },
  { id: 'fish_rare', type: 'rare_fish', name: 'Săn Cá Hiếm', desc: 'Câu {target} con cá Rare+', target: [1, 2, 3, 4, 5], reward: [150, 250, 350, 450, 500], weight: 10 },
  { id: 'fish_value', type: 'fish_value', name: 'Thu Thập Giá Trị', desc: 'Thu thập cá trị giá {target} xu', target: [2000, 3000, 4000, 5000, 6000], reward: [120, 180, 240, 300, 360], weight: 12 },
  { id: 'fish_streak', type: 'fishing_streak', name: 'Chuỗi May Mắn', desc: 'Câu {target} lần liên tiếp không hỏng', target: [3, 5, 7, 10, 12], reward: [200, 300, 400, 500, 600], weight: 8 },
  { id: 'fish_morning', type: 'time_fishing', name: 'Câu Cá Sáng Sớm', desc: 'Câu {target} con cá vào buổi sáng (6h-12h)', target: [3, 5, 8, 10, 12], reward: [150, 200, 280, 350, 420], weight: 6 },

  // 🎮 GAMING QUESTS - 25%
  { id: 'blackjack_wins', type: 'blackjack_wins', name: 'Thắng Blackjack', desc: 'Thắng {target} ván Blackjack', target: [2, 3, 4, 5, 6], reward: [180, 250, 320, 400, 480], weight: 8 },
  { id: 'wheel_spins', type: 'wheel_spins', name: 'Quay Wheel', desc: 'Quay wheel {target} lần', target: [3, 5, 8, 10, 12], reward: [120, 180, 250, 320, 380], weight: 9 },
  { id: 'small_bets', type: 'betting', name: 'Đặt Cược Nhỏ', desc: 'Đặt cược tổng {target} xu', target: [2000, 3000, 4000, 5000, 6000], reward: [150, 220, 290, 360, 430], weight: 7 },
  { id: 'lucky_wins', type: 'lucky_wins', name: 'Thắng May Mắn', desc: 'Thắng {target} lần bất kỳ game nào', target: [1, 2, 3, 4, 5], reward: [200, 300, 400, 500, 600], weight: 6 },

  // 👥 SOCIAL QUESTS - 20%
  { id: 'daily_chat', type: 'chat_messages', name: 'Chat Hàng Ngày', desc: 'Gửi {target} tin nhắn', target: [10, 15, 20, 25, 30], reward: [100, 140, 180, 220, 260], weight: 10 },
  { id: 'help_others', type: 'help_commands', name: 'Người Giúp Đỡ', desc: 'Dùng lệnh help {target} lần', target: [2, 3, 4, 5, 6], reward: [80, 120, 160, 200, 240], weight: 8 },
  { id: 'check_balance', type: 'balance_checks', name: 'Kiểm Tra Tài Sản', desc: 'Xem balance {target} lần', target: [3, 5, 7, 10, 12], reward: [60, 90, 120, 150, 180], weight: 9 },
  { id: 'social_interact', type: 'interactions', name: 'Giao Lưu', desc: 'Tương tác với {target} người khác', target: [2, 3, 4, 5, 6], reward: [120, 180, 240, 300, 360], weight: 7 },

  // 💰 ECONOMY QUESTS - 10%
  { id: 'spend_xu', type: 'spend_xu', name: 'Tiêu Dùng', desc: 'Chi tiêu {target} xu', target: [1000, 1500, 2000, 2500, 3000], reward: [100, 150, 200, 250, 300], weight: 6 },
  { id: 'collect_fish', type: 'collect_types', name: 'Sưu Tập Cá', desc: 'Sở hữu {target} loại cá khác nhau', target: [5, 7, 10, 12, 15], reward: [150, 200, 280, 350, 420], weight: 5 },
  { id: 'inventory_size', type: 'inventory_count', name: 'Kho Đầy', desc: 'Có {target} con cá trong kho', target: [20, 30, 40, 50, 60], reward: [120, 180, 240, 300, 360], weight: 4 },

  // ⭐ SPECIAL QUESTS - 5%
  { id: 'complete_quests', type: 'quest_master', name: 'Hoàn Thành Quest', desc: 'Hoàn thành {target} quest khác', target: [1, 2, 3, 4, 5], reward: [200, 350, 500, 650, 800], weight: 3 },
  { id: 'lucky_day', type: 'lucky_events', name: 'Ngày May Mắn', desc: 'Gặp {target} sự kiện may mắn', target: [1, 2, 3, 4, 5], reward: [250, 400, 550, 700, 850], weight: 2 },
  { id: 'active_hours', type: 'time_active', name: 'Hoạt Động Lâu', desc: 'Hoạt động {target} giờ trong ngày', target: [2, 3, 4, 5, 6], reward: [180, 280, 380, 480, 580], weight: 2 }
];

// Constants
const MAX_DAILY_QUESTS = 3;
const MAX_DAILY_REWARD = 1000;
const QUEST_EXPIRY_HOURS = 24;

// Weighted random selection
function getRandomQuestTemplate() {
  const totalWeight = QUEST_TEMPLATES.reduce((sum, template) => sum + template.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const template of QUEST_TEMPLATES) {
    random -= template.weight;
    if (random <= 0) {
      return template;
    }
  }
  return QUEST_TEMPLATES[0];
}

// Generate single quest với balanced rewards
function generateQuest(userId, existingRewards = 0) {
  const template = getRandomQuestTemplate();
  
  // Calculate remaining reward budget
  const remainingBudget = MAX_DAILY_REWARD - existingRewards;
  
  // Select difficulty based on remaining budget
  let difficultyIndex = 0;
  for (let i = template.reward.length - 1; i >= 0; i--) {
    if (template.reward[i] <= remainingBudget) {
      difficultyIndex = i;
      break;
    }
  }
  
  // Add some randomness (±1 level if possible)
  if (difficultyIndex > 0 && Math.random() < 0.3) difficultyIndex--;
  if (difficultyIndex < template.reward.length - 1 && Math.random() < 0.3) difficultyIndex++;
  
  const questId = `${template.id}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
  
  return {
    id: questId,
    templateId: template.id,
    type: template.type,
    name: template.name,
    description: template.desc.replace('{target}', template.target[difficultyIndex]),
    target: template.target[difficultyIndex],
    progress: 0,
    reward: template.reward[difficultyIndex],
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + QUEST_EXPIRY_HOURS * 60 * 60 * 1000),
    isCompleted: false,
    isClaimed: false
  };
}

/**
 * Generate daily quests cho user (max 3, total reward ≤ 1000)
 */
export async function generateDailyQuests(userId) {
  const user = await User.findOne({ discordId: userId });
  if (!user) throw new Error('User not found');

  // Check if user already has quests today
  const today = new Date().toDateString();
  const existingQuests = user.quests?.filter(q => 
    new Date(q.createdAt).toDateString() === today && 
    new Date(q.expiresAt) > new Date()
  ) || [];

  if (existingQuests.length >= MAX_DAILY_QUESTS) {
    throw new Error(`Bạn đã có ${MAX_DAILY_QUESTS} quest hôm nay! Quay lại vào ngày mai.`);
  }

  // Calculate existing reward total
  const existingRewardTotal = existingQuests.reduce((sum, q) => sum + q.reward, 0);
  
  if (existingRewardTotal >= MAX_DAILY_REWARD) {
    throw new Error('Bạn đã đạt giới hạn thưởng hôm nay!');
  }

  // Generate new quests
  const newQuests = [];
  const usedTypes = new Set(existingQuests.map(q => q.type));
  let totalRewards = existingRewardTotal;

  const questsToGenerate = MAX_DAILY_QUESTS - existingQuests.length;

  for (let i = 0; i < questsToGenerate; i++) {
    let attempts = 0;
    let quest;

    do {
      quest = generateQuest(userId, totalRewards);
      attempts++;
    } while (
      attempts < 20 && 
      (usedTypes.has(quest.type) || totalRewards + quest.reward > MAX_DAILY_REWARD)
    );

    // If we can't find a suitable quest, generate a smaller one
    if (totalRewards + quest.reward > MAX_DAILY_REWARD) {
      const remainingBudget = MAX_DAILY_REWARD - totalRewards;
      if (remainingBudget >= 50) {
        // Generate a small quest that fits budget
        quest.reward = Math.min(quest.reward, remainingBudget);
        quest.description = quest.description + ` (Mini quest)`;
      } else {
        break; // Skip if remaining budget too small
      }
    }

    newQuests.push(quest);
    usedTypes.add(quest.type);
    totalRewards += quest.reward;
  }

  // Add to user's quests
  if (!user.quests) user.quests = [];
  
  // Clean expired quests
  user.quests = user.quests.filter(q => new Date(q.expiresAt) > new Date());
  
  // Add new quests
  user.quests.push(...newQuests);
  await user.save();

  return {
    newQuests,
    totalQuests: user.quests.length,
    totalRewardToday: totalRewards,
    remainingBudget: MAX_DAILY_REWARD - totalRewards
  };
}

/**
 * Update quest progress
 */
export async function updateQuestProgress(userId, questType, amount = 1, metadata = {}) {
  const user = await User.findOne({ discordId: userId });
  if (!user || !user.quests) return [];

  const completedQuests = [];
  const now = new Date();

  for (const quest of user.quests) {
    if (quest.isCompleted || new Date(quest.expiresAt) < now || quest.type !== questType) {
      continue;
    }

    // Special handling cho các quest types
    let progressToAdd = amount;

    switch (questType) {
      case 'time_fishing':
        const hour = new Date().getHours();
        if (quest.templateId === 'fish_morning' && (hour < 6 || hour >= 12)) {
          continue; // Not morning time
        }
        break;
        
      case 'rare_fish':
        if (metadata.rarity && !['rare', 'epic', 'legendary'].includes(metadata.rarity.toLowerCase())) {
          continue;
        }
        break;
        
      case 'fish_value':
        progressToAdd = metadata.value || amount;
        break;
        
      case 'betting':
        progressToAdd = metadata.betAmount || amount;
        break;

      default:
        progressToAdd = amount;
    }

    quest.progress += progressToAdd;

    if (quest.progress >= quest.target) {
      quest.isCompleted = true;
      completedQuests.push(quest);
    }
  }

  if (completedQuests.length > 0) {
    await user.save();
  }

  return completedQuests;
}

/**
 * Get user's active quests
 */
export async function getUserQuests(userId) {
  const user = await User.findOne({ discordId: userId });
  if (!user) return [];

  const now = new Date();
  const activeQuests = user.quests?.filter(q => new Date(q.expiresAt) > now) || [];

  // Sort: completed first, then by progress
  return activeQuests.sort((a, b) => {
    if (a.isCompleted !== b.isCompleted) {
      return a.isCompleted ? -1 : 1;
    }
    return (b.progress / b.target) - (a.progress / a.target);
  });
}

/**
 * Claim quest reward
 */
export async function claimQuestReward(userId, questId) {
  const user = await User.findOne({ discordId: userId });
  if (!user) return 0;

  const quest = user.quests?.find(q => q.id === questId);
  if (!quest || !quest.isCompleted || quest.isClaimed) return 0;

  quest.isClaimed = true;
  user.balance = (user.balance || 0) + quest.reward;
  await user.save();

  return quest.reward;
}

/**
 * Claim all completed quests
 */
export async function claimAllQuests(userId) {
  const user = await User.findOne({ discordId: userId });
  if (!user) return { count: 0, totalReward: 0 };

  const claimableQuests = user.quests?.filter(q => q.isCompleted && !q.isClaimed) || [];
  
  if (claimableQuests.length === 0) {
    return { count: 0, totalReward: 0 };
  }

  let totalReward = 0;
  for (const quest of claimableQuests) {
    quest.isClaimed = true;
    totalReward += quest.reward;
  }

  user.balance = (user.balance || 0) + totalReward;
  await user.save();

  return { count: claimableQuests.length, totalReward };
}

/**
 * Get quest statistics
 */
export async function getQuestStats(userId) {
  const user = await User.findOne({ discordId: userId });
  if (!user || !user.quests) return null;

  const allQuests = user.quests;
  const today = new Date().toDateString();
  
  const todayQuests = allQuests.filter(q => new Date(q.createdAt).toDateString() === today);
  const completed = allQuests.filter(q => q.isCompleted).length;
  const claimed = allQuests.filter(q => q.isClaimed).length;
  const totalRewards = allQuests.filter(q => q.isClaimed).reduce((sum, q) => sum + q.reward, 0);

  return {
    totalQuests: allQuests.length,
    todayQuests: todayQuests.length,
    completedQuests: completed,
    claimedQuests: claimed,
    totalRewards,
    todayRewards: todayQuests.filter(q => q.isClaimed).reduce((sum, q) => sum + q.reward, 0),
    completionRate: allQuests.length > 0 ? Math.round((completed / allQuests.length) * 100) : 0
  };
}