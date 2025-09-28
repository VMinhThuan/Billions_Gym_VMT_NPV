import React, { useState } from 'react';
import { ThemeProvider } from '../contexts/ThemeContext';
import ExerciseList from '../components/ExerciseList';
import EnhancedExerciseManager from '../components/EnhancedExerciseManager';
import './ExerciseShowcase.css';

const ExerciseShowcase: React.FC = () => {
    const [currentView, setCurrentView] = useState<'list' | 'manager'>('list');

    return (
        <ThemeProvider>
            <div className="exercise-showcase">
                {/* Navigation Header */}
                <div className="showcase-header">
                    <div className="header-content">
                        <h1 className="showcase-title">
                            <span className="title-icon">🏋️‍♂️</span>
                            Giao Diện Bài Tập Mới
                        </h1>
                        <p className="showcase-subtitle">
                            Thiết kế hiện đại với card layout tương tự như trong hình ảnh mẫu
                        </p>
                    </div>
                    
                    <div className="view-toggle">
                        <button 
                            className={`toggle-btn ${currentView === 'list' ? 'active' : ''}`}
                            onClick={() => setCurrentView('list')}
                        >
                            <span className="btn-icon">📋</span>
                            Danh Sách
                        </button>
                        <button 
                            className={`toggle-btn ${currentView === 'manager' ? 'active' : ''}`}
                            onClick={() => setCurrentView('manager')}
                        >
                            <span className="btn-icon">⚙️</span>
                            Quản Lý
                        </button>
                    </div>
                </div>

                {/* Feature Highlights */}
                <div className="feature-highlights">
                    <div className="feature-card">
                        <div className="feature-icon">🎨</div>
                        <h3>Thiết Kế Hiện Đại</h3>
                        <p>Card layout đẹp mắt với gradient, animations và responsive design</p>
                    </div>
                    
                    <div className="feature-card">
                        <div className="feature-icon">🌓</div>
                        <h3>Dark/Light Mode</h3>
                        <p>Hỗ trợ chuyển đổi giữa chế độ sáng và tối một cách mượt mà</p>
                    </div>
                    
                    <div className="feature-card">
                        <div className="feature-icon">📱</div>
                        <h3>Responsive</h3>
                        <p>Tối ưu cho mọi thiết bị từ desktop đến mobile</p>
                    </div>
                    
                    <div className="feature-card">
                        <div className="feature-icon">⚡</div>
                        <h3>Tương Tác Nhanh</h3>
                        <p>Click vào card để xem chi tiết, hover effects mượt mà</p>
                    </div>
                    
                    <div className="feature-card">
                        <div className="feature-icon">🔧</div>
                        <h3>Quản Lý Dễ Dàng</h3>
                        <p>Chức năng sửa/xóa được tích hợp một cách hợp lý</p>
                    </div>
                    
                    <div className="feature-card">
                        <div className="feature-icon">🔍</div>
                        <h3>Tìm Kiếm & Lọc</h3>
                        <p>Tìm kiếm theo tên và lọc theo nhóm cơ, mức độ khó</p>
                    </div>
                </div>

                {/* Main Content */}
                <div className="showcase-content">
                    {currentView === 'list' ? (
                        <div className="content-section">
                            <div className="section-header">
                                <h2>Giao Diện Danh Sách Bài Tập</h2>
                                <p>Hiển thị bài tập dưới dạng card với thông tin đầy đủ và trực quan</p>
                            </div>
                            <ExerciseList showManagement={false} />
                        </div>
                    ) : (
                        <div className="content-section">
                            <div className="section-header">
                                <h2>Giao Diện Quản Lý Bài Tập</h2>
                                <p>Quản lý bài tập với đầy đủ chức năng thêm, sửa, xóa và chuyển đổi theme</p>
                            </div>
                            <EnhancedExerciseManager />
                        </div>
                    )}
                </div>

                {/* Implementation Guide */}
                <div className="implementation-guide">
                    <h2>Hướng Dẫn Tích Hợp</h2>
                    
                    <div className="guide-steps">
                        <div className="step">
                            <div className="step-number">1</div>
                            <div className="step-content">
                                <h3>Thay Thế Component Cũ</h3>
                                <p>Trong admin.tsx, thay thế BaiTapManager bằng EnhancedExerciseManager</p>
                                <pre className="code-block">
{`// Thay thế dòng này:
{section === 'exercises' && <BaiTapManager />}

// Bằng dòng này:
{section === 'exercises' && <EnhancedExerciseManager />}`}
                                </pre>
                            </div>
                        </div>

                        <div className="step">
                            <div className="step-number">2</div>
                            <div className="step-content">
                                <h3>Thêm ThemeProvider</h3>
                                <p>Wrap ứng dụng với ThemeProvider để hỗ trợ dark/light mode</p>
                                <pre className="code-block">
{`import { ThemeProvider } from './contexts/ThemeContext';

// Trong main.tsx:
<ThemeProvider>
    <NotificationProvider>
        <App />
    </NotificationProvider>
</ThemeProvider>`}
                                </pre>
                            </div>
                        </div>

                        <div className="step">
                            <div className="step-number">3</div>
                            <div className="step-content">
                                <h3>Sử Dụng Riêng Biệt</h3>
                                <p>Có thể sử dụng ExerciseList component độc lập cho trang chủ</p>
                                <pre className="code-block">
{`import ExerciseList from './components/ExerciseList';

// Chỉ hiển thị danh sách (không có quản lý):
<ExerciseList showManagement={false} />

// Có chức năng quản lý:
<ExerciseList showManagement={true} onEdit={handleEdit} onDelete={handleDelete} />`}
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ThemeProvider>
    );
};

export default ExerciseShowcase;
