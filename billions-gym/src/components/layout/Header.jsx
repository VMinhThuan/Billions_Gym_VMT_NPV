import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authUtils } from '../../utils/auth';
import { useNotification } from '../../contexts/NotificationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import NotificationIcon from '../NotificationIcon';

const Header = ({ onNavigateToLogin, onNavigateToRegister }) => {
    const navigate = useNavigate();
    const isAuthenticated = authUtils.isAuthenticated();
    const user = authUtils.getUser();
    const { showLogoutSuccess } = useNotification();
    const { language, toggleLanguage, content } = useLanguage();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const languageDropdownRef = useRef(null);

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

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
        setIsDropdownOpen(false); // Close dropdown when opening mobile menu
    };

    const toggleLanguageDropdown = () => {
        setIsLanguageDropdownOpen(!isLanguageDropdownOpen);
        setIsDropdownOpen(false); // Close user dropdown when opening language dropdown
    };

    const handleLanguageSelect = (selectedLanguage) => {
        if (selectedLanguage !== language) {
            toggleLanguage();
        }
        setIsLanguageDropdownOpen(false);
    };

    const handleNavigateToHome = () => {
        navigate('/');
        setIsMobileMenuOpen(false); // Close mobile menu if open
    };

    // Danh sách ngôn ngữ có sẵn
    const availableLanguages = [
        { code: 'vn', name: 'Tiếng Việt', flag: 'https://flagcdn.com/w20/vn.png' },
        { code: 'en', name: 'English', flag: 'https://flagcdn.com/w20/gb.png' }
    ];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
            if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target)) {
                setIsLanguageDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Close mobile menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            const mobileMenuButton = document.querySelector('.mobile-menu-button');
            const mobileMenu = document.querySelector('.mobile-menu');

            if (mobileMenuButton && mobileMenuButton.contains(event.target)) {
                return; // Don't close if clicking the button
            }

            if (mobileMenu && !mobileMenu.contains(event.target)) {
                setIsMobileMenuOpen(false);
            }
        };

        if (isMobileMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMobileMenuOpen]);

    return (
        <header className="fixed top-0 left-0 right-0 z-[9999] w-full bg-[#141414]">
            <div className="px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16 sm:h-20">
                    {/* Mobile Menu Button - Only visible on small screens */}
                    <button
                        className="mobile-menu-button lg:hidden flex flex-col justify-center items-center w-8 h-8 space-y-1 text-white hover:text-[#da2128] transition-colors mr-4"
                        onClick={toggleMobileMenu}
                        aria-label="Toggle mobile menu"
                    >
                        <span className={`w-6 h-0.5 bg-current transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
                        <span className={`w-6 h-0.5 bg-current transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
                        <span className={`w-6 h-0.5 bg-current transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
                    </button>

                    {/* Logo - Center on mobile, Left on desktop */}
                    <button
                        onClick={handleNavigateToHome}
                        className="flex flex-col items-center text-center leading-tight flex-1 lg:flex-none lg:items-start lg:text-left cursor-pointer hover:opacity-80 transition-opacity"
                    >
                        <h1 className="text-lg sm:text-xl md:text-2xl text-white font-[900] tracking-[2px] sm:tracking-[4px] md:tracking-[6px] whitespace-nowrap">
                            BILLIONS
                        </h1>
                        <p className="text-[8px] sm:text-[9px] md:text-[10px] text-[#da2128] font-[700] tracking-[4px] sm:tracking-[6px] md:tracking-[8px] whitespace-nowrap">
                            FITNESS & GYM
                        </p>
                    </button>

                    {/* Navigation */}
                    <nav className="hidden lg:flex space-x-4 xl:space-x-8">
                        <button
                            onClick={handleNavigateToHome}
                            className="text-white hover:text-[#da2128] hover:no-underline decoration-2 px-2 xl:px-3 py-2 text-sm xl:text-lg font-[500] whitespace-nowrap cursor-pointer bg-transparent border-none"
                        >
                            {content.home}
                        </button>
                        <a href="#" className="text-white hover:text-[#da2128] hover:no-underline decoration-2 px-2 xl:px-3 py-2 text-sm xl:text-lg font-[500] whitespace-nowrap">
                            {content.schedule}
                        </a>
                        <a href="#" className="text-white hover:text-[#da2128] hover:no-underline decoration-2 px-2 xl:px-3 py-2 text-sm xl:text-lg font-[500] whitespace-nowrap">
                            {content.packages}
                        </a>
                        <a href="#" className="text-white hover:text-[#da2128] hover:no-underline decoration-2 px-2 xl:px-3 py-2 text-sm xl:text-lg font-[500] whitespace-nowrap">
                            {content.services}
                        </a>
                        <a href="#" className="text-white hover:text-[#da2128] hover:no-underline decoration-2 px-2 xl:px-3 py-2 text-sm xl:text-lg font-[500] whitespace-nowrap">
                            {content.news}
                        </a>
                        <a href="#" className="text-white hover:text-[#da2128] hover:no-underline decoration-2 px-2 xl:px-3 py-2 text-sm xl:text-lg font-[500] whitespace-nowrap">
                            {content.promotions}
                        </a>
                        <a href="#" className="text-white hover:text-[#da2128] hover:no-underline decoration-2 px-2 xl:px-3 py-2 text-sm xl:text-lg font-[500] whitespace-nowrap">
                            {content.about}
                        </a>
                    </nav>

                    <div className="flex items-center space-x-2 sm:space-x-4">
                        {isAuthenticated ? (
                            <div className="flex items-center space-x-2 sm:space-x-3">
                                {/* Notification Icon */}
                                <NotificationIcon />

                                {/* Language Dropdown */}
                                <div className="relative" ref={languageDropdownRef}>
                                    <button
                                        onClick={toggleLanguageDropdown}
                                        className="flex items-center space-x-1 sm:space-x-2 bg-opacity-20 border border-gray-400 rounded-[40px] px-2 sm:px-3 py-1 sm:py-2 hover:bg-opacity-30 transition-all cursor-pointer"
                                    >
                                        <img
                                            src={language === 'vn' ? "https://flagcdn.com/w20/vn.png" : "https://flagcdn.com/w20/gb.png"}
                                            alt={language === 'vn' ? "Vietnam Flag" : "UK Flag"}
                                            className="w-4 h-3 sm:w-5 sm:h-4"
                                        />
                                        <span className="text-xs sm:text-sm font-medium text-white">
                                            {language === 'vn' ? 'VN' : 'EN'}
                                        </span>
                                        <svg
                                            className={`w-3 h-3 sm:w-4 sm:h-4 text-gray-300 transition-transform duration-200 ${isLanguageDropdownOpen ? 'rotate-180' : ''}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {/* Language Dropdown Menu */}
                                    {isLanguageDropdownOpen && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50 border border-gray-200">
                                            <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-100">
                                                Chọn ngôn ngữ
                                            </div>
                                            {availableLanguages.map((lang) => (
                                                <button
                                                    key={lang.code}
                                                    onClick={() => handleLanguageSelect(lang.code)}
                                                    className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-gray-50 flex items-center space-x-3 ${language === lang.code ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                                                        }`}
                                                >
                                                    <img
                                                        src={lang.flag}
                                                        alt={`${lang.name} Flag`}
                                                        className="w-5 h-4"
                                                    />
                                                    <span className="font-medium">{lang.name}</span>
                                                    {language === lang.code && (
                                                        <svg className="w-4 h-4 text-blue-600 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
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
                                                <div className="text-gray-500 text-xs break-words whitespace-normal max-w-[11rem] leading-5">{user?.email || user?.sdt || ''}</div>
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
                            <div className="flex items-center space-x-2 sm:space-x-3">
                                {/* Language Dropdown for non-authenticated users */}
                                <div className="relative" ref={languageDropdownRef}>
                                    <button
                                        onClick={toggleLanguageDropdown}
                                        className="flex items-center space-x-1 sm:space-x-2 bg-opacity-20 border border-gray-400 rounded-[40px] px-2 sm:px-3 py-1 sm:py-2 hover:bg-opacity-30 transition-all cursor-pointer"
                                    >
                                        <img
                                            src={language === 'vn' ? "https://flagcdn.com/w20/vn.png" : "https://flagcdn.com/w20/gb.png"}
                                            alt={language === 'vn' ? "Vietnam Flag" : "UK Flag"}
                                            className="w-4 h-3 sm:w-5 sm:h-4"
                                        />
                                        <span className="text-xs sm:text-sm font-medium text-white">
                                            {language === 'vn' ? 'VN' : 'EN'}
                                        </span>
                                        <svg
                                            className={`w-3 h-3 sm:w-4 sm:h-4 text-gray-300 transition-transform duration-200 ${isLanguageDropdownOpen ? 'rotate-180' : ''}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {/* Language Dropdown Menu */}
                                    {isLanguageDropdownOpen && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50 border border-gray-200">
                                            <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-100">
                                                Chọn ngôn ngữ
                                            </div>
                                            {availableLanguages.map((lang) => (
                                                <button
                                                    key={lang.code}
                                                    onClick={() => handleLanguageSelect(lang.code)}
                                                    className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-gray-50 flex items-center space-x-3 ${language === lang.code ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                                                        }`}
                                                >
                                                    <img
                                                        src={lang.flag}
                                                        alt={`${lang.name} Flag`}
                                                        className="w-5 h-4"
                                                    />
                                                    <span className="font-medium">{lang.name}</span>
                                                    {language === lang.code && (
                                                        <svg className="w-4 h-4 text-blue-600 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Login and Register Buttons */}
                                <div className="flex items-center space-x-1 sm:space-x-2">
                                    <button
                                        onClick={onNavigateToLogin}
                                        className="text-white hover:text-[#da2128] px-2 sm:px-4 py-1 sm:py-2 rounded-md font-medium transition-colors text-xs sm:text-sm whitespace-nowrap"
                                    >
                                        {content.login}
                                    </button>
                                    <button
                                        onClick={onNavigateToRegister}
                                        className="bg-[#da2128] hover:bg-[#b91c1c] text-white px-2 sm:px-4 py-1 sm:py-2 rounded-md font-medium transition-colors text-xs sm:text-sm whitespace-nowrap"
                                    >
                                        {content.signUp}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {isMobileMenuOpen && (
                <div className="mobile-menu lg:hidden absolute top-full left-0 right-0 bg-[#141414] border-t border-gray-700 shadow-lg z-50">
                    <div className="px-4 py-4 space-y-4">
                        {/* Navigation Links */}
                        <nav className="flex flex-col space-y-3">
                            <button
                                onClick={handleNavigateToHome}
                                className="text-white hover:text-[#da2128] px-3 py-2 text-lg font-[500] transition-colors border-b border-gray-700 cursor-pointer bg-transparent border-none text-left"
                            >
                                {content.home}
                            </button>
                            <a href="#" className="text-white hover:text-[#da2128] px-3 py-2 text-lg font-[500] transition-colors border-b border-gray-700">
                                {content.schedule}
                            </a>
                            <a href="#" className="text-white hover:text-[#da2128] px-3 py-2 text-lg font-[500] transition-colors border-b border-gray-700">
                                {content.packages}
                            </a>
                            <a href="#" className="text-white hover:text-[#da2128] px-3 py-2 text-lg font-[500] transition-colors border-b border-gray-700">
                                {content.services}
                            </a>
                            <a href="#" className="text-white hover:text-[#da2128] px-3 py-2 text-lg font-[500] transition-colors border-b border-gray-700">
                                {content.news}
                            </a>
                            <a href="#" className="text-white hover:text-[#da2128] px-3 py-2 text-lg font-[500] transition-colors border-b border-gray-700">
                                {content.promotions}
                            </a>
                            <a href="#" className="text-white hover:text-[#da2128] px-3 py-2 text-lg font-[500] transition-colors border-b border-gray-700">
                                {content.about}
                            </a>
                        </nav>

                        {/* Language Dropdown */}
                        <div className="pt-4 border-t border-gray-700">
                            <div className="px-4 py-2 text-sm text-gray-400 border-b border-gray-700 mb-3">
                                Chọn ngôn ngữ
                            </div>
                            {availableLanguages.map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => handleLanguageSelect(lang.code)}
                                    className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-colors hover:bg-gray-800 rounded-lg ${language === lang.code ? 'bg-gray-800 text-[#da2128]' : 'text-white'
                                        }`}
                                >
                                    <img
                                        src={lang.flag}
                                        alt={`${lang.name} Flag`}
                                        className="w-6 h-4"
                                    />
                                    <span className="font-medium">{lang.name}</span>
                                    {language === lang.code && (
                                        <svg className="w-5 h-5 text-[#da2128] ml-auto" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* User Actions */}
                        <div className="pt-4 border-t border-gray-700">
                            {isAuthenticated ? (
                                <div className="space-y-3">
                                    <div className="flex items-center space-x-3 px-3 py-2">
                                        <div className="w-12 h-12 rounded-full bg-[#da2128] flex items-center justify-center text-white font-bold text-xl">
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
                                        <div>
                                            <div className="text-white font-medium">{user?.hoTen || content.user}</div>
                                            <div className="text-gray-400 text-sm break-words whitespace-normal max-w-[12rem] leading-5">{user?.email || user?.sdt || ''}</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-3 py-3 text-white hover:text-[#da2128] hover:bg-gray-800 rounded-lg transition-colors"
                                    >
                                        {content.logout}
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col space-y-3">
                                    <button
                                        onClick={onNavigateToLogin}
                                        className="w-full text-center text-white hover:text-[#da2128] px-4 py-3 rounded-lg font-medium transition-colors border border-gray-600 hover:border-[#da2128]"
                                    >
                                        {content.login}
                                    </button>
                                    <button
                                        onClick={onNavigateToRegister}
                                        className="w-full text-center bg-[#da2128] hover:bg-[#b91c1c] text-white px-4 py-3 rounded-lg font-medium transition-colors"
                                    >
                                        {content.signUp}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};
export default Header;