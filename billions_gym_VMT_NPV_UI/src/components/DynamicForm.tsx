import React, { useState, useEffect } from 'react';
import './DynamicForm.css';

interface FormField {
    name: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'datetime-local' | 'time' | 'email' | 'tel' | 'url' | 'textarea' | 'select' | 'file' | 'checkbox' | 'radio' | 'array' | 'nested-object';
    required?: boolean;
    options?: { value: string; label: string }[];
    placeholder?: string;
    min?: number | string;
    max?: number | string;
    accept?: string;
    multiple?: boolean;
    rows?: number;
    validation?: (value: any) => string | null;
    // New properties for complex fields
    arrayItemType?: 'object' | 'reference' | 'simple';
    arrayFields?: FormField[];
    referenceEntity?: string;
    referenceDisplayField?: string;
    nestedFields?: FormField[];
    defaultValue?: any;
}

interface DynamicFormProps {
    entity: string;
    initialData?: any;
    onSubmit: (data: any) => void;
    onCancel: () => void;
}

const DynamicForm: React.FC<DynamicFormProps> = ({ entity, initialData, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState<any>({});
    const [errors, setErrors] = useState<any>({});
    const [loading, setLoading] = useState(false);

    // Define form fields for each entity
    const getFormFields = (entityType: string): FormField[] => {
        switch (entityType) {
            case 'lichtap':
                return [
                    { name: 'hoiVien', label: 'Hội Viên', type: 'select', required: true, 
                      referenceEntity: 'hoivien', referenceDisplayField: 'hoTen', options: [] },
                    { name: 'pt', label: 'Personal Trainer', type: 'select', required: true,
                      referenceEntity: 'pt', referenceDisplayField: 'hoTen', options: [] },
                    { name: 'ngayBatDau', label: 'Ngày Bắt Đầu', type: 'date', required: true },
                    { name: 'ngayKetThuc', label: 'Ngày Kết Thúc', type: 'date', required: true },
                    {
                        name: 'cacBuoiTap',
                        label: 'Các Buổi Tập',
                        type: 'array',
                        arrayItemType: 'reference',
                        referenceEntity: 'buoitap',
                        referenceDisplayField: 'ngayTap'
                    }
                ];

            case 'buoitap':
                return [
                    { name: 'ngayTap', label: 'Ngày Tập', type: 'date', required: true },
                    { name: 'hoiVien', label: 'Hội Viên', type: 'select', required: true, 
                      referenceEntity: 'hoivien', referenceDisplayField: 'hoTen', options: [] },
                    { name: 'pt', label: 'Personal Trainer', type: 'select', required: true,
                      referenceEntity: 'pt', referenceDisplayField: 'hoTen', options: [] },
                    { name: 'thoiGianBatDau', label: 'Thời Gian Bắt Đầu', type: 'datetime-local' },
                    { name: 'thoiGianKetThuc', label: 'Thời Gian Kết Thúc', type: 'datetime-local' },
                    {
                        name: 'trangThaiTap',
                        label: 'Trạng Thái',
                        type: 'select',
                        defaultValue: 'CHUA_HOAN_THANH',
                        options: [
                            { value: 'CHUA_HOAN_THANH', label: 'Chưa Hoàn Thành' },
                            { value: 'DA_HOAN_THANH', label: 'Đã Hoàn Thành' }
                        ]
                    },
                    {
                        name: 'cacBaiTap',
                        label: 'Các Bài Tập Trong Buổi',
                        type: 'array',
                        arrayItemType: 'object',
                        arrayFields: [
                            { name: 'baiTap', label: 'Bài Tập', type: 'select', required: true,
                              referenceEntity: 'baitap', referenceDisplayField: 'tenBaiTap', options: [] },
                            { name: 'soSet', label: 'Số Set', type: 'number', required: true, min: 1, defaultValue: 1 },
                            { name: 'soLanLap', label: 'Số Lần Lặp/Set', type: 'number', required: true, min: 1, defaultValue: 10 },
                            { name: 'trongLuong', label: 'Trọng Lượng (kg)', type: 'number', min: 0, defaultValue: 0 },
                            { name: 'thoiGianNghi', label: 'Thời Gian Nghỉ (giây)', type: 'number', min: 0, defaultValue: 60 },
                            { name: 'ghiChu', label: 'Ghi Chú', type: 'textarea', rows: 2 }
                        ]
                    },
                    { name: 'ghiChu', label: 'Ghi Chú Chung', type: 'textarea', rows: 3 },
                ];

            case 'baitap':
                return [
                    { name: 'tenBaiTap', label: 'Tên Bài Tập', type: 'text', required: true },
                    { name: 'nhomCo', label: 'Nhóm Cơ', type: 'select', options: [
                        { value: 'CHEST', label: 'Ngực' },
                        { value: 'BACK', label: 'Lưng' },
                        { value: 'SHOULDERS', label: 'Vai' },
                        { value: 'ARMS', label: 'Tay' },
                        { value: 'LEGS', label: 'Chân' },
                        { value: 'CORE', label: 'Cơ Lõi' },
                        { value: 'CARDIO', label: 'Tim Mạch' },
                        { value: 'FULL_BODY', label: 'Toàn Thân' }
                    ]},
                    { name: 'moTa', label: 'Mô Tả', type: 'textarea', rows: 4 },
                    { name: 'hinhAnh', label: 'Hình Ảnh', type: 'file', accept: 'image/*' },
                    { name: 'hinhAnhMinhHoa', label: 'Hình Ảnh Minh Họa', type: 'file', accept: 'image/*' },
                    { name: 'videoHuongDan', label: 'Video Hướng Dẫn (URL)', type: 'url' },
                ];

            case 'hoivien':
                return [
                    { name: 'hoTen', label: 'Họ Tên', type: 'text', required: true },
                    { name: 'email', label: 'Email', type: 'email', required: true },
                    { name: 'soDienThoai', label: 'Số Điện Thoại', type: 'tel', required: true },
                    { name: 'ngaySinh', label: 'Ngày Sinh', type: 'date' },
                    { name: 'gioiTinh', label: 'Giới Tính', type: 'select', options: [
                        { value: 'NAM', label: 'Nam' },
                        { value: 'NU', label: 'Nữ' }
                    ]},
                    { name: 'chieuCao', label: 'Chiều Cao (cm)', type: 'number', min: 100, max: 250 },
                    { name: 'canNang', label: 'Cân Nặng (kg)', type: 'number', min: 30, max: 200 },
                    { name: 'diaChi', label: 'Địa Chỉ', type: 'textarea', rows: 3 },
                ];

            case 'pt':
                return [
                    { name: 'hoTen', label: 'Họ Tên', type: 'text', required: true },
                    { name: 'email', label: 'Email', type: 'email', required: true },
                    { name: 'soDienThoai', label: 'Số Điện Thoại', type: 'tel', required: true },
                    { name: 'ngaySinh', label: 'Ngày Sinh', type: 'date' },
                    { name: 'gioiTinh', label: 'Giới Tính', type: 'select', options: [
                        { value: 'NAM', label: 'Nam' },
                        { value: 'NU', label: 'Nữ' }
                    ]},
                    { name: 'chuyenMon', label: 'Chuyên Môn', type: 'textarea', rows: 3 },
                    { name: 'kinh_nghiem', label: 'Kinh Nghiệm (năm)', type: 'number', min: 0, max: 50 },
                    { name: 'mucLuong', label: 'Mức Lương', type: 'number', min: 0 },
                ];

            case 'chisocothe':
                return [
                    { name: 'hoiVien', label: 'Hội Viên', type: 'select', required: true,
                      referenceEntity: 'hoivien', referenceDisplayField: 'hoTen', options: [] },
                    { name: 'ngayDo', label: 'Ngày Đo', type: 'date', required: true },
                    { name: 'chieuCao', label: 'Chiều Cao (cm)', type: 'number', min: 100, max: 250 },
                    { name: 'canNang', label: 'Cân Nặng (kg)', type: 'number', min: 30, max: 200 },
                    { name: 'chiso_bmi', label: 'BMI', type: 'number', min: 10, max: 50 },
                    { name: 'phanTram_moCo', label: 'Phần Trăm Mỡ Cơ (%)', type: 'number', min: 0, max: 100 },
                    { name: 'phanTram_nuoc', label: 'Phần Trăm Nước (%)', type: 'number', min: 0, max: 100 },
                    { name: 'canNang_co', label: 'Cân Nặng Cơ (kg)', type: 'number', min: 0 },
                    { name: 'ghiChu', label: 'Ghi Chú', type: 'textarea', rows: 3 },
                ];

            case 'dinhduong':
                return [
                    { name: 'hoiVien', label: 'Hội Viên', type: 'select', required: true,
                      referenceEntity: 'hoivien', referenceDisplayField: 'hoTen', options: [] },
                    { name: 'ngayThucHien', label: 'Ngày Thực Hiện', type: 'date', required: true },
                    { name: 'bua_an', label: 'Bữa Ăn', type: 'select', required: true, options: [
                        { value: 'SANG', label: 'Sáng' },
                        { value: 'TRUA', label: 'Trưa' },
                        { value: 'TOI', label: 'Tối' },
                        { value: 'PHAT', label: 'Phụ' }
                    ]},
                    { name: 'ten_mon_an', label: 'Tên Món Ăn', type: 'text', required: true },
                    { name: 'luong_an', label: 'Lượng Ăn (gram)', type: 'number', min: 0, required: true },
                    { name: 'calo', label: 'Calo', type: 'number', min: 0 },
                    { name: 'protein', label: 'Protein (g)', type: 'number', min: 0 },
                    { name: 'carbohydrate', label: 'Carbohydrate (g)', type: 'number', min: 0 },
                    { name: 'chat_beo', label: 'Chất Béo (g)', type: 'number', min: 0 },
                    { name: 'chat_xo', label: 'Chất Xơ (g)', type: 'number', min: 0 },
                    { name: 'ghiChu', label: 'Ghi Chú', type: 'textarea', rows: 3 },
                ];

            case 'goitap':
                return [
                    { name: 'tenGoi', label: 'Tên Gói', type: 'text', required: true },
                    { name: 'loaiGoi', label: 'Loại Gói', type: 'select', required: true, options: [
                        { value: 'CO_BAN', label: 'Cơ Bản' },
                        { value: 'NANG_CAO', label: 'Nâng Cao' },
                        { value: 'CHUYEN_NGHIEP', label: 'Chuyên Nghiệp' },
                        { value: 'VIP', label: 'VIP' }
                    ]},
                    { name: 'giaTien', label: 'Giá Tiền', type: 'number', min: 0, required: true },
                    { name: 'thoiHan', label: 'Thời Hạn (tháng)', type: 'number', min: 1, required: true },
                    { name: 'moTa', label: 'Mô Tả', type: 'textarea', rows: 4 },
                    { name: 'uu_dai', label: 'Ưu Đãi', type: 'textarea', rows: 3 },
                    { name: 'trangThai', label: 'Trạng Thái', type: 'select', defaultValue: 'ACTIVE', options: [
                        { value: 'ACTIVE', label: 'Hoạt Động' },
                        { value: 'INACTIVE', label: 'Không Hoạt Động' }
                    ]},
                ];

            case 'dangky':
                return [
                    { name: 'hoiVien', label: 'Hội Viên', type: 'select', required: true,
                      referenceEntity: 'hoivien', referenceDisplayField: 'hoTen', options: [] },
                    { name: 'goiTap', label: 'Gói Tập', type: 'select', required: true,
                      referenceEntity: 'goitap', referenceDisplayField: 'tenGoi', options: [] },
                    { name: 'ngayDangKy', label: 'Ngày Đăng Ký', type: 'date', required: true },
                    { name: 'ngayBatDau', label: 'Ngày Bắt Đầu', type: 'date', required: true },
                    { name: 'ngayKetThuc', label: 'Ngày Kết Thúc', type: 'date', required: true },
                    { name: 'trangThai', label: 'Trạng Thái', type: 'select', defaultValue: 'ACTIVE', options: [
                        { value: 'ACTIVE', label: 'Đang Hoạt Động' },
                        { value: 'EXPIRED', label: 'Hết Hạn' },
                        { value: 'SUSPENDED', label: 'Tạm Dừng' }
                    ]},
                    { name: 'ghiChu', label: 'Ghi Chú', type: 'textarea', rows: 3 },
                ];

            case 'thanhtoan':
                return [
                    { name: 'dangKy', label: 'Đăng Ký', type: 'select', required: true,
                      referenceEntity: 'dangky', referenceDisplayField: 'id', options: [] },
                    { name: 'ngayThanhToan', label: 'Ngày Thanh Toán', type: 'date', required: true },
                    { name: 'soTien', label: 'Số Tiền', type: 'number', min: 0, required: true },
                    { name: 'phuongThucThanhToan', label: 'Phương Thức Thanh Toán', type: 'select', required: true, options: [
                        { value: 'TIEN_MAT', label: 'Tiền Mặt' },
                        { value: 'CHUYEN_KHOAN', label: 'Chuyển Khoản' },
                        { value: 'THE_CREDIT', label: 'Thẻ Credit' },
                        { value: 'VI_DIEN_TU', label: 'Ví Điện Tử' }
                    ]},
                    { name: 'trangThaiThanhToan', label: 'Trạng Thái Thanh Toán', type: 'select', defaultValue: 'DA_THANH_TOAN', options: [
                        { value: 'CHUA_THANH_TOAN', label: 'Chưa Thanh Toán' },
                        { value: 'DA_THANH_TOAN', label: 'Đã Thanh Toán' },
                        { value: 'HOAN_TIEN', label: 'Hoàn Tiền' }
                    ]},
                    { name: 'ghiChu', label: 'Ghi Chú', type: 'textarea', rows: 3 },
                ];

            case 'lichhenpt':
                return [
                    { name: 'hoiVien', label: 'Hội Viên', type: 'select', required: true,
                      referenceEntity: 'hoivien', referenceDisplayField: 'hoTen', options: [] },
                    { name: 'pt', label: 'Personal Trainer', type: 'select', required: true,
                      referenceEntity: 'pt', referenceDisplayField: 'hoTen', options: [] },
                    { name: 'ngayHen', label: 'Ngày Hẹn', type: 'date', required: true },
                    { name: 'gioHen', label: 'Giờ Hẹn', type: 'time', required: true },
                    { name: 'loaiHen', label: 'Loại Hẹn', type: 'select', required: true, options: [
                        { value: 'TU_VAN', label: 'Tư Vấn' },
                        { value: 'TAP_LUYEN', label: 'Tập Luyện' },
                        { value: 'DANH_GIA', label: 'Đánh Giá' }
                    ]},
                    { name: 'trangThai', label: 'Trạng Thái', type: 'select', defaultValue: 'DAT_LICH', options: [
                        { value: 'DAT_LICH', label: 'Đã Đặt Lịch' },
                        { value: 'XAC_NHAN', label: 'Xác Nhận' },
                        { value: 'HOAN_THANH', label: 'Hoàn Thành' },
                        { value: 'HUY', label: 'Hủy' }
                    ]},
                    { name: 'noiDung', label: 'Nội Dung', type: 'textarea', rows: 4 },
                    { name: 'ghiChu', label: 'Ghi Chú', type: 'textarea', rows: 3 },
                ];

            case 'thongbao':
                return [
                    { name: 'tieuDe', label: 'Tiêu Đề', type: 'text', required: true },
                    { name: 'noiDung', label: 'Nội Dung', type: 'textarea', rows: 5, required: true },
                    { name: 'loaiThongBao', label: 'Loại Thông Báo', type: 'select', required: true, options: [
                        { value: 'CHUNG', label: 'Chung' },
                        { value: 'CA_NHAN', label: 'Cá Nhân' },
                        { value: 'KHAN_CAP', label: 'Khẩn Cấp' },
                        { value: 'KHUYEN_MAI', label: 'Khuyến Mãi' }
                    ]},
                    { name: 'hoiVien', label: 'Hội Viên (nếu cá nhân)', type: 'select',
                      referenceEntity: 'hoivien', referenceDisplayField: 'hoTen', options: [] },
                    { name: 'trangThai', label: 'Trạng Thái', type: 'select', defaultValue: 'CHUA_GUI', options: [
                        { value: 'CHUA_GUI', label: 'Chưa Gửi' },
                        { value: 'DA_GUI', label: 'Đã Gửi' }
                    ]},
                    { name: 'ngayTao', label: 'Ngày Tạo', type: 'date', required: true },
                    { name: 'ngayGui', label: 'Ngày Gửi', type: 'date' },
                ];

            case 'feedback':
                return [
                    { name: 'hoiVien', label: 'Hội Viên', type: 'select', required: true,
                      referenceEntity: 'hoivien', referenceDisplayField: 'hoTen', options: [] },
                    { name: 'pt', label: 'Personal Trainer', type: 'select',
                      referenceEntity: 'pt', referenceDisplayField: 'hoTen', options: [] },
                    { name: 'loaiFeedback', label: 'Loại Feedback', type: 'select', required: true, options: [
                        { value: 'DICH_VU', label: 'Dịch Vụ' },
                        { value: 'PT', label: 'Personal Trainer' },
                        { value: 'CO_SO_VAT_CHAT', label: 'Cơ Sở Vật Chất' },
                        { value: 'KHAC', label: 'Khác' }
                    ]},
                    { name: 'danhGia', label: 'Đánh Giá', type: 'select', required: true, options: [
                        { value: '1', label: '1 Sao' },
                        { value: '2', label: '2 Sao' },
                        { value: '3', label: '3 Sao' },
                        { value: '4', label: '4 Sao' },
                        { value: '5', label: '5 Sao' }
                    ]},
                    { name: 'noiDung', label: 'Nội Dung', type: 'textarea', rows: 5, required: true },
                    { name: 'ngayTao', label: 'Ngày Tạo', type: 'date', required: true },
                    { name: 'trangThai', label: 'Trạng Thái', type: 'select', defaultValue: 'CHUA_XU_LY', options: [
                        { value: 'CHUA_XU_LY', label: 'Chưa Xử Lý' },
                        { value: 'DANG_XU_LY', label: 'Đang Xử Lý' },
                        { value: 'DA_XU_LY', label: 'Đã Xử Lý' }
                    ]},
                ];

            default:
                return [];
        }
    };

    const fields = getFormFields(entity);

    // Initialize form data
    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        } else {
            const initData: any = {};
            fields.forEach(field => {
                if (field.type === 'checkbox') {
                    initData[field.name] = false;
                } else if (field.type === 'number') {
                    initData[field.name] = field.defaultValue || field.min || 0;
                } else if (field.type === 'date') {
                    initData[field.name] = field.defaultValue || new Date().toISOString().split('T')[0];
                } else if (field.type === 'array') {
                    initData[field.name] = field.defaultValue || [];
                } else if (field.type === 'select') {
                    initData[field.name] = field.defaultValue || '';
                } else {
                    initData[field.name] = field.defaultValue || '';
                }
            });
            setFormData(initData);
        }
    }, [initialData, entity]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        let newValue: any = value;

        if (type === 'number') {
            newValue = parseFloat(value) || 0;
        } else if (type === 'checkbox') {
            newValue = (e.target as HTMLInputElement).checked;
        } else if (type === 'file') {
            const files = (e.target as HTMLInputElement).files;
            newValue = files && files.length > 1 ? Array.from(files) : files?.[0] || null;
        }

        setFormData((prev: any) => ({
            ...prev,
            [name]: newValue
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors((prev: any) => ({
                ...prev,
                [name]: null
            }));
        }
    };

    // Handle array operations
    const handleArrayAdd = (fieldName: string, field: FormField) => {
        const currentArray = formData[fieldName] || [];
        let newItem: any = {};

        if (field.arrayItemType === 'object' && field.arrayFields) {
            field.arrayFields.forEach(subField => {
                if (subField.type === 'checkbox') {
                    newItem[subField.name] = false;
                } else if (subField.type === 'number') {
                    newItem[subField.name] = subField.defaultValue || subField.min || 0;
                } else {
                    newItem[subField.name] = subField.defaultValue || '';
                }
            });
        } else {
            newItem = '';
        }

        setFormData((prev: any) => ({
            ...prev,
            [fieldName]: [...currentArray, newItem]
        }));
    };

    const handleArrayRemove = (fieldName: string, index: number) => {
        const currentArray = formData[fieldName] || [];
        setFormData((prev: any) => ({
            ...prev,
            [fieldName]: currentArray.filter((_: any, i: number) => i !== index)
        }));
    };

    const handleArrayItemChange = (fieldName: string, index: number, subFieldName: string, value: any) => {
        const currentArray = [...(formData[fieldName] || [])];
        currentArray[index] = {
            ...currentArray[index],
            [subFieldName]: value
        };

        setFormData((prev: any) => ({
            ...prev,
            [fieldName]: currentArray
        }));
    };

    const validateForm = () => {
        const newErrors: any = {};

        fields.forEach(field => {
            const value = formData[field.name];

            if (field.required && (!value || value === '')) {
                newErrors[field.name] = `${field.label} là bắt buộc`;
            }

            if (field.validation && value) {
                const error = field.validation(value);
                if (error) {
                    newErrors[field.name] = error;
                }
            }

            if (field.type === 'number' && value !== undefined) {
                if (field.min !== undefined && value < field.min) {
                    newErrors[field.name] = `${field.label} phải >= ${field.min}`;
                }
                if (field.max !== undefined && value > field.max) {
                    newErrors[field.name] = `${field.label} phải <= ${field.max}`;
                }
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            await onSubmit(formData);
        } catch (error) {
            console.error('Submit error:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderSubField = (field: FormField, value: any, onChange: (value: any) => void) => {
        const subProps = {
            name: `${field.name}_sub`,
            id: `${field.name}_sub`,
            value: value || '',
            onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
                const target = e.target;
                let newValue: any = target.value;
                
                if (target.type === 'number') {
                    newValue = parseFloat(target.value) || 0;
                } else if (target.type === 'checkbox') {
                    newValue = (target as HTMLInputElement).checked;
                }
                
                onChange(newValue);
            },
            placeholder: field.placeholder,
            required: field.required,
            className: `form-input`
        };

        return renderFieldType(field, subProps);
    };

    const renderFieldType = (field: FormField, props: any) => {
        switch (field.type) {
            case 'textarea':
                return (
                    <textarea
                        {...props}
                        rows={field.rows}
                    />
                );

            case 'select':
                return (
                    <select {...props}>
                        <option value="">-- Chọn --</option>
                        {field.options?.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                );

            case 'file':
                return (
                    <input
                        type="file"
                        name={field.name}
                        id={field.name}
                        accept={field.accept}
                        multiple={field.multiple}
                        onChange={handleChange}
                        className={`form-input ${errors[field.name] ? 'error' : ''}`}
                    />
                );

            case 'checkbox':
                return (
                    <input
                        type="checkbox"
                        name={props.name}
                        id={props.id}
                        checked={props.value || false}
                        onChange={props.onChange}
                        className={`form-checkbox`}
                    />
                );

            default:
                return (
                    <input
                        {...props}
                        type={field.type}
                        min={field.min}
                        max={field.max}
                    />
                );
        }
    };

    const renderField = (field: FormField) => {
        const commonProps = {
            name: field.name,
            id: field.name,
            value: formData[field.name] || '',
            onChange: handleChange,
            placeholder: field.placeholder,
            required: field.required,
            className: `form-input ${errors[field.name] ? 'error' : ''}`
        };

        if (field.type === 'array') {
            const arrayData = formData[field.name] || [];
            return (
                <div className="array-field">
                    <div className="array-items">
                        {arrayData.map((item: any, index: number) => (
                            <div key={index} className="array-item">
                                <div className="array-item-header">
                                    <span className="array-item-index">#{index + 1}</span>
                                    <button
                                        type="button"
                                        onClick={() => handleArrayRemove(field.name, index)}
                                        className="btn-remove-array-item"
                                        title="Xóa item này"
                                    >
                                        ✕
                                    </button>
                                </div>
                                
                                {field.arrayItemType === 'object' && field.arrayFields ? (
                                    <div className="array-item-fields">
                                        {field.arrayFields.map(subField => (
                                            <div key={subField.name} className="array-sub-field">
                                                <label className="sub-field-label">
                                                    {subField.label}
                                                    {subField.required && <span className="required">*</span>}
                                                </label>
                                                {renderSubField(subField, item[subField.name], (value: any) => 
                                                    handleArrayItemChange(field.name, index, subField.name, value)
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <input
                                        type="text"
                                        value={item || ''}
                                        onChange={(e) => handleArrayItemChange(field.name, index, 'value', e.target.value)}
                                        className="form-input"
                                        placeholder="Nhập giá trị"
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                    
                    <button
                        type="button"
                        onClick={() => handleArrayAdd(field.name, field)}
                        className="btn-add-array-item"
                    >
                        + Thêm {field.label}
                    </button>
                </div>
            );
        }

        return renderFieldType(field, commonProps);
    };

    return (
        <form onSubmit={handleSubmit} className="dynamic-form">
            <div className="form-grid">
                {fields.map(field => (
                    <div key={field.name} className={`form-field ${field.type === 'checkbox' ? 'checkbox-field' : ''} ${field.type === 'array' ? 'array-field-container' : ''}`}>
                        <label htmlFor={field.name} className="form-label">
                            {field.label}
                            {field.required && <span className="required">*</span>}
                        </label>
                        {renderField(field)}
                        {errors[field.name] && (
                            <div className="form-error">{errors[field.name]}</div>
                        )}
                    </div>
                ))}
            </div>

            <div className="form-actions">
                <button
                    type="button"
                    onClick={onCancel}
                    className="btn-cancel"
                    disabled={loading}
                >
                    Hủy
                </button>
                <button
                    type="submit"
                    className="btn-submit"
                    disabled={loading}
                >
                    {loading ? 'Đang xử lý...' : initialData ? 'Cập nhật' : 'Tạo mới'}
                </button>
            </div>
        </form>
    );
};

export default DynamicForm;