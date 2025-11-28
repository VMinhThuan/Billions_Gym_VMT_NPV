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
    SEND_MESSAGE: '/ai/chat',
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
    const { requireAuth = true, allow404 = false, dontClearTokenOn401 = false, ...restOptions } = options;
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
                // If the request required auth, treat 401 as session expiration and clear local session
                // UNLESS dontClearTokenOn401 is true (for non-critical endpoints like watch-history)
                if (requireAuth && !dontClearTokenOn401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    throw new Error('Session expired. Please login again.');
                }
                // If dontClearTokenOn401 is true, just throw error without clearing token
                // If the request did not require auth (e.g. login), propagate backend message if present
                throw new Error((data && data.message) ? data.message : 'Unauthorized');
            }
            if (response.status === 400) {
                // For 400 errors, return the error response so caller can check result.success
                // This allows the caller to handle validation errors gracefully
                if (data && data.success === false) {
                    return data; // Return the error response object
                }
                throw new Error(data?.message || 'Bad request. Please check your input.');
            }
            if (response.status === 409) {
                // For 409 Conflict errors (e.g., duplicate phone/email), return the error response
                // This allows the caller to handle conflicts gracefully
                if (data && data.success === false) {
                    return data; // Return the error response object
                }
                throw new Error(data?.message || 'Conflict: This resource already exists.');
            }
            if (response.status === 403) {
                throw new Error(data?.message || 'Access denied. You do not have permission to perform this action.');
            }
            if (response.status === 404 && allow404) {
                return null;
            }
            if (response.status === 404) {
                throw new Error(data?.message || 'Resource not found.');
            }
            if (response.status >= 500) {
                // Log chi tiết lỗi server để debug
                console.error(`Server error (${response.status}):`, {
                    url,
                    status: response.status,
                    statusText: response.statusText,
                    data
                });
                // Nếu backend trả về message, dùng nó; nếu không, dùng message mặc định
                const errorMessage = data?.message || data?.error || 'Lỗi server. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.';
                throw new Error(errorMessage);
            }
            throw new Error(data?.message || `API request failed with status ${response.status}`);
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
            requireAuth: false,
            headers: getAuthHeaders(false),
        });
    },
    register: async (userData) => {
        return apiRequest(API_ENDPOINTS.REGISTER, {
            method: 'POST',
            requireAuth: false,
            body: JSON.stringify(userData),
        });
    },
    forgotPassword: async (phone) => {
        return apiRequest(API_ENDPOINTS.FORGOT_PASSWORD, {
            method: 'POST',
            requireAuth: false,
            body: JSON.stringify({ sdt: phone }),
        });
    },
    verifyOtp: async (phone, otp) => {
        return apiRequest(API_ENDPOINTS.VERIFY_OTP, {
            method: 'POST',
            requireAuth: false,
            body: JSON.stringify({ sdt: phone, otp }),
        });
    },
    resetPassword: async (phone, otp, newPassword) => {
        return apiRequest(API_ENDPOINTS.RESET_PASSWORD, {
            method: 'POST',
            requireAuth: false,
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
        return apiRequest(`${API_ENDPOINTS.GET_ACTIVE_PACKAGE}/${memberId}/active`, {
            allow404: true
        });
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
    // Generate nutrition plan với Gemini AI
    generatePlan: async (goal, calories, period, preferences = '', mealType = '', date = null) => {
        return apiRequest('/nutrition/plan', {
            method: 'POST',
            body: JSON.stringify({
                goal,
                calories: calories ? parseInt(calories, 10) : undefined,
                period,
                preferences,
                mealType,
                date: date || new Date().toISOString().split('T')[0]
            }),
        });
    },
    // Lấy plan mới nhất
    getLatestPlan: async () => {
        return apiRequest('/nutrition/plan/latest');
    },
    // Lịch sử mục tiêu dinh dưỡng đã tạo với AI
    getGoalHistory: async () => {
        return apiRequest('/nutrition/plan/history');
    },
    // Gợi ý calories dựa trên chỉ số cơ thể
    getRecommendedCalories: async (goal = '') => {
        const query = goal ? `?goal=${encodeURIComponent(goal)}` : '';
        return apiRequest(`/nutrition/plan/recommend-calories${query}`);
    },
    // Lấy tất cả meals từ database
    getAllMeals: async (params = {}) => {
        const queryParams = new URLSearchParams(params).toString();
        const url = queryParams ? `/nutrition/meals?${queryParams}` : '/nutrition/meals';
        return apiRequest(url);
    },
    // Lấy featured, popular, recommended meals
    getFeaturedMeals: async () => {
        return apiRequest('/nutrition/meals/featured');
    },
    // Thêm meal vào user meal plan
    addMealToPlan: async (mealId, mealType, date = null) => {
        return apiRequest('/nutrition/meals/add-to-plan', {
            method: 'POST',
            body: JSON.stringify({
                mealId,
                mealType,
                date: date || new Date().toISOString().split('T')[0]
            }),
        });
    },
    // Lấy user meal plan cho một ngày
    getMyMeals: async (date = null) => {
        const queryParams = date ? `?date=${date}` : '';
        return apiRequest(`/nutrition/my-meals${queryParams}`);
    },
    // Lấy user meal plan cho một tuần
    getMyMealsWeek: async (startDate = null) => {
        const queryParams = startDate ? `?startDate=${startDate}` : '';
        return apiRequest(`/nutrition/my-meals/week${queryParams}`);
    },
    // Xóa món ăn khỏi user meal plan
    removeMealFromPlan: async (date, mealType, mealIndex) => {
        return apiRequest('/nutrition/my-meals/remove', {
            method: 'DELETE',
            body: JSON.stringify({ date, mealType, mealIndex }),
        });
    },
    // Thêm món ăn vào ngày khác (duplicate)
    duplicateMeal: async (mealId, targetDate, mealType) => {
        return apiRequest('/nutrition/my-meals/duplicate', {
            method: 'POST',
            body: JSON.stringify({ mealId, targetDate, mealType }),
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
    sendMessage: async (message, conversationHistory = []) => {
        // Send message with optional conversation history
        // Backend can use conversationHistory for context if supported
        const payload = { message };
        if (conversationHistory && conversationHistory.length > 0) {
            payload.conversationHistory = conversationHistory;
        }
        return apiRequest(API_ENDPOINTS.SEND_MESSAGE, {
            method: 'POST',
            body: JSON.stringify(payload),
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

export const checkInAPI = {
    // Face enrollment
    enrollFace: async (encodings) => {
        return apiRequest('/face/enroll', {
            method: 'POST',
            body: JSON.stringify({ encodings }),
        });
    },
    // Validate enrollment encodings
    validateEnrollmentEncodings: async (encodings) => {
        return apiRequest('/face/validate-enrollment', {
            method: 'POST',
            body: JSON.stringify({ encodings }),
        });
    },
    // Verify face
    verifyFace: async (encoding) => {
        // Validate encoding before sending
        if (!encoding || !Array.isArray(encoding)) {
            console.error('[API] verifyFace: Invalid encoding provided');
            throw new Error('Face encoding không hợp lệ');
        }

        if (encoding.length !== 128) {
            console.error('[API] verifyFace: Encoding length is not 128:', encoding.length);
            throw new Error(`Face encoding phải có 128 giá trị (nhận được ${encoding.length})`);
        }

        console.log('[API] verifyFace: Sending encoding to server, length:', encoding.length);
        console.log('[API] verifyFace: Encoding preview (first 5 values):', encoding.slice(0, 5));

        try {
            const result = await apiRequest('/face/verify', {
                method: 'POST',
                body: JSON.stringify({ encoding }),
            });

            console.log('[API] verifyFace: Server response:', {
                success: result.success,
                isMatch: result.isMatch,
                similarity: result.similarity,
                threshold: result.threshold
            });

            return result;
        } catch (error) {
            console.error('[API] verifyFace: Error calling server:', error);
            throw error;
        }
    },
    // Check if face is enrolled
    checkFaceEncoding: async () => {
        return apiRequest('/face/check');
    },
    // Get today's sessions
    getTodaySessions: async () => {
        return apiRequest('/checkin/today-sessions');
    },
    // Check-in
    checkIn: async (buoiTapId, faceEncoding, image) => {
        return apiRequest('/checkin/checkin', {
            method: 'POST',
            body: JSON.stringify({
                buoiTapId,
                faceEncoding,
                image
            }),
        });
    },
    // Check-out
    checkOut: async (buoiTapId, faceEncoding, image) => {
        return apiRequest('/checkin/checkout', {
            method: 'POST',
            body: JSON.stringify({
                buoiTapId,
                faceEncoding,
                image
            }),
        });
    },
    // Get check-in history
    getHistory: async (limit = 50, startDate, endDate) => {
        const params = new URLSearchParams({ limit: limit.toString() });
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        return apiRequest(`/checkin/history?${params.toString()}`);
    },
    // Get QR code of current member
    getQRCode: async () => {
        return apiRequest('/checkin/qr-code');
    },
    // Check-in with QR code
    checkInWithQR: async (buoiTapId, qrCode) => {
        return apiRequest('/checkin/checkin-qr', {
            method: 'POST',
            body: JSON.stringify({
                buoiTapId,
                qrCode
            }),
        });
    },
    // Check-out with QR code
    checkOutWithQR: async (buoiTapId, qrCode) => {
        return apiRequest('/checkin/checkout-qr', {
            method: 'POST',
            body: JSON.stringify({
                buoiTapId,
                qrCode
            }),
        });
    },
};

export const scheduleAPI = {
    // Đăng ký buổi tập
    registerSession: async (buoiTapId) => {
        return apiRequest('/lichtap/register-session', {
            method: 'POST',
            body: JSON.stringify({ buoiTapId }),
        });
    },
    // Hủy đăng ký buổi tập
    cancelSession: async (buoiTapId) => {
        return apiRequest('/lichtap/cancel-session', {
            method: 'POST',
            body: JSON.stringify({ buoiTapId }),
        });
    },
    // Lấy danh sách buổi tập có sẵn trong tuần hiện tại
    getAvailableSessionsThisWeek: async () => {
        return apiRequest('/lichtap/available-sessions-this-week');
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
    checkInAPI,
    api,
};