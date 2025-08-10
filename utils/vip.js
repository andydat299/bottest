import VIP from '../schemas/VIP.js';

// VIP Tiers Configuration
export const VIP_TIERS = {
  basic: {
    name: '👑 VIP Basic',
    description: 'Gói VIP cơ bản với bonus hấp dẫn',
    price: 100000,
    duration: 30,
    benefits: {
      coinMultiplier: 1.2,
      fishingBonus: 1.15,
      dailyBonus: 1.25,
      workBonus: 1.1,
      autoFishingTime: 60,
      color: '#FFD700'
    }
  },
  premium: {
    name: '💎 VIP Premium',
    description: 'Gói VIP cao cấp với nhiều ưu đãi',
    price: 250000,
    duration: 30,
    benefits: {
      coinMultiplier: 1.5,
      fishingBonus: 1.3,
      dailyBonus: 1.5,
      workBonus: 1.25,
      autoFishingTime: 120,
      color: '#9932CC'
    }
  },
  ultimate: {
    name: '🌟 VIP Ultimate',
    description: 'Gói VIP tối thượng cho trải nghiệm tuyệt vời',
    price: 500000,
    duration: 30,
    benefits: {
      coinMultiplier: 2.0,
      fishingBonus: 1.5,
      dailyBonus: 2.0,
      workBonus: 1.5,
      autoFishingTime: 360,
      color: '#FF6B35'
    }
  },
  lifetime: {
    name: '♾️ VIP Lifetime',
    description: 'VIP vĩnh viễn - một lần mua, trọn đời sử dụng',
    price: 2000000,
    duration: 36500,
    benefits: {
      coinMultiplier: 2.5,
      fishingBonus: 2.0,
      dailyBonus: 2.5,
      workBonus: 2.0,
      autoFishingTime: 720,
      color: '#FF0080'
    }
  }
};

export async function getOrCreateVIP(discordId, username) {
  try {
    let vip = await VIP.findOne({ discordId });
    
    if (!vip) {
      vip = new VIP({
        discordId,
        username,
        vipTier: null,
        vipExpireAt: null,
        vipBenefits: {
          coinMultiplier: 1,
          fishingBonus: 1,
          dailyBonus: 1,
          workBonus: 1,
          autoFishingTime: 0,
          color: '#0099ff'
        },
        vipPurchaseHistory: [],
        vipStats: {
          totalSpent: 0,
          totalDaysActive: 0,
          lastUsed: null
        }
      });
      await vip.save();
      console.log(`Created new VIP record: ${username} (${discordId})`);
    } else if (vip.username !== username) {
      vip.username = username;
      await vip.save();
      console.log(`Updated VIP username for ${discordId}: ${username}`);
    }
    
    return vip;
  } catch (error) {
    console.error('Error creating/getting VIP:', error);
    throw error;
  }
}

export function getVIPPerks(vip) {
  if (!vip || !vip.isVipActive() || !vip.vipTier) {
    return null;
  }
  
  const tierInfo = VIP_TIERS[vip.vipTier];
  if (!tierInfo) return null;
  
  return {
    tier: tierInfo.name,
    ...vip.vipBenefits,
    ...tierInfo.benefits
  };
}

export async function applyVIPBonus(discordId, baseAmount, bonusType = 'coin') {
  try {
    const vip = await getOrCreateVIP(discordId, 'Unknown');
    const perks = getVIPPerks(vip);
    
    if (!perks) return baseAmount;
    
    let multiplier = 1;
    switch (bonusType) {
      case 'coin':
        multiplier = perks.coinMultiplier;
        break;
      case 'fishing':
        multiplier = perks.fishingBonus;
        break;
      case 'daily':
        multiplier = perks.dailyBonus;
        break;
      case 'work':
        multiplier = perks.workBonus;
        break;
      default:
        multiplier = 1;
    }
    
    return Math.floor(baseAmount * multiplier);
  } catch (error) {
    console.error('Error applying VIP bonus:', error);
    return baseAmount;
  }
}

export async function purchaseVIP(discordId, username, tier, paymentMethod = 'coins') {
  try {
    const tierInfo = VIP_TIERS[tier];
    if (!tierInfo) {
      throw new Error('Invalid VIP tier');
    }
    
    const vip = await getOrCreateVIP(discordId, username);
    
    // Update VIP tier and extend time
    vip.vipTier = tier;
    vip.extendVip(tierInfo.duration);
    
    // Update benefits
    Object.assign(vip.vipBenefits, tierInfo.benefits);
    
    // Add to purchase history
    vip.vipPurchaseHistory.push({
      tier,
      duration: tierInfo.duration,
      price: tierInfo.price,
      paymentMethod,
      transactionId: `${paymentMethod.toUpperCase()}_${Date.now()}_${discordId.slice(-4)}`
    });
    
    // Update stats
    vip.vipStats.totalSpent += tierInfo.price;
    vip.vipStats.lastUsed = new Date();
    
    await vip.save();
    
    console.log(`VIP Purchase: ${username} bought ${tierInfo.name} for ${tierInfo.price} (${paymentMethod})`);
    
    return {
      success: true,
      vip,
      tierInfo,
      message: `Đã mua ${tierInfo.name} thành công!`
    };
    
  } catch (error) {
    console.error('Error purchasing VIP:', error);
    return {
      success: false,
      error: error.message,
      message: 'Có lỗi xảy ra khi mua VIP!'
    };
  }
}