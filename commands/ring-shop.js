import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import mongoose from 'mongoose';

export default {
  data: new SlashCommandBuilder()
    .setName('ring-shop')
    .setDescription('💍 Cửa hàng nhẫn cưới')
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('Xem danh sách nhẫn có sẵn'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('buy')
        .setDescription('Mua nhẫn cưới')
        .addStringOption(option =>
          option.setName('ring_type')
            .setDescription('Loại nhẫn muốn mua')
            .setRequired(true)
            .addChoices(
              { name: '💍 Nhẫn Bạc (50,000 xu)', value: 'silver_ring' },
              { name: '💎 Nhẫn Vàng (150,000 xu)', value: 'gold_ring' },
              { name: '💖 Nhẫn Kim Cương (500,000 xu)', value: 'diamond_ring' },
              { name: '🌟 Nhẫn Huyền Thoại (1,500,000 xu)', value: 'legendary_ring' }
            )))
    .addSubcommand(subcommand =>
      subcommand
        .setName('inventory')
        .setDescription('Xem nhẫn trong túi đồ của bạn')),

  async execute(interaction) {
    try {
      const subcommand = interaction.options.getSubcommand();
      
      switch (subcommand) {
        case 'view':
          await handleViewShop(interaction);
          break;
        case 'buy':
          await handleBuyRing(interaction);
          break;
        case 'inventory':
          await handleViewInventory(interaction);
          break;
      }

    } catch (error) {
      console.error('Ring shop command error:', error);
      await interaction.reply({
        content: '❌ Có lỗi xảy ra khi truy cập cửa hàng nhẫn!',
        flags: 64
      });
    }
  }
};

const RING_DATA = {
  silver_ring: {
    name: '💍 Nhẫn Bạc',
    price: 50000,
    description: 'Nhẫn bạc đơn giản và thanh lịch',
    rarity: 'Common',
    emoji: '💍',
    marriageBonus: 5, // 5% bonus xu khi married
    durability: 30 // days
  },
  gold_ring: {
    name: '💎 Nhẫn Vàng', 
    price: 150000,
    description: 'Nhẫn vàng sang trọng với đá quý nhỏ',
    rarity: 'Rare',
    emoji: '💎',
    marriageBonus: 10, // 10% bonus xu
    durability: 60 // days
  },
  diamond_ring: {
    name: '💖 Nhẫn Kim Cương',
    price: 500000,
    description: 'Nhẫn kim cương lấp lánh, biểu tượng tình yêu vĩnh cửu',
    rarity: 'Epic',
    emoji: '💖',
    marriageBonus: 20, // 20% bonus xu
    durability: 180 // days
  },
  legendary_ring: {
    name: '🌟 Nhẫn Huyền Thoại',
    price: 1500000,
    description: 'Nhẫn huyền thoại với sức mạnh thần bí, chỉ dành cho những cặp đôi đặc biệt',
    rarity: 'Legendary',
    emoji: '🌟',
    marriageBonus: 50, // 50% bonus xu
    durability: 365 // days
  }
};

async function handleViewShop(interaction) {
  const embed = new EmbedBuilder()
    .setTitle('💍 Cửa Hàng Nhẫn Cưới')
    .setDescription('**Chào mừng đến với cửa hàng nhẫn cưới!**\n\n✨ Tìm chiếc nhẫn hoàn hảo để cầu hôn người thương của bạn!')
    .setColor('#FFB6C1')
    .setTimestamp();

  for (const [key, ring] of Object.entries(RING_DATA)) {
    const rarityColor = {
      'Common': '⚪',
      'Rare': '🟡', 
      'Epic': '🟣',
      'Legendary': '🟠'
    }[ring.rarity];

    embed.addFields({
      name: `${ring.emoji} ${ring.name} ${rarityColor}`,
      value: [
        `💰 **Giá:** ${ring.price.toLocaleString()} xu`,
        `📝 **Mô tả:** ${ring.description}`,
        `💕 **Bonus khi kết hôn:** +${ring.marriageBonus}% xu từ các hoạt động`,
        `⏰ **Thời hạn:** ${ring.durability} ngày`,
        `🏷️ **Độ hiếm:** ${ring.rarity}`
      ].join('\n'),
      inline: false
    });
  }

  embed.addFields({
    name: '💡 Hướng Dẫn Sử Dụng',
    value: [
      '1️⃣ Mua nhẫn bằng `/ring-shop buy`',
      '2️⃣ Cầu hôn người yêu bằng `/marry propose`', 
      '3️⃣ Nhận bonus xu từ các hoạt động khi đã kết hôn',
      '4️⃣ Nhẫn có thời hạn, hết hạn sẽ tự động ly hôn'
    ].join('\n'),
    inline: false
  });

  embed.setFooter({ text: 'Sử dụng /ring-shop buy để mua nhẫn!' });

  await interaction.reply({ embeds: [embed] });
}

async function handleBuyRing(interaction) {
  await interaction.deferReply();

  const ringType = interaction.options.getString('ring_type');
  const ring = RING_DATA[ringType];

  if (!ring) {
    await interaction.editReply({
      content: '❌ Loại nhẫn không hợp lệ!'
    });
    return;
  }

  // Database access
  const db = mongoose.connection.db;
  const usersCollection = db.collection('users');

  // Check user balance
  const user = await usersCollection.findOne({ discordId: interaction.user.id });
  if (!user || (user.balance || 0) < ring.price) {
    const shortage = ring.price - (user?.balance || 0);
    await interaction.editReply({
      content: [
        '❌ **Không đủ xu để mua nhẫn này!**',
        '',
        `💍 **Nhẫn:** ${ring.name}`,
        `💰 **Giá:** ${ring.price.toLocaleString()} xu`,
        `💳 **Số dư:** ${(user?.balance || 0).toLocaleString()} xu`,
        `📉 **Thiếu:** ${shortage.toLocaleString()} xu`,
        '',
        '🎣 Hãy câu cá để kiếm thêm xu!'
      ].join('\n')
    });
    return;
  }

  // Check if user already has rings (max 5 rings)
  const inventory = user.ringInventory || [];
  if (inventory.length >= 5) {
    await interaction.editReply({
      content: [
        '❌ **Túi đồ nhẫn đã đầy!**',
        '',
        '📦 **Giới hạn:** Tối đa 5 nhẫn',
        `🎒 **Hiện có:** ${inventory.length}/5`,
        '',
        '💡 Hãy sử dụng nhẫn hiện có hoặc đợi chúng hết hạn!'
      ].join('\n')
    });
    return;
  }

  // Purchase ring
  const newRing = {
    id: `ring_${Date.now()}`,
    type: ringType,
    name: ring.name,
    emoji: ring.emoji,
    purchasedAt: new Date(),
    expiresAt: new Date(Date.now() + ring.durability * 24 * 60 * 60 * 1000),
    isUsed: false,
    marriageBonus: ring.marriageBonus
  };

  // Update user
  await usersCollection.updateOne(
    { discordId: interaction.user.id },
    { 
      $inc: { balance: -ring.price },
      $push: { ringInventory: newRing },
      $set: { updatedAt: new Date() }
    }
  );

  // Get updated balance
  const updatedUser = await usersCollection.findOne({ discordId: interaction.user.id });

  // Success embed
  const successEmbed = new EmbedBuilder()
    .setTitle('✅ Mua Nhẫn Thành Công!')
    .setDescription(`**Chúc mừng! Bạn đã mua ${ring.name}!**`)
    .setColor('#00ff00')
    .addFields(
      { name: '💍 Nhẫn đã mua', value: `${ring.emoji} ${ring.name}`, inline: true },
      { name: '💰 Giá tiền', value: `${ring.price.toLocaleString()} xu`, inline: true },
      { name: '💳 Số dư còn lại', value: `${updatedUser.balance.toLocaleString()} xu`, inline: true },
      { name: '💕 Bonus kết hôn', value: `+${ring.marriageBonus}% xu`, inline: true },
      { name: '⏰ Thời hạn', value: `${ring.durability} ngày`, inline: true },
      { name: '🎒 Túi đồ', value: `${inventory.length + 1}/5 nhẫn`, inline: true },
      { name: '🌟 Bước tiếp theo', value: 'Sử dụng `/marry propose @người_yêu` để cầu hôn!', inline: false }
    )
    .setFooter({ text: 'Chúc bạn hạnh phúc!' })
    .setTimestamp();

  await interaction.editReply({ embeds: [successEmbed] });

  console.log(`${interaction.user.username} bought ${ring.name} for ${ring.price.toLocaleString()} xu`);
}

async function handleViewInventory(interaction) {
  await interaction.deferReply({ ephemeral: true });

  // Database access
  const db = mongoose.connection.db;
  const usersCollection = db.collection('users');

  const user = await usersCollection.findOne({ discordId: interaction.user.id });
  const inventory = user?.ringInventory || [];

  if (inventory.length === 0) {
    await interaction.editReply({
      content: [
        '🎒 **Túi Đồ Nhẫn Trống**',
        '',
        '❌ **Bạn chưa có nhẫn nào.**',
        '',
        '💡 Sử dụng `/ring-shop buy` để mua nhẫn!'
      ].join('\n')
    });
    return;
  }

  // Filter out expired rings
  const now = new Date();
  const validRings = inventory.filter(ring => new Date(ring.expiresAt) > now);
  const expiredRings = inventory.filter(ring => new Date(ring.expiresAt) <= now);

  // Remove expired rings from database
  if (expiredRings.length > 0) {
    await usersCollection.updateOne(
      { discordId: interaction.user.id },
      { $pull: { ringInventory: { expiresAt: { $lte: now } } } }
    );
  }

  const embed = new EmbedBuilder()
    .setTitle('🎒 Túi Đồ Nhẫn')
    .setDescription(`**Bạn đang có ${validRings.length}/5 nhẫn:**`)
    .setColor('#9B59B6')
    .setTimestamp();

  if (validRings.length === 0) {
    embed.setDescription('❌ **Tất cả nhẫn đã hết hạn!**\n\n💡 Mua nhẫn mới tại `/ring-shop buy`');
  } else {
    for (const ring of validRings) {
      const daysLeft = Math.ceil((new Date(ring.expiresAt) - now) / (1000 * 60 * 60 * 24));
      const status = ring.isUsed ? '💒 Đã sử dụng' : '✨ Chưa sử dụng';
      
      embed.addFields({
        name: `${ring.emoji} ${ring.name}`,
        value: [
          `📊 **Trạng thái:** ${status}`,
          `💕 **Bonus:** +${ring.marriageBonus}% xu`,
          `⏰ **Còn lại:** ${daysLeft} ngày`,
          `📅 **Mua ngày:** ${new Date(ring.purchasedAt).toLocaleDateString()}`
        ].join('\n'),
        inline: true
      });
    }
  }

  if (expiredRings.length > 0) {
    embed.addFields({
      name: '⚠️ Nhẫn Đã Hết Hạn',
      value: `${expiredRings.length} nhẫn đã hết hạn và bị xóa tự động.`,
      inline: false
    });
  }

  embed.setFooter({ text: 'Sử dụng /marry propose để cầu hôn với nhẫn!' });

  await interaction.editReply({ embeds: [embed] });
}