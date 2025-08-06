/**
 * Weather System - Hệ thống thời tiết ảnh hưởng câu cá
 */

const WEATHER_TYPES = {
  SUNNY: {
    name: 'Nắng',
    emoji: '☀️',
    description: 'Trời nắng đẹp, cá hoạt động bình thường',
    fishRateMultiplier: 1.0,
    rareFishBonus: 0,
    experienceMultiplier: 1.0,
    coinMultiplier: 1.0,
    weight: 30,
    specialFish: [
      { name: 'Cá Vàng Ánh Nắng', rarity: 'rare', price: 200, chance: 0.05 },
      { name: 'Cá Chép Hoàng Kim', rarity: 'legendary', price: 500, chance: 0.01 }
    ]
  },
  CLOUDY: {
    name: 'Nhiều mây',
    emoji: '☁️', 
    description: 'Trời nhiều mây, cá dễ câu hơn',
    fishRateMultiplier: 1.1,
    rareFishBonus: 0.05,
    experienceMultiplier: 1.0,
    coinMultiplier: 1.0,
    weight: 25,
    specialFish: [
      { name: 'Cá Mây Bạc', rarity: 'rare', price: 180, chance: 0.08 }
    ]
  },
  RAINY: {
    name: 'Mưa',
    emoji: '🌧️',
    description: 'Trời mưa, cá rất hoạt động',
    fishRateMultiplier: 1.3,
    rareFishBonus: 0.1,
    experienceMultiplier: 1.1,
    coinMultiplier: 1.0,
    weight: 20,
    specialFish: [
      { name: 'Cá Mưa Ngọc Trai', rarity: 'rare', price: 250, chance: 0.12 },
      { name: 'Cá Sấm Sét', rarity: 'legendary', price: 600, chance: 0.03 }
    ]
  },
  STORMY: {
    name: 'Bão',
    emoji: '⛈️',
    description: 'Trời bão, khó câu nhưng cá hiếm xuất hiện',
    fishRateMultiplier: 0.7,
    rareFishBonus: 0.2,
    experienceMultiplier: 1.5,
    coinMultiplier: 1.2,
    weight: 8,
    specialFish: [
      { name: 'Cá Sấm Sét Điện', rarity: 'legendary', price: 800, chance: 0.15 },
      { name: 'Rồng Bão Tố', rarity: 'mythical', price: 2500, chance: 0.05 }
    ]
  },
  FOGGY: {
    name: 'Sương mù',
    emoji: '🌫️',
    description: 'Sương mù dày đặc, cá huyền bí xuất hiện',
    fishRateMultiplier: 0.9,
    rareFishBonus: 0.15,
    experienceMultiplier: 1.3,
    coinMultiplier: 1.1,
    weight: 12,
    specialFish: [
      { name: 'Cá Ma Sương Mù', rarity: 'legendary', price: 700, chance: 0.1 },
      { name: 'Linh Hồn Sương Trắng', rarity: 'mythical', price: 2000, chance: 0.03 }
    ]
  },
  WINDY: {
    name: 'Gió mạnh',
    emoji: '💨',
    description: 'Gió mạnh, cá nhảy nhiều hơn',
    fishRateMultiplier: 1.2,
    rareFishBonus: 0.08,
    experienceMultiplier: 1.1,
    coinMultiplier: 1.0,
    weight: 15,
    specialFish: [
      { name: 'Cá Bay Gió Xanh', rarity: 'rare', price: 220, chance: 0.1 },
      { name: 'Phượng Hoàng Gió', rarity: 'legendary', price: 750, chance: 0.02 }
    ]
  }
};

const TIME_PERIODS = {
  DAWN: {
    name: 'Bình minh',
    emoji: '🌅',
    hours: [5, 6, 7],
    description: 'Buổi bình minh, cá rất hoạt động',
    fishRateMultiplier: 1.2,
    rareFishBonus: 0.1,
    experienceMultiplier: 1.3,
    coinMultiplier: 1.0,
    specialFish: [
      { name: 'Cá Bình Minh Vàng', rarity: 'rare', price: 300, chance: 0.15 },
      { name: 'Thiên Thần Ánh Sáng', rarity: 'legendary', price: 800, chance: 0.05 }
    ]
  },
  MORNING: {
    name: 'Buổi sáng',
    emoji: '🌞',
    hours: [8, 9, 10, 11],
    description: 'Buổi sáng, thời gian tốt để câu cá',
    fishRateMultiplier: 1.1,
    rareFishBonus: 0.05,
    experienceMultiplier: 1.1,
    coinMultiplier: 1.0,
    specialFish: [
      { name: 'Cá Sáng Trong', rarity: 'rare', price: 180, chance: 0.08 }
    ]
  },
  NOON: {
    name: 'Buổi trưa',
    emoji: '☀️',
    hours: [12, 13, 14, 15],
    description: 'Buổi trưa, cá ít hoạt động',
    fishRateMultiplier: 0.8,
    rareFishBonus: 0,
    experienceMultiplier: 0.9,
    coinMultiplier: 1.0,
    specialFish: [
      { name: 'Cá Ngủ Trưa', rarity: 'common', price: 80, chance: 0.1 }
    ]
  },
  AFTERNOON: {
    name: 'Buổi chiều',
    emoji: '🌆',
    hours: [16, 17, 18],
    description: 'Buổi chiều, cá bắt đầu hoạt động trở lại',
    fishRateMultiplier: 1.0,
    rareFishBonus: 0.03,
    experienceMultiplier: 1.0,
    coinMultiplier: 1.0,
    specialFish: [
      { name: 'Cá Chiều Tím', rarity: 'rare', price: 160, chance: 0.06 }
    ]
  },
  EVENING: {
    name: 'Buổi tối',
    emoji: '🌃',
    hours: [19, 20, 21],
    description: 'Buổi tối, cá đêm xuất hiện',
    fishRateMultiplier: 1.15,
    rareFishBonus: 0.08,
    experienceMultiplier: 1.2,
    coinMultiplier: 1.0,
    specialFish: [
      { name: 'Cá Đêm Xanh', rarity: 'rare', price: 240, chance: 0.12 },
      { name: 'Ma Cà Rồng Biển', rarity: 'legendary', price: 600, chance: 0.03 }
    ]
  },
  NIGHT: {
    name: 'Đêm khuya',
    emoji: '🌙',
    hours: [22, 23, 0, 1, 2, 3, 4],
    description: 'Đêm khuya, cá đêm hiếm xuất hiện',
    fishRateMultiplier: 0.9,
    rareFishBonus: 0.15,
    experienceMultiplier: 1.5,
    coinMultiplier: 1.2,
    specialFish: [
      { name: 'Cá Ma Đêm', rarity: 'legendary', price: 750, chance: 0.08 },
      { name: 'Quỷ Vương Biển Đêm', rarity: 'mythical', price: 3000, chance: 0.02 }
    ]
  }
};

// Cache thời tiết (reset mỗi 30 phút)
let currentWeather = null;
let weatherLastUpdate = 0;
const WEATHER_UPDATE_INTERVAL = 30 * 60 * 1000; // 30 phút

// Admin controls - mặc định TẮT
let weatherSystemEnabled = false;
let timeSystemEnabled = false;

/**
 * Lấy thời tiết hiện tại
 */
export function getCurrentWeather() {
  // Nếu hệ thống thời tiết bị tắt, trả về thời tiết mặc định
  if (!weatherSystemEnabled) {
    return {
      type: 'SUNNY',
      name: 'Nắng',
      emoji: '☀️',
      description: 'Thời tiết bình thường (hệ thống tắt)',
      fishRateMultiplier: 1.0,
      rareFishBonus: 0,
      experienceMultiplier: 1.0,
      coinMultiplier: 1.0,
      weight: 30,
      specialFish: []
    };
  }
  
  const now = Date.now();
  
  // Kiểm tra nếu cần update thời tiết
  if (!currentWeather || (now - weatherLastUpdate) > WEATHER_UPDATE_INTERVAL) {
    currentWeather = generateRandomWeather();
    weatherLastUpdate = now;
  }
  
  return currentWeather;
}

/**
 * Tạo thời tiết ngẫu nhiên dựa trên weight
 */
function generateRandomWeather() {
  const totalWeight = Object.values(WEATHER_TYPES).reduce((sum, weather) => sum + weather.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const [key, weather] of Object.entries(WEATHER_TYPES)) {
    random -= weather.weight;
    if (random <= 0) {
      return {
        type: key,
        ...weather
      };
    }
  }
  
  // Fallback
  return {
    type: 'SUNNY',
    ...WEATHER_TYPES.SUNNY
  };
}

/**
 * Lấy thời gian hiện tại (theo giờ Việt Nam)
 */
export function getCurrentTimePeriod() {
  // Nếu hệ thống thời gian bị tắt, trả về thời gian mặc định
  if (!timeSystemEnabled) {
    return {
      type: 'MORNING',
      name: 'Buổi sáng',
      emoji: '🌞',
      hour: new Date().getHours(),
      description: 'Thời gian bình thường (hệ thống tắt)',
      fishRateMultiplier: 1.0,
      rareFishBonus: 0,
      experienceMultiplier: 1.0,
      coinMultiplier: 1.0,
      specialFish: []
    };
  }
  
  const now = new Date();
  const vietnamTime = new Date(now.getTime() + (7 * 60 * 60 * 1000)); // UTC+7
  const hour = vietnamTime.getUTCHours();
  
  for (const [key, period] of Object.entries(TIME_PERIODS)) {
    if (period.hours.includes(hour)) {
      return {
        type: key,
        hour,
        ...period
      };
    }
  }
  
  // Fallback
  return {
    type: 'MORNING',
    hour,
    ...TIME_PERIODS.MORNING
  };
}

/**
 * Tính hệ số ảnh hưởng tổng hợp từ thời tiết và thời gian
 */
export function getEnvironmentModifiers(weatherOverride = null, timeOverride = null) {
  const weather = weatherOverride || getCurrentWeather();
  const timePeriod = timeOverride || getCurrentTimePeriod();
  
  // Đảm bảo tất cả giá trị là số hợp lệ
  const weatherFishRate = isNaN(weather.fishRateMultiplier) || !isFinite(weather.fishRateMultiplier) ? 1.0 : weather.fishRateMultiplier;
  const timeFishRate = isNaN(timePeriod.fishRateMultiplier) || !isFinite(timePeriod.fishRateMultiplier) ? 1.0 : timePeriod.fishRateMultiplier;
  
  const weatherExp = isNaN(weather.experienceMultiplier) || !isFinite(weather.experienceMultiplier) ? 1.0 : (weather.experienceMultiplier || 1.0);
  const timeExp = isNaN(timePeriod.experienceMultiplier) || !isFinite(timePeriod.experienceMultiplier) ? 1.0 : (timePeriod.experienceMultiplier || 1.0);
  
  const weatherCoin = isNaN(weather.coinMultiplier) || !isFinite(weather.coinMultiplier) ? 1.0 : (weather.coinMultiplier || 1.0);
  const timeCoin = isNaN(timePeriod.coinMultiplier) || !isFinite(timePeriod.coinMultiplier) ? 1.0 : (timePeriod.coinMultiplier || 1.0);
  
  const weatherRare = isNaN(weather.rareFishBonus) || !isFinite(weather.rareFishBonus) ? 0.0 : weather.rareFishBonus;
  const timeRare = isNaN(timePeriod.rareFishBonus) || !isFinite(timePeriod.rareFishBonus) ? 0.0 : timePeriod.rareFishBonus;
  
  // Tổng hợp hệ số (nhân với nhau)
  const fishRateMultiplier = weatherFishRate * timeFishRate;
  const experienceMultiplier = weatherExp * timeExp;
  const coinMultiplier = weatherCoin * timeCoin;
  
  // Tổng hợp bonus cá hiếm (cộng dồn)
  const rareFishBonus = weatherRare + timeRare;
  
  // Validation cuối cùng
  const safeModifiers = {
    weather,
    timePeriod,
    fishRateMultiplier: isNaN(fishRateMultiplier) || !isFinite(fishRateMultiplier) ? 1.0 : Math.round(fishRateMultiplier * 100) / 100,
    rareFishBonus: isNaN(rareFishBonus) || !isFinite(rareFishBonus) ? 0.0 : Math.round(rareFishBonus * 100) / 100,
    experienceMultiplier: isNaN(experienceMultiplier) || !isFinite(experienceMultiplier) ? 1.0 : Math.round(experienceMultiplier * 100) / 100,
    coinMultiplier: isNaN(coinMultiplier) || !isFinite(coinMultiplier) ? 1.0 : Math.round(coinMultiplier * 100) / 100
  };
  
  console.log('Environment modifiers calculated:', safeModifiers);
  return safeModifiers;
}

/**
 * Áp dụng hệ số môi trường vào tỷ lệ câu hụt
 */
export function applyEnvironmentToMissRate(baseMissRate) {
  const { modifiers } = getEnvironmentModifiers();
  
  // Hệ số tích cực giảm tỷ lệ câu hụt
  const adjustedMissRate = baseMissRate / modifiers.fishRateMultiplier;
  
  return Math.min(0.8, Math.max(0.05, adjustedMissRate)); // Giới hạn 5%-80%
}

/**
 * Lấy cá đặc biệt từ thời tiết và thời gian
 */
export function getWeatherSpecialFish() {
  const { weather, timePeriod } = getEnvironmentModifiers();
  
  // Kiểm tra cá đặc biệt từ thời tiết trước
  if (weather.specialFish && weather.specialFish.length > 0) {
    for (const fish of weather.specialFish) {
      if (Math.random() < fish.chance) {
        return {
          ...fish,
          isWeatherFish: true,
          weatherType: weather.name,
          weatherEmoji: weather.emoji
        };
      }
    }
  }
  
  // Kiểm tra cá đặc biệt từ thời gian
  if (timePeriod.specialFish && timePeriod.specialFish.length > 0) {
    for (const fish of timePeriod.specialFish) {
      if (Math.random() < fish.chance) {
        return {
          ...fish,
          isTimeFish: true,
          timeType: timePeriod.name,
          timeEmoji: timePeriod.emoji
        };
      }
    }
  }
  
  return null;
}

/**
 * Kiểm tra xem có được bonus cá hiếm không
 */
export function shouldGetRareFishBonus() {
  const modifiers = getEnvironmentModifiers();
  return Math.random() < modifiers.rareFishBonus;
}

/**
 * Lấy thông tin môi trường để hiển thị
 */
export function getEnvironmentDisplay() {
  const modifiers = getEnvironmentModifiers();
  const { weather, timePeriod } = modifiers;
  
  const effectDescription = [];
  
  if (modifiers.fishRateMultiplier > 1.0) {
    effectDescription.push('🎣 Dễ câu hơn');
  } else if (modifiers.fishRateMultiplier < 1.0) {
    effectDescription.push('🎣 Khó câu hơn');
  }
  
  if (modifiers.rareFishBonus > 0) {
    effectDescription.push('✨ Tăng cá hiếm');
  }
  
  if (modifiers.experienceMultiplier > 1.0) {
    effectDescription.push('📈 Tăng EXP');
  }
  
  if (modifiers.coinMultiplier > 1.0) {
    effectDescription.push('💰 Tăng xu');
  }
  
  return {
    weather: `${weather.emoji} ${weather.name}`,
    time: `${timePeriod.emoji} ${timePeriod.name}`,
    effects: effectDescription.join(', ') || 'Bình thường',
    details: {
      weatherDesc: weather.description,
      timeDesc: timePeriod.description,
      fishMultiplier: `${Math.round(modifiers.fishRateMultiplier * 100)}%`,
      rareBonus: `+${Math.round(modifiers.rareFishBonus * 100)}%`,
      expMultiplier: `${Math.round(modifiers.experienceMultiplier * 100)}%`,
      coinMultiplier: `${Math.round(modifiers.coinMultiplier * 100)}%`
    }
  };
}

/**
 * Force update thời tiết (cho admin)
 */
export function forceUpdateWeather() {
  currentWeather = generateRandomWeather();
  weatherLastUpdate = Date.now();
  return currentWeather;
}

/**
 * Admin functions - Bật/tắt hệ thống
 */
export function enableWeatherSystem() {
  weatherSystemEnabled = true;
  forceUpdateWeather(); // Tạo thời tiết mới ngay lập tức
  return { success: true, message: '✅ Đã bật hệ thống thời tiết!' };
}

export function disableWeatherSystem() {
  weatherSystemEnabled = false;
  return { success: true, message: '❌ Đã tắt hệ thống thời tiết!' };
}

export function enableTimeSystem() {
  timeSystemEnabled = true;
  return { success: true, message: '✅ Đã bật hệ thống thời gian!' };
}

export function disableTimeSystem() {
  timeSystemEnabled = false;
  return { success: true, message: '❌ Đã tắt hệ thống thời gian!' };
}

export function getSystemStatus() {
  return {
    weatherEnabled: weatherSystemEnabled,
    timeEnabled: timeSystemEnabled,
    status: `🌤️ Thời tiết: ${weatherSystemEnabled ? '✅ BẬT' : '❌ TẮT'}\n⏰ Thời gian: ${timeSystemEnabled ? '✅ BẬT' : '❌ TẮT'}`
  };
}

// Export constants
export { WEATHER_TYPES, TIME_PERIODS };
