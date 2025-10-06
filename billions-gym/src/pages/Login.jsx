import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api'
import { VALIDATION_PATTERNS, API_MESSAGES } from '../constants/api'
import { authUtils } from '../utils/auth'
import { useNotification } from '../contexts/NotificationContext'
import { useLanguage } from '../contexts/LanguageContext'
import '../styles/globals.css'

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { showLoginSuccess, showLoginError, showNetworkError } = useNotification();
    const { language, toggleLanguage, content } = useLanguage();
    const navigate = useNavigate();

    const sanitizeInput = (input) => {
        if (!input) return '';
        return input.toString().trim();
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        const sanitizedValue = sanitizeInput(value);

        setFormData(prev => ({
            ...prev,
            [name]: sanitizedValue
        }));
        if (error) setError('');
    };

    const validateInput = (input) => {
        const trimmedInput = input.trim();

        if (!trimmedInput) {
            return { type: 'empty', value: trimmedInput };
        }

        if (VALIDATION_PATTERNS.EMAIL.test(trimmedInput)) {
            return { type: 'email', value: trimmedInput };
        } else if (VALIDATION_PATTERNS.PHONE_VIETNAM.test(trimmedInput)) {
            return { type: 'phone', value: trimmedInput };
        } else {
            return { type: 'invalid', value: trimmedInput };
        }
    };

    const validatePassword = (password) => {
        if (!password || password.trim().length === 0) {
            return { isValid: false, message: content.pleaseEnterPassword };
        }
        return { isValid: true, message: '' };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        localStorage.removeItem('token');
        localStorage.removeItem('user');

        try {
            const validation = validateInput(formData.email);

            if (validation.type === 'empty') {
                setError(content.pleaseEnterEmail);
                setIsLoading(false);
                return;
            }

            if (validation.type === 'invalid') {
                setError(content.pleaseEnterValidEmail);
                setIsLoading(false);
                return;
            }

            const passwordValidation = validatePassword(formData.password);
            if (!passwordValidation.isValid) {
                setError(passwordValidation.message);
                setIsLoading(false);
                return;
            }

            const loginData = {
                matKhau: formData.password
            };

            if (validation.type === 'email') {
                loginData.email = validation.value;
            } else {
                loginData.sdt = validation.value;
            }

            const result = await authAPI.login(loginData);

            authUtils.setAuthData(result.token, result.nguoiDung);

            showLoginSuccess();

            setTimeout(() => {
                navigate('/home');
            }, 1000);
        } catch (error) {
            const errorMessage = error.message || API_MESSAGES.ERROR;
            setError(errorMessage);

            if (error.message.includes('Network error') || error.message.includes('CORS error')) {
                showNetworkError();
            }
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="h-screen relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-red-600 z-10"></div>

            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: `url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')`,
                    filter: 'brightness(0.4)',
                    height: '100vh',
                    width: '100%'
                }}
            ></div>

            <div className="relative z-10 h-screen flex justify-end md:justify-end">
                <div className="w-full md:w-1/2 h-full glass-card rounded-l-[60px] p-8 flex flex-col justify-start">
                    <div className="flex justify-end mb-14">
                        <div className="flex items-center space-x-2 cursor-pointer bg-none bg-opacity-20 border border-[#817e7f] rounded-[40px] px-3 py-2" onClick={toggleLanguage}>
                            <img
                                src={language === 'vn' ? "https://flagcdn.com/w20/vn.png" : "https://flagcdn.com/w20/gb.png"}
                                alt={language === 'vn' ? "Vietnam Flag" : "UK Flag"}
                                className="w-5 h-4"
                            />
                            <span className="text-sm font-medium text-gray-800">{language === 'vn' ? 'VN' : 'EN'}</span>
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>

                    <div className="text-center mb-14">
                        <h1 className="text-6xl font-medium text-gray-900 mb-6">
                            {content.greeting}
                        </h1>
                        <p className="text-[16px] text-gray-600">
                            {content.welcome}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-2">
                        {/* Error Message */}
                        {error && (
                            <div className="w-3/5 mx-auto mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <input
                                type="text"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder={content.emailOrPhone}
                                className="w-3/5 mx-auto block px-3 py-3 bg-white bg-opacity-80 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 text-sm"
                            />
                        </div>

                        <div className="h-[30px]"></div>

                        <div>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder={content.password}
                                className="w-3/5 mx-auto block px-3 py-3 bg-white bg-opacity-80 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 text-sm"
                            />
                            <div className="flex justify-end w-3/5 mx-auto mt-6 mb-10">
                                <a href="#" className="text-sm text-gray-600 hover:text-blue-600">
                                    {content.forgotPassword}
                                </a>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-3/5 mx-auto block py-3 rounded-[24px] font-medium transition-colors text-sm ${isLoading
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-gray-900 hover:bg-gray-800'
                                } text-white`}
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    {content.loggingIn}
                                </div>
                            ) : (
                                content.login
                            )}
                        </button>

                        <div className="text-center mt-5">
                            <span className="text-sm text-gray-600 font-medium">
                                {content.noAccount}{' '}
                                <button
                                    onClick={() => navigate('/register')}
                                    className="text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                                >
                                    {content.signUp}
                                </button>
                            </span>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default Login
