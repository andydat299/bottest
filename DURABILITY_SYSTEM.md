# 🔧 Hệ thống độ bền cần câu

## 📋 Tổng quan

Hệ thống độ bền cần câu là một tính năng mới giúp tăng tính thực tế và thách thức cho game câu cá. Cần câu sẽ dần hư hỏng theo thời gian sử dụng và cần được sửa chữa.

## 🎣 Cơ chế hoạt động

### Độ bền cần câu:
- **Độ bền tối đa**: Tăng theo rod level (100 + (level-1) × 20)
  - Rod Level 1: 100 độ bền
  - Rod Level 2: 120 độ bền  
  - Rod Level 3: 140 độ bền
  - Rod Level 10: 280 độ bền

### Hao mòn:
- **Mỗi lần câu cá**: Mất 2-9 độ bền (ngẫu nhiên)
- **Câu hụt**: Hao mòn tăng 50%
- **Rod cao cấp**: Hao mòn ít hơn

### Ảnh hưởng đến hiệu suất:
- **Độ bền 80-100%**: 🟢 Hiệu suất tối đa
- **Độ bền 60-79%**: 🟡 Tỷ lệ hụt tăng nhẹ
- **Độ bền 40-59%**: 🟠 Tỷ lệ hụt tăng vừa
- **Độ bền 20-39%**: 🔴 Tỷ lệ hụt tăng nhiều
- **Độ bền 1-19%**: 💀 Sắp hỏng, tỷ lệ hụt rất cao
- **Độ bền 0%**: 💥 Không thể câu cá

## 🔧 Sửa chữa cần câu

### Lệnh: `/repair`

### Các loại sửa chữa:
1. **Hoàn toàn (100%)**: Sửa về độ bền tối đa
2. **Một phần (50%)**: Phục hồi 50% độ bền tối đa  
3. **Tối thiểu (25%)**: Phục hồi 25% độ bền tối đa

### Chi phí sửa chữa:
- **Phụ thuộc**: Rod level và % hư hỏng
- **Công thức**: (Rod Level × 50) × % hư hỏng
- **Ví dụ**: Rod Level 5 bị hỏng 50% = 5 × 50 × 0.5 = 125 xu

## 📊 Hiển thị thông tin

### Trong profile:
```
🎣 Thông tin cần câu
• Cấp cần: 3
• Độ bền: 🟡 95/140 (68%)
• Trạng thái: Tốt
```

### Khi câu cá:
```
🎣 Nhấn 3 lần để câu cá!
🆓 Miễn phí (2 lần còn lại)
🟢 Độ bền: 140/140 (100%)
⏰ Cooldown: 20 giây
```

### Khi hư hỏng:
```
🌊 Nước động quá mạnh, câu hụt!

📊 Tỷ lệ câu hụt: 25.0%
🔧 Độ bền giảm: 8
⚠️ Cảnh báo: Cần câu sắp hỏng!
```

## 🎮 Chiến lược chơi

### Quản lý độ bền:
1. **Theo dõi** độ bền thường xuyên qua `/profile`
2. **Sửa chữa** khi độ bền < 60% để duy trì hiệu suất
3. **Tiết kiệm** bằng cách sửa chữa từng phần
4. **Nâng cấp** rod để có độ bền cao hơn

### Tips:
- Rod cao cấp hư ít hơn
- Câu hụt làm hư nhanh hơn
- Sửa chữa hoàn toàn khi có nhiều xu
- Sửa chữa tối thiểu khi ít xu

## 🆕 Tính năng mới

### Đã thêm:
- ✅ Hệ thống độ bền cần câu
- ✅ Lệnh `/repair` với 3 tùy chọn
- ✅ Hiển thị độ bền trong profile và câu cá
- ✅ Ảnh hưởng độ bền đến tỷ lệ thành công
- ✅ Reset độ bền khi nâng cấp rod
- ✅ Cảnh báo khi sắp hỏng/đã hỏng

### Cân bằng game:
- Tăng tính thực tế
- Tạo thêm mục tiêu chi tiêu
- Khuyến khích nâng cấp rod
- Tăng tính chiến lược trong quản lý tài nguyên
