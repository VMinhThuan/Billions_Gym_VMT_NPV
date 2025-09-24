import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = require('./ApiManagerPublic');

class ApiService {
    // Get auth token from storage
    async getAuthToken() {
        try {
            const token = await AsyncStorage.getItem('userToken');
            console.log('🔑 getAuthToken - token:', token ? 'present' : 'missing');
            if (token) {
                console.log('🔑 getAuthToken - token length:', token.length);
                // Decode token to check structure
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    console.log('🔑 getAuthToken - decoded payload:', payload);
                } catch (decodeError) {
                    console.error('🔑 getAuthToken - failed to decode token:', decodeError);
                }
            }
            return token;
        } catch (error) {
            console.error('Error getting auth token:', error);
            return null;
        }
    }

    // Generic API call method with retry mechanism
    async apiCall(endpoint, method = 'GET', data = null, requiresAuth = true, retryCount = 0) {
        const maxRetries = 2; // Số lần retry tối đa

        try {
            const headers = {
                'Content-Type': 'application/json',
            };

            if (requiresAuth) {
                const token = await this.getAuthToken();
                if (!token) {
                    //throw new Error('No authentication token found. Please login again.');
                    console.log('⚠️ No authentication token found. Please login again.');
                }
                headers.Authorization = `Bearer ${token}`;
                console.log(`Making authenticated request to: ${API_URL}${endpoint}`);
                console.log('🔑 Authorization header:', `Bearer ${token.substring(0, 20)}...`);
            }

            const config = {
                method,
                headers,
            };

            if (data && (method === 'POST' || method === 'PUT')) {
                config.body = JSON.stringify(data);
            }

            console.log(`API Call: ${method} ${API_URL}${endpoint}`);

            // Thêm timeout cho fetch request - tăng lên 30 giây
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout

            const response = await fetch(`${API_URL}${endpoint}`, {
                ...config,
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            console.log(`Response status: ${response.status}, Content-Type: ${response.headers.get('content-type')}`);
            console.log(`Response URL: ${response.url}`);

            // Check if response is JSON before trying to parse
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error(`Non-JSON response from ${endpoint}:`, text);

                // If it's an unauthorized response, clear auth token
                if (response.status === 401) {
                    await this.clearAuthToken();
                    throw new Error('Authentication failed. Please login again.');
                }

                // Truncate response text to avoid very long error messages
                const truncatedText = text.length > 500 ? text.substring(0, 500) + '...' : text;
                throw new Error(`Server returned non-JSON response: ${response.status} ${response.statusText}\nResponse: ${truncatedText}`);
            }

            const result = await response.json();

            if (!response.ok) {
                // If it's an unauthorized response, clear auth token
                if (response.status === 401) {
                    await this.clearAuthToken();
                    // Trả về message từ server thay vì message mặc định
                    throw new Error(result.message || 'Đăng nhập thất bại');
                }

                // Xử lý các lỗi khác
                if (response.status === 400) {
                    throw new Error(result.message || 'Dữ liệu không hợp lệ');
                } else if (response.status === 403) {
                    throw new Error(result.message || 'Không có quyền truy cập');
                } else if (response.status === 404) {
                    throw new Error(result.message || 'Không tìm thấy dữ liệu');
                } else if (response.status >= 500) {
                    throw new Error(result.message || 'Lỗi server. Vui lòng thử lại sau');
                }

                throw new Error(result.message || `API call failed: ${response.status}`);
            }

            return result;
        } catch (error) {
            // Retry logic cho các lỗi network
            if (retryCount < maxRetries && (
                error.name === 'AbortError' ||
                error.message.includes('Network') ||
                error.message.includes('fetch') ||
                error.message.includes('Failed to fetch') ||
                error.message.includes('ECONNREFUSED') ||
                error.message.includes('ENOTFOUND') ||
                error.message.includes('TypeError')
            )) {
            console.log(`Retrying API call for ${endpoint} (attempt ${retryCount + 2}/${maxRetries + 1})`);
                // Đợi 1-2 giây trước khi retry
                await new Promise(resolve => setTimeout(resolve, 1000 + (retryCount * 500)));
                return this.apiCall(endpoint, method, data, requiresAuth, retryCount + 1);
            }

            // Xử lý các loại lỗi khác nhau
            if (error.name === 'AbortError') {
                throw new Error('Kết nối quá chậm. Vui lòng kiểm tra kết nối mạng và thử lại.');
            } else if (error.message.includes('Network') || error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
                throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và đảm bảo server đang chạy.');
            } else if (error.message.includes('timeout')) {
                throw new Error('Kết nối quá chậm. Vui lòng thử lại sau.');
            } else if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
                throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra địa chỉ server và kết nối mạng.');
            } else if (error.message.includes('TypeError')) {
                throw new Error('Lỗi kết nối. Vui lòng kiểm tra kết nối mạng và thử lại.');
            }

            throw error;
        }
    }

    // Clear auth token from storage
    async clearAuthToken() {
        try {
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('userInfo');
        } catch (error) {
            // Silent error handling
        }
    }

    // ✅ THÊM: Debug method để check user info
    async debugUserInfo() {
        try {
            const token = await this.getAuthToken();
            if (!token) {
                console.log('🔍 DEBUG - No token found');
                return null;
            }

            const payload = JSON.parse(atob(token.split('.')[1]));
            console.log('🔍 DEBUG - Full token payload:', JSON.stringify(payload, null, 2));
            console.log('🔍 DEBUG - User role:', payload.vaiTro);
            console.log('🔍 DEBUG - User ID:', payload.id);
            console.log('🔍 DEBUG - User SDT:', payload.sdt);
            
            return payload;
        } catch (error) {
            console.log('🔍 DEBUG - Error decoding token:', error);
            return null;
        }
    }

    // Auth APIs
    async login(sdt, matKhau) {
        return this.apiCall('/auth/login', 'POST', { sdt, matKhau }, false);
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
        const token = await this.getAuthToken();
        if (!token) throw new Error('No auth token');

        try {
            // ✅ SỬA: Decode token an toàn hơn
            const payload = JSON.parse(atob(token.split('.')[1]));
            const userId = payload.id;
            console.log('🔑 DEBUG - Decoded user ID from token:', userId);

            if (!userId) {
                throw new Error('No user ID in token');
            }

            return this.apiCall(`/user/hoivien/${userId}`);
        } catch (error) {
            console.log('🔑 ERROR - Failed to decode token:', error);
            throw new Error('Invalid token or unable to get user ID');
        }
    }

    async updateProfile(userId, data) {
        return this.apiCall(`/user/hoivien/${userId}`, 'PUT', data);
    }

    // ✅ THÊM: Test method để debug
    async testUpdate(userId, data) {
        return this.apiCall(`/user/test-update/${userId}`, 'PUT', data);
    }

    // ✅ THÊM: Test flexible update
    async testFlexibleUpdate(userId, data) {
        return this.apiCall(`/user/test-flexible-update/${userId}`, 'PUT', data);
    }

    // ✅ THÊM: Restore critical data
    async restoreCriticalData(userId, data) {
        return this.apiCall(`/user/restore-critical-data/${userId}`, 'PUT', data);
    }

    async getAllPT() {
        try {
            const result = await this.apiCall('/user/pt');
            return Array.isArray(result) ? result : [];
        } catch (error) {
            return [];
        }
    }

    async getAllGoiTap() {
        try {
            const result = await this.apiCall('/user/goitap');
            return Array.isArray(result) ? result : [];
        } catch (error) {
            console.error('Error fetching workout packages:', error);
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

    // Workout Plans (Buoi Tap) APIs
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

    // Workout Schedule (Lich Tap) APIs
    async getMyWorkoutSchedule() {
        const token = await this.getAuthToken();
        if (!token) throw new Error('No auth token');

        const payload = JSON.parse(atob(token.split('.')[1]));
        const userId = payload.id;

        return this.apiCall(`/lichtap/hoivien/${userId}`);
    }

    // PT Booking (Lich Hen PT) APIs
    async getMyPTBookings() {
        try {
            // Get current user info for debugging
            const token = await this.getAuthToken();

            const result = await this.apiCall('/lichhenpt/pt/my');
            return Array.isArray(result) ? result : [];
        } catch (error) {
            // Nếu chưa có booking, trả về array rỗng
            if (error.message && (error.message.includes('404') || error.message.includes('chưa có'))) {
                return [];
            }

            // Nếu lỗi authentication, throw error để UI xử lý
            if (error.message && (error.message.includes('401') || error.message.includes('Chưa đăng nhập'))) {
                throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            }

            // Nếu lỗi quyền truy cập - đã sửa backend để hỗ trợ HoiVien
            if (error.message && (error.message.includes('403') || error.message.includes('Không có quyền'))) {
                // Trả về array rỗng thay vì throw error để tránh crash app
                return [];
            }

            // Nếu lỗi ID không hợp lệ
            if (error.message && (error.message.includes('ID PT không hợp lệ') || error.message.includes('Token không hợp lệ'))) {
                throw new Error('Thông tin xác thực không hợp lệ. Vui lòng đăng nhập lại.');
            }

            // Các lỗi khác, trả về array rỗng
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

    // Body Stats (Chi So Co The) APIs
    async getMyBodyStats() {
        return this.apiCall('/chisocothe/my');
    }

    async getMyLatestBodyStats() {
        try {
            return await this.apiCall('/chisocothe/my/latest');
        } catch (error) {
            // Nếu chưa có chỉ số cơ thể, trả về null thay vì throw error
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

    // Membership (Chi Tiet Goi Tap) APIs
    async getMyMembership() {
        const token = await this.getAuthToken();
        if (!token) throw new Error('No auth token');

        const payload = JSON.parse(atob(token.split('.')[1]));
        const userId = payload.id;

        // Get all membership details and filter by current user
        const allMemberships = await this.apiCall('/user/chitietgoitap');
        return allMemberships.filter(membership =>
            membership.maHoiVien && membership.maHoiVien._id === userId
        );
    }

    async createMembershipRegistration(data) {
        return this.apiCall('/user/chitietgoitap', 'POST', data);
    }

    // Payment (Thanh Toan) APIs
    async getMyPayments() {
        return this.apiCall('/thanhtoan/my');
    }

    async createPayment(data) {
        return this.apiCall('/thanhtoan', 'POST', data);
    }

    // Utility method to get current user ID from token
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

    // Test API connectivity (no authentication required)
    async testConnection() {
        try {
            console.log('Testing API connectivity...');
            const response = await this.apiCall('/test', 'GET', null, false);
            console.log('API connection test successful:', response);
            return response;
        } catch (error) {
            console.error('API connection test failed:', error);
            throw error;
        }
    }

    // Hạng hội viên APIs
    async getAllHangHoiVien() {
        return this.apiCall('/hanghoivien');
    }

    async getHangHoiVienCuaHoiVien(hoiVienId) {
        return this.apiCall(`/hanghoivien/hoi-vien/${hoiVienId}`);
    }

    async tinhHangHoiVien(hoiVienId) {
        return this.apiCall(`/hanghoivien/tinh-hang/${hoiVienId}`, 'POST');
    }

    async getThongKeHangHoiVien() {
        return this.apiCall('/hanghoivien/thong-ke/overview');
    }

    // Bài tập (Exercises) APIs
    async getAllBaiTap() {
        try {
            const result = await this.apiCall('/baitap');
            return Array.isArray(result) ? result : [];
        } catch (error) {
            console.error('Error fetching exercises:', error);
            return [];
        }
    }

    async getBaiTapById(id) {
        return this.apiCall(`/baitap/${id}`);
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

    async getAllPT() {
        return this.apiCall('/user/pt');
    }

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
}

export default new ApiService();
