import React, { createContext, useContext, useReducer, useEffect } from 'react';
import apiService from '../services/api';

const initialState = {
    user: null,
    token: null,
    isAuthenticated: false,
    loading: true,
    error: null,
};

const AUTH_ACTIONS = {
    LOGIN_START: 'LOGIN_START',
    LOGIN_SUCCESS: 'LOGIN_SUCCESS',
    LOGIN_FAILURE: 'LOGIN_FAILURE',
    LOGOUT: 'LOGOUT',
    SET_LOADING: 'SET_LOADING',
    CLEAR_ERROR: 'CLEAR_ERROR',
};

const authReducer = (state, action) => {
    switch (action.type) {
        case AUTH_ACTIONS.LOGIN_START:
            return {
                ...state,
                loading: true,
                error: null,
            };
        case AUTH_ACTIONS.LOGIN_SUCCESS:
            return {
                ...state,
                user: action.payload.user,
                token: action.payload.token,
                isAuthenticated: true,
                loading: false,
                error: null,
            };
        case AUTH_ACTIONS.LOGIN_FAILURE:
            return {
                ...state,
                user: null,
                token: null,
                isAuthenticated: false,
                loading: false,
                error: action.payload,
            };
        case AUTH_ACTIONS.LOGOUT:
            return {
                ...state,
                user: null,
                token: null,
                isAuthenticated: false,
                loading: false,
                error: null,
            };
        case AUTH_ACTIONS.SET_LOADING:
            return {
                ...state,
                loading: action.payload,
            };
        case AUTH_ACTIONS.CLEAR_ERROR:
            return {
                ...state,
                error: null,
            };
        default:
            return state;
    }
};

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, initialState);

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (token) {
            apiService.get('/auth/verify')
                .then(response => {
                    dispatch({
                        type: AUTH_ACTIONS.LOGIN_SUCCESS,
                        payload: {
                            user: response.user,
                            token: token,
                        },
                    });
                })
                .catch(() => {
                    localStorage.removeItem('authToken');
                    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
                });
        } else {
            dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
        }
    }, []);

    const login = async (credentials) => {
        try {
            dispatch({ type: AUTH_ACTIONS.LOGIN_START });

            const response = await apiService.login(credentials);

            apiService.setAuthToken(response.token);

            dispatch({
                type: AUTH_ACTIONS.LOGIN_SUCCESS,
                payload: {
                    user: response.nguoiDung,
                    token: response.token,
                },
            });

            return { success: true };
        } catch (error) {
            const errorMessage = error.message || 'Đăng nhập thất bại';
            dispatch({
                type: AUTH_ACTIONS.LOGIN_FAILURE,
                payload: errorMessage,
            });
            return { success: false, error: errorMessage };
        }
    };

    const register = async (userData) => {
        try {
            dispatch({ type: AUTH_ACTIONS.LOGIN_START });

            const response = await apiService.register(userData);

            apiService.setAuthToken(response.token);

            dispatch({
                type: AUTH_ACTIONS.LOGIN_SUCCESS,
                payload: {
                    user: response.user,
                    token: response.token,
                },
            });

            return { success: true };
        } catch (error) {
            dispatch({
                type: AUTH_ACTIONS.LOGIN_FAILURE,
                payload: error.message || 'Registration failed',
            });
            return { success: false, error: error.message };
        }
    };

    const logout = () => {
        apiService.logout();
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
    };

    const clearError = () => {
        dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
    };

    const value = {
        ...state,
        login,
        register,
        logout,
        clearError,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
