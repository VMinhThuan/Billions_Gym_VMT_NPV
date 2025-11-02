import { STORAGE_KEYS } from '../constants/api';

export const authUtils = {
    getToken: () => {
        return localStorage.getItem(STORAGE_KEYS.TOKEN);
    },

    getUser: () => {
        const userStr = localStorage.getItem(STORAGE_KEYS.USER);
        return userStr ? JSON.parse(userStr) : null;
    },

    isAuthenticated: () => {
        const token = authUtils.getToken();
        if (!token) return false;

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Math.floor(Date.now() / 1000);

            if (payload.exp && payload.exp < currentTime) {
                authUtils.clearAuthData();
                return false;
            }

            return true;
        } catch (error) {
            authUtils.clearAuthData();
            return false;
        }
    },

    setAuthData: (token, user) => {
        localStorage.setItem(STORAGE_KEYS.TOKEN, token);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    },

    clearAuthData: () => {
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
    },

    getUserRole: () => {
        const user = authUtils.getUser();
        return user?.vaiTro || null;
    },

    hasRole: (role) => {
        const userRole = authUtils.getUserRole();
        return userRole === role;
    },

    isAdmin: () => {
        return authUtils.hasRole('OngChu') || authUtils.hasRole('Admin');
    },

    isPT: () => {
        return authUtils.hasRole('PT');
    },

    isMember: () => {
        return authUtils.hasRole('HoiVien');
    },

    getUserId: () => {
        const user = authUtils.getUser();
        return user?._id || null;
    },

    getUserName: () => {
        const user = authUtils.getUser();
        return user?.hoTen || 'User';
    },

    getUserEmail: () => {
        const user = authUtils.getUser();
        return user?.email || null;
    },

    getUserPhone: () => {
        const user = authUtils.getUser();
        return user?.sdt || null;
    },

    logout: () => {
        authUtils.clearAuthData();
        window.location.href = '/login';
    },

    redirectByRole: () => {
        const role = authUtils.getUserRole();

        switch (role) {
            case 'OngChu':
            case 'Admin':
                return '/admin/dashboard';
            case 'PT':
                return '/pt/dashboard';
            case 'HoiVien':
                return '/home';
            default:
                return '/login';
        }
    },
};

export default authUtils;
