import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import Button from './Button';
import Card from './Card';
import Loading from './Loading';
import { useCrudNotifications } from '../hooks/useNotification';
import EntityForm from './EntityForm';

interface DangKyGoiTap {
    _id: string;
    maHoiVien: {
        _id: string;
        hoTen: string;
        email: string;
        sdt: string;
        ngayThamGia: Date;
        trangThaiHoiVien: string;
    };
    maGoiTap: {
        _id: string;
        tenGoiTap: string;
        donGia: number;
        thoiHan: number;
        donViThoiHan: string;
        moTa: string;
        kichHoat: boolean;
        soNgayTapTrongTuan: number;
        gioTapUuTien: any[];
        soLuongToiDa: number;
        soLuongHienTai: number;
        trangThai: string;
        ngayTao: Date;
        ngayCapNhat: Date;
    };
    ngayDangKy: Date;
    ngayBatDau?: Date;
    ngayKetThuc: Date;
    trangThai: 'DANG_HOAT_DONG' | 'TAM_DUNG' | 'HET_HAN' | 'DA_HUY' | 'DANG_SU_DUNG' | 'CHO_CHON_PT' | 'DANG_KICH_HOAT' | 'DA_NANG_CAP' | string;
    trangThaiThanhToan: 'DA_THANH_TOAN' | 'CHUA_THANH_TOAN' | 'HOAN_TIEN';
    soTienThanhToan: number;
    giaGoiTapGoc?: number; // Giá gốc của gói tập
    soTienBu?: number; // Số tiền bù cho trường hợp nâng cấp
    isUpgrade?: boolean; // Đánh dấu có phải gói nâng cấp không
    thuTuUuTien: number;
    soNgayConLai?: number;
    ngayTamDung?: Date;
    lyDoTamDung?: string;
    ptDuocChon?: string | { hoTen: string };
    trangThaiDangKy?: string;
    trangThaiGoiTap?: string;
    soNgayTamDung?: number;
    thuTu?: number;
    laGoiHienTai?: boolean;
    ghiChuYeuCau?: string;
    ghiChu?: string; // Ghi chú chung
    isLocked?: boolean;
}

interface HoiVien {
    _id: string;
    hoTen: string;
    email: string;
    sdt: string;
    ngayThamGia: Date;
    trangThaiHoiVien: string;
}

interface GoiTap {
    _id: string;
    tenGoiTap: string;
    donGia: number;
    thoiHan: number;
    donViThoiHan: string;
    moTa: string;
    kichHoat: boolean;
}

interface PackageStats {
    _id: string;
    tongSoLuotDangKy: number;
    soLuongDangHoatDong: number;
    soLuongTamDung: number;
    tongDoanhThu: number;
    thongTinGoiTap: GoiTap;
}

interface PackageRegistrationManagerProps {
    mode?: 'admin-stats' | 'default';
}

const PackageRegistrationManager: React.FC<PackageRegistrationManagerProps> = () => {
    const [activeTab, setActiveTab] = useState<'registrations' | 'member-packages' | 'package-members' | 'statistics'>('registrations');
    const [registrations, setRegistrations] = useState<DangKyGoiTap[]>([]);
    const [members, setMembers] = useState<HoiVien[]>([]);
    const [packages, setPackages] = useState<GoiTap[]>([]);
    const [packageStats, setPackageStats] = useState<PackageStats[]>([]);
    const [selectedMember, setSelectedMember] = useState<string>('');
    const [selectedPackage, setSelectedPackage] = useState<string>('');
    const [memberPackages, setMemberPackages] = useState<DangKyGoiTap[]>([]);
    const [packageMembers, setPackageMembers] = useState<DangKyGoiTap[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showNewRegistration, setShowNewRegistration] = useState(false);
    const [sortField, setSortField] = useState('');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const notifications = useCrudNotifications();

    // Form states for new registration
    const [newRegistration, setNewRegistration] = useState({
        maHoiVien: '',
        maGoiTap: '',
        ngayBatDau: new Date().toISOString().split('T')[0], // Ngày hiện tại làm mặc định
        soTienThanhToan: 0,
        trangThaiThanhToan: 'CHUA_THANH_TOAN' as const,
        ghiChu: ''
    });

    // State for EntityForm data synchronization
    const [formData, setFormData] = useState(newRegistration);
    const [upgradeInfo, setUpgradeInfo] = useState<{ amount: number; isUpgrade: boolean } | null>(null);

    // Sync formData with newRegistration
    useEffect(() => {
        setFormData(newRegistration);
    }, [newRegistration]);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async (page = 1) => {
        setIsLoading(true);
        try {
            const [regsRes, membersRes, packagesRes] = await Promise.all([
                api.get('/api/dang-ky-goi-tap', { params: { page, limit: 10 } }), // Đặt limit cố định là 10
                api.get('/api/user/hoivien'),
                api.get('/api/goitap')
            ]);

            console.log('🔍 Frontend - API Response:', regsRes);
            console.log('🔍 Frontend - Response data length:', regsRes?.data?.length || regsRes?.data?.data?.length);

            // Handle pagination response
            if (regsRes?.data?.data) {
                setRegistrations(Array.isArray(regsRes.data.data) ? regsRes.data.data : []);
                setCurrentPage(regsRes.data.pagination?.currentPage || 1);
                setTotalPages(regsRes.data.pagination?.totalPages || 1);
                setTotalItems(regsRes.data.pagination?.totalItems || 0);
            } else {
                // Fallback for non-paginated response
                setRegistrations(Array.isArray(regsRes?.data) ? regsRes.data : []);
                setTotalItems(Array.isArray(regsRes?.data) ? regsRes.data.length : 0);
                setTotalPages(1);
            }

            setMembers(Array.isArray(membersRes) ? membersRes : []);
            setPackages(Array.isArray(packagesRes) ? packagesRes.filter((pkg: GoiTap) => pkg.kichHoat) : []);
        } catch (error) {
            console.error('Error fetching data:', error);
            notifications.generic.error('Không thể tải dữ liệu');
            // Set empty arrays on error to prevent map errors
            setRegistrations([]);
            setMembers([]);
            setPackages([]);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchMemberPackages = async (memberId: string) => {
        if (!memberId) return;
        setIsLoading(true);
        try {
            console.log('🔍 Fetching packages for member:', memberId);
            const response = await api.get(`/api/dang-ky-goi-tap/hoi-vien/${memberId}`);
            console.log('📦 API Response:', response);
            console.log('📦 Response data:', response?.data);

            const packages = Array.isArray(response?.data) ? response.data : [];
            console.log('📦 Processed packages:', packages);

            setMemberPackages(packages);
        } catch (error) {
            console.error('❌ Error fetching member packages:', error);
            notifications.generic.error('Không thể tải gói tập của hội viên');
            setMemberPackages([]);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchPackageMembers = async (packageId: string) => {
        if (!packageId) return;
        setIsLoading(true);
        try {
            const response = await api.get(`/api/dang-ky-goi-tap/goi-tap/${packageId}/hoi-vien`);
            setPackageMembers(response?.data || []);
        } catch (error) {
            console.error('Error fetching package members:', error);
            notifications.generic.error('Không thể tải danh sách hội viên của gói tập');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchPackageStats = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/api/dang-ky-goi-tap/thong-ke');
            setPackageStats(response?.data || []);
        } catch (error) {
            console.error('Error fetching package stats:', error);
            notifications.generic.error('Không thể tải thống kê gói tập');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateRegistration = async (formData: any) => {
        console.log('🔍 handleCreateRegistration called with formData:', formData);

        try {
            // Check if required fields exist and are not empty
            if (!formData.maHoiVien || formData.maHoiVien.trim() === '') {
                console.log('❌ Validation failed - missing or empty maHoiVien');
                notifications.generic.error('Vui lòng chọn hội viên');
                return;
            }

            if (!formData.maGoiTap || formData.maGoiTap.trim() === '') {
                console.log('❌ Validation failed - missing or empty maGoiTap');
                notifications.generic.error('Vui lòng chọn gói tập');
                return;
            }

            console.log('✅ Validation passed - proceeding with API call');

            const selectedPackage = packages.find(p => p._id === formData.maGoiTap);
            if (!selectedPackage) {
                notifications.generic.error('Không tìm thấy gói tập');
                return;
            }

            // Kiểm tra xem hội viên có gói đang hoạt động không
            const sourcePackages = memberPackages.length > 0
                ? memberPackages
                : registrations.filter(r => r.maHoiVien._id === formData.maHoiVien);

            const activePackages = sourcePackages.filter(pkg => {
                const status = pkg.trangThai || pkg.trangThaiDangKy || pkg.trangThaiGoiTap;
                return (
                    (status === 'DANG_HOAT_DONG' ||
                        status === 'DANG_SU_DUNG' ||
                        status === 'CHO_CHON_PT' ||
                        status === 'DANG_KICH_HOAT') &&
                    !status.includes('DA_NANG_CAP') && // Loại trừ gói đã nâng cấp
                    (!pkg.ngayKetThuc || new Date(pkg.ngayKetThuc) > new Date())
                );
            });

            let finalAmount = selectedPackage.donGia;
            let isUpgrade = false;

            // Nếu hội viên có gói đang hoạt động và đang nâng cấp
            if (activePackages.length > 0) {
                const currentPackage = activePackages[0];
                const currentPackagePrice = currentPackage.soTienThanhToan || currentPackage.maGoiTap.donGia;

                // Nếu gói mới đắt hơn gói hiện tại -> nâng cấp
                if (selectedPackage.donGia > currentPackagePrice) {
                    finalAmount = calculateUpgradeAmount(selectedPackage.donGia, currentPackage);
                    isUpgrade = true;
                    console.log('🔄 Upgrade detected - Amount to pay:', finalAmount);
                    console.log('📊 Calculation details:', {
                        newPackagePrice: selectedPackage.donGia,
                        currentPackagePrice: currentPackagePrice,
                        startDate: currentPackage.ngayBatDau || currentPackage.ngayDangKy,
                        endDate: currentPackage.ngayKetThuc,
                        usedDays: calculateUsedDays(new Date(currentPackage.ngayBatDau || currentPackage.ngayDangKy)),
                        totalDays: Math.ceil((new Date(currentPackage.ngayKetThuc).getTime() - new Date(currentPackage.ngayBatDau || currentPackage.ngayDangKy).getTime()) / (1000 * 60 * 60 * 24)),
                        dailyRate: currentPackagePrice / Math.ceil((new Date(currentPackage.ngayKetThuc).getTime() - new Date(currentPackage.ngayBatDau || currentPackage.ngayDangKy).getTime()) / (1000 * 60 * 60 * 24)),
                        remainingValue: currentPackagePrice - ((currentPackagePrice / Math.ceil((new Date(currentPackage.ngayKetThuc).getTime() - new Date(currentPackage.ngayBatDau || currentPackage.ngayDangKy).getTime()) / (1000 * 60 * 60 * 24))) * calculateUsedDays(new Date(currentPackage.ngayBatDau || currentPackage.ngayDangKy)))
                    });
                } else if (selectedPackage.donGia < currentPackagePrice) {
                    // Không cho phép đăng ký gói rẻ hơn
                    notifications.generic.error('Không thể đăng ký gói rẻ hơn gói hiện tại!');
                    return;
                } else if (selectedPackage._id === currentPackage.maGoiTap._id) {
                    // Đăng ký lại gói hiện tại
                    notifications.generic.error('Hội viên đã đăng ký gói này!');
                    return;
                }
            }

            const registrationData = {
                ...formData,
                soTienThanhToan: finalAmount, // Số tiền thực tế hội viên phải trả
                giaGoiTapGoc: selectedPackage.donGia, // Giá gốc của gói tập
                ngayDangKy: new Date().toISOString(), // Ngày đăng ký gói tập mới
                ngayKetThuc: calculateEndDate(formData.ngayBatDau, selectedPackage.thoiHan, selectedPackage.donViThoiHan),
                isUpgrade: isUpgrade, // Đánh dấu đây có phải là gói nâng cấp không
                soTienBu: isUpgrade ? finalAmount : 0, // Số tiền bù nếu là gói nâng cấp
                ghiChu: isUpgrade ? `Nâng cấp từ gói cũ - Số tiền bù: ${finalAmount.toLocaleString('vi-VN')}₫` : formData.ghiChu
            };

            // Tạo đăng ký gói tập mới (backend sẽ tự động xử lý việc cập nhật gói cũ nếu là nâng cấp)
            const response = await api.post('/api/dang-ky-goi-tap', registrationData);

            // Hiển thị thông báo thành công từ backend
            notifications.generic.success(response.data.message || 'Đăng ký gói tập thành công!');

            setShowNewRegistration(false);
            setUpgradeInfo(null);
            setNewRegistration({
                maHoiVien: '',
                maGoiTap: '',
                ngayBatDau: new Date().toISOString().split('T')[0], // Reset về ngày hiện tại
                soTienThanhToan: 0,
                trangThaiThanhToan: 'CHUA_THANH_TOAN',
                ghiChu: ''
            });

            // Reload data để cập nhật trạng thái gói cũ
            console.log('🔄 Reloading data after package upgrade...');
            await fetchInitialData();

            // Nếu đang xem gói của hội viên cụ thể, refresh lại danh sách gói của hội viên đó
            if (selectedMember && activeTab === 'member-packages') {
                await fetchMemberPackages(selectedMember);
                console.log('🔄 Refreshed member packages after upgrade');
            }
        } catch (error) {
            console.error('Error creating registration:', error);
            notifications.generic.error('Không thể tạo đăng ký gói tập');
        }
    };

    const calculateEndDate = (startDate: string, duration: number, unit: string): string => {
        const start = new Date(startDate);
        let endDate = new Date(start);

        switch (unit) {
            case 'Ngay':
                endDate.setDate(start.getDate() + duration);
                break;
            case 'Thang':
                endDate.setMonth(start.getMonth() + duration);
                break;
            case 'Nam':
                endDate.setFullYear(start.getFullYear() + duration);
                break;
        }

        return endDate.toISOString();
    };

    const handleReactivatePackage = async (registrationId: string) => {
        try {
            await api.put(`/api/dang-ky-goi-tap/${registrationId}/kich-hoat`);
            notifications.generic.success('Kích hoạt lại gói tập thành công!');

            if (selectedMember) {
                fetchMemberPackages(selectedMember);
            }
            fetchInitialData();
        } catch (error) {
            console.error('Error reactivating package:', error);
            notifications.generic.error('Không thể kích hoạt lại gói tập');
        }
    };

    const getStatusBadge = (status?: string, trangThaiDangKy?: string, trangThaiGoiTap?: string) => {
        // Determine which status to use (priority: status > trangThaiDangKy > trangThaiGoiTap)
        const actualStatus = status || trangThaiDangKy || trangThaiGoiTap || '';

        const statusMap = {
            'DANG_HOAT_DONG': { class: 'success', text: 'Đang hoạt động' },
            'TAM_DUNG': { class: 'warning', text: 'Tạm dừng' },
            'HET_HAN': { class: 'danger', text: 'Hết hạn' },
            'DA_HUY': { class: 'secondary', text: 'Đã hủy' },
            'DANG_SU_DUNG': { class: 'primary', text: 'Đang sử dụng' },
            'CHO_CHON_PT': { class: 'info', text: 'Chờ chọn PT' },
            'DA_HET_HAN': { class: 'danger', text: 'Đã hết hạn' },
            'DANG_KICH_HOAT': { class: 'success', text: 'Đang kích hoạt' },
            'DA_NANG_CAP': { class: 'info', text: 'Đã nâng cấp' },
            'DA_THANH_TOAN': { class: 'success', text: 'Đã thanh toán' },
            'CHUA_THANH_TOAN': { class: 'warning', text: 'Chưa thanh toán' }
        };

        const config = statusMap[actualStatus as keyof typeof statusMap] ||
            { class: 'secondary', text: actualStatus || 'Unknown' };

        return <span className={`badge ${config.class}`}>{config.text}</span>;
    };

    const getPaymentStatusBadge = (status: string) => {
        const statusMap = {
            'DA_THANH_TOAN': { class: 'success', text: 'Đã thanh toán' },
            'CHUA_THANH_TOAN': { class: 'warning', text: 'Chưa thanh toán' },
            'HOAN_TIEN': { class: 'info', text: 'Hoàn tiền' }
        };
        const config = statusMap[status as keyof typeof statusMap] || { class: 'secondary', text: status };
        return <span className={`badge ${config.class}`}>{config.text}</span>;
    };

    useEffect(() => {
        if (activeTab === 'member-packages' && selectedMember) {
            fetchMemberPackages(selectedMember);
        }
    }, [activeTab, selectedMember]);

    useEffect(() => {
        if (activeTab === 'package-members' && selectedPackage) {
            fetchPackageMembers(selectedPackage);
        }
    }, [activeTab, selectedPackage]);

    useEffect(() => {
        if (activeTab === 'statistics') {
            fetchPackageStats();
        }
    }, [activeTab]);

    // Hàm tính số ngày đã sử dụng
    const calculateUsedDays = (startDate: Date, currentDate: Date = new Date()) => {
        const diffTime = currentDate.getTime() - startDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); // Sử dụng Math.floor để lấy số ngày chính xác
        return Math.max(0, diffDays); // Đảm bảo không âm
    };

    // Hàm tính số tiền đã sử dụng
    const calculateUsedAmount = (packagePrice: number, totalDays: number, usedDays: number) => {
        if (totalDays <= 0) return 0;
        return (packagePrice / totalDays) * usedDays;
    };

    // Hàm tính số tiền cần bù khi nâng cấp
    const calculateUpgradeAmount = (newPackagePrice: number, currentPackage: DangKyGoiTap) => {
        const currentPrice = currentPackage.soTienThanhToan || currentPackage.maGoiTap.donGia;
        const startDate = new Date(currentPackage.ngayBatDau || currentPackage.ngayDangKy);
        const endDate = new Date(currentPackage.ngayKetThuc);

        // Tính tổng số ngày của gói hiện tại
        const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const usedDays = calculateUsedDays(startDate);

        // Công thức đúng: Số tiền phải trả = Giá gói mới - (Giá gói cũ - (Giá gói cũ / Thời hạn (ngày) * Số ngày đã trôi qua))
        const dailyRate = currentPrice / totalDays; // Giá gói cũ / Thời hạn (ngày)
        const usedAmount = dailyRate * usedDays; // Số tiền đã sử dụng
        const remainingValue = currentPrice - usedAmount; // Giá trị còn lại của gói cũ

        // Số tiền cần bù = Giá gói mới - Giá trị còn lại của gói cũ
        const upgradeAmount = newPackagePrice - remainingValue;
        return Math.max(0, upgradeAmount); // Đảm bảo không âm
    };

    const getPackageOptions = (memberId: string) => {
        if (!memberId) {
            return packages.map(pkg => ({
                value: pkg._id,
                label: `${pkg.tenGoiTap} - ${pkg.donGia.toLocaleString('vi-VN')}₫`
            }));
        }

        const sourcePackages = memberPackages.length > 0
            ? memberPackages
            : registrations.filter(r => r.maHoiVien._id === memberId);

        // Lọc gói đang hoạt động (chỉ lấy 1 gói hiện tại, loại trừ gói đã nâng cấp)
        const activePackages = sourcePackages.filter(pkg => {
            const status = pkg.trangThai || pkg.trangThaiDangKy || pkg.trangThaiGoiTap;
            return (
                (status === 'DANG_HOAT_DONG' ||
                    status === 'DANG_SU_DUNG' ||
                    status === 'CHO_CHON_PT' ||
                    status === 'DANG_KICH_HOAT') &&
                !status.includes('DA_NANG_CAP') && // Loại trừ gói đã nâng cấp
                (!pkg.ngayKetThuc || new Date(pkg.ngayKetThuc) > new Date())
            );
        });

        // Nếu hội viên chưa có gói nào hoặc không có gói đang hoạt động
        if (activePackages.length === 0) {
            return packages.map(pkg => ({
                value: pkg._id,
                label: `${pkg.tenGoiTap} - ${pkg.donGia.toLocaleString('vi-VN')}₫`
            }));
        }

        // Lấy gói hiện tại (chỉ lấy 1 gói)
        const currentPackage = activePackages[0];
        const currentPackagePrice = currentPackage.soTienThanhToan || currentPackage.maGoiTap.donGia;
        const currentPackageId = currentPackage.maGoiTap._id;

        return packages.map(pkg => {
            if (pkg._id === currentPackageId) {
                return {
                    value: pkg._id,
                    label: `${pkg.tenGoiTap} - ${pkg.donGia.toLocaleString('vi-VN')}₫ (Gói hiện đang đăng ký)`,
                    disabled: true
                };
            } else if (pkg.donGia > currentPackagePrice) {
                // Tính số tiền cần bù cho gói nâng cấp
                const upgradeAmount = calculateUpgradeAmount(pkg.donGia, currentPackage);
                return {
                    value: pkg._id,
                    label: `${pkg.tenGoiTap} - ${pkg.donGia.toLocaleString('vi-VN')}₫ (Nâng cấp gói - Cần bù: ${upgradeAmount.toLocaleString('vi-VN')}₫)`,
                    upgradeAmount: upgradeAmount // Thêm thông tin số tiền cần bù
                };
            } else {
                return {
                    value: pkg._id,
                    label: `${pkg.tenGoiTap} - ${pkg.donGia.toLocaleString('vi-VN')}₫ (Không được đăng ký gói rẻ hơn)`,
                    disabled: true
                };
            }
        });
    };



    return (
        <div className="package-registration-manager">
            <Card className="panel">
                <div className="toolbar">
                    <div className="toolbar-left">
                        <h2>Quản lý đăng ký gói tập</h2>
                        <p>Quản lý việc đăng ký gói tập của hội viên với hệ thống ưu tiên</p>
                    </div>
                    <div className="toolbar-right">
                        <Button variant="primary" onClick={() => setShowNewRegistration(true)}>
                            Đăng ký mới
                        </Button>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="tab-navigation">
                    <button
                        className={`tab-btn ${activeTab === 'registrations' ? 'active' : ''}`}
                        onClick={() => setActiveTab('registrations')}
                    >
                        Tất cả đăng ký
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'member-packages' ? 'active' : ''}`}
                        onClick={() => setActiveTab('member-packages')}
                    >
                        Gói tập của hội viên
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'package-members' ? 'active' : ''}`}
                        onClick={() => setActiveTab('package-members')}
                    >
                        Hội viên của gói tập
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'statistics' ? 'active' : ''}`}
                        onClick={() => setActiveTab('statistics')}
                    >
                        Thống kê
                    </button>
                </div>

                {isLoading ? (
                    <Loading text="Đang tải dữ liệu..." />
                ) : (
                    <>
                        {/* All Registrations Tab */}
                        {activeTab === 'registrations' && (
                            <div className="registrations-table">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Hội viên</th>
                                            <th>Gói tập</th>
                                            <th>Ngày đăng ký</th>
                                            <th>Thời hạn</th>
                                            <th>Trạng thái</th>
                                            <th>Thanh toán</th>
                                            <th>Ưu tiên</th>
                                            <th>Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {registrations.map(reg => (
                                            <tr key={reg._id}>
                                                <td>
                                                    <div className="member-info">
                                                        <strong>{reg.maHoiVien.hoTen}</strong>
                                                        <small>{reg.maHoiVien.sdt}</small>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="package-info">
                                                        <strong>{reg.maGoiTap.tenGoiTap}</strong>
                                                        {reg.isUpgrade && (
                                                            <small className="upgrade-badge">Nâng cấp</small>
                                                        )}
                                                        {reg.giaGoiTapGoc && reg.soTienBu && (
                                                            <div className="price-details">
                                                                <small>Giá gốc: {reg.giaGoiTapGoc.toLocaleString('vi-VN')}₫</small>
                                                                <small>Số tiền bù: {reg.soTienBu.toLocaleString('vi-VN')}₫</small>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>{new Date(reg.ngayDangKy).toLocaleDateString('vi-VN')}</td>
                                                <td>
                                                    {(() => {
                                                        try {
                                                            if (reg.ngayBatDau) {
                                                                return new Date(reg.ngayBatDau).toLocaleDateString('vi-VN');
                                                            }
                                                            return 'Chưa có thông tin';
                                                        } catch (error) {
                                                            console.error('Invalid date for reg:', reg.ngayBatDau, error);
                                                            return 'Chưa có thông tin';
                                                        }
                                                    })()}
                                                    - {new Date(reg.ngayKetThuc).toLocaleDateString('vi-VN')}
                                                </td>
                                                <td>{getStatusBadge(reg.trangThai, reg.trangThaiDangKy, reg.trangThaiGoiTap)}</td>
                                                <td>{getPaymentStatusBadge(reg.trangThaiThanhToan)}</td>
                                                <td>
                                                    <span className="priority-badge">#{reg.thuTuUuTien}</span>
                                                </td>
                                                <td>
                                                    {reg.trangThai === 'TAM_DUNG' && reg.soNgayConLai && reg.soNgayConLai > 0 && (
                                                        <Button
                                                            variant="primary"
                                                            size="small"
                                                            onClick={() => handleReactivatePackage(reg._id)}
                                                        >
                                                            Kích hoạt lại
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div className="pagination">
                                    <button
                                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                        disabled={currentPage === 1}
                                        className="pagination-btn"
                                    >
                                        « Trước
                                    </button>

                                    <div className="pagination-info">
                                        Trang {currentPage} / {totalPages} (Tổng: {totalItems} đăng ký)
                                    </div>

                                    <button
                                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                        disabled={currentPage === totalPages}
                                        className="pagination-btn"
                                    >
                                        Sau »
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Member Packages Tab */}
                        {activeTab === 'member-packages' && (
                            <div className="member-packages-section">
                                <div className="filter-section">
                                    <select
                                        value={selectedMember}
                                        onChange={(e) => setSelectedMember(e.target.value)}
                                        className="member-select"
                                    >
                                        <option value="">Chọn hội viên</option>
                                        {members.map(member => (
                                            <option key={member._id} value={member._id}>
                                                {member.hoTen} - {member.sdt}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {selectedMember && (
                                    <div className="member-packages-list">
                                        <h3>Lịch sử gói tập của {members.find(m => m._id === selectedMember)?.hoTen}</h3>
                                        <div className="packages-timeline">
                                            {memberPackages.map((pkg, index) => (
                                                <div key={pkg._id} className={`package-timeline-item ${pkg.isUpgrade ? 'upgrade' :
                                                    (pkg.trangThai === 'DA_NANG_CAP' || pkg.trangThaiDangKy === 'DA_NANG_CAP') ? 'da_nang_cap' :
                                                        (pkg.trangThaiGoiTap || pkg.trangThai || 'unknown').toLowerCase()
                                                    }`}>
                                                    <div className="timeline-marker">
                                                        <div className="marker-dot"></div>
                                                    </div>
                                                    <div className="timeline-content">
                                                        <div className="package-header">
                                                            <h4>
                                                                {pkg.maGoiTap?.tenGoiTap}
                                                                {(pkg.isUpgrade) && (
                                                                    <span className="upgrade-badge"> - Gói nâng cấp</span>
                                                                )}
                                                                {((pkg.trangThai === 'DA_NANG_CAP' || pkg.trangThaiDangKy === 'DA_NANG_CAP') && !pkg.isUpgrade) && (
                                                                    <span className="old-package-badge"> - Gói cũ (đã nâng cấp)</span>
                                                                )}
                                                            </h4>
                                                            {getStatusBadge(pkg.trangThaiGoiTap, pkg.trangThaiDangKy, pkg.trangThai)}
                                                        </div>
                                                        <div className="package-details">
                                                            <p><strong>Thời gian:</strong> {pkg.ngayBatDau ? new Date(pkg.ngayBatDau).toLocaleDateString('vi-VN') : 'N/A'} - {new Date(pkg.ngayKetThuc).toLocaleDateString('vi-VN')}</p>

                                                            {/* Hiển thị số tiền dựa trên loại gói */}
                                                            {pkg.isUpgrade && (pkg.soTienBu || 0) > 0 ? (
                                                                <p><strong>Số tiền bù nâng cấp:</strong> <span className="upgrade-amount">{(pkg.soTienBu || 0).toLocaleString('vi-VN')}₫</span></p>
                                                            ) : (
                                                                <p><strong>Giá gói:</strong> {(pkg.giaGoiTapGoc || pkg.soTienThanhToan || 0).toLocaleString('vi-VN')}₫</p>
                                                            )}

                                                            {/* Hiển thị thông tin nâng cấp nếu có */}
                                                            {pkg.isUpgrade && pkg.giaGoiTapGoc && (
                                                                <p><strong>Giá gốc gói:</strong> {pkg.giaGoiTapGoc.toLocaleString('vi-VN')}₫</p>
                                                            )}
                                                            {(pkg.trangThaiGoiTap || pkg.trangThai) === 'TAM_DUNG' && (
                                                                <>
                                                                    <p><strong>Ngày tạm dừng:</strong> {pkg.ngayTamDung ? new Date(pkg.ngayTamDung).toLocaleDateString('vi-VN') : 'N/A'}</p>
                                                                    <p><strong>Số ngày còn lại:</strong> {pkg.soNgayConLai || pkg.soNgayTamDung || 0} ngày</p>
                                                                    <p><strong>Lý do:</strong> {pkg.lyDoTamDung || 'N/A'}</p>
                                                                </>
                                                            )}
                                                            {pkg.ptDuocChon && (
                                                                <p><strong>PT:</strong> {typeof pkg.ptDuocChon === 'object' && pkg.ptDuocChon ? pkg.ptDuocChon.hoTen : pkg.ptDuocChon || 'Chưa chọn'}</p>
                                                            )}
                                                        </div>
                                                        {(pkg.trangThaiGoiTap || pkg.trangThai) === 'TAM_DUNG' && pkg.soNgayConLai && pkg.soNgayConLai > 0 && (
                                                            <Button
                                                                variant="primary"
                                                                size="small"
                                                                onClick={() => handleReactivatePackage(pkg._id)}
                                                            >
                                                                Kích hoạt lại
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Package Members Tab */}
                        {activeTab === 'package-members' && (
                            <div className="package-members-section">
                                <div className="filter-section">
                                    <select
                                        value={selectedPackage}
                                        onChange={(e) => setSelectedPackage(e.target.value)}
                                        className="package-select"
                                    >
                                        <option value="">Chọn gói tập</option>
                                        {packages.map(pkg => (
                                            <option key={pkg._id} value={pkg._id}>
                                                {pkg.tenGoiTap} - {pkg.donGia.toLocaleString('vi-VN')}₫
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {selectedPackage && (
                                    <div className="package-members-list">
                                        <h3>Danh sách hội viên của {packages.find(p => p._id === selectedPackage)?.tenGoiTap}</h3>

                                        {isLoading ? (
                                            <div className="loading">Đang tải dữ liệu...</div>
                                        ) : packageMembers.length === 0 ? (
                                            <div className="no-data">
                                                <p>Không có hội viên nào đăng ký gói tập này</p>
                                            </div>
                                        ) : (
                                            <table className="table">
                                                <thead>
                                                    <tr>
                                                        <th>Hội viên</th>
                                                        <th>Ngày đăng ký</th>
                                                        <th>Thời hạn</th>
                                                        <th>Trạng thái</th>
                                                        <th>Thanh toán</th>
                                                        <th>PT</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {packageMembers.map(member => (
                                                        <tr key={member._id}>
                                                            <td>
                                                                <div className="member-info">
                                                                    <strong>{member.maHoiVien?.hoTen || 'N/A'}</strong>
                                                                    <small>{member.maHoiVien?.sdt || 'N/A'}</small>
                                                                </div>
                                                            </td>
                                                            <td>{new Date(member.ngayDangKy).toLocaleDateString('vi-VN')}</td>
                                                            <td>
                                                                {member.ngayBatDau ? new Date(member.ngayBatDau).toLocaleDateString('vi-VN') : 'N/A'} - {' '}
                                                                {new Date(member.ngayKetThuc).toLocaleDateString('vi-VN')}
                                                            </td>
                                                            <td>{getStatusBadge(member.trangThai, member.trangThaiDangKy, member.trangThaiGoiTap)}</td>
                                                            <td>{getPaymentStatusBadge(member.trangThaiThanhToan)}</td>
                                                            <td>{typeof member.ptDuocChon === 'object' && member.ptDuocChon ? member.ptDuocChon.hoTen : member.ptDuocChon || 'Chưa chọn'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Statistics Tab */}
                        {activeTab === 'statistics' && (
                            <div className="statistics-section">
                                <h3>Thống kê gói tập</h3>
                                <div className="stats-grid">
                                    {packageStats.map(stat => (
                                        <Card key={stat._id} className="stat-card">
                                            <h4>{stat.thongTinGoiTap.tenGoiTap}</h4>
                                            <div className="stat-item">
                                                <span className="stat-label">Tổng lượt đăng ký:</span>
                                                <span className="stat-value">{stat.tongSoLuotDangKy}</span>
                                            </div>
                                            <div className="stat-item">
                                                <span className="stat-label">Đang hoạt động:</span>
                                                <span className="stat-value success">{stat.soLuongDangHoatDong}</span>
                                            </div>
                                            <div className="stat-item">
                                                <span className="stat-label">Tạm dừng:</span>
                                                <span className="stat-value warning">{stat.soLuongTamDung}</span>
                                            </div>
                                            <div className="stat-item">
                                                <span className="stat-label">Tổng doanh thu:</span>
                                                <span className="stat-value primary">{(stat.tongDoanhThu || 0).toLocaleString('vi-VN')}₫</span>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* New Registration Modal */}
                {showNewRegistration && (
                    <div className="modal-overlay" onClick={() => {
                        setShowNewRegistration(false);
                        setUpgradeInfo(null);
                    }}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>Đăng ký gói tập mới</h3>
                                <button className="close-btn" onClick={() => {
                                    setShowNewRegistration(false);
                                    setUpgradeInfo(null);
                                }}>×</button>
                            </div>
                            <div className="modal-body">
                                {upgradeInfo && upgradeInfo.isUpgrade && (
                                    <div className="upgrade-notification" style={{
                                        backgroundColor: '#e3f2fd',
                                        border: '1px solid #2196f3',
                                        borderRadius: '8px',
                                        padding: '12px',
                                        marginBottom: '16px',
                                        color: '#1976d2'
                                    }}>
                                        <strong>🔄 Nâng cấp gói tập</strong>
                                        <p>Số tiền cần thanh toán: <strong>{upgradeInfo.amount.toLocaleString('vi-VN')}₫</strong></p>
                                        <small>Số tiền này đã được tính toán dựa trên số ngày đã sử dụng gói hiện tại.</small>
                                    </div>
                                )}
                                <EntityForm
                                    title="Đăng ký gói tập mới"
                                    fields={[
                                        {
                                            label: 'Hội viên',
                                            name: 'maHoiVien',
                                            type: 'select',
                                            options: members.map(member => ({ value: member._id, label: `${member.hoTen} - ${member.sdt}` })),
                                        },
                                        {
                                            label: 'Gói tập',
                                            name: 'maGoiTap',
                                            type: 'select',
                                            options: getPackageOptions(newRegistration.maHoiVien),
                                        },
                                        {
                                            label: 'Ngày bắt đầu',
                                            name: 'ngayBatDau',
                                            type: 'date',
                                            validation: {
                                                required: true,
                                                minDate: new Date().toISOString(),
                                                message: 'Ngày bắt đầu phải từ hôm nay trở đi'
                                            }
                                        },
                                        {
                                            label: 'Số tiền thanh toán',
                                            name: 'soTienThanhToan',
                                            type: 'number',
                                        },
                                        {
                                            label: 'Trạng thái thanh toán',
                                            name: 'trangThaiThanhToan',
                                            type: 'select',
                                            options: [
                                                { value: 'CHUA_THANH_TOAN', label: 'Chưa thanh toán' },
                                                { value: 'DA_THANH_TOAN', label: 'Đã thanh toán' },
                                            ],
                                        },
                                        {
                                            label: 'Ghi chú',
                                            name: 'ghiChu',
                                            type: 'textarea',
                                        },
                                    ]}
                                    initialData={formData}
                                    onClose={() => setShowNewRegistration(false)}
                                    onSave={(formData) => handleCreateRegistration(formData)}
                                    onFieldChange={(name, value) => {
                                        console.log('🔍 onFieldChange called:', { name, value, packagesLength: packages.length });

                                        setNewRegistration(prev => ({ ...prev, [name]: value }));

                                        if (name === 'maHoiVien' && value) {
                                            // Gọi API để lấy danh sách gói đã đăng ký của hội viên này
                                            fetchMemberPackages(value);
                                        }

                                        if (name === 'maGoiTap' && value) {
                                            const selectedPackage = packages.find(p => p._id === value);
                                            if (selectedPackage) {
                                                // Kiểm tra xem có phải nâng cấp không
                                                const sourcePackages = memberPackages.length > 0
                                                    ? memberPackages
                                                    : registrations.filter(r => r.maHoiVien._id === newRegistration.maHoiVien);

                                                const activePackages = sourcePackages.filter(pkg => {
                                                    const status = pkg.trangThai || pkg.trangThaiDangKy || pkg.trangThaiGoiTap;
                                                    return (
                                                        (status === 'DANG_HOAT_DONG' ||
                                                            status === 'DANG_SU_DUNG' ||
                                                            status === 'CHO_CHON_PT' ||
                                                            status === 'DANG_KICH_HOAT') &&
                                                        !status.includes('DA_NANG_CAP') && // Loại trừ gói đã nâng cấp
                                                        (!pkg.ngayKetThuc || new Date(pkg.ngayKetThuc) > new Date())
                                                    );
                                                });

                                                let finalAmount = selectedPackage.donGia;
                                                let isUpgrade = false;

                                                // Nếu hội viên có gói đang hoạt động và đang nâng cấp
                                                if (activePackages.length > 0) {
                                                    const currentPackage = activePackages[0];
                                                    const currentPackagePrice = currentPackage.soTienThanhToan || currentPackage.maGoiTap.donGia;

                                                    // Nếu gói mới đắt hơn gói hiện tại -> nâng cấp
                                                    if (selectedPackage.donGia > currentPackagePrice) {
                                                        finalAmount = calculateUpgradeAmount(selectedPackage.donGia, currentPackage);
                                                        isUpgrade = true;
                                                        setUpgradeInfo({ amount: finalAmount, isUpgrade: true });
                                                        console.log('🔍 onFieldChange - Upgrade calculation:', {
                                                            selectedPackage: selectedPackage.tenGoiTap,
                                                            newPrice: selectedPackage.donGia,
                                                            currentPrice: currentPackagePrice,
                                                            upgradeAmount: finalAmount
                                                        });
                                                    } else {
                                                        setUpgradeInfo(null);
                                                    }
                                                } else {
                                                    setUpgradeInfo(null);
                                                }

                                                setNewRegistration(prev => ({
                                                    ...prev,
                                                    soTienThanhToan: finalAmount
                                                }));
                                            }
                                        }
                                    }}
                                />
                            </div>
                            <div className="modal-footer">
                                <Button variant="ghost" onClick={() => {
                                    setShowNewRegistration(false);
                                    setUpgradeInfo(null);
                                }}>
                                    Hủy
                                </Button>
                                <Button variant="primary" onClick={() => handleCreateRegistration(newRegistration)}>
                                    Đăng ký
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default PackageRegistrationManager;
