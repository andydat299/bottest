import { EmbedBuilder } from 'discord.js';
import { config } from '../config.js';

/**
 * Logger utility để ghi log vào Discord channel
 */

let client = null;

/**
 * Khởi tạo logger với Discord client
 * @param {Client} discordClient - Discord client instance
 */
export function initLogger(discordClient) {
  client = discordClient;
}

/**
 * Gửi log message tới Discord channel
 * @param {string} type - Loại log (info, warn, error, success)
 * @param {string} title - Tiêu đề log
 * @param {string} description - Mô tả chi tiết
 * @param {Object} extra - Thông tin bổ sung
 */
export async function logToDiscord(type, title, description, extra = {}) {
  if (!client || !config.logChannelId) return;
  
  try {
    const channel = await client.channels.fetch(config.logChannelId);
    if (!channel) return;

    const colors = {
      info: '#3498db',     // Blue
      success: '#2ecc71',  // Green
      warn: '#f39c12',     // Orange
      error: '#e74c3c',    // Red
      fishing: '#1abc9c',  // Turquoise
      admin: '#9b59b6',    // Purple
      quest: '#f1c40f',    // Yellow
      upgrade: '#e67e22',  // Orange
      money: '#f1c40f'     // Gold
    };

    const emojis = {
      info: 'ℹ️',
      success: '✅',
      warn: '⚠️',
      error: '❌',
      fishing: '🎣',
      admin: '👑',
      quest: '📋',
      upgrade: '⬆️',
      money: '💰'
    };

    const embed = new EmbedBuilder()
      .setColor(colors[type] || colors.info)
      .setTitle(`${emojis[type] || 'ℹ️'} ${title}`)
      .setDescription(description)
      .setTimestamp();

    // Thêm thông tin bổ sung
    if (extra.user) {
      embed.addFields({
        name: '👤 Người dùng',
        value: `<@${extra.user.id}> (${extra.user.username})`,
        inline: true
      });
    }

    if (extra.amount !== undefined) {
      const amountText = type === 'money' 
        ? `${extra.amount.toLocaleString()} xu`
        : extra.amount.toLocaleString();
      
      let amountLabel = '💰 Số lượng';
      if (type === 'money') {
        if (extra.type === 'received') amountLabel = '💰 Nhận được';
        else if (extra.type === 'deducted') amountLabel = '💸 Mất đi';
        else if (extra.type === 'spent') amountLabel = '💳 Chi tiêu';
      }
      
      embed.addFields({
        name: amountLabel,
        value: amountText,
        inline: true
      });
    }

    // Thêm thông tin money transaction
    if (type === 'money') {
      if (extra.source) {
        embed.addFields({
          name: '📍 Nguồn',
          value: extra.source,
          inline: true
        });
      }
      
      if (extra.reason) {
        embed.addFields({
          name: '❓ Lý do',
          value: extra.reason,
          inline: true
        });
      }
      
      if (extra.item) {
        embed.addFields({
          name: '🛒 Mục đích',
          value: extra.item,
          inline: true
        });
      }
    }

    if (extra.fish) {
      embed.addFields({
        name: '🐟 Cá câu được',
        value: `${extra.fish.name} (${extra.fish.rarity})`,
        inline: true
      });
    }

    if (extra.rodLevel) {
      embed.addFields({
        name: '🎣 Cấp cần câu',
        value: extra.rodLevel.toString(),
        inline: true
      });
    }

    if (extra.channel) {
      embed.addFields({
        name: '📍 Kênh',
        value: `<#${extra.channel.id}>`,
        inline: true
      });
    }

    if (extra.error) {
      embed.addFields({
        name: '🐛 Chi tiết lỗi',
        value: `\`\`\`${extra.error.slice(0, 1000)}\`\`\``,
        inline: false
      });
    }

    if (extra.command) {
      embed.addFields({
        name: '🔧 Lệnh',
        value: `\`/${extra.command}\``,
        inline: true
      });
    }

    await channel.send({ embeds: [embed] });
  } catch (error) {
    console.error('❌ Error sending log to Discord:', error);
  }
}

/**
 * Log thông tin câu cá
 */
export async function logFishing(user, fish, isMiss = false) {
  if (isMiss) {
    await logToDiscord('warn', 'Câu cá hụt', `${user.username} đã câu hụt`, {
      user,
      command: 'fish'
    });
  } else {
    await logToDiscord('fishing', 'Câu cá thành công', `${user.username} đã câu được cá`, {
      user,
      fish,
      command: 'fish'
    });
  }
}

/**
 * Log hoạt động admin
 */
export async function logAdminAction(admin, action, target, amount) {
  await logToDiscord('admin', `Admin: ${action}`, `${admin.username} đã ${action} cho ${target.username}`, {
    user: admin,
    amount,
    command: action
  });
}

/**
 * Log nâng cấp cần câu
 */
export async function logUpgrade(user, fromLevel, toLevel, cost) {
  await logToDiscord('upgrade', 'Nâng cấp cần câu', `${user.username} đã nâng cấp cần câu`, {
    user,
    amount: cost,
    rodLevel: toLevel,
    command: 'upgrade'
  });
}

/**
 * Log hoàn thành quest
 */
export async function logQuestComplete(user, questType, reward) {
  await logToDiscord('quest', 'Hoàn thành nhiệm vụ', `${user.username} đã hoàn thành nhiệm vụ ${questType}`, {
    user,
    amount: reward,
    command: 'quest'
  });
}

/**
 * Log lỗi hệ thống
 */
export async function logError(error, context = '') {
  await logToDiscord('error', 'Lỗi hệ thống', `Đã xảy ra lỗi: ${context}`, {
    error: error.message || error.toString()
  });
}

/**
 * Log thông tin chung
 */
export async function logInfo(title, description, extra = {}) {
  await logToDiscord('info', title, description, extra);
}

/**
 * Log cảnh báo
 */
export async function logWarn(title, description, extra = {}) {
  await logToDiscord('warn', title, description, extra);
}

/**
 * Log thành công
 */
export async function logSuccess(title, description, extra = {}) {
  await logToDiscord('success', title, description, extra);
}

/**
 * Log giao dịch tiền - Nhận tiền
 */
export async function logMoneyReceived(user, amount, source, extra = {}) {
  await logToDiscord('money', 'Nhận tiền', `${user.username} đã nhận ${amount.toLocaleString()} xu`, {
    user,
    amount,
    source,
    type: 'received',
    command: source,
    ...extra
  });
}

/**
 * Log giao dịch tiền - Trừ tiền
 */
export async function logMoneyDeducted(user, amount, reason, extra = {}) {
  await logToDiscord('money', 'Trừ tiền', `${user.username} đã mất ${amount.toLocaleString()} xu`, {
    user,
    amount,
    reason,
    type: 'deducted',
    command: reason,
    ...extra
  });
}

/**
 * Log giao dịch tiền - Chi tiêu
 */
export async function logMoneySpent(user, amount, item, extra = {}) {
  await logToDiscord('money', 'Chi tiêu', `${user.username} đã chi ${amount.toLocaleString()} xu`, {
    user,
    amount,
    item,
    type: 'spent',
    command: item,
    ...extra
  });
}
