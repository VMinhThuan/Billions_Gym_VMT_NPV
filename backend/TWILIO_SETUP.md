# Hướng Dẫn Cấu Hình Twilio SMS

## 1. Tạo Tài Khoản Twilio

1. Truy cập [https://www.twilio.com/](https://www.twilio.com/)
2. Đăng ký tài khoản miễn phí
3. Xác thực số điện thoại

## 2. Lấy Thông Tin Cấu Hình

### 2.1 Account SID và Auth Token
1. Đăng nhập vào [Twilio Console](https://console.twilio.com/)
2. Vào Dashboard
3. Copy **Account SID** và **Auth Token**

### 2.2 Mua Số Điện Thoại Twilio
1. Vào **Phone Numbers** > **Manage** > **Buy a number**
2. Chọn quốc gia (US hoặc UK)
3. Chọn số điện thoại có khả năng SMS
4. Mua số (khoảng $1/tháng)

## 3. Cấu Hình Environment Variables

Tạo file `.env` trong thư mục `backend/`:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/billions_gym

# Server
PORT=4000
NODE_ENV=development

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRATION=24h

# Twilio SMS Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

## 4. Kiểm Tra Cấu Hình

### 4.1 Test API Endpoint
```bash
curl -X GET http://localhost:4000/api/auth/debug-twilio
```

### 4.2 Test Gửi OTP
```bash
curl -X POST http://localhost:4000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"sdt": "0329982474"}'
```

## 5. Lỗi Thường Gặp

### 5.1 Error 21612: "Message cannot be sent with the current combination of 'To' and/or 'From' parameters"
**Nguyên nhân:**
- Số điện thoại "From" không hợp lệ
- Số điện thoại "To" không đúng format
- Tài khoản Twilio chưa được verify

**Giải pháp:**
1. Kiểm tra `TWILIO_PHONE_NUMBER` có đúng format `+1xxxxxxxxxx`
2. Kiểm tra số điện thoại "To" có format `+84xxxxxxxxx`
3. Verify tài khoản Twilio

### 5.2 Error 21211: "Invalid 'To' Phone Number"
**Nguyên nhân:** Số điện thoại đích không hợp lệ

**Giải pháp:** Kiểm tra format số điện thoại Việt Nam

### 5.3 Error 63007: "Phone number is not a valid mobile number"
**Nguyên nhân:** Số điện thoại không hỗ trợ SMS

**Giải pháp:** Sử dụng số điện thoại di động thật

## 6. Development Mode

Trong môi trường development, nếu không muốn gửi SMS thật:

```env
NODE_ENV=development
```

Hệ thống sẽ:
- Lưu OTP vào database
- Log OTP ra console
- Không gửi SMS thật

## 7. Production Mode

Trong production, đảm bảo:
- Tài khoản Twilio đã được verify
- Số điện thoại Twilio đã được mua
- Cấu hình environment variables đúng
- Test gửi SMS trước khi deploy

## 8. Monitoring

Theo dõi SMS delivery:
1. Vào Twilio Console > Monitor > Logs
2. Kiểm tra Message Status
3. Xem Error Logs nếu có

## 9. Cost Optimization

- Sử dụng Trial Account cho development
- Mua số điện thoại US (rẻ hơn)
- Monitor usage để tránh chi phí cao
- Set up billing alerts


