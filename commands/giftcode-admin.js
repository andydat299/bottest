import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import mongoose from 'mongoose';

export default {
  data: new SlashCommandBuilder()
    .setName('giftcode-admin')
    .setDescription('👑 Quản lý giftcodes (Admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('create')
        .setDescription('Tạo giftcode mới')
        .addStringOption(option =>
          option.setName('code')
            .setDescription('Mã giftcode (để trống = tự động tạo)')
            .setRequired(false))
        .addIntegerOption(option =>
          option.setName('coins')
            .setDescription('Số xu thưởng')
            .setRequired(false)
            .setMinValue(1))
        .addStringOption(option =>
          option.setName('fishing_rods')
            .setDescription('Cần câu thưởng (VD: 1,5,10)')
            .setRequired(false))
        .addIntegerOption(option =>
          option.setName('vip_days')
            .setDescription('Số ngày VIP thưởng')
            .setRequired(false)
            .setMinValue(1))
        .addIntegerOption(option =>
          option.setName('max_uses')
            .setDescription('Giới hạn lượt sử dụng tổng (để trống = không giới hạn)')
            .setRequired(false)
            .setMinValue(1))
        .addIntegerOption(option =>
          option.setName('max_uses_per_user')
            .setDescription('Giới hạn lượt sử dụng mỗi user (để trống = 1 lần)')
            .setRequired(false)
            .setMinValue(1))
        .addStringOption(option =>
          option.setName('expires_in')
            .setDescription('Thời hạn (VD: 7d, 24h, 30m)')
            .setRequired(false))
        .addStringOption(option =>
          option.setName('description')
            .setDescription('Mô tả giftcode')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('Xem danh sách giftcodes')
        .addBooleanOption(option =>
          option.setName('show_inactive')
            .setDescription('Hiển thị cả giftcode đã vô hiệu hóa')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('info')
        .setDescription('Xem thông tin chi tiết giftcode')
        .addStringOption(option =>
          option.setName('code')
            .setDescription('Mã giftcode')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('disable')
        .setDescription('Vô hiệu hóa giftcode')
        .addStringOption(option =>
          option.setName('code')
            .setDescription('Mã giftcode')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('enable')
        .setDescription('Kích hoạt lại giftcode')
        .addStringOption(option =>
          option.setName('code')
            .setDescription('Mã giftcode')
            .setRequired(true))),

  async execute(interaction) {
    try {
      const subcommand = interaction.options.getSubcommand();
      
      // Direct database access
      const db = mongoose.connection.db;
      const giftcodesCollection = db.collection('giftcodes');

      switch (subcommand) {
        case 'create':
          await handleCreate(interaction, giftcodesCollection);
          break;
        case 'list':
          await handleList(interaction, giftcodesCollection);
          break;
        case 'info':
          await handleInfo(interaction, giftcodesCollection);
          break;
        case 'disable':
          await handleDisable(interaction, giftcodesCollection);
          break;
        case 'enable':
          await handleEnable(interaction, giftcodesCollection);
          break;
      }

    } catch (error) {
      console.error('Giftcode admin command error:', error);
      await interaction.reply({
        content: '❌ Có lỗi xảy ra khi thực hiện lệnh admin!',
        flags: 64
      });
    }
  }
};

async function handleCreate(interaction, giftcodesCollection) {
  const code = interaction.options.getString('code') || generateRandomCode();
  const coins = interaction.options.getInteger('coins') || 0;
  const fishingRodsStr = interaction.options.getString('fishing_rods');
  const vipDays = interaction.options.getInteger('vip_days') || 0;
  const maxUses = interaction.options.getInteger('max_uses');
  const maxUsesPerUser = interaction.options.getInteger('max_uses_per_user') || 1;
  const expiresInStr = interaction.options.getString('expires_in');
  const description = interaction.options.getString('description') || 'Giftcode đặc biệt';

  // Parse fishing rods
  let fishingRods = [];
  if (fishingRodsStr) {
    fishingRods = fishingRodsStr.split(',').map(x => parseInt(x.trim())).filter(x => x >= 1 && x <= 20);
  }

  // Parse expiry time
  let expiresAt = null;
  if (expiresInStr) {
    expiresAt = parseExpiry(expiresInStr);
  }

  // Check if code already exists
  const existingCode = await giftcodesCollection.findOne({ code: code.toUpperCase() });
  if (existingCode) {
    await interaction.reply({
      content: `❌ **Giftcode \`${code}\` đã tồn tại!**\n\n💡 Hãy chọn mã code khác.`,
      flags: 64
    });
    return;
  }

  // Create giftcode
  const giftcodeData = {
    code: code.toUpperCase(),
    rewards: {
      coins,
      fishingRods,
      vipDays
    },
    description,
    maxUses,
    maxUsesPerUser,
    expiresAt,
    isActive: true,
    usedCount: 0,
    usedBy: [],
    createdBy: {
      discordId: interaction.user.id,
      username: interaction.user.username
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };

  await giftcodesCollection.insertOne(giftcodeData);

  // Success embed
  const embed = new EmbedBuilder()
    .setTitle('✅ Tạo Giftcode Thành Công!')
    .setDescription(`Giftcode **${code.toUpperCase()}** đã được tạo!`)
    .setColor('#00FF00')
    .addFields(
      { name: '🎫 Mã code', value: `\`${code.toUpperCase()}\``, inline: true },
      { name: '💰 Xu thưởng', value: `${coins.toLocaleString()} xu`, inline: true },
      { name: '🎣 Cần câu', value: fishingRods.length > 0 ? `Level ${fishingRods.join(', ')}` : 'Không có', inline: true },
      { name: '👑 VIP', value: vipDays > 0 ? `${vipDays} ngày` : 'Không có', inline: true },
      { name: '📊 Giới hạn tổng', value: maxUses ? `${maxUses} lượt` : 'Không giới hạn', inline: true },
      { name: '👤 Giới hạn/user', value: `${maxUsesPerUser} lần/user`, inline: true },
      { name: '⏰ Hết hạn', value: expiresAt ? `<t:${Math.floor(expiresAt.getTime() / 1000)}:R>` : 'Không hết hạn', inline: true },
      { name: '📝 Mô tả', value: description, inline: false }
    )
    .setFooter({ text: 'Giftcode đã sẵn sàng sử dụng!' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed], flags: 64 });
}

async function handleList(interaction, giftcodesCollection) {
  const showInactive = interaction.options.getBoolean('show_inactive') || false;
  
  const filter = showInactive ? {} : { isActive: true };
  const giftcodes = await giftcodesCollection.find(filter).sort({ createdAt: -1 }).limit(10).toArray();

  if (giftcodes.length === 0) {
    await interaction.reply({
      content: '📋 **Không có giftcode nào!**\n\n💡 Sử dụng `/giftcode-admin create` để tạo giftcode mới.',
      flags: 64
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle('📋 Danh Sách Giftcodes')
    .setDescription(`Hiển thị ${giftcodes.length} giftcodes`)
    .setColor('#3498db');

  for (const gc of giftcodes) {
    const status = gc.isActive ? '🟢 Active' : '🔴 Inactive';
    const usage = gc.maxUses ? `${gc.usedCount}/${gc.maxUses}` : `${gc.usedCount}/∞`;
    const expiry = gc.expiresAt ? `<t:${Math.floor(new Date(gc.expiresAt).getTime() / 1000)}:R>` : 'Không hết hạn';
    
    embed.addFields({
      name: `\`${gc.code}\` ${status}`,
      value: [
        `💰 ${gc.rewards.coins} xu`,
        `📊 ${usage}`,
        `⏰ ${expiry}`
      ].join(' • '),
      inline: false
    });
  }

  embed.setFooter({ text: `Dùng /giftcode-admin info để xem chi tiết` });

  await interaction.reply({ embeds: [embed], flags: 64 });
}

async function handleInfo(interaction, giftcodesCollection) {
  const code = interaction.options.getString('code').toUpperCase();
  
  const giftcode = await giftcodesCollection.findOne({ code });
  
  if (!giftcode) {
    await interaction.reply({
      content: `❌ **Giftcode \`${code}\` không tồn tại!**`,
      flags: 64
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle(`🎫 Chi Tiết Giftcode: ${code}`)
    .setColor(giftcode.isActive ? '#00FF00' : '#FF0000')
    .addFields(
      { name: '📊 Trạng thái', value: giftcode.isActive ? '🟢 Đang hoạt động' : '🔴 Đã vô hiệu hóa', inline: true },
      { name: '� Giới hạn tổng', value: `${giftcode.usedCount}${giftcode.maxUses ? `/${giftcode.maxUses}` : '/∞'}`, inline: true },
      { name: '👤 Giới hạn/user', value: `${giftcode.maxUsesPerUser || 1} lần/user`, inline: true },
      { name: '⏰ Hết hạn', value: giftcode.expiresAt ? `<t:${Math.floor(new Date(giftcode.expiresAt).getTime() / 1000)}:f>` : 'Không hết hạn', inline: true },
      { name: '💰 Xu thưởng', value: `${giftcode.rewards.coins.toLocaleString()} xu`, inline: true },
      { name: '🎣 Cần câu thưởng', value: giftcode.rewards.fishingRods.length > 0 ? `Level ${giftcode.rewards.fishingRods.join(', ')}` : 'Không có', inline: true },
      { name: '👑 VIP thưởng', value: giftcode.rewards.vipDays > 0 ? `${giftcode.rewards.vipDays} ngày` : 'Không có', inline: true },
      { name: '📝 Mô tả', value: giftcode.description, inline: false },
      { name: '👤 Tạo bởi', value: giftcode.createdBy.username, inline: true },
      { name: '📅 Ngày tạo', value: `<t:${Math.floor(new Date(giftcode.createdAt).getTime() / 1000)}:f>`, inline: true }
    );

  if (giftcode.usedBy.length > 0) {
    const recentUsers = giftcode.usedBy.slice(-5).map(u => u.username).join(', ');
    embed.addFields({ name: '👥 Người dùng gần đây', value: recentUsers, inline: false });
  }

  await interaction.reply({ embeds: [embed], flags: 64 });
}

async function handleDisable(interaction, giftcodesCollection) {
  const code = interaction.options.getString('code').toUpperCase();
  
  const result = await giftcodesCollection.updateOne(
    { code },
    { $set: { isActive: false, updatedAt: new Date() } }
  );

  if (result.matchedCount === 0) {
    await interaction.reply({
      content: `❌ **Giftcode \`${code}\` không tồn tại!**`,
      flags: 64
    });
    return;
  }

  await interaction.reply({
    content: `✅ **Đã vô hiệu hóa giftcode \`${code}\`!**\n\nGiftcode này không thể sử dụng được nữa.`,
    flags: 64
  });
}

async function handleEnable(interaction, giftcodesCollection) {
  const code = interaction.options.getString('code').toUpperCase();
  
  const result = await giftcodesCollection.updateOne(
    { code },
    { $set: { isActive: true, updatedAt: new Date() } }
  );

  if (result.matchedCount === 0) {
    await interaction.reply({
      content: `❌ **Giftcode \`${code}\` không tồn tại!**`,
      flags: 64
    });
    return;
  }

  await interaction.reply({
    content: `✅ **Đã kích hoạt lại giftcode \`${code}\`!**\n\nGiftcode này có thể sử dụng được rồi.`,
    flags: 64
  });
}

function generateRandomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function parseExpiry(timeStr) {
  const now = new Date();
  const regex = /(\d+)([dhm])/;
  const match = timeStr.match(regex);
  
  if (!match) return null;
  
  const amount = parseInt(match[1]);
  const unit = match[2];
  
  switch (unit) {
    case 'd': // days
      return new Date(now.getTime() + amount * 24 * 60 * 60 * 1000);
    case 'h': // hours
      return new Date(now.getTime() + amount * 60 * 60 * 1000);
    case 'm': // minutes
      return new Date(now.getTime() + amount * 60 * 1000);
    default:
      return null;
  }
}