// API client for connecting the frontend to the BE (Billions_Gym_VMT_NPV)
// Configure base URL via Vite env: VITE_API_BASE_URL. Fallback to localhost:4000

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

const BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:4000';

// Authentication token management
let authToken: string | null = localStorage.getItem('authToken');

export const auth = {
    setToken: (token: string) => {
        authToken = token;
        localStorage.setItem('authToken', token);
    },
    getToken: () => authToken,
    clearToken: () => {
        authToken = null;
        localStorage.removeItem('authToken');
    },
    isAuthenticated: () => !!authToken
};

async function request<T>(path: string, options: { method?: HttpMethod; body?: any; query?: Record<string, any>; requireAuth?: boolean } = {}): Promise<T> {
    const { method = 'GET', body, query, requireAuth = true } = options;
    const url = new URL(path, BASE_URL);
    if (query) {
        for (const [k, v] of Object.entries(query)) {
            if (v === undefined || v === null) continue;
            url.searchParams.set(k, String(v));
        }
    }

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    // Add authorization header if token exists and auth is required
    if (requireAuth && authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    const res = await fetch(url.toString(), {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'include',
        mode: 'cors',
    });

    if (!res.ok) {
        if (res.status === 401) {
            // Clear invalid token
            auth.clearToken();
            throw new Error('Unauthorized - please login again');
        }
        const text = await res.text().catch(() => '');
        throw new Error(`API ${method} ${url.pathname} failed: ${res.status} ${text}`);
    }

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        return (await res.json()) as T;
    }
    // Non-JSON response
    return (undefined as unknown) as T;
}

export const api = {
    get: <T = any>(path: string, query?: Record<string, any>, requireAuth = true) =>
        request<T>(path, { method: 'GET', query, requireAuth }),
    post: <T = any>(path: string, body?: any, requireAuth = true) =>
        request<T>(path, { method: 'POST', body, requireAuth }),
    put: <T = any>(path: string, body?: any, requireAuth = true) =>
        request<T>(path, { method: 'PUT', body, requireAuth }),
    delete: <T = any>(path: string, requireAuth = true) =>
        request<T>(path, { method: 'DELETE', requireAuth }),

    // Authentication endpoints
    login: async (credentials: { email?: string; sdt?: string; matKhau: string }) => {
        const response = await request<{ token: string; user: any }>('/api/auth/login', {
            method: 'POST',
            body: credentials,
            requireAuth: false
        });
        if (response.token) {
            auth.setToken(response.token);
        }
        return response;
    },

    logout: () => {
        auth.clearToken();
    }
};

// Nutrition API endpoints
export const nutritionAPI = {
    // Create AI nutrition suggestion
    createSuggestion: (data: { maHoiVien: string; mucTieu: string; thongTinThem?: any }) =>
        api.post('/api/dinhduong/goi-y', data),

    // Get member's nutrition suggestions
    getSuggestions: (maHoiVien: string, params?: { limit?: number; page?: number; loaiGoiY?: string }) =>
        api.get(`/api/dinhduong/goi-y/${maHoiVien}`, params),

    // Get suggestion details
    getSuggestionDetails: (goiYId: string) =>
        api.get(`/api/dinhduong/goi-y/chi-tiet/${goiYId}`),

    // Update suggestion feedback
    updateFeedback: (goiYId: string, data: { danhGia?: number; phanHoi?: string; trangThai?: string }) =>
        api.put(`/api/dinhduong/goi-y/${goiYId}/phan-hoi`, data),

    // Create automatic menu
    createMenu: (data: { maHoiVien: string; loaiThucDon?: string; mucTieu: string }) =>
        api.post('/api/dinhduong/thuc-don', data),

    // Get member's menus
    getMenus: (maHoiVien: string, params?: { limit?: number; page?: number; trangThai?: string }) =>
        api.get(`/api/dinhduong/thuc-don/${maHoiVien}`, params),

    // Get menu details
    getMenuDetails: (thucDonId: string) =>
        api.get(`/api/dinhduong/thuc-don/chi-tiet/${thucDonId}`),

    // Update menu rating
    updateMenuRating: (thucDonId: string, data: { danhGiaHaiLong?: number; phanHoi?: string; trangThai?: string }) =>
        api.put(`/api/dinhduong/thuc-don/${thucDonId}/danh-gia`, data),

    // Analyze workout activity
    analyzeActivity: (maHoiVien: string) =>
        api.get(`/api/dinhduong/phan-tich/${maHoiVien}`),

    // Calculate calorie needs
    calculateCalories: (data: { canNang: number; chieuCao: number; tuoi: number; gioiTinh: string; hoatDong?: string; mucTieu: string }) =>
        api.post('/api/dinhduong/tinh-calories', data),

    // Get nutrition info
    getNutritionInfo: (maHoiVien: string) =>
        api.get(`/api/dinhduong/info/${maHoiVien}`)
};

// Backend API endpoints (matching Billions_Gym_VMT_NPV backend):
// - Authentication:              POST /api/auth/login
// - Members (HoiVien):           GET /api/user/hoivien
// - PT:                          GET /api/user/pt
// - Packages (GoiTap):           GET /api/goitap
// - Package Registration:        POST /api/chitietgoitap/dangky
// - Schedules (LichTap):         GET /api/lichtap
// - Sessions (BuoiTap):          GET /api/buoitap
// - Exercises (BaiTap):          GET /api/baitap
// - Training History:            GET /api/lichsutap
// - Nutrition AI:                GET/POST /api/dinhduong/*
//
// Note: Most endpoints require Bearer token authentication
// Base URL: http://localhost:4000 (configurable via VITE_API_BASE_URL)


