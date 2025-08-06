# Hướng dẫn cấu hình Admin Commands

## ⚠️ LƯU Ý QUAN TRỌNG - ĐỌC TRƯỚC KHI CẤU HÌNH:

**� Trước khi chạy bot, BẮT BUỘC phải:**
1. ✅ Điền đầy đủ thông tin vào file `.env`
2. ✅ Thay thế tất cả `your_*_here` bằng giá trị thật
3. ✅ Bot token phải hợp lệ và bot đã được invite vào server
4. ✅ MongoDB URI phải connect được

**🚨 Nếu thông tin không đúng, bot sẽ không thể khởi động!**

## �🔧 Cấu hình môi trường

### 📝 Local Development (File `.env`)

**Tạo/chỉnh sửa file `.env` trong thư mục gốc:**

```env
# Discord Bot Configuration - THAY THẾ BẰNG THÔNG TIN THẬT
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_client_id_here
GUILD_ID=your_guild_id_here  # Optional: for guild-specific commands

# MongoDB Configuration - THAY THẾ BẰNG MONGODB URI THẬT
MONGO_URI=your_mongodb_connection_string

# Admin Configuration - THAY THẾ BẰNG DISCORD USER ID CỦA BẠN
ADMIN_IDS=your_discord_user_id_here

# Optional: Log Channel
LOG_CHANNEL_ID=your_log_channel_id
```

### 🚀 Railway Deployment

1. **Truy cập Railway Dashboard:**
   - Đăng nhập vào [Railway.app](https://railway.app)
   - Chọn project bot của bạn

2. **Cấu hình Environment Variables:**
   - Vào tab **"Variables"** hoặc **"Settings"**
   - Thêm từng biến một:

| Variable Name | Value Example | Mô tả |
|---------------|---------------|--------|
| `DISCORD_TOKEN` | `OTk...` | Token của bot Discord |
| `CLIENT_ID` | `123456789012345678` | Application ID của bot |
| `MONGO_URI` | `mongodb+srv://...` | Connection string MongoDB |
| `ADMIN_IDS` | `123456789012345678` | User ID Discord của admin |

3. **Lưu và Deploy:**
   - Railway sẽ tự động deploy lại bot
   - Đợi deployment hoàn thành

### 🔑 Cách lấy các thông tin cần thiết:

#### 1. Discord User ID (cho ADMIN_IDS):
1. Bật Developer Mode trong Discord Settings > Advanced > Developer Mode
2. Click chuột phải vào user → Copy User ID
3. Thêm ID vào ADMIN_IDS, ngăn cách bằng dấu phẩy

**Ví dụ:**
- 1 admin: `ADMIN_IDS=123456789012345678`
- Nhiều admin: `ADMIN_IDS=123456789012345678,987654321098765432`

#### 2. Bot Token và Client ID:
1. Truy cập [Discord Developer Portal](https://discord.com/developers/applications)
2. Chọn application của bot
3. **Bot Token:** Vào tab "Bot" → Copy Token
4. **Client ID:** Vào tab "General Information" → Copy Application ID

#### 3. MongoDB URI:
1. Tạo cluster MongoDB trên [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Lấy connection string từ "Connect" → "Connect your application"
3. **Ví dụ:** `mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority`

## 🛠️ Các lệnh Admin đã được thêm:

### 💰 Quản lý tiền:
- `/addmoney <user> <amount>` - Thêm tiền cho người dùng
- `/removemoney <user> <amount>` - Trừ tiền của người dùng  
- `/setmoney <user> <amount>` - Đặt số tiền của người dùng

### 👤 Quản lý người dùng:
- `/userinfo <user>` - Xem thông tin chi tiết người dùng
- `/resetuser <user> <type>` - Reset dữ liệu người dùng
  - `all` - Reset toàn bộ dữ liệu
  - `money` - Reset chỉ tiền
  - `fishing` - Reset cá và cấp cần
  - `stats` - Reset thống kê

### 📊 Thống kê:
- `/leaderboard <type> [limit]` - Xem bảng xếp hạng
  - `money` - Top người giàu nhất
  - `rod` - Top cấp cần cao nhất
  - `fish` - Top số cá nhiều nhất
  - `messages` - Top tin nhắn
  - `catches` - Top câu cá thành công

### ⚙️ Hệ thống & Commands:
- `/admin weather` - Quản lý hệ thống thời tiết
  - `enable/disable` - Bật/tắt thời tiết
  - `time-enable/time-disable` - Bật/tắt hệ thống thời gian
  - `update` - Cập nhật thời tiết ngay
  - `status` - Xem trạng thái thời tiết

- `/admin event` - Quản lý hệ thống sự kiện
  - `enable/disable` - Bật/tắt sự kiện
  - `activate` - Kích hoạt sự kiện đặc biệt
  - `status` - Xem trạng thái sự kiện

- `/admin command` - **MỚI! Quản lý lệnh**
  - `disable <command>` - Tắt lệnh cụ thể (sell, fish, upgrade, v.v.)
  - `enable <command>` - Bật lại lệnh đã tắt
  - `status` - Xem trạng thái tất cả lệnh
  - `reset` - Bật lại tất cả lệnh

- `/admin status` - Xem trạng thái tổng quan tất cả hệ thống

## 🎮 **MỚI! Hệ thống Command Control**

### 🔒 Tắt lệnh sell (ví dụ):
```
/admin command disable command:sell
```

### 🔓 Bật lại lệnh sell:
```
/admin command enable command:sell
```

### 📊 Xem trạng thái tất cả lệnh:
```
/admin command status
```

### 🔄 Bật lại tất cả lệnh:
```
/admin command reset
```

### 📋 **Lệnh có thể quản lý:**
- `sell` - Bán cá (để tắt economy)
- `fish` - Câu cá (maintenance mode)
- `upgrade` - Nâng cấp cần câu
- `repair` - Sửa chữa cần câu  
- `inventory` - Xem túi đồ
- `stats` - Thống kê cá
- `profile` - Hồ sơ người chơi
- `quests` - Hệ thống nhiệm vụ

### 💡 **Use Cases:**
- **Maintenance Mode:** Tắt `fish` khi bảo trì
- **Economy Control:** Tắt `sell` để ngăn người chơi bán cá
- **Event Management:** Tắt tạm thời một số lệnh trong sự kiện đặc biệt

## 🚀 Triển khai lệnh:

Sau khi thêm các file mới, chạy lệnh deploy để cập nhật slash commands:

```bash
node deploy-commands.js
```

hoặc deploy global:

```bash
node deploy-global.js
```

## 🔒 Bảo mật:

- Chỉ những user có ID trong `ADMIN_IDS` mới có thể sử dụng lệnh admin
- Tất cả lệnh admin đều có xác nhận trước khi thực hiện hành động nguy hiểm
- Lệnh `/resetuser` có button xác nhận để tránh xóa nhầm dữ liệu

## 📝 Ghi chú:

- Các lệnh admin không hiển thị cho user thường
- Lỗi sẽ được log trong console để debug
- Tất cả thao tác admin đều có timestamp và footer ghi nhận người thực hiện
