# 📊 Cấu Trúc Hội Viên (Member) - Phân Tích Backend

## 🎯 TỔNG QUAN

**Hội Viên (HoiVien)** là entity chính trong hệ thống Billions Fitness & Gym, được kế thừa từ **Người Dùng (NguoiDung)** sử dụng **MongoDB Discriminator Pattern**.

---

## 📋 1. BẢNG NGUỒN: `NguoiDung` (Base User)

### Thuộc tính chung của tất cả users:
```javascript
{
    soCCCD: String (unique)          // Số căn cước công dân
    hoTen: String (required)          // Họ tên
    ngaySinh: Date                    // Ngày sinh
    diaChi: String                    // Địa chỉ
    gioiTinh: String (required)      // Giới tính
    anhDaiDien: String                // Ảnh đại diện URL
    email: String (unique, sparse)   // Email
    sdt: String (unique, required)    // Số điện thoại
    vaiTro: String                    // Phân biệt role (HoiVien, PT, OngChu)
}
```

### Discriminator Pattern:
- **NguoiDung**: Base model
- **HoiVien** (Member): Discriminator → Kế thừa từ NguoiDung
- **PT** (Trainer): Discriminator → Kế thừa từ NguoiDung
- **OngChu** (Owner): Discriminator → Kế thừa từ NguoiDung

---

## 🏆 2. BẢNG HỘI VIÊN: `HoiVien` (Member)

### Thuộc tính riêng của Hội Viên:
```javascript
{
    // Thông tin từ NguoiDung
    ... (tất cả fields của NguoiDung)
    
    // Thông tin riêng của Hội Viên
    ngayThamGia: Date                 // Ngày tham gia
    ngayHetHan: Date                  // Ngày hết hạn
    trangThaiHoiVien: String {        // Trạng thái
        'DANG_HOAT_DONG',             // Đang hoạt động
        'TAM_NGUNG',                  // Tạm ngưng
        'HET_HAN'                     // Hết hạn
    }
    
    // Liên kết với Hạng Hội Viên
    hangHoiVien: ObjectId → HangHoiVien  // Hạng hiện tại
    ngayDatHang: Date                 // Ngày đạt hạng
    
    // Metrics
    soTienTichLuy: Number (default: 0)        // Tổng tiền đã chi
    soThangLienTuc: Number (default: 0)      // Số tháng liên tục
    soBuoiTapDaTap: Number (default: 0)      // Số buổi tập đã thực hiện
    
    // Mảng các chỉ số cơ thể
    cacChiSoCoThe: [ObjectId] → ChiSoCoThe
}
```

---

## 🔗 3. CÁC BẢNG LIÊN KẾT VỚI HỘI VIÊN

### 3.1. **HangHoiVien** (Member Rank/Tier)
```javascript
Relationship: HoiVien.hangHoiVien → HangHoiVien._id

Fields:
{
    tenHang: String {                  // Mã hạng
        'BRONZE', 'SILVER', 'GOLD', 
        'PLATINUM', 'DIAMOND'
    }
    tenHienThi: String                 // Tên hiển thị
    moTa: String                      // Mô tả
    dieuKienDatHang: {
        soTienTichLuy: Number          // Điều kiện tiền tích lũy
    }
    quyenLoi: [{                       // Danh sách quyền lợi
        tenQuyenLoi: String,
        moTa: String,
        giaTri: Number,
        loaiQuyenLoi: String {
            'GIAM_GIA', 
            'TANG_DICH_VU', 
            'UU_DAI_DAC_BIET', 
            'QUA_TANG'
        }
    }]
    mauSac: String                     // Màu hiển thị
    icon: String                       // Icon
    kichHoat: Boolean                  // Có kích hoạt không
    thuTu: Number                      // Thứ tự hiển thị
}
```

### 3.2. **ChiSoCoThe** (Body Metrics)
```javascript
Relationship: HoiVien.cacChiSoCoThe → ChiSoCoThe._id
              ChiSoCoThe.hoiVien → HoiVien._id

Fields:
{
    hoiVien: ObjectId → HoiVien
    chieuCao: Number                   // Chiều cao (cm)
    canNang: Number                    // Cân nặng (kg)
    vongEo: Number                     // Vòng eo (cm)
    bmi: Number                         // BMI
    tyLeMoCoThe: Number                // % mỡ cơ thể
    tyLeCoBap: Number                  // % cơ bắp
    nhipTim: Number                     // Nhịp tim
    tinhTrangSuckhoe: String           // Tình trạng sức khỏe
    ngayDo: Date                       // Ngày đo
}
```

### 3.3. **DangKyGoiTap** (Package Registration)
```javascript
Relationship: DangKyGoiTap.maHoiVien → HoiVien._id

Fields:
{
    maHoiVien: ObjectId → HoiVien      // Hội viên
    maGoiTap: ObjectId → GoiTap        // Gói tập
    ngayDangKy: Date                   // Ngày đăng ký
    ngayBatDau: Date                   // Ngày bắt đầu
    ngayKetThuc: Date                  // Ngày kết thúc
    
    trangThai: String {                // Trạng thái gói
        'DANG_HOAT_DONG',              // Đang hoạt động
        'TAM_DUNG',                     // Tạm dừng
        'HET_HAN',                      // Hết hạn
        'DA_HUY'                        // Đã hủy
    }
    
    // Thông tin tạm dừng
    ngayTamDung: Date                   // Ngày tạm dừng
    soNgayConLai: Number                // Số ngày còn lại
    lyDoTamDung: String                 // Lý do tạm dừng
    
    // Thanh toán
    trangThaiThanhToan: String {       // Trạng thái thanh toán
        'DA_THANH_TOAN',               // Đã thanh toán
        'CHUA_THANH_TOAN',             // Chưa thanh toán
        'HOAN_TIEN'                    // Hoàn tiền
    }
    soTienThanhToan: Number             // Số tiền
    maThanhToan: ObjectId → ThanhToan  // Lien kết thanh toán
    
    // PT và lịch
    ptDuocChon: ObjectId → PT          // PT được chọn
    lichTapDuocTao: ObjectId → LichTap // Lịch tập
    
    ghiChu: String                     // Ghi chú
    thuTuUuTien: Number                 // Thứ tự ưu tiên
}

Methods:
- kichHoatLai()           // Kích hoạt lại gói đã tạm dừng
- getActivePackage()       // Lấy gói đang hoạt động
- getAllPackagesByMember() // Lấy tất cả gói
- getMembersByPackage()    // Lấy danh sách hội viên của gói
- getPackageStats()        // Thống kê gói tập
```

### 3.4. **ThanhToan** (Payment)
```javascript
Relationship: ThanhToan.hoiVien → HoiVien._id

Fields:
{
    hoiVien: ObjectId → HoiVien
    soTien: Number                      // Số tiền
    ngayThanhToan: Date                // Ngày thanh toán
    noiDung: String                     // Nội dung
    phuongThuc: String {                // Phương thức
        'TIEN_MAT',                     // Tiền mặt
        'CHUYEN_KHOAN',                 // Chuyển khoản
        'THE_TIN_DUNG'                  // Thẻ tín dụng
    }
    trangThaiThanhToan: String {       // Trạng thái
        'DANG_XU_LY',                  // Đang xử lý
        'THANH_CONG',                   // Thành công
        'THAT_BAI'                      // Thất bại
    }
    isLocked: Boolean                   // Khóa chỉnh sửa
    maChiTietGoiTap: ObjectId           // Liên kết gói tập
}

Pre-hooks:
- Tự động khóa khi thanh toán thành công
```

### 3.5. **LichHenPT** (PT Appointment)
```javascript
Relationship: LichHenPT.hoiVien → HoiVien._id
              LichHenPT.pt → PT._id

Fields:
{
    hoiVien: ObjectId → HoiVien
    pt: ObjectId → PT
    ngayHen: Date                       // Ngày hẹn
    gioHen: String                      // Giờ hẹn
    trangThaiLichHen: String {         // Trạng thái
        'CHO_XAC_NHAN',                // Chờ xác nhận
        'DA_XAC_NHAN',                  // Đã xác nhận
        'DA_HUY',                      // Đã hủy
        'HOAN_THANH'                   // Hoàn thành
    }
    ghiChu: String                     // Ghi chú
}
```

### 3.6. **LichSuTap** (Training History)
```javascript
Relationship: LichSuTap.hoiVien → HoiVien._id
              LichSuTap.buoiTap → BuoiTap._id

Fields:
{
    hoiVien: ObjectId → HoiVien
    buoiTap: ObjectId → BuoiTap
    ketQua: String                     // Kết quả
    caloTieuHao: Number                 // Calo tiêu hao
    danhGia: Number (1-5)              // Đánh giá
    ngayTap: Date                      // Ngày tập
}
```

### 3.7. **BuoiTap** (Training Session)
```javascript
Relationship: BuoiTap.danhSachHoiVien[].hoiVien → HoiVien._id

Fields:
{
    tenBuoiTap: String
    chiNhanh: ObjectId → ChiNhanh
    ptPhuTrach: ObjectId → PT
    ngayTap: Date
    gioBatDau: String
    gioKetThuc: String
    soLuongToiDa: Number               // Số lượng tối đa
    soLuongHienTai: Number             // Số lượng hiện tại
    trangThai: String {                // Trạng thái
        'CHUAN_BI',                    // Chuẩn bị
        'DANG_DIEN_RA',                // Đang diễn ra
        'HOAN_THANH',                  // Hoàn thành
        'HUY'                          // Hủy
    }
    danhSachHoiVien: [{                // Danh sách HV tham gia
        hoiVien: ObjectId → HoiVien
        ngayDangKy: Date
        trangThai: String {            // Trạng thái
            'DA_DANG_KY',              // Đã đăng ký
            'DA_THAM_GIA',              // Đã tham gia
            'VANG_MAT',                // Vắng mặt
            'HUY'                      // Hủy
        }
    }]
    moTa: String
    ghiChu: String
}

Methods:
- themHoiVien(hoiVienId)               // Thêm HV vào buổi tập
- xoaHoiVien(hoiVienId)                // Xóa HV khỏi buổi tập
```

### 3.8. **GoiTap** (Package/Plan)
```javascript
Relationship: DangKyGoiTap.maGoiTap → GoiTap._id

Fields:
{
    tenGoiTap: String                  // Tên gói tập
    moTa: String                       // Mô tả
    donGia: Number                     // Đơn giá
    thoiHan: Number                    // Thời hạn
    donViThoiHan: String {             // Đơn vị
        'Ngay', 'Thang', 'Nam'
    }
    loaiThoiHan: String {              // Loại thời hạn
        'VinhVien',                     // Vĩnh viễn
        'TinhTheoNgay'                  // Tính theo ngày
    }
    soLuongNguoiThamGia: Number       // Số lượng người
    loaiGoiTap: String {                // Loại gói
        'CaNhan',                       // Cá nhân
        'Nhom',                         // Nhóm
        'CongTy'                        // Công ty
    }
    giaGoc: Number                     // Giá gốc
    popular: Boolean                    // Phổ biến
    hinhAnhDaiDien: String             // Hình ảnh
    kichHoat: Boolean                  // Kích hoạt
    ghiChu: String                     // Ghi chú
    quyenLoi: [{                        // Quyền lợi
        tenQuyenLoi: String,
        moTa: String,
        icon: String,
        loai: String {
            'co_ban', 'cao_cap', 
            'vip', 'premium'
        }
    }]
}
```

### 3.9. **Review** (Review/Feedback)
```javascript
Relationship: Review.hoiVienId → HoiVien._id
              Review.goiTapId → GoiTap._id

Fields:
{
    hoiVienId: ObjectId → NguoiDung
    goiTapId: ObjectId → GoiTap
    rating: Number (1-5)               // Đánh giá
    comment: String                     // Bình luận
    hinhAnh: [String] (max 3)           // Hình ảnh
    ngayTao: Date
    ngayCapNhat: Date
    trangThai: String {                // Trạng thái
        'active', 'hidden', 'deleted'
    }
}
```

### 3.10. **TaiKhoan** (Account)
```javascript
Relationship: TaiKhoan.nguoiDung → NguoiDung._id
              NguoiDung.sdt → TaiKhoan.sdt

Fields:
{
    sdt: String (unique, required)     // Số điện thoại
    trangThaiTK: String {              // Trạng thái
        'DANG_HOAT_DONG',              // Đang hoạt động
        'DA_KHOA'                      // Đã khóa
    }
    matKhau: String                    // Mật khẩu (hashed)
    ngayTao: Date
    nguoiDung: ObjectId → NguoiDung
}

Indexes:
- sdt (unique)
- nguoiDung
```

---

## 🔄 4. MỐI QUAN HỆ TỔNG QUAN

```
HoiVien (Member)
├── Thuộc về Hạng Hội Viên (HangHoiVien)
├── Có nhiều Chỉ Số Cơ Thể (ChiSoCoThe[])
├── Đăng ký nhiều Gói Tập (DangKyGoiTap[])
├── Có nhiều Thanh Toán (ThanhToan[])
├── Đặt lịch với PT (LichHenPT[])
├── Có lịch sử tập (LichSuTap[])
├── Tham gia các Buổi Tập (BuoiTap.danhSachHoiVien[])
├── Đánh giá gói tập (Review[])
└── Có Tài Khoản để đăng nhập (TaiKhoan)
```

---

## 💡 5. THUỘC TÍNH PHỤ THUỘC CHÍNH

### 5.1. Trực tiếp từ HoiVien:
- `hangHoiVien` → **Phụ thuộc vào bảng HangHoiVien**
- `cacChiSoCoThe[]` → **Phụ thuộc vào bảng ChiSoCoThe**
- `trangThaiHoiVien` → **Enum tự quản lý**
- `soTienTichLuy`, `soThangLienTuc`, `soBuoiTapDaTap` → **Metrics**

### 5.2. Quan hệ One-to-Many:
- **DangKyGoiTap** → 1 Hội viên có thể đăng ký nhiều gói
- **ThanhToan** → 1 Hội viên có nhiều thanh toán
- **LichHenPT** → 1 Hội viên có nhiều lịch hẹn PT
- **LichSuTap** → 1 Hội viên có nhiều lịch sử tập
- **Review** → 1 Hội viên có nhiều review
- **BuoiTap.danhSachHoiVien[]** → 1 HV trong nhiều buổi tập

### 5.3. Quan hệ Many-to-One:
- **TaiKhoan** → Mỗi hội viên có 1 tài khoản đăng nhập
- **HangHoiVien** → Mỗi hội viên thuộc về 1 hạng

---

## 🎯 6. CÁC TRƯỜNG QUAN TRỌNG

### Metrics cập nhật tự động:
1. **soTienTichLuy**: Tổng số tiền đã chi (từ thanh toán)
2. **soThangLienTuc**: Số tháng liên tục là hội viên
3. **soBuoiTapDaTap**: Số buổi tập đã thực hiện
4. **trangThaiHoiVien**: Trạng thái (DANG_HOAT_DONG/TAM_NGUNG/HET_HAN)

### Cập nhật Hạng:
- Dựa vào `soTienTichLuy` so với điều kiện của `HangHoiVien`
- Khi đạt hạng mới → cập nhật `hangHoiVien` và `ngayDatHang`

### Xử lý Gói Tập:
- Khi đăng ký gói mới → tự động **TẠM DỪNG** các gói cũ
- Lưu `soNgayConLai` của gói cũ
- Khi gói mới hết hạn → tự động kích hoạt lại gói đã tạm dừng

---

## 🚨 7. LƯU Ý VÀ RÀNG BUỘC

### Ràng buộc:
- `soCCCD` phải unique
- `email` phải unique (sparse)
- `sdt` phải unique và required
- `trangThaiHoiVien` phải là một trong 3 trạng thái
- Khi đăng ký gói mới, các gói cũ phải được tạm dừng

### Indexes:
- `maHoiVien` trong DangKyGoiTap (tối ưu query)
- `sdt` trong TaiKhoan (tối ưu login)
- `hoiVien` trong ChiSoCoThe (tối ưu truy vấn chỉ số)

### Middleware:
- Tự động tính `soNgayConLai` khi tạm dừng gói
- Tự động khóa ThanhToan sau khi thanh toán thành công
- Tự động cập nhật `ngayCapNhat` trong Review

---

## 📊 8. TỔNG KẾT

**Hội viên là entity trung tâm** kết nối với:
- ✅ 3 bảng chính: HangHoiVien, ChiSoCoThe, TaiKhoan
- ✅ 6 bảng giao dịch: DangKyGoiTap, ThanhToan, LichHenPT, LichSuTap, Review
- ✅ 1 bảng quan hệ: BuoiTap (danhSachHoiVien)
- ✅ 1 bảng tham chiếu: GoiTap (qua DangKyGoiTap)

**Tổng cộng: 11 bảng liên quan** đến Hội viên trong hệ thống!

