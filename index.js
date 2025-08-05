import 'dotenv/config';
import { Client, Collection, GatewayIntentBits } from 'discord.js';
import { config } from './config.js';
import { connectDB } from './database/mongo.js';
import fs from 'fs';

// Error handlers
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled promise rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
  process.exit(1);
});

console.log('🚀 Starting bot...');
console.log('📝 Config loaded:', { 
  hasToken: !!config.token, 
  clientId: config.clientId,
  guildId: config.guildId 
});

const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});
client.commands = new Collection();

console.log('📂 Loading commands...');

// Load commands
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
console.log(`Found ${commandFiles.length} command files:`, commandFiles);

for (const file of commandFiles) {
  console.log(`Loading command: ${file}`);
  const command = (await import(`./commands/${file}`)).default;
  client.commands.set(command.data.name, command);
  console.log(`✅ Loaded: ${command.data.name}`);
}

console.log('📂 Loading events...');

// Load events
const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));
console.log(`Found ${eventFiles.length} event files:`, eventFiles);

for (const file of eventFiles) {
  console.log(`Loading event: ${file}`);
  const event = (await import(`./events/${file}`)).default;
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
  console.log(`✅ Loaded event: ${event.name}`);
}

client.once('ready', () => {
  console.log(`✅ Bot logged in as ${client.user.tag}`);
});

console.log('🔌 Connecting to database...');
try {
  await connectDB();
} catch (error) {
  console.error('❌ Database connection failed:', error);
}

console.log('🔑 Logging in to Discord...');
try {
  await client.login(config.token);
} catch (error) {
  console.error('❌ Discord login failed:', error);
  process.exit(1);
}
