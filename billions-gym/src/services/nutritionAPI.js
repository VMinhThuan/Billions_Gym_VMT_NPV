import { apiRequest, getApiUrl } from './api';

// Get all menus for member
export const getThucDonHoiVien = async (maHoiVien, params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.trangThai) queryParams.append('trangThai', params.trangThai);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.page) queryParams.append('page', params.page);

    const queryString = queryParams.toString();
    const url = queryString
        ? `/dinhduong/thuc-don/${maHoiVien}?${queryString}`
        : `/dinhduong/thuc-don/${maHoiVien}`;

    return await apiRequest(getApiUrl(url));
};

// Get menu details
export const getChiTietThucDon = async (thucDonId) => {
    return await apiRequest(getApiUrl(`/dinhduong/thuc-don/chi-tiet/${thucDonId}`));
};

// Create automatic menu
export const taoThucDonTuDong = async (data) => {
    return await apiRequest(getApiUrl('/dinhduong/thuc-don'), {
        method: 'POST',
        body: JSON.stringify(data)
    });
};

// Update menu rating
export const capNhatDanhGiaThucDon = async (thucDonId, data) => {
    return await apiRequest(getApiUrl(`/dinhduong/thuc-don/${thucDonId}/danh-gia`), {
        method: 'PUT',
        body: JSON.stringify(data)
    });
};

// Create nutrition suggestion
export const taoGoiYDinhDuong = async (data) => {
    return await apiRequest(getApiUrl('/dinhduong/goi-y'), {
        method: 'POST',
        body: JSON.stringify(data)
    });
};

// Get nutrition suggestions
export const getGoiYDinhDuong = async (maHoiVien, params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.limit) queryParams.append('limit', params.limit);
    if (params.page) queryParams.append('page', params.page);
    if (params.loaiGoiY) queryParams.append('loaiGoiY', params.loaiGoiY);

    const queryString = queryParams.toString();
    const url = queryString
        ? `/dinhduong/goi-y/${maHoiVien}?${queryString}`
        : `/dinhduong/goi-y/${maHoiVien}`;

    return await apiRequest(getApiUrl(url));
};

// Get suggestion details
export const getChiTietGoiY = async (goiYId) => {
    return await apiRequest(getApiUrl(`/dinhduong/goi-y/chi-tiet/${goiYId}`));
};

// Update suggestion feedback
export const capNhatPhanHoiGoiY = async (goiYId, data) => {
    return await apiRequest(getApiUrl(`/dinhduong/goi-y/${goiYId}/phan-hoi`), {
        method: 'PUT',
        body: JSON.stringify(data)
    });
};

// Get nutrition info
export const getThongTinDinhDuong = async (maHoiVien) => {
    return await apiRequest(getApiUrl(`/dinhduong/info/${maHoiVien}`));
};

// Analyze workout activity
export const phanTichHoatDong = async (maHoiVien) => {
    return await apiRequest(getApiUrl(`/dinhduong/phan-tich/${maHoiVien}`));
};

// Calculate calorie needs
export const tinhNhuCauCalories = async (data) => {
    return await apiRequest(getApiUrl('/dinhduong/tinh-calories'), {
        method: 'POST',
        body: JSON.stringify(data)
    });
};

export default {
    getThucDonHoiVien,
    getChiTietThucDon,
    taoThucDonTuDong,
    capNhatDanhGiaThucDon,
    taoGoiYDinhDuong,
    getGoiYDinhDuong,
    getChiTietGoiY,
    capNhatPhanHoiGoiY,
    getThongTinDinhDuong,
    phanTichHoatDong,
    tinhNhuCauCalories
};
