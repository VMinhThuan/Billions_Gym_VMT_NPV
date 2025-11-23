import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authUtils } from '../../utils/auth';

const PTHeader = ({ onSidebarToggle }) => {
    const navigate = useNavigate();
    const user = authUtils.getUser();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const handleLogout = () => {
        setIsDropdownOpen(false);
        authUtils.clearAuthData();
        navigate('/login');
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="fixed top-0 left-0 right-0 h-16 bg-[#0a0a0a] border-b border-[#2a2a2a] z-30">
            <div className="flex items-center justify-between h-full px-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onSidebarToggle}
                        className="lg:hidden text-white p-2 hover:bg-[#2a2a2a] rounded"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <h1 className="text-xl font-bold text-white">BILLIONS FITNESS & GYM - PT</h1>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center gap-2 text-white hover:bg-[#2a2a2a] p-2 rounded"
                        >
                            <div className="w-8 h-8 rounded-full bg-[#da2128] flex items-center justify-center text-white font-semibold">
                                {user?.hoTen?.charAt(0)?.toUpperCase() || 'P'}
                            </div>
                            <span className="hidden md:block">{user?.hoTen || 'PT'}</span>
                        </button>

                        {isDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-lg">
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left px-4 py-2 text-white hover:bg-[#2a2a2a] rounded"
                                >
                                    Đăng xuất
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default PTHeader;

