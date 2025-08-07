# 🚀 Railway Configuration cho Withdraw System

## ✅ **Environment Variables cần thiết trên Railway:**

### 🔧 **Cách cấu hình trên Railway Dashboard:**

1. **Truy cập Railway Dashboard:**
   - Đăng nhập vào [railway.app](https://railway.app)
   - Chọn project bot của bạn

2. **Vào tab Variables:**
   - Click vào service của bot
   - Chọn tab **"Variables"** hoặc **"Environment"**

3. **Thêm các Variables sau:**

```bash
# Core Bot Configuration
DISCORD_TOKEN=your_actual_bot_token
CLIENT_ID=your_actual_client_id
GUILD_ID=your_actual_guild_id

# Database
MONGO_URI=your_actual_mongodb_uri

# Admin System
ADMIN_IDS=123456789012345678,987654321098765432

# Withdraw System (MỚI)
ADMIN_CHANNEL_ID=1234567890123456789
ADMIN_ROLE_ID=9876543210987654321

# Logging (Optional)
LOG_CHANNEL_ID=1111222233334444555
```

## 📋 **Chi tiết từng Variable:**

### **🔑 ADMIN_CHANNEL_ID:**
- **Mô tả:** Channel ID nơi admin nhận thông báo withdraw
- **Cách lấy:** 
  1. Tạo channel `#withdraw-admin` trong Discord
  2. Right-click → Copy Channel ID
  3. Paste vào Railway Variables

### **👑 ADMIN_ROLE_ID:**
- **Mô tả:** Role ID được ping khi có withdraw request
- **Cách lấy:**
  1. Type `\@AdminRole` trong Discord
  2. Copy ID từ output
  3. Paste vào Railway Variables

### **📊 LOG_CHANNEL_ID (Optional):**
- **Mô tả:** Channel ghi log các hoạt động
- **Cách lấy:** Tương tự như ADMIN_CHANNEL_ID

## 🎯 **Workflow cấu hình:**

```
1. Tạo channels trong Discord:
   - #withdraw-admin (cho admin notifications)
   - #bot-logs (optional, cho logging)

2. Copy Channel IDs:
   - Right-click channels → Copy ID

3. Cấu hình trên Railway:
   - Variables tab → Add new variables
   - ADMIN_CHANNEL_ID = [channel_id]
   - ADMIN_ROLE_ID = [role_id]

4. Deploy lại bot:
   - Railway tự động redeploy
   - Variables có hiệu lực ngay

5. Test hệ thống:
   - /debug-withdraw (check config)
   - /post-withdraw (đăng panel)
   - User test withdraw request
```

## ✨ **Ưu điểm sử dụng Railway Variables:**

### **🔒 Security:**
- Không lộ sensitive data trong code
- Variables được encrypt trên Railway
- Không commit secrets vào Git

### **🔄 Easy Management:**
- Thay đổi config không cần redeploy code
- Multiple environments (dev/prod)
- Team access control

### **⚡ Performance:**
- Bot start nhanh hơn
- Không cần load .env file
- Direct access qua process.env

## 🐛 **Troubleshooting:**

### **Variables không load:**
```bash
# Check trong Railway console logs:
console.log('ADMIN_CHANNEL_ID:', process.env.ADMIN_CHANNEL_ID);
```

### **Bot không thấy variables:**
1. Check Variables tab trong Railway
2. Restart service manually
3. Verify variable names chính xác

### **Permission issues:**
1. Bot có trong channel không
2. Bot có quyền Send Messages không
3. Channel ID có đúng không

## 🎮 **Commands để verify:**

```bash
# Check config
/debug-withdraw

# Test QR generation  
/test-qr bank:vietcombank account:123456789 name:"TEST USER" amount:100000

# Post withdraw panel
/post-withdraw channel:#withdraw-test
```

## 📱 **Mobile Testing:**

Sau khi cấu hình xong, test trên mobile để verify:
1. User submit withdraw request
2. Admin nhận notification với QR button
3. Click "📱 Tạo QR" → QR code hiển thị
4. Quét QR bằng banking app
5. Transfer thành công → Click "✅ Duyệt"

## 🎯 **Production Checklist:**

- ✅ Tất cả Variables đã được set trên Railway
- ✅ Channels được tạo và bot có permissions  
- ✅ Admin role được cấu hình đúng
- ✅ Test workflow hoàn chỉnh
- ✅ QR code generation hoạt động
- ✅ Banking apps có thể đọc QR

---

🚀 **Railway + Withdraw System** = Professional bot deployment! 💎