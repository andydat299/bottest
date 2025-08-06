# 📋 Hướng dẫn cấu hình Log System

## 🚀 Cài đặt Log Channel

### Bước 1: Tạo Log Channel
1. Tạo một text channel mới trong Discord server
2. Đặt tên: `bot-logs` hoặc `fishbot-logs`
3. Đảm bảo bot có quyền:
   - View Channel
   - Send Messages
   - Embed Links

### Bước 2: Lấy Channel ID
1. Bật Developer Mode trong Discord
   - User Settings > Advanced > Developer Mode
2. Right-click vào log channel
3. Chọn "Copy Channel ID"

### Bước 3: Cấu hình Environment Variable

#### 🌐 Railway Platform:
1. Vào Railway Dashboard
2. Chọn service của bot
3. Vào tab "Variables"
4. Thêm variable mới:
   - **Name:** `LOG_CHANNEL_ID`
   - **Value:** `[Channel ID vừa copy]`
5. Restart service

#### 💻 Local Development:
Thêm vào file `.env`:
```env
LOG_CHANNEL_ID=123456789012345678
```

## 📊 Tính năng Log được hỗ trợ

### 🎣 Fishing Logs
- ✅ Câu cá thành công (với thông tin cá)
- ❌ Câu cá hụt
- 📈 Thống kê theo độ hiếm của cá

### 👑 Admin Logs
- 💰 Thêm/bớt/set tiền cho user
- 👤 Xem thông tin user
- 🔄 Reset user data
- 🏆 Bảng xếp hạng

### ⬆️ Upgrade Logs
- 🎣 Nâng cấp cần câu
- 💸 Chi phí nâng cấp
- 📊 Level cũ → Level mới

### 📋 Quest Logs
- ✅ Hoàn thành nhiệm vụ
- 🎁 Phần thưởng nhận được
- 📝 Loại nhiệm vụ

### 🛠️ System Logs
- 🚀 Bot khởi động
- ❌ Lỗi hệ thống
- ⚠️ Cảnh báo

## 🎮 Lệnh Admin để quản lý Log

### `/logconfig`
- Xem cấu hình log hiện tại
- Kiểm tra trạng thái channel
- Chẩn đoán vấn đề

### `/testlog [type]`
- Test gửi log theo loại
- Các loại: `info`, `success`, `warn`, `error`
- Kiểm tra hoạt động của hệ thống

## 🎨 Định dạng Log Message

### Embed Colors:
- 🔵 **Info:** Blue (#3498db)
- 🟢 **Success:** Green (#2ecc71)
- 🟠 **Warning:** Orange (#f39c12)
- 🔴 **Error:** Red (#e74c3c)
- 🟦 **Fishing:** Turquoise (#1abc9c)
- 🟣 **Admin:** Purple (#9b59b6)
- 🟡 **Quest:** Yellow (#f1c40f)
- 🟠 **Upgrade:** Orange (#e67e22)

### Thông tin trong Log:
- 👤 **User:** Người thực hiện
- 💰 **Amount:** Số lượng (xu, cá...)
- 🐟 **Fish:** Thông tin cá (nếu có)
- 🎣 **Rod Level:** Cấp cần câu
- 📍 **Channel:** Kênh thực hiện
- 🔧 **Command:** Lệnh được sử dụng
- ⏰ **Timestamp:** Thời gian thực hiện

## 🔧 Troubleshooting

### Vấn đề: Log không xuất hiện
1. Kiểm tra `LOG_CHANNEL_ID` đã đúng chưa
2. Bot có quyền gửi message trong channel không
3. Channel có bị xóa không
4. Restart bot sau khi thay đổi config

### Vấn đề: Bot không có quyền
1. Kiểm tra role của bot
2. Đảm bảo có permissions:
   - Send Messages
   - Embed Links
   - View Channel

### Vấn đề: Channel ID sai
1. Dùng `/logconfig` để kiểm tra
2. Copy lại Channel ID
3. Update environment variable
4. Restart service

## 📈 Lợi ích của Log System

### 👨‍💼 Cho Admin:
- Theo dõi hoạt động user
- Phát hiện abuse/spam
- Thống kê sử dụng lệnh
- Debug vấn đề

### 📊 Cho Community:
- Minh bạch hoạt động admin
- Theo dõi achievement của members
- Thống kê cộng đồng
- Tạo engagement

### 🛡️ Cho Security:
- Audit trail đầy đủ
- Phát hiện hoạt động bất thường
- Backup thông tin quan trọng
- Compliance tracking

## 🎯 Best Practices

1. **Tạo riêng channel log** - Không mix với chat thường
2. **Giới hạn quyền xem** - Chỉ admin/staff
3. **Regular monitoring** - Kiểm tra log định kỳ
4. **Backup quan trọng** - Export log khi cần
5. **Privacy aware** - Không log thông tin sensitive

---

🎣 **FishBot Log System** - Theo dõi mọi hoạt động một cách chuyên nghiệp!
