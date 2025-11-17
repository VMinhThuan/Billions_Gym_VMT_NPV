const { HoiVien } = require('../models/NguoiDung');
const PT = require('../models/NguoiDung').PT;
const ChiNhanh = require('../models/ChiNhanh');
const ChiTietGoiTap = require('../models/ChiTietGoiTap');
const DangKyGoiTap = require('../models/DangKyGoiTap');
const LichSuTap = require('../models/LichSuTap');
const CheckInRecord = require('../models/CheckInRecord');
const ThanhToan = require('../models/ThanhToan');
const LichHenPT = require('../models/LichHenPT');

// Thống kê số lượng hội viên theo từng chi nhánh
exports.getMemberStatsByBranch = async (req, res) => {
    try {
        const branches = await ChiNhanh.find().sort({ thuTu: 1 });

        const stats = await Promise.all(
            branches.map(async (branch) => {
                // Tìm hội viên có gói tập tại chi nhánh này
                const packages = await ChiTietGoiTap.find({
                    branchId: branch._id,
                    trangThaiThanhToan: 'DA_THANH_TOAN'
                }).distinct('nguoiDungId');

                const totalMembers = packages.length;

                // Đếm theo trạng thái
                const activeMembers = await HoiVien.countDocuments({
                    _id: { $in: packages },
                    trangThaiHoiVien: 'DANG_HOAT_DONG'
                });

                const pausedMembers = await HoiVien.countDocuments({
                    _id: { $in: packages },
                    trangThaiHoiVien: 'TAM_NGUNG'
                });

                const expiredMembers = await HoiVien.countDocuments({
                    _id: { $in: packages },
                    trangThaiHoiVien: 'HET_HAN'
                });

                return {
                    chiNhanh: {
                        _id: branch._id,
                        tenChiNhanh: branch.tenChiNhanh,
                        diaChi: branch.diaChi
                    },
                    tongSoHoiVien: totalMembers,
                    dangHoatDong: activeMembers,
                    tamNgung: pausedMembers,
                    hetHan: expiredMembers,
                    tyLe: totalMembers > 0 ? {
                        dangHoatDong: ((activeMembers / totalMembers) * 100).toFixed(1),
                        tamNgung: ((pausedMembers / totalMembers) * 100).toFixed(1),
                        hetHan: ((expiredMembers / totalMembers) * 100).toFixed(1)
                    } : { dangHoatDong: '0', tamNgung: '0', hetHan: '0' }
                };
            })
        );

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error in getMemberStatsByBranch:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thống kê hội viên theo chi nhánh',
            error: error.message
        });
    }
};

// Thống kê hội viên đăng ký mới (so sánh với ngày/tuần/tháng/năm trước)
exports.getNewMemberStats = async (req, res) => {
    try {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const thisWeekStart = new Date(today);
        thisWeekStart.setDate(today.getDate() - today.getDay());
        const lastWeekStart = new Date(thisWeekStart);
        lastWeekStart.setDate(lastWeekStart.getDate() - 7);
        const lastWeekEnd = new Date(thisWeekStart);
        lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);

        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

        const thisYearStart = new Date(now.getFullYear(), 0, 1);
        const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
        const lastYearEnd = new Date(now.getFullYear(), 0, 0);

        // Hôm nay
        const todayCount = await HoiVien.countDocuments({
            ngayThamGia: { $gte: today }
        });

        // Hôm qua
        const yesterdayCount = await HoiVien.countDocuments({
            ngayThamGia: { $gte: yesterday, $lt: today }
        });

        // Tuần này
        const thisWeekCount = await HoiVien.countDocuments({
            ngayThamGia: { $gte: thisWeekStart }
        });

        // Tuần trước
        const lastWeekCount = await HoiVien.countDocuments({
            ngayThamGia: { $gte: lastWeekStart, $lte: lastWeekEnd }
        });

        // Tháng này
        const thisMonthCount = await HoiVien.countDocuments({
            ngayThamGia: { $gte: thisMonthStart }
        });

        // Tháng trước
        const lastMonthCount = await HoiVien.countDocuments({
            ngayThamGia: { $gte: lastMonthStart, $lte: lastMonthEnd }
        });

        // Năm này
        const thisYearCount = await HoiVien.countDocuments({
            ngayThamGia: { $gte: thisYearStart }
        });

        // Năm trước
        const lastYearCount = await HoiVien.countDocuments({
            ngayThamGia: { $gte: lastYearStart, $lte: lastYearEnd }
        });

        // Tính phần trăm thay đổi
        const calculateChange = (current, previous) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return ((current - previous) / previous * 100).toFixed(1);
        };

        res.json({
            success: true,
            data: {
                homNay: {
                    soLuong: todayCount,
                    soSanh: yesterdayCount,
                    thayDoi: calculateChange(todayCount, yesterdayCount),
                    trend: todayCount >= yesterdayCount ? 'up' : 'down'
                },
                tuanNay: {
                    soLuong: thisWeekCount,
                    soSanh: lastWeekCount,
                    thayDoi: calculateChange(thisWeekCount, lastWeekCount),
                    trend: thisWeekCount >= lastWeekCount ? 'up' : 'down'
                },
                thangNay: {
                    soLuong: thisMonthCount,
                    soSanh: lastMonthCount,
                    thayDoi: calculateChange(thisMonthCount, lastMonthCount),
                    trend: thisMonthCount >= lastMonthCount ? 'up' : 'down'
                },
                namNay: {
                    soLuong: thisYearCount,
                    soSanh: lastYearCount,
                    thayDoi: calculateChange(thisYearCount, lastYearCount),
                    trend: thisYearCount >= lastYearCount ? 'up' : 'down'
                }
            }
        });
    } catch (error) {
        console.error('Error in getNewMemberStats:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thống kê hội viên mới',
            error: error.message
        });
    }
};

// Thống kê hội viên sắp hết hạn gói
exports.getExpiringPackages = async (req, res) => {
    try {
        const now = new Date();
        const in7Days = new Date(now);
        in7Days.setDate(in7Days.getDate() + 7);
        const in15Days = new Date(now);
        in15Days.setDate(in15Days.getDate() + 15);
        const in30Days = new Date(now);
        in30Days.setDate(in30Days.getDate() + 30);

        // Sắp hết hạn trong 7 ngày
        const expiringIn7Days = await ChiTietGoiTap.find({
            trangThaiThanhToan: 'DA_THANH_TOAN',
            $or: [
                { ngayKetThuc: { $gte: now, $lte: in7Days } },
                { ngayKetThuc: { $gte: now, $lte: in7Days } }
            ],
            trangThaiSuDung: { $in: ['DANG_HOAT_DONG', 'DANG_SU_DUNG'] }
        })
            .populate('nguoiDungId', 'hoTen sdt email')
            .populate('goiTapId', 'tenGoiTap')
            .populate('branchId', 'tenChiNhanh')
            .sort({ ngayKetThuc: 1 });

        // Sắp hết hạn trong 15 ngày
        const expiringIn15Days = await ChiTietGoiTap.find({
            trangThaiThanhToan: 'DA_THANH_TOAN',
            $or: [
                { ngayKetThuc: { $gte: in7Days, $lte: in15Days } },
                { ngayKetThuc: { $gte: in7Days, $lte: in15Days } }
            ],
            trangThaiSuDung: { $in: ['DANG_HOAT_DONG', 'DANG_SU_DUNG'] }
        })
            .populate('nguoiDungId', 'hoTen sdt email')
            .populate('goiTapId', 'tenGoiTap')
            .populate('branchId', 'tenChiNhanh')
            .sort({ ngayKetThuc: 1 });

        // Sắp hết hạn trong 30 ngày
        const expiringIn30Days = await ChiTietGoiTap.find({
            trangThaiThanhToan: 'DA_THANH_TOAN',
            $or: [
                { ngayKetThuc: { $gte: in15Days, $lte: in30Days } },
                { ngayKetThuc: { $gte: in15Days, $lte: in30Days } }
            ],
            trangThaiSuDung: { $in: ['DANG_HOAT_DONG', 'DANG_SU_DUNG'] }
        })
            .populate('nguoiDungId', 'hoTen sdt email')
            .populate('goiTapId', 'tenGoiTap')
            .populate('branchId', 'tenChiNhanh')
            .sort({ ngayKetThuc: 1 });

        res.json({
            success: true,
            data: {
                trong7Ngay: {
                    soLuong: expiringIn7Days.length,
                    danhSach: expiringIn7Days
                },
                trong15Ngay: {
                    soLuong: expiringIn15Days.length,
                    danhSach: expiringIn15Days
                },
                trong30Ngay: {
                    soLuong: expiringIn30Days.length,
                    danhSach: expiringIn30Days
                }
            }
        });
    } catch (error) {
        console.error('Error in getExpiringPackages:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thống kê gói sắp hết hạn',
            error: error.message
        });
    }
};

// Thống kê doanh thu
exports.getRevenueStats = async (req, res) => {
    try {
        const { period = 'month', branchId } = req.query;
        const now = new Date();
        let startDate, endDate, previousStart, previousEnd;

        // Xác định khoảng thời gian
        switch (period) {
            case 'day':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                endDate = new Date(startDate);
                endDate.setDate(endDate.getDate() + 1);
                previousStart = new Date(startDate);
                previousStart.setDate(previousStart.getDate() - 1);
                previousEnd = startDate;
                break;
            case 'week':
                startDate = new Date(now);
                startDate.setDate(startDate.getDate() - startDate.getDay());
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(startDate);
                endDate.setDate(endDate.getDate() + 7);
                previousStart = new Date(startDate);
                previousStart.setDate(previousStart.getDate() - 7);
                previousEnd = startDate;
                break;
            case 'month':
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                previousEnd = startDate;
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                endDate = new Date(now.getFullYear() + 1, 0, 1);
                previousStart = new Date(now.getFullYear() - 1, 0, 1);
                previousEnd = startDate;
                break;
        }

        // Build filter
        const filter = {
            trangThaiThanhToan: 'DA_THANH_TOAN',
            ngayDangKy: { $gte: startDate, $lt: endDate }
        };

        if (branchId) {
            filter.branchId = branchId;
        }

        const previousFilter = {
            trangThaiThanhToan: 'DA_THANH_TOAN',
            ngayDangKy: { $gte: previousStart, $lt: previousEnd }
        };

        if (branchId) {
            previousFilter.branchId = branchId;
        }

        // Doanh thu hiện tại
        const currentRevenue = await ChiTietGoiTap.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: null,
                    total: {
                        $sum: {
                            $cond: [
                                { $and: [{ $ne: ['$soTienThanhToan', null] }, { $ne: ['$soTienThanhToan', 0] }] },
                                '$soTienThanhToan',
                                {
                                    $cond: [
                                        { $and: [{ $ne: ['$giaGoiTapGoc', null] }, { $ne: ['$giaGoiTapGoc', 0] }] },
                                        '$giaGoiTapGoc',
                                        0
                                    ]
                                }
                            ]
                        }
                    },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Doanh thu kỳ trước
        const previousRevenue = await ChiTietGoiTap.aggregate([
            { $match: previousFilter },
            {
                $group: {
                    _id: null,
                    total: {
                        $sum: {
                            $cond: [
                                { $and: [{ $ne: ['$soTienThanhToan', null] }, { $ne: ['$soTienThanhToan', 0] }] },
                                '$soTienThanhToan',
                                {
                                    $cond: [
                                        { $and: [{ $ne: ['$giaGoiTapGoc', null] }, { $ne: ['$giaGoiTapGoc', 0] }] },
                                        '$giaGoiTapGoc',
                                        0
                                    ]
                                }
                            ]
                        }
                    },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Doanh thu theo chi nhánh
        const revenueByBranch = await ChiTietGoiTap.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: '$branchId',
                    total: {
                        $sum: {
                            $cond: [
                                { $and: [{ $ne: ['$soTienThanhToan', null] }, { $ne: ['$soTienThanhToan', 0] }] },
                                '$soTienThanhToan',
                                {
                                    $cond: [
                                        { $and: [{ $ne: ['$giaGoiTapGoc', null] }, { $ne: ['$giaGoiTapGoc', 0] }] },
                                        '$giaGoiTapGoc',
                                        0
                                    ]
                                }
                            ]
                        }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: 'chinhanhs',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'branch'
                }
            },
            { $unwind: { path: '$branch', preserveNullAndEmptyArrays: true } },
            { $sort: { total: -1 } }
        ]);

        const current = currentRevenue[0] || { total: 0, count: 0 };
        const previous = previousRevenue[0] || { total: 0, count: 0 };
        const change = previous.total > 0
            ? ((current.total - previous.total) / previous.total * 100).toFixed(1)
            : (current.total > 0 ? 100 : 0);

        res.json({
            success: true,
            data: {
                hienTai: {
                    doanhThu: current.total,
                    soLuong: current.count
                },
                kyTruoc: {
                    doanhThu: previous.total,
                    soLuong: previous.count
                },
                thayDoi: parseFloat(change),
                trend: current.total >= previous.total ? 'up' : 'down',
                theoChiNhanh: revenueByBranch
            }
        });
    } catch (error) {
        console.error('Error in getRevenueStats:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thống kê doanh thu',
            error: error.message
        });
    }
};

// Thống kê gói tập
exports.getPackageStats = async (req, res) => {
    try {
        const packageStats = await ChiTietGoiTap.aggregate([
            {
                $match: {
                    trangThaiThanhToan: 'DA_THANH_TOAN'
                }
            },
            {
                $group: {
                    _id: '$goiTapId',
                    soLuongDangKy: { $sum: 1 },
                    doanhThu: {
                        $sum: {
                            $cond: [
                                { $and: [{ $ne: ['$soTienThanhToan', null] }, { $ne: ['$soTienThanhToan', 0] }] },
                                '$soTienThanhToan',
                                {
                                    $cond: [
                                        { $and: [{ $ne: ['$giaGoiTapGoc', null] }, { $ne: ['$giaGoiTapGoc', 0] }] },
                                        '$giaGoiTapGoc',
                                        0
                                    ]
                                }
                            ]
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: 'goitaps',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'goiTap'
                }
            },
            { $unwind: '$goiTap' },
            { $sort: { soLuongDangKy: -1 } }
        ]);

        const totalRegistrations = packageStats.reduce((sum, item) => sum + item.soLuongDangKy, 0);

        const statsWithPercentage = packageStats.map(item => ({
            ...item,
            tyLe: totalRegistrations > 0
                ? ((item.soLuongDangKy / totalRegistrations) * 100).toFixed(1)
                : '0'
        }));

        res.json({
            success: true,
            data: {
                tongSoDangKy: totalRegistrations,
                theoGoiTap: statsWithPercentage,
                goiPhobienNhat: statsWithPercentage[0] || null
            }
        });
    } catch (error) {
        console.error('Error in getPackageStats:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thống kê gói tập',
            error: error.message
        });
    }
};

// Thống kê PT
exports.getPTStats = async (req, res) => {
    try {
        const totalPTs = await PT.countDocuments();
        const activePTs = await PT.countDocuments({ trangThaiPT: 'DANG_HOAT_DONG' });

        // Số học viên mỗi PT
        const ptWithStudents = await LichHenPT.aggregate([
            {
                $match: {
                    trangThaiLichHen: { $in: ['DA_XAC_NHAN', 'HOAN_THANH'] }
                }
            },
            {
                $group: {
                    _id: '$pt',
                    soHocVien: { $addToSet: '$hoiVien' }
                }
            },
            {
                $project: {
                    pt: '$_id',
                    soLuongHocVien: { $size: '$soHocVien' }
                }
            },
            {
                $lookup: {
                    from: 'nguoidungs',
                    localField: 'pt',
                    foreignField: '_id',
                    as: 'ptInfo'
                }
            },
            { $unwind: '$ptInfo' },
            { $sort: { soLuongHocVien: -1 } },
            { $limit: 10 }
        ]);

        res.json({
            success: true,
            data: {
                tongSoPT: totalPTs,
                dangHoatDong: activePTs,
                tamNgung: totalPTs - activePTs,
                topPT: ptWithStudents
            }
        });
    } catch (error) {
        console.error('Error in getPTStats:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thống kê PT',
            error: error.message
        });
    }
};

// Thống kê check-in
exports.getCheckInStats = async (req, res) => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        // Tổng số check-in tháng này
        const thisMonthCheckIns = await CheckInRecord.countDocuments({
            checkInTime: { $gte: startOfMonth }
        });

        // Tổng số check-in tháng trước
        const lastMonthCheckIns = await CheckInRecord.countDocuments({
            checkInTime: { $gte: startOfLastMonth, $lt: startOfMonth }
        });

        // Số hội viên đã check-in tháng này
        const uniqueMembersThisMonth = await CheckInRecord.distinct('hoiVien', {
            checkInTime: { $gte: startOfMonth }
        });

        // Tổng số hội viên
        const totalMembers = await HoiVien.countDocuments();

        // Check-in theo chi nhánh
        const checkInByBranch = await CheckInRecord.aggregate([
            {
                $match: {
                    checkInTime: { $gte: startOfMonth }
                }
            },
            {
                $lookup: {
                    from: 'buoitaps',
                    localField: 'buoiTap',
                    foreignField: '_id',
                    as: 'buoiTap'
                }
            },
            { $unwind: '$buoiTap' },
            {
                $lookup: {
                    from: 'chinhanhs',
                    localField: 'buoiTap.chiNhanh',
                    foreignField: '_id',
                    as: 'chiNhanh'
                }
            },
            { $unwind: { path: '$chiNhanh', preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: '$chiNhanh._id',
                    tenChiNhanh: { $first: '$chiNhanh.tenChiNhanh' },
                    soLuongCheckIn: { $sum: 1 },
                    soHoiVien: { $addToSet: '$hoiVien' }
                }
            },
            {
                $project: {
                    _id: 1,
                    tenChiNhanh: 1,
                    soLuongCheckIn: 1,
                    soLuongHoiVien: { $size: '$soHoiVien' }
                }
            },
            { $sort: { soLuongCheckIn: -1 } }
        ]);

        // Số buổi tập trung bình mỗi hội viên
        const avgSessionsPerMember = totalMembers > 0
            ? (thisMonthCheckIns / totalMembers).toFixed(2)
            : 0;

        // Tỷ lệ tham gia
        const participationRate = totalMembers > 0
            ? ((uniqueMembersThisMonth.length / totalMembers) * 100).toFixed(1)
            : 0;

        res.json({
            success: true,
            data: {
                thangNay: {
                    soLuongCheckIn: thisMonthCheckIns,
                    soHoiVien: uniqueMembersThisMonth.length,
                    tyLeThamGia: parseFloat(participationRate),
                    trungBinhMoiHoiVien: parseFloat(avgSessionsPerMember)
                },
                thangTruoc: {
                    soLuongCheckIn: lastMonthCheckIns
                },
                thayDoi: lastMonthCheckIns > 0
                    ? ((thisMonthCheckIns - lastMonthCheckIns) / lastMonthCheckIns * 100).toFixed(1)
                    : (thisMonthCheckIns > 0 ? 100 : 0),
                theoChiNhanh: checkInByBranch
            }
        });
    } catch (error) {
        console.error('Error in getCheckInStats:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thống kê check-in',
            error: error.message
        });
    }
};

// Thống kê trạng thái hội viên
exports.getMemberStatusStats = async (req, res) => {
    try {
        const stats = await HoiVien.aggregate([
            {
                $group: {
                    _id: '$trangThaiHoiVien',
                    soLuong: { $sum: 1 }
                }
            }
        ]);

        const total = await HoiVien.countDocuments();

        const statusMap = {
            'DANG_HOAT_DONG': 'Đang hoạt động',
            'TAM_NGUNG': 'Tạm ngưng',
            'HET_HAN': 'Hết hạn'
        };

        const formattedStats = stats.map(item => ({
            trangThai: item._id,
            tenTrangThai: statusMap[item._id] || item._id,
            soLuong: item.soLuong,
            tyLe: total > 0 ? ((item.soLuong / total) * 100).toFixed(1) : '0'
        }));

        res.json({
            success: true,
            data: {
                tongSo: total,
                chiTiet: formattedStats
            }
        });
    } catch (error) {
        console.error('Error in getMemberStatusStats:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thống kê trạng thái hội viên',
            error: error.message
        });
    }
};

// Helper function để gọi các hàm thống kê và lấy data
const callStatsFunction = async (fn, req) => {
    return new Promise((resolve, reject) => {
        const mockRes = {
            json: (data) => {
                if (data.success && data.data) {
                    resolve(data.data);
                } else {
                    resolve(null);
                }
            },
            status: (code) => ({
                json: (data) => {
                    if (code === 200 && data.success && data.data) {
                        resolve(data.data);
                    } else {
                        resolve(null);
                    }
                }
            })
        };
        fn(req, mockRes).catch((err) => {
            console.error('Error in stats function:', err);
            resolve(null);
        });
    });
};

// Tổng hợp tất cả thống kê
exports.getOverallStats = async (req, res) => {
    try {
        const [
            memberByBranchData,
            newMemberData,
            expiringData,
            revenueData,
            packageData,
            ptData,
            checkInData,
            statusData
        ] = await Promise.all([
            callStatsFunction(exports.getMemberStatsByBranch, {}),
            callStatsFunction(exports.getNewMemberStats, {}),
            callStatsFunction(exports.getExpiringPackages, {}),
            callStatsFunction(exports.getRevenueStats, { query: { period: 'month' } }),
            callStatsFunction(exports.getPackageStats, {}),
            callStatsFunction(exports.getPTStats, {}),
            callStatsFunction(exports.getCheckInStats, {}),
            callStatsFunction(exports.getMemberStatusStats, {})
        ]);

        res.json({
            success: true,
            data: {
                hoiVienTheoChiNhanh: memberByBranchData || [],
                hoiVienMoi: newMemberData || {},
                goiSapHetHan: expiringData || {},
                doanhThu: revenueData || {},
                goiTap: packageData || {},
                pt: ptData || {},
                checkIn: checkInData || {},
                trangThaiHoiVien: statusData || {}
            }
        });
    } catch (error) {
        console.error('Error in getOverallStats:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy tổng hợp thống kê',
            error: error.message
        });
    }
};

