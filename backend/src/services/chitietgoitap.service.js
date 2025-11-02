const ChiTietGoiTap = require('../models/ChiTietGoiTap');
const GoiTap = require('../models/GoiTap');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
dayjs.extend(utc);
dayjs.extend(timezone);

function toVNTime(date) {
    return dayjs(date).tz('Asia/Ho_Chi_Minh', true).toDate();
}

const createChiTietGoiTap = async (data) => {
    const existed = await ChiTietGoiTap.findOne({ maHoiVien: data.maHoiVien, maGoiTap: data.maGoiTap });
    if (existed) throw new Error('Hội viên đã đăng ký gói tập này rồi!');
    if (!data.ngayDangKy) {
        data.ngayDangKy = toVNTime(new Date());
    } else {
        data.ngayDangKy = toVNTime(data.ngayDangKy);
    }
    if (!data.ngayKetThuc) {
        const goiTap = await GoiTap.findById(data.maGoiTap);
        if (!goiTap) throw new Error('Không tìm thấy gói tập');
        const thoiHan = goiTap.thoiHan || 1;
        const ngayKetThuc = dayjs(data.ngayDangKy).add(thoiHan, 'day').tz('Asia/Ho_Chi_Minh', true).toDate();
        data.ngayKetThuc = ngayKetThuc;
    } else {
        data.ngayKetThuc = toVNTime(data.ngayKetThuc);
    }

    // Tạo gói mới
    const created = await ChiTietGoiTap.create(data);

    // Nếu là nâng cấp, đánh dấu tất cả gói cũ của cùng hội viên đã được nâng cấp/tạm dừng
    if (data.isUpgrade) {
        const memberId = data.maHoiVien || data.nguoiDungId; // hỗ trợ cả legacy và schema mới
        if (memberId) {
            await ChiTietGoiTap.updateMany(
                {
                    $or: [
                        { maHoiVien: memberId },
                        { nguoiDungId: memberId }
                    ],
                    _id: { $ne: created._id },
                    trangThaiDangKy: { $ne: 'DA_NANG_CAP' }
                },
                {
                    $set: {
                        trangThaiSuDung: 'DA_NANG_CAP',
                        trangThaiDangKy: 'DA_NANG_CAP',
                        ngayTamDung: new Date(),
                        lyDoTamDung: 'Nâng cấp gói tập',
                        thoiGianCapNhat: new Date()
                    }
                }
            );
        }
    }

    return created;
};

const getAllChiTietGoiTap = async (filter = {}) => {
    console.log('🔍 getAllChiTietGoiTap service called with filter:', filter);
    const result = await ChiTietGoiTap.find(filter).populate('maHoiVien').populate('maGoiTap');
    console.log('🔍 getAllChiTietGoiTap service result:', result.length, 'registrations');
    return result;
};

const getChiTietGoiTapById = async (id) => {
    console.log('🔍 getChiTietGoiTapById service called with ID:', id);
    try {
        const result = await ChiTietGoiTap.findById(id)
            .populate('maHoiVien')
            .populate('maGoiTap')
            .populate('goiTapId')
            .populate('branchId')
            .populate('ptDuocChon')
            .populate({
                path: 'lichTapDuocTao',
                populate: [
                    {
                        path: 'pt',
                        select: 'hoTen danhGia chuyenMon'
                    },
                    {
                        path: 'cacBuoiTap',
                        select: 'ngayTap gioBatDauDuKien gioKetThucDuKien trangThaiXacNhan trangThaiTap cacBaiTap',
                        populate: {
                            path: 'cacBaiTap.baiTap',
                            select: 'tenBaiTap moTa nhomCo'
                        }
                    }
                ]
            });

        console.log('🔍 getChiTietGoiTapById service result:', {
            found: !!result,
            hasLichTapDuocTao: !!(result && result.lichTapDuocTao),
            cacBuoiTapCount: result && result.lichTapDuocTao ? result.lichTapDuocTao.cacBuoiTap?.length || 0 : 0
        });

        return result;
    } catch (error) {
        console.error('🔍 getChiTietGoiTapById service error:', error);
        throw error;
    }
};

const updateChiTietGoiTap = async (id, data) => {
    // Kiểm tra xem chi tiết gói tập có bị khóa không
    const existingChiTiet = await ChiTietGoiTap.findById(id);
    if (!existingChiTiet) {
        throw new Error('Không tìm thấy thông tin đăng ký gói tập');
    }

    if (existingChiTiet.isLocked) {
        throw new Error('Không thể chỉnh sửa đăng ký gói tập đã thanh toán');
    }

    // Ngăn chặn thay đổi trạng thái thanh toán trực tiếp nếu đã thanh toán
    if (data.trangThaiThanhToan === 'DA_THANH_TOAN' && existingChiTiet.trangThaiThanhToan === 'CHUA_THANH_TOAN') {
        throw new Error('Không thể thay đổi trạng thái thanh toán trực tiếp. Vui lòng sử dụng quy trình thanh toán.');
    }

    if (data.ngayDangKy) data.ngayDangKy = toVNTime(data.ngayDangKy);
    if (data.ngayKetThuc) data.ngayKetThuc = toVNTime(data.ngayKetThuc);

    return await ChiTietGoiTap.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

const deleteChiTietGoiTap = async (id) => {
    // Kiểm tra xem chi tiết gói tập có bị khóa không
    const existingChiTiet = await ChiTietGoiTap.findById(id);
    if (!existingChiTiet) {
        throw new Error('Không tìm thấy thông tin đăng ký gói tập');
    }

    if (existingChiTiet.isLocked) {
        throw new Error('Không thể xóa đăng ký gói tập đã thanh toán');
    }

    if (existingChiTiet.trangThaiThanhToan === 'DA_THANH_TOAN') {
        throw new Error('Không thể xóa đăng ký gói tập đã thanh toán');
    }

    return await ChiTietGoiTap.findByIdAndDelete(id);
};

const getChiTietGoiTapByHoiVien = async (maHoiVien) => {
    return await ChiTietGoiTap.find({ maHoiVien })
        .populate('maGoiTap')
        .populate('maThanhToan')
        .sort({ ngayDangKy: -1 });
};

/**
 * Kiểm tra xem chi tiết gói tập có thể chỉnh sửa không
 */
const canEditChiTietGoiTap = async (id) => {
    const chiTiet = await ChiTietGoiTap.findById(id);
    if (!chiTiet) return false;
    return !chiTiet.isLocked && chiTiet.trangThaiThanhToan !== 'DA_THANH_TOAN';
};

/**
 * Lấy thống kê đăng ký gói tập
 */
const getChiTietGoiTapStats = async () => {
    const allRegistrations = await ChiTietGoiTap.find().populate('maGoiTap');

    return {
        total: allRegistrations.length,
        daThanhToan: allRegistrations.filter(r => r.trangThaiThanhToan === 'DA_THANH_TOAN').length,
        chuaThanhToan: allRegistrations.filter(r => r.trangThaiThanhToan === 'CHUA_THANH_TOAN').length,
        biKhoa: allRegistrations.filter(r => r.isLocked).length
    };
};

module.exports = {
    createChiTietGoiTap,
    getAllChiTietGoiTap,
    getChiTietGoiTapById,
    updateChiTietGoiTap,
    deleteChiTietGoiTap,
    getChiTietGoiTapByHoiVien,
    canEditChiTietGoiTap,
    getChiTietGoiTapStats
};