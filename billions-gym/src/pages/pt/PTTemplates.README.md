# PT Templates - Quản Lý Template Buổi Tập

## Tổng Quan
Màn hình **PT Templates** cho phép Personal Trainer quản lý các template buổi tập, bao gồm:
- ✅ Tạo template mới
- ✅ Chỉnh sửa template hiện có
- ✅ Xóa template
- ✅ Thêm/xóa bài tập trong template
- ✅ Tìm kiếm và lọc theo độ khó

## Cấu Trúc Backend

### Model: TemplateBuoiTap
```javascript
{
    ten: String,              // Tên template (required)
    moTa: String,            // Mô tả chi tiết
    loai: String,            // Loại buổi tập (VD: Strength Training, Cardio)
    doKho: String,           // Độ khó: 'DE', 'TRUNG_BINH', 'KHO'
    baiTap: [ObjectId],      // Danh sách bài tập (ref: BaiTap)
    hinhAnh: String,         // URL hình ảnh đại diện
    timestamps: true
}
```

### API Endpoints
- `GET /api/pt/templates` - Lấy danh sách templates
- `GET /api/pt/templates/:id` - Lấy chi tiết template
- `POST /api/pt/templates` - Tạo template mới
- `PUT /api/pt/templates/:id` - Cập nhật template
- `DELETE /api/pt/templates/:id` - Xóa template

### Query Parameters
- `page`: Số trang (default: 1)
- `limit`: Số lượng mỗi trang (default: 20)
- `search`: Tìm kiếm theo tên hoặc mô tả
- `doKho`: Lọc theo độ khó (DE, TRUNG_BINH, KHO)

## Tính Năng Chính

### 1. Hiển Thị Templates
- **Grid View**: Hiển thị dạng lưới với card đẹp mắt
- **List View**: Hiển thị dạng danh sách chi tiết
- Badge màu sắc theo độ khó:
  - 🟢 Dễ (DE) - Màu xanh lá
  - 🟡 Trung bình (TRUNG_BINH) - Màu vàng
  - 🔴 Khó (KHO) - Màu đỏ

### 2. Tạo/Chỉnh Sửa Template
**Form bao gồm:**
- Tên template (bắt buộc)
- Mô tả chi tiết
- Loại buổi tập
- Độ khó (dropdown)
- Danh sách bài tập

**Quản lý bài tập:**
- Modal chọn bài tập từ danh sách có sẵn
- Checkbox để chọn/bỏ chọn
- Hiển thị số thứ tự bài tập
- Xóa bài tập khỏi template

### 3. Xóa Template
- Modal xác nhận trước khi xóa
- Hiển thị tên template đang xóa
- Cảnh báo không thể hoàn tác

### 4. Tìm Kiếm & Lọc
- Tìm kiếm theo tên hoặc mô tả
- Lọc theo độ khó (Tất cả, Dễ, Trung bình, Khó)
- Kết hợp nhiều điều kiện

## Mock Data

### Templates Mẫu
```javascript
[
    {
        ten: "Tập ngực - Vai - Tay sau",
        doKho: "TRUNG_BINH",
        loai: "Strength Training",
        baiTap: [Bench Press, Dumbbell Fly, Shoulder Press, ...]
    },
    {
        ten: "Tập lưng - Tay trước",
        doKho: "KHO",
        loai: "Strength Training",
        baiTap: [Deadlift, Pull Up, Barbell Row, ...]
    },
    {
        ten: "Cardio & Core",
        doKho: "DE",
        loai: "Cardio",
        baiTap: [Running, Plank, Crunches]
    }
]
```

### Exercises Mẫu
18 bài tập được nhóm theo nhóm cơ:
- Ngực: Bench Press, Dumbbell Fly, Push Ups
- Vai: Shoulder Press, Lateral Raise
- Tay sau: Tricep Dips
- Lưng: Deadlift, Pull Up, Barbell Row
- Tay trước: Bicep Curl
- Chân: Squat, Leg Press, Lunges, Calf Raise
- Core: Plank, Crunches, Mountain Climbers
- Cardio: Running

## Chuyển Sang API Thật

### 1. Uncomment các API calls trong code:
```javascript
// Lấy danh sách templates
const response = await ptService.getTemplates({
    page: 1,
    limit: 20,
    search: searchTerm,
    doKho: filterDifficulty !== 'all' ? filterDifficulty : undefined
});

// Tạo template
const response = await ptService.createTemplate(formData);

// Cập nhật template
const response = await ptService.updateTemplate(selectedTemplate._id, formData);

// Xóa template
const response = await ptService.deleteTemplate(selectedTemplate._id);
```

### 2. Comment/xóa mock data:
```javascript
// Xóa hoặc comment các phần sau:
// - mockTemplates
// - mockExercises
// - setTimeout trong fetchTemplates
```

### 3. Lấy danh sách bài tập từ API:
Cần thêm API endpoint để lấy danh sách bài tập:
```javascript
// Trong pt.service.js
getExercises: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.search) queryParams.append('search', params.search);
    if (params.nhomCo) queryParams.append('nhomCo', params.nhomCo);
    
    const queryString = queryParams.toString();
    return apiRequest(`/baitap${queryString ? `?${queryString}` : ''}`, {
        method: 'GET'
    });
}
```

## UI/UX Features

### Design System
- **Màu chủ đạo**: 
  - Background: #0a0a0a, #141414, #1a1a1a
  - Primary: #da2128 (đỏ)
  - Border: #2a2a2a
  
- **Typography**:
  - Tiêu đề: text-3xl font-bold
  - Mô tả: text-gray-400
  - Label: text-sm font-medium

### Interactions
- Hover effects trên cards
- Smooth transitions (300ms ease-out)
- Modal với backdrop blur
- Loading states với spinner
- Empty states với icon và message

### Responsive
- Grid tự động điều chỉnh: 1 cột (mobile) → 2 cột (tablet) → 3 cột (desktop)
- Sidebar collapse/expand
- Touch-friendly buttons

## Best Practices

1. **Validation**:
   - Tên template là bắt buộc
   - Kiểm tra độ dài input
   - Xác nhận trước khi xóa

2. **Error Handling**:
   - Try-catch cho tất cả API calls
   - Hiển thị thông báo lỗi rõ ràng
   - Fallback UI khi có lỗi

3. **Performance**:
   - Lazy loading cho danh sách dài
   - Debounce search input
   - Optimistic UI updates

4. **Accessibility**:
   - Semantic HTML
   - Keyboard navigation
   - Screen reader friendly

## Workflow Sử Dụng

### Tạo Template Mới
1. Click "Tạo Template Mới"
2. Nhập tên, mô tả, loại, độ khó
3. Click "Thêm Bài Tập"
4. Chọn bài tập từ danh sách
5. Click "Xong" để đóng modal chọn bài tập
6. Click "Tạo Template" để lưu

### Chỉnh Sửa Template
1. Click nút "Sửa" trên template card
2. Cập nhật thông tin
3. Thêm/xóa bài tập nếu cần
4. Click "Lưu Thay Đổi"

### Xóa Template
1. Click nút "Xóa" trên template card
2. Xác nhận trong modal
3. Click "Xóa" để hoàn tất

## Integration với Các Màn Hình Khác

### PTSessions (Buổi Tập)
- Sử dụng template để tạo buổi tập nhanh
- Copy danh sách bài tập từ template

### PTStudentDetail (Chi Tiết Học Viên)
- Gán template cho học viên
- Theo dõi tiến độ theo template

### PTAssignExercises (Gán Bài Tập)
- Sử dụng template làm gợi ý
- Quick assign từ template

## Notes
- Mock data được sử dụng để demo
- Khi có API thật, uncomment các API calls
- Icon và màu sắc tuân theo design system của dự án
- Responsive design cho mobile/tablet/desktop
