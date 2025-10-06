import React, { createContext, useContext, useState } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState('vn');

    const toggleLanguage = () => {
        setLanguage(prev => prev === 'vn' ? 'en' : 'vn');
    };

    const content = {
        vn: {
            // Header Navigation
            home: 'Trang chủ',
            schedule: 'Lịch học',
            packages: 'Các gói tập',
            services: 'Các dịch vụ',
            news: 'Tin tức',
            promotions: 'Khuyến mãi',
            about: 'Về chúng tôi',
            logout: 'Đăng xuất',
            user: 'Người dùng',

            // Login Page
            greeting: 'Xin Chào!',
            welcome: 'Chào mừng bạn đến với Billions Gym & Fitness',
            email: 'Email',
            password: 'Mật khẩu',
            forgotPassword: 'Quên mật khẩu ?',
            login: 'Đăng nhập',
            noAccount: 'Chưa có tài khoản ?',
            signUp: 'Đăng ký',
            loggingIn: 'Đang đăng nhập...',
            emailOrPhone: 'Email hoặc số điện thoại',

            // Register Page
            fullName: 'Họ và tên',
            phoneNumber: 'Số điện thoại',
            confirmPassword: 'Xác nhận mật khẩu',
            register: 'Đăng ký',
            registering: 'Đang đăng ký...',
            hasAccount: 'Đã có tài khoản?',
            loginNow: 'Đăng nhập ngay',
            registerDescription: 'Tạo tài khoản mới để bắt đầu hành trình thể hình',

            // Notifications
            loginSuccess: 'Đăng nhập thành công',
            loginFailed: 'Đăng nhập thất bại',
            logoutSuccess: 'Đăng xuất thành công',
            sessionExpired: 'Phiên đăng nhập hết hạn',
            networkError: 'Lỗi kết nối',
            pleaseLoginAgain: 'Vui lòng đăng nhập lại để tiếp tục sử dụng.',
            checkConnection: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet.',
            pleaseCheckInfo: 'Vui lòng kiểm tra lại thông tin đăng nhập.',

            // Footer
            footerTagline: 'Điểm đến thể hình tối ưu của bạn!',
            footerDescription: 'Chúng tôi cung cấp cơ sở vật chất đẳng cấp thế giới và các huấn luyện viên chuyên nghiệp để giúp bạn đạt được mục tiêu thể hình của mình.',
            quickLinks: 'Liên Kết Nhanh',
            footerAbout: 'Giới Thiệu',
            classes: 'Lớp Học',
            trainers: 'Huấn Luyện Viên',
            members: 'Thành Viên',
            contact: 'Liên Hệ',
            address: 'Địa chỉ: 123 Fitness Street',
            phone: 'Điện thoại: (555) 123-4567',
            footerEmail: 'Email: info@billionsgym.com',
            copyright: '© 2025 Billions Gym. Tất cả quyền được bảo lưu.',

            // Home Page
            welcomeMessage: 'Chào mừng bạn đến với Billions Gym',
            homeDescription: 'Khám phá các dịch vụ thể hình chuyên nghiệp và đạt được mục tiêu của bạn',
            getStarted: 'Bắt đầu ngay',
            learnMore: 'Tìm hiểu thêm',

            // Common
            pleaseEnterEmail: 'Vui lòng nhập email hoặc số điện thoại',
            pleaseEnterValidEmail: 'Vui lòng nhập email hoặc số điện thoại hợp lệ',
            pleaseEnterPassword: 'Vui lòng nhập mật khẩu',
            passwordTooLong: 'Mật khẩu không được quá 128 ký tự',
            seeYouAgain: 'Hẹn gặp lại bạn!'
        },
        en: {
            // Header Navigation
            home: 'Home',
            schedule: 'Schedule',
            packages: 'Packages',
            services: 'Services',
            news: 'News',
            promotions: 'Promotions',
            about: 'About Us',
            logout: 'Logout',
            user: 'User',

            // Login Page
            greeting: 'Hi There!',
            welcome: 'Welcome To Billions Gym & Fitness',
            email: 'Email',
            password: 'Password',
            forgotPassword: 'Forget Password ?',
            login: 'Log in',
            noAccount: "Don't have an account ?",
            signUp: 'Sign Up',
            loggingIn: 'Logging in...',
            emailOrPhone: 'Email or Phone Number',

            // Register Page
            fullName: 'Full Name',
            phoneNumber: 'Phone Number',
            confirmPassword: 'Confirm Password',
            register: 'Register',
            registering: 'Registering...',
            hasAccount: 'Already have an account?',
            loginNow: 'Login now',
            registerDescription: 'Create a new account to start your fitness journey',

            // Notifications
            loginSuccess: 'Login successful',
            loginFailed: 'Login failed',
            logoutSuccess: 'Logout successful',
            sessionExpired: 'Session expired',
            networkError: 'Connection error',
            pleaseLoginAgain: 'Please log in again to continue using.',
            checkConnection: 'Unable to connect to server. Please check your internet connection.',
            pleaseCheckInfo: 'Please check your login information.',

            // Footer
            footerTagline: 'Your optimal fitness destination!',
            footerDescription: 'We provide world-class facilities and professional trainers to help you achieve your fitness goals.',
            quickLinks: 'Quick Links',
            footerAbout: 'About',
            classes: 'Classes',
            trainers: 'Trainers',
            members: 'Members',
            contact: 'Contact',
            address: 'Address: 123 Fitness Street',
            phone: 'Phone: (555) 123-4567',
            footerEmail: 'Email: info@billionsgym.com',
            copyright: '© 2025 Billions Gym. All rights reserved.',

            // Home Page
            welcomeMessage: 'Welcome to Billions Gym',
            homeDescription: 'Discover professional fitness services and achieve your goals',
            getStarted: 'Get Started',
            learnMore: 'Learn More',

            // Common
            pleaseEnterEmail: 'Please enter email or phone number',
            pleaseEnterValidEmail: 'Please enter a valid email or phone number',
            pleaseEnterPassword: 'Please enter password',
            passwordTooLong: 'Password must not exceed 128 characters',
            seeYouAgain: 'See you again!'
        }
    };

    return (
        <LanguageContext.Provider value={{
            language,
            setLanguage,
            toggleLanguage,
            content: content[language]
        }}>
            {children}
        </LanguageContext.Provider>
    );
};
