import React, { useState, useEffect } from 'react';
import BaiTapForm from './BaiTapForm';
import { api } from '../services/api';
import './BaiTapManager.css';

// Import the form data interface from BaiTapForm
interface BaiTapFormData {
    tenBaiTap: string;
    moTa: string;
    hinhAnh: File | null;
    nhomCo: string;
    mucDoKho: string;
    thietBiSuDung: string;
    soHiepvaSoLanLap: number;
    mucTieuBaiTap: string;
    hinhAnhMinhHoa: File | null;
    videoHuongDan: string;
}

interface BaiTap {
    _id?: string;
    tenBaiTap: string;
    moTa: string;
    hinhAnh: string;
    nhomCo: string;
    mucDoKho: string;
    thietBiSuDung: string;
    soHiepvaSoLanLap: number;
    mucTieuBaiTap: string;
    hinhAnhMinhHoa: string;
    videoHuongDan: string;
    createdAt?: Date;
    updatedAt?: Date;
}

interface BaiTapManagerProps {
    onClose?: () => void;
}

const BaiTapManager: React.FC<BaiTapManagerProps> = ({ onClose }) => {
    const [baiTaps, setBaiTaps] = useState<BaiTap[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingBaiTap, setEditingBaiTap] = useState<BaiTap | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterNhomCo, setFilterNhomCo] = useState('');
    const [filterMucDoKho, setFilterMucDoKho] = useState('');

    // Fetch all BaiTap from backend
    useEffect(() => {
        fetchBaiTaps();
    }, []);

    const fetchBaiTaps = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/api/baitap');
            setBaiTaps(response || []);
        } catch (error) {
            console.error('Error fetching bai taps:', error);
            setBaiTaps([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateBaiTap = async (formData: any) => {
        setIsLoading(true);
        try {
            // Create FormData for file uploads
            const submitData = new FormData();
            
            // Add all text fields
            Object.keys(formData).forEach(key => {
                if (key !== 'hinhAnh' && key !== 'hinhAnhMinhHoa') {
                    submitData.append(key, formData[key]);
                }
            });

            // Add files if present
            if (formData.hinhAnh) {
                submitData.append('hinhAnh', formData.hinhAnh);
            }
            if (formData.hinhAnhMinhHoa) {
                submitData.append('hinhAnhMinhHoa', formData.hinhAnhMinhHoa);
            }

            // Use fetch directly for multipart/form-data
            const BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:4000';
            const response = await fetch(`${BASE_URL}/api/baitap`, {
                method: 'POST',
                body: submitData,
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            await fetchBaiTaps();
            setShowForm(false);
            alert('Tạo bài tập thành công!');
        } catch (error) {
            console.error('Error creating bai tap:', error);
            alert('Có lỗi xảy ra khi tạo bài tập!');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateBaiTap = async (formData: any) => {
        if (!editingBaiTap?._id) return;

        setIsLoading(true);
        try {
            const submitData = new FormData();
            
            Object.keys(formData).forEach(key => {
                if (key !== 'hinhAnh' && key !== 'hinhAnhMinhHoa') {
                    submitData.append(key, formData[key]);
                }
            });

            if (formData.hinhAnh) {
                submitData.append('hinhAnh', formData.hinhAnh);
            }
            if (formData.hinhAnhMinhHoa) {
                submitData.append('hinhAnhMinhHoa', formData.hinhAnhMinhHoa);
            }

            // Use fetch directly for multipart/form-data
            const BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:4000';
            const response = await fetch(`${BASE_URL}/api/baitap/${editingBaiTap._id}`, {
                method: 'PUT',
                body: submitData,
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            await fetchBaiTaps();
            setShowForm(false);
            setEditingBaiTap(null);
            alert('Cập nhật bài tập thành công!');
        } catch (error) {
            console.error('Error updating bai tap:', error);
            alert('Có lỗi xảy ra khi cập nhật bài tập!');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteBaiTap = async (id: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa bài tập này?')) return;

        setIsLoading(true);
        try {
            await api.delete(`/api/baitap/${id}`);
            await fetchBaiTaps();
            alert('Xóa bài tập thành công!');
        } catch (error) {
            console.error('Error deleting bai tap:', error);
            alert('Có lỗi xảy ra khi xóa bài tập!');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFormSubmit = (formData: any) => {
        if (editingBaiTap) {
            handleUpdateBaiTap(formData);
        } else {
            handleCreateBaiTap(formData);
        }
    };

    const handleFormCancel = () => {
        setShowForm(false);
        setEditingBaiTap(null);
    };

    const convertBaiTapToFormData = (baiTap: BaiTap): Partial<BaiTapFormData> => {
        return {
            tenBaiTap: baiTap.tenBaiTap,
            moTa: baiTap.moTa,
            nhomCo: baiTap.nhomCo,
            mucDoKho: baiTap.mucDoKho,
            thietBiSuDung: baiTap.thietBiSuDung,
            soHiepvaSoLanLap: baiTap.soHiepvaSoLanLap,
            mucTieuBaiTap: baiTap.mucTieuBaiTap,
            videoHuongDan: baiTap.videoHuongDan,
            // Note: hinhAnh and hinhAnhMinhHoa are strings in BaiTap but Files in form
            // They will be handled separately in the form component
        };
    };

    const handleEdit = (baiTap: BaiTap) => {
        setEditingBaiTap(baiTap);
        setShowForm(true);
    };

    const handleCreate = () => {
        setEditingBaiTap(null);
        setShowForm(true);
    };

    // Filter bai taps based on search and filters
    const filteredBaiTaps = baiTaps.filter(baiTap => {
        const matchesSearch = baiTap.tenBaiTap.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             baiTap.moTa.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesNhomCo = !filterNhomCo || baiTap.nhomCo === filterNhomCo;
        const matchesMucDoKho = !filterMucDoKho || baiTap.mucDoKho === filterMucDoKho;
        
        return matchesSearch && matchesNhomCo && matchesMucDoKho;
    });

    const getNhomCoLabel = (nhomCo: string) => {
        const labels: { [key: string]: string } = {
            'CHEST': '💪 Ngực',
            'BACK': '🔙 Lưng',
            'SHOULDERS': '🤷 Vai',
            'BICEPS': '💪 Cơ Nhị Đầu',
            'TRICEPS': '🦾 Cơ Tam Đầu',
            'FOREARMS': '🤏 Cẳng Tay',
            'QUADS': '🦵 Cơ Tứ Đầu',
            'HAMSTRINGS': '🦵 Cơ Gân Kheo',
            'GLUTES': '🍑 Cơ Mông',
            'CALVES': '🦵 Cơ Bắp Chân',
            'ABS': '🏋️ Cơ Bụng',
            'CORE': '🎯 Cơ Lõi',
            'CARDIO': '❤️ Tim Mạch',
            'FULL_BODY': '🏃‍♂️ Toàn Thân'
        };
        return labels[nhomCo] || nhomCo;
    };

    const getMucDoKhoLabel = (mucDoKho: string) => {
        const labels: { [key: string]: { label: string; color: string } } = {
            'BEGINNER': { label: '🟢 Người Mới', color: '#10b981' },
            'INTERMEDIATE': { label: '🟡 Trung Bình', color: '#f59e0b' },
            'ADVANCED': { label: '🟠 Nâng Cao', color: '#f97316' },
            'EXPERT': { label: '🔴 Chuyên Gia', color: '#dc2626' }
        };
        return labels[mucDoKho] || { label: mucDoKho, color: '#6b7280' };
    };


    if (showForm) {
        return (
            <BaiTapForm
                initialData={editingBaiTap ? convertBaiTapToFormData(editingBaiTap) : undefined}
                onSubmit={handleFormSubmit}
                onCancel={handleFormCancel}
                isLoading={isLoading}
            />
        );
    }


    return (
        <div className="baitap-manager">
            <div className="manager-header">
                <div className="header-content">
                    <h1 className="manager-title">
                        <span className="title-icon">🏋️‍♂️</span>
                        Quản Lý Bài Tập
                    </h1>
                    <p className="manager-subtitle">
                        Tạo và quản lý thư viện bài tập cho phòng gym
                    </p>
                </div>
                <button className="btn-create" onClick={handleCreate} disabled={isLoading}>
                    <span className="btn-icon">➕</span>
                    Thêm Bài Tập Mới
                </button>
            </div>

            <div className="manager-filters">
                <div className="search-box">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        placeholder="Tìm kiếm bài tập..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                </div>
                
                <select
                    value={filterNhomCo}
                    onChange={(e) => setFilterNhomCo(e.target.value)}
                    className="filter-select"
                >
                    <option value="">Tất cả nhóm cơ</option>
                    <option value="CHEST">💪 Ngực</option>
                    <option value="BACK">🔙 Lưng</option>
                    <option value="SHOULDERS">🤷 Vai</option>
                    <option value="BICEPS">💪 Cơ Nhị Đầu</option>
                    <option value="TRICEPS">🦾 Cơ Tam Đầu</option>
                    <option value="LEGS">🦵 Chân</option>
                    <option value="CORE">🎯 Cơ Lõi</option>
                    <option value="CARDIO">❤️ Tim Mạch</option>
                </select>

                <select
                    value={filterMucDoKho}
                    onChange={(e) => setFilterMucDoKho(e.target.value)}
                    className="filter-select"
                >
                    <option value="">Tất cả mức độ</option>
                    <option value="BEGINNER">🟢 Người Mới</option>
                    <option value="INTERMEDIATE">🟡 Trung Bình</option>
                    <option value="ADVANCED">🟠 Nâng Cao</option>
                    <option value="EXPERT">🔴 Chuyên Gia</option>
                </select>
            </div>

            <div className="baitap-grid">
                {isLoading ? (
                    <div className="loading-state">
                        <div className="loading-spinner"></div>
                        <p>Đang tải dữ liệu...</p>
                    </div>
                ) : filteredBaiTaps.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">🏋️‍♂️</div>
                        <h3>Chưa có bài tập nào</h3>
                        <p>Hãy thêm bài tập đầu tiên cho thư viện của bạn</p>
                        <button className="btn-create-empty" onClick={handleCreate}>
                            Thêm Bài Tập Đầu Tiên
                        </button>
                    </div>
                ) : (
                    filteredBaiTaps.map((baiTap) => (
                        <div key={baiTap._id} className="baitap-card">
                            <div className="card-header">
                                {baiTap.hinhAnh && (
                                    <div className="card-image">
                                        <img src={baiTap.hinhAnh} alt={baiTap.tenBaiTap} />
                                    </div>
                                )}
                                <div className="card-badges">
                                    <span className="badge nhom-co">
                                        {getNhomCoLabel(baiTap.nhomCo)}
                                    </span>
                                    <span 
                                        className="badge muc-do-kho"
                                        style={{ 
                                            backgroundColor: getMucDoKhoLabel(baiTap.mucDoKho).color + '20',
                                            color: getMucDoKhoLabel(baiTap.mucDoKho).color,
                                            borderColor: getMucDoKhoLabel(baiTap.mucDoKho).color
                                        }}
                                    >
                                        {getMucDoKhoLabel(baiTap.mucDoKho).label}
                                    </span>
                                </div>
                            </div>

                            <div className="card-content">
                                <h3 className="card-title">{baiTap.tenBaiTap}</h3>
                                <p className="card-description">
                                    {baiTap.moTa.length > 100 
                                        ? baiTap.moTa.substring(0, 100) + '...' 
                                        : baiTap.moTa}
                                </p>
                                
                                <div className="card-details">
                                    {baiTap.thietBiSuDung && (
                                        <div className="detail-item">
                                            <span className="detail-label">Thiết bị:</span>
                                            <span className="detail-value">{baiTap.thietBiSuDung}</span>
                                        </div>
                                    )}
                                    {baiTap.soHiepvaSoLanLap > 0 && (
                                        <div className="detail-item">
                                            <span className="detail-label">Số lần:</span>
                                            <span className="detail-value">{baiTap.soHiepvaSoLanLap}</span>
                                        </div>
                                    )}
                                    {baiTap.mucTieuBaiTap && (
                                        <div className="detail-item">
                                            <span className="detail-label">Mục tiêu:</span>
                                            <span className="detail-value">{baiTap.mucTieuBaiTap}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="card-actions">
                                {baiTap.videoHuongDan && (
                                    <button 
                                        className="btn-action btn-video"
                                        onClick={() => window.open(baiTap.videoHuongDan, '_blank')}
                                    >
                                        <span className="btn-icon">🎥</span>
                                        Video
                                    </button>
                                )}
                                <button 
                                    className="btn-action btn-edit"
                                    onClick={() => handleEdit(baiTap)}
                                    disabled={isLoading}
                                >
                                    <span className="btn-icon">✏️</span>
                                    Sửa
                                </button>
                                <button 
                                    className="btn-action btn-delete"
                                    onClick={() => handleDeleteBaiTap(baiTap._id!)}
                                    disabled={isLoading}
                                >
                                    <span className="btn-icon">🗑️</span>
                                    Xóa
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default BaiTapManager;
