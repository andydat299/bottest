export const config = {
  mongoURI: process.env.MONGO_URI,
  clientId: process.env.CLIENT_ID,
  token: process.env.DISCORD_TOKEN,
  guildId: process.env.GUILD_ID,
  logChannelId: process.env.LOG_CHANNEL_ID, // Kênh để ghi log
  prefix: 'f!',
  admins: process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',') : []
};

/**
 * Kiểm tra xem user có phải admin không
 */
export function isAdmin(userId) {
  return config.admins.includes(userId);
}

// Đạt Trần