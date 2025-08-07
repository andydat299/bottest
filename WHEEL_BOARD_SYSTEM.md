# 🎡 WHEEL OF FORTUNE - GAME BOARD SYSTEM

## 🎮 TỔNG QUAN HỆ THỐNG MỚI

Wheel of Fortune giờ đây hoạt động như blackjack với **Game Board System**:
- **Admin** post game board cho cả server
- **Users** click nút để tham gia và nhập cược qua modal
- **Tự động xử lý** mọi logic game

## 📋 LỆNH CHO ADMIN

### 🔧 Post Game Board:
```
/wheel post
```
**Chức năng:** Đăng bảng game wheel cho toàn server
**Quyền:** Chỉ admin (được định nghĩa trong `ADMIN_IDS`)

### 📊 Game Board Layout:
```
🎡 VÒNG QUAY MAY MẮN

🎰 Chào mừng đến với Wheel of Fortune!

🎯 Cách chơi:
• Nhấn nút 🎡 CHƠI NGAY để tham gia
• Nhập số xu cược (10-1000 xu)
• Vòng quay sẽ quyết định số phận của bạn!

🎊 7 ô may mắn:
💀 Phá sản - x0 (25%)
😢 Mất nửa - x0.5 (28%)
😐 Hòa vốn - x1 (25%)
😊 Thắng ít - x1.5 (15%)
🤑 Thắng lớn - x2.5 (5%)
💎 Siêu thắng - x5 (1.8%)
🎰 JACKPOT! - x10 (0.2%)

[🎡 CHƠI NGAY!] [📋 Luật chơi] [📊 Thống kê]
```

## 🎯 LỆNH CHO USERS

### 🎮 Tham gia game:
1. **Click nút "🎡 CHƠI NGAY!"** trên game board
2. **Modal sẽ hiện** để nhập số xu cược
3. **Nhập số xu** từ 10-1000
4. **Game bắt đầu** tự động

### 📊 Xem thống kê cá nhân:
- **Click "📊 Thống kê"** trên game board
- **Hoặc dùng:** `/wheel stats`

### 📋 Xem luật chơi:
- **Click "📋 Luật chơi"** trên game board  
- **Hoặc dùng:** `/wheel info`

### 🎲 Chơi trực tiếp (không qua board):
```
/wheel play bet:100
```

## 🔄 QUY TRÌNH GAME

### 1. **User Flow:**
```
User clicks "🎡 CHƠI NGAY!" 
    ↓
Modal hiện ra để nhập cược
    ↓
User nhập số xu (10-1000)
    ↓
Game kiểm tra số dư
    ↓
Hiển thị wheel + nút QUAY
    ↓
User click "🎡 QUAY!"
    ↓
Animation 3 giây
    ↓
Hiển thị kết quả + cập nhật xu
```

### 2. **Security Checks:**
- ✅ Kiểm tra user có game đang chơi
- ✅ Validate số xu cược hợp lệ
- ✅ Kiểm tra số dư đủ không
- ✅ Timeout 60 giây auto-cancel
- ✅ Anti-spam protection

## 🎪 CÁC NÚT TƯƠNG TÁC

### 🎡 Game Board Buttons:
| Nút | Chức năng | Phản hồi |
|-----|-----------|----------|
| 🎡 CHƠI NGAY! | Bắt đầu game | Modal nhập cược |
| 📋 Luật chơi | Xem rules | Embed rules (ephemeral) |
| 📊 Thống kê | Xem stats cá nhân | Embed stats (ephemeral) |

### 🎮 In-Game Buttons:
| Nút | Chức năng | Phản hồi |
|-----|-----------|----------|
| 🎡 QUAY! | Bắt đầu spin | Animation + kết quả |
| ❌ Hủy | Cancel game | Hủy không mất xu |

## 💰 ECONOMY INTEGRATION

### 💸 Giao dịch tự động:
- **Trừ xu** ngay khi user nhấn QUAY
- **Cộng xu** theo kết quả (nếu thắng)
- **Logging đầy đủ** mọi giao dịch

### 📊 Stats tracking:
- `wheelGames` - Số lần chơi
- `wheelWinnings` - Tổng lời/lỗ
- Tích hợp với hệ thống stats hiện có

## 🛡️ BẢO MẬT & KIỂM SOÁT

### 🔒 Admin Controls:
- Chỉ admin post được game board
- Có thể post nhiều board ở nhiều channel
- Mỗi board hoạt động độc lập

### 🛡️ User Protection:
- 1 user chỉ chơi 1 game tại 1 thời điểm
- Timeout protection
- Comprehensive error handling
- Ephemeral responses cho privacy

## 🎯 ƯုĐIỂM HỆ THỐNG MỚI

### ✅ **So với hệ thống cũ:**
1. **UX tốt hơn:** Không cần ghi nhớ command
2. **Visual appeal:** Game board đẹp, thu hút
3. **Easy discovery:** User dễ tìm thấy game
4. **Admin friendly:** Admin control được nơi post game
5. **Scalable:** Có thể post ở nhiều server/channel

### 🎪 **Tương lai mở rộng:**
- 🎁 Daily free spins
- 🏆 Server leaderboards trên board
- 🎊 Event wheels với multiplier đặc biệt
- 💎 VIP wheels cho high rollers
- 🎨 Custom themes theo mùa/sự kiện

## 🚀 DEPLOYMENT

### ✅ Files đã được cập nhật:
- `commands/wheel.js` - Main wheel command
- `events/interactionCreate.js` - Handle buttons & modals
- `schemas/userSchema.js` - Wheel stats

### 🔧 Cách sử dụng:
1. **Deploy commands:** `node deploy-commands.js`
2. **Admin post board:** `/wheel post` 
3. **Users enjoy:** Click & play!

---

## 📝 EXAMPLE USAGE

### 👨‍💼 Admin posts:
```
Admin: /wheel post
Bot: [Posts beautiful game board with buttons]
```

### 👤 User interacts:
```
User: [Clicks "🎡 CHƠI NGAY!"]
Bot: [Shows modal "Nhập số xu cược"]
User: [Types "100"]
Bot: [Shows wheel + QUAY button]
User: [Clicks "🎡 QUAY!"]
Bot: [3-second animation → "🤑 Thắng lớn! +150 xu!"]
```

🎊 **Wheel of Fortune Game Board System ready to roll!** 🎡
