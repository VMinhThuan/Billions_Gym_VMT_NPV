import React, { useEffect, useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import PricingPlans from '../PricingPlans';
import CompareModal from '../CompareModal';
import content1 from "../../assets/images/content/ex1.jpg";
import content2 from "../../assets/images/content/ex2.jpg";
import content3 from "../../assets/images/content/ex3.jpg";
import content4 from "../../assets/images/content/ex4.jpg";
import content5 from "../../assets/images/content/ex5.jpeg";
import gymlux from "../../assets/images/content/gymluxury.jpg";
import Button from '../ui/Button';
import Card from '../ui/Card';
import "../../pages/Home.css"
import { authUtils } from '../../utils/auth';

const Layout = ({ children, onNavigateToLogin, onNavigateToRegister }) => {
    const [showCompareModal, setShowCompareModal] = useState(false);
    const [selectedPackageForCompare, setSelectedPackageForCompare] = useState(null);
    const [allPackages, setAllPackages] = useState([]);

    const handleComparePackage = (packageData) => {
        setSelectedPackageForCompare(packageData);
        setShowCompareModal(true);
    };

    const handleCloseCompareModal = () => {
        setShowCompareModal(false);
        setSelectedPackageForCompare(null);
    };

    const handlePackagesLoaded = (packages) => {
        setAllPackages(packages);
    };

    useEffect(() => {
        const selector = '[data-reveal="slow-up"]';
        const nodes = document.querySelectorAll(selector);

        nodes.forEach((el) => el.classList.add('reveal-initial'));

        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.remove('reveal-initial');
                    entry.target.classList.add('animate-fadeInUp-slow');
                    io.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.15,
        });

        nodes.forEach((el) => io.observe(el));

        return () => io.disconnect();
    }, []);

    const isAuthenticated = authUtils.isAuthenticated();

    return (
        <>
            <div className="min-h-screen flex flex-col">
                <Header onNavigateToLogin={onNavigateToLogin} onNavigateToRegister={onNavigateToRegister} />
                <main className="flex-1 pt-20 main-content-bg relative overflow-hidden">
                    <div className="absolute inset-0 bg-black/40"></div>
                    <div className="relative z-10">
                        {children}
                    </div>
                </main>

                {/* Chỉ hiển thị các section này khi chưa đăng nhập */}
                {!isAuthenticated && (
                    <>
                        {/* Statistics Section */}
                        <section className="statistics-section">
                            <div className="container">
                                <div className="statistics-grid">
                                    {/* Stat 1 - Client Satisfaction */}
                                    <div className="stat-item">
                                        <div className="stat-number">96%</div>
                                        <div className="stat-title">Client Satisfaction</div>
                                        <div className="stat-description">Our Members Love Their Results And Experience</div>
                                    </div>

                                    {/* Stat 2 - Years of Experience */}
                                    <div className="stat-item">
                                        <div className="stat-number">+5</div>
                                        <div className="stat-title">Years Of Experience</div>
                                        <div className="stat-description">Trust In Our Proven Track Record Of Transforming</div>
                                    </div>

                                    {/* Stat 3 - Active Members */}
                                    <div className="stat-item">
                                        <div className="stat-number">+800</div>
                                        <div className="stat-title">Active Members</div>
                                        <div className="stat-description">Join Our Thriving Fitness Community</div>
                                    </div>

                                    {/* Stat 4 - Support Available */}
                                    <div className="stat-item">
                                        <div className="stat-number">24/7</div>
                                        <div className="stat-title">Support Available</div>
                                        <div className="stat-description">Expert Assistance Whenever You Need It</div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="top-section">
                            <div className="container">
                                <div className="content-layout max-w-[1200px] mx-auto px-5">
                                    {/* Left Side - Main Introduction */}
                                    <div className="py-[60px] relative">
                                        <div className="mb-10">
                                            <h1 data-reveal="slow-up" className="text-[4rem] font-[900] leading-[1.05] m-0 font-[Roboto,sans-serif] uppercase tracking-[-0.02em] bg-gradient-to-br from-[#ffffff] to-[#f0f0f0] bg-clip-text text-transparent [text-shadow:0_4px_8px_rgba(0,0,0,0.3)]">
                                                CHÚNG TÔI LÀ BILLIONS
                                            </h1>
                                        </div>
                                        <div className="mb-[50px]">
                                            <p data-reveal="slow-up" className="text-[1.25rem] leading-[1.8] m-0 opacity-95 text-[#e0e0e0] max-w-[90%]">
                                                Billions Fitness & Gym là thương hiệu sức khỏe lớn nhất Việt Nam,
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
                                                    <h3 className="text-[1.1rem] leading-[1.3] text-white font-bold mb-2">Chương Trình Nhảy Độc Đáo</h3>
                                                    <p className="text-[0.9rem] leading-[1.4] mb-3 opacity-90 text-white">
                                                        Các lớp nhảy năng động như Pop dance, Sexy Dance, Pole dance
                                                        hoặc Zumba được dẫn dắt bởi các huấn luyện viên Billions quốc tế.
                                                    </p>
                                                    <a href="#" data-reveal="slow-up" className="content-link">Tìm hiểu thêm →</a>
                                                </div>
                                            </div>
                                            <div className="content-image-item">
                                                <img src={content2} alt="Health Trainer" className="content-image" />
                                                <div className="content-overlay">
                                                    <h3 className="text-[1.1rem] leading-[1.3] text-white font-bold mb-2">Huấn Luyện Viên Sức Khỏe Luôn Đồng Hành Cùng Bạn</h3>
                                                    <p className="text-[0.9rem] leading-[1.4] mb-3 opacity-90 text-white">
                                                        Các huấn luyện viên được chứng nhận NASM giúp tạo ra kế hoạch
                                                        tập luyện và dinh dưỡng cá nhân hóa, hướng dẫn thành viên đạt được mục tiêu.
                                                    </p>
                                                    <a href="#" data-reveal="slow-up" className="content-link">Tìm hiểu thêm →</a>
                                                </div>
                                            </div>
                                            <div className="content-image-item">
                                                <img src={content3} alt="Community" className="content-image" />
                                                <div className="content-overlay">
                                                    <h3 className="text-[1.1rem] leading-[1.3] text-white font-bold mb-2">Cộng Đồng Truyền Cảm Hứng Cho Bạn Trở Nên Tốt Hơn Nữa</h3>
                                                    <p className="text-[0.9rem] leading-[1.4] mb-3 opacity-90 text-white">
                                                        Khuyến khích thành viên áp dụng lối sống lành mạnh, thử những điều mới
                                                        và sống cuộc sống nhiệt huyết, tự tin.
                                                    </p>
                                                    <a href="#" data-reveal="slow-up" className="content-link">Tìm hiểu thêm →</a>
                                                </div>
                                            </div>
                                            <div className="content-image-item">
                                                <img src={content4} alt="Group Classes" className="content-image" />
                                                <div className="content-overlay">
                                                    <h3 className="text-[1.1rem] leading-[1.3] text-white font-bold mb-2">Không Giới Hạn Lớp Tập Nhóm</h3>
                                                    <p className="text-[0.9rem] leading-[1.4] mb-3 opacity-90 text-white">
                                                        Hơn 50 lớp tập nhóm có bản quyền Lesmills (Body Combat, Body Jam, RPM, SH'Bam)
                                                        và các chương trình độc quyền Billions như BillionsDrumfit, BillionsStep, cập nhật hàng tháng.
                                                    </p>
                                                    <a href="#" data-reveal="slow-up" className="content-link">Tìm hiểu thêm →</a>
                                                </div>
                                            </div>
                                            <div className="content-image-item">
                                                <img src={content5} alt="Yoga" className="content-image" />
                                                <div className="content-overlay">
                                                    <h3 className="text-[1.1rem] leading-[1.3] text-white font-bold mb-2">Tinh Hoa Yoga Ấn Độ Nguyên Bản</h3>
                                                    <p className="text-[0.9rem] leading-[1.4] mb-3 opacity-90 text-white">
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
                                <div className="content-layout max-w-[1200px] mx-auto px-5">
                                    {/* Left Side - Luxury Standards Introduction */}
                                    <div className="left-content">
                                        <div className="mb-10">
                                            <h2 data-reveal="slow-up" className="text-[4rem] font-black leading-[1.05] m-0 font-[Roboto,sans-serif] uppercase tracking-[-0.02em] bg-gradient-to-br from-[#ffffff] to-[#f0f0f0] bg-clip-text text-transparent [text-shadow:0_4px_8px_rgba(0,0,0,0.3)]">TIÊU CHUẨN CỦA SỰ SANG TRỌNG</h2>
                                        </div>
                                        <div className="mb-[50px]">
                                            <p data-reveal="slow-up" className="text-[1.25rem] leading-[1.8] m-0 opacity-95 text-[#e0e0e0] max-w-[90%]">
                                                Hơn 37 câu lạc bộ trên toàn quốc, mang đến môi trường tập luyện cao cấp
                                                với trang thiết bị hàng đầu, khu vực VIP và các tiện ích đặc biệt như
                                                phòng xông hơi, bể bơi và Jacuzzi.
                                            </p>
                                        </div>
                                        <div className="mt-10">
                                            <a href="#" data-reveal="slow-up" className="cta-link">
                                                <span>Tìm Câu Lạc Bộ Gần Bạn</span>
                                                <span className="arrow">→</span>
                                            </a>
                                        </div>
                                    </div>

                                    {/* Right Side - Gym Interior Image */}
                                    <div className="right-content">
                                        <div className="gym-interior-image">
                                            <img src={content2} alt="Gym Interior" className="content-image" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Pricing Plans Section */}
                        <PricingPlans
                            onComparePackage={handleComparePackage}
                            onPackagesLoaded={handlePackagesLoaded}
                        />

                        {/* Inspiration Section - Dream to Reality */}
                        <section className="bottom-section">
                            <div className="container">
                                <div className="content-layout max-w-[1200px] mx-auto px-5">
                                    {/* Left Side - Dream to Reality Introduction */}
                                    <div className="left-content">
                                        <div className="mb-10">
                                            <h2 data-reveal="slow-up" className="text-[4rem] font-black leading-[1.05] m-0 font-[Roboto,sans-serif] uppercase tracking-[-0.02em] bg-gradient-to-br from-[#ffffff] to-[#f0f0f0] bg-clip-text text-transparent [text-shadow:0_4px_8px_rgba(0,0,0,0.3)]">BIẾN GIẤC MƠ TRỞ THÀNH HIỆN THỰC</h2>
                                        </div>
                                        <div className="mb-[50px]">
                                            <p data-reveal="slow-up" className="text-[1.25rem] leading-[1.8] m-0 opacity-95 text-[#e0e0e0] max-w-[90%]">
                                                Trong thập kỷ qua, hơn 500.000 người đã chọn chúng tôi để bắt đầu hành
                                                trình tập luyện. Hãy cùng khám phá vì sao Billions được nhiều hội viên
                                                tin tưởng lựa chọn nhé!
                                            </p>
                                        </div>
                                        <div className="mt-10">
                                            <a href="#" data-reveal="slow-up" className="cta-link">
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
                            <div className="max-w-[1200px] mx-auto px-[20px]">
                                <div className="grid grid-cols-2 items-center gap-[80px] relative z-[2]">
                                    <div className="py-5">
                                        <h2 data-reveal="slow-up" className="text-[3.5rem] font-black leading-[1.1] mb-[30px] uppercase tracking-[-0.02em] text-white">TRẢI NGHIỆM MIỄN PHÍ NGAY!</h2>
                                        <p data-reveal="slow-up" className="text-[1.2rem] leading-[1.8] text-gray-400 opacity-90 max-w-[85%]">
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
                        <section className="bg-[#f8f9fa] py-[100px] text-black">
                            <div className="max-w-[1200px] mx-auto px-[20px]">
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
                        <Footer />
                    </>
                )}
            </div>

            {/* Compare Modal */}
            <CompareModal
                isOpen={showCompareModal}
                onClose={handleCloseCompareModal}
                selectedPackage={selectedPackageForCompare}
                allPackages={allPackages}
                onNavigateToPackage={() => { }}
            />
        </>
    );
};

export default Layout;