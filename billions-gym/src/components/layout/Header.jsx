import React, { useState, useRef, useEffect } from 'react';
import { authUtils } from '../../utils/auth';
import { useNotification } from '../../contexts/NotificationContext';
import { useLanguage } from '../../contexts/LanguageContext';

const Header = ({ onNavigateToLogin, onNavigateToRegister }) => {
    const isAuthenticated = authUtils.isAuthenticated();
    const user = authUtils.getUser();
    const { showLogoutSuccess } = useNotification();
    const { language, toggleLanguage, content } = useLanguage();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const handleLogout = () => {
        showLogoutSuccess();
        setIsDropdownOpen(false);

        setTimeout(() => {
            authUtils.logout();
            window.location.reload();
        }, 1000);
    };

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <header className="fixed top-0 left-0 right-0 z-[9999] w-full bg-[#141414]">
            <div className="max-sm:px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    <div className="flex flex-col items-center text-center leading-8">
                        <h1 className="text-2xl text-white font-[900] tracking-[6px] ">
                            BILLIONS
                        </h1>
                        <p className="text-[10px] text-[#da2128] font-[700] tracking-[8px] ">
                            FITNESS & GYM
                        </p>
                    </div>

                    {/* Navigation */}
                    <nav className="hidden md:flex space-x-8">
                        <a href="#" className="text-white hover:text-[#da2128] hover:no-underline decoration-2 px-3 py-2 text-lg font-[500] ">
                            {content.home}
                        </a>
                        <a href="#" className="text-white hover:text-[#da2128] hover:no-underline decoration-2 px-3 py-2 text-lg font-[500] ">
                            {content.schedule}
                        </a>
                        <a href="#" className="text-white hover:text-[#da2128] hover:no-underline decoration-2 px-3 py-2 text-lg font-[500] ">
                            {content.packages}
                        </a>
                        <a href="#" className="text-white hover:text-[#da2128] hover:no-underline decoration-2 px-3 py-2 text-lg font-[500] ">
                            {content.services}
                        </a>
                        <a href="#" className="text-white hover:text-[#da2128] hover:no-underline decoration-2 px-3 py-2 text-lg font-[500] ">
                            {content.news}
                        </a>
                        <a href="#" className="text-white hover:text-[#da2128] hover:no-underline decoration-2 px-3 py-2 text-lg font-[500] ">
                            {content.promotions}
                        </a>
                        <a href="#" className="text-white hover:text-[#da2128] hover:no-underline decoration-2 px-3 py-2 text-lg font-[500] ">
                            {content.about}
                        </a>
                    </nav>

                    <div className="flex items-center space-x-4">
                        {isAuthenticated ? (
                            <div className="flex items-center space-x-3">
                                <div className="flex items-center space-x-2 cursor-pointer bg-opacity-20 border border-gray-400 rounded-[40px] px-3 py-2 hover:bg-opacity-30 transition-all" onClick={toggleLanguage}>
                                    <img
                                        src={language === 'vn' ? "https://flagcdn.com/w20/vn.png" : "https://flagcdn.com/w20/gb.png"}
                                        alt={language === 'vn' ? "Vietnam Flag" : "UK Flag"}
                                        className="w-5 h-4"
                                    />
                                    <span className="text-sm font-medium text-white">{language === 'vn' ? 'VN' : 'EN'}</span>
                                    <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>

                                {/* Avatar */}
                                <div className="relative" ref={dropdownRef}>
                                    <div
                                        className="avatar flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
                                        onClick={toggleDropdown}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-[#da2128] flex items-center justify-center text-white font-bold text-lg">
                                            {user?.anhDaiDien ? (
                                                <img
                                                    src={user.anhDaiDien}
                                                    alt={user?.hoTen}
                                                    className="w-full h-full rounded-full object-cover"
                                                />
                                            ) : (
                                                <span>
                                                    {user?.hoTen ? user.hoTen.charAt(0).toUpperCase() : 'U'}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Dropdown Menu */}
                                    {isDropdownOpen && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                                            <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                                                <div className="font-medium">{user?.hoTen || content.user}</div>
                                                <div className="text-gray-500 text-xs">{user?.email || user?.sdt || ''}</div>
                                            </div>
                                            <button
                                                onClick={handleLogout}
                                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                            >
                                                {content.logout}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-3">
                                {/* Language Toggle for non-authenticated users */}
                                <div className="flex items-center space-x-2 cursor-pointer bg-opacity-20 border border-gray-400 rounded-[40px] px-3 py-2 hover:bg-opacity-30 transition-all" onClick={toggleLanguage}>
                                    <img
                                        src={language === 'vn' ? "https://flagcdn.com/w20/vn.png" : "https://flagcdn.com/w20/gb.png"}
                                        alt={language === 'vn' ? "Vietnam Flag" : "UK Flag"}
                                        className="w-5 h-4"
                                    />
                                    <span className="text-sm font-medium text-white">{language === 'vn' ? 'VN' : 'EN'}</span>
                                    <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>

                                {/* Login and Register Buttons */}
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={onNavigateToLogin}
                                        className="text-white hover:text-[#da2128] px-4 py-2 rounded-md font-medium transition-colors"
                                    >
                                        {content.login}
                                    </button>
                                    <button
                                        onClick={onNavigateToRegister}
                                        className="bg-[#da2128] hover:bg-[#b91c1c] text-white px-4 py-2 rounded-md font-medium transition-colors"
                                    >
                                        {content.signUp}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};
export default Header;