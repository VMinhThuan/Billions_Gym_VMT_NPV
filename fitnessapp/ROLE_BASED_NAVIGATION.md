# Hướng dẫn Navigation dựa trên Vai trò

## Tổng quan

Ứng dụng đã được cập nhật để hỗ trợ navigation dựa trên vai trò người dùng. Mỗi vai trò sẽ có giao diện và chức năng khác nhau.

## Các vai trò được hỗ trợ

### 1. Hội viên (HoiVien)
- **Màn hình chính**: Home, Workout Plans, Nutrition, Booking, Profile
- **Chức năng**: 
  - Xem bài tập và lịch sử tập luyện
  - Quản lý dinh dưỡng
  - Đặt lịch với PT
  - Quản lý thành viên
  - Dự báo tập luyện

### 2. Personal Trainer (PT)
- **Màn hình chính**: PT Dashboard, PT Bookings, PT Students, PT Profile
- **Chức năng**:
  - Dashboard với thống kê học viên và doanh thu
  - Quản lý lịch hẹn (xác nhận, hoàn thành, hủy)
  - Quản lý danh sách học viên
  - Theo dõi doanh thu và lịch làm việc

### 3. Ông chủ (OngChu/Admin)
- **Màn hình chính**: Admin Dashboard, Member Management, Reports, Admin Profile
- **Chức năng**:
  - Dashboard tổng quan toàn bộ hệ thống
  - Quản lý thành viên (thêm, sửa, xóa, gia hạn)
  - Xem báo cáo chi tiết
  - Quản lý PT và thanh toán

## Cấu trúc file

### Màn hình mới được tạo:
- `PTDashboardScreen.js` - Dashboard cho PT
- `AdminDashboardScreen.js` - Dashboard cho Admin
- `PTBookingsScreen.js` - Quản lý lịch hẹn cho PT
- `AdminMemberManagementScreen.js` - Quản lý thành viên cho Admin
- `RoleTestScreen.js` - Màn hình test vai trò

### Navigation:
- `RoleBasedNavigator.js` - Xử lý navigation dựa trên vai trò
- `AppNavigator.js` - Đã được cập nhật để sử dụng RoleBasedNavigator

### Context:
- `AuthContext.js` - Đã được cập nhật để hỗ trợ `userRole`

### API:
- `apiService.js` - Đã thêm các API cho PT và Admin

## Cách test

1. **Truy cập màn hình test vai trò**:
   - Vào Profile → Test Vai trò
   - Chọn vai trò muốn test
   - Ứng dụng sẽ chuyển sang giao diện tương ứng

2. **Test các chức năng**:
   - Mỗi vai trò sẽ có bottom navigation khác nhau
   - Các màn hình sẽ hiển thị dữ liệu phù hợp với vai trò
   - Có thể chuyển đổi giữa các vai trò để so sánh

## API Endpoints cần thiết

### Cho PT:
- `GET /pt/students` - Lấy danh sách học viên
- `PUT /lichhenpt/:id/xac-nhan` - Xác nhận lịch hẹn
- `PUT /lichhenpt/:id/hoan-thanh` - Hoàn thành buổi tập
- `PUT /lichhenpt/:id/huy` - Hủy lịch hẹn

### Cho Admin:
- `GET /user/hoi-vien` - Lấy tất cả thành viên
- `GET /user/pt` - Lấy tất cả PT
- `GET /thanhtoan` - Lấy tất cả thanh toán
- `GET /lichhenpt` - Lấy tất cả lịch hẹn
- `PUT /user/hoi-vien/:id/status` - Cập nhật trạng thái thành viên
- `DELETE /user/hoi-vien/:id` - Xóa thành viên

## Lưu ý

1. **Backend cần hỗ trợ**: Các API endpoints trên cần được implement ở backend
2. **Authentication**: Mỗi API cần kiểm tra quyền truy cập dựa trên vai trò
3. **Data**: Một số màn hình hiện tại đang sử dụng dữ liệu mock, cần kết nối với API thực tế
4. **Navigation**: Có thể cần điều chỉnh navigation flow tùy theo yêu cầu cụ thể

## Mở rộng

Để thêm vai trò mới:
1. Tạo màn hình tương ứng
2. Cập nhật `RoleBasedNavigator.js` để thêm tab navigator mới
3. Thêm API endpoints cần thiết
4. Cập nhật `RoleTestScreen.js` để thêm vai trò mới
