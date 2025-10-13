import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import Button from './Button';
import Card from './Card';
import Loading from './Loading';
import { useCrudNotifications } from '../hooks/useNotification';
import EntityForm from './EntityForm';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement
);

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
    tongQuan: {
        tongSoDangKy: number;
        tongSoHoiVienDaThanhToan: number;
        tongSoHoiVienChuaThanhToan: number;
        soDangKyDangHoatDong: number;
        soDangKyHetHan: number;
        tongDoanhThu: number;
    };
    theoGoiTap: Array<{
        _id: {
            maGoiTap: string;
            tenGoiTap: string;
            donGia: number;
        };
        soLuongDangKy: number;
        doanhThu: number;
        tyLe: string;
    }>;
    theoTrangThai: Array<{
        _id: string;
        soLuong: number;
        tyLe: string;
    }>;
    theoThang: Array<{
        _id: {
            nam: number;
            thang: number;
        };
        soDangKyMoi: number;
        doanhThu: number;
    }>;
}

interface PackageRegistrationManagerProps {
    mode?: 'admin-stats' | 'default';
}

const PackageRegistrationManager: React.FC<PackageRegistrationManagerProps> = () => {
    const [activeTab, setActiveTab] = useState<'registrations' | 'member-packages' | 'package-members' | 'statistics'>('registrations');
    const [registrations, setRegistrations] = useState<DangKyGoiTap[]>([]);
    const [members, setMembers] = useState<HoiVien[]>([]);
    const [packages, setPackages] = useState<GoiTap[]>([]);
    const [packageStats, setPackageStats] = useState<PackageStats | null>(null);
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
    const [chartKey, setChartKey] = useState(0); // Force re-render charts
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
            setPackageStats(response?.data || null);
            console.log('📊 Package stats loaded:', response?.data);
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
        } catch (error: any) {
            console.error('Error creating registration:', error);

            // Xử lý lỗi có gói đang hoạt động
            if (error.response?.status === 400 && error.response?.data?.message?.includes('đã có gói tập đang hoạt động')) {
                const existingPackage = error.response.data.existingPackage;
                notifications.generic.error(
                    `Hội viên đã có gói tập đang hoạt động: ${existingPackage?.tenGoiTap || 'N/A'}. ` +
                    'Vui lòng chọn "Nâng cấp gói" thay vì "Đăng ký mới".'
                );
            } else {
                notifications.generic.error('Không thể tạo đăng ký gói tập');
            }
        }
    };

    const calculateEndDate = (startDate: string, duration: number, unit: string): string => {
        const start = new Date(startDate);
        let endDate = new Date(start);

        switch (unit) {
            case 'Ngày':
                endDate.setDate(start.getDate() + duration);
                break;
            case 'Tháng':
                endDate.setMonth(start.getMonth() + duration);
                break;
            case 'Năm':
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

    // Tạo dữ liệu biểu đồ cho thống kê theo gói tập
    const getPackageChartData = () => {
        console.log('🔍 Debug packageStats:', packageStats);
        console.log('🔍 Debug theoGoiTap:', packageStats?.theoGoiTap);

        if (!packageStats?.theoGoiTap || packageStats.theoGoiTap.length === 0) {
            console.log('❌ No package data available');
            return null;
        }

        const labels = packageStats.theoGoiTap.map(item => item._id.tenGoiTap);
        const registrationData = packageStats.theoGoiTap.map(item => item.soLuongDangKy);
        const revenueData = packageStats.theoGoiTap.map(item => item.doanhThu);

        console.log('📊 Chart labels:', labels);
        console.log('📊 Registration data:', registrationData);
        console.log('📊 Revenue data:', revenueData);

        // Get current theme
        const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
        const textColor = isDarkMode ? '#ffffff' : '#374151';

        const chartData = {
            registrationChart: {
                labels,
                datasets: [
                    {
                        label: 'Số lượng đăng ký',
                        data: registrationData,
                        backgroundColor: 'rgba(59, 130, 246, 0.5)',
                        borderColor: 'rgba(59, 130, 246, 1)',
                        borderWidth: 1,
                    }
                ]
            },
            revenueChart: {
                labels,
                datasets: [
                    {
                        label: 'Doanh thu (₫)',
                        data: revenueData,
                        backgroundColor: 'rgba(16, 185, 129, 0.5)',
                        borderColor: 'rgba(16, 185, 129, 1)',
                        borderWidth: 1,
                    }
                ]
            },
            pieChart: {
                labels,
                datasets: [
                    {
                        data: registrationData,
                        backgroundColor: [
                            'rgba(59, 130, 246, 0.8)',
                            'rgba(16, 185, 129, 0.8)',
                            'rgba(245, 158, 11, 0.8)',
                            'rgba(239, 68, 68, 0.8)',
                            'rgba(139, 92, 246, 0.8)',
                            'rgba(236, 72, 153, 0.8)',
                        ],
                        borderColor: [
                            'rgba(59, 130, 246, 1)',
                            'rgba(16, 185, 129, 1)',
                            'rgba(245, 158, 11, 1)',
                            'rgba(239, 68, 68, 1)',
                            'rgba(139, 92, 246, 1)',
                            'rgba(236, 72, 153, 1)',
                        ],
                        borderWidth: 2,
                    }
                ]
            },
            // Common chart options for dark mode
            chartOptions: {
                plugins: {
                    legend: {
                        labels: {
                            color: textColor,
                            font: {
                                size: 12,
                                weight: '500'
                            }
                        }
                    }
                }
            }
        };

        console.log('📊 Final chart data:', chartData);
        return chartData;
    };

    // Tạo dữ liệu biểu đồ cho thống kê theo trạng thái
    const getStatusChartData = () => {
        if (!packageStats?.theoTrangThai) return null;

        const statusTranslation: { [key: string]: string } = {
            'DANG_HOAT_DONG': 'Đang hoạt động',
            'TAM_DUNG': 'Tạm dừng',
            'HET_HAN': 'Hết hạn',
            'DA_HUY': 'Đã hủy',
            'DANG_SU_DUNG': 'Đang sử dụng',
            'CHO_CHON_PT': 'Chờ chọn PT',
            'DA_HET_HAN': 'Đã hết hạn',
            'DANG_KICH_HOAT': 'Đang kích hoạt',
            'DA_NANG_CAP': 'Đã nâng cấp',
            'DA_CHON_PT': 'Đã chọn PT',
            'DA_THANH_TOAN': 'Đã thanh toán',
            'CHUA_THANH_TOAN': 'Chưa thanh toán',
            'HOAN_TIEN': 'Hoàn tiền'
        };

        const labels = packageStats.theoTrangThai.map(item =>
            statusTranslation[item._id] || item._id
        );
        const data = packageStats.theoTrangThai.map(item => item.soLuong);

        const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
        const textColor = isDarkMode ? '#ffffff' : '#374151';

        return {
            labels,
            datasets: [
                {
                    data,
                    backgroundColor: [
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(239, 68, 68, 0.8)',
                        'rgba(139, 92, 246, 0.8)',
                    ],
                    borderColor: [
                        'rgba(59, 130, 246, 1)',
                        'rgba(16, 185, 129, 1)',
                        'rgba(245, 158, 11, 1)',
                        'rgba(239, 68, 68, 1)',
                        'rgba(139, 92, 246, 1)',
                    ],
                    borderWidth: 2,
                }
            ],
            chartOptions: {
                plugins: {
                    legend: {
                        labels: {
                            color: textColor,
                            font: {
                                size: 12,
                                weight: '500'
                            }
                        }
                    }
                }
            }
        };
    };

    // Tạo dữ liệu biểu đồ cho thống kê theo thời gian
    const getTimeChartData = () => {
        if (!packageStats?.theoThang) return null;

        const labels = packageStats.theoThang
            .slice()
            .reverse()
            .map(item => `${item._id.thang}/${item._id.nam}`);
        const registrationData = packageStats.theoThang
            .slice()
            .reverse()
            .map(item => item.soDangKyMoi);
        const revenueData = packageStats.theoThang
            .slice()
            .reverse()
            .map(item => item.doanhThu);

        // Get current theme
        const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
        const textColor = isDarkMode ? '#ffffff' : '#374151';

        return {
            labels,
            datasets: [
                {
                    label: 'Số đăng ký mới',
                    data: registrationData,
                    borderColor: 'rgba(59, 130, 246, 1)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    yAxisID: 'y',
                },
                {
                    label: 'Doanh thu (₫)',
                    data: revenueData,
                    borderColor: 'rgba(16, 185, 129, 1)',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    yAxisID: 'y1',
                }
            ],
            chartOptions: {
                plugins: {
                    legend: {
                        labels: {
                            color: textColor,
                            font: {
                                size: 12,
                                weight: '500'
                            }
                        }
                    }
                }
            }
        };
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

    // Force re-render charts when theme changes
    useEffect(() => {
        if (activeTab === 'statistics' && packageStats) {
            // Small delay to ensure theme is applied
            setTimeout(() => {
                // Force re-render by updating chart key
                setChartKey(prev => prev + 1);
            }, 100);
        }
    }, [document.documentElement.getAttribute('data-theme')]);

    // Listen for theme changes using MutationObserver
    useEffect(() => {
        if (activeTab === 'statistics') {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
                        setTimeout(() => {
                            setChartKey(prev => prev + 1);
                        }, 100);
                    }
                });
            });

            observer.observe(document.documentElement, {
                attributes: true,
                attributeFilter: ['data-theme']
            });

            return () => observer.disconnect();
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
                label: `${pkg.tenGoiTap} - ${pkg.donGia.toLocaleString('vi-VN')}₫ (Gói đầu tiên)`
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
                                                                {(() => {
                                                                    // Tìm gói mới nhất (có ngày đăng ký gần nhất)
                                                                    const latestPackage = memberPackages
                                                                        .filter(p => p.trangThai !== 'DA_NANG_CAP' && p.trangThaiDangKy !== 'DA_NANG_CAP')
                                                                        .sort((a, b) => new Date(b.ngayDangKy).getTime() - new Date(a.ngayDangKy).getTime())[0];

                                                                    // Chỉ gói mới nhất mới được đánh dấu là "nâng cấp"
                                                                    if (pkg._id === latestPackage?._id && pkg.isUpgrade) {
                                                                        return <span className="upgrade-badge"> - Gói nâng cấp</span>;
                                                                    }

                                                                    // Các gói khác đều là "gói cũ"
                                                                    if (pkg._id !== latestPackage?._id && (pkg.trangThai === 'DA_NANG_CAP' || pkg.trangThaiDangKy === 'DA_NANG_CAP' || pkg.isUpgrade)) {
                                                                        return <span className="old-package-badge"> - Gói cũ (đã nâng cấp)</span>;
                                                                    }

                                                                    return null;
                                                                })()}
                                                            </h4>
                                                            {getStatusBadge(pkg.trangThaiGoiTap, pkg.trangThaiDangKy, pkg.trangThai)}
                                                        </div>
                                                        <div className="package-details">
                                                            <p><strong>Thời gian:</strong> {pkg.ngayBatDau ? new Date(pkg.ngayBatDau).toLocaleDateString('vi-VN') : 'N/A'} - {new Date(pkg.ngayKetThuc).toLocaleDateString('vi-VN')}</p>

                                                            {/* Hiển thị số tiền dựa trên loại gói */}
                                                            {(() => {
                                                                // Tìm gói mới nhất
                                                                const latestPackage = memberPackages
                                                                    .filter(p => p.trangThai !== 'DA_NANG_CAP' && p.trangThaiDangKy !== 'DA_NANG_CAP')
                                                                    .sort((a, b) => new Date(b.ngayDangKy).getTime() - new Date(a.ngayDangKy).getTime())[0];

                                                                // Chỉ gói mới nhất mới hiển thị "Số tiền bù nâng cấp"
                                                                if (pkg._id === latestPackage?._id && pkg.isUpgrade && (pkg.soTienBu || 0) > 0) {
                                                                    return (
                                                                        <p><strong>Số tiền bù nâng cấp:</strong> <span className="upgrade-amount">{(pkg.soTienBu || 0).toLocaleString('vi-VN')}₫</span></p>
                                                                    );
                                                                }

                                                                // Các gói khác hiển thị "Giá gói"
                                                                return (
                                                                    <p><strong>Giá gói:</strong> {(pkg.giaGoiTapGoc || pkg.soTienThanhToan || 0).toLocaleString('vi-VN')}₫</p>
                                                                );
                                                            })()}

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
                                {isLoading ? (
                                    <div className="loading">Đang tải thống kê...</div>
                                ) : packageStats ? (
                                    <>
                                        {/* 1. Thống kê tổng quan */}
                                        <div className="stats-overview">
                                            <h3>📊 Thống kê tổng quan</h3>
                                            <div className="overview-grid">
                                                <div className="overview-card">
                                                    {/* <div className="overview-icon">📋</div> */}
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        viewBox="0 0 6.827 6.827"
                                                        width="54"
                                                        height="54"
                                                        style={{
                                                            shapeRendering: "geometricPrecision",
                                                            textRendering: "geometricPrecision",
                                                            fillRule: "evenodd",
                                                            clipRule: "evenodd",
                                                        }}
                                                    >
                                                        <g id="Layer_1">
                                                            <g>
                                                                <path fill="#64b5f6" d="M2.653 4.96V3.547h-.651V4.96z" />
                                                                <path fill="#64b5f6" d="M3.133 4.96V2.623h.651V4.96z" />
                                                                <path fill="#64b5f6" d="M4.916 4.96V1.957h-.651V4.96z" />
                                                            </g>
                                                            <path
                                                                fill="#64b5f6"
                                                                fillRule="nonzero"
                                                                d="M2.013 1.162h.133l.068.22.063-.22h.125l-.13.352a.21.21 0 0 1-.046.082c-.022.02-.056.03-.1.03a.727.727 0 0 1-.085-.008l-.01-.088a.199.199 0 0 0 .06.009.06.06 0 0 0 .037-.01.078.078 0 0 0 .023-.037l-.138-.33z"
                                                            />
                                                            <path
                                                                fill="#424242"
                                                                fillRule="nonzero"
                                                                d="M1.496 1.4v3.64h4.303v.266H1.23V1.4z"
                                                            />
                                                            <path fill="#424242" d="M1.871 1.654H.853l.51-.51z" />
                                                            <path
                                                                fill="#64b5f6"
                                                                fillRule="nonzero"
                                                                d="M5.408 4.235h.15l.053.092.06-.092h.14l-.112.157.12.173h-.147l-.061-.107-.072.107h-.137l.12-.173z"
                                                            />
                                                            <path fill="#424242" d="M5.464 5.682V4.664l.51.509z" />
                                                        </g>
                                                    </svg>

                                                    <div className="overview-content">
                                                        <h4>Tổng số đăng ký</h4>
                                                        <span className="overview-number">{packageStats.tongQuan.tongSoDangKy}</span>
                                                    </div>
                                                </div>
                                                <div className="overview-card">
                                                    {/* <div className="overview-icon">✅</div> */}
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        width="54"
                                                        height="54"
                                                        viewBox="0 0 122.88 116.87"
                                                        style={{ marginLeft: "6px" }}
                                                    >
                                                        <polygon
                                                            fill="#10a64a"
                                                            fillRule="evenodd"
                                                            points="61.37 8.24 80.43 0 90.88 17.79 111.15 22.32 109.15 42.85 122.88 58.43 109.2 73.87 111.15 94.55 91 99 80.43 116.87 61.51 108.62 42.45 116.87 32 99.08 11.73 94.55 13.73 74.01 0 58.43 13.68 42.99 11.73 22.32 31.88 17.87 42.45 0 61.37 8.24"
                                                        />
                                                        <path
                                                            fill="#ffffff"
                                                            d="M37.92,65c-6.07-6.53,3.25-16.26,10-10.1,2.38,2.17,5.84,5.34,8.24,7.49L74.66,39.66C81.1,33,91.27,42.78,84.91,49.48L61.67,77.2a7.13,7.13,0,0,1-9.9.44C47.83,73.89,42.05,68.5,37.92,65Z"
                                                        />
                                                    </svg>
                                                    <div className="overview-content">
                                                        <h4>Đã thanh toán</h4>
                                                        <span className="overview-number success">{packageStats.tongQuan.tongSoHoiVienDaThanhToan}</span>
                                                    </div>
                                                </div>
                                                <div className="overview-card">
                                                    {/* <div className="overview-icon">⏳</div> */}
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        viewBox="0 0 48 48"
                                                        width="44"
                                                        height="44"
                                                    >
                                                        <g id="Money_and_Hourglass" data-name="Money and Hourglass">
                                                            <path fill="#7c7d7d" d="M35 1v2a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V1z" />
                                                            <path fill="#919191" d="M35 1v2H10a2 2 0 0 1-2-2z" />
                                                            <path fill="#7c7d7d" d="M35 45v2H5v-2a2 2 0 0 1 2-2h26a2 2 0 0 1 2 2z" />
                                                            <path fill="#919191" d="M35 45H10a2 2 0 0 1-2-2c0-.1-1.26 0 25 0a2 2 0 0 1 2 2z" />
                                                            <path fill="#dad7e5" d="M32 43H8l.46-7A15 15 0 0 1 16 24a15 15 0 0 1-7.54-12L8 5h24l-.46 7A15 15 0 0 1 24 24a15 15 0 0 1 7.54 12c.4 6 .3 4.48.46 7z" />
                                                            <path fill="#edebf2" d="m31.54 36 .33 5H14.34a3 3 0 0 1-3-3.2l.12-1.8A15 15 0 0 1 19 24a15 15 0 0 1-7.54-12L11 5h21l-.46 7A15 15 0 0 1 24 24a15 15 0 0 1 7.54 12z" />
                                                            <path fill="#ffcc66" d="M27.54 43H12.46a11 11 0 0 1 4.29-8c1.54-1.23 3.16-2 4.74-1.13 3.89 2.19 5.83 5.43 6.05 9.13z" />
                                                            <path fill="#ffde76" d="M27.23 41H20a3 3 0 0 1-2.39-4.82 11.54 11.54 0 0 1 2.84-2.68c1.86.25 5.66 3.15 6.78 7.5z" />
                                                            <path fill="#ffcc66" d="M26.94 13.94a10.94 10.94 0 0 1-4.38 5.56c-1.32.88-2.57 1.48-4 .64A11.11 11.11 0 0 1 12.78 13c2 .18 2.15 1 4.55 1 2.67 0 2.67-1 5.34-1 2.25 0 2.6.72 4.27.94z" />
                                                            <path fill="#ffde76" d="M26.94 13.94a10.94 10.94 0 0 1-4.38 5.56c-1.37-.19-4.56-2.25-6.08-5.5 3 .36 3.39-1 6.19-1 2.25 0 2.6.72 4.27.94zM19.29 28.29a1 1 0 0 1 1.42 1.42 1 1 0 0 1-1.42-1.42zM19.08 24.62a1 1 0 0 1 1.84.76 1 1 0 0 1-1.84-.76z" />
                                                            <path fill="#ffcc66" d="M43 38a9 9 0 1 1-14.28-7.28A9 9 0 0 1 43 38z" />
                                                            <path fill="#ffde76" d="M41.67 42.69c-8 4.86-17.26-4.33-12.36-12.36 8.03-4.92 17.26 4.36 12.36 12.36z" />
                                                            <path fill="#f8834b" d="M34 37a1 1 0 1 1 1-1 1 1 0 0 0 1 1c1.66 0 1.21-3-1-3.82a1 1 0 1 0-2 0A3 3 0 0 0 34 39a1 1 0 1 1-1 1 1 1 0 0 0-1-1c-1.66 0-1.21 3 1 3.82a1 1 0 1 0 2 0A3 3 0 0 0 34 37z" />
                                                        </g>
                                                    </svg>

                                                    <div className="overview-content">
                                                        <h4>Chưa thanh toán</h4>
                                                        <span className="overview-number warning">{packageStats.tongQuan.tongSoHoiVienChuaThanhToan}</span>
                                                    </div>
                                                </div>
                                                <div className="overview-card">
                                                    {/* <div className="overview-icon">🟢</div> */}
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        viewBox="0 0 36 36"
                                                        width="34"
                                                        height="34"
                                                        aria-hidden="true"
                                                        role="img"
                                                        preserveAspectRatio="xMidYMid meet"
                                                    >
                                                        <circle fill="#10b981" cx="18" cy="18" r="18" />
                                                    </svg>
                                                    <div className="overview-content">
                                                        <h4>Đang hoạt động</h4>
                                                        <span className="overview-number success">{packageStats.tongQuan.soDangKyDangHoatDong}</span>
                                                    </div>
                                                </div>
                                                <div className="overview-card">
                                                    {/* <div className="overview-icon">🔴</div> */}
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        viewBox="0 0 36 36"
                                                        width="34"
                                                        height="34"
                                                        aria-hidden="true"
                                                        role="img"
                                                        preserveAspectRatio="xMidYMid meet"
                                                    >
                                                        <circle fill="#ef4444" cx="18" cy="18" r="18" />
                                                    </svg>
                                                    <div className="overview-content">
                                                        <h4>Đã hết hạn</h4>
                                                        <span className="overview-number error">{packageStats.tongQuan.soDangKyHetHan}</span>
                                                    </div>
                                                </div>
                                                <div className="overview-card revenue-card">
                                                    {/* Icon doanh thu SVG */}
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        viewBox="0 0 48 48"
                                                        width="50"
                                                        height="50"
                                                        style={{ marginBottom: '8px', display: 'block' }}
                                                    >
                                                        <defs>
                                                            <style>{`.cls-1{fill:#a87e6b}.cls-2{fill:#be927c}.cls-3{fill:#ffde76}.cls-4{fill:#fc6}`}</style>
                                                        </defs>
                                                        <g id="Budget">
                                                            <path className="cls-1" d="M37 38c0 7.82-9.19 9-17 9-9.39 0-17-1.82-17-9 0-5.67 4.74-17.33 11.35-22h11.3C32.26 20.67 37 32.33 37 38z" />
                                                            <path className="cls-2" d="M37 38a7 7 0 0 1-2.69 5.82A36.64 36.64 0 0 1 24 45c-9.39 0-17-1.82-17-9 0-5 3.66-14.58 9-20h9.63C32.26 20.67 37 32.33 37 38z" />
                                                            <path className="cls-1" d="M28.78 5.94C26 10.38 27.11 8.63 25 12H15l-3.8-6.06a3 3 0 0 1 2.39-4.53C15 1.32 15 2 16.49 2c1.75 0 1.75-1 3.5-1s1.76 1 3.51 1a3 3 0 0 0 1.36-.29 3 3 0 0 1 3.92 4.23z" />
                                                            <path className="cls-2" d="M28.78 5.94 26.87 9c-11.25 0-9.56.92-12.67-4.06a2.88 2.88 0 0 1 .31-3.45c.66.12.82.51 2 .51 1.75 0 1.75-1 3.5-1s1.76 1 3.51 1a2.92 2.92 0 0 0 1.39-.31 3 3 0 0 1 3.87 4.25z" />
                                                            <path className="cls-3" d="M35 21c-.3 0-.38-.07-1.27-.52-2.55-1.27-1.6-3.48-3.73-3.86l-2.55-.51a1 1 0 0 1 .4-2c2.53.51 4.79.62 5.68 3.28.33 1 1.06 1.25 1.92 1.68A1 1 0 0 1 35 21zM35 14a5.49 5.49 0 0 1-3.49-.78 2.69 2.69 0 0 0-3 0l-.46.3a1 1 0 0 1-1.1-1.66l.45-.3a4.66 4.66 0 0 1 5.23 0A3.77 3.77 0 0 0 35 12a1 1 0 0 1 0 2z" />
                                                            <path className="cls-4" d="M28 14a2 2 0 0 1-2 2H14a2 2 0 0 1 0-4h12a2 2 0 0 1 2 2z" />
                                                            <path className="cls-3" d="M28 14H17a2 2 0 0 1-2-2h11a2 2 0 0 1 2 2zM20 30a2 2 0 1 1 2-2 1 1 0 0 0 1 1c1.89 0 1.06-4.06-2-4.86V23a1 1 0 0 0-2 0v1.14A4 4 0 0 0 20 32a2 2 0 1 1-2 2 1 1 0 0 0-1-1c-1.89 0-1.06 4.06 2 4.86V39a1 1 0 0 0 2 0v-1.14A4 4 0 0 0 20 30z" />
                                                            <path className="cls-4" d="M45 38a9 9 0 1 1-14.28-7.28A9 9 0 0 1 45 38z" />
                                                            <path className="cls-3" d="M43.67 42.69c-8 4.86-17.26-4.33-12.36-12.36 8.03-4.92 17.26 4.36 12.36 12.36z" />
                                                            <path d="M36 37a1 1 0 1 1 1-1 1 1 0 0 0 1 1c1.66 0 1.21-3-1-3.82a1 1 0 1 0-2 0A3 3 0 0 0 36 39a1 1 0 1 1-1 1 1 1 0 0 0-1-1c-1.66 0-1.21 3 1 3.82a1 1 0 1 0 2 0A3 3 0 0 0 36 37z" style={{ fill: "#f8834b" }} />
                                                        </g>
                                                    </svg>

                                                    <div className="overview-content">
                                                        <h4>Tổng doanh thu</h4>
                                                        <span className="overview-number primary">{packageStats.tongQuan.tongDoanhThu.toLocaleString('vi-VN')}₫</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 2. Thống kê theo gói tập */}
                                        <div className="stats-by-package">
                                            <h3>📦 Thống kê theo gói tập</h3>

                                            {/* Biểu đồ cột cho số lượng đăng ký */}
                                            <div className="chart-section">
                                                <h4>📊 Số lượng đăng ký theo gói tập</h4>
                                                <div className="chart-container">
                                                    {(() => {
                                                        const chartData = getPackageChartData();
                                                        if (!chartData?.registrationChart) {
                                                            return (
                                                                <div style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    height: '100%',
                                                                    color: '#666',
                                                                    fontSize: '16px'
                                                                }}>
                                                                    Không có dữ liệu để hiển thị biểu đồ
                                                                </div>
                                                            );
                                                        }
                                                        return (
                                                            <Bar
                                                                key={`registration-chart-${chartKey}`}
                                                                data={chartData.registrationChart}
                                                                options={{
                                                                    responsive: true,
                                                                    maintainAspectRatio: false,
                                                                    plugins: {
                                                                        title: {
                                                                            display: true,
                                                                            text: 'Số lượng đăng ký từng gói tập',
                                                                            color: chartData.chartOptions.plugins.legend.labels.color
                                                                        },
                                                                        legend: {
                                                                            display: false
                                                                        }
                                                                    },
                                                                    scales: {
                                                                        y: {
                                                                            beginAtZero: true,
                                                                            ticks: {
                                                                                color: chartData.chartOptions.plugins.legend.labels.color
                                                                            }
                                                                        },
                                                                        x: {
                                                                            ticks: {
                                                                                color: chartData.chartOptions.plugins.legend.labels.color
                                                                            }
                                                                        }
                                                                    }
                                                                }}
                                                            />
                                                        );
                                                    })()}
                                                </div>
                                            </div>

                                            {/* Biểu đồ cột cho doanh thu */}
                                            <div className="chart-section">
                                                <h4>💰 Doanh thu theo gói tập</h4>
                                                <div className="chart-container">
                                                    {(() => {
                                                        const chartData = getPackageChartData();
                                                        return chartData?.revenueChart && (
                                                            <Bar
                                                                key={`revenue-chart-${chartKey}`}
                                                                data={chartData.revenueChart}
                                                                options={{
                                                                    responsive: true,
                                                                    maintainAspectRatio: false,
                                                                    plugins: {
                                                                        title: {
                                                                            display: true,
                                                                            text: 'Doanh thu từng gói tập',
                                                                            color: chartData.chartOptions.plugins.legend.labels.color
                                                                        },
                                                                        legend: {
                                                                            display: false
                                                                        }
                                                                    },
                                                                    scales: {
                                                                        y: {
                                                                            beginAtZero: true,
                                                                            ticks: {
                                                                                color: chartData.chartOptions.plugins.legend.labels.color,
                                                                                callback: function (value) {
                                                                                    return value.toLocaleString('vi-VN') + '₫';
                                                                                }
                                                                            }
                                                                        },
                                                                        x: {
                                                                            ticks: {
                                                                                color: chartData.chartOptions.plugins.legend.labels.color
                                                                            }
                                                                        }
                                                                    }
                                                                }}
                                                            />
                                                        );
                                                    })()}
                                                </div>
                                            </div>

                                            {/* Biểu đồ tròn cho tỷ lệ phần trăm */}
                                            <div className="chart-section">
                                                <h4>🥧 Tỷ lệ phần trăm đăng ký</h4>
                                                <div className="chart-container pie-chart">
                                                    {(() => {
                                                        const chartData = getPackageChartData();
                                                        return chartData?.pieChart && (
                                                            <Doughnut
                                                                key={`pie-chart-${chartKey}`}
                                                                data={chartData.pieChart}
                                                                options={{
                                                                    responsive: true,
                                                                    maintainAspectRatio: false,
                                                                    plugins: {
                                                                        title: {
                                                                            display: true,
                                                                            text: 'Tỷ lệ % đăng ký theo gói tập',
                                                                            color: chartData.chartOptions.plugins.legend.labels.color
                                                                        },
                                                                        legend: {
                                                                            position: 'bottom',
                                                                            labels: {
                                                                                color: chartData.chartOptions.plugins.legend.labels.color,
                                                                                font: {
                                                                                    size: 12,
                                                                                    weight: 'bold'
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                }}
                                                            />
                                                        );
                                                    })()}
                                                </div>
                                            </div>

                                            {/* Bảng chi tiết */}
                                            <div className="package-stats-grid">
                                                {packageStats.theoGoiTap.map((pkg, index) => (
                                                    <div key={pkg._id.maGoiTap} className="package-stat-card">
                                                        <div className="package-stat-header">
                                                            <h4>{pkg._id.tenGoiTap}</h4>
                                                            <span className="package-stat-rate">{pkg.tyLe}%</span>
                                                        </div>
                                                        <div className="package-stat-details">
                                                            <div className="package-stat-item">
                                                                <span className="package-stat-label">Số đăng ký:</span>
                                                                <span className="package-stat-value">{pkg.soLuongDangKy}</span>
                                                            </div>
                                                            <div className="package-stat-item">
                                                                <span className="package-stat-label">Doanh thu:</span>
                                                                <span className="package-stat-value">{pkg.doanhThu.toLocaleString('vi-VN')}₫</span>
                                                            </div>
                                                            <div className="package-stat-item">
                                                                <span className="package-stat-label">Giá gói:</span>
                                                                <span className="package-stat-value">{pkg._id.donGia.toLocaleString('vi-VN')}₫</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* 3. Thống kê theo trạng thái */}
                                        <div className="stats-by-status">
                                            <h3>🔄 Thống kê theo trạng thái</h3>

                                            {/* Biểu đồ tròn cho trạng thái */}
                                            <div className="chart-section">
                                                <h4>📊 Phân bố trạng thái đăng ký</h4>
                                                <div className="chart-container pie-chart">
                                                    {getStatusChartData() && (
                                                        <Doughnut
                                                            key={`status-chart-${chartKey}`}
                                                            data={getStatusChartData()!}
                                                            options={{
                                                                responsive: true,
                                                                maintainAspectRatio: false,
                                                                plugins: {
                                                                    title: {
                                                                        display: true,
                                                                        text: 'Phân bố trạng thái đăng ký gói tập',
                                                                        color: getStatusChartData()!.chartOptions.plugins.legend.labels.color
                                                                    },
                                                                    legend: {
                                                                        position: 'bottom',
                                                                        labels: {
                                                                            color: getStatusChartData()!.chartOptions.plugins.legend.labels.color,
                                                                            font: {
                                                                                size: 12,
                                                                                weight: 'bold'
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                            }}
                                                        />
                                                    )}
                                                </div>
                                            </div>

                                            {/* Bảng chi tiết */}
                                            <div className="status-stats-grid">
                                                {packageStats.theoTrangThai.map((status, index) => (
                                                    <div key={status._id} className="status-stat-card">
                                                        <div className="status-stat-header">
                                                            <h4>{status._id}</h4>
                                                            <span className="status-stat-rate">{status.tyLe}%</span>
                                                        </div>
                                                        <div className="status-stat-details">
                                                            <div className="status-stat-item">
                                                                <span className="status-stat-label">Số lượng:</span>
                                                                <span className="status-stat-value">{status.soLuong}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* 4. Thống kê theo thời gian */}
                                        <div className="stats-by-time">
                                            <h3>📅 Thống kê theo thời gian (12 tháng gần nhất)</h3>

                                            {/* Biểu đồ đường cho xu hướng */}
                                            <div className="chart-section">
                                                <h4>📈 Xu hướng đăng ký và doanh thu theo thời gian</h4>
                                                <div className="chart-container">
                                                    {getTimeChartData() && (
                                                        <Line
                                                            key={`time-chart-${chartKey}`}
                                                            data={getTimeChartData()!}
                                                            options={{
                                                                responsive: true,
                                                                maintainAspectRatio: false,
                                                                layout: {
                                                                    padding: {
                                                                        left: 20,
                                                                        right: 20,
                                                                        top: 10,
                                                                        bottom: 10
                                                                    }
                                                                },
                                                                plugins: {
                                                                    title: {
                                                                        display: true,
                                                                        text: 'Xu hướng đăng ký và doanh thu theo tháng',
                                                                        color: getTimeChartData()!.chartOptions.plugins.legend.labels.color
                                                                    },
                                                                    legend: {
                                                                        labels: {
                                                                            color: getTimeChartData()!.chartOptions.plugins.legend.labels.color,
                                                                            font: {
                                                                                size: 12,
                                                                                weight: 'bold'
                                                                            }
                                                                        }
                                                                    }
                                                                },
                                                                scales: {
                                                                    x: {
                                                                        display: true,
                                                                        grid: {
                                                                            display: false
                                                                        },
                                                                        ticks: {
                                                                            color: getTimeChartData()!.chartOptions.plugins.legend.labels.color,
                                                                            padding: 20, // Tạo khoảng cách giữa nhãn và trục
                                                                            maxRotation: 0, // Không xoay nhãn
                                                                            minRotation: 0,
                                                                            font: {
                                                                                size: 12
                                                                            }
                                                                        }
                                                                    },
                                                                    y: {
                                                                        type: 'linear',
                                                                        display: true,
                                                                        position: 'left',
                                                                        beginAtZero: true,
                                                                        ticks: {
                                                                            color: getTimeChartData()!.chartOptions.plugins.legend.labels.color,
                                                                            padding: 15, // Tạo khoảng cách cho trục Y
                                                                            font: {
                                                                                size: 12
                                                                            }
                                                                        }
                                                                    },
                                                                    y1: {
                                                                        type: 'linear',
                                                                        display: true,
                                                                        position: 'right',
                                                                        beginAtZero: true,
                                                                        ticks: {
                                                                            color: getTimeChartData()!.chartOptions.plugins.legend.labels.color,
                                                                            padding: 15, // Tạo khoảng cách cho trục Y bên phải
                                                                            callback: function (value) {
                                                                                return value.toLocaleString('vi-VN') + '₫';
                                                                            },
                                                                            font: {
                                                                                size: 12
                                                                            }
                                                                        },
                                                                        grid: {
                                                                            drawOnChartArea: false
                                                                        },
                                                                    }
                                                                }
                                                            }}
                                                        />
                                                    )}
                                                </div>
                                            </div>

                                            {/* Bảng chi tiết */}
                                            <div className="time-stats-table">
                                                <table className="table">
                                                    <thead>
                                                        <tr>
                                                            <th>Tháng/Năm</th>
                                                            <th>Số đăng ký mới</th>
                                                            <th>Doanh thu</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {packageStats.theoThang.map((month, index) => (
                                                            <tr key={`${month._id.nam}-${month._id.thang}`}>
                                                                <td>{month._id.thang}/{month._id.nam}</td>
                                                                <td>{month.soDangKyMoi}</td>
                                                                <td>{month.doanhThu.toLocaleString('vi-VN')}₫</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="no-data">
                                        <p>Không có dữ liệu thống kê</p>
                                    </div>
                                )}
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
                                            validation: {
                                                required: true,
                                                message: 'Vui lòng chọn gói tập. Nếu hội viên đã có gói đang hoạt động, chỉ có thể nâng cấp.'
                                            }
                                        },
                                        {
                                            label: 'Ngày bắt đầu',
                                            name: 'ngayBatDau',
                                            type: 'date',
                                            validation: {
                                                required: true,
                                                minDate: new Date().toISOString().split('T')[0],
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
