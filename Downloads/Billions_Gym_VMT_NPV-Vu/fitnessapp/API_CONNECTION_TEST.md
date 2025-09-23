# Hướng dẫn kiểm tra kết nối API

## Các vấn đề đã sửa

### 1. **Tăng timeout từ 10s lên 30s**
- Trước: 10 giây timeout
- Sau: 30 giây timeout
- Lý do: Mạng có thể chậm, đặc biệt trên thiết bị thật

### 2. **Thêm retry mechanism**
- Tự động retry 2 lần cho các lỗi network
- Đợi 1-2 giây giữa các lần retry
- Chỉ retry cho lỗi network, không retry cho lỗi authentication

### 3. **Cải thiện error messages**
- Thông báo lỗi rõ ràng hơn
- Phân biệt các loại lỗi khác nhau
- Hướng dẫn người dùng cách khắc phục

### 4. **Cải thiện xử lý lỗi trong LoginScreen**
- Hiển thị thông báo lỗi phù hợp với từng trường hợp
- Ưu tiên message từ server
- Fallback message rõ ràng

## Cách kiểm tra

### 1. Kiểm tra server có chạy không
```bash
# Trong thư mục backend
cd backend
npm start
```

### 2. Kiểm tra IP address
- Mở file `src/api/ApiManagerPublic.js`
- Đảm bảo IP address đúng với máy tính chạy server
- Thử các IP khác nhau nếu cần:
  - `http://10.0.2.2:4000/api` (Android emulator)
  - `http://192.168.x.x:4000/api` (Mạng local)
  - `http://localhost:4000/api` (iOS simulator)

### 3. Test kết nối từ app
- Mở app và thử đăng nhập
- Xem logs trong console để debug
- Kiểm tra network tab trong dev tools

### 4. Kiểm tra firewall
- Đảm bảo port 4000 không bị chặn
- Kiểm tra Windows Firewall
- Kiểm tra antivirus

## Troubleshooting

### Lỗi "Kết nối quá chậm"
- Kiểm tra kết nối mạng
- Thử IP address khác
- Kiểm tra server có đang chạy không

### Lỗi "Không thể kết nối đến server"
- Kiểm tra IP address trong ApiManagerPublic.js
- Đảm bảo server đang chạy trên port 4000
- Kiểm tra firewall

### Lỗi "Sai tài khoản hoặc mật khẩu"
- Kiểm tra tài khoản trong database
- Kiểm tra mật khẩu có đúng không
- Kiểm tra server logs

## Logs để debug

### Console logs quan trọng:
```
🔐 Attempting login with: {phone: "xxx", password: "***"}
API Call: POST http://192.168.110.182:4000/api/auth/login
Response status: 200, Content-Type: application/json
✅ Login successful, navigating to Main
```

### Lỗi thường gặp:
```
❌ Login error: [Error: Kết nối quá chậm. Vui lòng thử lại.]
❌ Error details: {message: "...", stack: "...", name: "AbortError"}
```

## Cải thiện thêm

### 1. Thêm loading indicator
- Hiển thị loading khi đang retry
- Thông báo số lần retry còn lại

### 2. Thêm offline detection
- Kiểm tra kết nối mạng trước khi gọi API
- Hiển thị thông báo offline

### 3. Thêm cache mechanism
- Cache response để giảm số lần gọi API
- Offline mode với cached data
