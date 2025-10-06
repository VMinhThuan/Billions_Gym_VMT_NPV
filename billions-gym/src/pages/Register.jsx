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

            if (result.success) {
                showSuccess('Đăng ký thành công! Vui lòng đăng nhập để tiếp tục.');
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            } else {
                showError(result.message || 'Đăng ký thất bại. Vui lòng thử lại.');
            }
        } catch (error) {
            console.error('Register error:', error);
            showError(error.message || 'Đăng ký thất bại. Vui lòng thử lại.');
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
                <div className="w-full md:w-1/2 h-full glass-card rounded-l-[60px] p-8 flex flex-col justify-start">
                    <div className="flex justify-end">
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

                    <div className="text-center mb-10">
                        <h1 className="text-6xl font-medium text-gray-900 mb-2">
                            {content.register}
                        </h1>
                        <p className="text-[16px] text-gray-600">
                            {content.registerDescription}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-2">
                        {/* Error Messages */}
                        {Object.keys(errors).length > 0 && (
                            <div className="w-3/5 mx-auto mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
                                {Object.values(errors)[0]}
                            </div>
                        )}

                        <div>
                            <input
                                type="text"
                                name="hoTen"
                                value={formData.hoTen}
                                onChange={handleChange}
                                placeholder={content.fullName}
                                className="w-3/5 mx-auto block px-3 py-3 bg-white bg-opacity-80 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 text-sm"
                            />
                        </div>

                        <div className="h-[15px]"></div>

                        <div>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Email (không bắt buộc)"
                                className="w-3/5 mx-auto block px-3 py-3 bg-white bg-opacity-80 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 text-sm"
                            />
                        </div>

                        <div className="h-[15px]"></div>

                        <div>
                            <input
                                type="tel"
                                name="sdt"
                                value={formData.sdt}
                                onChange={handleChange}
                                placeholder={content.phoneNumber}
                                className="w-3/5 mx-auto block px-3 py-3 bg-white bg-opacity-80 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 text-sm"
                            />
                        </div>

                        <div className="h-[15px]"></div>

                        <div>
                            <input
                                type="password"
                                name="matKhau"
                                value={formData.matKhau}
                                onChange={handleChange}
                                placeholder="Mật khẩu"
                                className="w-3/5 mx-auto block px-3 py-3 bg-white bg-opacity-80 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 text-sm"
                            />
                        </div>

                        <div className="h-[15px]"></div>

                        <div>
                            <input
                                type="password"
                                name="xacNhanMatKhau"
                                value={formData.xacNhanMatKhau}
                                onChange={handleChange}
                                placeholder={content.confirmPassword}
                                className="w-3/5 mx-auto block px-3 py-3 bg-white bg-opacity-80 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 text-sm"
                            />
                        </div>

                        <div className="h-[15px]"></div>

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