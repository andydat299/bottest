#!/usr/bin/env node

/**
 * Railway Emergency Rollback Script
 * Quick commands for emergency situations
 */

console.log('🚨 RAILWAY EMERGENCY ROLLBACK GUIDE\n');

console.log('⚠️ WHEN TO USE EMERGENCY ROLLBACK:');
console.log('❌ Bot suddenly goes offline');
console.log('❌ Commands stop working'); 
console.log('❌ Database errors appearing');
console.log('❌ Railway deployment failed');
console.log('❌ Critical errors in logs');

console.log('\n🚨 IMMEDIATE ROLLBACK OPTIONS:');

console.log('\n🔄 METHOD 1: Git Revert (Fastest)');
console.log('git revert HEAD           # Undo last commit');
console.log('git push                  # Deploy rollback immediately');
console.log('# Railway auto-deploys in 30-60 seconds');

console.log('\n🔄 METHOD 2: Git Reset (Nuclear)');
console.log('git reset --hard HEAD~1   # Remove last commit completely');
console.log('git push --force          # Force push old state');
console.log('# Use only if revert doesn\'t work');

console.log('\n🔄 METHOD 3: Railway Dashboard');
console.log('1. Go to Railway dashboard');
console.log('2. Click your project');
console.log('3. Go to "Deployments" tab');
console.log('4. Find last working deployment');
console.log('5. Click "Redeploy" button');
console.log('# Manual rollback via web interface');

console.log('\n📊 CHECK BOT STATUS:');
console.log('• Discord: Check if bot is online');
console.log('• Railway: Check deployment status');
console.log('• Logs: Look for error messages');
console.log('• Commands: Test /fish or /balance');

console.log('\n⏱️ ROLLBACK TIMELINE:');
console.log('• Git revert: 1-2 minutes');
console.log('• Railway redeploy: 2-3 minutes');
console.log('• Bot recovery: 3-5 minutes total');

console.log('\n🎯 VERIFY ROLLBACK SUCCESS:');
console.log('✅ Bot shows online in Discord');
console.log('✅ Basic commands work (/fish, /balance)');
console.log('✅ No critical errors in Railway logs');
console.log('✅ Database connections working');

console.log('\n🔧 POST-ROLLBACK ACTIONS:');
console.log('1. Identify what caused the issue');
console.log('2. Test fixes locally before redeploy');
console.log('3. Deploy one small fix at a time');
console.log('4. Monitor each change carefully');

console.log('\n📱 RAILWAY DASHBOARD QUICK ACCESS:');
console.log('• URL: https://railway.app/dashboard');
console.log('• Login with your account');
console.log('• Find your bot project');
console.log('• Monitor real-time logs');

console.log('\n💡 PREVENTION TIPS:');
console.log('• Always backup before major changes');
console.log('• Test locally with `npm start`');
console.log('• Deploy small changes incrementally');
console.log('• Monitor logs after each deployment');
console.log('• Keep Railway dashboard open during deploys');

console.log('\n🚨 Emergency contacts prepared!');