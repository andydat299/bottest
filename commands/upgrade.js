import { SlashCommandBuilder } from 'discord.js';
import { User } from '../schemas/userSchema.js';
import { updateQuestProgress } from '../utils/questManager.js';
import { getMaxDurability } from '../utils/durabilityManager.js';
import { logUpgrade } from '../utils/logger.js';

export default {
  data: new SlashCommandBuilder()
    .setName('upgrade')
    .setDescription('Nâng cấp cần câu để có cơ hội câu được cá hiếm hơn 🎣'),
  prefixEnabled: true, // Cho phép sử dụng với prefix

  async execute(interaction) {
    const discordId = interaction.user.id;
    let user = await User.findOne({ discordId });
    if (!user) user = await User.create({ discordId });

    const currentLevel = user.rodLevel || 1;
    
    // Giá nâng cấp cho từng level cần câu
    const upgradeCosts = {
      1: 500,   // Level 1 -> 2: 500 xu
      2: 5000,  // Level 2 -> 3: 1000 xu
      3: 10000,  // Level 3 -> 4: 2000 xu
      4: 15000,  // Level 4 -> 5: 5000 xu
      5: 20000, // Level 5 -> 6: 10000 xu
      6: 50000, // Level 6 -> 7: 20000 xu
      7: 100000, // Level 7 -> 8: 50000 xu
      8: 150000,// Level 8 -> 9: 100000 xu
      9: 300000,// Level 9 -> 10: 200000 xu
      10: null  // Max level
    };
    
    const upgradeCost = upgradeCosts[currentLevel];
    
    // Kiểm tra nếu đã đạt level tối đa
    if (upgradeCost === null) {
      return interaction.reply({
        content: `🏆 Cần câu của bạn đã đạt **level tối đa (${currentLevel})**!\n✨ Không thể nâng cấp thêm nữa!`
      });
    }

    if (user.balance < upgradeCost) {
      return interaction.reply({
        content: `❌ Bạn cần **${upgradeCost.toLocaleString()} xu** để nâng cấp cần câu lên cấp ${currentLevel + 1}!\nHiện tại bạn có: **${user.balance.toLocaleString()} xu**`
      });
    }

    user.balance -= upgradeCost;
    const newLevel = currentLevel + 1;
    user.rodLevel = newLevel;
    
    // Cập nhật độ bền cho cần mới
    const newMaxDurability = getMaxDurability(user.rodLevel);
    user.rodMaxDurability = newMaxDurability;
    user.rodDurability = newMaxDurability; // Cần mới = 100% độ bền
    
    await user.save();

    // Log nâng cấp
    await logUpgrade(interaction.user, currentLevel, newLevel, upgradeCost);

    // Cập nhật quest upgrade
    await updateQuestProgress(discordId, 'upgrade', 1);

    // Hiển thị giá nâng cấp tiếp theo (nếu có)
    const nextUpgradeCost = upgradeCosts[user.rodLevel];
    const nextUpgradeInfo = nextUpgradeCost 
      ? `\n📈 Nâng cấp tiếp theo (Level ${user.rodLevel + 1}): **${nextUpgradeCost.toLocaleString()} xu**`
      : '\n🏆 **Bạn đã đạt level tối đa!**';

    await interaction.reply({
      content: `🎣 Đã nâng cấp cần câu lên **cấp ${user.rodLevel}**!\n💰 Còn lại: **${user.balance.toLocaleString()} xu**\n� **Độ bền mới:** ${user.rodDurability}/${user.rodMaxDurability} (100%)\n�🐟 Cơ hội câu được cá hiếm đã tăng!${nextUpgradeInfo}`
    });
  }
};