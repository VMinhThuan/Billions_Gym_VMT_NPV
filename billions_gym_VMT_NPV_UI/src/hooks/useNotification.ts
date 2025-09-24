import { useNotification as useNotificationContext } from '../contexts/NotificationContext';

// Custom hook for CRUD operations with predefined messages
export const useCrudNotifications = () => {
  const notification = useNotificationContext();

  return {
    // Member (Hội viên) notifications
    member: {
      createSuccess: () => notification.showCreateSuccess('hội viên'),
      updateSuccess: () => notification.showUpdateSuccess('hội viên'),
      deleteSuccess: () => notification.showDeleteSuccess('hội viên'),
      createError: (error?: string) => notification.showCreateError('hội viên', error),
      updateError: (error?: string) => notification.showUpdateError('hội viên', error),
      deleteError: (error?: string) => notification.showDeleteError('hội viên', error),
    },

    // Personal Trainer (PT) notifications
    trainer: {
      createSuccess: () => notification.showCreateSuccess('huấn luyện viên'),
      updateSuccess: () => notification.showUpdateSuccess('huấn luyện viên'),
      deleteSuccess: () => notification.showDeleteSuccess('huấn luyện viên'),
      createError: (error?: string) => notification.showCreateError('huấn luyện viên', error),
      updateError: (error?: string) => notification.showUpdateError('huấn luyện viên', error),
      deleteError: (error?: string) => notification.showDeleteError('huấn luyện viên', error),
    },

    // Package (Gói tập) notifications
    package: {
      createSuccess: () => notification.showCreateSuccess('gói tập'),
      updateSuccess: () => notification.showUpdateSuccess('gói tập'),
      deleteSuccess: () => notification.showDeleteSuccess('gói tập'),
      createError: (error?: string) => notification.showCreateError('gói tập', error),
      updateError: (error?: string) => notification.showUpdateError('gói tập', error),
      deleteError: (error?: string) => notification.showDeleteError('gói tập', error),
    },

    // Schedule (Lịch tập) notifications
    schedule: {
      createSuccess: () => notification.showCreateSuccess('lịch tập'),
      updateSuccess: () => notification.showUpdateSuccess('lịch tập'),
      deleteSuccess: () => notification.showDeleteSuccess('lịch tập'),
      createError: (error?: string) => notification.showCreateError('lịch tập', error),
      updateError: (error?: string) => notification.showUpdateError('lịch tập', error),
      deleteError: (error?: string) => notification.showDeleteError('lịch tập', error),
    },

    // Exercise (Bài tập) notifications
    exercise: {
      createSuccess: () => notification.showCreateSuccess('bài tập'),
      updateSuccess: () => notification.showUpdateSuccess('bài tập'),
      deleteSuccess: () => notification.showDeleteSuccess('bài tập'),
      createError: (error?: string) => notification.showCreateError('bài tập', error),
      updateError: (error?: string) => notification.showUpdateError('bài tập', error),
      deleteError: (error?: string) => notification.showDeleteError('bài tập', error),
    },

    // Equipment (Thiết bị) notifications
    equipment: {
      createSuccess: () => notification.showCreateSuccess('thiết bị'),
      updateSuccess: () => notification.showUpdateSuccess('thiết bị'),
      deleteSuccess: () => notification.showDeleteSuccess('thiết bị'),
      createError: (error?: string) => notification.showCreateError('thiết bị', error),
      updateError: (error?: string) => notification.showUpdateError('thiết bị', error),
      deleteError: (error?: string) => notification.showDeleteError('thiết bị', error),
    },

    // Account (Tài khoản) notifications
    account: {
      createSuccess: () => notification.showCreateSuccess('tài khoản'),
      updateSuccess: () => notification.showUpdateSuccess('tài khoản'),
      deleteSuccess: () => notification.showDeleteSuccess('tài khoản'),
      createError: (error?: string) => notification.showCreateError('tài khoản', error),
      updateError: (error?: string) => notification.showUpdateError('tài khoản', error),
      deleteError: (error?: string) => notification.showDeleteError('tài khoản', error),
    },

    // Generic notifications
    generic: {
      success: (title: string, message?: string) => notification.showSuccess(title, message),
      error: (title: string, message?: string) => notification.showError(title, message),
      warning: (title: string, message?: string) => notification.showWarning(title, message),
      info: (title: string, message?: string) => notification.showInfo(title, message),
    },

    // Authentication notifications
    auth: {
      loginSuccess: () => notification.showSuccess('Đăng nhập thành công!', 'Chào mừng bạn quay trở lại.'),
      loginError: (error?: string) => notification.showError('Đăng nhập thất bại', error || 'Vui lòng kiểm tra thông tin đăng nhập.'),
      logoutSuccess: () => notification.showInfo('Đăng xuất thành công', 'Hẹn gặp lại bạn!'),
      passwordChanged: () => notification.showSuccess('Đổi mật khẩu thành công!', 'Mật khẩu của bạn đã được cập nhật.'),
      passwordError: (error?: string) => notification.showError('Không thể đổi mật khẩu', error),
    },

    // Data operations
    data: {
      saveSuccess: () => notification.showSuccess('Lưu dữ liệu thành công!', 'Thông tin đã được lưu vào hệ thống.'),
      saveError: (error?: string) => notification.showError('Không thể lưu dữ liệu', error || 'Có lỗi xảy ra khi lưu. Vui lòng thử lại.'),
      loadError: (error?: string) => notification.showError('Không thể tải dữ liệu', error || 'Có lỗi xảy ra khi tải dữ liệu.'),
      exportSuccess: () => notification.showSuccess('Xuất dữ liệu thành công!', 'File đã được tải xuống.'),
      exportError: (error?: string) => notification.showError('Không thể xuất dữ liệu', error),
      importSuccess: () => notification.showSuccess('Nhập dữ liệu thành công!', 'Dữ liệu đã được nhập vào hệ thống.'),
      importError: (error?: string) => notification.showError('Không thể nhập dữ liệu', error),
    },

    // Network operations
    network: {
      connectionError: () => notification.showError('Lỗi kết nối', 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.'),
      timeoutError: () => notification.showError('Hết thời gian chờ', 'Yêu cầu mất quá nhiều thời gian. Vui lòng thử lại.'),
      serverError: () => notification.showError('Lỗi máy chủ', 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.'),
    }
  };
};

// Re-export the main hook for direct access
export { useNotification } from '../contexts/NotificationContext';
