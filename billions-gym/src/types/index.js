// User types
export const USER_ROLES = {
    MEMBER: 'member',
    TRAINER: 'trainer',
    ADMIN: 'admin',
};

export const USER_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    SUSPENDED: 'suspended',
};

// Membership types
export const MEMBERSHIP_TYPES = {
    BASIC: 'basic',
    PREMIUM: 'premium',
    VIP: 'vip',
};

export const MEMBERSHIP_STATUS = {
    ACTIVE: 'active',
    EXPIRED: 'expired',
    CANCELLED: 'cancelled',
};

export const CLASS_TYPES = {
    YOGA: 'yoga',
    PILATES: 'pilates',
    CARDIO: 'cardio',
    STRENGTH: 'strength',
    DANCE: 'dance',
    MARTIAL_ARTS: 'martial_arts',
};

export const CLASS_STATUS = {
    SCHEDULED: 'scheduled',
    ONGOING: 'ongoing',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
};

export const EQUIPMENT_TYPES = {
    CARDIO: 'cardio',
    STRENGTH: 'strength',
    FUNCTIONAL: 'functional',
    FREE_WEIGHTS: 'free_weights',
};

export const PAYMENT_METHODS = {
    CREDIT_CARD: 'credit_card',
    DEBIT_CARD: 'debit_card',
    BANK_TRANSFER: 'bank_transfer',
    CASH: 'cash',
};

export const PAYMENT_STATUS = {
    PENDING: 'pending',
    COMPLETED: 'completed',
    FAILED: 'failed',
    REFUNDED: 'refunded',
};

export const API_STATUS = {
    SUCCESS: 'success',
    ERROR: 'error',
    LOADING: 'loading',
};

export const VALIDATION_TYPES = {
    REQUIRED: 'required',
    EMAIL: 'email',
    PHONE: 'phone',
    PASSWORD: 'password',
    URL: 'url',
    NUMBER: 'number',
    DATE: 'date',
};

export const NOTIFICATION_TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info',
};

export const THEME_MODES = {
    LIGHT: 'light',
    DARK: 'dark',
    SYSTEM: 'system',
};

export const PAGINATION_DEFAULT = {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
};

export const SORT_ORDERS = {
    ASC: 'asc',
    DESC: 'desc',
};

export const TYPES = {
    USER_ROLES,
    USER_STATUS,
    MEMBERSHIP_TYPES,
    MEMBERSHIP_STATUS,
    CLASS_TYPES,
    CLASS_STATUS,
    EQUIPMENT_TYPES,
    PAYMENT_METHODS,
    PAYMENT_STATUS,
    API_STATUS,
    VALIDATION_TYPES,
    NOTIFICATION_TYPES,
    THEME_MODES,
    PAGINATION_DEFAULT,
    SORT_ORDERS,
};
