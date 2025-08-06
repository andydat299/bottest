export const config = {
  mongoURI: process.env.MONGO_URI,
  clientId: process.env.CLIENT_ID,
  token: process.env.DISCORD_TOKEN,
  guildId: process.env.GUILD_ID,
  prefix: 'f!',
  admins: process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',') : []
};
// Đạt Trần