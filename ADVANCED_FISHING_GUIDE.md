# 🌟 Hệ Thống Câu Cá Nâng Cao - Advanced Fishing System

## 📋 Tổng Quan

Bot câu cá đã được nâng cấp với 4 hệ thống mới để tạo ra trải nghiệm câu cá phong phú và thú vị hơn:

1. **🌤️ Weather System** - Thời tiết ảnh hưởng câu cá
2. **🕐 Time-based Fishing** - Cá khác nhau theo giờ
3. **🗺️ Fishing Locations** - Nhiều địa điểm câu cá  
4. **🌟 Seasonal Events** - Event theo mùa

---

## 🌤️ Hệ Thống Thời Tiết (Weather System)

### Các Loại Thời Tiết:

| Thời Tiết | Emoji | Hiệu Ứng | Đặc Điểm | Cá Đặc Biệt |
|-----------|-------|-----------|----------|-------------|
| **Nắng** | ☀️ | Tỷ lệ câu ổn định | Thích hợp người mới | Cá Vàng Ánh Nắng, Cá Chép Hoàng Kim |
| **Mây** | ☁️ | Tỷ lệ câu +10% | Cân bằng tốt | Cá Mây Bạc |
| **Mưa** | 🌧️ | Tỷ lệ câu +30%, Cá hiếm +10%, EXP +10% | Tốt cho cá hiếm | Cá Mưa Ngọc Trai, Cá Sấm Sét |
| **Bão** | ⛈️ | Cá hiếm +20%, Giảm tỷ lệ câu -30%, EXP +50%, Xu +20% | Rủi ro cao, phần thưởng lớn | Cá Sấm Sét Điện, Rồng Bão Tố |
| **Sương Mù** | 🌫️ | Giảm tỷ lệ câu -10%, Cá hiếm +15%, EXP +30%, Xu +10% | Khó khăn nhưng có cá hiếm | Cá Ma Sương Mù, Linh Hồn Sương Trắng |
| **Gió** | 💨 | Tỷ lệ câu +20%, Cá hiếm +8%, EXP +10% | Tốt cho farm kinh nghiệm | Cá Bay Gió Xanh, Phượng Hoàng Gió |

### Thời Gian Trong Ngày:

| Thời Gian | Emoji | Giờ | Hiệu Ứng | Cá Đặc Biệt |
|-----------|-------|-----|-----------|-------------|
| **Bình Minh** | 🌅 | 5:00-7:00 | EXP +30%, Tỷ lệ câu +20%, Cá hiếm +10% | Cá Bình Minh Vàng, Thiên Thần Ánh Sáng |
| **Sáng** | 🌞 | 7:00-11:00 | EXP +10%, Tỷ lệ câu +10%, Cá hiếm +5% | Cá Sáng Trong |
| **Trưa** | ☀️ | 11:00-15:00 | Giảm tỷ lệ câu -20%, EXP -10% | Cá Ngủ Trưa |
| **Chiều** | 🌇 | 15:00-18:00 | Hiệu ứng cơ bản, Cá hiếm +3% | Cá Chiều Tím |
| **Hoàng Hôn** | 🌆 | 18:00-20:00 | EXP +20%, Tỷ lệ câu +15%, Cá hiếm +8% | Cá Đêm Xanh, Ma Cà Rồng Biển |
| **Đêm** | 🌙 | 20:00-5:00 | Cá hiếm +15%, EXP +50%, Xu +20% | Cá Ma Đêm, Quỷ Vương Biển Đêm |

### Lệnh Weather:
- `/weather current` - Xem thời tiết hiện tại
- `/weather forecast` - Dự báo 6 giờ tới
- `/weather guide` - Hướng dẫn chi tiết

---

## 🗺️ Hệ Thống Địa Điểm (Fishing Locations)

### 7 Địa Điểm Câu Cá:

| Địa Điểm | Emoji | Mở Khóa | Chi Phí | Hiệu Ứng | Cá Đặc Biệt |
|----------|-------|---------|---------|-----------|-------------|
| **Hồ Nước Ngọt** | 🏞️ | Cấp 1 | Miễn phí | Cơ bản | Cá Chép Vàng |
| **Sông Suối** | 🏔️ | Cấp 2 | Miễn phí | Tỷ lệ câu +10% | Cá Hồi Bạc |
| **Đại Dương** | 🌊 | Cấp 3 | 50 xu | Cá hiếm +5%, EXP +10% | Cá Mập Trắng |
| **Vùng Biển Sâu** | 🌌 | Cấp 5 | 100 xu | Cá hiếm +15%, Giảm tỷ lệ -10% | Quái Vật Biển Sâu |
| **Hồ Băng** | 🧊 | Cấp 4 | 75 xu | EXP +20%, Cá hiếm +8% | Cá Tuyết Tinh |
| **Hồ Núi Lửa** | 🌋 | Cấp 6 | 150 xu | Cá hiếm +20%, EXP +15% | Rồng Lửa |
| **Ao Sen Huyền Bí** | ✨ | Cấp 8 | 200 xu | Cá hiếm +25%, EXP +25% | Phượng Hoàng Thủy |

### Lệnh Location:
- `/location list` - Xem tất cả địa điểm
- `/location current` - Xem địa điểm hiện tại
- `/location travel <destination>` - Di chuyển đến địa điểm

---

## 🌟 Hệ Thống Sự Kiện (Seasonal Events)

### Sự Kiện Theo Mùa:

#### 🌸 Lễ Hội Mùa Xuân (Tháng 3-5)
- **Thời gian**: 7 ngày
- **Hiệu ứng**: Tỷ lệ câu +20%, Cá hiếm +15%, EXP +30%, Xu +10%
- **Cá đặc biệt**: Cá Hoa Anh Đào, Cá Xuân Tinh
- **Phần thưởng**: Title "🌸 Thần Câu Mùa Xuân"

#### 🏖️ Hè Nóng Bỏng (Tháng 6-8)
- **Thời gian**: 10 ngày
- **Hiệu ứng**: Cá hiếm +10%, EXP +20%, Xu +20%
- **Ưu tiên**: Đại Dương
- **Cá đặc biệt**: Cá Mặt Trời, Cá Rồng Hè
- **Phần thưởng**: Title "🏖️ Vua Câu Mùa Hè"

#### 🍂 Thu Hoạch (Tháng 9-11)
- **Thời gian**: 8 ngày
- **Hiệu ứng**: Tỷ lệ câu +10%, EXP +10%, Xu +40%
- **Đặc điểm**: Tập trung vào xu
- **Cá đặc biệt**: Cá Lá Vàng, Cá Rồng Thu
- **Phần thưởng**: Title "🍂 Thương Gia Mùa Thu"

#### ❄️ Phép Thuật Mùa Đông (Tháng 12-2)
- **Thời gian**: 12 ngày
- **Hiệu ứng**: Cá hiếm +25%, EXP +50%
- **Ưu tiên**: Hồ Băng
- **Cá đặc biệt**: Cá Tuyết Tinh, Rồng Băng Huyền Thoại
- **Phần thưởng**: Title "❄️ Pháp Sư Băng Giá"

### Sự Kiện Đặc Biệt:

#### 🧧 Tết Nguyên Đán
- **Kích hoạt**: Admin
- **Thời gian**: 15 ngày
- **Hiệu ứng**: Tỷ lệ câu +50%, Cá hiếm +20%, EXP x2, Xu x2
- **Cá đặc biệt**: Cá Chép Vàng Thần Tài (5000 xu), Rồng Vàng Phú Quý (8888 xu)
- **Phần thưởng**: Title "🧧 Thần Tài Câu Cá"

#### 🎃 Halloween Ma Quái
- **Kích hoạt**: Admin
- **Thời gian**: 3 ngày
- **Giới hạn**: Chỉ hoạt động vào đêm (8PM-6AM)
- **Hiệu ứng**: Giảm tỷ lệ câu -20%, Cá hiếm +30%, EXP +50%
- **Cá đặc biệt**: Cá Ma Đen (666 xu), Quái Vật Đáy Biển (1666 xu)
- **Phần thưởng**: Title "🎃 Ma Vương Câu Cá"

### Lệnh Events:
- `/events current` - Xem sự kiện đang diễn ra
- `/events upcoming` - Xem sự kiện sắp tới
- `/events list` - Xem tất cả sự kiện trong năm

### Lệnh Admin Events:
- `/eventadmin activate <event> [duration]` - Kích hoạt sự kiện đặc biệt
- `/eventadmin status` - Xem trạng thái events
- `/eventadmin deactivate <event>` - Tắt sự kiện (đang phát triển)

---

## 🎣 Tích Hợp Với Hệ Thống Câu Cá

### Cách Tính Toán Hiệu Ứng:

1. **Tỷ lệ câu cá**: Môi trường × Sự kiện × Địa điểm × Cần câu
2. **Cá hiếm**: Cộng dồn tất cả bonus từ các nguồn
3. **Kinh nghiệm**: Nhân các hệ số với nhau
4. **Xu**: Nhân các hệ số với nhau

### Thông Tin Hiển Thị:

Khi câu cá, bot sẽ hiển thị:
- 🌤️ Thời tiết và thời gian hiện tại
- 📍 Địa điểm đang câu
- 🌟 Sự kiện đang hoạt động (nếu có)
- ⚡ Tất cả hiệu ứng đang áp dụng
- 🎣 Kết quả với bonus được tính toán

### Ví Dụ Combo Mạnh:

**🌟 Combo Cá Hiếm Tối Đa:**
- ⛈️ Thời tiết Bão (+20% cá hiếm, có Rồng Bão Tố)
- 🌙 Đêm khuya (+15% cá hiếm, có Quỷ Vương Biển Đêm)
- ✨ Ao Sen Huyền Bí (+25% cá hiếm)
- ❄️ Event Mùa Đông (+25% cá hiếm)
- 🎣 Cần câu cấp cao

**💰 Combo Farm Xu:**
- ☀️ Thời tiết Nắng (ổn định)
- 🌊 Đại Dương (địa điểm tốt)
- 🍂 Event Thu Hoạch (+40% xu)
- � Đêm (+20% xu)

**🎣 Combo Cá Đặc Biệt:**
- 🌫️ Sương Mù (có Linh Hồn Sương Trắng)
- 🌅 Bình Minh (có Thiên Thần Ánh Sáng)
- 🧧 Event Tết (có Rồng Vàng Phú Quý)
- 🎃 Halloween đêm (có Quái Vật Đáy Biển)

---

## 📊 Cơ Chế Hoạt Động

### Thời Tiết:
- Thay đổi mỗi giờ dựa trên thuật toán
- 6 loại thời tiết với xác suất khác nhau
- Ảnh hưởng trực tiếp đến gameplay

### Thời Gian:
- Theo thời gian thực tế
- 6 khung giờ khác nhau trong ngày
- Mỗi khung có đặc điểm riêng

### Địa Điểm:
- Mở khóa theo cấp độ cần câu
- Chi phí di chuyển (trừ 2 địa điểm đầu)
- Cá đặc biệt riêng cho mỗi địa điểm

### Sự Kiện:
- Tự động kích hoạt theo mùa
- Admin có thể kích hoạt sự kiện đặc biệt
- Hiệu ứng cộng dồn với các hệ thống khác

---

## 🔧 Cài Đặt & Maintenance

### Database Updates:
- Schema `userSchema.js` đã được cập nhật với:
  - `currentFishingLocation`: Địa điểm hiện tại
  - `experience`: Kinh nghiệm người dùng

### Logging:
- Tất cả hoạt động đều được log với hệ thống logging hiện có
- Admin actions cho event management
- Fishing activities với environment effects

### Performance:
- Weather cache mỗi giờ
- Event cache để tránh tính toán lặp lại
- Location data được load một lần

---

## 🎯 Lộ Trình Phát Triển

### Đã Hoàn Thành:
- ✅ Weather System với 6 loại thời tiết và cá đặc biệt
- ✅ Time-based Fishing với 6 khung giờ và cá theo thời gian
- ✅ Fishing Locations với 7 địa điểm và cá độc quyền
- ✅ Seasonal Events với events tự động và đặc biệt
- ✅ Integration với Fish Command có hỗ trợ đầy đủ
- ✅ Admin Tools cho Events và Weather
- ✅ Hệ thống cá hiếm theo thời tiết và thời gian

### Tính Năng Có Thể Mở Rộng:
- 🔄 Thêm loại thời tiết mới
- 🗺️ Thêm địa điểm câu cá mới
- 🌟 Thêm sự kiện theo lễ hội
- 📈 Hệ thống Achievement cho events
- 🎣 Equipment system mở rộng
- 🌍 Weather API thực tế

---

**🎉 Hệ thống Advanced Fishing đã sẵn sàng để mang lại trải nghiệm câu cá phong phú và thú vị!**
