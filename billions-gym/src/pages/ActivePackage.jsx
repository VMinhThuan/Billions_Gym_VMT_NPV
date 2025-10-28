import React, { useState, useEffect } from 'react';
import { getApiUrl, getAuthHeaders } from '../services/api';
import { authUtils } from '../utils/auth';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import checkIcon from '../assets/check.svg';
import topRightIcon from '../assets/top-right.svg';

const ActivePackage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [currentPackage, setCurrentPackage] = useState(null);
    const [availablePackages, setAvailablePackages] = useState([]);
    const [error, setError] = useState(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [filterType, setFilterType] = useState('all');
    const [selectedPackageId, setSelectedPackageId] = useState(null);
    const user = authUtils.getUser();

    useEffect(() => {
        const handler = (e) => {
            const collapsed = e?.detail?.collapsed || false;
            setSidebarCollapsed(collapsed);
        };
        window.addEventListener('sidebar:toggle', handler);

        if (!user || !user._id) {
            console.error('User not logged in, redirecting to login...');
            setLoading(false);
            navigate('/login');
            return;
        }

        fetchData();

        return () => window.removeEventListener('sidebar:toggle', handler);
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [activePackageResponse, allPackagesResponse] = await Promise.all([
                fetch(getApiUrl(`/chitietgoitap/hoi-vien/${user._id}/active`), {
                    method: 'GET',
                    headers: getAuthHeaders(true)
                }),
                fetch(getApiUrl('/user/goitap'), {
                    method: 'GET',
                    headers: getAuthHeaders(true)
                })
            ]);

            let activePackage = null;
            if (activePackageResponse.ok) {
                activePackage = await activePackageResponse.json();
                setCurrentPackage(activePackage);
            } else if (activePackageResponse.status === 404) {
                console.log('No active package found');
            } else {
                throw new Error('Không thể tải thông tin gói tập hiện tại');
            }

            if (!allPackagesResponse.ok) throw new Error('Không thể tải danh sách gói tập');
            const allPackages = await allPackagesResponse.json();

            const currentPrice = activePackage?.maGoiTap?.donGia || activePackage?.goiTapId?.donGia || 0;
            const filtered = allPackages.filter(pkg => pkg.kichHoat && pkg.donGia > currentPrice);

            setAvailablePackages(filtered);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getPackageData = (pkg) => pkg.maGoiTap || pkg.goiTapId;

    const formatDuration = (thoiHan) => {
        if (!thoiHan) return '';

        if (thoiHan < 30) {
            return `${thoiHan} ngày`;
        }
        else if (thoiHan >= 30 && thoiHan < 365) {
            const months = Math.floor(thoiHan / 30);
            return `${months} tháng`;
        }
        else {
            const years = Math.floor(thoiHan / 365);
            return `${years} năm`;
        }
    };

    if (loading) {
        return (
            <>
                <Header />
                <Sidebar />
                <div className={`active-package-container bg-[#0a0a0a] min-h-screen ${sidebarCollapsed ? 'pl-20' : 'pl-80'}`}>
                    <div className="h-screen flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#da2128]"></div>
                    </div>
                </div>
            </>
        );
    }

    if (error) {
        return (
            <>
                <Header />
                <Sidebar />
                <div className={`active-package-container bg-[#0a0a0a] min-h-screen ${sidebarCollapsed ? 'pl-20' : 'pl-80'}`}>
                    <div className="h-screen flex items-center justify-center">
                        <div className="text-center">
                            <p className="text-red-500 mb-4">{error}</p>
                            <button onClick={fetchData} className="px-6 py-2 bg-[#da2128] text-white rounded-lg hover:opacity-90">Thử lại</button>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    const currentPkg = currentPackage ? getPackageData(currentPackage) : null;

    const filteredPackages = availablePackages.filter(pkg => {
        if (filterType === 'all') return true;

        const thoiHan = pkg.thoiHan;
        switch (filterType) {
            case 'day':
                return thoiHan < 30;
            case 'month':
                return thoiHan >= 30 && thoiHan < 365;
            case 'year':
                return thoiHan >= 365 && thoiHan < 36500;
            default:
                return true;
        }
    });

    const popularPackages = filteredPackages.filter(p => p.popular);
    const nonPopularPackages = filteredPackages.filter(p => !p.popular);

    popularPackages.sort((a, b) => (b.soLuongNguoiThamGia || 0) - (a.soLuongNguoiThamGia || 0));

    const sortedPackages = [...popularPackages, ...nonPopularPackages];

    const pricingPlans = sortedPackages.map(pkg => ({
        id: pkg._id,
        name: pkg.tenGoiTap,
        description: pkg.moTa || 'Gói tập chất lượng cao với nhiều quyền lợi.',
        price: pkg.donGia?.toLocaleString('vi-VN') || '0',
        duration: formatDuration(pkg.thoiHan),
        features: pkg.quyenLoi && pkg.quyenLoi.length > 0
            ? pkg.quyenLoi.map(ql => ql.tenQuyenLoi || ql.moTa || ql)
            : [
                'Không giới hạn số lần tập',
                'Tư vấn chế độ tập luyện',
                'Hỗ trợ huấn luyện viên',
                'Thiết bị tập luyện hiện đại'
            ],
        isPopular: pkg.popular || false,
        originalData: pkg
    }));

    return (
        <>
            <Header />
            <Sidebar />
            <div className={`transition-all duration-300 bg-[#0a0a0a] min-h-screen ${sidebarCollapsed ? 'pl-20' : 'pl-80'}`}>
                <div className="flex flex-col w-full items-center justify-center gap-16 px-4 lg:px-12 py-12 min-h-screen">
                    {/* Plans & Pricing Section */}
                    <section className="flex flex-col items-center gap-16 w-full max-w-7xl">
                        <header className="inline-flex flex-col items-center gap-3 mt-16">
                            <h2 className="text-4xl font-bold text-white text-center">
                                Gói tập &amp; Bảng giá
                            </h2>
                            <p className="w-full max-w-3xl text-lg text-gray-300 text-center">
                                {currentPkg
                                    ? `Bạn đang sử dụng gói ${currentPkg.tenGoiTap}. Nâng cấp lên gói cao hơn để trải nghiệm thêm nhiều quyền lợi!`
                                    : 'Chọn gói tập phù hợp với nhu cầu của bạn. Không có phí ẩn, minh bạch 100%!'
                                }
                            </p>
                        </header>

                        {/* Toggle Switch for Filter */}
                        <div className="flex items-center gap-2 px-2 py-2.5 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 relative w-[28rem]">
                            {/* Sliding Background Indicator */}
                            <div
                                className="absolute bg-gradient-to-r from-[#da2128] to-[#da2128]/70 rounded-full shadow-lg shadow-[#da2128]/30 transition-all duration-500 ease-in-out pointer-events-none"
                                style={{
                                    left: filterType === 'all' ? '8px' :
                                        filterType === 'day' ? '118px' :
                                            filterType === 'month' ? '228px' :
                                                '338px',
                                    width: '102px',
                                    height: 'calc(100% - 12px)',
                                    top: '6px'
                                }}
                            />

                            <button
                                onClick={() => setFilterType('all')}
                                className={`flex-1 cursor-pointer relative z-10 inline-flex items-center justify-center px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-500 ease-in-out transform whitespace-nowrap ${filterType === 'all'
                                    ? 'text-white scale-105'
                                    : 'text-gray-400 hover:text-white hover:scale-105'
                                    }`}
                                aria-pressed={filterType === 'all'}
                            >
                                Tất cả
                            </button>
                            <button
                                onClick={() => setFilterType('day')}
                                className={`flex-1 relative z-10 cursor-pointer inline-flex items-center justify-center px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-500 ease-in-out transform whitespace-nowrap ${filterType === 'day'
                                    ? 'text-white scale-105'
                                    : 'text-gray-400 hover:text-white hover:scale-105'
                                    }`}
                                aria-pressed={filterType === 'day'}
                            >
                                Theo ngày
                            </button>
                            <button
                                onClick={() => setFilterType('month')}
                                className={`flex-1 relative z-10 cursor-pointer inline-flex items-center justify-center px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-500 ease-in-out transform whitespace-nowrap ${filterType === 'month'
                                    ? 'text-white scale-105'
                                    : 'text-gray-400 hover:text-white hover:scale-105'
                                    }`}
                                aria-pressed={filterType === 'month'}
                            >
                                Theo tháng
                            </button>
                            <button
                                onClick={() => setFilterType('year')}
                                className={`flex-1 relative z-10 cursor-pointer inline-flex items-center justify-center px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-500 ease-in-out transform whitespace-nowrap ${filterType === 'year'
                                    ? 'text-white scale-105'
                                    : 'text-gray-400 hover:text-white hover:scale-105'
                                    }`}
                                aria-pressed={filterType === 'year'}
                            >
                                Theo năm
                            </button>
                        </div>

                        {/* Pricing Details Section */}
                        {(currentPackage || pricingPlans.length > 0) ? (
                            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full" aria-label="Pricing Plans">
                                {/* Current Package Card */}
                                {currentPackage && currentPkg && (
                                    <article
                                        className="flex flex-col items-start gap-10 px-12 py-24 rounded-3xl relative backdrop-blur-[20px] transition-all duration-300 overflow-hidden bg-blend-soft-light bg-[radial-gradient(ellipse_96.49%_145.31%_at_50.00%_77.59%,_rgba(255,_83,_107,_0.22)_0%,_rgba(255,_255,_255,_0)_100%)] shadow-[0px_60px_80px_-40px_rgba(0,0,0,0.25)] outline outline-offset-[-1px] outline-red-600"
                                    >
                                        <header className="flex flex-col w-full items-start gap-4">
                                            <div className="flex flex-col items-start gap-3 w-full">
                                                <div className="flex flex-col items-start w-full">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="text-2xl font-bold text-white">
                                                            {currentPkg.tenGoiTap}
                                                        </h3>
                                                        <span className="inline-flex items-center justify-center px-2 py-1 bg-[#da2128] rounded text-white text-xs font-bold whitespace-nowrap">
                                                            Đang sử dụng
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-400 leading-relaxed">
                                                        {currentPkg.moTa || 'Gói tập hiện tại của bạn'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="w-full h-px bg-white/10" role="separator" />

                                            <div className="flex flex-col items-start">
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-3xl font-bold text-white">
                                                        {currentPkg.donGia?.toLocaleString('vi-VN') || '0'}
                                                    </span>
                                                    <span className="text-xl text-white">₫</span>
                                                    <span className="text-base text-gray-400">
                                                        /{formatDuration(currentPkg.thoiHan)}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-2">
                                                    <br />
                                                    Hết hạn: {(() => {
                                                        if (currentPackage.ngayKetThuc) {
                                                            return new Date(currentPackage.ngayKetThuc).toLocaleDateString('vi-VN');
                                                        }

                                                        if (currentPackage.ngayBatDau && currentPkg.thoiHan) {
                                                            const ngayBatDau = new Date(currentPackage.ngayBatDau);
                                                            const thoiHan = currentPkg.thoiHan;
                                                            const ngayKetThuc = new Date(ngayBatDau);

                                                            if (currentPkg.donViThoiHan === 'Ngày') {
                                                                ngayKetThuc.setDate(ngayKetThuc.getDate() + thoiHan);
                                                            } else if (currentPkg.donViThoiHan === 'Tháng') {
                                                                ngayKetThuc.setMonth(ngayKetThuc.getMonth() + thoiHan);
                                                            } else if (currentPkg.donViThoiHan === 'Năm') {
                                                                ngayKetThuc.setFullYear(ngayKetThuc.getFullYear() + thoiHan);
                                                            } else {
                                                                ngayKetThuc.setDate(ngayKetThuc.getDate() + thoiHan);
                                                            }

                                                            return ngayKetThuc.toLocaleDateString('vi-VN');
                                                        }

                                                        return 'N/A';
                                                    })()}
                                                </p>
                                            </div>
                                        </header>

                                        <ul className="flex flex-col w-full items-start gap-3" role="list">
                                            {(() => {
                                                let benefits = [];

                                                if (currentPkg?.quyenLoi && Array.isArray(currentPkg.quyenLoi) && currentPkg.quyenLoi.length > 0) {
                                                    benefits = currentPkg.quyenLoi;
                                                }
                                                else if (currentPackage?.goiTapId?.quyenLoi && Array.isArray(currentPackage.goiTapId.quyenLoi) && currentPackage.goiTapId.quyenLoi.length > 0) {
                                                    benefits = currentPackage.goiTapId.quyenLoi;
                                                }
                                                else if (currentPackage?.maGoiTap?.quyenLoi && Array.isArray(currentPackage.maGoiTap.quyenLoi) && currentPackage.maGoiTap.quyenLoi.length > 0) {
                                                    benefits = currentPackage.maGoiTap.quyenLoi;
                                                }

                                                return benefits.slice(0, 6).map((feature, featureIndex) => {
                                                    const displayText = typeof feature === 'string'
                                                        ? feature
                                                        : (feature.tenQuyenLoi || feature.moTa || feature.ten || 'Quyền lợi');

                                                    return (
                                                        <li key={featureIndex} className="flex items-start gap-2">
                                                            <img src={checkIcon} alt="check" className="w-6 h-6" aria-hidden="true" />
                                                            <span className="text-sm text-gray-300">
                                                                {displayText}
                                                            </span>
                                                        </li>
                                                    );
                                                });
                                            })()}
                                        </ul>

                                        <button
                                            disabled
                                            className="w-full mt-auto flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gray-600 text-gray-400 font-semibold cursor-not-allowed opacity-60"
                                            aria-label="Gói tập hiện tại"
                                        >
                                            Gói hiện tại của bạn
                                        </button>
                                    </article>
                                )}

                                {/** Available Packages */}
                                {pricingPlans.map((plan, index) => {
                                    const isPopular = plan.isPopular;
                                    const isSelected = selectedPackageId === plan.id;

                                    const ctaLabel = currentPackage ? 'Nâng cấp ngay' : 'Chọn gói này';
                                    const ariaLabel = currentPackage ? `Nâng cấp lên gói ${plan.name}` : `Chọn gói ${plan.name}`;

                                    return (
                                        <article
                                            key={plan.id}
                                            onClick={() => setSelectedPackageId(plan.id)}
                                            className={`flex flex-col items-start gap-10 px-12 py-24 rounded-3xl relative backdrop-blur-[20px] transition-all duration-500 ease-in-out cursor-pointer overflow-hidden mb-5
                                                ${isSelected ? 'ring-1 ring-[#da2128] shadow-lg shadow-[#da2128]/30 z-20 scale-105' : ''}
                                                ${isPopular
                                                    ? `bg-[#D5D5D5]/30 shadow-[0px_60px_80px_-40px_rgba(0,0,0,0.25)] before:absolute before:inset-0 before:bg-gradient-to-tr before:from-[#da2128]/20 before:to-transparent before:pointer-events-none before:rounded-3xl ${isSelected ? '' : ''}`
                                                    : `bg-blend-overlay bg-[radial-gradient(ellipse_62.23%_62.23%_at_60.43%_73.72%,_rgba(255,_254.38,_254.38,_0.25)_0%,_rgba(255,_255,_255,_0)_100%)] ${isSelected ? '' : 'border-l border-t border-b border-neutral-500/80'}`
                                                }`}
                                        >
                                            <header className="flex flex-col w-full items-start gap-4 relative z-10">
                                                <div className="flex flex-col items-start gap-3 w-full">
                                                    <div className="flex flex-col items-start w-full">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <h3 className={`text-2xl font-bold ${isPopular ? 'text-white' : 'text-white'}`}>
                                                                {plan.name}
                                                            </h3>
                                                            {isPopular && (
                                                                <span className="inline-flex items-center justify-center px-2 py-1 bg-[#5581ff] rounded text-white text-xs font-bold whitespace-nowrap">
                                                                    Phổ biến
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className={`text-sm leading-relaxed ${isPopular ? 'text-gray-200' : 'text-gray-400'}`}>
                                                            {plan.description}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="w-full h-px bg-white/10" role="separator" />

                                                <div className="flex flex-col items-start">
                                                    <div className="flex items-baseline gap-1">
                                                        <span className={`text-3xl font-bold ${isPopular ? 'text-white' : 'text-white'}`}>
                                                            {plan.price}
                                                        </span>
                                                        <span className={`text-xl ${isPopular ? 'text-white' : 'text-white'}`}>₫</span>
                                                        <span className={`text-base ${isPopular ? 'text-gray-200' : 'text-gray-400'}`}>
                                                            /{plan.duration}
                                                        </span>
                                                    </div>
                                                    <p className={`text-xs mt-2 ${isPopular ? 'text-gray-300' : 'text-gray-500'}`}>
                                                        Hủy hoặc tạm dừng bất cứ lúc nào.<br />
                                                        Cam kết hoàn tiền trong 7 ngày
                                                    </p>
                                                </div>
                                            </header>

                                            <ul className="flex flex-col w-full items-start gap-3 relative z-10" role="list">
                                                {plan.features.slice(0, 6).map((feature, featureIndex) => (
                                                    <li key={featureIndex} className="flex items-start gap-2">
                                                        <img src={checkIcon} alt="check" className="w-6 h-6" aria-hidden="true" />

                                                        <span className={`text-sm ${isPopular ? 'text-gray-200' : 'text-gray-300'}`}>
                                                            {feature}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>

                                            <button
                                                onClick={() => navigate(`/goi-tap/${plan.id}`)}
                                                className="w-full mt-auto flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#ff536b] to-[#ff536b]/70 text-white font-semibold cursor-pointer hover:opacity-90 transition-all duration-300 hover:shadow-lg hover:shadow-[#ff536b]/30 relative z-10"
                                                aria-label={ariaLabel}
                                            >
                                                {ctaLabel}
                                                {currentPackage && (
                                                    <img src={topRightIcon} alt="" className="w-5 h-5" aria-hidden="true" />
                                                )}
                                            </button>
                                        </article>
                                    );
                                })}
                            </section>
                        ) : (
                            <div className="text-center text-gray-400">
                                <p>Không có gói tập nào để hiển thị.</p>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </>
    );
};

export default ActivePackage;