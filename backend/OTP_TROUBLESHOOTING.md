# Hướng Dẫn Khắc Phục Lỗi OTP SMS

## ✅ Đã Sửa Các Lỗi

### 1. **Lỗi 21612: "Message cannot be sent with the current combination of 'To' and/or 'From' parameters"**

**Nguyên nhân:** Cấu hình Twilio không đúng hoặc số điện thoại không hợp lệ

**Đã sửa:**
- ✅ Thêm validation số điện thoại Việt Nam
- ✅ Kiểm tra cấu hình Twilio trước khi gửi
- ✅ Test connection Twilio
- ✅ Format số điện thoại đúng chuẩn

### 2. **Cải thiện Error Handling**

**Đã thêm:**
- ✅ Xử lý lỗi cụ thể cho từng loại lỗi
- ✅ Thông báo lỗi rõ ràng cho người dùng
- ✅ Log chi tiết để debug

### 3. **Validation Nâng Cao**

**Đã thêm:**
- ✅ Kiểm tra format số điện thoại Việt Nam
- ✅ Rate limiting (60 giây giữa các lần gửi)
- ✅ Expiration time cho OTP (5 phút)

## 🔧 Cách Kiểm Tra

### 1. Test Cấu Hình Twilio
```bash
cd backend
node test-twilio.js
```

### 2. Test API Endpoint
```bash
curl -X GET http://localhost:4000/api/auth/debug-twilio
```

### 3. Test Gửi OTP
```bash
curl -X POST http://localhost:4000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"sdt": "0329982474"}'
```

## 📱 Cấu Hình Twilio

### 1. Tạo File .env
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

### 2. Lấy Thông Tin Từ Twilio Console
1. Đăng nhập [Twilio Console](https://console.twilio.com/)
2. Copy Account SID và Auth Token
3. Mua số điện thoại Twilio
4. Cập nhật TWILIO_PHONE_NUMBER

## 🚨 Lỗi Thường Gặp

### 1. "Cấu hình Twilio chưa đầy đủ"
**Giải pháp:** Kiểm tra file .env có đầy đủ 3 biến môi trường

### 2. "Số điện thoại không đúng định dạng Việt Nam"
**Giải pháp:** Nhập số điện thoại 10 chữ số (VD: 0329982474)

### 3. "Không thể kết nối đến Twilio"
**Giải pháp:** 
- Kiểm tra Account SID và Auth Token
- Kiểm tra kết nối internet
- Verify tài khoản Twilio

### 4. "Vui lòng đợi 60 giây trước khi yêu cầu mã OTP mới"
**Giải pháp:** Đây là tính năng bảo mật, chờ 60 giây rồi thử lại

## 🧪 Development Mode

Trong môi trường development:
- OTP được lưu vào database
- OTP được log ra console
- Không gửi SMS thật (tránh phí)

## 📊 Monitoring

### 1. Logs Backend
```bash
# Xem logs realtime
npm start
```

### 2. Twilio Console
- Vào Monitor > Logs
- Xem Message Status
- Kiểm tra Error Logs

### 3. Database
```javascript
// Kiểm tra OTP trong database
db.otps.find().sort({createdAt: -1}).limit(5)
```

## 🔒 Bảo Mật

### 1. Rate Limiting
- Chỉ cho phép gửi OTP mỗi 60 giây
- Tự động xóa OTP cũ

### 2. Expiration
- OTP hết hạn sau 5 phút
- Tự động xóa OTP hết hạn

### 3. Validation
- Kiểm tra format số điện thoại
- Kiểm tra số điện thoại có tồn tại trong hệ thống

## 📞 Support

Nếu vẫn gặp lỗi:
1. Kiểm tra logs backend
2. Test cấu hình Twilio
3. Kiểm tra tài khoản Twilio
4. Liên hệ hỗ trợ kỹ thuật


