import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = require('./ApiManagerPublic');

class ApiService {
    async getAuthToken() {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (token) {
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                } catch (decodeError) {
                    console.error('GetAuthToken - Failed to decode token:', decodeError);
                }
            }
            return token;
        } catch (error) {
            console.error('GetAuthToken - Error getting auth token:', error);
            return null;
        }
    }

    async apiCall(endpoint, method = 'GET', data = null, requiresAuth = true, retryCount = 0) {
        const maxRetries = 2;

        try {
            const headers = {
                'Content-Type': 'application/json',
            };

            let token;
            if (requiresAuth) {
                token = await this.getAuthToken();
                if (!token) {
                    throw new Error('Not logged in or your session has expired. Please log in again.');
                } else {
                    headers.Authorization = `Bearer ${token}`;
                }
            }

            const config = {
                method,
                headers,
            };

            if (data && (method === 'POST' || method === 'PUT')) {
                config.body = JSON.stringify(data);
            }

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // Tăng timeout lên 30s cho mobile network

            const fullUrl = `${API_URL}${endpoint}`;
            console.log(`[API] ${method} ${fullUrl}`);

            const response = await fetch(fullUrl, {
                ...config,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();

                if (response.status === 401) {
                    await this.clearAuthToken();
                    throw new Error('Authentication failed. Please login again.');
                }

                const truncatedText = text.length > 500 ? text.substring(0, 500) + '...' : text;
                throw new Error(`Server returned non-JSON response: ${response.status} ${response.statusText}\nResponse: ${truncatedText}`);
            }

            const result = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    await this.clearAuthToken();
                    throw new Error(result.message || 'Failed to authenticate. Please login again.');
                }

                if (response.status === 400) {
                    throw new Error(result.message || 'Invalid data provided');
                } else if (response.status === 403) {
                    throw new Error(result.message || 'Access denied. You do not have permission to perform this action');
                } else if (response.status === 404) {
                    throw new Error(result.message || 'Data not found');
                } else if (response.status >= 500) {
                    throw new Error(result.message || 'Server error. Please try again later');
                }

                throw new Error(result.message || `API call failed: ${response.status}`);
            }

            return result;
        } catch (error) {
            if (retryCount < maxRetries && (
                error.name === 'AbortError' ||
                error.message.includes('Network') ||
                error.message.includes('fetch') ||
                error.message.includes('Failed to fetch') ||
                error.message.includes('ECONNREFUSED') ||
                error.message.includes('ENOTFOUND') ||
                error.message.includes('TypeError')
            )) {
                await new Promise(resolve => setTimeout(resolve, 1000 + (retryCount * 500)));
                return this.apiCall(endpoint, method, data, requiresAuth, retryCount + 1);
            }

            if (error.name === 'AbortError') {
                console.error(`[API] Timeout: ${endpoint}`, error);
                throw new Error('Connection timed out. Please try again.');
            } else if (error.message.includes('Network') || error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
                console.error(`[API] Network error: ${endpoint}`, error);
                throw new Error(`Unable to connect to the server at ${API_URL}. Please check your network connection and ensure the server is running.`);
            } else if (error.message.includes('timeout')) {
                console.error(`[API] Timeout error: ${endpoint}`, error);
                throw new Error('Connection timed out. Please try again later.');
            } else if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
                console.error(`[API] Connection refused: ${endpoint}`, error);
                throw new Error(`Unable to connect to the server at ${API_URL}. Please check the server address and your network connection.`);
            } else if (error.message.includes('TypeError')) {
                console.error(`[API] TypeError: ${endpoint}`, error);
                throw new Error('Connection error. Please check your network connection and try again.');
            }

            console.error(`[API] Unknown error: ${endpoint}`, error);
            throw error;
        }
    }

    async clearAuthToken() {
        try {
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('userInfo');
        } catch (error) {
            // Không throw error khi clear token để tránh lỗi cascade
            console.error('Error clearing auth token:', error);
            // Chỉ log error, không throw để tránh làm gián đoạn flow
        }
    }

    // Auth APIs
    async login(sdt, matKhau) {
        return this.apiCall('/auth/login', 'POST', { sdt, matKhau }, false);
    }

    async register(data) {
        return this.apiCall('/auth/register', 'POST', data, false);
    }

    async forgotPassword(sdt) {
        return this.apiCall('/auth/forgot-password', 'POST', { sdt }, false);
    }

    async verifyOTP(sdt, otp) {
        return this.apiCall('/auth/verify-otp', 'POST', { sdt, otp }, false);
    }

    async resetPassword(sdt, otp, matKhauMoi) {
        return this.apiCall('/auth/reset-password', 'POST', { sdt, otp, matKhauMoi }, false);
    }

    // User APIs
    async getMyProfile() {
        try {
            const token = await this.getAuthToken();
            if (!token) return null;

            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.id;
        } catch (error) {
            console.error('Error getting current user ID:', error);
            return null;
        }
    }

    async getUserProfile() {
        return this.apiCall('/user/profile');
    }

    async updateProfile(userId, data) {
        return this.apiCall(`/user/hoivien/${userId}`, 'PUT', data);
    }

    async getAllPT() {
        try {
            console.log('🔄 Fetching PT list...');
            const result = await this.apiCall('/pt/list', 'GET');

            console.log('🔍 getAllPT - Type of result:', typeof result);
            console.log('🔍 getAllPT - Is result array?', Array.isArray(result));
            console.log('🔍 getAllPT - result.success:', result?.success);
            console.log('🔍 getAllPT - result.data exists?', !!result?.data);
            console.log('🔍 getAllPT - result.data is array?', Array.isArray(result?.data));
            console.log('🔍 getAllPT - result.data length:', result?.data?.length);

            // Backend returns {success: true, data: [...], count: 50}
            if (result?.success && Array.isArray(result.data) && result.data.length > 0) {
                console.log('✅ getAllPT returning array with', result.data.length, 'items');
                return result.data;
            }

            console.log('⚠️ getAllPT returning empty array - invalid response');
            return [];

        } catch (error) {
            console.error('❌ Failed to fetch PT list:', error.message);
            return [];
        }
    }

    async getAllGoiTap() {
        try {
            console.log('🔍 Fetching all packages...');
            const result = await this.apiCall('/user/goitap');
            console.log('📦 getAllGoiTap response:', result);

            // Handle different response formats
            if (Array.isArray(result)) {
                return result;
            } else if (result && result.data && Array.isArray(result.data)) {
                return result.data;
            } else if (result && typeof result === 'object') {
                return [result];
            }
            return [];
        } catch (error) {
            console.error('❌ Error fetching workout packages:', error.message);
            return [];
        }
    }

    async getMonthlyPackages() {
        try {
            const result = await this.apiCall('/user/goitap/monthly');
            return Array.isArray(result) ? result : [];
        } catch (error) {
            console.error('Error fetching monthly packages:', error);
            return [];
        }
    }

    async getPackagesByTimeUnit(donViThoiHan) {
        try {
            const result = await this.apiCall(`/user/goitap/time-unit/${donViThoiHan}`);
            return Array.isArray(result) ? result : [];
        } catch (error) {
            console.error('Error fetching packages by time unit:', error);
            return [];
        }
    }

    async getPackageById(packageId) {
        try {
            console.log('🔍 Fetching package by ID:', packageId);
            const result = await this.apiCall(`/goitap/${packageId}`, 'GET', null, false);
            console.log('📦 getPackageById response:', result);
            return result;
        } catch (error) {
            console.error('❌ Error fetching package by ID:', error.message);
            throw error;
        }
    }

    // Workout Plans APIs
    async getMyWorkoutPlans() {
        const token = await this.getAuthToken();
        if (!token) throw new Error('No auth token');

        const payload = JSON.parse(atob(token.split('.')[1]));
        const userId = payload.id;

        return this.apiCall(`/buoitap/hoivien/${userId}`);
    }

    async getAllWorkoutPlans() {
        return this.apiCall('/buoitap');
    }

    async getWorkoutPlanById(id) {
        return this.apiCall(`/buoitap/${id}`);
    }

    async completeWorkout(workoutId) {
        return this.apiCall(`/buoitap/${workoutId}/hoanthanh`, 'PUT');
    }

    // Workout Schedule APIs
    async getMyWorkoutSchedule() {
        const token = await this.getAuthToken();
        if (!token) throw new Error('No auth token');

        const payload = JSON.parse(atob(token.split('.')[1]));
        const userId = payload.id;

        return this.apiCall(`/lichtap/hoivien/${userId}`);
    }

    async getAllWorkoutSchedules() {
        try {
            const result = await this.apiCall('/lichtap');
            return Array.isArray(result) ? result : [];
        } catch (error) {
            console.error('Error fetching all workout schedules:', error.message || error);
            return [];
        }
    }

    async getMemberSchedule(hoiVienId) {
        try {
            const result = await this.apiCall(`/lichtap/member/${hoiVienId}`);
            if (result && result.data) {
                return result.data;
            }
            return [];
        } catch (error) {
            console.error('Error fetching member schedule:', error.message || error);
            return [];
        }
    }

    // PT Booking APIs
    async getMyPTBookings() {
        try {
            const token = await this.getAuthToken();

            const result = await this.apiCall('/lichhenpt/pt/my');
            return Array.isArray(result) ? result : [];
        } catch (error) {
            if (error.message && (error.message.includes('404') || error.message.includes('chưa có'))) {
                return [];
            }

            if (error.message && (error.message.includes('401') || error.message.includes('Chưa đăng nhập'))) {
                throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            }

            if (error.message && (error.message.includes('403') || error.message.includes('Không có quyền'))) {
                return [];
            }

            if (error.message && (error.message.includes('ID PT không hợp lệ') || error.message.includes('Token không hợp lệ'))) {
                throw new Error('Thông tin xác thực không hợp lệ. Vui lòng đăng nhập lại.');
            }

            return [];
        }
    }

    async createPTBooking(data) {
        return this.apiCall('/lichhenpt', 'POST', data);
    }

    async cancelPTBooking(bookingId) {
        return this.apiCall(`/lichhenpt/${bookingId}/huy`, 'PUT');
    }

    async getAllPTBookings() {
        return this.apiCall('/lichhenpt');
    }

    // Body Stats APIs
    async getMyBodyStats() {
        return this.apiCall('/chisocothe/my');
    }

    async getMyLatestBodyStats() {
        try {
            return await this.apiCall('/chisocothe/my/latest');
        } catch (error) {
            if (error.message.includes('chưa có chỉ số cơ thể') || error.message.includes('404')) {
                return null;
            }
            throw error;
        }
    }

    async createBodyStats(data) {
        return this.apiCall('/chisocothe', 'POST', data);
    }

    async getMyBodyStatsAnalytics() {
        return this.apiCall('/chisocothe/my/thongke');
    }

    // Nutrition APIs
    async getMyNutritionInfo() {
        try {
            const token = await this.getAuthToken();
            if (!token) throw new Error('No auth token');

            const payload = JSON.parse(atob(token.split('.')[1]));
            const userId = payload.id;

            return await this.apiCall(`/dinhduong/info/${userId}`);
        } catch (error) {
            // Nếu chưa có nutrition info, trả về object mặc định
            if (error.message.includes('404') || error.message.includes('chưa có')) {
                return {
                    todayCalories: 0,
                    weeklyGoal: 2000,
                    suggestions: []
                };
            }
            throw error;
        }
    }

    async getMyNutritionSuggestions() {
        const token = await this.getAuthToken();
        if (!token) throw new Error('No auth token');

        const payload = JSON.parse(atob(token.split('.')[1]));
        const userId = payload.id;

        return this.apiCall(`/dinhduong/goi-y/${userId}`);
    }

    async createNutritionSuggestion(data) {
        return this.apiCall('/dinhduong/goi-y', 'POST', data);
    }

    async getMyMenus() {
        const token = await this.getAuthToken();
        if (!token) throw new Error('No auth token');

        const payload = JSON.parse(atob(token.split('.')[1]));
        const userId = payload.id;

        return this.apiCall(`/dinhduong/thuc-don/${userId}`);
    }

    async createAutoMenu(data) {
        return this.apiCall('/dinhduong/thuc-don', 'POST', data);
    }

    async calculateCalorieNeeds(data) {
        return this.apiCall('/dinhduong/tinh-calories', 'POST', data);
    }

    async getActivityAnalysis() {
        const token = await this.getAuthToken();
        if (!token) throw new Error('No auth token');

        const payload = JSON.parse(atob(token.split('.')[1]));
        const userId = payload.id;

        return this.apiCall(`/dinhduong/phan-tich/${userId}`);
    }

    async updateNutritionFeedback(suggestionId, data) {
        return this.apiCall(`/dinhduong/goi-y/${suggestionId}/phan-hoi`, 'PUT', data);
    }

    // Nutrition Meals APIs - Lấy món ăn từ Nutrition
    async getHealthyMeals(limit = 10, mealType = null) {
        const queryParams = new URLSearchParams();

        // Map mealType từ format cũ sang format mới của Meal model
        // SANG -> 'Bữa sáng', TRUA -> 'Bữa trưa', CHIEU -> 'Ăn nhẹ', TOI -> 'Bữa tối'
        if (mealType) {
            const mealTypeMap = {
                'SANG': 'Bữa sáng',
                'TRUA': 'Bữa trưa',
                'CHIEU': 'Ăn nhẹ',
                'TOI': 'Bữa tối'
            };
            const mappedType = mealTypeMap[mealType] || mealType;
            queryParams.append('mealType', mappedType);
            console.log('🔄 Mapped mealType:', mealType, '->', mappedType);
        }

        queryParams.append('limit', limit);
        queryParams.append('skip', 0);

        const endpoint = `/nutrition/meals?${queryParams.toString()}`;
        console.log('📡 Calling API:', endpoint);

        try {
            const result = await this.apiCall(endpoint, 'GET', null, true);
            console.log('✅ API Result:', result);
            return result;
        } catch (error) {
            console.error('❌ API Error:', error);
            throw error;
        }
    }

    // Membership APIs
    async getMyMembership() {
        try {
            const token = await this.getAuthToken();
            if (!token) {
                console.warn('⚠️ No auth token for membership');
                return [];
            }

            console.log('📞 Calling /user/chitietgoitap API...');
            const result = await this.apiCall('/user/chitietgoitap');
            console.log('📞 getMyMembership response:', result);

            // Handle different response formats
            if (Array.isArray(result)) {
                return result;
            } else if (result && result.data && Array.isArray(result.data)) {
                return result.data;
            } else if (result && result.success === false) {
                // No membership found
                return [];
            } else if (result && typeof result === 'object') {
                return [result];
            }
            return [];
        } catch (error) {
            console.error('❌ Error fetching membership:', error.message);
            // Don't throw, return empty array
            return [];
        }
    }

    async createMembershipRegistration(data) {
        return this.apiCall('/user/chitietgoitap', 'POST', data);
    }

    // Payment APIs
    async getMyPayments() {
        return this.apiCall('/thanhtoan/my');
    }

    async createPayment(data) {
        return this.apiCall('/thanhtoan', 'POST', data);
    }

    async getCurrentUserId() {
        try {
            const token = await this.getAuthToken();
            if (!token) return null;

            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.id;
        } catch (error) {
            console.error('Error getting current user ID:', error);
            return null;
        }
    }

    // Helper method to check if user is logged in
    async isLoggedIn() {
        const token = await this.getAuthToken();
        if (!token) return false;

        try {
            // Check if token is expired
            const payload = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Date.now() / 1000;
            return payload.exp > currentTime;
        } catch (error) {
            return false;
        }
    }
    // Ranking User APIs
    async getAllHangHoiVien() {
        return this.apiCall('/hanghoivien');
    }

    async getHangHoiVienCuaHoiVien(hoiVienId) {
        return this.apiCall(`/hanghoivien/hoi-vien/${hoiVienId}`);
    }

    async tinhHangHoiVien(hoiVienId) {
        return this.apiCall(`/hanghoivien/tinh-hang/${hoiVienId}`, 'POST');
    }

    async tinhHangHoiVienTheoThoiHan(userId) {
        return this.apiCall(`/hanghoivien/tinh-hang-theo-thoi-han/${userId}`, 'GET');
    }

    async getThongKeHangHoiVien() {
        return this.apiCall('/hanghoivien/thong-ke/overview');
    }

    // Exercises APIs
    async getAllBaiTap() {
        try {
            console.log('🔄 Fetching exercises...');
            const result = await this.apiCall('/baitap', 'GET', null, false);
            console.log(`✅ Exercises fetched successfully:`, result?.length || 0);
            return Array.isArray(result) ? result : [];
        } catch (error) {
            console.error('❌ Failed to fetch exercises:', error.message);
            return []; // Return empty array on error
        }
    }

    async getBaiTapById(id) {
        return this.apiCall(`/baitap/${id}`, 'GET', null, false);
    }

    // Lịch sử tập luyện APIs
    async getMyWorkoutHistory() {
        const token = await this.getAuthToken();
        if (!token) throw new Error('No auth token');

        const payload = JSON.parse(atob(token.split('.')[1]));
        const userId = payload.id;

        return this.apiCall(`/lichsutap/hoivien/${userId}`);
    }

    async getWorkoutHistoryStats() {
        const token = await this.getAuthToken();
        if (!token) throw new Error('No auth token');

        const payload = JSON.parse(atob(token.split('.')[1]));
        const userId = payload.id;

        return this.apiCall(`/lichsutap/thongke?hoiVienId=${userId}`);
    }

    // Chatbot API methods
    async sendChatbotMessage(message) {
        return this.apiCall('/chatbot/message', 'POST', { message });
    }

    async getChatHistory(limit = 50) {
        return this.apiCall(`/chatbot/history?limit=${limit}`);
    }

    async createChatbotSession() {
        return this.apiCall('/chatbot/session', 'POST');
    }

    async closeChatbotSession() {
        return this.apiCall('/chatbot/session', 'DELETE');
    }

    async getCurrentChatbotSession() {
        return this.apiCall('/chatbot/session');
    }

    async getChatbotUserProfile() {
        return this.apiCall('/chatbot/profile');
    }

    // Change password
    async changePassword(passwordData) {
        return this.apiCall('/auth/change-password', 'PUT', passwordData);
    }

    // PT specific APIs
    async getMyStudents() {
        return this.apiCall('/user/pt/students');
    }

    async confirmPTBooking(bookingId) {
        return this.apiCall(`/lichhenpt/${bookingId}/xacnhan`, 'PUT');
    }

    async completePTBooking(bookingId) {
        return this.apiCall(`/lichhenpt/${bookingId}/hoanthanh`, 'PUT');
    }

    async cancelPTBooking(bookingId) {
        return this.apiCall(`/lichhenpt/${bookingId}/huy`, 'PUT');
    }

    // Admin specific APIs
    async getAllMembers() {
        return this.apiCall('/user/hoivien');
    }

    // REMOVED: Duplicate getAllPT() - using the detailed version at line 173 instead

    async getAllPayments() {
        return this.apiCall('/thanhtoan');
    }

    async getAllBookings() {
        return this.apiCall('/lichhenpt');
    }

    async updateMemberStatus(memberId, status) {
        return this.apiCall(`/user/hoivien/${memberId}/status`, 'PUT', { status });
    }

    async deleteMember(memberId) {
        return this.apiCall(`/user/hoivien/${memberId}`, 'DELETE');
    }

    // Lấy thời gian còn lại của hạng hội viên
    async getMembershipTimeRemaining(userId) {
        return this.apiCall(`/hanghoivien/thoi-gian-con-lai/${userId}`, 'GET');
    }

    // Cập nhật thời gian còn lại của hạng hội viên
    async updateMembershipTimeRemaining(userId, days) {
        return this.apiCall(`/hanghoivien/cap-nhat-thoi-gian-con-lai/${userId}`, 'PUT', { days });
    }
}

export default new ApiService();