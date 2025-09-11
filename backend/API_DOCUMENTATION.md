# API Documentation - Hệ thống Quản lý Gym

## Tổng quan chức năng Hội viên đăng ký gói tập và tập luyện

Hệ thống này cung cấp các API để hội viên có thể:
1. Xem danh sách gói tập
2. Đăng ký gói tập
3. Quản lý lịch tập luyện
4. Thực hiện buổi tập
5. Theo dõi lịch sử tập luyện

## Base URL
```
http://localhost:4000/api
```

## Authentication
Hầu hết các endpoint yêu cầu authentication token trong header:
```
Authorization: Bearer <token>
```

## 1. API Gói Tập (GoiTap)

### 1.1 Lấy danh sách gói tập
```http
GET /api/goitap
```
**Response:**
```json
[
  {
    "_id": "63f123...",
    "tenGoiTap": "Gói tập cơ bản",
    "moTa": "Gói tập dành cho người mới bắt đầu",
    "donGia": 500000,
    "thoiHan": 30,
    "hinhAnhDaiDien": "url_hinh_anh",
    "kichHoat": true
  }
]
```

### 1.2 Lấy chi tiết gói tập
```http
GET /api/goitap/:id
```

## 2. API Đăng ký Gói Tập (ChiTietGoiTap)

### 2.1 Hội viên đăng ký gói tập
```http
POST /api/chitietgoitap/dangky
Authorization: Bearer <token>
Content-Type: application/json

{
  "maGoiTap": "63f123..."
}
```
**Response:**
```json
{
  "message": "Đăng ký gói tập thành công",
  "data": {
    "_id": "63f456...",
    "maHoiVien": "63f789...",
    "maGoiTap": "63f123...",
    "ngayDangKy": "2024-01-15T07:00:00.000Z",
    "ngayKetThuc": "2024-02-14T07:00:00.000Z",
    "trangThaiThanhToan": "CHUA_THANH_TOAN"
  }
}
```

### 2.2 Lấy danh sách đăng ký gói tập của hội viên
```http
GET /api/chitietgoitap/hoivien/:maHoiVien
Authorization: Bearer <token>
```

### 2.3 Cập nhật trạng thái thanh toán
```http
PUT /api/chitietgoitap/:id/thanhtoan
Authorization: Bearer <token>
Content-Type: application/json

{
  "trangThaiThanhToan": "DA_THANH_TOAN"
}
```

## 3. API Lịch Tập (LichTap)

### 3.1 Tạo lịch tập cho hội viên (PT/Admin)
```http
POST /api/lichtap
Authorization: Bearer <token>
Content-Type: application/json

{
  "hoiVien": "63f789...",
  "pt": "63fabc...",
  "ngayBatDau": "2024-01-15",
  "ngayKetThuc": "2024-02-14"
}
```

### 3.2 Lấy lịch tập của hội viên
```http
GET /api/lichtap/hoivien/:maHoiVien
Authorization: Bearer <token>
```

## 4. API Buổi Tập (BuoiTap)

### 4.1 Tạo buổi tập mới (PT/Admin)
```http
POST /api/buoitap
Authorization: Bearer <token>
Content-Type: application/json

{
  "ngayTap": "2024-01-16T09:00:00.000Z",
  "pt": "63fabc...",
  "ghiChu": "Tập ngực và tay"
}
```

### 4.2 Lấy danh sách buổi tập của hội viên
```http
GET /api/buoitap/hoivien/:maHoiVien?trangThai=CHUA_HOAN_THANH
Authorization: Bearer <token>
```

### 4.3 Lấy chi tiết buổi tập
```http
GET     
Authorization: Bearer <token>
```

### 4.4 Hội viên đánh dấu hoàn thành buổi tập
```http
PUT /api/buoitap/:id/hoanthanh
Authorization: Bearer <token>
```

### 4.5 Thêm bài tập vào buổi tập (PT/Admin)
```http
POST /api/buoitap/:buoiTapId/baitap
Authorization: Bearer <token>
Content-Type: application/json

{
  "maBaiTap": "63fdef...",
  "soLanLap": 12,
  "soSet": 3,
  "trongLuong": 20,
  "thoiGianNghi": 90,
  "ghiChu": "Tăng tạ theo khả năng"
}
```

### 4.6 Xóa bài tập khỏi buổi tập (PT/Admin)
```http
DELETE /api/buoitap/:buoiTapId/baitap/:baiTapId
Authorization: Bearer <token>
```

## 5. API Lịch Sử Tập (LichSuTap)

### 5.1 Hội viên ghi nhận lịch sử tập
```http
POST /api/lichsutap
Authorization: Bearer <token>
Content-Type: application/json

{
  "buoiTap": "63fghi...",
  "ketQua": "Hoàn thành tốt",
  "caloTieuHao": 350,
  "danhGia": 4
}
```

### 5.2 Lấy lịch sử tập của hội viên
```http
GET /api/lichsutap/hoivien/:maHoiVien?startDate=2024-01-01&endDate=2024-01-31&page=1&limit=10
Authorization: Bearer <token>
```

### 5.3 Xem thống kê tập luyện
```http
GET /api/lichsutap/thongke?startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer <token>
```
**Response:**
```json
{
  "tongQuan": {
    "tongSoBuoiTap": 15,
    "tongCaloTieuHao": 5250,
    "danhGiaTrungBinh": 4.2,
    "ngayTapGanNhat": "2024-01-30T10:00:00.000Z",
    "ngayTapDauTien": "2024-01-02T09:00:00.000Z"
  },
  "thongKeTheoThang": [
    {
      "_id": { "nam": 2024, "thang": 1 },
      "soBuoiTap": 15,
      "caloTieuHao": 5250
    }
  ]
}
```

## Workflow - Luồng sử dụng của Hội viên

### 1. Đăng ký gói tập
1. Hội viên xem danh sách gói tập: `GET /api/goitap`
2. Chọn và đăng ký gói tập: `POST /api/chitietgoitap/dangky`
3. Thanh toán (cập nhật bởi admin): `PUT /api/chitietgoitap/:id/thanhtoan`

### 2. Được tạo lịch tập
1. PT/Admin tạo lịch tập cho hội viên: `POST /api/lichtap`
2. Hội viên xem lịch tập của mình: `GET /api/lichtap/hoivien/:maHoiVien`

### 3. Thực hiện buổi tập
1. PT tạo buổi tập: `POST /api/buoitap`
2. PT thêm bài tập vào buổi tập: `POST /api/buoitap/:buoiTapId/baitap`
3. Hội viên xem buổi tập: `GET /api/buoitap/hoivien/:maHoiVien`
4. Hội viên hoàn thành buổi tập: `PUT /api/buoitap/:id/hoanthanh`
5. Hội viên ghi nhận lịch sử: `POST /api/lichsutap`

### 4. Theo dõi tiến độ
1. Hội viên xem lịch sử tập: `GET /api/lichsutap/hoivien/:maHoiVien`
2. Hội viên xem thống kê: `GET /api/lichsutap/thongke`

## Roles & Permissions

### HoiVien (Hội viên)
- Xem gói tập
- Đăng ký gói tập
- Xem lịch tập của mình
- Xem buổi tập của mình
- Đánh dấu hoàn thành buổi tập
- Ghi nhận lịch sử tập
- Xem thống kê cá nhân

### PT (Personal Trainer)
- Tất cả quyền của HoiVien
- Tạo và quản lý lịch tập
- Tạo và quản lý buổi tập
- Thêm/xóa bài tập trong buổi tập
- Xem thông tin tất cả hội viên

### OngChu (Admin)
- Tất cả quyền của PT
- Quản lý gói tập (CRUD)
- Quản lý đăng ký gói tập
- Cập nhật trạng thái thanh toán

## Error Responses

Tất cả API đều trả về error với format:
```json
{
  "message": "Mô tả lỗi",
  "error": "Chi tiết lỗi (nếu có)"
}
```

HTTP Status Codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error
