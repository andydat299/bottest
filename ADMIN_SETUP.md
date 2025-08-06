# Hướng dẫn cấu hình Admin Commands

## 🔧 Cấu hình môi trường

Thêm vào file `.env` của bạn:

```env
# Discord Bot Configuration
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_client_id_here
GUILD_ID=your_guild_id_here  # Optional: for guild-specific commands

# MongoDB Configuration
MONGO_URI=your_mongodb_connection_string

# Admin Configuration
ADMIN_IDS=user_id_1,user_id_2,user_id_3
```

### Cách lấy Discord User ID:

1. Bật Developer Mode trong Discord Settings > Advanced > Developer Mode
2. Click chuột phải vào user → Copy User ID
3. Thêm ID vào ADMIN_IDS, ngăn cách bằng dấu phẩy

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

### ℹ️ Trợ giúp:
- `/adminhelp` - Hiển thị danh sách lệnh admin

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
