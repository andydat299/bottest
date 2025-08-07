# 🚨 Railway Variables Không Load - Troubleshooting Guide

## 🔍 **Vấn đề hiện tại:**
Bot deploy trên Railway nhưng environment variables không được load, dẫn đến withdraw system không hoạt động.

## 🛠️ **Các bước khắc phục:**

### **1. 🔧 Verify Railway Variables:**

#### **Truy cập Railway Dashboard:**
```
1. Đăng nhập railway.app
2. Chọn project bot
3. Click vào service name  
4. Chọn tab "Variables" hoặc "Environment"
```

#### **Kiểm tra Variables cần thiết:**
```bash
# Core Variables (phải có)
DISCORD_TOKEN=your_actual_token
CLIENT_ID=your_actual_client_id
MONGO_URI=your_actual_mongo_uri
ADMIN_IDS=your_admin_user_ids

# Withdraw Variables (đang thiếu)
ADMIN_CHANNEL_ID=1234567890123456789
ADMIN_ROLE_ID=9876543210987654321
```

### **2. 📝 Thêm Variables đúng cách:**

#### **Format chính xác:**
- **Variable Name:** `ADMIN_CHANNEL_ID` (không có space, đúng case)
- **Variable Value:** `1402989033612640306` (chỉ số, không có quotes)

#### **Thêm từng variable:**
```
1. Click "New Variable"
2. Name: ADMIN_CHANNEL_ID
3. Value: 1402989033612640306
4. Click "Add"

5. Click "New Variable" 
6. Name: ADMIN_ROLE_ID
7. Value: 1400887885502087219
8. Click "Add"
```

### **3. 🔄 Force Restart Service:**

#### **Manual Deploy:**
```
1. Trong Railway Dashboard
2. Click tab "Deployments"
3. Click "Deploy" button
4. Wait 2-3 minutes
5. Check logs cho "Bot is ready!"
```

#### **Or Git Push:**
```bash
git add .
git commit -m "trigger redeploy"
git push origin main
```

### **4. 🧪 Verify Variables Loaded:**

#### **Run debug commands:**
```
/railway-check
/debug-withdraw  
```

#### **Check console logs:**
Bot logs sẽ hiển thị:
```
🚀 Railway Environment Check:
ADMIN_CHANNEL_ID: 1402989033612640306
ADMIN_ROLE_ID: 1400887885502087219
```

### **5. 🔍 Common Issues & Solutions:**

#### **Issue: Variables shows "undefined"**
**Cause:** Typo trong variable name
**Solution:** 
- Double-check spelling: `ADMIN_CHANNEL_ID` (không phải `ADMIN_CHANNEL_IDS`)
- Case sensitive: `ADMIN_CHANNEL_ID` (không phải `admin_channel_id`)

#### **Issue: Service không restart**
**Cause:** Railway caching old variables
**Solution:**
- Manual redeploy từ Dashboard
- Hoặc delete + re-add variables

#### **Issue: Variables load nhưng channel không accessible**
**Cause:** 
- Channel bị xóa
- Bot không có permission
- Wrong channel ID

**Solution:**
- Verify channel ID trong Discord (right-click → Copy ID)
- Check bot permissions trong channel
- Re-invite bot with proper permissions

### **6. 📱 Test Complete Workflow:**

#### **After fixing variables:**
```
1. /railway-check (verify variables loaded)
2. /debug-withdraw (test system)
3. /post-withdraw (deploy panel)
4. User test withdraw request
5. Admin should receive notification with QR button
```

## 🎯 **Expected Results:**

### **Before Fix:**
```
ADMIN_CHANNEL_ID: ❌ Chưa cấu hình
ADMIN_ROLE_ID: ❌ Chưa cấu hình
```

### **After Fix:**
```
ADMIN_CHANNEL_ID: ✅ 1402989033612640306
ADMIN_ROLE_ID: ✅ 1400887885502087219
Channel Check: ✅ Channel tìm thấy
```

## 🚀 **Advanced Debugging:**

### **Railway CLI (Optional):**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and check vars
railway login
railway variables

# View logs
railway logs
```

### **Manual Variable Check:**
Add này vào bot code để debug:
```javascript
console.log('All env vars:', Object.keys(process.env));
console.log('ADMIN vars:', Object.keys(process.env).filter(k => k.includes('ADMIN')));
```

---

**🎯 Priority Actions:**
1. ✅ Add `ADMIN_CHANNEL_ID=1402989033612640306` to Railway Variables
2. ✅ Add `ADMIN_ROLE_ID=1400887885502087219` to Railway Variables  
3. ✅ Manual redeploy service
4. ✅ Run `/railway-check` to verify
5. ✅ Test withdraw workflow

🚀 **Railway Deployment** should work perfectly after these steps!