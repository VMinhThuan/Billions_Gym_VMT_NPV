# Tóm tắt sửa lỗi Navigation sau đăng nhập

## Vấn đề đã sửa

### 1. **Export sai component trong RoleBasedNavigator.js**
**Vấn đề:** File đang export `MainStackNavigator` thay vì `RoleBasedNavigator`
**Giải pháp:** Sửa export default thành `RoleBasedNavigator`

### 2. **Thêm logging để debug**
**File:** `AppNavigator.js`
**Giải pháp:** Thêm console.log để theo dõi userToken và isLoading

## Cách hoạt động sau khi sửa

### Flow đăng nhập:
1. **LoginScreen** → Gọi API đăng nhập
2. **AuthContext.login()** → Lưu token và user info
3. **LoginScreen** → Navigate đến 'Main' với navigation.reset()
4. **AppNavigator** → Render RoleBasedNavigator vì có userToken
5. **RoleBasedNavigator** → Kiểm tra role và render Tab Navigator tương ứng

### Các role được hỗ trợ:
- **HoiVien** → HoiVienTabNavigator (Home, WorkoutPlans, Nutrition, Booking, Profile)
- **PT** → PTTabNavigator (PTDashboard, PTBookings, PTStudents, PTProfile)  
- **OngChu** → AdminTabNavigator (AdminDashboard, MemberManagement, Reports, AdminProfile)

## Kiểm tra

### 1. Test đăng nhập với các role khác nhau:
```bash
# HoiVien
Phone: 0329982474
Password: 123456

# PT  
Phone: 0987654321
Password: 123456

# Admin
Phone: 0123456789
Password: 123456
```

### 2. Kiểm tra console logs:
- `🚀 AppNavigator` - Kiểm tra userToken và isLoading
- `🎭 RoleBasedNavigator` - Kiểm tra role và userInfo
- `🔐 AuthContext login` - Kiểm tra quá trình login

### 3. Kiểm tra navigation:
- Sau đăng nhập thành công, app sẽ redirect đến màn hình Home tương ứng với role
- Tab bar sẽ hiển thị đúng các tab cho từng role
- Có thể navigate giữa các tab và screens

## Lưu ý

- Nếu vẫn không redirect, kiểm tra console logs để xem role có được set đúng không
- Đảm bảo backend trả về đúng field `vaiTro` trong response
- Kiểm tra AsyncStorage có lưu đúng data không
