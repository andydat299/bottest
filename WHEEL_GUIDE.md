# 🎡 WHEEL OF FORTUNE - VÒNG QUAY MAY MẮN

## 📋 TỔNG QUAN
Wheel of Fortune là minigame mới nhất trong bot Discord của bạn! Người chơi có thể đặt cược và quay vòng may mắn để thử vận may với 7 ô khác nhau.

## 🎮 CÁCH CHƠI

### Lệnh cơ bản:
- **`/wheel play`** - Chơi vòng quay (sẽ hiện modal nhập xu)
- **`/wheel play bet:100`** - Chơi trực tiếp với 100 xu
- **`/wheel info`** - Xem thông tin và tỷ lệ các ô
- **`/wheel stats`** - Xem thống kê cá nhân

### Quy trình chơi:
1. Chọn số xu cược (10-1000 xu)
2. Nhấn nút **🎡 QUAY!** 
3. Vòng quay sẽ xoay trong 3 giây
4. Nhận xu theo kết quả

## 🎰 CÁC Ô TRONG VÒNG QUAY

| Ô | Tên | Hệ số | Tỷ lệ | Mô tả |
|---|-----|-------|-------|-------|
| 💀 | Phá sản | x0 | 25% | Mất toàn bộ tiền cược |
| 😢 | Mất nửa | x0.5 | 28% | Chỉ nhận lại một nửa |
| 😐 | Hòa vốn | x1 | 25% | Nhận lại đúng tiền cược |
| 😊 | Thắng ít | x1.5 | 15% | Thắng 50% tiền cược |
| 🤑 | Thắng lớn | x2.5 | 5% | Thắng 150% tiền cược |
| 💎 | Siêu thắng | x5 | 1.8% | Thắng 400% tiền cược |
| 🎰 | JACKPOT! | x10 | 0.2% | Thắng 900% tiền cược |

## 📊 THỐNG KÊ & LOGGING

### Thống kê cá nhân:
- Số lần chơi
- Tổng lời/lỗ
- Tỷ lệ thắng
- Số dư hiện tại

### Logging hệ thống:
- Ghi log mỗi khi đặt cược
- Ghi log khi thắng lớn (x5, x10)
- Theo dõi tổng tiền trong hệ thống

## 🛡️ BẢO MẬT & CÔNG BẰNG

### Anti-cheat:
- Chỉ 1 game/user tại 1 thời điểm
- Timeout 60 giây cho mỗi game
- Validation số xu trước khi chơi

### Random công bằng:
- Sử dụng Math.random() của JavaScript
- Kết quả được tính theo tỷ lệ đã định
- Không thể can thiệp sau khi bấm QUAY

## 🔧 CẤU HÌNH GAME

```javascript
const WHEEL_CONFIG = {
  minBet: 10,        // Cược tối thiểu
  maxBet: 1000,      // Cược tối đa
  sectors: [...],    // 7 ô với tỷ lệ khác nhau
}
```

### House Edge: ~15%
Tính toán: `0×25% + 0.5×28% + 1×25% + 1.5×15% + 2.5×5% + 5×1.8% + 10×0.2% = 0.85`

Nghĩa là người chơi trung bình sẽ nhận lại 85% tiền cược.

## 🎯 KINH NGHIỆM CHƠI

### Chiến lược:
- **Cược nhỏ**: An toàn, ít rủi ro
- **Cược lớn**: Rủi ro cao, thưởng lớn
- **Jackpot hunting**: Cực hiếm (0.2%) nhưng x10

### Lưu ý:
- Chơi có trách nhiệm
- Đặt giới hạn cho bản thân
- Đây là trò chơi may rủi

## 🚀 TRIỂN KHAI

### Files cần thiết:
- `commands/wheel.js` - Main command
- `schemas/userSchema.js` - Database schema (thêm wheelGames, wheelWinnings)
- `events/interactionCreate.js` - Handle modal & buttons

### Dependencies:
- Discord.js v14+
- Mongoose (MongoDB)
- Logging system

## 🎊 TÍNH NĂNG TƯƠNG LAI

### Có thể thêm:
- 🏆 Daily wheel spins (free)
- 🎁 Special events với multiplier cao hơn
- 🥇 Wheel leaderboard
- 🎪 Themed wheels (holidays, events)
- 💰 VIP wheels cho high rollers

---

**🎡 Chúc may mắn với Wheel of Fortune! 🍀**
