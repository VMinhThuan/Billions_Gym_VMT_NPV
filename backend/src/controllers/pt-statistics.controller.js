const BuoiTap = require('../models/BuoiTap');
const { HoiVien } = require('../models/NguoiDung');
const SessionReview = require('../models/SessionReview');
const LichSuTap = require('../models/LichSuTap');
const PTAssignment = require('../models/PTAssignment');
const ChiTietGoiTap = require('../models/ChiTietGoiTap');
const CheckInRecord = require('../models/CheckInRecord');
const PTCheckInRecord = require('../models/PTCheckInRecord');
const mongoose = require('mongoose');

// Thống kê tổng quan cho PT - TỐI ƯU CỰC ĐẠI
exports.getPTStatistics = async (req, res) => {
    const startTime = Date.now();
    const TIMEOUT_MS = 8000; // 8 giây timeout

    try {
        const ptIdRaw = req.user.id;
        const { startDate, endDate } = req.query;

        // Convert sang ObjectId - ptPhuTrach trong database là ObjectId
        let ptIdObjectId;
        try {
            ptIdObjectId = new mongoose.Types.ObjectId(ptIdRaw);
        } catch (err) {
            console.error('[getPTStatistics] Invalid PT ID:', ptIdRaw);
            return res.status(400).json({
                success: false,
                message: 'PT ID không hợp lệ'
            });
        }

        console.log('[getPTStatistics] PT ID:', ptIdRaw, 'Type:', typeof ptIdRaw);
        console.log('[getPTStatistics] PT ObjectId:', ptIdObjectId.toString());

        let dateFilter = {};
        if (startDate && endDate) {
            dateFilter = {
                ngayTap: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            };
        }

        // Match filter - ptPhuTrach là ObjectId trong database
        const matchFilter = {
            ptPhuTrach: ptIdObjectId,
            ...dateFilter
        };

        console.log('[getPTStatistics] Match filter:', {
            ptPhuTrach: ptIdObjectId,
            ptPhuTrachType: ptIdObjectId.constructor.name,
            dateFilter: dateFilter
        });

        // TỐI ƯU CỰC ĐẠI: Chỉ dùng countDocuments - nhanh nhất, không dùng aggregation phức tạp
        const createTimeoutPromise = (ms) => new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Query timeout')), ms)
        );

        // Query các thống kê cơ bản với timeout ngắn
        const [tongBuoiTap, buoiTapHoanThanh, buoiTapsSample] = await Promise.race([
            Promise.all([
                Promise.race([
                    BuoiTap.countDocuments(matchFilter).maxTimeMS(5000),
                    createTimeoutPromise(5000)
                ]).catch((err) => {
                    console.warn('[getPTStatistics] Count total error:', err.message);
                    return 0;
                }),
                Promise.race([
                    BuoiTap.countDocuments({
                        ptPhuTrach: ptIdObjectId,
                        trangThai: 'HOAN_THANH',
                        ...dateFilter
                    }).maxTimeMS(5000),
                    createTimeoutPromise(5000)
                ]).catch((err) => {
                    console.warn('[getPTStatistics] Count completed error:', err.message);
                    return 0;
                }),
                // Lấy sample buổi tập để đếm học viên (giới hạn 1000 để có đủ dữ liệu)
                Promise.race([
                    BuoiTap.find(matchFilter)
                        .select('danhSachHoiVien')
                        .limit(1000)
                        .lean()
                        .maxTimeMS(5000),
                    createTimeoutPromise(5000)
                ]).catch((err) => {
                    console.warn('[getPTStatistics] Find sample error:', err.message);
                    return [];
                })
            ]),
            createTimeoutPromise(8000)
        ]).catch((err) => {
            console.error('[getPTStatistics] Promise race error:', err.message);
            return [0, 0, []];
        });

        console.log('[getPTStatistics] Query results:', {
            tongBuoiTap,
            buoiTapHoanThanh,
            buoiTapsSampleCount: buoiTapsSample.length
        });

        // Đếm học viên từ sample buổi tập
        const uniqueHoiVienIds = new Set();
        const tongHoiVienThamGia = { count: 0 };
        const tongHoiVienVangMat = { count: 0 };

        if (Array.isArray(buoiTapsSample)) {
            buoiTapsSample.forEach(buoiTap => {
                if (Array.isArray(buoiTap.danhSachHoiVien)) {
                    buoiTap.danhSachHoiVien.forEach(member => {
                        if (member.hoiVien) {
                            uniqueHoiVienIds.add(member.hoiVien.toString());
                            if (member.trangThai === 'DA_THAM_GIA') {
                                tongHoiVienThamGia.count++;
                            } else if (member.trangThai === 'VANG_MAT') {
                                tongHoiVienVangMat.count++;
                            }
                        }
                    });
                }
            });
        }

        const tongHoiVien = uniqueHoiVienIds.size;

        // Tính tỷ lệ tham gia
        const tyLeThamGia = tongBuoiTap > 0
            ? ((buoiTapHoanThanh / tongBuoiTap) * 100).toFixed(1)
            : 0;

        // Query rating trung bình với timeout ngắn (chỉ nếu có buổi tập)
        let ratingTrungBinh = 0;
        let tongReview = 0;

        if (tongBuoiTap > 0) {
            try {
                // Sửa: Không dùng maxTimeMS trên aggregate, dùng Promise.race với timeout
                const reviewStats = await Promise.race([
                    SessionReview.aggregate([
                        {
                            $lookup: {
                                from: 'buoitaps',
                                localField: 'buoiTapId',
                                foreignField: '_id',
                                as: 'buoiTap'
                            }
                        },
                        { $unwind: '$buoiTap' },
                        {
                            $match: {
                                'buoiTap.ptPhuTrach': ptIdObjectId,
                                ptRating: { $ne: null, $exists: true }
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                totalRating: { $sum: '$ptRating' },
                                count: { $sum: 1 }
                            }
                        }
                    ]),
                    createTimeoutPromise(3000)
                ]).catch(() => []);

                if (reviewStats && reviewStats.length > 0) {
                    tongReview = reviewStats[0].count || 0;
                    ratingTrungBinh = tongReview > 0 ? (reviewStats[0].totalRating / tongReview).toFixed(1) : 0;
                }
            } catch (err) {
                console.warn('[getPTStatistics] Review query timeout:', err.message);
            }
        }

        const elapsedTime = Date.now() - startTime;
        console.log(`[getPTStatistics] Hoàn thành sau ${elapsedTime}ms`);

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
                tongReview
            }
        });
    } catch (err) {
        const elapsedTime = Date.now() - startTime;
        console.error(`[getPTStatistics] ERROR sau ${elapsedTime}ms:`, err.message);
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

        // Lấy buổi tập trong khoảng thời gian - tối ưu với lean()
        const buoiTaps = await BuoiTap.find({
            ptPhuTrach: ptId,
            ngayTap: { $gte: startDate, $lte: now }
        })
            .select('ngayTap danhSachHoiVien')
            .lean();

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
        })
            .select('ngayTap trangThai')
            .lean();

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

// API tối ưu cực đại cho PT - chỉ lấy dữ liệu tối thiểu, timeout 10s
exports.getOverallStats = async (req, res) => {
    const startTime = Date.now();
    const TIMEOUT_MS = 10000; // 10 giây timeout - nghiêm ngặt hơn

    try {
        const ptId = req.user.id;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        // Tối ưu cực đại: Chỉ dùng countDocuments với timeout ngắn
        // Tạo timeout cho từng query
        const createTimeoutPromise = (ms) => new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Query timeout')), ms)
        );

        // Chỉ query 4 thống kê cơ bản nhất, mỗi query timeout 3s
        const queryPromises = [
            Promise.race([
                BuoiTap.countDocuments({ ptPhuTrach: ptId }).maxTimeMS(3000),
                createTimeoutPromise(3000)
            ]).catch(() => 0),
            Promise.race([
                BuoiTap.countDocuments({ ptPhuTrach: ptId, trangThai: 'HOAN_THANH' }).maxTimeMS(3000),
                createTimeoutPromise(3000)
            ]).catch(() => 0),
            Promise.race([
                BuoiTap.countDocuments({ ptPhuTrach: ptId, ngayTap: { $gte: startOfMonth } }).maxTimeMS(3000),
                createTimeoutPromise(3000)
            ]).catch(() => 0),
            Promise.race([
                BuoiTap.countDocuments({ ptPhuTrach: ptId, ngayTap: { $gte: startOfLastMonth, $lte: endOfLastMonth } }).maxTimeMS(3000),
                createTimeoutPromise(3000)
            ]).catch(() => 0)
        ];

        // Race với timeout tổng thể
        const statsPromise = Promise.all(queryPromises);
        const timeoutPromise = createTimeoutPromise(TIMEOUT_MS);

        const results = await Promise.race([statsPromise, timeoutPromise]);

        const [
            tongBuoiTap,
            buoiTapHoanThanh,
            buoiTapThangNay,
            buoiTapThangTruoc
        ] = results;

        const elapsedTime = Date.now() - startTime;
        console.log(`[getPTOverallStats] Total time: ${elapsedTime}ms`);

        // Trả về dữ liệu tối thiểu - không query thêm gì
        res.json({
            success: true,
            data: {
                tongBuoiTap: tongBuoiTap || 0,
                buoiTapHoanThanh: buoiTapHoanThanh || 0,
                tongHoiVien: 0, // Không query để tăng tốc
                buoiTapThangNay: buoiTapThangNay || 0,
                buoiTapThangTruoc: buoiTapThangTruoc || 0,
                checkInThangNay: 0,
                checkInHomNay: 0,
                recentCheckIns: [],
                tyLeThamGia: tongBuoiTap > 0 ? ((buoiTapHoanThanh / tongBuoiTap) * 100).toFixed(1) : '0'
            }
        });
    } catch (error) {
        const elapsedTime = Date.now() - startTime;
        console.error(`[getPTOverallStats] Error after ${elapsedTime}ms:`, error.message);

        // Trả về dữ liệu mặc định ngay lập tức nếu timeout
        res.json({
            success: true,
            data: {
                tongBuoiTap: 0,
                buoiTapHoanThanh: 0,
                tongHoiVien: 0,
                buoiTapThangNay: 0,
                buoiTapThangTruoc: 0,
                checkInThangNay: 0,
                checkInHomNay: 0,
                recentCheckIns: [],
                tyLeThamGia: '0'
            }
        });
    }
};

