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
            // Show notification and redirect to login
            if (typeof window !== 'undefined') {
                // Dispatch custom event for token expiration
                window.dispatchEvent(new CustomEvent('tokenExpired', {
                    detail: { message: 'Phiên đã hết hạn. Vui lòng đăng nhập lại.' }
                }));
            }
            throw new Error('Unauthorized - please login again');
        }

        // Handle specific error cases
        if (res.status === 413) {
            throw new Error('Payload too large - please reduce image size or try again');
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
    delete: <T = any>(path: string, options?: { query?: Record<string, any>; requireAuth?: boolean }) =>
        request<T>(path, { method: 'DELETE', query: options?.query, requireAuth: options?.requireAuth ?? true }),

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
    },

    // Nutrition endpoints
    nutrition: {
        // Meal management
        getAllMeals: (query?: { mealType?: string; search?: string; limit?: number; page?: number }) =>
            api.get<{ success: boolean; data: any[] }>('/api/nutrition/meals', query),
        getMealById: (id: string) =>
            api.get<{ success: boolean; data: any }>(`/api/nutrition/meals/${id}`),
        createMeal: (meal: any) =>
            api.post<{ success: boolean; data: any }>('/api/nutrition/meals', meal),
        updateMeal: (id: string, meal: any) =>
            api.put<{ success: boolean; data: any }>(`/api/nutrition/meals/${id}`, meal),
        deleteMeal: (id: string) =>
            api.delete<{ success: boolean }>(`/api/nutrition/meals/${id}`),

        // Member meal plan management
        getMemberMealPlans: (query?: { memberId?: string; date?: string; startDate?: string; endDate?: string }) =>
            api.get<{ success: boolean; data: any[] }>('/api/nutrition/member-meal-plans', query),
        getMemberMealPlan: (memberId: string, date: string) =>
            api.get<{ success: boolean; data: any }>(`/api/nutrition/member-meal-plans/${memberId}`, { date }),
        addMealToMemberPlan: (memberId: string, mealId: string, mealType: string, date: string) =>
            api.post<{ success: boolean }>('/api/nutrition/member-meal-plans/add', {
                memberId,
                mealId,
                mealType,
                date
            }),
        removeMealFromMemberPlan: (memberId: string, date: string, mealType: string, mealIndex: number) =>
            api.delete<{ success: boolean }>('/api/nutrition/member-meal-plans/remove', {
                query: {
                    memberId,
                    date,
                    mealType,
                    mealIndex: mealIndex.toString()
                }
            }),
        updateMemberMealPlan: (memberId: string, date: string, plan: any) =>
            api.put<{ success: boolean }>(`/api/nutrition/member-meal-plans/${memberId}`, { date, plan }),
    }
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
//
// Note: Most endpoints require Bearer token authentication
// Base URL: http://localhost:4000 (configurable via VITE_API_BASE_URL)


