import { API_CONFIG } from '../constants/api';
const API_BASE_URL = API_CONFIG.BASE_URL;
export const API_ENDPOINTS = {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    FORGOT_PASSWORD: '/auth/forgot-password',
    VERIFY_OTP: '/auth/verify-otp',
    RESET_PASSWORD: '/auth/reset-password',
    CHANGE_PASSWORD: '/auth/change-password',
    GET_PROFILE: '/user/profile',
    UPDATE_PROFILE: '/user/update-profile',
    GET_PACKAGES: '/goitap',
    GET_PACKAGE_BY_ID: '/goitap',
    REGISTER_PACKAGE: '/chitietgoitap/dangky',
    GET_MY_PACKAGES: '/chitietgoitap/hoivien',
    GET_ACTIVE_PACKAGE: '/chitietgoitap/hoi-vien',
    GET_WORKOUTS: '/baitap',
    GET_WORKOUT_BY_ID: '/baitap',
    GET_WORKOUT_SESSIONS: '/buoitap/hoivien',
    COMPLETE_WORKOUT: '/buoitap',
    GET_NUTRITION_SUGGESTIONS: '/dinhduong/goi-y',
    CREATE_NUTRITION_SUGGESTION: '/dinhduong/goi-y',
    GET_MENU: '/dinhduong/thuc-don',
    CREATE_MENU: '/dinhduong/thuc-don',
    GET_BODY_METRICS: '/chisocothe',
    CREATE_BODY_METRICS: '/chisocothe',
    UPDATE_BODY_METRICS: '/chisocothe',
    GET_WORKOUT_PREDICTION: '/workout-prediction/du-bao-thoi-gian-va-phuong-phap',
    GET_WORKOUT_EFFECTIVENESS: '/workout-prediction/du-bao-hieu-qua',
    SEND_MESSAGE: '/chatbot/send-message',
    GET_CHAT_HISTORY: '/chatbot/history',
    GET_PAYMENTS: '/thanhtoan',
    CREATE_PAYMENT: '/thanhtoan',
    CONFIRM_PAYMENT: '/thanhtoan',
};
export const getApiUrl = (endpoint) => {
    return `${API_BASE_URL}${endpoint}`;
};
export const getAuthHeaders = (includeAuth = true) => {
    const headers = {
        'Content-Type': 'application/json'
    };
    if (includeAuth) {
        const token = localStorage.getItem('token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }
    return headers;
};
export const apiRequest = async (endpoint, options = {}) => {
    const url = getApiUrl(endpoint);
    const { requireAuth = true, allow404 = false, ...restOptions } = options;
    const defaultOptions = {
        headers: getAuthHeaders(requireAuth),
        credentials: 'include',
    };
    const config = {
        ...defaultOptions,
        ...restOptions,
        headers: {
            ...defaultOptions.headers,
            ...restOptions.headers,
        },
    };
    try {
        const response = await fetch(url, config);
        if (response.type === 'opaque' || response.status === 0) {
            throw new Error('CORS error: Unable to connect to server. Please check your network connection and server status.');
        }
        let data = null;
        try {
            data = await response.json();
        } catch (_) {
            data = null;
        }
        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                throw new Error('Session expired. Please login again.');
            }
            if (response.status === 403) {
                throw new Error('Access denied. You do not have permission to perform this action.');
            }
            if (response.status === 404 && allow404) {
                return null;
            }
            if (response.status === 404) {
                throw new Error('Resource not found.');
            }
            if (response.status >= 500) {
                throw new Error('Server error. Please try again later.');
            }
            throw new Error(data.message || `API request failed with status ${response.status}`);
        }
        return data;
    } catch (error) {
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('Network error: Unable to connect to server. Please check your internet connection.');
        }
        throw error;
    }
};
export const authAPI = {
    login: async (credentials) => {
        return apiRequest(API_ENDPOINTS.LOGIN, {
            method: 'POST',
            body: JSON.stringify(credentials),
            headers: getAuthHeaders(false),
        });
    },
    register: async (userData) => {
        return apiRequest(API_ENDPOINTS.REGISTER, {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    },
    forgotPassword: async (phone) => {
        return apiRequest(API_ENDPOINTS.FORGOT_PASSWORD, {
            method: 'POST',
            body: JSON.stringify({ sdt: phone }),
        });
    },
    verifyOtp: async (phone, otp) => {
        return apiRequest(API_ENDPOINTS.VERIFY_OTP, {
            method: 'POST',
            body: JSON.stringify({ sdt: phone, otp }),
        });
    },
    resetPassword: async (phone, otp, newPassword) => {
        return apiRequest(API_ENDPOINTS.RESET_PASSWORD, {
            method: 'POST',
            body: JSON.stringify({ sdt: phone, otp, matKhauMoi: newPassword }),
        });
    },
    changePassword: async (currentPassword, newPassword) => {
        return apiRequest(API_ENDPOINTS.CHANGE_PASSWORD, {
            method: 'POST',
            body: JSON.stringify({ currentPassword, newPassword }),
        });
    },
};
export const userAPI = {
    getProfile: async () => {
        return apiRequest(API_ENDPOINTS.GET_PROFILE);
    },
    getUserWithRank: async (userId) => {
        return apiRequest(`/user/${userId}/with-rank`);
    },
    updateProfile: async (userData) => {
        return apiRequest(API_ENDPOINTS.UPDATE_PROFILE, {
            method: 'PUT',
            body: JSON.stringify(userData),
        });
    },
};
export const packageAPI = {
    getPackages: async () => {
        return apiRequest(API_ENDPOINTS.GET_PACKAGES);
    },
    getPackageById: async (id) => {
        return apiRequest(`${API_ENDPOINTS.GET_PACKAGE_BY_ID}/${id}`);
    },
    registerPackage: async (packageId) => {
        return apiRequest(API_ENDPOINTS.REGISTER_PACKAGE, {
            method: 'POST',
            body: JSON.stringify({ maGoiTap: packageId }),
        });
    },
    getMyPackages: async (memberId) => {
        return apiRequest(`${API_ENDPOINTS.GET_MY_PACKAGES}/${memberId}`);
    },
    getActivePackage: async (memberId) => {
        return apiRequest(`${API_ENDPOINTS.GET_ACTIVE_PACKAGE}/${memberId}/active`);
    },
};
export const workoutAPI = {
    getWorkouts: async () => {
        return apiRequest(API_ENDPOINTS.GET_WORKOUTS);
    },
    getWorkoutById: async (id) => {
        return apiRequest(`${API_ENDPOINTS.GET_WORKOUT_BY_ID}/${id}`);
    },
    getWorkoutSessions: async (memberId, status = null) => {
        const url = status
            ? `${API_ENDPOINTS.GET_WORKOUT_SESSIONS}/${memberId}?trangThai=${status}`
            : `${API_ENDPOINTS.GET_WORKOUT_SESSIONS}/${memberId}`;
        return apiRequest(url);
    },
    completeWorkout: async (sessionId) => {
        return apiRequest(`${API_ENDPOINTS.COMPLETE_WORKOUT}/${sessionId}/hoanthanh`, {
            method: 'PUT',
        });
    },
};
export const nutritionAPI = {
    getNutritionSuggestions: async (memberId, options = {}) => {
        const queryParams = new URLSearchParams(options).toString();
        const url = queryParams
            ? `${API_ENDPOINTS.GET_NUTRITION_SUGGESTIONS}/${memberId}?${queryParams}`
            : `${API_ENDPOINTS.GET_NUTRITION_SUGGESTIONS}/${memberId}`;
        return apiRequest(url);
    },
    createNutritionSuggestion: async (memberId, goal, additionalInfo = {}) => {
        return apiRequest(API_ENDPOINTS.CREATE_NUTRITION_SUGGESTION, {
            method: 'POST',
            body: JSON.stringify({
                maHoiVien: memberId,
                mucTieu: goal,
                thongTinThem: additionalInfo,
            }),
        });
    },
    getMenu: async (memberId, options = {}) => {
        const queryParams = new URLSearchParams(options).toString();
        const url = queryParams
            ? `${API_ENDPOINTS.GET_MENU}/${memberId}?${queryParams}`
            : `${API_ENDPOINTS.GET_MENU}/${memberId}`;
        return apiRequest(url);
    },
    createMenu: async (memberId, goal, menuType = 'TUAN') => {
        return apiRequest(API_ENDPOINTS.CREATE_MENU, {
            method: 'POST',
            body: JSON.stringify({
                maHoiVien: memberId,
                mucTieu: goal,
                loaiThucDon: menuType,
            }),
        });
    },
};
export const bodyMetricsAPI = {
    getBodyMetrics: async (memberId, limit = null) => {
        const url = limit
            ? `${API_ENDPOINTS.GET_BODY_METRICS}/hoivien/${memberId}?limit=${limit}`
            : `${API_ENDPOINTS.GET_BODY_METRICS}/hoivien/${memberId}`;
        return apiRequest(url);
    },
    createBodyMetrics: async (metricsData) => {
        return apiRequest(API_ENDPOINTS.CREATE_BODY_METRICS, {
            method: 'POST',
            body: JSON.stringify(metricsData),
        });
    },
    updateBodyMetrics: async (id, metricsData) => {
        return apiRequest(`${API_ENDPOINTS.UPDATE_BODY_METRICS}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(metricsData),
        });
    },
};
export const workoutPredictionAPI = {
    getWorkoutPrediction: async (memberId, goal, sessionsPerWeek) => {
        return apiRequest(API_ENDPOINTS.GET_WORKOUT_PREDICTION, {
            method: 'POST',
            body: JSON.stringify({
                hoiVienId: memberId,
                mucTieu: goal,
                soBuoiTapTuan: sessionsPerWeek,
            }),
        });
    },
    getWorkoutEffectiveness: async (memberId, workoutTime, sessionsPerWeek) => {
        return apiRequest(API_ENDPOINTS.GET_WORKOUT_EFFECTIVENESS, {
            method: 'POST',
            body: JSON.stringify({
                hoiVienId: memberId,
                thoiGianTap: workoutTime,
                soBuoiTapTuan: sessionsPerWeek,
            }),
        });
    },
};
export const chatbotAPI = {
    sendMessage: async (message) => {
        return apiRequest(API_ENDPOINTS.SEND_MESSAGE, {
            method: 'POST',
            body: JSON.stringify({ message }),
        });
    },
    getChatHistory: async (limit = 50) => {
        return apiRequest(`${API_ENDPOINTS.GET_CHAT_HISTORY}?limit=${limit}`);
    },
};
export const paymentAPI = {
    getPayments: async (memberId) => {
        return apiRequest(`${API_ENDPOINTS.GET_PAYMENTS}/hoivien/${memberId}`);
    },
    createPayment: async (paymentData) => {
        return apiRequest(API_ENDPOINTS.CREATE_PAYMENT, {
            method: 'POST',
            body: JSON.stringify(paymentData),
        });
    },
    confirmPayment: async (paymentId) => {
        return apiRequest(`${API_ENDPOINTS.CONFIRM_PAYMENT}/${paymentId}/confirm`, {
            method: 'PUT',
        });
    },
};

export const api = {
    get: async (path, query = {}, options = {}) => {
        const queryString = new URLSearchParams(query).toString();
        const url = queryString ? `${path}?${queryString}` : path;
        return apiRequest(url, options);
        return apiRequest(url, normalizedOptions);
    },
    post: async (path, body = {}, options = {}) => {
        const normalizedOptions = typeof options === 'boolean' ? { requireAuth: options } : options;
        return apiRequest(path, {
            method: 'POST',
            body: JSON.stringify(body),
            ...normalizedOptions
        });
    },
    put: async (path, body = {}, options = {}) => {
        const normalizedOptions = typeof options === 'boolean' ? { requireAuth: options } : options;
        return apiRequest(path, {
            method: 'PUT',
            body: JSON.stringify(body),
            ...normalizedOptions
        });
    },
    patch: async (path, body = {}, options = {}) => {
        const normalizedOptions = typeof options === 'boolean' ? { requireAuth: options } : options;
        return apiRequest(path, {
            method: 'PATCH',
            body: JSON.stringify(body),
            ...normalizedOptions
        });
    },
    delete: async (path, options = {}) => {
        const normalizedOptions = typeof options === 'boolean' ? { requireAuth: options } : options;
        return apiRequest(path, {
            method: 'DELETE',
            ...normalizedOptions
        });
    }
};

export default {
    API_ENDPOINTS,
    getApiUrl,
    getAuthHeaders,
    apiRequest,
    authAPI,
    userAPI,
    packageAPI,
    workoutAPI,
    nutritionAPI,
    bodyMetricsAPI,
    workoutPredictionAPI,
    chatbotAPI,
    paymentAPI,
    api,
};