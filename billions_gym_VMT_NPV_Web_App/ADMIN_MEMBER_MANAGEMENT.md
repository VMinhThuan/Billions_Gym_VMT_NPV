# 👨‍💼 Giao Diện Quản Lý Hội Viên - Thuộc Tính Cần Thiết

## 📋 TỔNG QUAN

Khi admin xem/chỉnh sửa thông tin hội viên, cần hiển thị đầy đủ thông tin từ **11 bảng liên quan** để quản lý hiệu quả.

---

## 🔍 1. THÔNG TIN CHI TIẾT HỘI VIÊN

### 📌 Tab 1: THÔNG TIN CƠ BẢN (từ NguoiDung + HoiVien)

#### A. Thông tin cá nhân:
```javascript
{
    // Từ NguoiDung
    hoTen: String                    // Họ tên
    soCCCD: String                   // Số CCCD
    ngaySinh: Date                   // Ngày sinh
    diaChi: String                   // Địa chỉ
    gioiTinh: String                 // Giới tính
    sdt: String                      // Số điện thoại
    email: String                    // Email
    anhDaiDien: String               // Ảnh đại diện (URL)
    
    // Từ HoiVien
    ngayThamGia: Date                // Ngày tham gia
    ngayHetHan: Date                 // Ngày hết hạn
    trangThaiHoiVien: String {       // Trạng thái
        'DANG_HOAT_DONG',            // ✅ Đang hoạt động
        'TAM_NGUNG',                 // ⏸️ Tạm ngưng
        'HET_HAN'                     // ❌ Hết hạn
    }
}
```

#### B. Thông tin tài khoản (từ TaiKhoan):
```javascript
{
    sdt: String                      // Số điện thoại (để login)
    trangThaiTK: String {           // Trạng thái tài khoản
        'DANG_HOAT_DONG',            // Đang hoạt động
        'DA_KHOA'                     // Đã khóa
    }
    ngayTao: Date                    // Ngày tạo tài khoản
    lastLogin: Date (nếu có)         // Lần đăng nhập cuối
}
```

---

## 🏆 2. THÔNG TIN HẠNG HỘI VIÊN

### 📌 Tab 2: HỆ THỐNG HẠNG (từ HangHoiVien)

```javascript
{
    // Hạng hiện tại
    hangHoiVien: Object {            // Hạng hiện tại
        tenHang: String,              // BRONZE, SILVER, GOLD...
        tenHienThi: String,           // Đồng, Bạc, Vàng...
        moTa: String,                 // Mô tả hạng
        mauSac: String,               // Màu hiển thị
        icon: String                  // Icon
    }
    ngayDatHang: Date                // Ngày đạt hạng hiện tại
    
    // Metrics để lên hạng
    soTienTichLuy: Number            // Tổng tiền đã chi
    soThangLienTuc: Number           // Số tháng liên tục
    soBuoiTapDaTap: Number           // Số buổi tập
    
    // Điều kiện để lên hạng tiếp theo
    dieuKienLenHang: {               // Từ HangHoiVien tiếp theo
        soTienTichLuyCanThiet: Number,
        soThangCanThiet: Number,
        soBuoiCanThiet: Number
    }
    
    // Tiến độ
    tienDoLenHang: {
        soTienConThieu: Number,       // Còn thiếu bao nhiêu tiền
        soThangConThieu: Number,      // Còn thiếu bao nhiêu tháng
        phanTramHoanThanh: Number     // % hoàn thành (0-100)
    }
    
    // Danh sách quyền lợi hiện tại
    quyenLoi: [{
        tenQuyenLoi: String,
        moTa: String,
        giaTri: Number,
        loaiQuyenLoi: String          // GIAM_GIA, TANG_DICH_VU...
    }]
}
```

---

## 💳 3. THÔNG TIN GÓI TẬP

### 📌 Tab 3: LỊCH SỬ GÓI TẬP (từ DangKyGoiTap + GoiTap)

```javascript
{
    // Gói tập đang hoạt động
    goiHoatDong: [{
        maGoiTap: Object {            // Từ GoiTap
            tenGoiTap: String,
            donGia: Number,
            thoiHan: Number,
            donViThoiHan: String,     // Ngay, Thang, Nam
            loaiGoiTap: String,       // CaNhan, Nhom, CongTy
            quyenLoi: [String]
        },
        
        // Thông tin đăng ký
        ngayDangKy: Date,
        ngayBatDau: Date,
        ngayKetThuc: Date,
        trangThai: String,             // DANG_HOAT_DONG
        soNgayConLai: Number,
        
        // PT và lịch tập
        ptDuocChon: Object {          // PT info
            hoTen: String,
            sdt: String,
            danhGia: Number
        },
        lichTapDuocTao: Object        // LichTap info
    }],
    
    // Gói tập tạm dừng
    goiTamDung: [{
        tenGoiTap: String,
        ngayTamDung: Date,
        soNgayConLai: Number,
        lyDoTamDung: String,
        ngayKetThuc: Date,
        ngayKichHoatLai: Date         // Tính toán từ soNgayConLai
    }],
    
    // Gói tập đã hết hạn
    goiHetHan: [{
        tenGoiTap: String,
        ngayKetThuc: Date,
        soNgayDaQua: Number,
        ngayDangKy: Date
    }],
    
    // Tổng quan
    tongGiaTriGiaHan: Number,          // Tổng giá trị các gói
    soLuongGoiDangHoatDong: Number,
    soLuongGoiTamDung: Number,
    goiGanHetHan: Boolean              // Có gói sắp hết hạn (< 7 ngày)
}
```

---

## 💰 4. LỊCH SỬ THANH TOÁN

### 📌 Tab 4: THANH TOÁN (từ ThanhToan)

```javascript
{
    // Danh sách thanh toán
    lichSuThanhToan: [{
        ngayThanhToan: Date,
        soTien: Number,
        noiDung: String,
        phuongThuc: String {          // TIEN_MAT, CHUYEN_KHOAN...
        },
        trangThaiThanhToan: String {  // DANG_XU_LY, THANH_CONG...
        },
        maChiTietGoiTap: String,      // Liên kết với gói
        isLocked: Boolean              // Đã khóa chỉnh sửa
    }],
    
    // Thống kê
    tongThanhToan: Number,             // Tổng đã thanh toán
    tongSoGiaoDich: Number,           // Tổng số giao dịch
    tongThanhCong: Number,            // Tổng giao dịch thành công
    tongThatBai: Number,              // Tổng giao dịch thất bại
    phuongThucPhobien: String,        // Phương thức phổ biến
    soGiaoDichThangNay: Number,
    soTienThangNay: Number
}
```

---

## 📊 5. CHỈ SỐ CƠ THỂ

### 📌 Tab 5: THEO DÕI THỂ CHẤT (từ ChiSoCoThe)

```javascript
{
    // Danh sách chỉ số qua thời gian
    lichSuChiSo: [{
        ngayDo: Date,
        chieuCao: Number,              // cm
        canNang: Number,               // kg
        vongEo: Number,                // cm
        bmi: Number,                   // BMI
        tyLeMoCoThe: Number,           // %
        tyLeCoBap: Number,             // %
        nhipTim: Number,               // bpm
        tinhTrangSuckhoe: String
    }],
    
    // Chỉ số hiện tại (mới nhất)
    chiSoHienTai: {
        ngayDo: Date,
        chieuCao: Number,
        canNang: Number,
        vongEo: Number,
        bmi: Number,
        tyLeMoCoThe: Number,
        tyLeCoBap: Number,
        nhipTim: Number,
        tinhTrangSuckhoe: String
    },
    
    // Thống kê biến động
    bienDongThiLieu: {
        canNangLonNhat: Number,
        canNangNhoNhat: Number,
        canNangThayDoi: Number,        // kg (so với lần đầu)
        tyLeMoGiam: Number,             // % giảm mỡ
        tyLeCoTang: Number              // % tăng cơ
    },
    
    // Biểu đồ theo thời gian
    bieuDoChiSo: [
        // Chart data cho: cân nặng, BMI, % mỡ, % cơ
    ],
    
    // Tiến độ tập luyện
    tienDoTapLuyen: {
        soBuoiTapTrungBinh: Number,    // Buổi/tuần
        caloTrungBinh: Number,          // Calo/buổi
        thoiGianTapTrungBinh: Number    // Phút/buổi
    }
}
```

---

## 📅 6. LỊCH HẸN & TẬP LUYỆN

### 📌 Tab 6: LỊCH HẸN PT (từ LichHenPT)

```javascript
{
    // Lịch hẹn sắp tới
    lichHenSapToi: [{
        ngayHen: Date,
        gioHen: String,
        pt: Object {                   // PT info
            hoTen: String,
            sdt: String,
            danhGia: Number
        },
        trangThaiLichHen: String {    // CHO_XAC_NHAN, DA_XAC_NHAN...
        },
        ghiChu: String
    }],
    
    // Lịch sử hẹn
    lichSuHen: [{
        ngayHen: Date,
        gioHen: String,
        pt: Object,
        trangThai: String,              // HOAN_THANH, DA_HUY...
        ghiChu: String
    }],
    
    // Thống kê
    tongSoLanHen: Number,
    soLanXacNhan: Number,
    soLanHuy: Number,
    tiLeXacNhan: Number,               // %
    ptYeuThich: Object                 // PT được chọn nhiều nhất
}
```

### 📌 Tab 7: LỊCH SỬ TẬP LUYỆN (từ LichSuTap + BuoiTap)

```javascript
{
    // Danh sách buổi tập gần đây
    lichSuBuoiTap: [{
        buoiTap: Object {              // Từ BuoiTap
            tenBuoiTap: String,
            ngayTap: Date,
            gioBatDau: String,
            gioKetThuc: String,
            ptPhuTrach: Object {       // PT
                hoTen: String,
                sdt: String
            },
            chiNhanh: Object {         // Chi nhánh
                tenChiNhanh: String,
                diaChi: String
            }
        },
        
        // Kết quả tập luyện
        ketQua: String,
        caloTieuHao: Number,
        danhGia: Number,               // 1-5 sao
        ngayTap: Date
    }],
    
    // Thống kê
    tongSoBuoiTap: Number,
    tongCaloTieuHao: Number,          // Tổng calo đã đốt
    diemTrungBinhDanhGia: Number,     // 1-5
    soBuoiTrongThang: Number,
    caloTrungBinh: Number,
    
    // Biểu đồ
    bieuDoTapLuyen: [
        // Chart: Số buổi tập theo tháng
        // Chart: Calo tiêu hao theo tháng
    ],
    
    // Tần suất
    tanSuatTap: {
        soBuoiTuanNay: Number,
        soBuoiThangNay: Number,
        soBuoiNamNay: Number,
        buoiTrungBinhTuan: Number
    }
}
```

---

## ⭐ 7. ĐÁNH GIÁ & PHẢN HỒI

### 📌 Tab 8: REVIEW (từ Review)

```javascript
{
    // Các review đã viết
    danhSachReview: [{
        goiTap: Object {
            tenGoiTap: String,
            donGia: Number
        },
        rating: Number,               // 1-5
        comment: String,
        hinhAnh: [String],
        ngayTao: Date,
        trangThai: String              // active, hidden...
    }],
    
    // Thống kê
    tongSoReview: Number,
    diemTrungBinh: Number,
    phanBoRating: {
        _5sao: Number,
        _4sao: Number,
        _3sao: Number,
        _2sao: Number,
        _1sao: Number
    }
}
```

---

## 📈 8. TỔNG HỢP & THỐNG KÊ

### 📌 Tab 9: DASHBOARD (tổng hợp tất cả)

```javascript
{
    // Thông tin tổng quan
    tongQuan: {
        hoTen: String,
        trangThai: String,             // Đang hoạt động/ Tạm ngưng...
        ngayThamGia: Date,
        soNamThamGia: Number,
        soThangThamGia: Number
    },
    
    // Hạng & Quyền lợi
    hangVaQuyenLoi: {
        hienTai: String,               // BRONZE, SILVER...
        mauSac: String,
        soTienTichLuy: Number,
        dieuKienLenHang: Object
    },
    
    // Gói tập
    goiTap: {
        dangHoatDong: Number,
        tamDung: Number,
        hetHan: Number,
        goiGanHetHan: Boolean
    },
    
    // Tài chính
    taiChinh: {
        tongChi: Number,
        soGiaoDich: Number,
        giaoDichThangNay: Number,
        tienTrungBinhThang: Number
    },
    
    // Tập luyện
    tapLuyen: {
        tongBuoiTap: Number,
        tongCalo: Number,
        buoiTrungBinhThang: Number,
        diemTrungBinh: Number
    },
    
    // Hoạt động gần đây (timeline)
    hoatDongGanDay: [
        {
            ngay: Date,
            loai: String,              // 'TAP_LUYEN', 'THANH_TOAN'...
            noiDung: String,
            trangThai: String
        }
    ],
    
    // Cảnh báo & Thông báo
    canhBao: [{
        loai: String,                  // 'GOI_SAP_HET_HAN', 'KHONG_TAP_LAU'...
        noiDung: String,
        doUuTien: String               // 'CAO', 'THAP'
    }]
}
```

---

## 🎨 UI/UX ĐỀ XUẤT

### Layout tổng quan:
```
┌────────────────────────────────────────────┐
│ Thông tin hội viên                        │
│ [Ảnh] [Tên] [Trạng thái] [Hạng]          │
└────────────────────────────────────────────┘
┌────────────────────────────────────────────┐
│ Tabs:                                     │
│ [Cơ bản] [Hạng] [Gói tập] [Thanh toán]   │
│ [Chỉ số] [Lịch hẹn] [Lịch sử] [Review]   │
│ [Tổng hợp]                                 │
└────────────────────────────────────────────┘
┌────────────────────────────────────────────┐
│ Nội dung tab                              │
│                                           │
└────────────────────────────────────────────┘
```

### Các widget cần có:
- ✅ **Thẻ Info Card** - Thông tin chính
- ✅ **Timeline** - Hoạt động gần đây
- ✅ **Charts** - Biểu đồ tiến độ
- ✅ **Tables** - Danh sách chi tiết
- ✅ **Badges** - Hạng, trạng thái
- ✅ **Alerts** - Cảnh báo

---

## 🔔 CHỨC NĂNG QUAN TRỌNG

### 1. Tìm kiếm & Lọc:
- Tìm theo: Tên, SĐT, CCCD, Email, Hạng, Trạng thái
- Lọc: Trạng thái, Hạng, Có gói đang hoạt động, Sắp hết hạn

### 2. Thao tác Admin:
- ✅ Xem chi tiết
- ✅ Chỉnh sửa thông tin
- ✅ Xóa hội viên
- ✅ Khóa/Mở khóa tài khoản
- ✅ Gia hạn gói tập
- ✅ Đặt lại mật khẩu
- ✅ Gửi thông báo

### 3. Xuất báo cáo:
- Export Excel/PDF
- In profile đầy đủ
- Báo cáo tập luyện
- Báo cáo tài chính

---

## 📊 CÁC TRƯỜNG TỐI THIỂU CHO VIEW

### Danh sách hội viên (List View):
```
Tên | SĐT | Email | Hạng | Trạng thái | Gói tập | Ngày tham gia | Thao tác
```

### Chi tiết hội viên (Detail View):
**Thẻ chính:**
- Ảnh + Tên + Trạng thái + Hạng + Quyền lợi

**Các tab:**
1. **Thông tin** - hoTen, sdt, email, CCCD, địa chỉ, ngày tham gia, hạn
2. **Hạng** - Hạng hiện tại, điều kiện lên hạng, tiến độ
3. **Gói tập** - Gói đang hoạt động, tạm dừng, đã hết hạn
4. **Thanh toán** - Lịch sử giao dịch
5. **Chỉ số** - Biểu đồ biến động cân nặng, BMI, % mỡ, % cơ
6. **Lịch hẹn** - Lịch sắp tới và đã qua
7. **Lịch sử tập** - Danh sách buổi tập, kết quả
8. **Review** - Đánh giá đã viết
9. **Tổng hợp** - Dashboard mini với charts

---

## 🎯 KẾT LUẬN

Để quản lý hội viên hiệu quả, admin cần xem được **9 tabs** với thông tin từ **11 bảng**:
- Tab 1-2: Thông tin cá nhân (NguoiDung, HoiVien, TaiKhoan)
- Tab 3: Gói tập (DangKyGoiTap, GoiTap)
- Tab 4: Thanh toán (ThanhToan)
- Tab 5: Chỉ số (ChiSoCoThe)
- Tab 6: Lịch hẹn (LichHenPT)
- Tab 7: Lịch sử tập (LichSuTap, BuoiTap)
- Tab 8: Review (Review)
- Tab 9: Tổng hợp + Thống kê

**Tổng cộng:** ~50-60 fields cần hiển thị và quản lý!

