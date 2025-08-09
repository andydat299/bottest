#!/usr/bin/env node

/**
 * Railway Command Deployment Guide
 * Step-by-step guide for deploying commands on Railway
 */

console.log('🚂 RAILWAY COMMAND DEPLOYMENT GUIDE\n');

console.log('🎯 PROBLEM: Bot running but slash commands not appearing');
console.log('💡 SOLUTION: Commands need to be registered with Discord API');

console.log('\n📋 STEP-BY-STEP RAILWAY DEPLOYMENT:');

console.log('\n🔧 STEP 1: ADD ENVIRONMENT VARIABLES TO RAILWAY');
console.log('1. Go to https://railway.app/dashboard');
console.log('2. Click your bot project');
console.log('3. Click "Variables" tab');
console.log('4. Add these variables:');
console.log('   • CLIENT_ID = your_discord_application_id');
console.log('   • DISCORD_TOKEN = your_discord_bot_token');
console.log('   • GUILD_ID = your_discord_server_id (optional)');

console.log('\n📄 STEP 2: DEPLOY FILES TO RAILWAY');
console.log('git add .');
console.log('git commit -m "Add: Command deployment system"');
console.log('git push');
console.log('# Railway will automatically redeploy');

console.log('\n⚡ STEP 3: RUN DEPLOYMENT COMMAND');
console.log('Option A - Railway CLI (if installed):');
console.log('railway run node deploy-commands.js');
console.log('');
console.log('Option B - Add to package.json start script:');
console.log('Update your package.json:');
console.log('"scripts": {');
console.log('  "start": "node deploy-commands.js && node index.js"');
console.log('}');
console.log('# This deploys commands then starts the bot');

console.log('\n🎮 STEP 4: VERIFY COMMANDS DEPLOYED');
console.log('1. Check Railway logs for success message');
console.log('2. Go to your Discord server');  
console.log('3. Type "/" in chat - commands should appear');
console.log('4. Test a command like /fish');

console.log('\n🔍 TROUBLESHOOTING RAILWAY DEPLOYMENT:');

console.log('\n❌ "Missing environment variables" error:');
console.log('• Go to Railway → Your Project → Variables');
console.log('• Make sure CLIENT_ID and DISCORD_TOKEN are set');
console.log('• Values should not have quotes or extra spaces');

console.log('\n❌ "Commands not appearing in Discord":');
console.log('• Check Railway logs for deployment success');
console.log('• Try guild deployment first (faster)');
console.log('• Global commands take up to 1 hour');
console.log('• Make sure bot is in the server');

console.log('\n❌ "Error 50001: Missing Access":');
console.log('• CLIENT_ID is wrong - check Discord Developer Portal');
console.log('• Bot needs "applications.commands" scope');
console.log('• Re-invite bot with proper permissions');

console.log('\n🚀 RECOMMENDED RAILWAY SETUP:');

const packageJsonScript = `{
  "scripts": {
    "start": "node index.js",
    "deploy": "node deploy-commands.js",
    "deploy-and-start": "node deploy-commands.js && node index.js"
  }
}`;

console.log('\n📄 package.json scripts:');
console.log(packageJsonScript);

console.log('\n🔧 Railway start command options:');
console.log('Option 1 - Deploy commands manually first:');
console.log('   Start Command: node index.js');
console.log('   Then run: railway run node deploy-commands.js');
console.log('');
console.log('Option 2 - Auto-deploy commands on startup:');
console.log('   Start Command: node deploy-commands.js && node index.js');
console.log('   Commands deploy automatically when bot starts');

console.log('\n⚡ QUICK DEPLOYMENT SCRIPT:');

const quickScript = `#!/bin/bash
# Quick Railway deployment script

echo "🚂 Deploying to Railway..."

# 1. Deploy files
git add .
git commit -m "Deploy: Bot with command registration"
git push

echo "✅ Files deployed to Railway"

# 2. Deploy commands (if Railway CLI installed)
echo "🔧 Deploying Discord commands..."
railway run node deploy-commands.js

echo "🎉 Deployment complete!"
echo "Check Discord for slash commands"`;

console.log(quickScript);

console.log('\n📊 MONITORING DEPLOYMENT:');
console.log('1. Railway Dashboard → Your Project → Deployments');
console.log('2. Click latest deployment to see logs');
console.log('3. Look for command deployment success messages');
console.log('4. Test commands in Discord server');

console.log('\n✅ Expected Success Logs:');
console.log('🔍 Loading X command files from commands directory...');
console.log('✅ Loaded: /fish - Go fishing and try to catch something!');
console.log('✅ Loaded: /balance - Check your current balance');
console.log('✅ Loaded: /auto-fishing - Start or stop auto-fishing');
console.log('🚀 Preparing to deploy X commands...');
console.log('✅ Successfully deployed X commands to guild!');
console.log('🎉 Command deployment completed successfully!');

console.log('\n🎯 FINAL CHECKLIST:');
console.log('□ Environment variables set in Railway');
console.log('□ deploy-commands.js file committed');
console.log('□ Commands deployed successfully (check logs)');
console.log('□ Bot running in Railway (online in Discord)');
console.log('□ Slash commands appearing in Discord');
console.log('□ Commands responding when used');

console.log('\n🚂 Railway command deployment guide ready!');
console.log('🎮 Your slash commands should work after following these steps!');