import React, { useState } from 'react';
import './header.css';
import SearchResults from './SearchResults';

const Header = () => {
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [isLoading, setIsLoading] = useState(false);


    // Mock search results - in real app, this would come from API
    const mockSearchResults = [
        {
            id: '1',
            title: 'Yoga & Pilates',
            description: 'Các lớp yoga và pilates được hướng dẫn bởi huấn luyện viên chuyên nghiệp',
            type: 'service' as const,
            url: '#/services/yoga'
        },
        {
            id: '2',
            title: 'Body Combat',
            description: 'Lớp tập nhóm cường độ cao với âm nhạc sôi động',
            type: 'class' as const,
            url: '#/classes/body-combat'
        },
        {
            id: '3',
            title: 'Huấn luyện viên cá nhân',
            description: 'Dịch vụ PT 1-1 với chương trình tập luyện cá nhân hóa',
            type: 'service' as const,
            url: '#/services/personal-training'
        },
        {
            id: '4',
            title: 'Câu lạc bộ Quận 1',
            description: 'CLB Landmark 81 - Địa chỉ: 81 Võ Văn Tần, Q1, TP.HCM',
            type: 'club' as const,
            url: '#/clubs/quan-1'
        }
    ];

    const toggleDropdown = (menu: string) => {
        setActiveDropdown(activeDropdown === menu ? null : menu);
    };

    const toggleSearch = () => {
        setIsSearchOpen(!isSearchOpen);
        if (!isSearchOpen) {
            setSearchQuery('');
            setShowSearchResults(false);
        }
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            setShowSearchResults(true);
            console.log('Searching for:', searchQuery);
        }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    const closeSearchResults = () => {
        setShowSearchResults(false);
    };

    return (
        <header className="header">
            <div className="header-container">
                {/* Logo */}
                <div className="logo">
                    <div className="logo-main">BILLIONS</div>
                    <div className="logo-sub">FITNESS & YOGA</div>
                </div>

                {/* Navigation Menu */}
                <nav className="nav-menu">
                    <div className="nav-item" onMouseEnter={() => toggleDropdown('dich-vu')}>
                        <span>DỊCH VỤ</span>
                        <span className="dropdown-arrow">▼</span>
                        {activeDropdown === 'dich-vu' && (
                            <div className="dropdown-menu">
                                <a href="#">Tập luyện cá nhân</a>
                                <a href="#">Yoga & Pilates</a>
                                <a href="#">Thể hình</a>
                                <a href="#">Cardio</a>
                            </div>
                        )}
                    </div>

                    <div className="nav-item" onMouseEnter={() => toggleDropdown('cau-lac-bo')}>
                        <span>CÂU LẠC BỘ</span>
                        <span className="dropdown-arrow">▼</span>
                        {activeDropdown === 'cau-lac-bo' && (
                            <div className="dropdown-menu">
                                <a href="#">Quận 1</a>
                                <a href="#">Quận 3</a>
                                <a href="#">Quận 7</a>
                                <a href="#">Thủ Đức</a>
                            </div>
                        )}
                    </div>

                    <div className="nav-item" onMouseEnter={() => toggleDropdown('lich-tap')}>
                        <span>LỊCH TẬP / SCHEDULE</span>
                        <span className="dropdown-arrow">▼</span>
                        {activeDropdown === 'lich-tap' && (
                            <div className="dropdown-menu">
                                <a href="#">Lịch tập tuần</a>
                                <a href="#">Lịch tập tháng</a>
                                <a href="#">Lịch tập đặc biệt</a>
                            </div>
                        )}
                    </div>

                    <div className="nav-item" onMouseEnter={() => toggleDropdown('bang-gia')}>
                        <span>BẢNG GIÁ</span>
                        <span className="dropdown-arrow">▼</span>
                        {activeDropdown === 'bang-gia' && (
                            <div className="dropdown-menu">
                                <a href="#">Gói 1 tháng</a>
                                <a href="#">Gói 3 tháng</a>
                                <a href="#">Gói 6 tháng</a>
                                <a href="#">Gói 1 năm</a>
                            </div>
                        )}
                    </div>

                    <div className="nav-item">
                        <span>QUÀ TẶNG</span>
                    </div>
                </nav>

                {/* Right Section */}
                <div className="header-right">
                    {/* Search Section */}
                    <div className="search-section">
                        {isSearchOpen ? (
                            <form className="search-form" onSubmit={handleSearchSubmit}>
                                <div className="search-input-container">
                                    <input
                                        type="text"
                                        className="search-input"
                                        placeholder="Tìm kiếm dịch vụ, lớp tập, huấn luyện viên..."
                                        value={searchQuery}
                                        onChange={handleSearchChange}
                                        autoFocus
                                    />
                                    <button type="submit" className="search-submit-btn">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>
                                    <button type="button" className="search-close-btn" onClick={toggleSearch}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <button className="search-toggle-btn" onClick={toggleSearch}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        )}
                    </div>

                    <button onClick={() => {
                        if (window.confirm('Đăng nhập vai trò Admin và mở Dashboard?')) {
                            setIsLoading(true);
                            setTimeout(() => {
                                if (window.location.hash) {
                                    window.location.hash = '/login';
                                } else {
                                    window.history.pushState({}, '', '/login');
                                    window.dispatchEvent(new PopStateEvent('popstate'));
                                }
                                setIsLoading(false);
                            }, 1000);
                        }
                    }} className="cta-button-1">
                        ĐĂNG NHẬP ADMIN
                    </button>

                    {/* Call-to-Action Button */}
                    <button className="cta-button">
                        TẬP THỬ MIỄN PHÍ
                    </button>


                    {/* <button
                        className="admin-login-btn"
                        variant="secondary"
                        size="small" xr
                        onClick={() => {
                            if (window.confirm('Đăng nhập vai trò Admin và mở Dashboard?')) {
                                setIsLoading(true);
                                setTimeout(() => {
                                    if (window.location.hash) {
                                        window.location.hash = '/login';
                                    } else {
                                        window.history.pushState({}, '', '/login');
                                        window.dispatchEvent(new PopStateEvent('popstate'));
                                    }
                                    setIsLoading(false);
                                }, 1000);
                            }
                        }}
                    >
                        Đăng nhập Admin
                    </button> */}
                </div>
            </div>

            {/* Search Results Modal */}
            <SearchResults
                query={searchQuery}
                results={mockSearchResults}
                isVisible={showSearchResults}
                onClose={closeSearchResults}
            />
        </header>
    );
};

export default Header;