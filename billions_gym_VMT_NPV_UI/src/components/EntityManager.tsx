import React, { useState, useEffect } from 'react';
import DynamicForm from './DynamicForm';
import './EntityManager.css';

// Types based on backend models
interface LichTap {
    _id?: string;
    hoiVien: string;
    pt: string;
    ngayBatDau: string;
    ngayKetThuc: string;
    cacBuoiTap: string[];
}

interface BuoiTap {
    _id?: string;
    ngayTap: string;
    hoiVien: string;
    pt: string;
    cacBaiTap: BaiTapTrongBuoi[];
    trangThaiTap: 'DA_HOAN_THANH' | 'CHUA_HOAN_THANH';
    ghiChu?: string;
    thoiGianBatDau?: string;
    thoiGianKetThuc?: string;
}

interface BaiTapTrongBuoi {
    baiTap: string;
    soLanLap: number;
    soSet: number;
    trongLuong: number;
    thoiGianNghi: number;
    ghiChu?: string;
}

interface BaiTap {
    _id?: string;
    tenBaiTap: string;
    moTa?: string;
    hinhAnh?: string;
    videoHuongDan?: string;
    nhomCo?: string;
    hinhAnhMinhHoa?: string;
}

interface ChiSoCoThe {
    _id?: string;
    hoiVien: string;
    chieuCao?: number;
    canNang?: number;
    bmi?: number;
    nhipTim?: number;
    ngayDo: string;
}

interface DinhDuong {
    _id?: string;
    hoiVien: string;
    ngayGoiY: string;
    buaAn: string;
    luongCalo: number;
    loaiGoiY: 'DINH_DUONG_TONG_QUAT' | 'GIAM_CAN' | 'TANG_CAN' | 'TANG_CO_BAP' | 'GIAM_MO' | 'DUY_TRI';
    mucTieuDinhDuong: {
        mucTieuChinh: 'TANG_CAN' | 'GIAM_CAN' | 'DUY_TRI' | 'TANG_CO_BAP' | 'GIAM_MO';
        caloMucTieu: number;
        tiLeMacro: {
            protein: number;
            carb: number;
            fat: number;
        };
    };
}

interface ThanhToan {
    _id?: string;
    hoiVien: string;
    soTien: number;
    ngayThanhToan: string;
    noiDung?: string;
    phuongThuc: 'TIEN_MAT' | 'CHUYEN_KHOAN' | 'THE_TIN_DUNG';
    trangThaiThanhToan: 'DANG_XU_LY' | 'THANH_CONG' | 'THAT_BAI';
    maChiTietGoiTap?: string;
}

interface LichHenPT {
    _id?: string;
    hoiVien: string;
    pt: string;
    ngayHen: string;
    gioHen: string;
    trangThaiLichHen: 'CHO_XAC_NHAN' | 'DA_XAC_NHAN' | 'DA_HUY' | 'HOAN_THANH';
    ghiChu?: string;
}

interface ThongBao {
    _id?: string;
    tieuDe: string;
    hinhAnhBanner?: string;
    noiDung: string;
    thoiGianGui: string;
    trangThaiThongBao: 'DA_GUI' | 'CHUA_GUI';
}

interface Feedback {
    _id?: string;
    nguoiGui: string;
    noiDung: string;
    danhGia?: number;
    hinhAnh?: string[];
    ngayGui: string;
}

interface GoiYTuAI {
    _id?: string;
    hoiVien: string;
    ngayGoiY: string;
    noiDung: string;
    mucTieu: string;
    doKho: 'DE' | 'TRUNG_BINH' | 'KHO';
    thoiGianTap: number;
}

interface BaoCao {
    _id?: string;
    tenBaoCao: string;
    ngayTao: string;
    noiDung: string;
}

type EntityType = 'lichtap' | 'buoitap' | 'baitap' | 'chisocothe' | 'dinhduong' | 'thanhtoan' | 'lichhenpt' | 'thongbao' | 'feedback' | 'goiyai' | 'baocao';

const EntityManager: React.FC = () => {
    const [activeEntity, setActiveEntity] = useState<EntityType>('lichtap');
    const [modalVisible, setModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const entities = [
        { id: 'lichtap', name: 'Lịch Tập', icon: '📅' },
        { id: 'buoitap', name: 'Buổi Tập', icon: '🏋️' },
        { id: 'baitap', name: 'Bài Tập', icon: '💪' },
        { id: 'chisocothe', name: 'Chỉ Số Cơ Thể', icon: '📊' },
        { id: 'dinhduong', name: 'Dinh Dưỡng', icon: '🥗' },
        { id: 'thanhtoan', name: 'Thanh Toán', icon: '💳' },
        { id: 'lichhenpt', name: 'Lịch Hẹn PT', icon: '👨‍🏫' },
        { id: 'thongbao', name: 'Thông Báo', icon: '📢' },
        { id: 'feedback', name: 'Feedback', icon: '💬' },
        { id: 'goiyai', name: 'Gợi Ý AI', icon: '🤖' },
        { id: 'baocao', name: 'Báo Cáo', icon: '📋' }
    ] as const;

    useEffect(() => {
        loadData();
    }, [activeEntity]);

    const loadData = async () => {
        setLoading(true);
        try {
            // TODO: Replace with actual API calls
            // const response = await fetch(`/api/${activeEntity}`);
            // const result = await response.json();
            // setData(result);
            
            // Mock data for now
            setData([]);
        } catch (error) {
            console.error('Error loading data:', error);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (formData: any) => {
        try {
            // TODO: Implement actual API calls
            if (editingItem) {
                // Update existing item
                console.log('Update:', activeEntity, formData);
                // const response = await fetch(`/api/${activeEntity}/${editingItem._id}`, {
                //     method: 'PUT',
                //     headers: { 'Content-Type': 'application/json' },
                //     body: JSON.stringify(formData)
                // });
            } else {
                // Create new item
                console.log('Create:', activeEntity, formData);
                // const response = await fetch(`/api/${activeEntity}`, {
                //     method: 'POST',
                //     headers: { 'Content-Type': 'application/json' },
                //     body: JSON.stringify(formData)
                // });
            }
            
            setModalVisible(false);
            setEditingItem(null);
            await loadData(); // Refresh data
        } catch (error) {
            console.error('Submit error:', error);
        }
    };

    const handleEdit = (item: any) => {
        setEditingItem(item);
        setModalVisible(true);
    };

    const handleDelete = async (id: string) => {
        if (deleteConfirm === id) {
            try {
                // TODO: Implement actual API call
                console.log('Delete:', activeEntity, id);
                // await fetch(`/api/${activeEntity}/${id}`, { method: 'DELETE' });
                
                setDeleteConfirm(null);
                await loadData(); // Refresh data
            } catch (error) {
                console.error('Delete error:', error);
            }
        } else {
            setDeleteConfirm(id);
            // Auto-cancel confirmation after 3 seconds
            setTimeout(() => setDeleteConfirm(null), 3000);
        }
    };

    const handleAdd = () => {
        setEditingItem(null);
        setModalVisible(true);
    };

    const handleCancel = () => {
        setModalVisible(false);
        setEditingItem(null);
    };

    const renderActionButtons = (item: any) => (
        <div className="action-buttons">
            <button onClick={() => handleEdit(item)} className="btn-edit" title="Chỉnh sửa">
                ✏️
            </button>
            <button 
                onClick={() => handleDelete(item._id!)} 
                className={`btn-delete ${deleteConfirm === item._id ? 'confirm' : ''}`}
                title={deleteConfirm === item._id ? 'Nhấp lần nữa để xác nhận' : 'Xóa'}
            >
                {deleteConfirm === item._id ? '⚠️' : '🗑️'}
            </button>
        </div>
    );

    const renderTable = () => {
        switch (activeEntity) {
            case 'lichtap':
                return (
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Hội Viên</th>
                                    <th>PT</th>
                                    <th>Ngày Bắt Đầu</th>
                                    <th>Ngày Kết Thúc</th>
                                    <th>Số Buổi Tập</th>
                                    <th>Thao Tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((item: LichTap) => (
                                    <tr key={item._id}>
                                        <td>{item.hoiVien}</td>
                                        <td>{item.pt}</td>
                                        <td>{new Date(item.ngayBatDau).toLocaleDateString()}</td>
                                        <td>{new Date(item.ngayKetThuc).toLocaleDateString()}</td>
                                        <td>{item.cacBuoiTap.length}</td>
                                        <td>
                                            {renderActionButtons(item)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );

            case 'buoitap':
                return (
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Ngày Tập</th>
                                    <th>Hội Viên</th>
                                    <th>PT</th>
                                    <th>Trạng Thái</th>
                                    <th>Số Bài Tập</th>
                                    <th>Thao Tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((item: BuoiTap) => (
                                    <tr key={item._id}>
                                        <td>{new Date(item.ngayTap).toLocaleDateString()}</td>
                                        <td>{item.hoiVien}</td>
                                        <td>{item.pt}</td>
                                        <td>
                                            <span className={`status ${item.trangThaiTap}`}>
                                                {item.trangThaiTap === 'DA_HOAN_THANH' ? 'Hoàn thành' : 'Chưa hoàn thành'}
                                            </span>
                                        </td>
                                        <td>{item.cacBaiTap.length}</td>
                                        <td>
                                            {renderActionButtons(item)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );

            case 'baitap':
                return (
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Tên Bài Tập</th>
                                    <th>Nhóm Cơ</th>
                                    <th>Mô Tả</th>
                                    <th>Hình Ảnh</th>
                                    <th>Video</th>
                                    <th>Thao Tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((item: BaiTap) => (
                                    <tr key={item._id}>
                                        <td>{item.tenBaiTap}</td>
                                        <td>{item.nhomCo}</td>
                                        <td>{item.moTa?.substring(0, 50)}...</td>
                                        <td>
                                            {item.hinhAnh && <img src={item.hinhAnh} alt="" className="table-image" />}
                                        </td>
                                        <td>
                                            {item.videoHuongDan && <span>✅</span>}
                                        </td>
                                        <td>
                                            {renderActionButtons(item)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );

            case 'chisocothe':
                return (
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Hội Viên</th>
                                    <th>Chiều Cao</th>
                                    <th>Cân Nặng</th>
                                    <th>BMI</th>
                                    <th>Nhịp Tim</th>
                                    <th>Ngày Đo</th>
                                    <th>Thao Tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((item: ChiSoCoThe) => (
                                    <tr key={item._id}>
                                        <td>{item.hoiVien}</td>
                                        <td>{item.chieuCao ? `${item.chieuCao}cm` : '--'}</td>
                                        <td>{item.canNang ? `${item.canNang}kg` : '--'}</td>
                                        <td>{item.bmi ? item.bmi.toFixed(1) : '--'}</td>
                                        <td>{item.nhipTim ? `${item.nhipTim}bpm` : '--'}</td>
                                        <td>{new Date(item.ngayDo).toLocaleDateString()}</td>
                                        <td>{renderActionButtons(item)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );

            case 'dinhduong':
                return (
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Hội Viên</th>
                                    <th>Bữa Ăn</th>
                                    <th>Calo</th>
                                    <th>Loại Gợi Ý</th>
                                    <th>Mục Tiêu</th>
                                    <th>Ngày Gợi Ý</th>
                                    <th>Thao Tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((item: DinhDuong) => (
                                    <tr key={item._id}>
                                        <td>{item.hoiVien}</td>
                                        <td>{item.buaAn}</td>
                                        <td>{item.luongCalo}</td>
                                        <td>{item.loaiGoiY}</td>
                                        <td>{item.mucTieuDinhDuong?.mucTieuChinh || '--'}</td>
                                        <td>{new Date(item.ngayGoiY).toLocaleDateString()}</td>
                                        <td>{renderActionButtons(item)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );

            case 'thanhtoan':
                return (
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Hội Viên</th>
                                    <th>Số Tiền</th>
                                    <th>Phương Thức</th>
                                    <th>Trạng Thái</th>
                                    <th>Ngày TT</th>
                                    <th>Nội Dung</th>
                                    <th>Thao Tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((item: ThanhToan) => (
                                    <tr key={item._id}>
                                        <td>{item.hoiVien}</td>
                                        <td>{item.soTien.toLocaleString()}đ</td>
                                        <td>{item.phuongThuc}</td>
                                        <td>
                                            <span className={`status status-${item.trangThaiThanhToan.toLowerCase()}`}>
                                                {item.trangThaiThanhToan === 'THANH_CONG' ? 'Thành công' : 
                                                 item.trangThaiThanhToan === 'THAT_BAI' ? 'Thất bại' : 'Đang xử lý'}
                                            </span>
                                        </td>
                                        <td>{new Date(item.ngayThanhToan).toLocaleDateString()}</td>
                                        <td>{item.noiDung || '--'}</td>
                                        <td>{renderActionButtons(item)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );

            case 'lichhenpt':
                return (
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Hội Viên</th>
                                    <th>PT</th>
                                    <th>Ngày Hẹn</th>
                                    <th>Giờ Hẹn</th>
                                    <th>Trạng Thái</th>
                                    <th>Ghi Chú</th>
                                    <th>Thao Tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((item: LichHenPT) => (
                                    <tr key={item._id}>
                                        <td>{item.hoiVien}</td>
                                        <td>{item.pt}</td>
                                        <td>{new Date(item.ngayHen).toLocaleDateString()}</td>
                                        <td>{item.gioHen}</td>
                                        <td>
                                            <span className={`status status-${item.trangThaiLichHen.toLowerCase()}`}>
                                                {item.trangThaiLichHen === 'DA_XAC_NHAN' ? 'Đã xác nhận' :
                                                 item.trangThaiLichHen === 'CHO_XAC_NHAN' ? 'Chờ xác nhận' :
                                                 item.trangThaiLichHen === 'DA_HUY' ? 'Đã hủy' : 'Hoàn thành'}
                                            </span>
                                        </td>
                                        <td>{item.ghiChu || '--'}</td>
                                        <td>{renderActionButtons(item)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );

            case 'thongbao':
                return (
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Tiêu Đề</th>
                                    <th>Nội Dung</th>
                                    <th>Trạng Thái</th>
                                    <th>Thời Gian Gửi</th>
                                    <th>Banner</th>
                                    <th>Thao Tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((item: ThongBao) => (
                                    <tr key={item._id}>
                                        <td>{item.tieuDe}</td>
                                        <td className="content-cell">{item.noiDung.substring(0, 100)}...</td>
                                        <td>
                                            <span className={`status status-${item.trangThaiThongBao.toLowerCase()}`}>
                                                {item.trangThaiThongBao === 'DA_GUI' ? 'Đã gửi' : 'Chưa gửi'}
                                            </span>
                                        </td>
                                        <td>{new Date(item.thoiGianGui).toLocaleString()}</td>
                                        <td>
                                            {item.hinhAnhBanner && <img src={item.hinhAnhBanner} alt="" className="table-image" />}
                                        </td>
                                        <td>{renderActionButtons(item)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );

            case 'feedback':
                return (
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Người Gửi</th>
                                    <th>Nội Dung</th>
                                    <th>Đánh Giá</th>
                                    <th>Ngày Gửi</th>
                                    <th>Hình Ảnh</th>
                                    <th>Thao Tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((item: Feedback) => (
                                    <tr key={item._id}>
                                        <td>{item.nguoiGui}</td>
                                        <td className="content-cell">{item.noiDung.substring(0, 100)}...</td>
                                        <td>
                                            {item.danhGia ? (
                                                <div className="rating">
                                                    {'⭐'.repeat(item.danhGia)}
                                                </div>
                                            ) : '--'}
                                        </td>
                                        <td>{new Date(item.ngayGui).toLocaleDateString()}</td>
                                        <td>
                                            {item.hinhAnh && item.hinhAnh.length > 0 && (
                                                <span>{item.hinhAnh.length} ảnh</span>
                                            )}
                                        </td>
                                        <td>{renderActionButtons(item)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );

            case 'goiyai':
                return (
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Hội Viên</th>
                                    <th>Mục Tiêu</th>
                                    <th>Nội Dung</th>
                                    <th>Độ Khó</th>
                                    <th>Thời Gian Tập</th>
                                    <th>Ngày Gợi Ý</th>
                                    <th>Thao Tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((item: GoiYTuAI) => (
                                    <tr key={item._id}>
                                        <td>{item.hoiVien}</td>
                                        <td>{item.mucTieu}</td>
                                        <td className="content-cell">{item.noiDung.substring(0, 100)}...</td>
                                        <td>
                                            <span className={`difficulty difficulty-${item.doKho.toLowerCase()}`}>
                                                {item.doKho === 'DE' ? 'Dễ' : 
                                                 item.doKho === 'TRUNG_BINH' ? 'Trung bình' : 'Khó'}
                                            </span>
                                        </td>
                                        <td>{item.thoiGianTap} phút</td>
                                        <td>{new Date(item.ngayGoiY).toLocaleDateString()}</td>
                                        <td>{renderActionButtons(item)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );

            case 'baocao':
                return (
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Tên Báo Cáo</th>
                                    <th>Nội Dung</th>
                                    <th>Ngày Tạo</th>
                                    <th>Thao Tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((item: BaoCao) => (
                                    <tr key={item._id}>
                                        <td>{item.tenBaoCao}</td>
                                        <td className="content-cell">{item.noiDung.substring(0, 150)}...</td>
                                        <td>{new Date(item.ngayTao).toLocaleDateString()}</td>
                                        <td>{renderActionButtons(item)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );

            default:
                return (
                    <div className="empty-state">
                        <h3>Chọn một entity để xem dữ liệu</h3>
                        <p>Dữ liệu sẽ được hiển thị khi bạn chọn một tab bên trên</p>
                    </div>
                );
        }
    };

    return (
        <div className="entity-manager">
            <div className="entity-header">
                <h2>Quản Lý Dữ Liệu Hệ Thống</h2>
                <button 
                    className="btn-add"
                    onClick={handleAdd}
                >
                    + Thêm Mới
                </button>
            </div>

            <div className="entity-tabs">
                {entities.map(entity => (
                    <button
                        key={entity.id}
                        className={`tab ${activeEntity === entity.id ? 'active' : ''}`}
                        onClick={() => setActiveEntity(entity.id as EntityType)}
                    >
                        <span className="tab-icon">{entity.icon}</span>
                        <span className="tab-name">{entity.name}</span>
                    </button>
                ))}
            </div>

            <div className="entity-content">
                {loading ? (
                    <div className="loading">Đang tải...</div>
                ) : (
                    renderTable()
                )}
            </div>

            {modalVisible && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3>
                                {editingItem ? 'Chỉnh Sửa' : 'Thêm Mới'} {entities.find(e => e.id === activeEntity)?.name}
                            </h3>
                            <button 
                                className="btn-close"
                                onClick={handleCancel}
                            >
                                ✕
                            </button>
                        </div>
                        <div className="modal-body">
                            <DynamicForm
                                entity={activeEntity}
                                initialData={editingItem}
                                onSubmit={handleSubmit}
                                onCancel={handleCancel}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EntityManager;