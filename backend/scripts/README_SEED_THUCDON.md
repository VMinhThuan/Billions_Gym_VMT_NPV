# Script Seed Dữ Liệu Thực Đơn

## Mô tả
Script này chèn dữ liệu thực đơn mẫu vào collection `ThucDon` trong MongoDB.

## Dữ liệu được tạo

### Món ăn mẫu (6 món):
1. **Gà nướng với cơm gạo lứt** - 450 kcal (Bữa trưa)
2. **Cá hồi nướng với rau củ** - 420 kcal (Bữa tối)
3. **Bát cơm thịt bò xào rau củ** - 420 kcal (Bữa trưa)
4. **Salad gà quinoa** - 380 kcal (Bữa trưa/phụ)
5. **Bát cháo yến mạch với trái cây** - 350 kcal (Bữa sáng)
6. **Trứng chiên rau củ** - 320 kcal (Bữa sáng)

### Thực đơn:
- **3 thực đơn tuần** (mỗi tuần 7 ngày)
- **4 bữa/ngày**: Sáng, Trưa, Chiều (phụ), Tối
- **Tổng: 84 bữa ăn** (3 tuần × 7 ngày × 4 bữa)

### Thông tin chi tiết mỗi món:
- Tên món ăn
- Mô tả
- Hình ảnh
- Công thức nấu ăn
- Loại món ăn (SANG, TRUA, CHIEU, TOI, PHU)
- Thời gian nấu
- Danh sách nguyên liệu (với số lượng và đơn vị)
- Thông tin dinh dưỡng đầy đủ:
  - Calories, Protein, Carbohydrate, Fat
  - Fiber, Đường, Natri
  - Canxi, Sắt, Vitamin C, Vitamin D
- Đánh giá (1-5 sao)
- Mức độ khó (DE, TRUNG_BINH, KHO)

## Cách chạy

### 1. Đảm bảo MongoDB đang chạy và đã cấu hình `.env`:
```env
MONGODB_URI=mongodb://localhost:27017/your_database
```

### 2. Chạy script:
```bash
cd backend
node scripts/seedThucDon.js
```

### 3. Kết quả mong đợi:
```
✓ Đã kết nối MongoDB
✓ Đã xóa dữ liệu thực đơn cũ
✓ Đã tạo 3 thực đơn mẫu

📋 Thống kê:
   - Số thực đơn: 3
   - Số món ăn khác nhau: 6
   - Tổng số bữa ăn: 84

✅ Hoàn tất! Dữ liệu đã được chèn vào database.

✓ Đã đóng kết nối MongoDB
```

## Kiểm tra dữ liệu

### Sử dụng API:
```bash
# Lấy danh sách bữa ăn lành mạnh
curl http://localhost:4000/api/thucdon/healthy-meals?limit=10

# Với userId cụ thể
curl http://localhost:4000/api/thucdon/healthy-meals?hoiVienId=USER_ID&limit=5
```

### Sử dụng MongoDB Compass hoặc CLI:
```javascript
// Xem tất cả thực đơn
db.ThucDon.find()

// Đếm số thực đơn
db.ThucDon.countDocuments()

// Xem chi tiết một thực đơn
db.ThucDon.findOne()
```

## Lưu ý
- Script sẽ **XÓA TẤT CẢ** dữ liệu cũ trong collection `ThucDon` trước khi chèn dữ liệu mới
- Nếu không tìm thấy hội viên nào, script vẫn tạo thực đơn mẫu với ID ngẫu nhiên
- Dữ liệu được tạo với trạng thái `DANG_SU_DUNG`
- Mỗi thực đơn có thông tin AI gợi ý và hoạt động tập luyện

## Tích hợp với Frontend
Sau khi seed dữ liệu, frontend sẽ tự động hiển thị các món ăn này trong section "Bữa ăn lành mạnh" trên HomeScreen.
