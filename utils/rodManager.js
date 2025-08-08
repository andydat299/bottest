/**
 * Fishing Rod Management System
 * Supports 20 levels of fishing rods with progressive benefits
 */

// 20-Tier Fishing Rod System
export const FISHING_RODS = {
  1: {
    name: '🎣 Cần Tre Cơ Bản',
    cost: 0, // Free starter rod
    missReduction: 0,
    rareBoost: 0,
    durability: 100,
    tier: 'Starter',
    vipRequired: false,
    description: 'Cần câu khởi đầu cho người mới bắt đầu'
  },
  2: {
    name: '🎣 Cần Câu Sắt',
    cost: 500, // 500 xu (original price)
    missReduction: 2,
    rareBoost: 10,
    durability: 120,
    tier: 'Basic',
    vipRequired: false,
    description: 'Cần câu cơ bản được làm từ sắt'
  },
  3: {
    name: '🎣 Cần Câu Thép',
    cost: 5000, // 5K xu (original price)
    missReduction: 4,
    rareBoost: 20,
    durability: 140,
    tier: 'Basic',
    vipRequired: false,
    description: 'Cần câu thép bền chắc hơn'
  },
  4: {
    name: '🎣 Cần Câu Titan',
    cost: 10000, // 10K xu (original price)
    missReduction: 6,
    rareBoost: 30,
    durability: 160,
    tier: 'Basic',
    vipRequired: false,
    description: 'Cần câu titan nhẹ và mạnh'
  },
  5: {
    name: '🎣 Cần Câu Kim Cương',
    cost: 15000, // 15K xu (original price)
    missReduction: 8,
    rareBoost: 40,
    durability: 180,
    tier: 'Advanced',
    vipRequired: false,
    description: 'Cần câu kim cương lấp lánh'
  },
  6: {
    name: '🎣 Cần Câu Ma Thuật',
    cost: 20000, // 20K xu (original price)
    missReduction: 10,
    rareBoost: 50,
    durability: 200,
    tier: 'Advanced',
    vipRequired: false, // Changed to false (standard tier)
    description: 'Cần câu được phù phép với sức mạnh huyền bí'
  },
  7: {
    name: '🎣 Cần Câu Huyền Thoại',
    cost: 50000, // 50K xu (original price)
    missReduction: 12,
    rareBoost: 60,
    durability: 220,
    tier: 'Advanced',
    vipRequired: false, // Changed to false (standard tier)
    description: 'Cần câu huyền thoại từ thời xa xưa'
  },
  8: {
    name: '🎣 Cần Câu Rồng',
    cost: 100000, // 100K xu (original price)
    missReduction: 14,
    rareBoost: 70,
    durability: 240,
    tier: 'Premium',
    vipRequired: false, // Changed to false (standard tier)
    description: 'Cần câu được làm từ xương rồng cổ đại'
  },
  9: {
    name: '🎣 Cần Câu Thần Thánh',
    cost: 150000, // 150K xu (original price)
    missReduction: 16,
    rareBoost: 80,
    durability: 260,
    tier: 'Premium',
    vipRequired: false, // Changed to false (standard tier)
    description: 'Cần câu thiêng liêng từ thế giới thần thánh'
  },
  10: {
    name: '🎣 Cần Câu Vô Cực',
    cost: 300000, // 300K xu (original price)
    missReduction: 18,
    rareBoost: 90,
    durability: 280,
    tier: 'Premium',
    vipRequired: false, // Changed to false (standard tier)
    description: 'Cần câu tối thượng với sức mạnh vô hạn'
  },
  // NEW: Level 11-20 Premium Tier - VIP Bronze required
  11: {
    name: '🌌 Cần Vũ Trụ',
    cost: 400000, // 400K xu (+100K from level 10)
    missReduction: 19,
    rareBoost: 110,
    durability: 300,
    tier: 'Legendary',
    vipRequired: 'bronze', // VIP Bronze required
    description: 'Cần câu chứa đựng sức mạnh của toàn bộ vũ trụ'
  },
  12: {
    name: '⚡ Cần Sét',
    cost: 550000, // 550K xu (+150K increment)
    missReduction: 20,
    rareBoost: 120,
    durability: 320,
    tier: 'Legendary',
    vipRequired: 'bronze', // VIP Bronze required
    description: 'Cần câu được tôi luyện bởi sấm sét'
  },
  13: {
    name: '🔥 Cần Lửa Địa Ngục',
    cost: 750000, // 750K xu (+200K increment)
    missReduction: 21,
    rareBoost: 130,
    durability: 340,
    tier: 'Legendary',
    vipRequired: 'bronze', // VIP Bronze required
    description: 'Cần câu từ ngọn lửa địa ngục bất diệt'
  },
  14: {
    name: '❄️ Cần Băng Vĩnh Cửu',
    cost: 1000000, // 1M xu (+250K increment)
    missReduction: 22,
    rareBoost: 140,
    durability: 360,
    tier: 'Legendary',
    vipRequired: 'bronze', // VIP Bronze required
    description: 'Cần câu từ băng vĩnh cửu không bao giờ tan'
  },
  15: {
    name: '🌈 Cần Cầu Vồng',
    cost: 1300000, // 1.3M xu (+300K increment)
    missReduction: 23,
    rareBoost: 150,
    durability: 380,
    tier: 'Legendary',
    vipRequired: 'bronze', // VIP Bronze required
    description: 'Cần câu tuyệt đẹp với màu sắc cầu vồng'
  },
  16: {
    name: '👑 Cần Hoàng Gia',
    cost: 1650000, // 1.65M xu (+350K increment)
    missReduction: 24,
    rareBoost: 160,
    durability: 400,
    tier: 'Mythical',
    vipRequired: 'bronze', // VIP Bronze required
    description: 'Cần câu hoàng gia chỉ dành cho vua chúa'
  },
  17: {
    name: '🌟 Cần Thiên Thần',
    cost: 2050000, // 2.05M xu (+400K increment) - Near max
    missReduction: 25,
    rareBoost: 170,
    durability: 420,
    tier: 'Mythical',
    vipRequired: 'bronze', // VIP Bronze required
    description: 'Cần câu thiên thần với phước lành từ trời cao'
  },
  18: {
    name: '😈 Cần Ác Quỷ',
    cost: 2000000, // 2M xu (capped at max)
    missReduction: 26,
    rareBoost: 180,
    durability: 440,
    tier: 'Mythical',
    vipRequired: 'bronze', // VIP Bronze required
    description: 'Cần câu ác quỷ với sức mạnh đen tối'
  },
  19: {
    name: '🔮 Cần Tạo Hóa',
    cost: 2000000, // 2M xu (capped at max)
    missReduction: 27,
    rareBoost: 190,
    durability: 460,
    tier: 'Mythical',
    vipRequired: 'bronze', // VIP Bronze required
    description: 'Cần câu tạo hóa có thể thay đổi thực tại'
  },
  20: {
    name: '✨ Cần Vô Cực Tối Thượng',
    cost: 2000000, // 2M xu (maximum price)
    missReduction: 28,
    rareBoost: 200,
    durability: 500,
    tier: 'Transcendent',
    vipRequired: 'bronze', // VIP Bronze required
    description: 'Cần câu tối thượng vượt qua mọi giới hạn - Đỉnh cao nghệ thuật câu cá'
  }
};

/**
 * Get rod benefits for a specific level
 * @param {number} level - Rod level (1-20)
 * @returns {Object} Rod configuration
 */
export function getRodBenefits(level) {
  const rodLevel = Math.max(1, Math.min(20, level));
  return FISHING_RODS[rodLevel] || FISHING_RODS[1];
}

/**
 * Calculate miss rate reduction based on rod level
 * @param {number} level - Rod level (1-20)
 * @returns {number} Miss rate reduction percentage (0-28%)
 */
export function calculateMissReduction(level) {
  const rod = getRodBenefits(level);
  return rod.missReduction;
}

/**
 * Calculate rare fish boost based on rod level
 * @param {number} level - Rod level (1-20)
 * @returns {number} Rare fish boost percentage (0-200%)
 */
export function calculateRareBoost(level) {
  const rod = getRodBenefits(level);
  return rod.rareBoost;
}

/**
 * Check if user can afford next rod upgrade
 * @param {number} currentLevel - Current rod level
 * @param {number} userBalance - User's current balance
 * @returns {Object} Upgrade information
 */
export function getUpgradeInfo(currentLevel, userBalance) {
  if (currentLevel >= 20) {
    return {
      canUpgrade: false,
      reason: 'Đã đạt level tối đa',
      nextLevel: null,
      cost: 0
    };
  }

  const nextLevel = currentLevel + 1;
  const nextRod = FISHING_RODS[nextLevel];
  const canAfford = userBalance >= nextRod.cost;

  return {
    canUpgrade: canAfford,
    reason: canAfford ? 'Có thể nâng cấp' : 'Không đủ xu',
    nextLevel: nextLevel,
    nextRod: nextRod,
    cost: nextRod.cost,
    missing: canAfford ? 0 : nextRod.cost - userBalance
  };
}

/**
 * Get rods available for purchase
 * @param {number} userBalance - User's current balance
 * @param {string} vipTier - User's VIP tier
 * @returns {Array} Available rods
 */
export function getAvailableRods(userBalance, vipTier = null) {
  const available = [];
  
  // VIP hierarchy for better checking
  const vipHierarchy = {
    'bronze': 1,
    'silver': 2,
    'gold': 3, 
    'diamond': 4
  };
  
  const userVipLevel = vipHierarchy[vipTier?.toLowerCase()] || 0;
  
  for (let level = 1; level <= 20; level++) {
    const rod = FISHING_RODS[level];
    const canAfford = userBalance >= rod.cost;
    
    // Check VIP access
    let hasVipAccess = true;
    if (rod.vipRequired) {
      const requiredVipLevel = vipHierarchy[rod.vipRequired.toLowerCase()] || 0;
      hasVipAccess = userVipLevel >= requiredVipLevel;
    }

    available.push({
      level,
      ...rod,
      canAfford,
      hasVipAccess,
      canPurchase: canAfford && hasVipAccess
    });
  }
  
  return available;
}

/**
 * Get rod tier color for embeds
 * @param {string} tier - Rod tier
 * @returns {string} Hex color
 */
export function getRodTierColor(tier) {
  const colors = {
    'Starter': '#95a5a6',
    'Basic': '#3498db',
    'Advanced': '#9b59b6',
    'Premium': '#e74c3c',
    'Legendary': '#f1c40f',
    'Mythical': '#e67e22',
    'Transcendent': '#ff69b4'
  };
  return colors[tier] || '#95a5a6';
}

/**
 * Get rod progression summary
 * @param {number} currentLevel - Current rod level
 * @returns {Object} Progression information
 */
export function getRodProgression(currentLevel) {
  const current = FISHING_RODS[currentLevel];
  const maxLevel = 20;
  const progressPercent = (currentLevel / maxLevel * 100).toFixed(1);
  
  return {
    current,
    level: currentLevel,
    maxLevel,
    progressPercent,
    isMaxLevel: currentLevel >= maxLevel,
    rodsTier: current.tier,
    nextTierLevel: getNextTierLevel(currentLevel)
  };
}

/**
 * Calculate rod durability damage for a fishing attempt
 * @param {number} level - Rod level (1-20)
 * @returns {Object} Durability damage information
 */
export function calculateDurabilityDamage(level) {
  const rod = getRodBenefits(level);
  
  // Define damage and break chance based on rod tiers
  let minDamage, maxDamage, breakChance, durabilityLoss;
  
  if (level <= 10) {
    // Low-tier rods (1-10): Durable but basic
    minDamage = 1;
    maxDamage = 2 + Math.floor(level / 3); // Level 1-3: 2, Level 4-6: 3, Level 7-9: 4, Level 10: 5
    breakChance = 0.001 + (level * 0.0005); // 0.15% - 0.6% break chance
    durabilityLoss = Math.floor(Math.random() * 3) + 1; // 1-3 durability loss per use
  } else {
    // High-tier rods (11-20): Powerful but fragile
    const highLevel = level - 10; // 1-10 for levels 11-20
    minDamage = 3 + Math.floor(highLevel / 2); // 3-8 damage
    maxDamage = 6 + highLevel; // 7-16 damage
    breakChance = 0.008 + (highLevel * 0.002); // 1.0% - 2.8% break chance
    durabilityLoss = Math.floor(Math.random() * 6) + 3; // 3-8 durability loss per use
  }
  
  // Calculate actual damage dealt
  const damage = Math.floor(Math.random() * (maxDamage - minDamage + 1)) + minDamage;
  
  // Check if rod breaks
  const willBreak = Math.random() < breakChance;
  
  // Calculate repair cost (varies by rod level)
  const repairCostMultiplier = level <= 10 ? 0.05 : 0.15; // Low-tier: 5%, High-tier: 15%
  const baseRepairCost = Math.floor(rod.cost * repairCostMultiplier);
  
  return {
    damage,
    durabilityLoss,
    willBreak,
    breakChance: (breakChance * 100).toFixed(2),
    repairCost: baseRepairCost,
    minDamage,
    maxDamage,
    tier: level <= 10 ? 'Standard' : 'Premium'
  };
}

/**
 * Get detailed durability information for a rod level
 * @param {number} level - Rod level (1-20)
 * @returns {Object} Detailed durability stats
 */
export function getRodDurabilityInfo(level) {
  const rod = getRodBenefits(level);
  
  if (level <= 10) {
    return {
      tier: 'Standard Tier',
      maintenance: 'Low',
      durabilityPerUse: '1-3 points',
      breakChance: `${(0.15 + (level * 0.05)).toFixed(2)}%`,
      repairCost: `${(rod.cost * 0.05).toLocaleString()} xu (5% of cost)`,
      expectedUses: Math.floor(rod.durability / 2), // Average uses before repair
      description: 'Reliable and durable - perfect for regular fishing',
      pros: ['Low maintenance cost', 'Rare breaking', 'Consistent performance'],
      cons: ['Lower fishing benefits', 'Basic materials']
    };
  } else {
    const highLevel = level - 10;
    return {
      tier: 'Premium Tier',
      maintenance: 'High',
      durabilityPerUse: '3-8 points',
      breakChance: `${(1.0 + (highLevel * 0.2)).toFixed(2)}%`,
      repairCost: `${(rod.cost * 0.15).toLocaleString()} xu (15% of cost)`,
      expectedUses: Math.floor(rod.durability / 5.5), // Average uses before repair
      description: 'High-performance but requires careful maintenance',
      pros: ['Superior fishing benefits', 'Rare fish boost', 'Premium materials'],
      cons: ['High maintenance cost', 'More frequent breaking', 'Expensive repairs']
    };
  }
}

/**
 * Calculate rod repair cost based on damage
 * @param {number} level - Rod level
 * @param {number} currentDurability - Current durability
 * @param {number} maxDurability - Maximum durability
 * @returns {number} Repair cost in xu
 */
export function calculateRepairCost(level, currentDurability, maxDurability) {
  const rod = getRodBenefits(level);
  const damagePercent = 1 - (currentDurability / maxDurability);
  const baseCost = Math.floor(rod.cost * 0.1); // 10% of rod cost
  return Math.floor(baseCost * damagePercent);
}

/**
 * Get rod durability status and warnings
 * @param {number} currentDurability - Current durability
 * @param {number} maxDurability - Maximum durability
 * @returns {Object} Status information
 */
export function getRodDurabilityStatus(currentDurability, maxDurability) {
  const durabilityPercent = (currentDurability / maxDurability) * 100;
  
  let status, emoji, warning;
  
  if (durabilityPercent >= 80) {
    status = 'Excellent';
    emoji = '🟢';
    warning = null;
  } else if (durabilityPercent >= 60) {
    status = 'Good';
    emoji = '🟡';
    warning = 'Consider repairing soon';
  } else if (durabilityPercent >= 40) {
    status = 'Fair';
    emoji = '🟠';
    warning = 'Repair recommended';
  } else if (durabilityPercent >= 20) {
    status = 'Poor';
    emoji = '🔴';
    warning = 'Urgent repair needed!';
  } else {
    status = 'Critical';
    emoji = '💀';
    warning = 'Rod may break soon!';
  }
  
  return {
    status,
    emoji,
    warning,
    durabilityPercent: durabilityPercent.toFixed(1)
  };
}

/**
 * Get rod durability tier information
 * @param {number} level - Rod level (1-20)
 * @returns {Object} Durability tier info
 */
export function getRodDurabilityTier(level) {
  if (level <= 10) {
    return {
      tier: 'Standard',
      description: 'Low maintenance rods for everyday fishing',
      damageRange: '1-5 per use',
      breakChance: '0.1-1.0%',
      repairFrequency: 'Every 50-100 uses',
      color: '#3498db'
    };
  } else {
    return {
      tier: 'Premium',
      description: 'High-performance rods requiring more care',
      damageRange: '2-15 per use',
      breakChance: '1.2-3.0%', 
      repairFrequency: 'Every 20-40 uses',
      color: '#e74c3c'
    };
  }
}

/**
 * Get next tier level
 * @param {number} currentLevel - Current level
 * @returns {number|null} Next tier level or null if max
 */
function getNextTierLevel(currentLevel) {
  const tierLevels = {
    'Starter': 2,
    'Basic': 5,
    'Advanced': 8,
    'Premium': 11,
    'Legendary': 16,
    'Mythical': 20,
    'Transcendent': null
  };
  
  const currentTier = FISHING_RODS[currentLevel].tier;
  return tierLevels[currentTier];
}

/**
 * Simulate rod durability damage for testing
 * @param {number} level - Rod level
 * @param {number} fishingAttempts - Number of fishing attempts to simulate
 * @returns {Object} Simulation results
 */
export function simulateRodDurability(level, fishingAttempts = 100) {
  const rod = getRodBenefits(level);
  let totalDurabilityLoss = 0;
  let breakCount = 0;
  let damageHistory = [];
  
  for (let i = 0; i < fishingAttempts; i++) {
    const damageResult = calculateDurabilityDamage(level);
    totalDurabilityLoss += damageResult.durabilityLoss;
    
    if (damageResult.willBreak) {
      breakCount++;
    }
    
    damageHistory.push(damageResult);
  }
  
  const averageDamage = totalDurabilityLoss / fishingAttempts;
  const breakRate = (breakCount / fishingAttempts) * 100;
  const expectedRepairs = Math.ceil(totalDurabilityLoss / rod.durability);
  
  return {
    level,
    fishingAttempts,
    totalDurabilityLoss,
    averageDamage: averageDamage.toFixed(2),
    breakCount,
    breakRate: breakRate.toFixed(2),
    expectedRepairs,
    totalRepairCost: expectedRepairs * Math.floor(rod.cost * (level <= 10 ? 0.05 : 0.15)),
    damageHistory
  };
}