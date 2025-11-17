import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotification } from '../contexts/NotificationContext';
import { authAPI } from '../services/api';
import { authUtils } from '../utils/auth';

const Register = () => {
    const { content, language, toggleLanguage } = useLanguage();
    const { showSuccess, showError } = useNotification();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        hoTen: '',
        email: '',
        sdt: '',
        matKhau: '',
        xacNhanMatKhau: ''
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.hoTen.trim()) {
            newErrors.hoTen = 'Vui lòng nhập họ tên';
        }

        if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Vui lòng nhập email hợp lệ';
        }

        if (!formData.sdt.trim()) {
            newErrors.sdt = 'Vui lòng nhập số điện thoại';
        } else if (!/^[0-9]{10,11}$/.test(formData.sdt.replace(/\s/g, ''))) {
            newErrors.sdt = 'Vui lòng nhập số điện thoại hợp lệ (10-11 số)';
        }

        if (!formData.matKhau) {
            newErrors.matKhau = 'Vui lòng nhập mật khẩu';
        } else if (formData.matKhau.length < 6) {
            newErrors.matKhau = 'Mật khẩu phải có ít nhất 6 ký tự';
        }

        if (!formData.xacNhanMatKhau) {
            newErrors.xacNhanMatKhau = 'Vui lòng xác nhận mật khẩu';
        } else if (formData.matKhau !== formData.xacNhanMatKhau) {
            newErrors.xacNhanMatKhau = 'Mật khẩu xác nhận không khớp';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        setErrors({});

        try {
            const registerData = {
                hoTen: formData.hoTen,
                sdt: formData.sdt,
                email: formData.email,
                matKhau: formData.matKhau,
                vaiTro: 'HoiVien'
            };

            const result = await authAPI.register(registerData);

            if (result && result.success) {
                showSuccess('Đăng ký thành công! Vui lòng đăng nhập để tiếp tục.');
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            } else {
                // Xử lý lỗi 409 (Conflict) - số điện thoại đã tồn tại
                const errorMessage = result?.message || 'Đăng ký thất bại. Vui lòng thử lại.';
                showError(errorMessage);

                // Nếu lỗi về số điện thoại trùng, highlight field đó
                if (errorMessage.includes('số điện thoại') || errorMessage.includes('Số điện thoại')) {
                    setErrors({ sdt: errorMessage });
                } else if (errorMessage.includes('email') || errorMessage.includes('Email')) {
                    setErrors({ email: errorMessage });
                } else {
                    setErrors({ general: errorMessage });
                }
            }
        } catch (error) {
            console.error('Register error:', error);
            // Xử lý các loại lỗi khác nhau
            let errorMessage = 'Đăng ký thất bại. Vui lòng thử lại.';
            
            if (error.message) {
                errorMessage = error.message;
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
            }
            
            // Nếu là lỗi server (500), hiển thị thông báo thân thiện hơn
            if (errorMessage.includes('Server error') || errorMessage.includes('Lỗi server') || errorMessage.includes('500')) {
                errorMessage = 'Lỗi hệ thống. Vui lòng thử lại sau hoặc liên hệ hỗ trợ nếu vấn đề vẫn tiếp tục.';
            }
            
            showError(errorMessage);
            setErrors({ general: errorMessage });
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
                    backgroundImage: `url('https://images.unsplash.com/photo-1738321791387-a11c55f52d7a?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')`,
                    filter: 'brightness(0.4)',
                    height: '100vh',
                    width: '100%'
                }}
            ></div>

            <div className="relative z-10 h-screen flex justify-end md:justify-end">
                <div className="w-full md:w-1/2 h-full glass-form-container p-8 flex flex-col justify-start">
                    <div className="flex justify-end">
                        <div className="flex items-center space-x-2 cursor-pointer glass-language-selector rounded-[40px] px-3 py-2" onClick={toggleLanguage}>
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

                    <div className="text-center mb-10">
                        <h1 className="text-6xl font-medium text-gray-900 mb-2">
                            {content.register}
                        </h1>
                        <p className="text-[16px] text-gray-600">
                            {content.registerDescription}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-2">
                        {/* General Error Messages */}
                        {errors.general && (
                            <div className="w-3/5 mx-auto mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
                                {errors.general}
                            </div>
                        )}

                        <div>
                            <input
                                type="text"
                                name="hoTen"
                                value={formData.hoTen}
                                onChange={handleChange}
                                placeholder={content.fullName}
                                className={`w-3/5 mx-auto block px-3 py-3 glass-input rounded-lg placeholder-gray-500 text-sm ${errors.hoTen ? 'border-2 border-red-500' : ''}`}
                            />
                            {errors.hoTen && (
                                <p className="w-3/5 mx-auto mt-1 text-red-600 text-xs">{errors.hoTen}</p>
                            )}
                        </div>

                        <div className="h-[15px]"></div>

                        <div>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder={content.email}
                                className={`w-3/5 mx-auto block px-3 py-3 glass-input rounded-lg placeholder-gray-500 text-sm ${errors.email ? 'border-2 border-red-500' : ''}`}
                            />
                            {errors.email && (
                                <p className="w-3/5 mx-auto mt-1 text-red-600 text-xs">{errors.email}</p>
                            )}
                        </div>

                        <div className="h-[15px]"></div>

                        <div>
                            <input
                                type="tel"
                                name="sdt"
                                value={formData.sdt}
                                onChange={handleChange}
                                placeholder={content.phoneNumber}
                                className={`w-3/5 mx-auto block px-3 py-3 glass-input rounded-lg placeholder-gray-500 text-sm ${errors.sdt ? 'border-2 border-red-500' : ''}`}
                            />
                            {errors.sdt && (
                                <p className="w-3/5 mx-auto mt-1 text-red-600 text-xs">{errors.sdt}</p>
                            )}
                        </div>

                        <div className="h-[15px]"></div>

                        <div>
                            <input
                                type="password"
                                name="matKhau"
                                value={formData.matKhau}
                                onChange={handleChange}
                                placeholder={content.password}
                                className={`w-3/5 mx-auto block px-3 py-3 glass-input rounded-lg placeholder-gray-500 text-sm ${errors.matKhau ? 'border-2 border-red-500' : ''}`}
                            />
                            {errors.matKhau && (
                                <p className="w-3/5 mx-auto mt-1 text-red-600 text-xs">{errors.matKhau}</p>
                            )}
                        </div>

                        <div className="h-[15px]"></div>

                        <div>
                            <input
                                type="password"
                                name="xacNhanMatKhau"
                                value={formData.xacNhanMatKhau}
                                onChange={handleChange}
                                placeholder={content.confirmPassword}
                                className={`w-3/5 mx-auto block px-3 py-3 glass-input rounded-lg placeholder-gray-500 text-sm ${errors.xacNhanMatKhau ? 'border-2 border-red-500' : ''}`}
                            />
                            {errors.xacNhanMatKhau && (
                                <p className="w-3/5 mx-auto mt-1 text-red-600 text-xs">{errors.xacNhanMatKhau}</p>
                            )}
                        </div>

                        <div className="h-[15px]"></div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-3/5 mx-auto block py-3 rounded-[24px] font-medium text-sm glass-button text-white ${isLoading ? 'cursor-not-allowed' : ''}`}
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    {content.registering}
                                </div>
                            ) : (
                                content.register
                            )}
                        </button>

                        <div className="text-center mt-5">
                            <span className="text-sm text-gray-600 font-medium">
                                {content.hasAccount}{' '}
                                <button
                                    onClick={() => navigate('/login')}
                                    className="text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    {content.loginNow}
                                </button>
                            </span>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Register;