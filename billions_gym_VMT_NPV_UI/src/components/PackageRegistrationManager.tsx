import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import Button from './Button';
import Card from './Card';
import Loading from './Loading';
import { useCrudNotifications } from '../hooks/useNotification';

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
    };
    ngayDangKy: Date;
    ngayBatDau: Date;
    ngayKetThuc: Date;
    trangThai: 'DANG_HOAT_DONG' | 'TAM_DUNG' | 'HET_HAN' | 'DA_HUY';
    trangThaiThanhToan: 'DA_THANH_TOAN' | 'CHUA_THANH_TOAN' | 'HOAN_TIEN';
    soTienThanhToan: number;
    thuTuUuTien: number;
    soNgayConLai?: number;
    ngayTamDung?: Date;
    lyDoTamDung?: string;
    ptDuocChon?: {
        _id: string;
        hoTen: string;
    };
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

    const fetchInitialData = async () => {
        setIsLoading(true);
        try {
            const [regsRes, membersRes, packagesRes] = await Promise.all([
                api.get('/api/dangkygoitap'),
                api.get('/api/user/hoivien'),
                api.get('/api/goitap')
            ]);

            setRegistrations(regsRes || []);
            setMembers(membersRes || []);
            setPackages((packagesRes || []).filter((pkg: GoiTap) => pkg.kichHoat));
        } catch (error) {
            console.error('Error fetching data:', error);
            notifications.generic.error('Không thể tải dữ liệu');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchMemberPackages = async (memberId: string) => {
        if (!memberId) return;
        setIsLoading(true);
        try {
            const response = await api.get(`/api/dangkygoitap/member/${memberId}`);
            setMemberPackages(response || []);
        } catch (error) {
            console.error('Error fetching member packages:', error);
            notifications.generic.error('Không thể tải gói tập của hội viên');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchPackageMembers = async (packageId: string) => {
        if (!packageId) return;
        setIsLoading(true);
        try {
            const response = await api.get(`/api/dangkygoitap/package/${packageId}`);
            setPackageMembers(response || []);
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
            const response = await api.get('/api/dangkygoitap/stats');
            setPackageStats(response || []);
        } catch (error) {
            console.error('Error fetching package stats:', error);
            notifications.generic.error('Không thể tải thống kê gói tập');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateRegistration = async () => {
        try {
            if (!newRegistration.maHoiVien || !newRegistration.maGoiTap) {
                notifications.generic.error('Vui lòng chọn hội viên và gói tập');
                return;
            }

            const selectedPackage = packages.find(p => p._id === newRegistration.maGoiTap);
            if (!selectedPackage) {
                notifications.generic.error('Không tìm thấy gói tập');
                return;
            }

            const registrationData = {
                ...newRegistration,
                soTienThanhToan: newRegistration.soTienThanhToan || selectedPackage.donGia,
                ngayKetThuc: calculateEndDate(newRegistration.ngayBatDau, selectedPackage.thoiHan, selectedPackage.donViThoiHan)
            };

            await api.post('/api/dangkygoitap', registrationData);
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
            await api.put(`/api/dangkygoitap/${registrationId}/reactivate`);
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

    const getStatusBadge = (status: string) => {
        const statusMap = {
            'DANG_HOAT_DONG': { class: 'success', text: 'Đang hoạt động' },
            'TAM_DUNG': { class: 'warning', text: 'Tạm dừng' },
            'HET_HAN': { class: 'danger', text: 'Hết hạn' },
            'DA_HUY': { class: 'secondary', text: 'Đã hủy' }
        };
        const config = statusMap[status as keyof typeof statusMap] || { class: 'secondary', text: status };
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
                                                    {new Date(reg.ngayBatDau).toLocaleDateString('vi-VN')} - {' '}
                                                    {new Date(reg.ngayKetThuc).toLocaleDateString('vi-VN')}
                                                </td>
                                                <td>{getStatusBadge(reg.trangThai)}</td>
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
                                                <div key={pkg._id} className={`package-timeline-item ${pkg.trangThai.toLowerCase()}`}>
                                                    <div className="timeline-marker">
                                                        <span className="priority-number">#{pkg.thuTuUuTien}</span>
                                                    </div>
                                                    <div className="timeline-content">
                                                        <div className="package-header">
                                                            <h4>{pkg.maGoiTap.tenGoiTap}</h4>
                                                            {getStatusBadge(pkg.trangThai)}
                                                        </div>
                                                        <div className="package-details">
                                                            <p><strong>Thời gian:</strong> {new Date(pkg.ngayBatDau).toLocaleDateString('vi-VN')} - {new Date(pkg.ngayKetThuc).toLocaleDateString('vi-VN')}</p>
                                                            <p><strong>Số tiền:</strong> {pkg.soTienThanhToan.toLocaleString('vi-VN')}₫</p>
                                                            {pkg.trangThai === 'TAM_DUNG' && (
                                                                <>
                                                                    <p><strong>Ngày tạm dừng:</strong> {pkg.ngayTamDung ? new Date(pkg.ngayTamDung).toLocaleDateString('vi-VN') : 'N/A'}</p>
                                                                    <p><strong>Số ngày còn lại:</strong> {pkg.soNgayConLai || 0} ngày</p>
                                                                    <p><strong>Lý do:</strong> {pkg.lyDoTamDung || 'N/A'}</p>
                                                                </>
                                                            )}
                                                            {pkg.ptDuocChon && (
                                                                <p><strong>PT:</strong> {pkg.ptDuocChon.hoTen}</p>
                                                            )}
                                                        </div>
                                                        {pkg.trangThai === 'TAM_DUNG' && pkg.soNgayConLai && pkg.soNgayConLai > 0 && (
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
                                                                <strong>{member.maHoiVien.hoTen}</strong>
                                                                <small>{member.maHoiVien.sdt}</small>
                                                            </div>
                                                        </td>
                                                        <td>{new Date(member.ngayDangKy).toLocaleDateString('vi-VN')}</td>
                                                        <td>
                                                            {new Date(member.ngayBatDau).toLocaleDateString('vi-VN')} - {' '}
                                                            {new Date(member.ngayKetThuc).toLocaleDateString('vi-VN')}
                                                        </td>
                                                        <td>{getStatusBadge(member.trangThai)}</td>
                                                        <td>{getPaymentStatusBadge(member.trangThaiThanhToan)}</td>
                                                        <td>{member.ptDuocChon?.hoTen || 'Chưa chọn'}</td>
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
                                                <span className="stat-value primary">{stat.tongDoanhThu.toLocaleString('vi-VN')}₫</span>
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
                                <div className="form-group">
                                    <label>Hội viên</label>
                                    <select
                                        value={newRegistration.maHoiVien}
                                        onChange={(e) => setNewRegistration({...newRegistration, maHoiVien: e.target.value})}
                                    >
                                        <option value="">Chọn hội viên</option>
                                        {members.map(member => (
                                            <option key={member._id} value={member._id}>
                                                {member.hoTen} - {member.sdt}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Gói tập</label>
                                    <select
                                        value={newRegistration.maGoiTap}
                                        onChange={(e) => {
                                            const selectedPkg = packages.find(p => p._id === e.target.value);
                                            setNewRegistration({
                                                ...newRegistration, 
                                                maGoiTap: e.target.value,
                                                soTienThanhToan: selectedPkg?.donGia || 0
                                            });
                                        }}
                                    >
                                        <option value="">Chọn gói tập</option>
                                        {packages.map(pkg => (
                                            <option key={pkg._id} value={pkg._id}>
                                                {pkg.tenGoiTap} - {pkg.donGia.toLocaleString('vi-VN')}₫
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Ngày bắt đầu</label>
                                    <input
                                        type="date"
                                        value={newRegistration.ngayBatDau}
                                        onChange={(e) => setNewRegistration({...newRegistration, ngayBatDau: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Số tiền thanh toán</label>
                                    <input
                                        type="number"
                                        value={newRegistration.soTienThanhToan}
                                        onChange={(e) => setNewRegistration({...newRegistration, soTienThanhToan: parseInt(e.target.value)})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Trạng thái thanh toán</label>
                                    <select
                                        value={newRegistration.trangThaiThanhToan}
                                        onChange={(e) => setNewRegistration({...newRegistration, trangThaiThanhToan: e.target.value as any})}
                                    >
                                        <option value="CHUA_THANH_TOAN">Chưa thanh toán</option>
                                        <option value="DA_THANH_TOAN">Đã thanh toán</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Ghi chú</label>
                                    <textarea
                                        value={newRegistration.ghiChu}
                                        onChange={(e) => setNewRegistration({...newRegistration, ghiChu: e.target.value})}
                                        rows={3}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <Button variant="ghost" onClick={() => setShowNewRegistration(false)}>
                                    Hủy
                                </Button>
                                <Button variant="primary" onClick={handleCreateRegistration}>
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
