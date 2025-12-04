import { apiRequest, getApiUrl, getAuthHeaders } from './api';

const PT_API_BASE = '/pt';

export const ptService = {
    // Dashboard
    getDashboard: async () => {
        return apiRequest(`${PT_API_BASE}/dashboard`, {
            method: 'GET'
        });
    },

    // Buổi tập
    getMySessions: async (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.trangThai) queryParams.append('trangThai', params.trangThai);
        if (params.ngayBatDau) queryParams.append('ngayBatDau', params.ngayBatDau);
        if (params.ngayKetThuc) queryParams.append('ngayKetThuc', params.ngayKetThuc);
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);

        const queryString = queryParams.toString();
        return apiRequest(`${PT_API_BASE}/sessions${queryString ? `?${queryString}` : ''}`, {
            method: 'GET'
        });
    },

    // Học viên
    getMyStudents: async (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.search) queryParams.append('search', params.search);
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);

        const queryString = queryParams.toString();
        return apiRequest(`${PT_API_BASE}/students${queryString ? `?${queryString}` : ''}`, {
            method: 'GET'
        });
    },

    getStudentDetail: async (hoiVienId) => {
        return apiRequest(`${PT_API_BASE}/students/${hoiVienId}`, {
            method: 'GET'
        });
    },

    // Ghi chú
    addStudentNote: async (hoiVienId, noiDung) => {
        return apiRequest(`${PT_API_BASE}/students/${hoiVienId}/notes`, {
            method: 'POST',
            body: JSON.stringify({ noiDung })
        });
    },

    getStudentNotes: async (hoiVienId, params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);

        const queryString = queryParams.toString();
        return apiRequest(`${PT_API_BASE}/students/${hoiVienId}/notes${queryString ? `?${queryString}` : ''}`, {
            method: 'GET'
        });
    },

    // Bài tập
    assignExerciseToStudent: async (hoiVienId, data) => {
        return apiRequest(`${PT_API_BASE}/students/${hoiVienId}/exercises`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    getStudentExercises: async (hoiVienId, params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.trangThai) queryParams.append('trangThai', params.trangThai);
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);

        const queryString = queryParams.toString();
        return apiRequest(`${PT_API_BASE}/students/${hoiVienId}/exercises${queryString ? `?${queryString}` : ''}`, {
            method: 'GET'
        });
    },

    // Tiến độ buổi tập
    updateSessionProgress: async (data) => {
        return apiRequest(`${PT_API_BASE}/sessions/progress`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    addSessionComment: async (buoiTapId, ghiChu) => {
        return apiRequest(`${PT_API_BASE}/sessions/${buoiTapId}/comment`, {
            method: 'PUT',
            body: JSON.stringify({ ghiChu })
        });
    },

    // Thống kê
    getStatistics: async (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.startDate) queryParams.append('startDate', params.startDate);
        if (params.endDate) queryParams.append('endDate', params.endDate);

        const queryString = queryParams.toString();
        return apiRequest(`${PT_API_BASE}/statistics${queryString ? `?${queryString}` : ''}`, {
            method: 'GET'
        });
    },

    getStudentStatistics: async (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.period) queryParams.append('period', params.period);

        const queryString = queryParams.toString();
        return apiRequest(`${PT_API_BASE}/statistics/students${queryString ? `?${queryString}` : ''}`, {
            method: 'GET'
        });
    },

    getSessionStatistics: async (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.period) queryParams.append('period', params.period);

        const queryString = queryParams.toString();
        return apiRequest(`${PT_API_BASE}/statistics/sessions${queryString ? `?${queryString}` : ''}`, {
            method: 'GET'
        });
    },

    // Lịch làm việc
    getWorkSchedule: async () => {
        return apiRequest(`${PT_API_BASE}/work-schedule`, {
            method: 'GET'
        });
    },

    updateWorkSchedule: async (data) => {
        return apiRequest(`${PT_API_BASE}/work-schedule`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    deleteWorkSchedule: async (thu) => {
        return apiRequest(`${PT_API_BASE}/work-schedule/${thu}`, {
            method: 'DELETE'
        });
    },

    // Đánh giá
    getReviews: async (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.rating) queryParams.append('rating', params.rating);

        const queryString = queryParams.toString();
        return apiRequest(`${PT_API_BASE}/reviews${queryString ? `?${queryString}` : ''}`, {
            method: 'GET'
        });
    },

    // Lịch sử làm việc
    getWorkHistory: async (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.startDate) queryParams.append('startDate', params.startDate);
        if (params.endDate) queryParams.append('endDate', params.endDate);
        if (params.trangThai) queryParams.append('trangThai', params.trangThai);
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);

        const queryString = queryParams.toString();
        return apiRequest(`${PT_API_BASE}/work-history${queryString ? `?${queryString}` : ''}`, {
            method: 'GET'
        });
    },

    // Profile
    getProfile: async () => {
        return apiRequest(`${PT_API_BASE}/profile`, {
            method: 'GET'
        });
    },

    updateProfile: async (data) => {
        return apiRequest(`${PT_API_BASE}/profile`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    // Báo cáo
    getStudentReport: async (hoiVienId, params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.startDate) queryParams.append('startDate', params.startDate);
        if (params.endDate) queryParams.append('endDate', params.endDate);

        const queryString = queryParams.toString();
        return apiRequest(`${PT_API_BASE}/reports/student/${hoiVienId}${queryString ? `?${queryString}` : ''}`, {
            method: 'GET'
        });
    },

    // Template
    getTemplates: async (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.search) queryParams.append('search', params.search);
        if (params.doKho) queryParams.append('doKho', params.doKho);

        const queryString = queryParams.toString();
        return apiRequest(`${PT_API_BASE}/templates${queryString ? `?${queryString}` : ''}`, {
            method: 'GET'
        });
    },

    getTemplateById: async (id) => {
        return apiRequest(`${PT_API_BASE}/templates/${id}`, {
            method: 'GET'
        });
    },

    createTemplate: async (data) => {
        return apiRequest(`${PT_API_BASE}/templates`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    updateTemplate: async (id, data) => {
        return apiRequest(`${PT_API_BASE}/templates/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    deleteTemplate: async (id) => {
        return apiRequest(`${PT_API_BASE}/templates/${id}`, {
            method: 'DELETE'
        });
    },

    // Goals (Mục tiêu hôm nay)
    getGoals: async (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.date) queryParams.append('date', params.date);

        const queryString = queryParams.toString();
        return apiRequest(`/pt/goals${queryString ? `?${queryString}` : ''}`, {
            method: 'GET'
        });
    },

    createGoal: async (data) => {
        return apiRequest(`/pt/goals`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    updateGoalStatus: async (id, status) => {
        return apiRequest(`/pt/goals/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
    },

    deleteGoal: async (id) => {
        return apiRequest(`/pt/goals/${id}`, {
            method: 'DELETE'
        });
    }
};

export default ptService;

