# Hướng dẫn Khắc phục Lỗi MongoDB Connection Timeout

## Nguyên nhân lỗi
Lỗi "Operation `taiKhoans.findOne()` buffering timed out after 10000ms" thường xảy ra khi:
1. MongoDB server chưa được khởi động
2. Connection string (MONGODB_URI) không đúng
3. Có vấn đề về network/firewall

## Các bước khắc phục

### 1. Kiểm tra MongoDB Server
Đảm bảo MongoDB đang chạy trên máy của bạn:

```bash
# Kiểm tra MongoDB có đang chạy không
ps aux | grep mongod

# Hoặc nếu dùng Homebrew trên macOS:
brew services list | grep mongodb
```

### 2. Khởi động MongoDB
Nếu MongoDB chưa chạy, hãy khởi động nó:

```bash
# Với Homebrew trên macOS:
brew services start mongodb-community

# Hoặc khởi động trực tiếp:
mongod
```

### 3. Kiểm tra Connection String
Đảm bảo file `.env` trong thư mục backend có biến `MONGODB_URI` đúng:

```env
MONGODB_URI=mongodb://localhost:27017/your_database_name
```

Hoặc nếu MongoDB có authentication:
```env
MONGODB_URI=mongodb://username:password@localhost:27017/your_database_name
```

### 4. Kiểm tra kết nối MongoDB
Sau khi start server, truy cập endpoint health check:
```
http://localhost:4000/health
```

Response sẽ cho biết trạng thái kết nối:
- `"database": "connected"` - MongoDB đã kết nối thành công
- `"database": "disconnected"` - MongoDB chưa kết nối
- `"database": "connecting"` - Đang trong quá trình kết nối

### 5. Kiểm tra Logs
Xem logs của server để biết lỗi chi tiết:

```bash
cd Billions_Gym_VMT_NPV/backend
npm start
```

Nhìn vào console, bạn sẽ thấy:
- `"Đã kết nối MongoDB thành công"` - Kết nối thành công
- `"Mongoose connected to MongoDB"` - Mongoose đã kết nối
- Error messages nếu có lỗi

### 6. Test MongoDB Connection
Kiểm tra xem có thể kết nối tới MongoDB bằng MongoDB CLI:

```bash
# Kiểm tra MongoDB port
lsof -i :27017

# Hoặc thử kết nối trực tiếp
mongosh mongodb://localhost:27017
```

## Các cải tiến đã thực hiện

1. **Thêm connection options**: 
   - `serverSelectionTimeoutMS: 5000` - Giảm timeout xuống 5 giây
   - `maxPoolSize: 10` - Tăng số connection pool
   - `retryWrites: true` - Tự động retry khi write failed

2. **Thêm event handlers**: Để log trạng thái kết nối MongoDB

3. **Thêm health check endpoint**: `/health` để kiểm tra trạng thái

4. **Tối ưu query**: Sử dụng `.lean()` trong `findTaiKhoanBySdt()` để cải thiện hiệu suất

5. **Thêm indexes**: Index cho các trường `sdt` và `nguoiDung` trong model TaiKhoan

## Cách kiểm tra đã khắc phục

1. Restart backend server:
```bash
cd Billions_Gym_VMT_NPV/backend
npm start
```

2. Kiểm tra health check:
```bash
curl http://localhost:4000/health
```

3. Thử đăng nhập lại với số điện thoại và mật khẩu của bạn.

## Lưu ý

- Nếu vẫn gặp lỗi timeout, hãy kiểm tra firewall có chặn port 27017 không
- Nếu dùng MongoDB Atlas (cloud), đảm bảo IP của bạn đã được whitelist
- Kiểm tra xem có nhiều MongoDB instances đang chạy không và chỉ để một instance chạy

