import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';

console.log('🚀 Starting minimal bot...');

const client = new Client({ 
  intents: [GatewayIntentBits.Guilds] 
});

client.once('ready', () => {
  console.log(`✅ Bot ready: ${client.user.tag}`);
});

client.on('error', console.error);

console.log('🔑 Logging in...');
client.login(process.env.DISCORD_TOKEN).catch(console.error);
