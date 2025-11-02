import React, { useState } from 'react';
import BaiTapManager from '../components/BaiTapManager';
import BaiTapForm from '../components/BaiTapForm';
import ExerciseShowcase from './ExerciseShowcase';
import './BaiTapDemo.css';

const BaiTapDemo: React.FC = () => {
    const [currentView, setCurrentView] = useState<'manager' | 'form' | 'instructions' | 'showcase'>('instructions');
    const [isLoading, setIsLoading] = useState(false);

    const handleFormSubmit = async (formData: any) => {
        setIsLoading(true);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('Form submitted with data:', formData);
        alert('Bài tập đã được tạo thành công! (Demo mode)');
        
        setIsLoading(false);
        setCurrentView('manager');
    };

    const handleFormCancel = () => {
        setCurrentView('manager');
    };

    const renderInstructions = () => (
        <div className="demo-instructions">
            <div className="instructions-header">
                <h1 className="instructions-title">
                    <span className="title-icon">🏋️‍♂️</span>
                    Form Bài Tập Mới - Hoàn Thiện
                </h1>
                <p className="instructions-subtitle">
                    Form nhập thông tin bài tập đã được thiết kế lại với đầy đủ các trường từ backend model
                </p>
            </div>

            <div className="features-grid">
                <div className="feature-card">
                    <div className="feature-icon">✅</div>
                    <h3>Đầy Đủ Các Trường</h3>
                    <p>Bao gồm tất cả 10 trường từ BaiTap model: tenBaiTap, moTa, hinhAnh, nhomCo, mucDoKho, thietBiSuDung, soHiepvaSoLanLap, mucTieuBaiTap, hinhAnhMinhHoa, videoHuongDan</p>
                </div>

                <div className="feature-card">
                    <div className="feature-icon">🎨</div>
                    <h3>Giao Diện Đẹp Mắt</h3>
                    <p>Thiết kế hiện đại với gradient, animations, và responsive design. Hỗ trợ dark mode và accessibility</p>
                </div>

                <div className="feature-card">
                    <div className="feature-icon">🔧</div>
                    <h3>Tính Năng Nâng Cao</h3>
                    <p>Preview hình ảnh, validation form, loading states, error handling, và nhiều tùy chọn dropdown với emoji</p>
                </div>

                <div className="feature-card">
                    <div className="feature-icon">📱</div>
                    <h3>Responsive Design</h3>
                    <p>Tối ưu cho mọi thiết bị từ desktop đến mobile. Hỗ trợ touch gestures và keyboard navigation</p>
                </div>

                <div className="feature-card">
                    <div className="feature-icon">🚀</div>
                    <h3>Tích Hợp Dễ Dàng</h3>
                    <p>Component độc lập, có thể thay thế form cũ trong DynamicForm hoặc sử dụng riêng biệt</p>
                </div>

                <div className="feature-card">
                    <div className="feature-icon">🔒</div>
                    <h3>Validation Mạnh Mẽ</h3>
                    <p>Kiểm tra dữ liệu đầu vào, validation URL, required fields, và hiển thị lỗi trực quan</p>
                </div>
            </div>

            <div className="integration-guide">
                <h2>Hướng Dẫn Tích Hợp</h2>
                
                <div className="integration-steps">
                    <div className="step">
                        <div className="step-number">1</div>
                        <div className="step-content">
                            <h3>Thay Thế Form Cũ</h3>
                            <p>Trong file <code>admin.tsx</code>, thay thế component cũ bằng:</p>
                            <pre className="code-block">
{`import BaiTapManager from '../components/BaiTapManager';

// Trong phần render exercises section:
{section === 'exercises' && <BaiTapManager />}`}
                            </pre>
                        </div>
                    </div>

                    <div className="step">
                        <div className="step-number">2</div>
                        <div className="step-content">
                            <h3>Hoặc Sử Dụng Form Riêng</h3>
                            <p>Sử dụng BaiTapForm component độc lập:</p>
                            <pre className="code-block">
{`import BaiTapForm from '../components/BaiTapForm';

<BaiTapForm
    initialData={editingData}
    onSubmit={handleSubmit}
    onCancel={handleCancel}
    isLoading={loading}
/>`}
                            </pre>
                        </div>
                    </div>

                    <div className="step">
                        <div className="step-number">3</div>
                        <div className="step-content">
                            <h3>Cập Nhật API Endpoints</h3>
                            <p>Đảm bảo backend hỗ trợ upload file và các trường mới:</p>
                            <pre className="code-block">
{`// Backend cần hỗ trợ:
POST /api/baitap (multipart/form-data)
PUT /api/baitap/:id (multipart/form-data)
GET /api/baitap
DELETE /api/baitap/:id`}
                            </pre>
                        </div>
                    </div>
                </div>
            </div>

            <div className="demo-actions">
                <button 
                    className="demo-btn primary"
                    onClick={() => setCurrentView('form')}
                >
                    <span className="btn-icon">📝</span>
                    Xem Demo Form
                </button>
                <button 
                    className="demo-btn secondary"
                    onClick={() => setCurrentView('manager')}
                >
                    <span className="btn-icon">📋</span>
                    Xem Demo Manager
                </button>
                <button 
                    className="demo-btn primary"
                    onClick={() => setCurrentView('showcase')}
                >
                    <span className="btn-icon">✨</span>
                    Giao Diện Mới
                </button>
            </div>
        </div>
    );

    return (
        <div className="baitap-demo">
            {currentView === 'instructions' && renderInstructions()}
            
            {currentView === 'form' && (
                <div className="demo-container">
                    <div className="demo-header">
                        <button 
                            className="back-btn"
                            onClick={() => setCurrentView('instructions')}
                        >
                            ← Quay lại hướng dẫn
                        </button>
                        <h2>Demo: Form Tạo Bài Tập Mới</h2>
                    </div>
                    <BaiTapForm
                        onSubmit={handleFormSubmit}
                        onCancel={handleFormCancel}
                        isLoading={isLoading}
                    />
                </div>
            )}
            
            {currentView === 'manager' && (
                <div className="demo-container">
                    <div className="demo-header">
                        <button 
                            className="back-btn"
                            onClick={() => setCurrentView('instructions')}
                        >
                            ← Quay lại hướng dẫn
                        </button>
                        <h2>Demo: Quản Lý Bài Tập</h2>
                    </div>
                    <BaiTapManager />
                </div>
            )}
            
            {currentView === 'showcase' && <ExerciseShowcase />}
        </div>
    );
};

export default BaiTapDemo;
