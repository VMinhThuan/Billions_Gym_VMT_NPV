const ThanhToan = require('../models/ThanhToan');
const ChiTietGoiTap = require('../models/ChiTietGoiTap');
const GoiTap = require('../models/GoiTap');
const mongoose = require('mongoose');

/**
 * Tạo thanh toán mới cho việc đăng ký gói tập
 */
const createThanhToan = async (data) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { hoiVien, maChiTietGoiTap, phuongThuc, noiDung } = data;

        // Kiểm tra chi tiết gói tập tồn tại và chưa thanh toán
        const chiTietGoiTap = await ChiTietGoiTap.findById(maChiTietGoiTap)
            .populate('maGoiTap')
            .session(session);

        if (!chiTietGoiTap) {
            throw new Error('Không tìm thấy thông tin đăng ký gói tập');
        }

        if (chiTietGoiTap.trangThaiThanhToan === 'DA_THANH_TOAN') {
            throw new Error('Gói tập này đã được thanh toán rồi');
        }

        if (chiTietGoiTap.isLocked) {
            throw new Error('Không thể thanh toán cho gói tập đã bị khóa');
        }

        // Tạo thanh toán
        const thanhToan = new ThanhToan({
            hoiVien,
            maChiTietGoiTap,
            soTien: chiTietGoiTap.maGoiTap.donGia,
            phuongThuc,
            noiDung: noiDung || `Thanh toán gói tập: ${chiTietGoiTap.maGoiTap.tenGoiTap}`,
            trangThaiThanhToan: 'DANG_XU_LY'
        });

        await thanhToan.save({ session });

        // Cập nhật liên kết thanh toán trong chi tiết gói tập
        chiTietGoiTap.maThanhToan = thanhToan._id;
        await chiTietGoiTap.save({ session });

        await session.commitTransaction();

        return await ThanhToan.findById(thanhToan._id)
            .populate('hoiVien')
            .populate('maChiTietGoiTap');

    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

/**
 * Xác nhận thanh toán thành công
 */
const confirmThanhToan = async (thanhToanId) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const thanhToan = await ThanhToan.findById(thanhToanId).session(session);

        if (!thanhToan) {
            throw new Error('Không tìm thấy thông tin thanh toán');
        }

        if (thanhToan.isLocked) {
            throw new Error('Thanh toán đã được khóa, không thể thay đổi');
        }

        if (thanhToan.trangThaiThanhToan === 'THANH_CONG') {
            throw new Error('Thanh toán đã được xác nhận rồi');
        }

        // Cập nhật trạng thái thanh toán (sẽ tự động khóa qua middleware)
        thanhToan.trangThaiThanhToan = 'THANH_CONG';
        await thanhToan.save({ session });

        // Cập nhật trạng thái chi tiết gói tập (sẽ tự động khóa qua middleware)
        if (thanhToan.maChiTietGoiTap) {
            const chiTietGoiTap = await ChiTietGoiTap.findById(thanhToan.maChiTietGoiTap).session(session);
            if (chiTietGoiTap) {
                chiTietGoiTap.trangThaiThanhToan = 'DA_THANH_TOAN';
                await chiTietGoiTap.save({ session });
            }
        }

        await session.commitTransaction();

        return await ThanhToan.findById(thanhToanId)
            .populate('hoiVien')
            .populate('maChiTietGoiTap');

    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

/**
 * Lấy tất cả thanh toán
 */
const getAllThanhToan = async (filter = {}) => {
    return await ThanhToan.find(filter)
        .populate('hoiVien')
        .populate('maChiTietGoiTap')
        .sort({ createdAt: -1 });
};

/**
 * Lấy thanh toán theo ID
 */
const getThanhToanById = async (id) => {
    return await ThanhToan.findById(id)
        .populate('hoiVien')
        .populate('maChiTietGoiTap');
};

/**
 * Lấy lịch sử thanh toán của hội viên
 */
const getThanhToanByHoiVien = async (hoiVienId) => {
    return await ThanhToan.find({ hoiVien: hoiVienId })
        .populate({
            path: 'maChiTietGoiTap',
            populate: [
                {
                    path: 'goiTapId',
                    select: 'tenGoiTap donGia thoiHan donViThoiHan'
                },
                {
                    path: 'maGoiTap',
                    select: 'tenGoiTap donGia thoiHan donViThoiHan'
                }
            ]
        })
        .sort({ ngayThanhToan: -1, createdAt: -1 });
};

/**
 * Hủy thanh toán (chỉ được phép khi chưa xác nhận)
 */
const cancelThanhToan = async (thanhToanId, lyDo) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const thanhToan = await ThanhToan.findById(thanhToanId).session(session);

        if (!thanhToan) {
            throw new Error('Không tìm thấy thông tin thanh toán');
        }

        if (thanhToan.isLocked) {
            throw new Error('Không thể hủy thanh toán đã được xác nhận');
        }

        if (thanhToan.trangThaiThanhToan === 'THANH_CONG') {
            throw new Error('Không thể hủy thanh toán đã thành công');
        }

        // Cập nhật trạng thái
        thanhToan.trangThaiThanhToan = 'THAT_BAI';
        thanhToan.noiDung += ` - Đã hủy: ${lyDo}`;
        await thanhToan.save({ session });

        await session.commitTransaction();
        return thanhToan;

    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

/**
 * Kiểm tra xem thanh toán có thể chỉnh sửa không
 */
const canEditThanhToan = async (thanhToanId) => {
    const thanhToan = await ThanhToan.findById(thanhToanId);
    if (!thanhToan) return false;
    return !thanhToan.isLocked && thanhToan.trangThaiThanhToan !== 'THANH_CONG';
};

module.exports = {
    createThanhToan,
    confirmThanhToan,
    getAllThanhToan,
    getThanhToanById,
    getThanhToanByHoiVien,
    cancelThanhToan,
    canEditThanhToan
};