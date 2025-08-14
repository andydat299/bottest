import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import mongoose from 'mongoose';

export default {
  data: new SlashCommandBuilder()
    .setName('redeem')
    .setDescription('🎁 Sử dụng giftcode để nhận phần thưởng')
    .addStringOption(option =>
      option.setName('code')
        .setDescription('Nhập giftcode')
        .setRequired(true)),

  async execute(interaction) {
    try {
      const giftCode = interaction.options.getString('code').toUpperCase().trim();
      
      // Direct database access
      const db = mongoose.connection.db;
      const usersCollection = db.collection('users');
      const giftcodesCollection = db.collection('giftcodes');
      
      // Find user
      let user = await usersCollection.findOne({ discordId: interaction.user.id });
      
      if (!user) {
        // Create user if doesn't exist
        user = {
          discordId: interaction.user.id,
          username: interaction.user.username,
          balance: 0,
          usedGiftcodes: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        await usersCollection.insertOne(user);
      }

      // Find giftcode
      const giftcode = await giftcodesCollection.findOne({ code: giftCode });

      if (!giftcode) {
        await interaction.reply({
          content: '❌ **Giftcode không tồn tại!**\n\n💡 Hãy kiểm tra lại mã code hoặc liên hệ admin.',
          flags: 64
        });
        return;
      }

      // Check if giftcode is active
      if (!giftcode.isActive) {
        await interaction.reply({
          content: '❌ **Giftcode đã bị vô hiệu hóa!**\n\n💡 Mã code này không còn khả dụng.',
          flags: 64
        });
        return;
      }

      // Check if giftcode is expired
      if (giftcode.expiresAt && new Date() > new Date(giftcode.expiresAt)) {
        await interaction.reply({
          content: '❌ **Giftcode đã hết hạn!**\n\n💡 Mã code này đã quá thời hạn sử dụng.',
          flags: 64
        });
        return;
      }

      // Check if user already used this giftcode
      const userUsedCodes = user.usedGiftcodes || [];
      const userUsageCount = giftcode.usedBy ? 
        giftcode.usedBy.filter(usage => usage.discordId === interaction.user.id).length : 0;
      
      const maxUsesPerUser = giftcode.maxUsesPerUser || 1;
      
      if (userUsageCount >= maxUsesPerUser) {
        const timesText = maxUsesPerUser === 1 ? 'một lần' : `${maxUsesPerUser} lần`;
        await interaction.reply({
          content: `❌ **Bạn đã sử dụng giftcode này đủ ${timesText}!**\n\n💡 Mỗi user chỉ được sử dụng giftcode này tối đa ${timesText}.`,
          flags: 64
        });
        return;
      }

      // Check usage limit
      if (giftcode.maxUses && giftcode.usedCount >= giftcode.maxUses) {
        await interaction.reply({
          content: '❌ **Giftcode đã hết lượt sử dụng!**\n\n💡 Mã code này đã đạt giới hạn sử dụng.',
          flags: 64
        });
        return;
      }

      // Apply rewards
      const rewards = giftcode.rewards;
      let rewardText = [];

      // Add coins
      if (rewards.coins && rewards.coins > 0) {
        await usersCollection.updateOne(
          { discordId: interaction.user.id },
          { $inc: { balance: rewards.coins } }
        );
        rewardText.push(`💰 **${rewards.coins.toLocaleString()} xu**`);
      }

      // Add fishing rods
      if (rewards.fishingRods && rewards.fishingRods.length > 0) {
        const currentUser = await usersCollection.findOne({ discordId: interaction.user.id });
        const currentRods = currentUser.fishingRods || {};
        
        for (const rodLevel of rewards.fishingRods) {
          const maxDurability = rodLevel * 10;
          currentRods[rodLevel.toString()] = maxDurability;
        }
        
        await usersCollection.updateOne(
          { discordId: interaction.user.id },
          { $set: { fishingRods: currentRods } }
        );
        
        rewardText.push(`🎣 **Cần câu Level ${rewards.fishingRods.join(', ')}**`);
      }

      // Add VIP days
      if (rewards.vipDays && rewards.vipDays > 0) {
        // This would require VIP system integration
        rewardText.push(`👑 **${rewards.vipDays} ngày VIP**`);
      }

      // Update giftcode usage
      await giftcodesCollection.updateOne(
        { code: giftCode },
        { 
          $inc: { usedCount: 1 },
          $push: { 
            usedBy: {
              discordId: interaction.user.id,
              username: interaction.user.username,
              usedAt: new Date()
            }
          }
        }
      );

      // Update user's used giftcodes (for backward compatibility)
      if (!userUsedCodes.includes(giftCode)) {
        await usersCollection.updateOne(
          { discordId: interaction.user.id },
          { 
            $push: { usedGiftcodes: giftCode },
            $set: { updatedAt: new Date() }
          }
        );
      }

      // Get updated balance
      const updatedUser = await usersCollection.findOne({ discordId: interaction.user.id });

      // Success embed
      const successEmbed = new EmbedBuilder()
        .setTitle('🎉 Sử Dụng Giftcode Thành Công!')
        .setDescription(`Bạn đã nhận được phần thưởng từ giftcode **${giftCode}**!`)
        .setColor('#00FF00')
        .addFields(
          { name: '🎁 Phần thưởng nhận được', value: rewardText.join('\n'), inline: false },
          { name: '💳 Số dư hiện tại', value: `${updatedUser.balance.toLocaleString()} xu`, inline: true },
          { name: '📊 Lượt sử dụng', value: `${giftcode.usedCount + 1}${giftcode.maxUses ? `/${giftcode.maxUses}` : ''}`, inline: true },
          { name: '👤 Bạn đã dùng', value: `${userUsageCount + 1}/${giftcode.maxUsesPerUser || 1} lần`, inline: true },
          { name: '📝 Ghi chú', value: giftcode.description || 'Không có mô tả', inline: false }
        )
        .setFooter({ text: 'Cảm ơn bạn đã sử dụng giftcode! 🎁' })
        .setTimestamp();

      await interaction.reply({ embeds: [successEmbed] });

      console.log(`${interaction.user.username} redeemed giftcode: ${giftCode}`);

    } catch (error) {
      console.error('Redeem command error:', error);
      await interaction.reply({
        content: '❌ Có lỗi xảy ra khi sử dụng giftcode! Vui lòng thử lại.',
        flags: 64
      });
    }
  }
};