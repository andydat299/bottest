import { Quest } from '../schemas/questSchema.js';
import { logQuestComplete } from './logger.js';

// Tạo quest mới cho ngày hôm nay
export const generateDailyQuests = () => {
  const questTemplates = [
    {
      id: 'fish_10',
      type: 'fish',
      description: 'Câu 10 con cá bất kỳ',
      target: 10,
      reward: 300
    },
    {
      id: 'chat_30',
      type: 'chat',
      description: 'Chat 30 câu tại <#1363492195478540348>',
      target: 30,
      reward: 200,
      channelId: '1363492195478540348'
    },
    {
      id: 'earn_500',
      type: 'earn',
      description: 'Kiếm được 500 xu',
      target: 500,
      reward: 250
    },
    {
      id: 'fish_rare',
      type: 'fish_rare',
      description: 'Câu được 1 con cá hiếm trở lên',
      target: 1,
      reward: 400
    },
    {
      id: 'upgrade_rod',
      type: 'upgrade',
      description: 'Nâng cấp cần câu 1 lần',
      target: 1,
      reward: 500
    }
  ];

  // Chọn ngẫu nhiên 3 quest từ templates
  const shuffled = questTemplates.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3).map(quest => ({
    ...quest,
    current: 0,
    completed: false
  }));
};

// Lấy hoặc tạo quest cho user
export const getUserQuests = async (discordId) => {
  try {
    const today = new Date().toDateString();
    let userQuests = await Quest.findOne({ discordId });

    if (!userQuests) {
      // Tạo quest mới cho user lần đầu
      userQuests = new Quest({
        discordId,
        dailyQuests: {
          date: today,
          quests: generateDailyQuests()
        }
      });
      await userQuests.save();
    } else if (userQuests.dailyQuests.date !== today) {
      // Tạo quest mới cho ngày mới
      userQuests.dailyQuests = {
        date: today,
        quests: generateDailyQuests()
      };
      await userQuests.save();
    }

    return userQuests;
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error - tìm existing record
      console.log(`⚠️ Duplicate quest entry detected for ${discordId}, finding existing...`);
      return await Quest.findOne({ discordId });
    }
    throw error;
  }
};

// Cập nhật tiến độ quest
export const updateQuestProgress = async (discordId, questType, amount = 1, extraData = {}) => {
  try {
    const userQuests = await getUserQuests(discordId);
    let hasUpdates = false;

    for (let i = 0; i < userQuests.dailyQuests.quests.length; i++) {
      const quest = userQuests.dailyQuests.quests[i];
      if (quest.completed) continue;

      let shouldUpdate = false;

      switch (questType) {
        case 'fish':
          if (quest.type === 'fish') shouldUpdate = true;
          break;
        case 'fish_rare':
          if (quest.type === 'fish_rare' && extraData.isRare) shouldUpdate = true;
          break;
        case 'chat':
          if (quest.type === 'chat' && quest.channelId === extraData.channelId) shouldUpdate = true;
          break;
        case 'earn':
          if (quest.type === 'earn') shouldUpdate = true;
          break;
        case 'upgrade':
          if (quest.type === 'upgrade') shouldUpdate = true;
          break;
      }

      if (shouldUpdate) {
        const oldCurrent = quest.current;
        userQuests.dailyQuests.quests[i].current = Math.min(quest.current + amount, quest.target);
        
        if (userQuests.dailyQuests.quests[i].current >= quest.target && !quest.completed) {
          userQuests.dailyQuests.quests[i].completed = true;
          userQuests.totalQuestsCompleted++;
          console.log(`🎉 Quest completed: ${quest.description} (${oldCurrent} → ${userQuests.dailyQuests.quests[i].current}/${quest.target})`);
          
          // Log quest completion (cần user object, sẽ log trong command)
          // Note: Sẽ log từ nơi gọi updateQuestProgress với user object
        }
        
        // Mark document as modified for nested arrays
        userQuests.markModified('dailyQuests.quests');
        hasUpdates = true;
      }
    }

    if (hasUpdates) {
      await userQuests.save();
    }

    return userQuests;
  } catch (error) {
    console.error(`❌ Error updating quest progress for ${discordId}:`, error);
    return null;
  }
};

// Kiểm tra quest đã hoàn thành
export const getCompletedQuests = async (discordId) => {
  const userQuests = await getUserQuests(discordId);
  return userQuests.dailyQuests.quests.filter(quest => quest.completed);
};

// Claim reward cho quest
export const claimQuestReward = async (discordId, questId) => {
  const userQuests = await getUserQuests(discordId);
  const quest = userQuests.dailyQuests.quests.find(q => q.id === questId);
  
  if (quest && quest.completed && !quest.claimed) {
    quest.claimed = true;
    await userQuests.save();
    return quest.reward;
  }
  
  return 0;
};
