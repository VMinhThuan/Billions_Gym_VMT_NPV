# Hướng dẫn cài đặt hệ thống thanh toán

## 1. Cài đặt Dependencies

```bash
npm install crypto-js moment qs
```

## 2. Cấu hình Environment Variables

Tạo file `.env` trong thư mục `backend` với nội dung:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/billions_gym

# Server Configuration
PORT=4000
NODE_ENV=development

# Frontend URLs
FRONTEND_URL=http://localhost:3000
FRONTEND_URL_CLIENT=http://localhost:3000

# Backend URL
BACKEND_URL=http://localhost:4000

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# MoMo Payment Configuration
MOMO_ACCESS_KEY=F8BBA842ECF85
MOMO_SECRET_KEY=K951B6PE1waDMi640xX08PD3vg6EkVlz
MOMO_PARTNER_CODE=MOMO
MOMO_REDIRECT_URL=http://localhost:3000/payment-success
MOMO_IPN_URL=http://localhost:4000/api/payment/momo/callback

# ZaloPay Payment Configuration
ZALOPAY_APP_ID=2553
ZALOPAY_KEY1=PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL
ZALOPAY_KEY2=kLtgPl8HHhfvMuDHPwKfgfsY4Ydm9eIz
ZALOPAY_REDIRECT_URL=http://localhost:3000/payment-success
ZALOPAY_CALLBACK_URL=http://localhost:4000/api/payment/zalo/callback

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Other Configuration
BCRYPT_ROUNDS=12
```

## 3. Cấu hình Ngrok (Cho Callback URLs)

### Cài đặt Ngrok:
```bash
# macOS
brew install ngrok

# Windows
# Tải từ https://ngrok.com/download

# Linux
wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.zip
unzip ngrok-v3-stable-linux-amd64.zip
sudo mv ngrok /usr/local/bin
```

### Chạy Ngrok:
```bash
# Mở terminal mới và chạy:
ngrok http 4000
```

### Cập nhật Callback URLs:
Sau khi chạy ngrok, bạn sẽ nhận được URL như: `https://abc123.ngrok-free.app`

Cập nhật trong file `.env`:
```env
MOMO_IPN_URL=https://abc123.ngrok-free.app/api/payment/momo/callback
ZALOPAY_CALLBACK_URL=https://abc123.ngrok-free.app/api/payment/zalo/callback
```

## 4. API Endpoints

### MoMo Payment:
- `POST /api/payment/momo/create` - Tạo thanh toán MoMo
- `POST /api/payment/momo/callback` - Callback từ MoMo

### ZaloPay Payment:
- `POST /api/payment/zalo/create` - Tạo thanh toán ZaloPay
- `POST /api/payment/zalo/callback` - Callback từ ZaloPay

### Common:
- `GET /api/payment/status/:orderId` - Kiểm tra trạng thái thanh toán

## 5. Frontend Integration

### Checkout Page:
```javascript
// Tạo thanh toán MoMo
const response = await api.post('/api/payment/momo/create', {
    packageId: 'package_id',
    userId: 'user_id',
    paymentData: {
        firstName: 'Họ',
        lastName: 'Tên',
        phone: '0123456789',
        email: 'email@example.com'
    }
});

// Redirect đến MoMo
window.location.href = response.data.data.paymentUrl;
```

### Payment Success Page:
```javascript
// Kiểm tra trạng thái thanh toán
const response = await api.get(`/api/payment/status/${orderId}`);
```

## 6. Database Models

### PackageRegistration:
- `goiTapId`: ID gói tập
- `nguoiDungId`: ID người dùng
- `trangThai`: Trạng thái đăng ký
- `thongTinThanhToan`: Thông tin thanh toán
- `thongTinKhachHang`: Thông tin khách hàng

## 7. Luồng thanh toán

1. **Tạo thanh toán**: User chọn phương thức → Gọi API tạo thanh toán
2. **Redirect**: Chuyển hướng đến gateway thanh toán
3. **Callback**: Gateway gọi callback khi thanh toán xong
4. **Cập nhật trạng thái**: Backend cập nhật trạng thái đăng ký
5. **Redirect về**: Chuyển về trang success với orderId
6. **Hiển thị kết quả**: Frontend kiểm tra và hiển thị trạng thái

## 8. Testing

### Test MoMo:
1. Chọn MoMo làm phương thức thanh toán
2. Điền thông tin và click "Xác nhận & Thanh toán"
3. Sẽ redirect đến trang MoMo test
4. Sử dụng thông tin test: STK: 4111 1111 1111 1111

### Test ZaloPay:
1. Chọn ZaloPay làm phương thức thanh toán
2. Điền thông tin và click "Xác nhận & Thanh toán"
3. Sẽ redirect đến trang ZaloPay test
4. Sử dụng thông tin test: STK: 4111 1111 1111 1111

## 9. Production Setup

### MoMo Production:
- Đăng ký tài khoản MoMo Business
- Cập nhật `MOMO_ACCESS_KEY`, `MOMO_SECRET_KEY`, `MOMO_PARTNER_CODE`
- Thay đổi endpoint từ `test-payment.momo.vn` thành `payment.momo.vn`

### ZaloPay Production:
- Đăng ký tài khoản ZaloPay Business
- Cập nhật `ZALOPAY_APP_ID`, `ZALOPAY_KEY1`, `ZALOPAY_KEY2`
- Thay đổi endpoint từ `sb-openapi.zalopay.vn` thành `openapi.zalopay.vn`

## 10. Troubleshooting

### Lỗi thường gặp:
1. **Callback không hoạt động**: Kiểm tra ngrok và URL callback
2. **Signature không hợp lệ**: Kiểm tra key và raw signature
3. **Redirect không đúng**: Kiểm tra redirect URL trong config
4. **Database connection**: Kiểm tra MongoDB connection

### Debug:
- Kiểm tra logs trong console
- Sử dụng Postman để test API
- Kiểm tra network tab trong browser
