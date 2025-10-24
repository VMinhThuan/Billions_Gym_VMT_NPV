import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authUtils } from '../../utils/auth';
import { useNotification } from '../../contexts/NotificationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import NotificationIcon from '../NotificationIcon';

const Header = ({ onNavigateToLogin, onNavigateToRegister, fullScreen = false }) => {
    const navigate = useNavigate();
    const isAuthenticated = authUtils.isAuthenticated();
    const user = authUtils.getUser();
    const { showLogoutSuccess } = useNotification();
    const { language, toggleLanguage, content } = useLanguage();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
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

    const toggleLanguageDropdown = () => {
        setIsLanguageDropdownOpen(!isLanguageDropdownOpen);
        setIsDropdownOpen(false);
    };

    const handleLanguageSelect = (selectedLanguage) => {
        if (selectedLanguage !== language) {
            toggleLanguage();
        }
        setIsLanguageDropdownOpen(false);
    };

    const handleNavigateToHome = () => {
        navigate('/');
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (!searchQuery || searchQuery.trim() === '') return;
        const q = encodeURIComponent(searchQuery.trim());
        navigate(`/search?q=${q}`);
        setSearchQuery('');
    };

    const handleSearchChange = (e) => setSearchQuery(e.target.value);

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

    return (
        <header
            className={
                `fixed top-0 left-0 right-0 z-[9999] bg-[#141414] ${fullScreen ? 'w-screen h-screen flex items-center justify-center' : 'w-full'}`
            }
            style={fullScreen ? { inset: 0 } : undefined}
        >
            <div className={`px-4 sm:px-6 lg:px-8 ${fullScreen ? 'w-full max-w-none' : ''}`}>
                <div className={`relative flex justify-between items-center ${fullScreen ? 'h-full' : 'h-16 sm:h-20'}`}>
                    {/* Logo - Center on mobile, left on larger screens */}
                    <div className="flex justify-center lg:justify-start">
                        <button
                            onClick={handleNavigateToHome}
                            className="flex flex-col items-center lg:items-start text-center lg:text-left leading-tight cursor-pointer hover:opacity-80 transition-opacity"
                        >
                            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-white font-[900] tracking-[2px] sm:tracking-[4px] md:tracking-[6px] lg:tracking-[8px] whitespace-nowrap">
                                BILLIONS
                            </h1>
                            <p className="text-[8px] sm:text-[9px] md:text-[10px] lg:text-[11px] text-[#da2128] font-[700] tracking-[4px] sm:tracking-[6px] md:tracking-[8px] lg:tracking-[10px] whitespace-nowrap">
                                FITNESS & GYM
                            </p>
                        </button>
                    </div>
                    {/* Conditional Content Based on Authentication */}
                    {isAuthenticated ? (
                        /* Search bar when logged in - Hidden on mobile, visible on tablet+ */
                        <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center w-full max-w-lg px-4">
                            <div className="relative w-full">
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" />
                                </svg>
                                <input
                                    aria-label="Tìm kiếm"
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                    placeholder={content?.search || 'Tìm kiếm...'}
                                    className="w-full pl-10 pr-3 py-2 rounded-full bg-[#0f0f0f] text-white placeholder-gray-400 border border-gray-700 focus:outline-none"
                                />
                            </div>
                        </form>
                    ) : (
                        /* Navigation menu when not logged in - Hidden on mobile */
                        <nav className="hidden lg:flex space-x-7">
                            <button
                                onClick={handleNavigateToHome}
                                className="text-white hover:text-[#da2128] px-3 py-2 text-lg font-[500] transition-colors cursor-pointer bg-transparent border-none"
                            >
                                {content.home}
                            </button>
                            <a href="#" className="text-white hover:text-[#da2128] hover:no-underline px-3 py-2 text-lg font-[500] transition-colors">
                                {content.schedule}
                            </a>
                            <a href="#" className="text-white hover:text-[#da2128] hover:no-underline px-3 py-2 text-lg font-[500] transition-colors">
                                {content.packages}
                            </a>
                            <a href="#" className="text-white hover:text-[#da2128] hover:no-underline px-3 py-2 text-lg font-[500] transition-colors">
                                {content.services}
                            </a>
                            <a href="#" className="text-white hover:text-[#da2128] hover:no-underline px-3 py-2 text-lg font-[500] transition-colors">
                                {content.news}
                            </a>
                            <a href="#" className="text-white hover:text-[#da2128] hover:no-underline px-3 py-2 text-lg font-[500] transition-colors">
                                {content.promotions}
                            </a>
                            <a href="#" className="text-white hover:text-[#da2128] hover:no-underline px-3 py-2 text-lg font-[500] transition-colors">
                                {content.about}
                            </a>
                        </nav>
                    )}

                    {/* Right side controls */}
                    <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-4">
                        {/* Notification Icon - Hidden on very small screens */}
                        <div className="hidden xs:block sm:block">
                            <NotificationIcon />
                        </div>

                        <div className="relative" ref={languageDropdownRef}>
                            <button
                                onClick={toggleLanguageDropdown}
                                className="flex items-center space-x-1 sm:space-x-2 bg-opacity-20 border border-gray-400 rounded-[40px] px-1.5 sm:px-2 lg:px-3 py-1 sm:py-1.5 lg:py-2 hover:bg-opacity-30 transition-all cursor-pointer"
                            >
                                <img
                                    src={language === 'vn' ? "https://flagcdn.com/w20/vn.png" : "https://flagcdn.com/w20/gb.png"}
                                    alt={language === 'vn' ? "Vietnam Flag" : "UK Flag"}
                                    className="w-3 h-2.5 sm:w-4 sm:h-3 lg:w-5 lg:h-4"
                                />
                                <span className="text-xs sm:text-sm font-medium text-white hidden sm:inline">{language === 'vn' ? 'VN' : 'EN'}</span>
                                <svg className={`w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-4 lg:h-4 text-gray-300 transition-transform duration-200 ${isLanguageDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </button>

                            {isLanguageDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-40 sm:w-48 bg-white rounded-lg shadow-lg py-2 z-50 border border-gray-200">
                                    <div className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-500 border-b border-gray-100">Chọn ngôn ngữ</div>
                                    {availableLanguages.map((lang) => (
                                        <button key={lang.code} onClick={() => handleLanguageSelect(lang.code)} className={`w-full text-left px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm transition-colors hover:bg-gray-50 flex items-center space-x-2 sm:space-x-3 ${language === lang.code ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}>
                                            <img src={lang.flag} alt={`${lang.name} Flag`} className="w-4 h-3 sm:w-5 sm:h-4" />
                                            <span className="font-medium">{lang.name}</span>
                                            {language === lang.code && (<svg className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 ml-auto" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>)}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {isAuthenticated ? (
                            <div className="relative" ref={dropdownRef}>
                                <div className="avatar flex items-center space-x-1 sm:space-x-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={toggleDropdown}>
                                    <div className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-full bg-[#da2128] flex items-center justify-center text-white font-bold text-xs sm:text-sm lg:text-lg">
                                        {user?.anhDaiDien ? (
                                            <img src={user.anhDaiDien} alt={user?.hoTen} className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            <span>{user?.hoTen ? user.hoTen.charAt(0).toUpperCase() : 'U'}</span>
                                        )}
                                    </div>

                                </div>

                                {isDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-40 sm:w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                                        <div className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 border-b border-gray-100">
                                            <div className="font-medium">{user?.hoTen || content.user}</div>
                                            <div className="text-gray-500 text-xs break-words whitespace-normal max-w-[10rem] sm:max-w-[11rem] leading-4 sm:leading-5">{user?.email || user?.sdt || ''}</div>
                                        </div>
                                        <button onClick={handleLogout} className="w-full text-left px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 transition-colors">{content.logout}</button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center space-x-1 sm:space-x-2">
                                <button onClick={onNavigateToLogin} className="text-white hover:text-[#da2128] hover:cursor-pointer px-1.5 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-2 rounded-md font-medium transition-colors text-lg sm:text-sm whitespace-nowrap">{content.login}</button>
                                <button onClick={onNavigateToRegister} className="bg-[#da2128] hover:bg-[#b91c1c] hover:cursor-pointer text-white px-1.5 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-2 rounded-md font-medium transition-colors text-lg sm:text-sm whitespace-nowrap">{content.signUp}</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};
export default Header;