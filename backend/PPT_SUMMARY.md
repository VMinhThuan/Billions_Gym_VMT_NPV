# Tóm Tắt Nội Dung Cho PowerPoint - Billions Gym Management System

## Slide 1: Giới Thiệu Dự Án
**Tiêu đề:** Billions Gym Management System

**Nội dung:**
- Hệ thống quản lý phòng gym toàn diện
- Quản lý hội viên, PT, và chủ phòng gym
- Tích hợp thanh toán trực tuyến
- AI-powered features (nutrition planning, workout prediction)
- Real-time communication
- Check-in/Check-out với nhận diện khuôn mặt

## Slide 2: Tổng Quan Kiến Trúc Hệ Thống
**Sử dụng:** `system-architecture.mmd`

**Nội dung:**
- **Client Layer:** Web App, Mobile App, Admin Panel
- **API Gateway:** Express.js Server với RESTful API và WebSocket
- **Business Logic:** Controllers và Services
- **Data Layer:** MongoDB Database
- **External Services:** Payment Gateways, AI Services, SMS, File Storage

## Slide 3: Use Case Diagram
**Sử dụng:** `use-case-diagram.mmd`

**Giải thích:**
- **3 Actors chính:**
  - Hội Viên: Đăng ký gói, tập luyện, check-in, chat với PT
  - Personal Trainer: Tạo buổi tập, quản lý hội viên, chat
  - Chủ Phòng Gym: Quản lý toàn bộ hệ thống
- **Hệ Thống:** Tự động hóa các tác vụ (check-out, thông báo, AI)

## Slide 4: Class Diagram - Core Entities
**Sử dụng:** `class-diagram.mmd` (có thể tách thành nhiều slide)

**Nội dung:**
- **User Hierarchy:**
  - NguoiDung (base class)
  - HoiVien, PT, OngChu (inherited classes)
- **Package Management:**
  - GoiTap, ChiTietGoiTap
- **Workout Management:**
  - Session, BuoiTap, BaiTap, LichTap

## Slide 5: ERD - Database Schema
**Sử dụng:** `erd-diagram.mmd`

**Nội dung:**
- **20+ Collections chính:**
  - User Management: NguoiDung, HoiVien, PT, OngChu, TaiKhoan
  - Package: GoiTap, ChiTietGoiTap
  - Workout: Session, BuoiTap, BaiTap, LichTap, LichSuTap
  - Payment: ThanhToan
  - Nutrition: NutritionPlan, Meal
  - Chat: ChatRoom, ChatMessage
  - Check-in: CheckInRecord, PTCheckInRecord

## Slide 6: Luồng Đăng Ký Gói Tập và Thanh Toán
**Sử dụng:** Sequence diagram từ `sequence-diagrams.mmd`

**Các bước:**
1. Hội viên xem danh sách gói tập
2. Đăng ký gói tập (tạo ChiTietGoiTap)
3. Tạo thanh toán qua Payment Gateway
4. Thanh toán qua MoMo/ZaloPay
5. Webhook callback cập nhật trạng thái
6. Gửi thông báo thành công

## Slide 7: Luồng Tạo và Tham Gia Buổi Tập
**Sử dụng:** Sequence diagram từ `sequence-diagrams.mmd`

**Các bước:**
1. PT tạo buổi tập
2. Hệ thống gửi thông báo real-time
3. Hội viên xem và đăng ký buổi tập
4. Check-in khi đến phòng gym
5. Tập luyện
6. Check-out và ghi nhận lịch sử

## Slide 8: Luồng Chat Real-time
**Sử dụng:** Sequence diagram từ `sequence-diagrams.mmd`

**Nội dung:**
- WebSocket connection
- Tạo/tìm chat room
- Gửi và nhận message real-time
- Lưu lịch sử chat vào database

## Slide 9: AI Features
**Sử dụng:** Sequence diagram tạo kế hoạch dinh dưỡng từ `sequence-diagrams.mmd`

**Nội dung:**
- **Nutrition Planning:** Sử dụng Google Gemini AI
  - Input: Mục tiêu, calories, preferences
  - Output: Kế hoạch dinh dưỡng chi tiết
- **Workout Prediction:** Dự đoán bài tập phù hợp
- **Chatbot:** Hỗ trợ hội viên 24/7

## Slide 10: Công Nghệ Sử Dụng

**Backend:**
- Node.js + Express.js
- MongoDB + Mongoose
- Socket.IO (WebSocket)
- JWT Authentication
- Bcrypt (Password Hashing)

**External Services:**
- MoMo Payment Gateway
- ZaloPay Payment Gateway
- Google Gemini AI
- Twilio (SMS/OTP)

**Infrastructure:**
- RESTful API
- WebSocket cho real-time
- File storage
- Environment-based config

## Slide 11: Các Module Chính

1. **Authentication & Authorization**
   - JWT-based authentication
   - Role-based access control (RBAC)
   - OTP verification

2. **Package Management**
   - CRUD gói tập
   - Đăng ký và workflow
   - Nâng cấp gói tập

3. **Workout Management**
   - Quản lý buổi tập và bài tập
   - Lịch tập và lịch sử
   - Template buổi tập

4. **Payment System**
   - Tích hợp MoMo và ZaloPay
   - Webhook handling
   - Payment tracking

5. **Check-in/Check-out**
   - QR Code check-in
   - Face recognition
   - Auto check-out service

6. **Chat System**
   - Real-time chat
   - Message history
   - File sharing

7. **Nutrition Management**
   - AI-powered planning
   - Meal management
   - Daily/Weekly plans

8. **Statistics & Reporting**
   - Hội viên statistics
   - PT statistics
   - Revenue reports

## Slide 12: API Endpoints Chính

**Authentication:**
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/verify-otp` - Xác thực OTP

**Package Management:**
- `GET /api/goitap` - Danh sách gói tập
- `POST /api/chitietgoitap/dangky` - Đăng ký gói tập

**Workout:**
- `GET /api/sessions` - Danh sách sessions
- `POST /api/sessions` - Tạo session
- `POST /api/buoitap` - Tạo buổi tập

**Payment:**
- `POST /api/payment/create` - Tạo thanh toán
- `POST /api/payment/callback` - Webhook callback

**Check-in:**
- `POST /api/checkin` - Check-in
- `PUT /api/checkin/:id/checkout` - Check-out

**Chat:**
- `POST /api/pt/chat/room` - Tạo/tìm room
- `GET /api/pt/chat/rooms/:id/messages` - Lấy messages

**Nutrition:**
- `POST /api/nutrition/plan` - Tạo kế hoạch dinh dưỡng
- `GET /api/nutrition/plans` - Danh sách kế hoạch

## Slide 13: Database Schema Summary

**Collections chính (20+):**
- **User Management:** nguoiDungs, taiKhoans
- **Package:** goiTaps, chiTietGoiTaps
- **Workout:** sessions, buoiTaps, BaiTap, lichTaps, lichSuTaps
- **Payment:** thanhToans
- **Nutrition:** NutritionPlans, Meals
- **Chat:** chatrooms, chatmessages
- **Check-in:** checkInRecords, ptCheckInRecords
- **Others:** ChiSoCoThe, chinhanhs, hangHoiViens, LichHenPT

**Indexes quan trọng:**
- Unique indexes: sdt, email, qrCode
- Compound indexes: (chiNhanh, ngay), (hoiVien, checkInTime)
- Geospatial index: ChiNhanh.location (2dsphere)

## Slide 14: Security Features

1. **Authentication:**
   - JWT tokens với expiration
   - Password hashing (bcrypt)
   - OTP verification

2. **Authorization:**
   - Role-based access control
   - Resource ownership validation

3. **Data Protection:**
   - Input validation
   - XSS protection
   - CORS configuration
   - Payment data security

## Slide 15: Services & Background Jobs

1. **Auto Check-out Service:**
   - Chạy định kỳ mỗi 10 phút
   - Tự động check-out các session hết hạn

2. **PT Session Notification Service:**
   - Gửi thông báo trước buổi tập
   - Reminder cho hội viên

3. **WebSocket Service:**
   - Real-time communication
   - Live updates

## Slide 16: Deployment & Infrastructure

**Environment Variables:**
- `MONGODB_URI` - Database connection
- `JWT_SECRET` - Authentication secret
- `MOMO_SECRET_KEY` - Payment gateway
- `GEMINI_API_KEY` - AI service
- `TWILIO_*` - SMS service

**File Storage:**
- Local storage trong `/uploads`
- Có thể migrate sang cloud (AWS S3, Cloudinary)

## Slide 17: Future Enhancements

1. **Mobile App:** Native iOS/Android
2. **Video Streaming:** Live workout sessions
3. **Wearable Integration:** Fitness trackers
4. **Advanced Analytics:** ML recommendations
5. **Multi-language:** Đa ngôn ngữ
6. **Social Features:** Community, challenges
7. **E-commerce:** Bán supplement, equipment
8. **Booking System:** Đặt lịch thiết bị

## Slide 18: Kết Luận

**Tóm tắt:**
- Hệ thống quản lý phòng gym toàn diện
- Tích hợp nhiều tính năng hiện đại
- Kiến trúc mở rộng và bảo trì dễ dàng
- Sẵn sàng cho production

**Highlights:**
- ✅ AI-powered features
- ✅ Real-time communication
- ✅ Payment integration
- ✅ Comprehensive analytics
- ✅ Scalable architecture

---

## Tips cho Presentation

1. **Slide 2-5:** Sử dụng các diagram từ thư mục `diagrams/`
2. **Slide 6-9:** Sử dụng sequence diagrams để giải thích luồng
3. **Slide 10-12:** Liệt kê công nghệ và API
4. **Slide 13-15:** Chi tiết kỹ thuật
5. **Slide 16-18:** Deployment và tương lai

## Cách Export Diagrams

1. Mở file `.mmd` trong [Mermaid Live Editor](https://mermaid.live/)
2. Copy nội dung vào editor
3. Export sang PNG/SVG
4. Chèn vào PowerPoint

Hoặc sử dụng Mermaid CLI:
```bash
npm install -g @mermaid-js/mermaid-cli
mmdc -i diagrams/use-case-diagram.mmd -o use-case-diagram.png
```

