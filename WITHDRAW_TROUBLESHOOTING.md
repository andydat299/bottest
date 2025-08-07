# 💰 Hướng Dẫn Setup Hệ Thống Withdraw

## 🚨 Vấn đề: Admin không nhận được thông báo withdraw

### 🔍 **Nguyên nhân có thể:**
1. **ADMIN_CHANNEL_ID chưa được cấu hình**
2. **Channel ID sai hoặc channel bị xóa**
3. **Bot không có quyền gửi message trong channel**
4. **File .env chưa được load đúng**

## 🛠️ **Các bước khắc phục:**

### **Bước 1: Kiểm tra cấu hình**
```bash
/debug-withdraw
```
Command này sẽ hiển thị:
- ✅/❌ Trạng thái cấu hình
- 📍 Channel ID hiện tại
- 🧪 Test gửi message

### **Bước 2: Cấu hình ADMIN_CHANNEL_ID**

#### **Tạo Admin Channel:**
1. Tạo text channel mới: `#withdraw-admin` 
2. Set permissions cho channel:
   - 👥 **Admin/Staff**: View Channel, Send Messages
   - 🤖 **Bot**: View Channel, Send Messages, Embed Links
   - 👤 **Everyone**: Deny All

#### **Lấy Channel ID:**
1. **Bật Developer Mode:** Discord Settings → Advanced → Developer Mode
2. **Copy ID:** Right-click channel → Copy Channel ID
3. **Ví dụ:** `1234567890123456789`

#### **Cấu hình Environment:**

**🌐 Railway/Heroku:**
```
ADMIN_CHANNEL_ID=1234567890123456789
ADMIN_ROLE_ID=9876543210987654321
```

**💻 Local (.env file):**
```bash
ADMIN_CHANNEL_ID=1234567890123456789
ADMIN_ROLE_ID=9876543210987654321
```

### **Bước 3: Restart Bot**
- 🌐 **Railway:** Redeploy service
- 💻 **Local:** `npm start` hoặc `node index.js`

### **Bước 4: Test Hệ Thống**
1. **Debug:** `/debug-withdraw` (kiểm tra cấu hình)
2. **Post Panel:** `/post-withdraw` (đăng panel withdraw)
3. **Test Withdraw:** User click "💰 ĐỔI TIỀN NGAY"

## 🔧 **Troubleshooting**

### **Lỗi: Channel không tìm thấy**
```
❌ Admin channel not found with ID: 123...
```
**Giải pháp:**
- Kiểm tra Channel ID có đúng không
- Channel có bị xóa không
- Bot có trong server không

### **Lỗi: Không có quyền gửi message**
```
❌ Missing Permissions
```
**Giải pháp:**
- Check bot role permissions
- Channel permissions cho bot
- Bot có higher role không

### **Lỗi: Environment variable không load**
```
❌ ADMIN_CHANNEL_ID not configured
```
**Giải pháp:**
- Kiểm tra file .env tồn tại
- Restart bot sau khi thay đổi .env
- Kiểm tra syntax .env file

## 📊 **Kiểm tra Log**

Khi user submit withdraw request, console sẽ show:
```
🔔 Sending admin notification for withdraw request: 64f...
📍 Admin Channel ID from env: 1234567890123456789
🔍 Admin Channel found: true
📤 Sending message to admin channel...
✅ Admin notification sent successfully, message ID: 1234...
```

Nếu có lỗi sẽ show:
```
❌ ADMIN_CHANNEL_ID not configured in environment variables
❌ Admin channel not found with ID: 1234...
❌ Error sending admin notification: [Error details]
```

## 🎯 **Workflow Đúng**

```
1. User: Click "💰 ĐỔI TIỀN NGAY"
   ↓
2. Modal: Điền thông tin withdraw
   ↓  
3. Bot: Validate & tạo request
   ↓
4. Bot: Trừ xu tạm thời
   ↓
5. Bot: Send notification → Admin Channel
   ↓
6. Admin: Nhận thông báo với buttons
   ↓
7. Admin: Click ✅ Duyệt / ❌ Từ chối
   ↓
8. Bot: DM user kết quả
```

## 🆘 **Liên hệ hỗ trợ**

Nếu sau khi làm theo hướng dẫn mà vẫn không hoạt động:

1. **Chạy `/debug-withdraw`** và chụp ảnh kết quả
2. **Check console logs** khi user submit withdraw
3. **Verify bot permissions** trong admin channel
4. **Double-check .env file** có đúng format không

---

🎣 **MiniGame Bot Withdraw System** - Admin Support Guide