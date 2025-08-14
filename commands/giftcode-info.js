import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import mongoose from 'mongoose';

export default {
  data: new SlashCommandBuilder()
    .setName('giftcode-info')
    .setDescription('📋 Xem thông tin về hệ thống giftcode'),

  async execute(interaction) {
    try {
      // Direct database access
      const db = mongoose.connection.db;
      const giftcodesCollection = db.collection('giftcodes');
      const usersCollection = db.collection('users');
      
      // Get statistics
      const totalGiftcodes = await giftcodesCollection.countDocuments();
      const activeGiftcodes = await giftcodesCollection.countDocuments({ isActive: true });
      const expiredGiftcodes = await giftcodesCollection.countDocuments({
        expiresAt: { $lt: new Date() }
      });
      
      // Get user's giftcode usage
      const user = await usersCollection.findOne({ discordId: interaction.user.id });
      const userUsedCount = user?.usedGiftcodes?.length || 0;

      // Get recent active giftcodes (without revealing codes)
      const recentGiftcodes = await giftcodesCollection.find({
        isActive: true,
        $or: [
          { expiresAt: { $gt: new Date() } },
          { expiresAt: null }
        ]
      }).sort({ createdAt: -1 }).limit(3).toArray();

      const embed = new EmbedBuilder()
        .setTitle('🎁 Hệ Thống Giftcode')
        .setDescription('Thông tin về giftcodes và cách sử dụng')
        .setColor('#FFD700')
        .addFields(
          { name: '📊 Thống kê tổng quan', value: [
            `📦 **Tổng giftcodes:** ${totalGiftcodes}`,
            `🟢 **Đang hoạt động:** ${activeGiftcodes}`,
            `⏰ **Đã hết hạn:** ${expiredGiftcodes}`,
            `🎯 **Bạn đã dùng:** ${userUsedCount}`
          ].join('\n'), inline: false },
          
          { name: '🎮 Cách sử dụng', value: [
            '1️⃣ Nhập `/redeem code:YOUR_CODE`',
            '2️⃣ Nhận phần thưởng ngay lập tức',
            '3️⃣ Mỗi code chỉ dùng được 1 lần',
            '4️⃣ Một số code có giới hạn thời gian'
          ].join('\n'), inline: false },
          
          { name: '🎁 Loại phần thưởng', value: [
            '💰 **Xu (Coins)** - Tiền trong game',
            '🎣 **Cần câu** - Fishing rods các level',
            '👑 **VIP** - Thời gian VIP miễn phí',
            '🎊 **Combo** - Nhiều phần thưởng cùng lúc'
          ].join('\n'), inline: false },
          
          { name: '📝 Lưu ý quan trọng', value: [
            '⚠️ **Phân biệt chữ hoa/thường**',
            '⏰ **Kiểm tra thời hạn sử dụng**',
            '🚫 **Không chia sẻ code đã dùng**',
            '💡 **Code có thể xuất hiện trong events**'
          ].join('\n'), inline: false }
        );

      // Show some recent giftcode info (without codes)
      if (recentGiftcodes.length > 0) {
        const recentInfo = recentGiftcodes.map(gc => {
          const rewards = [];
          if (gc.rewards.coins > 0) rewards.push(`${gc.rewards.coins.toLocaleString()} xu`);
          if (gc.rewards.fishingRods.length > 0) rewards.push(`Cần câu Lv.${gc.rewards.fishingRods.join(',')}`);
          if (gc.rewards.vipDays > 0) rewards.push(`${gc.rewards.vipDays} ngày VIP`);
          
          const usage = gc.maxUses ? `${gc.usedCount}/${gc.maxUses}` : `${gc.usedCount}/∞`;
          const expiry = gc.expiresAt ? 
            `Hết hạn <t:${Math.floor(new Date(gc.expiresAt).getTime() / 1000)}:R>` : 
            'Không hết hạn';
          
          return `🎫 **Giftcode mới** - ${rewards.join(', ')}\n📊 Đã dùng: ${usage} • ${expiry}`;
        }).join('\n\n');

        embed.addFields({ name: '🆕 Giftcodes gần đây', value: recentInfo, inline: false });
      }

      // Example usage
      embed.addFields({
        name: '💡 Ví dụ sử dụng',
        value: '```\n/redeem code:WELCOME2024\n```\n*Thay YOUR_CODE bằng mã giftcode thực tế*',
        inline: false
      });

      embed.setFooter({ text: 'Theo dõi thông báo để không bỏ lỡ giftcodes mới!' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

    } catch (error) {
      console.error('Giftcode info command error:', error);
      await interaction.reply({
        content: '❌ Có lỗi xảy ra khi lấy thông tin giftcode!',
        flags: 64
      });
    }
  }
};