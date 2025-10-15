export const API_CONFIG = {
    BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
    TIMEOUT: 10000,
    RETRY_ATTEMPTS: 3,
};

export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
};

// API Response Messages
export const API_MESSAGES = {
    SUCCESS: 'Thành công',
    ERROR: 'Có lỗi xảy ra',
    NETWORK_ERROR: 'Lỗi kết nối mạng',
    TIMEOUT_ERROR: 'Hết thời gian chờ',
    UNAUTHORIZED: 'Không có quyền truy cập',
    NOT_FOUND: 'Không tìm thấy dữ liệu',
    VALIDATION_ERROR: 'Dữ liệu không hợp lệ',
};

// Validation Patterns
export const VALIDATION_PATTERNS = {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE_VIETNAM: /^(\+84|84|0)[1-9][0-9]{8}$/,
    PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
    NAME: /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂÂĐÊÔƠưăâđêôơ\s]+$/,
};

// User Roles
export const USER_ROLES = {
    HOI_VIEN: 'HoiVien',
    PT: 'PT',
    ONG_CHU: 'OngChu',
    ADMIN: 'Admin',
};

// Package Status
export const PACKAGE_STATUS = {
    DANG_HOAT_DONG: 'DANG_HOAT_DONG',
    HET_HAN: 'HET_HAN',
    DA_HUY: 'DA_HUY',
    DA_NANG_CAP: 'DA_NANG_CAP',
};

// Payment Status
export const PAYMENT_STATUS = {
    CHUA_THANH_TOAN: 'CHUA_THANH_TOAN',
    DA_THANH_TOAN: 'DA_THANH_TOAN',
    DA_HUY: 'DA_HUY',
    CHO_XU_LY: 'CHO_XU_LY',
};

// Workout Goals
export const WORKOUT_GOALS = {
    GIAM_CAN: 'GIAM_CAN',
    TANG_CO_BAP: 'TANG_CO_BAP',
    TANG_CAN: 'TANG_CAN',
    DUY_TRI: 'DUY_TRI',
    GIAM_MO: 'GIAM_MO',
};

// Nutrition Goals
export const NUTRITION_GOALS = {
    TANG_CAN: 'TANG_CAN',
    GIAM_CAN: 'GIAM_CAN',
    DUY_TRI: 'DUY_TRI',
    TANG_CO_BAP: 'TANG_CO_BAP',
    GIAM_MO: 'GIAM_MO',
};

// Activity Levels
export const ACTIVITY_LEVELS = {
    IT_HOAT_DONG: 'IT_HOAT_DONG',
    HOAT_DONG_NHE: 'HOAT_DONG_NHE',
    HOAT_DONG_VUA: 'HOAT_DONG_VUA',
    HOAT_DONG_MANH: 'HOAT_DONG_MANH',
};

// Menu Types
export const MENU_TYPES = {
    TUAN: 'TUAN',
    THANG: 'THANG',
};

// Suggestion Status
export const SUGGESTION_STATUS = {
    MOI: 'MOI',
    DA_XEM: 'DA_XEM',
    DANG_AP_DUNG: 'DANG_AP_DUNG',
    DA_HOAN_THANH: 'DA_HOAN_THANH',
};

// Local Storage Keys
export const STORAGE_KEYS = {
    TOKEN: 'token',
    USER: 'user',
    LANGUAGE: 'language',
    THEME: 'theme',
};

export const DEFAULT_VALUES = {
    PAGE_SIZE: 10,
    MAX_RETRY: 3,
    DEBOUNCE_DELAY: 300,
    ANIMATION_DURATION: 300,
};

// Error Codes
export const ERROR_CODES = {
    NETWORK_ERROR: 'NETWORK_ERROR',
    TIMEOUT_ERROR: 'TIMEOUT_ERROR',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    AUTH_ERROR: 'AUTH_ERROR',
    PERMISSION_ERROR: 'PERMISSION_ERROR',
    NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
    SERVER_ERROR: 'SERVER_ERROR',
};