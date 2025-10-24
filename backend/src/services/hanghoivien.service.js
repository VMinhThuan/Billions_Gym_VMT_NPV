const HangHoiVien = require('../models/HangHoiVien');
const HoiVien = require('../models/NguoiDung').HoiVien;
const ChiTietGoiTap = require('../models/ChiTietGoiTap');
const LichSuTap = require('../models/LichSuTap');
const dayjs = require('dayjs');
const mongoose = require('mongoose');

// Tạo hạng hội viên mới
const createHangHoiVien = async (data) => {
    try {
        const hangHoiVien = new HangHoiVien(data);
        return await hangHoiVien.save();
    } catch (error) {
        throw error;
    }
};

// Lấy tất cả hạng hội viên
const getAllHangHoiVien = async () => {
    try {
        return await HangHoiVien.find({ kichHoat: true }).sort({ thuTu: 1 });
    } catch (error) {
        throw error;
    }
};

// Lấy hạng hội viên theo ID
const getHangHoiVienById = async (id) => {
    try {
        return await HangHoiVien.findById(id);
    } catch (error) {
        throw error;
    }
};

// Cập nhật hạng hội viên
const updateHangHoiVien = async (id, data) => {
    try {
        return await HangHoiVien.findByIdAndUpdate(id, data, { new: true });
    } catch (error) {
        throw error;
    }
};

// Xóa hạng hội viên (soft delete)
const deleteHangHoiVien = async (id) => {
    try {
        return await HangHoiVien.findByIdAndUpdate(id, { kichHoat: false }, { new: true });
    } catch (error) {
        throw error;
    }
};

// Tính toán hạng hội viên dựa trên tiêu chí
const tinhHangHoiVien = async (hoiVienId) => {
    try {
        const hoiVien = await HoiVien.findById(hoiVienId);
        if (!hoiVien) {
            throw new Error('Không tìm thấy hội viên');
        }

        // Tính tổng số tiền đã chi
        const tongTienDaChi = await ChiTietGoiTap.aggregate([
            { $match: { maHoiVien: hoiVienId, trangThaiThanhToan: 'DA_THANH_TOAN' } },
            { $lookup: { from: 'goitaps', localField: 'maGoiTap', foreignField: '_id', as: 'goiTap' } },
            { $unwind: '$goiTap' },
            { $group: { _id: null, tongTien: { $sum: '$goiTap.donGia' } } }
        ]);

        const soTienTichLuy = tongTienDaChi.length > 0 ? tongTienDaChi[0].tongTien : 0;

        // Tính số tháng liên tục là hội viên
        const ngayThamGia = dayjs(hoiVien.ngayThamGia);
        const soThangLienTuc = dayjs().diff(ngayThamGia, 'month');

        // Tính số buổi tập đã thực hiện
        const soBuoiTapDaTap = await LichSuTap.countDocuments({ maHoiVien: hoiVienId });

        // Cập nhật thông tin hội viên
        hoiVien.soTienTichLuy = soTienTichLuy;
        hoiVien.soThangLienTuc = soThangLienTuc;
        hoiVien.soBuoiTapDaTap = soBuoiTapDaTap;

        // Tìm hạng phù hợp
        const hangPhuHop = await HangHoiVien.findOne({
            kichHoat: true,
            'dieuKienDatHang.soTienTichLuy': { $lte: soTienTichLuy },
            'dieuKienDatHang.soThangLienTuc': { $lte: soThangLienTuc },
            'dieuKienDatHang.soBuoiTapToiThieu': { $lte: soBuoiTapDaTap }
        }).sort({ thuTu: -1 });

        if (hangPhuHop) {
            // Kiểm tra xem hạng có thay đổi không
            if (!hoiVien.hangHoiVien || hoiVien.hangHoiVien.toString() !== hangPhuHop._id.toString()) {
                hoiVien.hangHoiVien = hangPhuHop._id;
                hoiVien.ngayDatHang = new Date();
            }
        }

        await hoiVien.save();
        return hoiVien;
    } catch (error) {
        throw error;
    }
};

// Lấy thông tin hạng hội viên của một hội viên
const getHangHoiVienCuaHoiVien = async (hoiVienId) => {
    try {
        const hoiVien = await HoiVien.findById(hoiVienId).populate('hangHoiVien');
        if (!hoiVien) {
            throw new Error('Không tìm thấy hội viên');
        }

        return {
            hoiVien: hoiVien,
            hangHoiVien: hoiVien.hangHoiVien,
            soTienTichLuy: hoiVien.soTienTichLuy,
            soThangLienTuc: hoiVien.soThangLienTuc,
            soBuoiTapDaTap: hoiVien.soBuoiTapDaTap,
            ngayDatHang: hoiVien.ngayDatHang
        };
    } catch (error) {
        throw error;
    }
};

// Lấy danh sách hội viên theo hạng
const getHoiVienTheoHang = async (hangId) => {
    try {
        return await HoiVien.find({ hangHoiVien: hangId }).populate('hangHoiVien');
    } catch (error) {
        throw error;
    }
};

// Cập nhật hạng cho tất cả hội viên
const capNhatHangTatCaHoiVien = async () => {
    try {
        const hoiViens = await HoiVien.find();
        const results = [];

        for (const hoiVien of hoiViens) {
            try {
                const updatedHoiVien = await tinhHangHoiVien(hoiVien._id);
                results.push(updatedHoiVien);
            } catch (error) {
                console.error(`Lỗi cập nhật hạng cho hội viên ${hoiVien._id}:`, error);
            }
        }

        return results;
    } catch (error) {
        throw error;
    }
};

// Lấy thống kê hạng hội viên
const getThongKeHangHoiVien = async () => {
    try {
        const stats = await HoiVien.aggregate([
            {
                $lookup: {
                    from: 'hanghoiviens',
                    localField: 'hangHoiVien',
                    foreignField: '_id',
                    as: 'hangHoiVien'
                }
            },
            {
                $unwind: {
                    path: '$hangHoiVien',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $group: {
                    _id: '$hangHoiVien.tenHang',
                    tenHang: { $first: '$hangHoiVien.tenHienThi' },
                    mauSac: { $first: '$hangHoiVien.mauSac' },
                    soLuong: { $sum: 1 },
                    tongTienTichLuy: { $sum: '$soTienTichLuy' }
                }
            },
            {
                $sort: { '_id': 1 }
            }
        ]);

        return stats;
    } catch (error) {
        throw error;
    }
};

// Thêm logic tính hạng hội viên dựa trên thời hạn đăng ký
const tinhHangHoiVienTheoThoiHan = async (userId) => {
    try {
        const user = await HoiVien.findById(userId);
        if (!user) {
            throw new Error('Không tìm thấy người dùng');
        }

        const { ngayBatDau, ngayKetThuc } = user;
        if (!ngayBatDau || !ngayKetThuc) {
            throw new Error('Người dùng chưa có thông tin thời hạn đăng ký');
        }

        const now = new Date();
        const startDate = new Date(ngayBatDau);
        const endDate = new Date(ngayKetThuc);

        let hangHoiVien;
        if (now < startDate) {
            hangHoiVien = 'Chưa kích hoạt';
        } else if (now >= startDate && now <= endDate) {
            hangHoiVien = 'Đang hoạt động';
        } else {
            hangHoiVien = 'Hết hạn';
        }

        user.hangHoiVien = hangHoiVien;
        user.ngayDatHang = new Date();
        await user.save();

        return { userId, hangHoiVien, ngayDatHang: user.ngayDatHang };
    } catch (error) {
        console.error('Lỗi tính hạng hội viên:', error);
        throw error;
    }
};

// Thêm logic tính thời gian còn lại của hạng hội viên
const tinhThoiGianConLai = async (userId) => {
    try {
        // Validate userId as a valid ObjectId
        if (!mongoose.isValidObjectId(userId)) {
            throw new Error('userId không hợp lệ');
        }

        const user = await HoiVien.findById(userId);
        if (!user) {
            throw new Error('Không tìm thấy người dùng');
        }

        const { ngayHetHan } = user;
        if (!ngayHetHan) {
            return {
                userId,
                timeRemaining: 0,
                message: 'Chưa có thông tin thời hạn thành viên'
            };
        }

        const now = new Date();
        const endDate = new Date(ngayHetHan);
        const timeRemaining = Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)));

        return { userId, timeRemaining };
    } catch (error) {
        console.error('Lỗi tính thời gian còn lại:', error);
        throw error;
    }
};

module.exports = {
    createHangHoiVien,
    getAllHangHoiVien,
    getHangHoiVienById,
    updateHangHoiVien,
    deleteHangHoiVien,
    tinhHangHoiVien,
    getHangHoiVienCuaHoiVien,
    getHoiVienTheoHang,
    capNhatHangTatCaHoiVien,
    getThongKeHangHoiVien,
    tinhHangHoiVienTheoThoiHan,
    tinhThoiGianConLai
};
