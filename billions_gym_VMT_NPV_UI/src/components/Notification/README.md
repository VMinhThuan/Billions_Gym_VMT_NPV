# Hệ Thống Thông Báo - Billions Gym

Hệ thống thông báo toàn diện cho ứng dụng Billions Gym với các tính năng:
- Thông báo đa dạng (success, error, warning, info)
- Hỗ trợ nhiều thông báo cùng lúc
- Tự động đóng với thanh tiến trình
- Animations mượt mà
- Responsive design
- Các helper functions cho CRUD operations

## Cách Sử Dụng

### 1. Cài Đặt Cơ Bản

Đảm bảo `NotificationProvider` được wrap ở root level của ứng dụng:

```tsx
import { NotificationProvider } from './contexts/NotificationContext';

function App() {
  return (
    <NotificationProvider>
      {/* Your app components */}
    </NotificationProvider>
  );
}
```

### 2. Sử Dụng Hook Cơ Bản

```tsx
import { useNotification } from '../hooks/useNotification';

function MyComponent() {
  const { showSuccess, showError, showWarning, showInfo } = useNotification();

  const handleAction = () => {
    showSuccess('Thành công!', 'Dữ liệu đã được lưu.');
    showError('Lỗi!', 'Không thể kết nối đến server.');
    showWarning('Cảnh báo!', 'Dữ liệu sẽ bị mất nếu không lưu.');
    showInfo('Thông tin', 'Phiên bản mới đã có sẵn.');
  };

  return <button onClick={handleAction}>Test Notifications</button>;
}
```

### 3. Sử Dụng CRUD Notifications

```tsx
import { useCrudNotifications } from '../hooks/useNotification';

function MemberManagement() {
  const notifications = useCrudNotifications();

  const createMember = async (memberData) => {
    try {
      await api.post('/api/members', memberData);
      notifications.member.createSuccess();
    } catch (error) {
      notifications.member.createError(error.message);
    }
  };

  const updateMember = async (id, memberData) => {
    try {
      await api.put(`/api/members/${id}`, memberData);
      notifications.member.updateSuccess();
    } catch (error) {
      notifications.member.updateError(error.message);
    }
  };

  const deleteMember = async (id) => {
    try {
      await api.delete(`/api/members/${id}`);
      notifications.member.deleteSuccess();
    } catch (error) {
      notifications.member.deleteError(error.message);
    }
  };
}
```

### 4. Các Loại CRUD Notifications Có Sẵn

#### Hội Viên (Members)
```tsx
notifications.member.createSuccess();
notifications.member.updateSuccess();
notifications.member.deleteSuccess();
notifications.member.createError('Lỗi tạo hội viên');
notifications.member.updateError('Lỗi cập nhật hội viên');
notifications.member.deleteError('Lỗi xóa hội viên');
```

#### Huấn Luyện Viên (Trainers)
```tsx
notifications.trainer.createSuccess();
notifications.trainer.updateSuccess();
notifications.trainer.deleteSuccess();
```

#### Gói Tập (Packages)
```tsx
notifications.package.createSuccess();
notifications.package.updateSuccess();
notifications.package.deleteSuccess();
```

#### Lịch Tập (Schedules)
```tsx
notifications.schedule.createSuccess();
notifications.schedule.updateSuccess();
notifications.schedule.deleteSuccess();
```

#### Bài Tập (Exercises)
```tsx
notifications.exercise.createSuccess();
notifications.exercise.updateSuccess();
notifications.exercise.deleteSuccess();
```

#### Thiết Bị (Equipment)
```tsx
notifications.equipment.createSuccess();
notifications.equipment.updateSuccess();
notifications.equipment.deleteSuccess();
```

#### Tài Khoản (Accounts)
```tsx
notifications.account.createSuccess();
notifications.account.updateSuccess();
notifications.account.deleteSuccess();
```

### 5. Authentication Notifications

```tsx
// Đăng nhập thành công
notifications.auth.loginSuccess();

// Đăng nhập thất bại
notifications.auth.loginError('Sai tên đăng nhập hoặc mật khẩu');

// Đăng xuất
notifications.auth.logoutSuccess();

// Đổi mật khẩu
notifications.auth.passwordChanged();
notifications.auth.passwordError('Mật khẩu cũ không đúng');
```

### 6. Data Operations

```tsx
// Lưu dữ liệu
notifications.data.saveSuccess();
notifications.data.saveError('Không thể lưu dữ liệu');

// Tải dữ liệu
notifications.data.loadError('Không thể tải dữ liệu từ server');

// Xuất/Nhập dữ liệu
notifications.data.exportSuccess();
notifications.data.importSuccess();
notifications.data.exportError('Lỗi xuất file');
notifications.data.importError('File không hợp lệ');
```

### 7. Network Operations

```tsx
// Lỗi kết nối
notifications.network.connectionError();

// Timeout
notifications.network.timeoutError();

// Lỗi server
notifications.network.serverError();
```

### 8. Generic Notifications

```tsx
// Thông báo tùy chỉnh
notifications.generic.success('Tiêu đề', 'Nội dung thông báo');
notifications.generic.error('Lỗi', 'Mô tả lỗi chi tiết');
notifications.generic.warning('Cảnh báo', 'Nội dung cảnh báo');
notifications.generic.info('Thông tin', 'Thông tin bổ sung');
```

## Tùy Chỉnh

### Thời Gian Hiển Thị

```tsx
// Thông báo tự đóng sau 3 giây
showSuccess('Thành công!', 'Nội dung', 3000);

// Thông báo không tự đóng (duration = 0)
showError('Lỗi nghiêm trọng!', 'Vui lòng liên hệ admin', 0);
```

### Styling

Các class CSS có thể tùy chỉnh trong `Notification.css`:

- `.notification--success`: Thông báo thành công (màu xanh)
- `.notification--error`: Thông báo lỗi (màu đỏ)
- `.notification--warning`: Thông báo cảnh báo (màu vàng)
- `.notification--info`: Thông báo thông tin (màu xanh dương)

### Responsive

Hệ thống tự động responsive:
- Desktop: Hiển thị ở góc trên bên phải
- Mobile: Hiển thị full width với margin nhỏ

## Ví Dụ Hoàn Chỉnh

```tsx
import React, { useState } from 'react';
import { useCrudNotifications } from '../hooks/useNotification';
import { api } from '../services/api';

function MemberForm() {
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const notifications = useCrudNotifications();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate form
      if (!formData.hoTen || !formData.sdt) {
        notifications.generic.warning(
          'Thiếu thông tin', 
          'Vui lòng điền đầy đủ họ tên và số điện thoại.'
        );
        return;
      }

      // Create member
      const result = await api.post('/api/members', formData);
      
      if (result.success) {
        notifications.member.createSuccess();
        setFormData({}); // Reset form
      } else {
        throw new Error(result.message || 'Không thể tạo hội viên');
      }

    } catch (error) {
      console.error('Create member error:', error);
      
      // Handle specific errors
      if (error.message.includes('duplicate')) {
        notifications.member.createError('Số điện thoại đã được sử dụng');
      } else if (error.message.includes('network')) {
        notifications.network.connectionError();
      } else {
        notifications.member.createError(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Đang tạo...' : 'Tạo hội viên'}
      </button>
    </form>
  );
}
```

## Lưu Ý

1. **Performance**: Hệ thống tự động quản lý memory, không cần cleanup thủ công
2. **Accessibility**: Hỗ trợ keyboard navigation và screen readers
3. **Animation**: Có thể tắt animation với `prefers-reduced-motion`
4. **Multiple notifications**: Hỗ trợ hiển thị nhiều thông báo cùng lúc
5. **Auto-cleanup**: Thông báo tự động xóa khỏi DOM sau khi đóng

## Troubleshooting

### Thông báo không hiển thị
- Kiểm tra `NotificationProvider` đã được wrap đúng chưa
- Kiểm tra console có lỗi JavaScript không

### Styling không đúng
- Kiểm tra file CSS đã được import
- Kiểm tra z-index conflicts

### Performance issues
- Tránh tạo quá nhiều thông báo cùng lúc
- Sử dụng duration phù hợp để tự động cleanup
