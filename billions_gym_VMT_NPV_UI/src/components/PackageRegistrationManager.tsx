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
    trangThai: 'DANG_HOAT_DONG' | 'TAM_DUNG' | 'HET_HAN' | 'DA_HUY' | 'DANG_SU_DUNG' | 'CHO_CHON_PT';
    trangThaiThanhToan: 'DA_THANH_TOAN' | 'CHUA_THANH_TOAN' | 'HOAN_TIEN';
    soTienThanhToan: number;
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
        ngayBatDau: new Date().toISOString().split('T')[0],
        soTienThanhToan: 0,
        trangThaiThanhToan: 'CHUA_THANH_TOAN' as const,
        ghiChu: ''
    });

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

            const registrationData = {
                ...formData,
                soTienThanhToan: formData.soTienThanhToan || selectedPackage.donGia,
                ngayKetThuc: calculateEndDate(formData.ngayBatDau, selectedPackage.thoiHan, selectedPackage.donViThoiHan)
            };

            await api.post('/api/dang-ky-goi-tap', formData);
            notifications.generic.success('Đăng ký gói tập thành công!');
            
            setShowNewRegistration(false);
            setNewRegistration({
                maHoiVien: '',
                maGoiTap: '',
                ngayBatDau: new Date().toISOString().split('T')[0],
                soTienThanhToan: 0,
                trangThaiThanhToan: 'CHUA_THANH_TOAN',
                ghiChu: ''
            });
            
            fetchInitialData();
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
                                                <td>{reg.maGoiTap.tenGoiTap}</td>
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
                                                <div key={pkg._id} className={`package-timeline-item ${(pkg.trangThaiGoiTap || pkg.trangThai || 'unknown').toLowerCase()}`}>
                                                    <div className="timeline-marker">
                                                        <span className="priority-number">#{pkg.thuTuUuTien || pkg.thuTu}</span>
                                                    </div>
                                                    <div className="timeline-content">
                                                        <div className="package-header">
                                                            <h4>{pkg.maGoiTap?.tenGoiTap}</h4>
                                                            {getStatusBadge(pkg.trangThaiGoiTap, pkg.trangThaiDangKy, pkg.trangThai)}
                                                        </div>
                                                        <div className="package-details">
                                                            <p><strong>Thời gian:</strong> {pkg.ngayBatDau ? new Date(pkg.ngayBatDau).toLocaleDateString('vi-VN') : 'N/A'} - {new Date(pkg.ngayKetThuc).toLocaleDateString('vi-VN')}</p>
                                                            <p><strong>Số tiền:</strong> {(pkg.soTienThanhToan || 0).toLocaleString('vi-VN')}₫</p>
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
                    <div className="modal-overlay" onClick={() => setShowNewRegistration(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>Đăng ký gói tập mới</h3>
                                <button className="close-btn" onClick={() => setShowNewRegistration(false)}>×</button>
                            </div>
                            <div className="modal-body">
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
                                            options: packages.map(pkg => ({ value: pkg._id, label: `${pkg.tenGoiTap} - ${pkg.donGia.toLocaleString('vi-VN')}₫` })),
                                        },
                                        {
                                            label: 'Ngày bắt đầu',
                                            name: 'ngayBatDau',
                                            type: 'date',
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
                                    initialData={undefined}
                                    onClose={() => setShowNewRegistration(false)}
                                    onSave={(formData) => handleCreateRegistration(formData)}
                                />
                            </div>
                            <div className="modal-footer">
                                <Button variant="ghost" onClick={() => setShowNewRegistration(false)}>
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
