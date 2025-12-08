# Tài Liệu Kiến Trúc Hệ Thống - Billions Gym Management System

## 1. Tổng Quan Hệ Thống

### 1.1 Mô Tả
Hệ thống quản lý phòng gym toàn diện với các chức năng:
- Quản lý hội viên, PT (Personal Trainer), và chủ phòng gym
- Đăng ký và quản lý gói tập
- Quản lý lịch tập và buổi tập
- Hệ thống thanh toán tích hợp (MoMo, ZaloPay)
- Quản lý dinh dưỡng với AI
- Chat real-time giữa PT và hội viên
- Check-in/Check-out với nhận diện khuôn mặt
- Thống kê và báo cáo
- AI workout prediction và nutrition planning

### 1.2 Kiến Trúc Tổng Quan

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Web App     │  │  Mobile App  │  │  Admin Panel │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ HTTP/WebSocket
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    API GATEWAY LAYER                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Express.js Server (Port 4000)                │   │
│  │  - RESTful API                                        │   │
│  │  - WebSocket (Socket.IO)                             │   │
│  │  - CORS, Authentication, Validation                  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Business    │  │   Services   │  │  External    │
│  Logic       │  │   Layer      │  │  Services    │
│  (Controllers)│  │              │  │              │
└──────────────┘  └──────────────┘  └──────────────┘
        │                 │                 │
        │                 │                 │
        └─────────────────┼─────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATA LAYER                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         MongoDB Database                             │   │
│  │  - User Management (NguoiDung, HoiVien, PT, OngChu) │   │
│  │  - Package Management (GoiTap, ChiTietGoiTap)       │   │
│  │  - Workout Management (Session, BuoiTap, BaiTap)    │   │
│  │  - Payment (ThanhToan)                              │   │
│  │  - Nutrition (NutritionPlan, Meal)                   │   │
│  │  - Chat (ChatRoom, ChatMessage)                     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  File        │  │  Payment     │  │  AI Services │
│  Storage     │  │  Gateways    │  │  (Gemini AI) │
│  (Uploads)   │  │  (MoMo/Zalo) │  │              │
└──────────────┘  └──────────────┘  └──────────────┘
```

### 1.3 Công Nghệ Sử Dụng

**Backend:**
- Node.js với Express.js framework
- MongoDB với Mongoose ODM
- Socket.IO cho real-time communication
- JWT cho authentication
- Bcrypt cho password hashing
- Multer cho file upload
- Google Generative AI (Gemini) cho AI features

**External Services:**
- MoMo Payment Gateway
- ZaloPay Payment Gateway
- Twilio (SMS/OTP)
- Face Recognition (custom implementation)

**Infrastructure:**
- RESTful API architecture
- WebSocket cho real-time features
- File storage cho uploads
- Environment-based configuration

---

## 2. Sơ Đồ Use Case Tổng Quát

```mermaid
graph TB
    %% Actors
    HoiVien[👤 Hội Viên]
    PT[💪 Personal Trainer]
    OngChu[👔 Chủ Phòng Gym]
    System[⚙️ Hệ Thống]
    
    %% Hội Viên Use Cases
    HoiVien --> UC1[Đăng ký/Đăng nhập]
    HoiVien --> UC2[Xem danh sách gói tập]
    HoiVien --> UC3[Đăng ký gói tập]
    HoiVien --> UC4[Thanh toán gói tập]
    HoiVien --> UC5[Xem lịch tập]
    HoiVien --> UC6[Đăng ký buổi tập]
    HoiVien --> UC7[Check-in/Check-out]
    HoiVien --> UC8[Xem bài tập]
    HoiVien --> UC9[Ghi nhận lịch sử tập]
    HoiVien --> UC10[Xem thống kê cá nhân]
    HoiVien --> UC11[Quản lý chỉ số cơ thể]
    HoiVien --> UC12[Đặt lịch hẹn với PT]
    HoiVien --> UC13[Chat với PT]
    HoiVien --> UC14[Xem kế hoạch dinh dưỡng]
    HoiVien --> UC15[Yêu cầu kế hoạch dinh dưỡng AI]
    HoiVien --> UC16[Xem thông báo]
    HoiVien --> UC17[Đánh giá buổi tập]
    HoiVien --> UC18[Xem lịch sử thanh toán]
    
    %% PT Use Cases
    PT --> UC1
    PT --> UC19[Tạo buổi tập]
    PT --> UC20[Quản lý lịch tập cho hội viên]
    PT --> UC21[Thêm/sửa/xóa bài tập]
    PT --> UC22[Xem danh sách hội viên]
    PT --> UC23[Chat với hội viên]
    PT --> UC24[Check-in PT]
    PT --> UC25[Xem lịch làm việc]
    PT --> UC26[Quản lý mục tiêu hội viên]
    PT --> UC27[Tạo template buổi tập]
    PT --> UC28[Xem thống kê PT]
    PT --> UC29[Tạo báo cáo]
    PT --> UC30[Quản lý ghi chú hội viên]
    
    %% Chủ Phòng Gym Use Cases
    OngChu --> UC1
    OngChu --> UC31[Quản lý gói tập CRUD]
    OngChu --> UC32[Quản lý hội viên]
    OngChu --> UC33[Quản lý PT]
    OngChu --> UC34[Quản lý chi nhánh]
    OngChu --> UC35[Xem báo cáo tổng hợp]
    OngChu --> UC36[Quản lý thanh toán]
    OngChu --> UC37[Quản lý hạng hội viên]
    OngChu --> UC38[Quản lý bài tập]
    OngChu --> UC39[Xem thống kê doanh thu]
    
    %% System Use Cases
    System --> UC40[Tự động check-out hết hạn]
    System --> UC41[Gửi thông báo buổi tập]
    System --> UC42[Tạo kế hoạch dinh dưỡng AI]
    System --> UC43[Dự đoán workout AI]
    System --> UC44[Nhận diện khuôn mặt]
    System --> UC45[Xử lý thanh toán]
    System --> UC46[Gửi OTP]
    
    style HoiVien fill:#4CAF50
    style PT fill:#2196F3
    style OngChu fill:#FF9800
    style System fill:#9E9E9E
```

---

## 3. Class Diagram

```mermaid
classDiagram
    %% Core User Classes
    class NguoiDung {
        +String soCCCD
        +String hoTen
        +Date ngaySinh
        +String diaChi
        +String gioiTinh
        +String anhDaiDien
        +String email
        +String sdt
        +String vaiTro
    }
    
    class HoiVien {
        +Date ngayThamGia
        +Date ngayHetHan
        +String trangThaiHoiVien
        +Number soTienTichLuy
        +Number soThangLienTuc
        +Number soBuoiTapDaTap
        +String qrCode
        +dangKyGoiTap()
        +checkIn()
        +checkOut()
        +xemLichTap()
    }
    
    class PT {
        +Number kinhNghiem
        +String bangCapChungChi
        +String chuyenMon
        +Number danhGia
        +String moTa
        +Date ngayVaoLam
        +String trangThaiPT
        +Boolean isOnline
        +String qrCode
        +taoBuoiTap()
        +quanLyHoiVien()
        +chatVoiHoiVien()
    }
    
    class OngChu {
        +quanLyGoiTap()
        +quanLyHoiVien()
        +quanLyPT()
        +xemBaoCao()
    }
    
    class TaiKhoan {
        +String tenDangNhap
        +String matKhau
        +String vaiTro
        +dangNhap()
        +dangXuat()
    }
    
    %% Package Management
    class GoiTap {
        +String tenGoiTap
        +String moTa
        +Number donGia
        +Number thoiHan
        +String donViThoiHan
        +String loaiThoiHan
        +Number soLuongNguoiThamGia
        +String loaiGoiTap
        +Boolean kichHoat
        +Array quyenLoi
    }
    
    class ChiTietGoiTap {
        +ObjectId goiTapId
        +ObjectId nguoiDungId
        +Date thoiGianDangKy
        +Date ngayBatDau
        +String trangThaiThanhToan
        +String trangThaiDangKy
        +ObjectId ptDuocChon
        +ObjectId lichTapDuocTao
        +Number soTienThanhToan
        +dangKy()
        +thanhToan()
    }
    
    %% Workout Management
    class Session {
        +ObjectId chiNhanh
        +ObjectId ptPhuTrach
        +ObjectId goiTap
        +Date ngay
        +String gioBatDau
        +String gioKetThuc
        +Array taiLieuBaiTap
        +String doKho
        +Number soLuongToiDa
        +Number soLuongDaDangKy
        +String trangThai
        +canRegister()
    }
    
    class BuoiTap {
        +String tenBuoiTap
        +ObjectId chiNhanh
        +ObjectId ptPhuTrach
        +Date ngayTap
        +String gioBatDau
        +String gioKetThuc
        +Number soLuongToiDa
        +Number soLuongHienTai
        +String trangThai
        +Array danhSachHoiVien
        +Array baiTap
        +themHoiVien()
        +xoaHoiVien()
        +updateAttendanceStatus()
    }
    
    class BaiTap {
        +String tenBaiTap
        +String type
        +String file_url
        +String source_url
        +Number thoiGian
        +String moTa
        +String mucDoKho
        +Number kcal
        +Object ratings
    }
    
    class LichTap {
        +ObjectId hoiVien
        +ObjectId pt
        +Date ngayBatDau
        +Date ngayKetThuc
        +Array lichTapChiTiet
    }
    
    class LichSuTap {
        +ObjectId buoiTap
        +ObjectId hoiVien
        +String ketQua
        +Number caloTieuHao
        +Number danhGia
    }
    
    %% Payment
    class ThanhToan {
        +ObjectId hoiVien
        +Number soTien
        +Date ngayThanhToan
        +String phuongThuc
        +String trangThaiThanhToan
        +Boolean isLocked
        +ObjectId maChiTietGoiTap
    }
    
    %% Nutrition
    class NutritionPlan {
        +ObjectId hoiVien
        +String planType
        +Object request
        +Array days
        +Date generatedAt
        +String generatedBy
        +String status
    }
    
    class Meal {
        +String tenMon
        +Number calories
        +Object dinhDuong
        +String hinhAnh
    }
    
    %% Chat
    class ChatRoom {
        +Array participants
        +String participantModel
        +String lastMessage
        +Date lastMessageAt
        +findOrCreateRoom()
    }
    
    class ChatMessage {
        +ObjectId roomId
        +ObjectId senderId
        +String senderModel
        +String content
        +String messageType
        +Date timestamp
    }
    
    %% Check-in
    class CheckInRecord {
        +ObjectId hoiVien
        +ObjectId buoiTap
        +Date checkInTime
        +Date checkOutTime
        +String checkInStatus
        +String checkOutStatus
        +Number sessionDuration
        +calculateDuration()
    }
    
    class PTCheckInRecord {
        +ObjectId pt
        +ObjectId session
        +Date checkInTime
        +Date checkOutTime
        +String trangThai
    }
    
    %% Body Metrics
    class ChiSoCoThe {
        +ObjectId hoiVien
        +Number chieuCao
        +Number canNang
        +Number vongNguc
        +Number vongEo
        +Number vongMong
        +Number bmi
        +Number tyLeMoCoThe
        +Number tyLeCoBap
        +Number nhipTim
        +String tinhTrangSuckhoe
        +Date ngayDo
    }
    
    %% Branch
    class ChiNhanh {
        +String tenChiNhanh
        +String diaChi
        +String soDienThoai
        +Object location
        +Number thuTu
    }
    
    %% Member Tier
    class HangHoiVien {
        +String tenHang
        +Number soTienToiThieu
        +Number soThangToiThieu
        +Array quyenLoi
    }
    
    %% PT Schedule
    class LichHenPT {
        +ObjectId hoiVien
        +ObjectId pt
        +Date ngayHen
        +String gioHen
        +String trangThaiLichHen
    }
    
    class LichLamViecPT {
        +ObjectId pt
        +Date ngay
        +Array caLamViec
    }
    
    %% Relationships
    NguoiDung <|-- HoiVien
    NguoiDung <|-- PT
    NguoiDung <|-- OngChu
    NguoiDung "1" --> "1" TaiKhoan
    
    HoiVien "1" --> "*" ChiTietGoiTap
    ChiTietGoiTap "*" --> "1" GoiTap
    ChiTietGoiTap "*" --> "1" PT : chọn
    ChiTietGoiTap "*" --> "1" LichTap : tạo
    
    HoiVien "1" --> "*" ThanhToan
    ThanhToan "*" --> "1" ChiTietGoiTap
    
    HoiVien "*" --> "*" BuoiTap : đăng ký
    BuoiTap "*" --> "1" PT
    BuoiTap "*" --> "1" ChiNhanh
    BuoiTap "*" --> "*" BaiTap
    
    HoiVien "1" --> "*" LichSuTap
    LichSuTap "*" --> "1" BuoiTap
    
    HoiVien "1" --> "*" Session : đăng ký
    Session "*" --> "1" PT
    Session "*" --> "1" ChiNhanh
    Session "*" --> "*" BaiTap
    
    HoiVien "1" --> "*" CheckInRecord
    CheckInRecord "*" --> "1" BuoiTap
    
    PT "1" --> "*" PTCheckInRecord
    PTCheckInRecord "*" --> "1" Session
    
    HoiVien "1" --> "*" ChiSoCoThe
    HoiVien "*" --> "1" HangHoiVien
    
    HoiVien "*" --> "*" PT : lịch hẹn
    LichHenPT "*" --> "1" HoiVien
    LichHenPT "*" --> "1" PT
    
    PT "*" --> "1" ChiNhanh
    PT "1" --> "*" LichLamViecPT
    
    HoiVien "*" --> "*" PT : chat
    ChatRoom "*" --> "*" HoiVien
    ChatRoom "*" --> "*" PT
    ChatRoom "1" --> "*" ChatMessage
    
    HoiVien "1" --> "*" NutritionPlan
    NutritionPlan "*" --> "*" Meal
    
    HoiVien "1" --> "*" LichTap
    LichTap "*" --> "1" PT
```

---

## 4. Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    %% User Entities
    NguoiDung {
        ObjectId _id PK
        String soCCCD UK
        String hoTen
        Date ngaySinh
        String diaChi
        String gioiTinh
        String anhDaiDien
        String email UK
        String sdt UK
        String vaiTro
    }
    
    HoiVien {
        ObjectId _id PK
        Date ngayThamGia
        Date ngayHetHan
        String trangThaiHoiVien
        Number soTienTichLuy
        Number soThangLienTuc
        Number soBuoiTapDaTap
        String qrCode UK
        ObjectId hangHoiVien FK
    }
    
    PT {
        ObjectId _id PK
        Number kinhNghiem
        String bangCapChungChi
        String chuyenMon
        Number danhGia
        String moTa
        Date ngayVaoLam
        String trangThaiPT
        Boolean isOnline
        String qrCode UK
        ObjectId chinhanh FK
    }
    
    OngChu {
        ObjectId _id PK
    }
    
    TaiKhoan {
        ObjectId _id PK
        String tenDangNhap UK
        String matKhau
        String vaiTro
        ObjectId nguoiDungId FK
    }
    
    %% Package Entities
    GoiTap {
        ObjectId _id PK
        String tenGoiTap
        String moTa
        Number donGia
        Number thoiHan
        String donViThoiHan
        String loaiThoiHan
        Number soLuongNguoiThamGia
        String loaiGoiTap
        Boolean kichHoat
        Array quyenLoi
    }
    
    ChiTietGoiTap {
        ObjectId _id PK
        ObjectId goiTapId FK
        ObjectId nguoiDungId FK
        Date thoiGianDangKy
        Date ngayBatDau
        ObjectId branchId FK
        String trangThaiThanhToan
        String trangThaiDangKy
        ObjectId ptDuocChon FK
        ObjectId lichTapDuocTao FK
        Number soTienThanhToan
        Boolean isLocked
    }
    
    %% Workout Entities
    Session {
        ObjectId _id PK
        ObjectId chiNhanh FK
        ObjectId ptPhuTrach FK
        ObjectId goiTap FK
        Date ngay
        String gioBatDau
        String gioKetThuc
        Array taiLieuBaiTap
        String doKho
        Number soLuongToiDa
        Number soLuongDaDangKy
        String trangThai
    }
    
    BuoiTap {
        ObjectId _id PK
        String tenBuoiTap
        ObjectId chiNhanh FK
        ObjectId ptPhuTrach FK
        Date ngayTap
        String gioBatDau
        String gioKetThuc
        Number soLuongToiDa
        Number soLuongHienTai
        String trangThai
        Array danhSachHoiVien
        Array baiTap
    }
    
    BaiTap {
        ObjectId _id PK
        String tenBaiTap
        String type
        String file_url
        String source_url
        Number thoiGian
        String moTa
        String mucDoKho
        Number kcal
        Object ratings
    }
    
    LichTap {
        ObjectId _id PK
        ObjectId hoiVien FK
        ObjectId pt FK
        Date ngayBatDau
        Date ngayKetThuc
        Array lichTapChiTiet
    }
    
    LichSuTap {
        ObjectId _id PK
        ObjectId buoiTap FK
        ObjectId hoiVien FK
        String ketQua
        Number caloTieuHao
        Number danhGia
    }
    
    %% Payment Entities
    ThanhToan {
        ObjectId _id PK
        ObjectId hoiVien FK
        Number soTien
        Date ngayThanhToan
        String noiDung
        String phuongThuc
        String trangThaiThanhToan
        Boolean isLocked
        ObjectId maChiTietGoiTap FK
    }
    
    %% Nutrition Entities
    NutritionPlan {
        ObjectId _id PK
        ObjectId hoiVien FK
        String planType
        Object request
        Array days
        Date generatedAt
        String generatedBy
        String status
    }
    
    Meal {
        ObjectId _id PK
        String tenMon
        Number calories
        Object dinhDuong
        String hinhAnh
    }
    
    %% Chat Entities
    ChatRoom {
        ObjectId _id PK
        Array participants
        String participantModel
        String lastMessage
        Date lastMessageAt
        ObjectId lastMessageBy
        String lastMessageByModel
    }
    
    ChatMessage {
        ObjectId _id PK
        ObjectId roomId FK
        ObjectId senderId
        String senderModel
        String content
        String messageType
        Date timestamp
    }
    
    %% Check-in Entities
    CheckInRecord {
        ObjectId _id PK
        ObjectId hoiVien FK
        ObjectId buoiTap FK
        Date checkInTime
        Date checkOutTime
        String checkInStatus
        String checkOutStatus
        Number sessionDuration
    }
    
    PTCheckInRecord {
        ObjectId _id PK
        ObjectId pt FK
        ObjectId session FK
        Date checkInTime
        Date checkOutTime
        String trangThai
    }
    
    %% Body Metrics
    ChiSoCoThe {
        ObjectId _id PK
        ObjectId hoiVien FK
        Number chieuCao
        Number canNang
        Number vongNguc
        Number vongEo
        Number vongMong
        Number bmi
        Number tyLeMoCoThe
        Number tyLeCoBap
        Number nhipTim
        String tinhTrangSuckhoe
        Date ngayDo
    }
    
    %% Branch
    ChiNhanh {
        ObjectId _id PK
        String tenChiNhanh
        String diaChi
        String soDienThoai
        Object location
        Number thuTu
    }
    
    %% Member Tier
    HangHoiVien {
        ObjectId _id PK
        String tenHang
        Number soTienToiThieu
        Number soThangToiThieu
        Array quyenLoi
    }
    
    %% PT Schedule
    LichHenPT {
        ObjectId _id PK
        ObjectId hoiVien FK
        ObjectId pt FK
        Date ngayHen
        String gioHen
        String trangThaiLichHen
    }
    
    LichLamViecPT {
        ObjectId _id PK
        ObjectId pt FK
        Date ngay
        Array caLamViec
    }
    
    %% Relationships
    NguoiDung ||--o{ TaiKhoan : "has"
    NguoiDung ||--o| HoiVien : "extends"
    NguoiDung ||--o| PT : "extends"
    NguoiDung ||--o| OngChu : "extends"
    
    HoiVien ||--o{ ChiTietGoiTap : "registers"
    HoiVien ||--o{ ThanhToan : "makes"
    HoiVien ||--o{ LichSuTap : "records"
    HoiVien ||--o{ CheckInRecord : "checks_in"
    HoiVien ||--o{ ChiSoCoThe : "has"
    HoiVien ||--o{ NutritionPlan : "has"
    HoiVien ||--o{ LichTap : "has"
    HoiVien ||--o{ LichHenPT : "books"
    HoiVien }o--o{ PT : "chats_with"
    HoiVien }o--o{ BuoiTap : "attends"
    HoiVien }o--o{ Session : "registers"
    
    GoiTap ||--o{ ChiTietGoiTap : "included_in"
    GoiTap ||--o{ Session : "used_in"
    
    ChiTietGoiTap ||--o{ ThanhToan : "paid_by"
    ChiTietGoiTap }o--o| PT : "assigned_to"
    ChiTietGoiTap }o--o| LichTap : "creates"
    ChiTietGoiTap }o--|| ChiNhanh : "registered_at"
    
    PT ||--o{ Session : "conducts"
    PT ||--o{ BuoiTap : "conducts"
    PT ||--o{ PTCheckInRecord : "checks_in"
    PT ||--o{ LichHenPT : "scheduled"
    PT ||--o{ LichLamViecPT : "has"
    PT }o--|| ChiNhanh : "works_at"
    PT }o--o{ ChiTietGoiTap : "assigned_to"
    
    ChiNhanh ||--o{ Session : "hosts"
    ChiNhanh ||--o{ BuoiTap : "hosts"
    ChiNhanh ||--o{ PT : "employs"
    
    BuoiTap ||--o{ CheckInRecord : "has"
    BuoiTap }o--o{ BaiTap : "includes"
    
    Session ||--o{ PTCheckInRecord : "has"
    Session }o--o{ BaiTap : "includes"
    
    HangHoiVien ||--o{ HoiVien : "tier_of"
    
    ChatRoom ||--o{ ChatMessage : "contains"
    
    NutritionPlan }o--o{ Meal : "includes"
```

---

## 5. Luồng Xử Lý Chính

### 5.1 Luồng Đăng Ký Gói Tập và Thanh Toán

```mermaid
sequenceDiagram
    participant HV as Hội Viên
    participant API as API Server
    participant DB as MongoDB
    participant PG as Payment Gateway
    
    HV->>API: GET /api/goitap (Xem danh sách gói)
    API->>DB: Query GoiTap
    DB-->>API: Danh sách gói tập
    API-->>HV: Trả về danh sách
    
    HV->>API: POST /api/chitietgoitap/dangky
    API->>DB: Tạo ChiTietGoiTap (trạng thái: CHO_THANH_TOAN)
    DB-->>API: ChiTietGoiTap created
    API-->>HV: Trả về thông tin đăng ký
    
    HV->>API: POST /api/payment/create (Tạo thanh toán)
    API->>PG: Tạo payment request
    PG-->>API: Payment URL
    API-->>HV: Trả về payment URL
    
    HV->>PG: Thanh toán qua MoMo/ZaloPay
    PG->>API: Webhook callback (thanh toán thành công)
    API->>DB: Cập nhật ChiTietGoiTap (DA_THANH_TOAN)
    API->>DB: Tạo ThanhToan record
    API->>HV: Gửi thông báo thanh toán thành công
```

### 5.2 Luồng Tạo và Tham Gia Buổi Tập

```mermaid
sequenceDiagram
    participant PT as Personal Trainer
    participant HV as Hội Viên
    participant API as API Server
    participant DB as MongoDB
    participant WS as WebSocket
    
    PT->>API: POST /api/buoitap (Tạo buổi tập)
    API->>DB: Tạo BuoiTap
    DB-->>API: BuoiTap created
    API->>WS: Broadcast thông báo buổi tập mới
    WS-->>HV: Thông báo buổi tập mới
    API-->>PT: Trả về thông tin buổi tập
    
    HV->>API: GET /api/buoitap (Xem danh sách)
    API->>DB: Query BuoiTap
    DB-->>API: Danh sách buổi tập
    API-->>HV: Trả về danh sách
    
    HV->>API: POST /api/buoitap/:id/dangky (Đăng ký)
    API->>DB: Thêm hội viên vào danhSachHoiVien
    DB-->>API: Updated
    API->>WS: Broadcast cập nhật
    API-->>HV: Đăng ký thành công
    
    HV->>API: POST /api/checkin (Check-in)
    API->>DB: Tạo CheckInRecord
    DB-->>API: CheckInRecord created
    API->>WS: Broadcast check-in
    API-->>HV: Check-in thành công
    
    HV->>API: PUT /api/checkin/:id/checkout (Check-out)
    API->>DB: Cập nhật CheckInRecord (checkOutTime)
    DB-->>API: Updated
    API->>DB: Tạo LichSuTap
    API-->>HV: Check-out thành công
```

### 5.3 Luồng Chat Real-time

```mermaid
sequenceDiagram
    participant HV as Hội Viên
    participant PT as Personal Trainer
    participant API as API Server
    participant WS as WebSocket
    participant DB as MongoDB
    
    HV->>API: POST /api/pt/chat/room (Tạo/tìm room)
    API->>DB: Tìm hoặc tạo ChatRoom
    DB-->>API: ChatRoom
    API-->>HV: Room ID
    
    HV->>WS: Connect WebSocket
    WS-->>HV: Connected
    
    HV->>WS: Send message (roomId, content)
    WS->>DB: Lưu ChatMessage
    WS->>PT: Broadcast message (real-time)
    DB-->>WS: Message saved
    WS-->>HV: Message sent confirmation
    
    PT->>WS: Send reply
    WS->>DB: Lưu ChatMessage
    WS->>HV: Broadcast message (real-time)
    DB-->>WS: Message saved
    WS-->>PT: Message sent confirmation
```

### 5.4 Luồng Tạo Kế Hoạch Dinh Dưỡng AI

```mermaid
sequenceDiagram
    participant HV as Hội Viên
    participant API as API Server
    participant AI as Gemini AI
    participant DB as MongoDB
    
    HV->>API: POST /api/nutrition/plan (Yêu cầu kế hoạch)
    Note over HV,API: {goal, calories, period, preferences}
    API->>DB: Lấy ChiSoCoThe của hội viên
    DB-->>API: ChiSoCoThe data
    
    API->>AI: Generate nutrition plan
    Note over API,AI: Prompt với thông tin hội viên
    AI-->>API: Nutrition plan JSON
    
    API->>DB: Lưu NutritionPlan
    API->>DB: Tạo/lấy Meal records
    DB-->>API: NutritionPlan created
    
    API-->>HV: Trả về kế hoạch dinh dưỡng
```

---

## 6. Các Module Chính

### 6.1 Authentication & Authorization
- **JWT-based authentication**
- **Role-based access control (RBAC)**
- **OTP verification** (Twilio)
- **Password hashing** (bcrypt)

### 6.2 Package Management
- Quản lý gói tập (CRUD)
- Đăng ký gói tập
- Workflow: Chọn PT → Tạo lịch → Kích hoạt
- Nâng cấp gói tập

### 6.3 Workout Management
- Quản lý buổi tập (Session, BuoiTap)
- Quản lý bài tập (BaiTap)
- Lịch tập (LichTap)
- Lịch sử tập (LichSuTap)
- Template buổi tập

### 6.4 Payment System
- Tích hợp MoMo Payment
- Tích hợp ZaloPay
- Quản lý thanh toán
- Webhook handling
- Payment status tracking

### 6.5 Check-in/Check-out System
- QR Code check-in
- Face recognition check-in
- Auto check-out (scheduled service)
- PT check-in/check-out
- Attendance tracking

### 6.6 Chat System
- Real-time chat (WebSocket)
- Chat rooms (PT ↔ Hội viên)
- Message history
- Typing indicators
- File sharing

### 6.7 Nutrition Management
- AI-powered nutrition planning (Gemini)
- Meal management
- Daily/Weekly plans
- Nutrition tracking

### 6.8 AI Features
- Workout prediction
- Nutrition plan generation
- Chatbot assistance
- Personalized recommendations

### 6.9 Statistics & Reporting
- Hội viên statistics
- PT statistics
- Revenue reports
- Attendance reports
- Workout analytics

### 6.10 Notification System
- In-app notifications
- Push notifications
- Email notifications
- SMS notifications (Twilio)
- Session reminders

---

## 7. API Endpoints Chính

### 7.1 Authentication
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/verify-otp` - Xác thực OTP
- `POST /api/auth/refresh-token` - Làm mới token

### 7.2 User Management
- `GET /api/user/profile` - Lấy thông tin profile
- `PUT /api/user/profile` - Cập nhật profile
- `GET /api/user/:id` - Lấy thông tin user

### 7.3 Package Management
- `GET /api/goitap` - Danh sách gói tập
- `POST /api/chitietgoitap/dangky` - Đăng ký gói tập
- `GET /api/chitietgoitap/hoivien/:id` - Gói tập của hội viên

### 7.4 Workout Management
- `GET /api/sessions` - Danh sách sessions
- `POST /api/sessions` - Tạo session
- `POST /api/sessions/:id/register` - Đăng ký session
- `GET /api/buoitap` - Danh sách buổi tập
- `POST /api/buoitap` - Tạo buổi tập

### 7.5 Payment
- `POST /api/payment/create` - Tạo thanh toán
- `POST /api/payment/callback` - Webhook callback
- `GET /api/payment/:id` - Lấy thông tin thanh toán

### 7.6 Check-in
- `POST /api/checkin` - Check-in
- `PUT /api/checkin/:id/checkout` - Check-out
- `GET /api/checkin/history` - Lịch sử check-in

### 7.7 Chat
- `POST /api/pt/chat/room` - Tạo/tìm room
- `GET /api/pt/chat/rooms` - Danh sách rooms
- `GET /api/pt/chat/rooms/:id/messages` - Lấy messages

### 7.8 Nutrition
- `POST /api/nutrition/plan` - Tạo kế hoạch dinh dưỡng
- `GET /api/nutrition/plan/:id` - Lấy kế hoạch
- `GET /api/nutrition/plans` - Danh sách kế hoạch

### 7.9 AI
- `POST /api/ai/nutrition-plan` - Tạo kế hoạch AI
- `POST /api/workout-prediction` - Dự đoán workout
- `POST /api/chatbot` - Chatbot AI

---

## 8. Database Schema Summary

### 8.1 Collections Chính
1. **nguoiDungs** - Người dùng (HoiVien, PT, OngChu)
2. **taiKhoans** - Tài khoản đăng nhập
3. **goiTaps** - Gói tập
4. **chiTietGoiTaps** - Chi tiết đăng ký gói tập
5. **sessions** - Buổi tập (session)
6. **buoiTaps** - Buổi tập
7. **BaiTap** - Bài tập
8. **lichTaps** - Lịch tập
9. **lichSuTaps** - Lịch sử tập
10. **thanhToans** - Thanh toán
11. **checkInRecords** - Lịch sử check-in
12. **ptCheckInRecords** - Lịch sử check-in PT
13. **chatrooms** - Phòng chat
14. **chatmessages** - Tin nhắn
15. **NutritionPlans** - Kế hoạch dinh dưỡng
16. **Meals** - Món ăn
17. **ChiSoCoThe** - Chỉ số cơ thể
18. **chinhanhs** - Chi nhánh
19. **hangHoiViens** - Hạng hội viên
20. **LichHenPT** - Lịch hẹn PT

### 8.2 Indexes Quan Trọng
- `NguoiDung.sdt` - Unique index
- `NguoiDung.email` - Unique index
- `HoiVien.qrCode` - Unique index
- `PT.qrCode` - Unique index
- `Session.chiNhanh, Session.ngay` - Compound index
- `CheckInRecord.hoiVien, CheckInRecord.checkInTime` - Compound index
- `ChatRoom.participants` - Index
- `ChiNhanh.location` - 2dsphere index (geospatial)

---

## 9. Security Considerations

### 9.1 Authentication
- JWT tokens với expiration
- Password hashing với bcrypt
- OTP verification cho đăng ký/đăng nhập

### 9.2 Authorization
- Role-based access control
- Middleware kiểm tra quyền truy cập
- Resource ownership validation

### 9.3 Data Protection
- Input validation và sanitization
- SQL injection prevention (Mongoose)
- XSS protection
- CORS configuration
- Rate limiting (có thể thêm)

### 9.4 Payment Security
- Payment data không lưu trực tiếp
- Webhook signature verification
- Payment status locking

---

## 10. Deployment & Infrastructure

### 10.1 Environment Variables
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT secret key
- `FRONTEND_URL` - Frontend URL for CORS
- `MOMO_SECRET_KEY` - MoMo payment secret
- `ZALOPAY_SECRET_KEY` - ZaloPay secret
- `GEMINI_API_KEY` - Google Gemini API key
- `TWILIO_*` - Twilio credentials

### 10.2 Services
- **Auto Check-out Service** - Chạy định kỳ mỗi 10 phút
- **PT Session Notification Service** - Thông báo buổi tập
- **WebSocket Service** - Real-time communication

### 10.3 File Storage
- Local file storage trong `/uploads`
- Có thể migrate sang cloud storage (AWS S3, Cloudinary)

---

## 11. Future Enhancements

1. **Mobile App** - Native iOS/Android apps
2. **Video Streaming** - Live workout sessions
3. **Wearable Integration** - Kết nối với fitness trackers
4. **Advanced Analytics** - Machine learning cho recommendations
5. **Multi-language Support** - Đa ngôn ngữ
6. **Social Features** - Community, challenges, leaderboards
7. **E-commerce** - Bán supplement, equipment
8. **Booking System** - Đặt lịch thiết bị, phòng tập

---

## 12. Kết Luận

Hệ thống Billions Gym Management là một giải pháp toàn diện cho việc quản lý phòng gym hiện đại, tích hợp nhiều tính năng:
- Quản lý hội viên và PT
- Hệ thống thanh toán trực tuyến
- AI-powered features
- Real-time communication
- Comprehensive analytics

Kiến trúc được thiết kế để dễ dàng mở rộng và bảo trì, với separation of concerns rõ ràng giữa các layers.

