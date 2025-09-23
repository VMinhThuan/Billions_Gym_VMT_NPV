# API Dự báo Thời gian và Phương pháp Tập luyện

## Tổng quan
API này cung cấp các chức năng dự báo thời gian tập luyện tối ưu và gợi ý phương pháp tập luyện hiệu quả dựa trên lịch sử tập luyện và mục tiêu của hội viên.

## Base URL
```
/api/workout-prediction
```

## Authentication
Tất cả các endpoint đều yêu cầu xác thực thông qua Bearer token.

## Endpoints

### 1. Dự báo thời gian và phương pháp tập luyện

**POST** `/du-bao-thoi-gian-va-phuong-phap`

Dự báo thời gian tập luyện tối ưu và gợi ý phương pháp tập luyện dựa trên mục tiêu và tần suất tập.

#### Request Body
```json
{
  "hoiVienId": "string (required)",
  "mucTieu": "string (required)",
  "soBuoiTapTuan": "number (required)"
}
```

#### Mục tiêu hợp lệ
- `GIAM_CAN`: Giảm cân
- `TANG_CO_BAP`: Tăng cơ bắp
- `TANG_CAN`: Tăng cân
- `DUY_TRI`: Duy trì sức khỏe

#### Response
```json
{
  "success": true,
  "message": "Dự báo thời gian và phương pháp tập luyện thành công",
  "data": {
    "thoiGianToiUu": {
      "thoiGianToiUu": 75,
      "thoiGianToiThieu": 60,
      "thoiGianToiDa": 90,
      "lyDo": [
        "Thời gian này giúp đốt cháy calories hiệu quả",
        "Tăng thời gian để duy trì xu hướng tích cực"
      ]
    },
    "duBaoTienDo": {
      "duBaoTuan": 3.5,
      "caloTieuHaoDuBao": 2100,
      "thoiGianDatMucTieu": {
        "tuan": 12,
        "thang": 3.0,
        "ngay": 84
      },
      "khaNangThanhCong": 85
    },
    "phuongPhapTap": {
      "phuongPhapChinh": "Cardio + HIIT + Tập tạ nhẹ",
      "baiTapGopY": [
        "Chạy bộ 20-30 phút",
        "HIIT 15-20 phút",
        "Squat, Lunges, Push-ups",
        "Plank, Mountain Climbers"
      ],
      "lichTapGopY": {
        "T2": "Upper Body + Cardio",
        "T5": "Lower Body + Cardio"
      },
      "luuY": [
        "Tăng dần cường độ tập để tránh chấn thương",
        "Tập trung vào nhóm cơ: Ngực, Lưng, Chân"
      ],
      "thoiDiemTap": "Sáng sớm hoặc chiều tối",
      "cheDoNghi": "Nghỉ 1-2 ngày/tuần"
    },
    "phanTichLichSu": {
      "soBuoiTap": 15,
      "thoiGianTrungBinh": 65,
      "caloTieuHaoTrungBinh": 320,
      "tanSuatTap": 3.2,
      "xuHuong": "tang_truong",
      "nhomCoTapChinh": ["Ngực", "Lưng", "Chân"],
      "doKhoTap": "TRUNG_BINH"
    }
  }
}
```

### 2. Dự báo hiệu quả tập luyện

**POST** `/du-bao-hieu-qua`

Dự báo hiệu quả tập luyện dựa trên thời gian và tần suất tập.

#### Request Body
```json
{
  "hoiVienId": "string (required)",
  "thoiGianTap": "number (required)",
  "soBuoiTapTuan": "number (required)"
}
```

#### Response
```json
{
  "success": true,
  "message": "Dự báo hiệu quả tập luyện thành công",
  "data": {
    "caloTieuHaoDuKien": {
      "moiBuoi": 480,
      "moiTuan": 1920,
      "moiThang": 8314,
      "bmr": 1650
    },
    "ketQuaDuBao": {
      "giamCanDuKien": 0.8,
      "caiThienSucKhoe": {
        "timMach": "Cải thiện đáng kể",
        "coBap": "Tăng cường rõ rệt",
        "sucBen": "Tăng cường tốt",
        "linhHoat": "Cải thiện"
      },
      "mucDoHieuQua": "Hiệu quả cao"
    },
    "toiUuHoa": [
      "Tăng thời gian tập lên 45-60 phút để đạt hiệu quả tốt hơn",
      "Kết hợp tập tạ và cardio để đạt hiệu quả tối ưu",
      "Nghỉ ngơi đầy đủ giữa các buổi tập"
    ]
  }
}
```

### 3. Phân tích lịch sử tập luyện

**GET** `/phan-tich-lich-su/:hoiVienId`

Phân tích lịch sử tập luyện của hội viên trong 30 ngày gần nhất.

#### Response
```json
{
  "success": true,
  "message": "Phân tích lịch sử tập luyện thành công",
  "data": {
    "soBuoiTap": 15,
    "thoiGianTrungBinh": 65,
    "caloTieuHaoTrungBinh": 320,
    "tanSuatTap": 3.2,
    "xuHuong": "tang_truong",
    "nhomCoTapChinh": ["Ngực", "Lưng", "Chân"],
    "doKhoTap": "TRUNG_BINH"
  }
}
```

### 4. Lấy gợi ý phương pháp tập luyện

**GET** `/goi-y-phuong-phap?hoiVienId=:hoiVienId&mucTieu=:mucTieu`

Lấy gợi ý phương pháp tập luyện dựa trên mục tiêu.

#### Query Parameters
- `hoiVienId`: ID của hội viên
- `mucTieu`: Mục tiêu tập luyện (GIAM_CAN, TANG_CO_BAP, TANG_CAN, DUY_TRI)

#### Response
```json
{
  "success": true,
  "message": "Lấy gợi ý phương pháp tập luyện thành công",
  "data": {
    "phuongPhapChinh": "Cardio + HIIT + Tập tạ nhẹ",
    "baiTapGopY": [
      "Chạy bộ 20-30 phút",
      "HIIT 15-20 phút",
      "Squat, Lunges, Push-ups",
      "Plank, Mountain Climbers"
    ],
    "lichTapGopY": {
      "T2": "Upper Body + Cardio",
      "T5": "Lower Body + Cardio"
    },
    "luuY": [
      "Tăng dần cường độ tập để tránh chấn thương",
      "Tập trung vào nhóm cơ: Ngực, Lưng, Chân"
    ],
    "thoiDiemTap": "Sáng sớm hoặc chiều tối",
    "cheDoNghi": "Nghỉ 1-2 ngày/tuần"
  }
}
```

### 5. Tính thời gian tập luyện tối ưu

**POST** `/tinh-thoi-gian-toi-uu`

Tính toán thời gian tập luyện tối ưu dựa trên mục tiêu và tần suất.

#### Request Body
```json
{
  "hoiVienId": "string (required)",
  "mucTieu": "string (required)",
  "soBuoiTapTuan": "number (required)"
}
```

#### Response
```json
{
  "success": true,
  "message": "Tính thời gian tập luyện tối ưu thành công",
  "data": {
    "thoiGianToiUu": 75,
    "thoiGianToiThieu": 60,
    "thoiGianToiDa": 90,
    "lyDo": [
      "Thời gian này giúp đốt cháy calories hiệu quả",
      "Tăng thời gian để duy trì xu hướng tích cực"
    ]
  }
}
```

### 6. Dự báo tiến độ tập luyện

**POST** `/du-bao-tien-do`

Dự báo tiến độ tập luyện dựa trên lịch sử và mục tiêu.

#### Request Body
```json
{
  "hoiVienId": "string (required)",
  "mucTieu": "string (required)"
}
```

#### Response
```json
{
  "success": true,
  "message": "Dự báo tiến độ tập luyện thành công",
  "data": {
    "duBaoTuan": 3.5,
    "caloTieuHaoDuBao": 2100,
    "thoiGianDatMucTieu": {
      "tuan": 12,
      "thang": 3.0,
      "ngay": 84
    },
    "khaNangThanhCong": 85
  }
}
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Thiếu thông tin bắt buộc: hoiVienId, mucTieu, soBuoiTapTuan"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Lỗi server khi dự báo thời gian và phương pháp tập"
}
```

## Lưu ý

1. **Xác thực**: Tất cả các endpoint đều yêu cầu xác thực thông qua Bearer token.

2. **Validation**: 
   - `mucTieu` phải là một trong các giá trị hợp lệ
   - `soBuoiTapTuan` phải từ 1-7
   - `thoiGianTap` phải từ 15-180 phút

3. **Dữ liệu lịch sử**: Hệ thống phân tích lịch sử tập luyện trong 30 ngày gần nhất để đưa ra dự báo chính xác.

4. **Cá nhân hóa**: Tất cả các dự báo đều được cá nhân hóa dựa trên thông tin cá nhân và lịch sử tập luyện của từng hội viên.

5. **Cập nhật real-time**: Dữ liệu được cập nhật theo thời gian thực dựa trên lịch sử tập luyện mới nhất.
