import Header from "../components/header";
import Button from "../components/Button";
import Card from "../components/Card";
import Loading from "../components/Loading";
import ChatBot from "../components/ChatBot";
import "./home.css";
import { useState, useEffect } from "react";
import banner1 from "../assets/images/banner/banner-1.webp";
import banner2 from "../assets/images/banner/banner-2.webp";
import content1 from "../assets/images/content/ex1.jpg";
import content2 from "../assets/images/content/ex2.jpg";
import content3 from "../assets/images/content/ex3.jpg";
import content4 from "../assets/images/content/ex4.jpg";
import content5 from "../assets/images/content/ex5.jpeg";
import gymlux from "../assets/images/content/gymluxury.jpg";
import React from "react";

const HomePage = () => {
    const [currentBanner, setCurrentBanner] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isChatBotOpen, setIsChatBotOpen] = useState(false);

    // Banner data với real images
    const banners = [
        {
            id: 1,
            title: "KHỎE ĐỂ TỰ DO",
            subtitle: "KHỎE ĐỂ YÊU NƯỚC",
            subtitle2: "KHỎE ĐỂ ĐU CONCERT QUỐC GIA",
            date: "Từ 15.08 - 31.08.2025",
            description: "Khám phá bản thể Diễu Binh của bạn & chớp cơ hội đến Concert Quốc Gia",
            cta: "TẠO AVATAR NGAY!",
            background: "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)",
            image: banner1,
            useImage: true
        },
        {
            id: 2,
            title: "TẬP LUYỆN HIỆU CHỈNH",
            subtitle: "CORRECTIVE EXERCISE PROGRAM",
            subtitle2: "",
            date: "",
            description: "Tập luyện khoa học - Giải quyết cơn đau từ gốc",
            cta: "Trải Nghiệm Ngay!",
            background: "linear-gradient(135deg, #000000 0%, #1a1a1a 100%)",
            image: banner2,
            useImage: true
        }
    ];

    // Auto change banner every 5 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentBanner((prev) => (prev + 1) % banners.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [banners.length]);

    const currentBannerData = banners[currentBanner];

    return (
        <>
            <Header />
            {/* Admin Login Button */}
            <Button
                className="admin-login-btn"
                variant="secondary"
                size="small"
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
            </Button>
            <main className="main-content">
                {/* Banner Carousel */}
                <section className="banner-carousel">
                    <div className="banner-slide active" style={{ background: currentBannerData.background }}>
                        <div className="banner-container">
                            <img
                                src={currentBannerData.image}
                                alt={`Banner ${currentBannerData.id}`}
                                className="banner-image"
                            />
                        </div>
                    </div>

                    {/* Banner Indicators */}
                    <div className="banner-indicators">
                        {banners.map((_, index) => (
                            <button
                                key={index}
                                className={`indicator ${index === currentBanner ? 'active' : ''}`}
                                onClick={() => setCurrentBanner(index)}
                            />
                        ))}
                    </div>
                </section>


                {/* Top Section - We Are Billions */}
                <section className="top-section">
                    <div className="container">
                        <div className="content-layout">
                            {/* Left Side - Main Introduction */}
                            <div className="left-content">
                                <div className="title-wrapper">
                                    <h1 className="main-title">CHÚNG TÔI LÀ BILLIONS</h1>
                                </div>
                                <div className="description-wrapper">
                                    <p className="main-description">
                                        Billions Fitness & Yoga là thương hiệu sức khỏe lớn nhất Việt Nam,
                                        mang đến hạnh phúc và những khoảnh khắc đáng nhớ thông qua các dịch vụ
                                        toàn diện về sức khỏe thể chất, dinh dưỡng và tinh thần.
                                    </p>
                                </div>
                            </div>

                            {/* Right Side - Content Images */}
                            <div className="right-content">
                                <div className="content-images-grid">
                                    <div className="content-image-item">
                                        <img src={content1} alt="Dance Program" className="content-image" />
                                        <div className="content-overlay">
                                            <h3 className="content-title">Chương Trình Nhảy Độc Đáo</h3>
                                            <p className="content-description">
                                                Các lớp nhảy năng động như Pop dance, Sexy Dance, Pole dance
                                                hoặc Zumba được dẫn dắt bởi các huấn luyện viên Billions quốc tế.
                                            </p>
                                            <a href="#" className="content-link">Tìm hiểu thêm →</a>
                                        </div>
                                    </div>
                                    <div className="content-image-item">
                                        <img src={content2} alt="Health Trainer" className="content-image" />
                                        <div className="content-overlay">
                                            <h3 className="content-title">Huấn Luyện Viên Sức Khỏe Luôn Đồng Hành Cùng Bạn</h3>
                                            <p className="content-description">
                                                Các huấn luyện viên được chứng nhận NASM giúp tạo ra kế hoạch
                                                tập luyện và dinh dưỡng cá nhân hóa, hướng dẫn thành viên đạt được mục tiêu.
                                            </p>
                                            <a href="#" className="content-link">Tìm hiểu thêm →</a>
                                        </div>
                                    </div>
                                    <div className="content-image-item">
                                        <img src={content3} alt="Community" className="content-image" />
                                        <div className="content-overlay">
                                            <h3 className="content-title">Cộng Đồng Truyền Cảm Hứng Cho Bạn Trở Nên Tốt Hơn Nữa</h3>
                                            <p className="content-description">
                                                Khuyến khích thành viên áp dụng lối sống lành mạnh, thử những điều mới
                                                và sống cuộc sống nhiệt huyết, tự tin.
                                            </p>
                                            <a href="#" className="content-link">Tìm hiểu thêm →</a>
                                        </div>
                                    </div>
                                    <div className="content-image-item">
                                        <img src={content4} alt="Group Classes" className="content-image" />
                                        <div className="content-overlay">
                                            <h3 className="content-title">Không Giới Hạn Lớp Tập Nhóm</h3>
                                            <p className="content-description">
                                                Hơn 50 lớp tập nhóm có bản quyền Lesmills (Body Combat, Body Jam, RPM, SH'Bam)
                                                và các chương trình độc quyền Billions như BillionsDrumfit, BillionsStep, cập nhật hàng tháng.
                                            </p>
                                            <a href="#" className="content-link">Tìm hiểu thêm →</a>
                                        </div>
                                    </div>
                                    <div className="content-image-item">
                                        <img src={content5} alt="Yoga" className="content-image" />
                                        <div className="content-overlay">
                                            <h3 className="content-title">Tinh Hoa Yoga Ấn Độ Nguyên Bản</h3>
                                            <p className="content-description">
                                                Thực hành Yoga chân chính dưới sự hướng dẫn của các bậc thầy Yoga Ấn Độ
                                                để đạt được sự cân bằng, sức mạnh, linh hoạt và thư giãn tinh thần.
                                            </p>
                                            <a href="#" className="content-link">Tìm hiểu thêm →</a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Bottom Section - Standards of Luxury */}
                <section className="bottom-section">
                    <div className="container">
                        <div className="content-layout">
                            {/* Left Side - Luxury Standards Introduction */}
                            <div className="left-content">
                                <div className="title-wrapper">
                                    <h2 className="main-title">TIÊU CHUẨN CỦA SỰ SANG TRỌNG</h2>
                                </div>
                                <div className="description-wrapper">
                                    <p className="main-description">
                                        Hơn 37 câu lạc bộ trên toàn quốc, mang đến môi trường tập luyện cao cấp
                                        với trang thiết bị hàng đầu, khu vực VIP và các tiện ích đặc biệt như
                                        phòng xông hơi, bể bơi và Jacuzzi.
                                    </p>
                                </div>
                                <div className="cta-wrapper">
                                    <a href="#" className="cta-link">
                                        <span>Tìm Câu Lạc Bộ Gần Bạn</span>
                                        <span className="arrow">→</span>
                                    </a>
                                </div>
                            </div>

                            {/* Right Side - Gym Interior Image */}
                            <div className="right-content">
                                <div className="gym-interior-image">
                                    <img src={banner2} alt="Gym Interior" className="content-image" />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Inspiration Section - Dream to Reality */}
                <section className="bottom-section">
                    <div className="container">
                        <div className="content-layout">
                            {/* Left Side - Dream to Reality Introduction */}
                            <div className="left-content">
                                <div className="title-wrapper">
                                    <h2 className="main-title">BIẾN GIẤC MƠ TRỞ THÀNH HIỆN THỰC</h2>
                                </div>
                                <div className="description-wrapper">
                                    <p className="main-description">
                                        Trong thập kỷ qua, hơn 500.000 người đã chọn chúng tôi để bắt đầu hành
                                        trình tập luyện. Hãy cùng khám phá vì sao Billions được nhiều hội viên
                                        tin tưởng lựa chọn nhé!
                                    </p>
                                </div>
                                <div className="cta-wrapper">
                                    <a href="#" className="cta-link">
                                        <span>Tìm Hiểu Về Dịch Vụ Huấn Luyện Viên Cá Nhân</span>
                                        <span className="arrow">→</span>
                                    </a>
                                </div>
                            </div>

                            {/* Right Side - Boxing/Image */}
                            <div className="right-content">
                                <div className="gym-interior-image">
                                    <img src={gymlux} alt="Kickfit & Boxing" className="content-image" />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Free Trial Section */}
                <section className="free-trial-section">
                    <div className="container">
                        <div className="trial-layout">
                            {/* Left Side - Title and Description */}
                            <div className="trial-content">
                                <h2 className="trial-title">TRẢI NGHIỆM MIỄN PHÍ NGAY!</h2>
                                <p className="trial-description">
                                    Chào mừng bạn đến với Billions Fitness & Yoga! Chúng tôi dành tặng bạn
                                    7 ngày trải nghiệm miễn phí để khám phá tất cả các dịch vụ và tiện ích
                                    tại câu lạc bộ. Hãy để lại thông tin để chúng tôi liên hệ tư vấn chi tiết.
                                </p>
                            </div>

                            {/* Right Side - Registration Form */}
                            <div className="trial-form">
                                <form className="registration-form">
                                    <div className="form-group">
                                        <input
                                            type="text"
                                            id="fullName"
                                            name="fullName"
                                            placeholder="Họ và Tên *"
                                            required
                                            className="form-input"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <input
                                            type="tel"
                                            id="phone"
                                            name="phone"
                                            placeholder="Số điện thoại *"
                                            required
                                            className="form-input"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            placeholder="Email"
                                            className="form-input"
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        size="large"
                                        fullWidth
                                        className="register-btn"
                                    >
                                        ĐĂNG KÝ
                                    </Button>
                                </form>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Useful Articles Section */}
                <section className="articles-section">
                    <div className="container">
                        <div className="articles-header">
                            <h2 className="articles-title">ĐỪNG BỎ LỠ BÀI VIẾT HỮU ÍCH</h2>
                            <a href="#" className="view-all-link">Xem tất cả →</a>
                        </div>

                        <div className="articles-grid">
                            {/* Article 1 */}
                            <Card
                                image="/api/placeholder/300/200"
                                title="Công nghệ ExBody - Nền Tảng Cho Tập Luyện Hiệu Chỉnh Giúp Giảm Đau Và Cải Thiện Vận Động"
                                hover
                                className="article-card"
                                footer={
                                    <a href="#" className="article-link">Tìm hiểu thêm →</a>
                                }
                            >
                                <p>Khám phá công nghệ ExBody giúp giảm đau và cải thiện vận động thông qua tập luyện hiệu chỉnh khoa học.</p>
                            </Card>

                            {/* Article 2 */}
                            <article className="article-card">
                                <div className="article-image">
                                    <div className="image-placeholder article-2"></div>
                                </div>
                                <div className="article-content">
                                    <h3 className="article-title">
                                        Hoa Hậu Hương Giang & Saabirose Xuất Hiện Bùng Nổ Tại THE HNOISE 2025!
                                    </h3>
                                    <a href="#" className="article-link">Tìm hiểu thêm →</a>
                                </div>
                            </article>

                            {/* Article 3 */}
                            <article className="article-card">
                                <div className="article-image">
                                    <div className="image-placeholder article-3"></div>
                                </div>
                                <div className="article-content">
                                    <h3 className="article-title">
                                        Ngồi Nhiều Cũng Nguy Hiểm Như Hút Thuốc - Cảnh Báo Cho Dân Văn Phòng
                                    </h3>
                                    <a href="#" className="article-link">Tìm hiểu thêm →</a>
                                </div>
                            </article>

                            {/* Article 4 */}
                            <article className="article-card">
                                <div className="article-image">
                                    <div className="image-placeholder article-4"></div>
                                </div>
                                <div className="article-content">
                                    <h3 className="article-title">
                                        So Tài Thể Lực Tại THE HNOISE 2025 Cùng Billions
                                    </h3>
                                    <a href="#" className="article-link">Tìm hiểu thêm →</a>
                                </div>
                            </article>

                            {/* Article 5 */}
                            <article className="article-card">
                                <div className="article-image">
                                    <div className="image-placeholder article-5"></div>
                                </div>
                                <div className="article-content">
                                    <h3 className="article-title">
                                        Phòng Tránh Té Ngã Nhờ Tập Luyện Hiệu Chỉnh Corrective Exercise
                                    </h3>
                                    <a href="#" className="article-link">Tìm hiểu thêm →</a>
                                </div>
                            </article>

                            {/* Article 6 */}
                            <article className="article-card">
                                <div className="article-image">
                                    <div className="image-placeholder article-6"></div>
                                </div>
                                <div className="article-content">
                                    <h3 className="article-title">
                                        Tập Luyện Pilates Tại 5 Clb Billions
                                    </h3>
                                    <a href="#" className="article-link">Tìm hiểu thêm →</a>
                                </div>
                            </article>

                            {/* Article 7 */}
                            <article className="article-card">
                                <div className="article-image">
                                    <div className="image-placeholder article-7"></div>
                                </div>
                                <div className="article-content">
                                    <h3 className="article-title">
                                        Giới Thiệu Bạn Hay, Trao Tay 10 Triệu!
                                    </h3>
                                    <a href="#" className="article-link">Tìm hiểu thêm →</a>
                                </div>
                            </article>

                            {/* Article 8 */}
                            <article className="article-card">
                                <div className="article-image">
                                    <div className="image-placeholder article-8"></div>
                                </div>
                                <div className="article-content">
                                    <h3 className="article-title">
                                        Tập Luyện Hiệu Chỉnh - Corrective Exercise Là Gì?
                                    </h3>
                                    <a href="#" className="article-link">Tìm hiểu thêm →</a>
                                </div>
                            </article>
                        </div>
                    </div>
                </section>
            </main>

            {/* ChatBot Button */}
            <button
                className="chatbot-toggle-btn"
                onClick={() => setIsChatBotOpen(true)}
                title="Chat với AI Assistant"
            >
                💬
            </button>

            {/* ChatBot */}
            <ChatBot
                isOpen={isChatBotOpen}
                onClose={() => setIsChatBotOpen(false)}
            />

            {/* Loading Overlay */}
            {isLoading && <Loading overlay text="Đang chuyển hướng..." />}

            {/* Footer */}
            <footer className="footer">
                <div className="container">
                    <div className="footer-content">
                        {/* Services Column */}
                        <div className="footer-column">
                            <h3 className="footer-title">DỊCH VỤ</h3>
                            <ul className="footer-links">
                                <li><a href="#">Dance</a></li>
                                <li><a href="#">Group X</a></li>
                                <li><a href="#">Yoga</a></li>
                                <li><a href="#">Hypoxi</a></li>
                                <li><a href="#">Personal Trainers</a></li>
                                <li><a href="#">Kickfit & MMA</a></li>
                            </ul>
                        </div>

                        {/* Company Column */}
                        <div className="footer-column">
                            <h3 className="footer-title">CÔNG TY</h3>
                            <ul className="footer-links">
                                <li><a href="#">Về chúng tôi</a></li>
                                <li><a href="#">Điều khoản sử dụng</a></li>
                                <li><a href="#">Chính sách bảo mật</a></li>
                                <li><a href="#">Chính sách thanh toán</a></li>
                                <li><a href="#">Chính sách giải quyết khiếu nại</a></li>
                                <li><a href="#">Chính sách bảo vệ dữ liệu</a></li>
                                <li><a href="#">Tuyển dụng</a></li>
                                <li><a href="#">Liên hệ</a></li>
                            </ul>
                        </div>

                        {/* Support Column */}
                        <div className="footer-column">
                            <h3 className="footer-title">SUPPORT</h3>
                            <div className="support-content">
                                <div className="phone-number">1800 6995</div>
                                <div className="social-media">
                                    <a href="#" className="social-icon">📘</a>
                                    <a href="#" className="social-icon">📺</a>
                                    <a href="#" className="social-icon">📷</a>
                                    <a href="#" className="social-icon">🎵</a>
                                </div>
                                <div className="badges">
                                    <div className="badge">RECORD HOLDER</div>
                                    <div className="badge">ĐÃ THÔNG BÁO BỘ CÔNG THƯƠNG</div>
                                </div>
                            </div>
                        </div>

                        {/* Information Column */}
                        <div className="footer-column">
                            <h3 className="footer-title">THÔNG TIN</h3>
                            <div className="company-info">
                                <p className="company-name">
                                    Công ty TNHH Trung Tâm Thể Dục Thể Hình & Yoga Billions
                                </p>
                                <p className="company-address">
                                    Số 126 Hùng Vương, P.12, Q.5, Tp. Hồ Chí Minh, Việt Nam
                                </p>
                                <p className="tax-code">
                                    Mã số thuế: 0305060028
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Copyright */}
                    <div className="footer-bottom">
                        <p className="copyright">© Billions Fitness & Yoga Center 2021</p>
                    </div>
                </div>
            </footer>
        </>
    );
};

export default HomePage;