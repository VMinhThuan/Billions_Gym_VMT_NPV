# API Documentation - Chức năng AI Tư vấn Dinh dưỡng và Tạo Thực đơn

## Mô tả tổng quan

Hệ thống AI tư vấn dinh dưỡng giúp hội viên nhận được gợi ý dinh dưỡng và thực đơn cá nhân hóa dựa trên:
- Mục tiêu fitness (tăng cân, giảm cân, tăng cơ bắp...)
- Hoạt động tập luyện hiện tại
- Thông tin cơ thể (chiều cao, cân nặng, BMI...)
- Lịch sử tập luyện và tiến độ

---

## 1. API Gợi ý Dinh dưỡng

### 1.1 Tạo gợi ý dinh dưỡng AI
```http
POST /api/dinhduong/goi-y
Authorization: Bearer <token>
Content-Type: application/json

{
  "maHoiVien": "63f123...",
  "mucTieu": "TANG_CO_BAP",
  "thongTinThem": {
    "canNang": 70,
    "chieuCao": 175,
    "hoatDong": "HOAT_DONG_VUA"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tạo gợi ý dinh dưỡng thành công",
  "data": {
    "_id": "63f789...",
    "hoiVien": "63f123...",
    "ngayGoiY": "2024-01-15T10:00:00.000Z",
    "mucTieuDinhDuong": {
      "mucTieuChinh": "TANG_CO_BAP",
      "caloMucTieu": 2800,
      "tiLeMacro": {
        "protein": 30,
        "carb": 40,
        "fat": 30
      }
    },
    "goiYAI": {
      "tieuDe": "Gợi ý dinh dưỡng tăng cơ bắp",
      "noiDungGoiY": "Chế độ dinh dưỡng tập trung vào protein chất lượng cao...",
      "cacThucPhamNenAn": ["Ức gà", "Cá hồi", "Trứng", "Yến mạch"],
      "cacThucPhamNenTranh": ["Đồ chiên rán", "Đồ ngọt"],
      "thoidDiemAnUong": [
        "Ăn protein trong vòng 30 phút sau tập",
        "Chia nhỏ 5-6 bữa trong ngày"
      ],
      "boSungCanThiet": ["Whey protein", "Creatine"],
      "luuYDacBiet": ["Tăng lượng carb vào những ngày tập nặng"]
    },
    "phanTichTapLuyen": {
      "tanSuatTap": 4,
      "nhomCoTapChinh": ["Ngực", "Vai", "Tay"],
      "doKhoTap": "TRUNG_BINH",
      "caloTieuHao": 350
    }
  },
  "thongTinThem": {
    "nhuCauCalories": 2800,
    "proteinGram": 210,
    "carbGram": 280,
    "fatGram": 93
  }
}
```

### 1.2 Lấy danh sách gợi ý của hội viên
```http
GET /api/dinhduong/goi-y/:maHoiVien?limit=10&page=1&loaiGoiY=DINH_DUONG_TONG_QUAT
Authorization: Bearer <token>
```

### 1.3 Lấy chi tiết gợi ý
```http
GET /api/dinhduong/goi-y/chi-tiet/:goiYId
Authorization: Bearer <token>
```

### 1.4 Cập nhật phản hồi gợi ý
```http
PUT /api/dinhduong/goi-y/:goiYId/phan-hoi
Authorization: Bearer <token>
Content-Type: application/json

{
  "danhGia": 5,
  "phanHoi": "Gợi ý rất hữu ích và phù hợp",
  "trangThai": "DANG_AP_DUNG"
}
```

---

## 2. API Thực đơn

### 2.1 Tạo thực đơn tự động
```http
POST /api/dinhduong/thuc-don
Authorization: Bearer <token>
Content-Type: application/json

{
  "maHoiVien": "63f123...",
  "mucTieu": "TANG_CO_BAP",
  "loaiThucDon": "TUAN"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tạo thực đơn tuần thành công",
  "data": {
    "_id": "63f890...",
    "hoiVien": "63f123...",
    "ngayBatDau": "2024-01-15T00:00:00.000Z",
    "ngayKetThuc": "2024-01-22T00:00:00.000Z",
    "loaiThucDon": "TUAN",
    "mucTieuDinhDuong": {
      "mucTieuChinh": "TANG_CO_BAP",
      "caloriesNgay": 2800,
      "proteinNgay": 210,
      "carbNgay": 280,
      "fatNgay": 93
    },
    "thucDonChiTiet": [
      {
        "ngay": "2024-01-15T00:00:00.000Z",
        "buaSang": [
          {
            "tenMonAn": "Yến mạch với trứng và chuối",
            "thongTinDinhDuong": {
              "calories": 350,
              "protein": 15,
              "carbohydrate": 45,
              "fat": 12
            },
            "danhSachNguyenLieu": [
              {
                "tenNguyenLieu": "Yến mạch",
                "soLuong": 50,
                "donVi": "gram"
              }
            ],
            "congThucNauAn": "Nấu yến mạch với nước, chiên trứng, thái chuối"
          }
        ],
        "buaTrua": [...],
        "buaChieu": [...],
        "buaToi": [...],
        "tongCalories": 2800,
        "tongProtein": 210,
        "tongCarb": 280,
        "tongFat": 93
      }
    ],
    "goiYTuAI": {
      "lyDoGoiY": "Thực đơn được tạo tự động cho mục tiêu TANG_CO_BAP",
      "danhGiaPhuhop": 8
    }
  }
}
```

### 2.2 Lấy danh sách thực đơn của hội viên
```http
GET /api/dinhduong/thuc-don/:maHoiVien?trangThai=DANG_SU_DUNG&limit=10&page=1
Authorization: Bearer <token>
```

### 2.3 Lấy chi tiết thực đơn
```http
GET /api/dinhduong/thuc-don/chi-tiet/:thucDonId
Authorization: Bearer <token>
```

### 2.4 Cập nhật đánh giá thực đơn
```http
PUT /api/dinhduong/thuc-don/:thucDonId/danh-gia
Authorization: Bearer <token>
Content-Type: application/json

{
  "danhGiaHaiLong": 5,
  "phanHoi": "Thực đơn phù hợp và dễ thực hiện",
  "trangThai": "DA_HOAN_THANH"
}
```

---

## 3. API Phân tích và Tính toán

### 3.1 Phân tích hoạt động tập luyện
```http
GET /api/dinhduong/phan-tich/:maHoiVien
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Phân tích hoạt động tập luyện thành công",
  "data": {
    "tanSuatTap": 4,
    "thoiGianTap": 240,
    "nhomCoTapChinh": ["Ngực", "Vai", "Tay"],
    "doKhoTap": "TRUNG_BINH",
    "caloTieuHao": 350,
    "ngayTapGanNhat": "2024-01-14T10:00:00.000Z"
  }
}
```

### 3.2 Tính nhu cầu calories
```http
POST /api/dinhduong/tinh-calories
Authorization: Bearer <token>
Content-Type: application/json

{
  "canNang": 70,
  "chieuCao": 175,
  "tuoi": 25,
  "gioiTinh": "NAM",
  "hoatDong": "HOAT_DONG_VUA",
  "mucTieu": "TANG_CO_BAP"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tính nhu cầu calories thành công",
  "data": {
    "nhuCauCalories": 2800,
    "tiLeMacro": {
      "protein": 30,
      "carb": 40,
      "fat": 30
    },
    "macroGram": {
      "protein": 210,
      "carb": 280,
      "fat": 93
    },
    "ghiChu": "Dựa trên mục tiêu TANG_CO_BAP và mức hoạt động HOAT_DONG_VUA"
  }
}
```

---

## 4. Tham số và Enum

### Mục tiêu dinh dưỡng (mucTieu):
- `TANG_CAN` - Tăng cân
- `GIAM_CAN` - Giảm cân  
- `DUY_TRI` - Duy trì
- `TANG_CO_BAP` - Tăng cơ bắp
- `GIAM_MO` - Giảm mỡ

### Mức hoạt động (hoatDong):
- `IT_HOAT_DONG` - Ít hoạt động (1.2x BMR)
- `HOAT_DONG_NHE` - Hoạt động nhẹ (1.375x BMR)
- `HOAT_DONG_VUA` - Hoạt động vừa (1.55x BMR)
- `HOAT_DONG_MANH` - Hoạt động mạnh (1.725x BMR)

### Loại thực đơn (loaiThucDon):
- `TUAN` - Thực đơn 7 ngày
- `THANG` - Thực đơn 30 ngày

### Trạng thái gợi ý (trangThai):
- `MOI` - Mới tạo
- `DA_XEM` - Đã xem
- `DANG_AP_DUNG` - Đang áp dụng
- `DA_HOAN_THANH` - Đã hoàn thành

---

## 5. Workflow Sử dụng

### Cho Hội viên:
1. **Phân tích hoạt động** → `GET /api/dinhduong/phan-tich/:maHoiVien`
2. **Tạo gợi ý dinh dưỡng** → `POST /api/dinhduong/goi-y`
3. **Xem gợi ý** → `GET /api/dinhduong/goi-y/:maHoiVien`
4. **Tạo thực đơn** → `POST /api/dinhduong/thuc-don`
5. **Theo dõi thực đơn** → `GET /api/dinhduong/thuc-don/:maHoiVien`
6. **Đánh giá và phản hồi** → `PUT /api/dinhduong/thuc-don/:thucDonId/danh-gia`

### Cho PT/Admin:
- Có thể xem và hỗ trợ tư vấn thêm dựa trên gợi ý AI
- Điều chỉnh thực đơn theo nhu cầu cá nhân
- Theo dõi hiệu quả và feedback từ hội viên

---

## 6. Lưu ý Kỹ thuật

### AI Logic:
- Sử dụng công thức Harris-Benedict để tính BMR
- Phân tích lịch sử tập luyện 7 ngày gần nhất
- Tự động điều chỉnh macro theo mục tiêu và hoạt động
- Database thực phẩm Việt Nam với thông tin dinh dưỡng chính xác

### Tương thích:
- Model DinhDuong mở rộng tương thích với code cũ
- Giữ các field cơ bản `buaAn` và `luongCalo`
- Thêm các field mới cho AI mà không ảnh hưởng chức năng hiện tại

### Performance:
- Pagination cho danh sách dài
- Cache gợi ý để tránh tính toán lại không cần thiết
- Async/await cho tất cả database operations
