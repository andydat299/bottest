/**
 * VIP System Utilities
 */

/**
 * VIP Tier configurations
 */
export const VIP_TIERS = {
  bronze: {
    name: '🥉 VIP Đồng',
    cost: 100000, // 100k xu
    duration: 30, // days
    benefits: {
      fishingMissReduction: 10,
      rareFishBoost: 20,
      dailyBonus: 1000,
      casinoWinBoost: 5,
      cooldownReduction: 25,
      shopDiscount: 10,
      mysteryBoxChance: 0,
      automationHours: 0,
      hasNoCooldowns: false,
      hasFullAutomation: false,
      accessVipTables: false,
      accessPrivateRooms: false
    }
  },
  silver: {
    name: '🥈 VIP Bạc',
    cost: 300000, // 300k xu
    duration: 30,
    benefits: {
      fishingMissReduction: 20,
      rareFishBoost: 40,
      dailyBonus: 2500,
      casinoWinBoost: 10,
      cooldownReduction: 50,
      shopDiscount: 20,
      mysteryBoxChance: 10,
      automationHours: 0,
      hasNoCooldowns: false,
      hasFullAutomation: false,
      accessVipTables: true,
      accessPrivateRooms: false
    }
  },
  gold: {
    name: '🥇 VIP Vàng',
    cost: 800000, // 800k xu
    duration: 30,
    benefits: {
      fishingMissReduction: 30,
      rareFishBoost: 60,
      dailyBonus: 5000,
      casinoWinBoost: 15,
      cooldownReduction: 75,
      shopDiscount: 30,
      mysteryBoxChance: 20,
      automationHours: 2,
      hasNoCooldowns: false,
      hasFullAutomation: false,
      accessVipTables: true,
      accessPrivateRooms: true
    }
  },
  diamond: {
    name: '💎 VIP Kim Cương',
    cost: 2000000, // 2M xu
    duration: 30,
    benefits: {
      fishingMissReduction: 50,
      rareFishBoost: 100,
      dailyBonus: 10000,
      casinoWinBoost: 25,
      cooldownReduction: 100,
      shopDiscount: 50,
      mysteryBoxChance: 30,
      automationHours: 24,
      hasNoCooldowns: true,
      hasFullAutomation: true,
      accessVipTables: true,
      accessPrivateRooms: true
    }
  }
};

/**
 * Mystery Box configurations
 */
export const MYSTERY_BOX_TYPES = {
  basic: {
    name: '🎁 Hộp Bí Ẩn Cơ Bản',
    cost: 10000, // 10k xu
    rewards: {
      common: { chance: 60, items: [
        { type: 'xu', value: [2000, 8000] },
        { type: 'item', name: 'Cần Câu Cơ Bản', value: 3000 }
      ]},
      uncommon: { chance: 25, items: [
        { type: 'item', name: 'Nâng Cấp Cần Câu', value: 8000 },
        { type: 'item', name: 'Bùa May Mắn', value: 5000, duration: 3600 }
      ]},
      rare: { chance: 10, items: [
        { type: 'xu', value: [15000, 35000] },
        { type: 'multiplier', name: 'Nhân Đôi Kinh Nghiệm', value: 2, duration: 3600 }
      ]},
      epic: { chance: 4, items: [
        { type: 'vip', name: 'VIP Đồng', value: 3, tier: 'bronze' },
        { type: 'xu', value: 75000 }
      ]},
      legendary: { chance: 1, items: [
        { type: 'vip', name: 'VIP Bạc', value: 7, tier: 'silver' },
        { type: 'xu', value: 150000 }
      ]}
    }
  },
  mega: {
    name: '🎊 Hộp Bí Ẩn Khổng Lồ',
    cost: 50000, // 50k xu
    rewards: {
      common: { chance: 40, items: [
        { type: 'xu', value: [10000, 30000] },
        { type: 'item', name: 'Nhiều Vật Phẩm Cơ Bản', value: 15000 }
      ]},
      uncommon: { chance: 30, items: [
        { type: 'item', name: 'Thiết Bị Câu Cá Cao Cấp', value: 25000 },
        { type: 'item', name: 'Tăng Cường Casino', value: 18000, duration: 7200 }
      ]},
      rare: { chance: 20, items: [
        { type: 'xu', value: [40000, 100000] },
        { type: 'vip', name: 'VIP Đồng', value: 7, tier: 'bronze' }
      ]},
      epic: { chance: 8, items: [
        { type: 'vip', name: 'VIP Bạc', value: 14, tier: 'silver' },
        { type: 'xu', value: [150000, 300000] }
      ]},
      legendary: { chance: 2, items: [
        { type: 'vip', name: 'VIP Vàng', value: 7, tier: 'gold' },
        { type: 'xu', value: 600000 }
      ]}
    }
  },
  diamond: {
    name: '💎 Hộp Bí Ẩn Kim Cương',
    cost: 200000, // 200k xu
    vipRequired: true,
    rewards: {
      rare: { chance: 50, items: [
        { type: 'xu', value: [100000, 250000] },
        { type: 'vip', name: 'VIP Bạc', value: 14, tier: 'silver' }
      ]},
      epic: { chance: 35, items: [
        { type: 'vip', name: 'VIP Vàng', value: 14, tier: 'gold' },
        { type: 'xu', value: [300000, 600000] }
      ]},
      legendary: { chance: 12, items: [
        { type: 'vip', name: 'VIP Kim Cương', value: 7, tier: 'diamond' },
        { type: 'xu', value: 1200000 }
      ]},
      mythical: { chance: 3, items: [
        { type: 'vip', name: 'VIP Kim Cương', value: 30, tier: 'diamond' },
        { type: 'xu', value: 2500000 },
        { type: 'special', name: 'Danh Hiệu Độc Quyền', value: 0 }
      ]}
    }
  }
};

/**
 * Get user's current VIP status and benefits
 * @param {Object} VIP - VIP model
 * @param {string} userId - User Discord ID
 * @returns {Object} VIP status and benefits
 */
export async function getUserVipStatus(VIP, userId) {
  try {
    const vipRecord = await VIP.findOne({ userId, isActive: true });
    
    if (!vipRecord) {
      return {
        isVip: false,
        tier: 'none',
        benefits: getDefaultBenefits(),
        expiresAt: null
      };
    }

    // Check if expired
    if (vipRecord.expiresAt && new Date() > vipRecord.expiresAt) {
      // Mark as inactive
      vipRecord.isActive = false;
      await vipRecord.save();
      
      return {
        isVip: false,
        tier: 'none',
        benefits: getDefaultBenefits(),
        expiresAt: null,
        wasExpired: true
      };
    }

    return {
      isVip: true,
      tier: vipRecord.currentTier,
      benefits: vipRecord.benefits,
      expiresAt: vipRecord.expiresAt,
      purchasedAt: vipRecord.purchasedAt
    };
  } catch (error) {
    console.error('❌ Error getting VIP status:', error);
    return {
      isVip: false,
      tier: 'none',
      benefits: getDefaultBenefits(),
      expiresAt: null
    };
  }
}

/**
 * Get default benefits for non-VIP users
 */
function getDefaultBenefits() {
  return {
    fishingMissReduction: 0,
    rareFishBoost: 0,
    dailyBonus: 0,
    casinoWinBoost: 0,
    cooldownReduction: 0,
    shopDiscount: 0,
    mysteryBoxChance: 0,
    automationHours: 0,
    hasNoCooldowns: false,
    hasFullAutomation: false,
    accessVipTables: false,
    accessPrivateRooms: false
  };
}

/**
 * Apply VIP benefits to fishing miss rate
 * @param {number} baseMissRate - Base fishing miss rate
 * @param {Object} vipBenefits - VIP benefits object
 * @returns {number} Modified miss rate
 */
export function applyVipFishingBenefits(baseMissRate, vipBenefits) {
  const reduction = vipBenefits.fishingMissReduction || 0;
  const modifiedRate = Math.max(0, baseMissRate - reduction);
  
  console.log(`🎣 VIP fishing benefits: ${baseMissRate}% → ${modifiedRate}% (${reduction}% reduction)`);
  return modifiedRate;
}

/**
 * Apply VIP benefits to daily rewards
 * @param {number} baseReward - Base daily reward
 * @param {Object} vipBenefits - VIP benefits object
 * @returns {number} Modified reward
 */
export function applyVipDailyBenefits(baseReward, vipBenefits) {
  const bonus = vipBenefits.dailyBonus || 0;
  const totalReward = baseReward + bonus;
  
  console.log(`🎁 VIP daily benefits: ${baseReward} + ${bonus} = ${totalReward} xu`);
  return totalReward;
}

/**
 * Check if user can access VIP features
 * @param {Object} vipStatus - User's VIP status
 * @param {string} feature - Feature to check
 * @returns {boolean} Has access
 */
export function hasVipAccess(vipStatus, feature) {
  if (!vipStatus.isVip) return false;
  
  switch (feature) {
    case 'vip_tables':
      return vipStatus.benefits.accessVipTables;
    case 'private_rooms':
      return vipStatus.benefits.accessPrivateRooms;
    case 'automation':
      return vipStatus.benefits.automationHours > 0;
    case 'no_cooldowns':
      return vipStatus.benefits.hasNoCooldowns;
    case 'diamond_boxes':
      return ['gold', 'diamond'].includes(vipStatus.tier);
    default:
      return false;
  }
}

/**
 * Open a mystery box and get random rewards
 * @param {string} boxType - Type of box to open
 * @returns {Object} Rewards and rarity
 */
export function openMysteryBox(boxType) {
  const boxConfig = MYSTERY_BOX_TYPES[boxType];
  if (!boxConfig) {
    throw new Error('Invalid mystery box type');
  }

  // Determine rarity based on chances
  const rand = Math.random() * 100;
  let cumulativeChance = 0;
  let selectedRarity = 'common';

  for (const [rarity, config] of Object.entries(boxConfig.rewards)) {
    cumulativeChance += config.chance;
    if (rand <= cumulativeChance) {
      selectedRarity = rarity;
      break;
    }
  }

  // Get random reward from selected rarity
  const rarityRewards = boxConfig.rewards[selectedRarity].items;
  const randomReward = rarityRewards[Math.floor(Math.random() * rarityRewards.length)];

  // Process reward value if it's a range
  let finalReward = { ...randomReward };
  if (Array.isArray(randomReward.value)) {
    const [min, max] = randomReward.value;
    finalReward.value = Math.floor(Math.random() * (max - min + 1)) + min;
  }

  finalReward.rarity = selectedRarity;

  console.log(`🎁 Mystery box opened: ${boxType} → ${selectedRarity} → ${finalReward.name || finalReward.type}`);

  return {
    reward: finalReward,
    rarity: selectedRarity,
    boxType: boxType,
    cost: boxConfig.cost
  };
}

/**
 * Get rarity color for embeds
 * @param {string} rarity - Rarity level
 * @returns {string} Hex color
 */
export function getRarityColor(rarity) {
  const colors = {
    common: '#95a5a6',
    uncommon: '#3498db',
    rare: '#9b59b6', 
    epic: '#e67e22',
    legendary: '#f1c40f',
    mythical: '#e91e63'
  };
  return colors[rarity] || '#95a5a6';
}

/**
 * Get rarity emoji
 * @param {string} rarity - Rarity level
 * @returns {string} Emoji
 */
export function getRarityEmoji(rarity) {
  const emojis = {
    common: '⚪',
    uncommon: '🔵',
    rare: '🟣',
    epic: '🟠', 
    legendary: '🟡',
    mythical: '🔴'
  };
  return emojis[rarity] || '⚪';
}