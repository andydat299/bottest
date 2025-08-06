import { config } from '../config.js';

/**
 * Kiểm tra xem user có phải admin không
 * @param {string} userId - Discord user ID
 * @returns {boolean}
 */
export function isAdmin(userId) {
  return config.admins.includes(userId);
}

/**
 * Tạo embed để hiển thị lỗi không có quyền
 * @param {import('discord.js').EmbedBuilder} EmbedBuilder
 * @returns {import('discord.js').EmbedBuilder}
 */
export function createNoPermissionEmbed(EmbedBuilder) {
  return new EmbedBuilder()
    .setColor('#FF0000')
    .setTitle('❌ Không có quyền')
    .setDescription('Bạn không có quyền sử dụng lệnh này!')
    .setTimestamp();
}

/**
 * Tạo embed thành công cho admin commands
 * @param {import('discord.js').EmbedBuilder} EmbedBuilder
 * @param {string} title
 * @param {string} description
 * @returns {import('discord.js').EmbedBuilder}
 */
export function createSuccessEmbed(EmbedBuilder, title, description) {
  return new EmbedBuilder()
    .setColor('#00FF00')
    .setTitle(`✅ ${title}`)
    .setDescription(description)
    .setTimestamp();
}

/**
 * Tạo embed lỗi cho admin commands
 * @param {import('discord.js').EmbedBuilder} EmbedBuilder
 * @param {string} title
 * @param {string} description
 * @returns {import('discord.js').EmbedBuilder}
 */
export function createErrorEmbed(EmbedBuilder, title, description) {
  return new EmbedBuilder()
    .setColor('#FF0000')
    .setTitle(`❌ ${title}`)
    .setDescription(description)
    .setTimestamp();
}
