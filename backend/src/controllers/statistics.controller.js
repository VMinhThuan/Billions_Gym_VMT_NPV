const { HoiVien } = require('../models/NguoiDung');
const PT = require('../models/NguoiDung').PT;
const ChiNhanh = require('../models/ChiNhanh');
const ChiTietGoiTap = require('../models/ChiTietGoiTap');
const DangKyGoiTap = require('../models/DangKyGoiTap');
const GoiTap = require('../models/GoiTap');
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
        // Debug: Đếm tổng số record trong ChiTietGoiTap
        const totalCount = await ChiTietGoiTap.countDocuments({});
        console.log(`[getPackageStats] Tổng số ChiTietGoiTap: ${totalCount}`);

        // Đếm số record với các trạng thái khác nhau
        const countByPaymentStatus = await ChiTietGoiTap.aggregate([
            { $group: { _id: '$trangThaiThanhToan', count: { $sum: 1 } } }
        ]);
        console.log('[getPackageStats] Số lượng theo trangThaiThanhToan:', countByPaymentStatus);

        const countByRegistrationStatus = await ChiTietGoiTap.aggregate([
            { $group: { _id: '$trangThaiDangKy', count: { $sum: 1 } } }
        ]);
        console.log('[getPackageStats] Số lượng theo trangThaiDangKy:', countByRegistrationStatus);

        const countByUsageStatus = await ChiTietGoiTap.aggregate([
            { $group: { _id: '$trangThaiSuDung', count: { $sum: 1 } } }
        ]);
        console.log('[getPackageStats] Số lượng theo trangThaiSuDung:', countByUsageStatus);

        // Lấy tất cả các gói tập đã đăng ký
        // Thử lấy với điều kiện trước, nếu không có thì lấy tất cả
        let statusCondition = {
            $or: [
                { trangThaiThanhToan: 'DA_THANH_TOAN' },
                { trangThaiDangKy: 'HOAN_THANH' },
                { trangThaiSuDung: { $in: ['DANG_HOAT_DONG', 'DANG_SU_DUNG'] } }
            ]
        };

        // Kiểm tra xem có record nào thỏa điều kiện không
        const countWithCondition = await ChiTietGoiTap.countDocuments(statusCondition);
        console.log(`[getPackageStats] Số record thỏa điều kiện trạng thái: ${countWithCondition}`);

        // Xây dựng điều kiện match cuối cùng
        let finalMatchCondition = {
            // Đảm bảo có goiTapId hoặc maGoiTap (legacy field)
            $or: [
                { goiTapId: { $exists: true, $ne: null } },
                { maGoiTap: { $exists: true, $ne: null } }
            ]
        };

        // Nếu có record thỏa điều kiện trạng thái, thêm vào điều kiện
        if (countWithCondition > 0) {
            finalMatchCondition = {
                $and: [
                    statusCondition,
                    {
                        $or: [
                            { goiTapId: { $exists: true, $ne: null } },
                            { maGoiTap: { $exists: true, $ne: null } }
                        ]
                    }
                ]
            };
        } else if (totalCount > 0) {
            console.log('[getPackageStats] Không có record thỏa điều kiện trạng thái, lấy tất cả các gói tập có goiTapId/maGoiTap');
            // Giữ nguyên điều kiện chỉ kiểm tra goiTapId/maGoiTap
        }

        // Thay vì dùng aggregate (dễ bị lỗi do reference cũ), sử dụng find + populate rồi tự group
        const packageRecords = await ChiTietGoiTap.find(finalMatchCondition)
            .populate('goiTapId')
            .populate('maGoiTap')
            .lean();

        console.log(`[getPackageStats] Số bản ghi sau khi find: ${packageRecords.length}`);
        if (packageRecords.length > 0) {
            console.log('[getPackageStats] Mẫu bản ghi:', JSON.stringify(packageRecords[0], null, 2));
        }

        const packageStatsMap = {};

        for (const record of packageRecords) {
            const goiTapInfo = record.goiTapId || record.maGoiTap;
            if (!goiTapInfo) {
                console.log('[getPackageStats] Bỏ qua record vì không có goiTap:', record._id);
                continue;
            }

            const key = goiTapInfo._id.toString();
            if (!packageStatsMap[key]) {
                packageStatsMap[key] = {
                    _id: goiTapInfo._id,
                    goiTap: goiTapInfo,
                    soLuongDangKy: 0,
                    doanhThu: 0
                };
            }

            packageStatsMap[key].soLuongDangKy += 1;
            const thanhToan = record.soTienThanhToan || 0;
            const giaGoc = record.giaGoiTapGoc || 0;
            packageStatsMap[key].doanhThu += thanhToan > 0 ? thanhToan : giaGoc;
        }

        const packageStats = Object.values(packageStatsMap).sort((a, b) => b.soLuongDangKy - a.soLuongDangKy);

        console.log(`[getPackageStats] Số gói tập sau khi group: ${packageStats.length}`);
        if (packageStats.length > 0) {
            console.log('[getPackageStats] Mẫu dữ liệu sau group:', JSON.stringify(packageStats[0], null, 2));
        }

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
                tongSoDangKy: totalRegistrations || 0,
                theoGoiTap: statsWithPercentage || [],
                goiPhobienNhat: statsWithPercentage && statsWithPercentage.length > 0 ? statsWithPercentage[0] : null
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

// ------------------------------------------------------------------
// Helper builders for advanced statistics
// ------------------------------------------------------------------

const addNormalizedDateStage = {
    $addFields: {
        ngayDangKyChuan: {
            $ifNull: ['$thoiGianDangKy', { $ifNull: ['$ngayDangKy', '$createdAt'] }]
        }
    }
};

const registrationStatusFilter = {
    $or: [
        { trangThaiThanhToan: 'DA_THANH_TOAN' },
        { trangThaiDangKy: 'HOAN_THANH' }
    ]
};

const aggregateRegistrationsByBranch = async (startDate, endDate) => {
    const match = {
        branchId: { $ne: null },
        ...registrationStatusFilter
    };

    if (startDate || endDate) {
        match.ngayDangKyChuan = {};
        if (startDate) match.ngayDangKyChuan.$gte = startDate;
        if (endDate) match.ngayDangKyChuan.$lte = endDate;
    }

    return ChiTietGoiTap.aggregate([
        addNormalizedDateStage,
        { $match: match },
        {
            $group: {
                _id: '$branchId',
                total: { $sum: 1 }
            }
        }
    ]);
};

const buildBranchRegistrationStats = async () => {
    try {
        const now = new Date();
        const currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

        const [currentAgg, prevAgg, branches] = await Promise.all([
            aggregateRegistrationsByBranch(currentStart),
            aggregateRegistrationsByBranch(prevStart, prevEnd),
            ChiNhanh.find({}, 'tenChiNhanh').lean()
        ]);

        const branchNameMap = new Map(branches.map(branch => [branch._id.toString(), branch.tenChiNhanh]));
        const prevMap = new Map(prevAgg.map(item => [item._id?.toString(), item.total]));

        const data = currentAgg.map(item => {
            const branchId = item._id?.toString();
            const previousTotal = prevMap.get(branchId) || 0;
            const changePercent = previousTotal === 0
                ? (item.total > 0 ? 100 : 0)
                : Number((((item.total - previousTotal) / previousTotal) * 100).toFixed(1));
            const trend = item.total === previousTotal ? 'flat' : item.total > previousTotal ? 'up' : 'down';

            return {
                branchId,
                branchName: branchNameMap.get(branchId) || 'Chưa gán chi nhánh',
                total: item.total,
                previousTotal,
                changePercent,
                trend
            };
        });

        prevAgg.forEach(item => {
            const branchId = item._id?.toString();
            if (!data.find(d => d.branchId === branchId)) {
                data.push({
                    branchId,
                    branchName: branchNameMap.get(branchId) || 'Chưa gán chi nhánh',
                    total: 0,
                    previousTotal: item.total,
                    changePercent: item.total > 0 ? -100 : 0,
                    trend: item.total > 0 ? 'down' : 'flat'
                });
            }
        });

        return data.sort((a, b) => b.total - a.total);
    } catch (error) {
        console.error('Error building branch registration stats:', error);
        return [];
    }
};

const aggregateRenewCounts = async (startDate, endDate) => {
    const match = {
        goiTapId: { $ne: null },
        $or: [
            { isUpgrade: true },
            { soTienBu: { $gt: 0 } }
        ]
    };

    if (startDate || endDate) {
        match.createdAt = {};
        if (startDate) match.createdAt.$gte = startDate;
        if (endDate) match.createdAt.$lte = endDate;
    }

    return ChiTietGoiTap.aggregate([
        { $match: match },
        {
            $group: {
                _id: '$goiTapId',
                total: { $sum: 1 }
            }
        }
    ]);
};

const buildRenewPackageStats = async () => {
    try {
        const now = new Date();
        const currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

        let currentAgg = await aggregateRenewCounts(currentStart);
        const prevAgg = await aggregateRenewCounts(prevStart, prevEnd);

        if (!currentAgg.length) {
            currentAgg = await aggregateRenewCounts();
        }

        const packageIds = Array.from(new Set([
            ...currentAgg.map(item => item._id?.toString()),
            ...prevAgg.map(item => item._id?.toString())
        ])).filter(Boolean);

        const goiTaps = await GoiTap.find({ _id: { $in: packageIds } }, 'tenGoiTap').lean();
        const packageNameMap = new Map(goiTaps.map(pkg => [pkg._id.toString(), pkg.tenGoiTap]));
        const prevMap = new Map(prevAgg.map(item => [item._id?.toString(), item.total]));

        const data = currentAgg
            .map(item => {
                const packageId = item._id?.toString();
                const previousTotal = prevMap.get(packageId) || 0;
                const changePercent = previousTotal === 0
                    ? (item.total > 0 ? 100 : 0)
                    : Number((((item.total - previousTotal) / previousTotal) * 100).toFixed(1));
                const trend = item.total === previousTotal ? 'flat' : item.total > previousTotal ? 'up' : 'down';

                return {
                    packageId,
                    packageName: packageNameMap.get(packageId) || 'Gói tập chưa xác định',
                    renewCount: item.total,
                    previousCount: previousTotal,
                    changePercent,
                    trend
                };
            })
            .sort((a, b) => b.renewCount - a.renewCount)
            .slice(0, 6);

        return data;
    } catch (error) {
        console.error('Error building renew package stats:', error);
        return [];
    }
};

const buildConversionStats = async () => {
    try {
        const trialPackages = await GoiTap.find({
            $or: [
                { tenGoiTap: { $regex: /trải nghiệm/i } },
                { donViThoiHan: 'Ngay', thoiHan: { $lte: 7 } }
            ]
        }).select('_id').lean();

        if (!trialPackages.length) {
            return {
                totalTrials: 0,
                converted: 0,
                conversionRate: 0,
                previousRate: 0,
                changePercent: 0,
                trend: 'flat'
            };
        }

        const trialIds = trialPackages.map(pkg => pkg._id);
        const now = new Date();
        const currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        const historyStart = prevStart;

        const trialRecords = await ChiTietGoiTap.find({
            goiTapId: { $in: trialIds },
            trangThaiThanhToan: 'DA_THANH_TOAN',
            createdAt: { $gte: historyStart }
        }).select('nguoiDungId createdAt').lean();

        const trialUserIds = Array.from(new Set(trialRecords.map(record => record.nguoiDungId?.toString()).filter(Boolean)));

        if (!trialUserIds.length) {
            return {
                totalTrials: 0,
                converted: 0,
                conversionRate: 0,
                previousRate: 0,
                changePercent: 0,
                trend: 'flat'
            };
        }

        const nonTrialRecords = await ChiTietGoiTap.find({
            goiTapId: { $nin: trialIds },
            trangThaiThanhToan: 'DA_THANH_TOAN',
            nguoiDungId: { $in: trialUserIds },
            createdAt: { $gte: historyStart }
        }).select('nguoiDungId createdAt').lean();

        const calculatePeriodStats = (start, end) => {
            const trialMap = new Map();
            trialRecords.forEach(record => {
                const userId = record.nguoiDungId?.toString();
                if (!userId || !record.createdAt) return;
                if (record.createdAt >= start && record.createdAt <= end) {
                    const existing = trialMap.get(userId);
                    if (!existing || existing > record.createdAt) {
                        trialMap.set(userId, record.createdAt);
                    }
                }
            });

            const convertedUsers = new Set();
            nonTrialRecords.forEach(record => {
                const userId = record.nguoiDungId?.toString();
                const trialDate = trialMap.get(userId);
                if (!userId || !record.createdAt || !trialDate) return;
                if (record.createdAt >= trialDate && record.createdAt <= end) {
                    convertedUsers.add(userId);
                }
            });

            return {
                totalTrials: trialMap.size,
                converted: convertedUsers.size
            };
        };

        const currentStats = calculatePeriodStats(currentStart, now);
        const previousStats = calculatePeriodStats(prevStart, prevEnd);

        const conversionRate = currentStats.totalTrials > 0
            ? Number(((currentStats.converted / currentStats.totalTrials) * 100).toFixed(1))
            : 0;
        const previousRate = previousStats.totalTrials > 0
            ? Number(((previousStats.converted / previousStats.totalTrials) * 100).toFixed(1))
            : 0;

        const changePercent = previousRate === 0
            ? (conversionRate > 0 ? 100 : 0)
            : Number(((conversionRate - previousRate) / previousRate * 100).toFixed(1));
        const trend = conversionRate === previousRate ? 'flat' : conversionRate > previousRate ? 'up' : 'down';

        return {
            totalTrials: currentStats.totalTrials,
            converted: currentStats.converted,
            conversionRate,
            previousRate,
            changePercent,
            trend
        };
    } catch (error) {
        console.error('Error building conversion stats:', error);
        return {
            totalTrials: 0,
            converted: 0,
            conversionRate: 0,
            previousRate: 0,
            changePercent: 0,
            trend: 'flat'
        };
    }
};

const buildAgeDistributionStats = async () => {
    try {
        const members = await HoiVien.find({ ngaySinh: { $ne: null } }).select('ngaySinh').lean();
        const buckets = {
            'Dưới 18': 0,
            '18-25': 0,
            '25-35': 0,
            '35-45': 0,
            '45+': 0
        };
        const now = new Date();

        members.forEach(member => {
            if (!member.ngaySinh) return;
            const age = Math.floor((now - member.ngaySinh) / (1000 * 60 * 60 * 24 * 365.25));
            if (age < 18) buckets['Dưới 18'] += 1;
            else if (age < 25) buckets['18-25'] += 1;
            else if (age < 35) buckets['25-35'] += 1;
            else if (age < 45) buckets['35-45'] += 1;
            else buckets['45+'] += 1;
        });

        const total = Object.values(buckets).reduce((sum, value) => sum + value, 0) || 1;

        return Object.entries(buckets).map(([group, count]) => ({
            group,
            count,
            percentage: Number(((count / total) * 100).toFixed(1))
        }));
    } catch (error) {
        console.error('Error building age distribution stats:', error);
        return [];
    }
};

const buildPackageDurationRevenueStats = async () => {
    try {
        const data = await ChiTietGoiTap.aggregate([
            {
                $lookup: {
                    from: 'goiTaps',
                    localField: 'goiTapId',
                    foreignField: '_id',
                    as: 'goiTap'
                }
            },
            { $unwind: '$goiTap' },
            {
                $addFields: {
                    durationMonths: {
                        $switch: {
                            branches: [
                                { case: { $eq: ['$goiTap.donViThoiHan', 'Thang'] }, then: '$goiTap.thoiHan' },
                                {
                                    case: { $eq: ['$goiTap.donViThoiHan', 'Nam'] },
                                    then: { $multiply: ['$goiTap.thoiHan', 12] }
                                },
                                {
                                    case: { $eq: ['$goiTap.donViThoiHan', 'Ngay'] },
                                    then: { $divide: ['$goiTap.thoiHan', 30] }
                                }
                            ],
                            default: 1
                        }
                    }
                }
            },
            {
                $addFields: {
                    durationLabel: {
                        $switch: {
                            branches: [
                                { case: { $lte: ['$durationMonths', 1.5] }, then: '1 tháng' },
                                {
                                    case: { $and: [{ $gt: ['$durationMonths', 1.5] }, { $lte: ['$durationMonths', 3.5] }] },
                                    then: '3 tháng'
                                },
                                {
                                    case: { $and: [{ $gt: ['$durationMonths', 3.5] }, { $lte: ['$durationMonths', 6.5] }] },
                                    then: '6 tháng'
                                },
                                {
                                    case: { $and: [{ $gt: ['$durationMonths', 6.5] }, { $lte: ['$durationMonths', 13] }] },
                                    then: '12 tháng'
                                }
                            ],
                            default: 'Khác'
                        }
                    }
                }
            },
            {
                $group: {
                    _id: '$durationLabel',
                    revenue: {
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
                    registrations: { $sum: 1 }
                }
            },
            { $sort: { revenue: -1 } }
        ]);

        return data.map(item => ({
            duration: item._id || 'Khác',
            revenue: Math.round(item.revenue),
            registrations: item.registrations
        }));
    } catch (error) {
        console.error('Error building package duration revenue stats:', error);
        return [];
    }
};

const buildPeakHourStats = async () => {
    try {
        const now = new Date();
        const start = new Date(now);
        start.setDate(start.getDate() - 30);

        const data = await CheckInRecord.aggregate([
            { $match: { checkInTime: { $gte: start } } },
            {
                $addFields: {
                    localHour: {
                        $let: {
                            vars: {
                                parts: {
                                    $dateToParts: { date: '$checkInTime', timezone: 'Asia/Ho_Chi_Minh' }
                                }
                            },
                            in: '$$parts.hour'
                        }
                    }
                }
            },
            {
                $group: {
                    _id: '$localHour',
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        return data.map(item => {
            const hour = typeof item._id === 'number' ? item._id : 0;
            return {
                hour,
                label: `${String(hour).padStart(2, '0')}:00`,
                count: item.count
            };
        });
    } catch (error) {
        console.error('Error building peak hour stats:', error);
        return [];
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
            statusData,
            branchRegistrationData,
            renewPackageData,
            conversionData,
            ageDistributionData,
            durationRevenueData,
            peakHourData
        ] = await Promise.all([
            callStatsFunction(exports.getMemberStatsByBranch, {}),
            callStatsFunction(exports.getNewMemberStats, {}),
            callStatsFunction(exports.getExpiringPackages, {}),
            callStatsFunction(exports.getRevenueStats, { query: { period: 'month' } }),
            callStatsFunction(exports.getPackageStats, {}),
            callStatsFunction(exports.getPTStats, {}),
            callStatsFunction(exports.getCheckInStats, {}),
            callStatsFunction(exports.getMemberStatusStats, {}),
            buildBranchRegistrationStats(),
            buildRenewPackageStats(),
            buildConversionStats(),
            buildAgeDistributionStats(),
            buildPackageDurationRevenueStats(),
            buildPeakHourStats()
        ]);

        res.json({
            success: true,
            data: {
                hoiVienTheoChiNhanh: memberByBranchData || [],
                hoiVienMoi: newMemberData || {},
                goiSapHetHan: expiringData || {},
                doanhThu: revenueData || {},
                goiTap: packageData || { tongSoDangKy: 0, theoGoiTap: [], goiPhobienNhat: null },
                pt: ptData || {},
                checkIn: checkInData || {},
                trangThaiHoiVien: statusData || {},
                branchRegistrations: branchRegistrationData || [],
                renewPackages: renewPackageData || [],
                conversionStats: conversionData || {
                    totalTrials: 0,
                    converted: 0,
                    conversionRate: 0,
                    previousRate: 0,
                    changePercent: 0,
                    trend: 'flat'
                },
                ageDistribution: ageDistributionData || [],
                packageDurationRevenue: durationRevenueData || [],
                peakHours: peakHourData || []
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

