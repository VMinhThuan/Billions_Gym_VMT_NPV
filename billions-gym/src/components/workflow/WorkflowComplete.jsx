import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './WorkflowComponents.css';

const WorkflowComplete = ({ registration, onComplete }) => {
    const navigate = useNavigate();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);
    const totalSlides = 3;

    // Auto-slide functionality
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % totalSlides);
        }, 4000); // Change slide every 4 seconds

        return () => clearInterval(interval);
    }, [totalSlides]);

    const handleDotClick = (index) => {
        setCurrentSlide(index);
    };

    // Touch handlers for swipe
    const handleTouchStart = (e) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (!touchStart || !touchEnd) return;

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > 50;
        const isRightSwipe = distance < -50;

        if (isLeftSwipe && currentSlide < totalSlides - 1) {
            setCurrentSlide(currentSlide + 1);
        }
        if (isRightSwipe && currentSlide > 0) {
            setCurrentSlide(currentSlide - 1);
        }
    };

    const handleComplete = async () => {
        try {
            await onComplete();
        } catch (error) {
            console.error('Error completing workflow:', error);
        }
    };

    const handleGoHome = () => {
        navigate('/');
    };

    return (
        <div className="workflow-complete">
            <div className="complete-header">
                <div className="success-icon">🎉</div>
                <h3>Chúc mừng! Bạn đã hoàn tất đăng ký gói tập</h3>
                <p>Gói tập của bạn đã được kích hoạt thành công. Bạn có thể bắt đầu hành trình fitness ngay bây giờ!</p>
            </div>

            <div className="package-summary">
                <h4>Thông tin gói tập</h4>
                <div className="summary-card">
                    <div className="summary-item">
                        <span className="label">Tên gói:</span>
                        <span className="value">{registration?.goiTapId?.tenGoiTap}</span>
                    </div>
                    <div className="summary-item">
                        <span className="label">Thời hạn:</span>
                        <span className="value">
                            {registration?.goiTapId?.thoiHan} {registration?.goiTapId?.donViThoiHan}
                        </span>
                    </div>
                    <div className="summary-item">
                        <span className="label">Chi nhánh:</span>
                        <span className="value">{registration?.branchId?.tenChiNhanh || 'Chưa chọn'}</span>
                    </div>
                    <div className="summary-item">
                        <span className="label">PT:</span>
                        <span className="value">{registration?.ptDuocChon?.hoTen || 'Chưa chọn'}</span>
                    </div>
                    <div className="summary-item">
                        <span className="label">Trạng thái:</span>
                        <span className="value status-active">Đã kích hoạt</span>
                    </div>
                </div>
            </div>

            <div className="next-steps">
                <h4>Bước tiếp theo</h4>
                <div className="steps-carousel">
                    <div
                        className="carousel-container"
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    >
                        <div
                            className="carousel-track"
                            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                        >
                            <div className="step-card">
                                <div className="step-icon">📅</div>
                                <div className="step-content">
                                    <h5>Xem lịch tập</h5>
                                    <p>Truy cập lịch tập của bạn để xem các buổi tập đã được sắp xếp</p>
                                </div>
                            </div>
                            <div className="step-card">
                                <div className="step-icon">💪</div>
                                <div className="step-content">
                                    <h5>Bắt đầu tập luyện</h5>
                                    <p>Đến chi nhánh đã chọn và bắt đầu hành trình fitness của bạn</p>
                                </div>
                            </div>
                            <div className="step-card">
                                <div className="step-icon">📱</div>
                                <div className="step-content">
                                    <h5>Theo dõi tiến độ</h5>
                                    <p>Sử dụng app để theo dõi tiến độ và đặt lịch tập bổ sung</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="carousel-dots">
                        {[...Array(totalSlides)].map((_, index) => (
                            <span
                                key={index}
                                className={`dot ${currentSlide === index ? 'active' : ''}`}
                                onClick={() => handleDotClick(index)}
                            ></span>
                        ))}
                    </div>
                </div>
            </div>

            <div className="complete-actions">
                <button
                    onClick={handleComplete}
                    className="btn-primary"
                >
                    Hoàn tất đăng ký
                </button>
                <button
                    onClick={handleGoHome}
                    className="btn-secondary"
                >
                    Về trang chủ
                </button>
            </div>
        </div>
    );
};

export default WorkflowComplete;
