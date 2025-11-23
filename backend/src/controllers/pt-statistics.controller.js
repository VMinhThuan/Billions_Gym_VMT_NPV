const BuoiTap = require('../models/BuoiTap');
const { HoiVien } = require('../models/NguoiDung');
const Review = require('../models/Review');
const LichSuTap = require('../models/LichSuTap');
const PTAssignment = require('../models/PTAssignment');
const mongoose = require('mongoose');

// Thống kê tổng quan cho PT
exports.getPTStatistics = async (req, res) => {
    try {
        const ptId = req.user.id;
        const { startDate, endDate } = req.query;

        let dateFilter = {};
        if (startDate && endDate) {
            dateFilter = {
                ngayTap: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            };
        }

        // Tổng số học viên
        const buoiTaps = await BuoiTap.find({ ptPhuTrach: ptId, ...dateFilter })
            .select('danhSachHoiVien');

        const uniqueHoiVienIds = new Set();
        buoiTaps.forEach(buoiTap => {
            buoiTap.danhSachHoiVien.forEach(member => {
                uniqueHoiVienIds.add(member.hoiVien.toString());
            });
        });
        const tongHoiVien = uniqueHoiVienIds.size;

        // Tổng số buổi tập
        const tongBuoiTap = await BuoiTap.countDocuments({
            ptPhuTrach: ptId,
            ...dateFilter
        });

        // Buổi tập hoàn thành
        const buoiTapHoanThanh = await BuoiTap.countDocuments({
            ptPhuTrach: ptId,
            trangThai: 'HOAN_THANH',
            ...dateFilter
        });

        // Tổng số học viên tham gia
        let tongHoiVienThamGia = 0;
        buoiTaps.forEach(buoiTap => {
            const thamGia = buoiTap.danhSachHoiVien.filter(
                m => m.trangThai === 'DA_THAM_GIA'
            ).length;
            tongHoiVienThamGia += thamGia;
        });

        // Tổng số học viên vắng mặt
        let tongHoiVienVangMat = 0;
        buoiTaps.forEach(buoiTap => {
            const vangMat = buoiTap.danhSachHoiVien.filter(
                m => m.trangThai === 'VANG_MAT'
            ).length;
            tongHoiVienVangMat += vangMat;
        });

        // Tính tỷ lệ tham gia
        const tyLeThamGia = tongBuoiTap > 0
            ? ((tongHoiVienThamGia / (tongHoiVienThamGia + tongHoiVienVangMat)) * 100).toFixed(1)
            : 0;

        // Rating trung bình (từ reviews của học viên)
        const reviews = await Review.find({})
            .populate('hoiVienId')
            .lean();

        // Lọc reviews từ học viên của PT này
        const ptStudentIds = Array.from(uniqueHoiVienIds);
        const ptReviews = reviews.filter(review =>
            ptStudentIds.includes(review.hoiVienId?._id?.toString())
        );

        const ratingTrungBinh = ptReviews.length > 0
            ? (ptReviews.reduce((sum, r) => sum + r.rating, 0) / ptReviews.length).toFixed(1)
            : 0;

        res.json({
            success: true,
            data: {
                tongHoiVien,
                tongBuoiTap,
                buoiTapHoanThanh,
                tongHoiVienThamGia,
                tongHoiVienVangMat,
                tyLeThamGia: parseFloat(tyLeThamGia),
                ratingTrungBinh: parseFloat(ratingTrungBinh),
                tongReview: ptReviews.length
            }
        });
    } catch (err) {
        console.error('Error in getPTStatistics:', err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

// Thống kê học viên theo thời gian
exports.getStudentStatistics = async (req, res) => {
    try {
        const ptId = req.user.id;
        const { period = 'month' } = req.query; // week, month, year

        const now = new Date();
        let startDate = new Date();

        switch (period) {
            case 'week':
                startDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(now.getMonth() - 1);
                break;
            case 'year':
                startDate.setFullYear(now.getFullYear() - 1);
                break;
            default:
                startDate.setMonth(now.getMonth() - 1);
        }

        // Lấy buổi tập trong khoảng thời gian
        const buoiTaps = await BuoiTap.find({
            ptPhuTrach: ptId,
            ngayTap: { $gte: startDate, $lte: now }
        }).select('ngayTap danhSachHoiVien');

        // Nhóm theo ngày
        const statsByDate = {};
        buoiTaps.forEach(buoiTap => {
            const dateKey = buoiTap.ngayTap.toISOString().split('T')[0];
            if (!statsByDate[dateKey]) {
                statsByDate[dateKey] = {
                    date: dateKey,
                    soHoiVien: new Set(),
                    soBuoiTap: 0
                };
            }
            statsByDate[dateKey].soBuoiTap++;
            buoiTap.danhSachHoiVien.forEach(member => {
                statsByDate[dateKey].soHoiVien.add(member.hoiVien.toString());
            });
        });

        // Convert Set to number
        Object.keys(statsByDate).forEach(key => {
            statsByDate[key].soHoiVien = statsByDate[key].soHoiVien.size;
        });

        res.json({
            success: true,
            data: Object.values(statsByDate).sort((a, b) =>
                new Date(a.date) - new Date(b.date)
            )
        });
    } catch (err) {
        console.error('Error in getStudentStatistics:', err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

// Thống kê buổi tập theo thời gian
exports.getSessionStatistics = async (req, res) => {
    try {
        const ptId = req.user.id;
        const { period = 'month' } = req.query;

        const now = new Date();
        let startDate = new Date();

        switch (period) {
            case 'week':
                startDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(now.getMonth() - 1);
                break;
            case 'year':
                startDate.setFullYear(now.getFullYear() - 1);
                break;
            default:
                startDate.setMonth(now.getMonth() - 1);
        }

        const buoiTaps = await BuoiTap.find({
            ptPhuTrach: ptId,
            ngayTap: { $gte: startDate, $lte: now }
        }).select('ngayTap trangThai');

        // Nhóm theo trạng thái
        const statsByStatus = {
            CHUAN_BI: 0,
            DANG_DIEN_RA: 0,
            HOAN_THANH: 0,
            HUY: 0
        };

        buoiTaps.forEach(buoiTap => {
            if (statsByStatus.hasOwnProperty(buoiTap.trangThai)) {
                statsByStatus[buoiTap.trangThai]++;
            }
        });

        res.json({
            success: true,
            data: statsByStatus
        });
    } catch (err) {
        console.error('Error in getSessionStatistics:', err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

