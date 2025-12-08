const { HoiVien } = require('../models/NguoiDung');
const PT = require('../models/NguoiDung').PT;
const ChiNhanh = require('../models/ChiNhanh');
const ChiTietGoiTap = require('../models/ChiTietGoiTap');
const DangKyGoiTap = require('../models/DangKyGoiTap');
const GoiTap = require('../models/GoiTap');
const LichSuTap = require('../models/LichSuTap');
const CheckInRecord = require('../models/CheckInRecord');
const PTCheckInRecord = require('../models/PTCheckInRecord');
const ThanhToan = require('../models/ThanhToan');
const LichHenPT = require('../models/LichHenPT');

// Thống kê số lượng hội viên theo từng chi nhánh
exports.getMemberStatsByBranch = async (req, res) => {
    try {
        // Tối ưu: Dùng aggregation với limit để giảm dữ liệu xử lý
        const [branches, branchMemberMap] = await Promise.all([
            ChiNhanh.find().sort({ thuTu: 1 }).select('_id tenChiNhanh diaChi').lean(),
            ChiTietGoiTap.aggregate([
                {
                    $match: {
                        trangThaiThanhToan: 'DA_THANH_TOAN',
                        branchId: { $ne: null },
                        nguoiDungId: { $ne: null }
                    }
                },
                {
                    $group: {
                        _id: '$branchId',
                        memberIds: { $addToSet: '$nguoiDungId' }
                    }
                },
                { $limit: 50 } // Giới hạn số chi nhánh xử lý
            ])
        ]);

        // Lấy tất cả memberIds từ tất cả branches
        const allMemberIds = [];
        const branchIdToMemberIds = new Map();
        branchMemberMap.forEach(item => {
            const branchId = item._id?.toString();
            const memberIds = item.memberIds || [];
            if (branchId && memberIds.length > 0) {
                branchIdToMemberIds.set(branchId, memberIds);
                allMemberIds.push(...memberIds);
            }
        });

        // Query tất cả HoiVien 1 lần
        const members = await HoiVien.find({
            _id: { $in: allMemberIds }
        }).select('_id trangThaiHoiVien').lean();

        // Tạo map memberId -> trangThai
        const memberStatusMap = new Map();
        members.forEach(member => {
            memberStatusMap.set(member._id.toString(), member.trangThaiHoiVien);
        });

        // Tính toán stats cho mỗi branch
        const result = branches.map(branch => {
            const branchId = branch._id.toString();
            const memberIds = branchIdToMemberIds.get(branchId) || [];

            let activeMembers = 0;
            let pausedMembers = 0;
            let expiredMembers = 0;

            memberIds.forEach(memberId => {
                const status = memberStatusMap.get(memberId?.toString());
                if (status === 'DANG_HOAT_DONG') {
                    activeMembers++;
                } else if (status === 'TAM_NGUNG') {
                    pausedMembers++;
                } else if (status === 'HET_HAN') {
                    expiredMembers++;
                }
            });

            const totalMembers = memberIds.length;

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
        });

        res.json({
            success: true,
            data: result
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

        // Tối ưu: Dùng aggregation để đếm tất cả trong 1 query
        const stats = await HoiVien.aggregate([
            {
                $facet: {
                    today: [
                        { $match: { ngayThamGia: { $gte: today } } },
                        { $count: 'count' }
                    ],
                    yesterday: [
                        { $match: { ngayThamGia: { $gte: yesterday, $lt: today } } },
                        { $count: 'count' }
                    ],
                    thisWeek: [
                        { $match: { ngayThamGia: { $gte: thisWeekStart } } },
                        { $count: 'count' }
                    ],
                    lastWeek: [
                        { $match: { ngayThamGia: { $gte: lastWeekStart, $lte: lastWeekEnd } } },
                        { $count: 'count' }
                    ],
                    thisMonth: [
                        { $match: { ngayThamGia: { $gte: thisMonthStart } } },
                        { $count: 'count' }
                    ],
                    lastMonth: [
                        { $match: { ngayThamGia: { $gte: lastMonthStart, $lte: lastMonthEnd } } },
                        { $count: 'count' }
                    ],
                    thisYear: [
                        { $match: { ngayThamGia: { $gte: thisYearStart } } },
                        { $count: 'count' }
                    ],
                    lastYear: [
                        { $match: { ngayThamGia: { $gte: lastYearStart, $lte: lastYearEnd } } },
                        { $count: 'count' }
                    ]
                }
            }
        ]);

        const result = stats[0] || {};
        const todayCount = result.today?.[0]?.count || 0;
        const yesterdayCount = result.yesterday?.[0]?.count || 0;
        const thisWeekCount = result.thisWeek?.[0]?.count || 0;
        const lastWeekCount = result.lastWeek?.[0]?.count || 0;
        const thisMonthCount = result.thisMonth?.[0]?.count || 0;
        const lastMonthCount = result.lastMonth?.[0]?.count || 0;
        const thisYearCount = result.thisYear?.[0]?.count || 0;
        const lastYearCount = result.lastYear?.[0]?.count || 0;

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

// Thống kê hội viên sắp hết hạn gói (bao gồm cả đã hết hạn)
exports.getExpiringPackages = async (req, res) => {
    try {
        const now = new Date();
        const in7Days = new Date(now);
        in7Days.setDate(in7Days.getDate() + 7);
        const in15Days = new Date(now);
        in15Days.setDate(in15Days.getDate() + 15);
        const in30Days = new Date(now);
        in30Days.setDate(in30Days.getDate() + 30);
        const expired30DaysAgo = new Date(now);
        expired30DaysAgo.setDate(expired30DaysAgo.getDate() - 30);

        // Tối ưu: Giới hạn số lượng packages và chỉ lấy summary, không lấy danh sách chi tiết
        const [allPackages, allNewerPackages] = await Promise.all([
            ChiTietGoiTap.find({
                trangThaiThanhToan: 'DA_THANH_TOAN',
                ngayKetThuc: { $gte: expired30DaysAgo, $lte: in30Days }
            })
                .select('nguoiDungId maHoiVien goiTapId maGoiTap branchId ngayKetThuc')
                .populate('nguoiDungId', 'hoTen')
                .populate('maHoiVien', 'hoTen')
                .populate('goiTapId', 'tenGoiTap')
                .populate('maGoiTap', 'tenGoiTap')
                .populate('branchId', 'tenChiNhanh')
                .sort({ ngayKetThuc: 1 })
                .limit(500) // Giảm từ 1000 xuống 500
                .lean(),
            // Lấy tất cả packages mới hơn để check renewal status (chỉ cần userId và goiTapId)
            ChiTietGoiTap.find({
                trangThaiThanhToan: 'DA_THANH_TOAN',
                $or: [
                    { ngayDangKy: { $gte: expired30DaysAgo } },
                    { thoiGianDangKy: { $gte: expired30DaysAgo } }
                ]
            })
                .select('nguoiDungId maHoiVien goiTapId maGoiTap ngayDangKy thoiGianDangKy')
                .populate('goiTapId', '_id')
                .populate('maGoiTap', '_id')
                .lean()
        ]);

        // Tạo map để tra cứu nhanh: userId -> newest package info
        const newerPackagesMap = new Map();
        allNewerPackages.forEach(pkg => {
            const userId = pkg.nguoiDungId?.toString() || pkg.maHoiVien?.toString();
            if (!userId) return;

            const goiTapId = (pkg.goiTapId?._id || pkg.maGoiTap?._id)?.toString();
            const regDate = pkg.ngayDangKy || pkg.thoiGianDangKy;

            const existing = newerPackagesMap.get(userId);
            if (!existing || (regDate && existing.regDate < regDate)) {
                newerPackagesMap.set(userId, {
                    goiTapId,
                    regDate
                });
            }
        });

        // Xử lý renewal status cho mỗi package
        const packagesWithRenewalStatus = allPackages.map(pkg => {
            const userId = pkg.nguoiDungId?._id?.toString() || pkg.maHoiVien?._id?.toString();
            const oldGoiTapId = (pkg.goiTapId?._id || pkg.maGoiTap?._id)?.toString();

            let renewalStatus = 'CHUA_GIA_HAN';
            if (!userId) {
                renewalStatus = 'UNKNOWN';
            } else {
                const newerPkg = newerPackagesMap.get(userId);
                if (newerPkg && newerPkg.regDate > pkg.ngayKetThuc) {
                    if (newerPkg.goiTapId === oldGoiTapId) {
                        renewalStatus = 'DA_GIA_HAN';
                    } else {
                        renewalStatus = 'DA_DANG_KY_GOI_KHAC';
                    }
                }
            }

            return {
                ...pkg,
                renewalStatus
            };
        });

        // Phân loại theo thời gian - chỉ đếm số lượng, không trả về danh sách chi tiết để tăng tốc
        let expiringIn7DaysCount = 0;
        let expiringIn15DaysCount = 0;
        let expiringIn30DaysCount = 0;
        let expiredPackagesCount = 0;

        // Chỉ lấy 20 packages đầu tiên cho mỗi nhóm để hiển thị
        const expiringIn7Days = [];
        const expiringIn15Days = [];
        const expiringIn30Days = [];
        const expiredPackages = [];

        packagesWithRenewalStatus.forEach(pkg => {
            const endDate = new Date(pkg.ngayKetThuc);
            if (endDate >= now && endDate <= in7Days) {
                expiringIn7DaysCount++;
                if (expiringIn7Days.length < 20) expiringIn7Days.push(pkg);
            } else if (endDate > in7Days && endDate <= in15Days) {
                expiringIn15DaysCount++;
                if (expiringIn15Days.length < 20) expiringIn15Days.push(pkg);
            } else if (endDate > in15Days && endDate <= in30Days) {
                expiringIn30DaysCount++;
                if (expiringIn30Days.length < 20) expiringIn30Days.push(pkg);
            } else if (endDate < now && endDate >= expired30DaysAgo) {
                expiredPackagesCount++;
                if (expiredPackages.length < 20) expiredPackages.push(pkg);
            }
        });

        res.json({
            success: true,
            data: {
                trong7Ngay: {
                    soLuong: expiringIn7DaysCount,
                    danhSach: expiringIn7Days
                },
                trong15Ngay: {
                    soLuong: expiringIn15DaysCount,
                    danhSach: expiringIn15Days
                },
                trong30Ngay: {
                    soLuong: expiringIn30DaysCount,
                    danhSach: expiringIn30Days
                },
                daHetHan: {
                    soLuong: expiredPackagesCount,
                    danhSach: expiredPackages
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
        // Tối ưu: Chỉ lấy gói đã thanh toán và giới hạn số lượng
        const matchCondition = {
            trangThaiThanhToan: 'DA_THANH_TOAN',
            $or: [
                { goiTapId: { $exists: true, $ne: null } },
                { maGoiTap: { $exists: true, $ne: null } }
            ]
        };

        const packageStats = await ChiTietGoiTap.aggregate([
            {
                $match: matchCondition
            },
            { $limit: 5000 }, // Giới hạn số lượng records xử lý
            {
                $addFields: {
                    goiTapIdValue: {
                        $cond: {
                            if: { $ne: ['$goiTapId', null] },
                            then: '$goiTapId',
                            else: '$maGoiTap'
                        }
                    }
                }
            },
            {
                $match: {
                    goiTapIdValue: { $ne: null }
                }
            },
            {
                $lookup: {
                    from: 'goiTaps',
                    localField: 'goiTapIdValue',
                    foreignField: '_id',
                    as: 'goiTap'
                }
            },
            {
                $unwind: {
                    path: '$goiTap',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $match: {
                    goiTap: { $ne: null }
                }
            },
            {
                $group: {
                    _id: '$goiTapIdValue',
                    goiTap: { $first: '$goiTap' },
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
                $project: {
                    _id: 1,
                    goiTap: 1,
                    soLuongDangKy: 1,
                    doanhThu: 1
                }
            },
            { $sort: { soLuongDangKy: -1 } },
            { $limit: 20 } // Chỉ lấy top 20 gói tập phổ biến nhất
        ]);

        const totalRegistrations = packageStats.reduce((sum, item) => sum + (item.soLuongDangKy || 0), 0);

        const statsWithPercentage = packageStats.map(item => ({
            _id: item._id,
            goiTap: item.goiTap,
            soLuongDangKy: item.soLuongDangKy || 0,
            doanhThu: Math.round(item.doanhThu || 0),
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

        // Tối ưu: Giảm lookup và chỉ lấy dữ liệu cần thiết
        const [stats, totalMembers] = await Promise.all([
            CheckInRecord.aggregate([
                {
                    $facet: {
                        thisMonth: [
                            {
                                $match: {
                                    checkInTime: { $gte: startOfMonth }
                                }
                            },
                            {
                                $group: {
                                    _id: null,
                                    soLuongCheckIn: { $sum: 1 },
                                    soHoiVien: { $addToSet: '$hoiVien' }
                                }
                            }
                        ],
                        lastMonth: [
                            {
                                $match: {
                                    checkInTime: { $gte: startOfLastMonth, $lt: startOfMonth }
                                }
                            },
                            {
                                $count: 'soLuongCheckIn'
                            }
                        ],
                        byBranch: [
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
                                    as: 'buoiTap',
                                    pipeline: [
                                        {
                                            $lookup: {
                                                from: 'chinhanhs',
                                                localField: 'chiNhanh',
                                                foreignField: '_id',
                                                as: 'chiNhanh'
                                            }
                                        },
                                        {
                                            $unwind: {
                                                path: '$chiNhanh',
                                                preserveNullAndEmptyArrays: true
                                            }
                                        },
                                        {
                                            $project: {
                                                'chiNhanh._id': 1,
                                                'chiNhanh.tenChiNhanh': 1
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                $unwind: {
                                    path: '$buoiTap',
                                    preserveNullAndEmptyArrays: true
                                }
                            },
                            {
                                $group: {
                                    _id: '$buoiTap.chiNhanh._id',
                                    tenChiNhanh: { $first: '$buoiTap.chiNhanh.tenChiNhanh' },
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
                            { $sort: { soLuongCheckIn: -1 } },
                            { $limit: 10 } // Chỉ lấy top 10 chi nhánh
                        ]
                    }
                }
            ]),
            HoiVien.countDocuments()
        ]);

        const thisMonthData = stats[0]?.thisMonth?.[0] || { soLuongCheckIn: 0, soHoiVien: [] };
        const lastMonthCheckIns = stats[0]?.lastMonth?.[0]?.soLuongCheckIn || 0;
        const uniqueMembersThisMonth = thisMonthData.soHoiVien?.length || 0;
        const thisMonthCheckIns = thisMonthData.soLuongCheckIn || 0;
        const checkInByBranch = stats[0]?.byBranch || [];

        // Số buổi tập trung bình mỗi hội viên
        const avgSessionsPerMember = totalMembers > 0
            ? (thisMonthCheckIns / totalMembers).toFixed(2)
            : 0;

        // Tỷ lệ tham gia
        const participationRate = totalMembers > 0
            ? ((uniqueMembersThisMonth / totalMembers) * 100).toFixed(1)
            : 0;

        res.json({
            success: true,
            data: {
                thangNay: {
                    soLuongCheckIn: thisMonthCheckIns,
                    soHoiVien: uniqueMembersThisMonth,
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
        // Tối ưu: Lấy trial package IDs
        const trialPackages = await GoiTap.find({
            $or: [
                { tenGoiTap: { $regex: /trải nghiệm/i } },
                {
                    $or: [
                        { donViThoiHan: 'Ngay' },
                        { donViThoiHan: 'Ngày' }
                    ],
                    thoiHan: { $lte: 7 }
                },
                { donViThoiHan: 'Phut' },
                { donViThoiHan: 'Phút' }
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

        // Tối ưu: Dùng aggregation để tính toán conversion stats
        const [currentStats, previousStats] = await Promise.all([
            // Current period stats
            ChiTietGoiTap.aggregate([
                {
                    $match: {
                        goiTapId: { $in: trialIds },
                        trangThaiThanhToan: 'DA_THANH_TOAN',
                        createdAt: { $gte: currentStart, $lte: now },
                        nguoiDungId: { $ne: null }
                    }
                },
                {
                    $group: {
                        _id: '$nguoiDungId',
                        firstTrialDate: { $min: '$createdAt' }
                    }
                },
                {
                    $lookup: {
                        from: 'chitietgoitaps',
                        let: { userId: '$_id', trialDate: '$firstTrialDate' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ['$nguoiDungId', '$$userId'] },
                                            { $nin: ['$goiTapId', trialIds] },
                                            { $eq: ['$trangThaiThanhToan', 'DA_THANH_TOAN'] },
                                            { $gte: ['$createdAt', '$$trialDate'] },
                                            { $lte: ['$createdAt', now] }
                                        ]
                                    }
                                }
                            },
                            { $limit: 1 }
                        ],
                        as: 'converted'
                    }
                },
                {
                    $facet: {
                        totalTrials: [{ $count: 'count' }],
                        converted: [
                            { $match: { converted: { $ne: [] } } },
                            { $count: 'count' }
                        ]
                    }
                }
            ]),
            // Previous period stats
            ChiTietGoiTap.aggregate([
                {
                    $match: {
                        goiTapId: { $in: trialIds },
                        trangThaiThanhToan: 'DA_THANH_TOAN',
                        createdAt: { $gte: prevStart, $lte: prevEnd },
                        nguoiDungId: { $ne: null }
                    }
                },
                {
                    $group: {
                        _id: '$nguoiDungId',
                        firstTrialDate: { $min: '$createdAt' }
                    }
                },
                {
                    $lookup: {
                        from: 'chitietgoitaps',
                        let: { userId: '$_id', trialDate: '$firstTrialDate' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ['$nguoiDungId', '$$userId'] },
                                            { $nin: ['$goiTapId', trialIds] },
                                            { $eq: ['$trangThaiThanhToan', 'DA_THANH_TOAN'] },
                                            { $gte: ['$createdAt', '$$trialDate'] },
                                            { $lte: ['$createdAt', prevEnd] }
                                        ]
                                    }
                                }
                            },
                            { $limit: 1 }
                        ],
                        as: 'converted'
                    }
                },
                {
                    $facet: {
                        totalTrials: [{ $count: 'count' }],
                        converted: [
                            { $match: { converted: { $ne: [] } } },
                            { $count: 'count' }
                        ]
                    }
                }
            ])
        ]);

        const currentTotalTrials = currentStats[0]?.totalTrials?.[0]?.count || 0;
        const currentConverted = currentStats[0]?.converted?.[0]?.count || 0;
        const previousTotalTrials = previousStats[0]?.totalTrials?.[0]?.count || 0;
        const previousConverted = previousStats[0]?.converted?.[0]?.count || 0;

        const conversionRate = currentTotalTrials > 0
            ? Number(((currentConverted / currentTotalTrials) * 100).toFixed(1))
            : 0;
        const previousRate = previousTotalTrials > 0
            ? Number(((previousConverted / previousTotalTrials) * 100).toFixed(1))
            : 0;

        const changePercent = previousRate === 0
            ? (conversionRate > 0 ? 100 : 0)
            : Number(((conversionRate - previousRate) / previousRate * 100).toFixed(1));
        const trend = conversionRate === previousRate ? 'flat' : conversionRate > previousRate ? 'up' : 'down';

        return {
            totalTrials: currentTotalTrials,
            converted: currentConverted,
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
        // Tối ưu: Dùng aggregation để tính toán tuổi trong database
        const now = new Date();
        const currentYear = now.getFullYear();

        const ageDistribution = await HoiVien.aggregate([
            {
                $match: {
                    ngaySinh: { $ne: null, $exists: true }
                }
            },
            {
                $addFields: {
                    age: {
                        $floor: {
                            $divide: [
                                { $subtract: [currentYear, { $year: '$ngaySinh' }] },
                                1
                            ]
                        }
                    }
                }
            },
            {
                $bucket: {
                    groupBy: '$age',
                    boundaries: [0, 18, 25, 35, 45, 200],
                    default: '45+',
                    output: {
                        count: { $sum: 1 }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    group: {
                        $switch: {
                            branches: [
                                { case: { $eq: ['$_id', 0] }, then: 'Dưới 18' },
                                { case: { $eq: ['$_id', 18] }, then: '18-25' },
                                { case: { $eq: ['$_id', 25] }, then: '25-35' },
                                { case: { $eq: ['$_id', 35] }, then: '35-45' },
                                { case: { $eq: ['$_id', 45] }, then: '45+' }
                            ],
                            default: '45+'
                        }
                    },
                    count: '$count'
                }
            }
        ]);

        const total = ageDistribution.reduce((sum, item) => sum + (item.count || 0), 0) || 1;

        // Đảm bảo tất cả buckets đều có
        const bucketMap = new Map(ageDistribution.map(item => [item.group, item.count || 0]));
        const allBuckets = ['Dưới 18', '18-25', '25-35', '35-45', '45+'];

        return allBuckets.map(group => ({
            group,
            count: bucketMap.get(group) || 0,
            percentage: Number((((bucketMap.get(group) || 0) / total) * 100).toFixed(1))
        }));
    } catch (error) {
        console.error('Error building age distribution stats:', error);
        return [];
    }
};

const buildPackageDurationRevenueStats = async () => {
    try {
        // Tối ưu: Chỉ lấy các gói đã thanh toán và có goiTapId
        const data = await ChiTietGoiTap.aggregate([
            {
                $match: {
                    trangThaiThanhToan: 'DA_THANH_TOAN',
                    goiTapId: { $ne: null }
                }
            },
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
                                {
                                    case: { $in: ['$goiTap.donViThoiHan', ['Thang', 'Tháng']] },
                                    then: '$goiTap.thoiHan'
                                },
                                {
                                    case: { $in: ['$goiTap.donViThoiHan', ['Nam', 'Năm']] },
                                    then: { $multiply: ['$goiTap.thoiHan', 12] }
                                },
                                {
                                    case: { $in: ['$goiTap.donViThoiHan', ['Ngay', 'Ngày']] },
                                    then: { $divide: ['$goiTap.thoiHan', 30] }
                                },
                                {
                                    case: { $in: ['$goiTap.donViThoiHan', ['Phut', 'Phút']] },
                                    then: { $divide: ['$goiTap.thoiHan', 43200] } // 60 * 24 * 30
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
        // Tối ưu: Chỉ lấy 30 ngày gần nhất và giới hạn số lượng records
        const now = new Date();
        const start = new Date(now);
        start.setDate(start.getDate() - 30);

        const data = await CheckInRecord.aggregate([
            {
                $match: {
                    checkInTime: { $gte: start, $exists: true, $ne: null }
                }
            },
            { $limit: 10000 }, // Giới hạn để tăng tốc
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
// Lấy danh sách check-in real-time (hôm nay)
exports.getRecentCheckIns = async (req, res) => {
    try {
        const checkIns = await getRecentCheckIns();
        res.json({
            success: true,
            data: checkIns
        });
    } catch (error) {
        console.error('Error in getRecentCheckIns:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách check-in real-time',
            error: error.message
        });
    }
};

// Lấy danh sách PT check-in/out real-time (hôm nay)
exports.getRecentPTCheckIns = async (req, res) => {
    try {
        const ptCheckIns = await getRecentPTCheckIns();
        res.json({
            success: true,
            data: ptCheckIns
        });
    } catch (error) {
        console.error('Error in getRecentPTCheckIns:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách PT check-in/out real-time',
            error: error.message
        });
    }
};

const getRecentCheckIns = async () => {
    try {
        const now = new Date();
        // Lấy tất cả check-in hôm nay (theo múi giờ Việt Nam UTC+7)
        const vietnamOffset = 7 * 60; // 7 giờ * 60 phút
        const utcNow = new Date(now.getTime() - (now.getTimezoneOffset() * 60 * 1000));
        const vietnamNow = new Date(utcNow.getTime() + (vietnamOffset * 60 * 1000));

        const startOfDay = new Date(vietnamNow);
        startOfDay.setUTCHours(0, 0, 0, 0);
        const startOfDayUTC = new Date(startOfDay.getTime() - (vietnamOffset * 60 * 1000));

        const endOfDay = new Date(vietnamNow);
        endOfDay.setUTCHours(23, 59, 59, 999);
        const endOfDayUTC = new Date(endOfDay.getTime() - (vietnamOffset * 60 * 1000));

        // Tối ưu: Giảm limit và chỉ lấy fields cần thiết
        const checkInRecords = await CheckInRecord.find({
            checkInTime: {
                $gte: startOfDayUTC,
                $lte: endOfDayUTC
            }
        })
            .select('hoiVien buoiTap checkInTime checkOutTime checkInStatus checkOutStatus')
            .populate({
                path: 'hoiVien',
                select: 'hoTen sdt'
            })
            .populate({
                path: 'buoiTap',
                select: 'tenBuoiTap gioBatDau gioKetThuc ngayTap chiNhanh',
                populate: {
                    path: 'chiNhanh',
                    select: 'tenChiNhanh diaChi'
                }
            })
            .sort({ checkInTime: -1 })
            .limit(50); // Giảm từ 100 xuống 50 để tăng tốc

        return checkInRecords.map(record => ({
            _id: record._id,
            hoiVien: {
                _id: record.hoiVien._id,
                hoTen: record.hoiVien.hoTen
            },
            buoiTap: record.buoiTap ? {
                _id: record.buoiTap._id,
                tenBuoiTap: record.buoiTap.tenBuoiTap,
                gioBatDau: record.buoiTap.gioBatDau,
                gioKetThuc: record.buoiTap.gioKetThuc
            } : null,
            chiNhanh: record.buoiTap?.chiNhanh ? {
                _id: record.buoiTap.chiNhanh._id,
                tenChiNhanh: record.buoiTap.chiNhanh.tenChiNhanh
            } : null,
            checkInTime: record.checkInTime,
            checkOutTime: record.checkOutTime || null,
            isCheckedOut: !!record.checkOutTime,
            checkInStatus: record.checkInStatus,
            checkOutStatus: record.checkOutStatus
        }));
    } catch (error) {
        console.error('Error in getRecentCheckIns:', error);
        return [];
    }
};

// Lấy danh sách PT check-in/out real-time (hôm nay)
const getRecentPTCheckIns = async () => {
    try {
        const now = new Date();
        // Lấy tất cả PT check-in hôm nay (theo múi giờ Việt Nam UTC+7)
        const vietnamOffset = 7 * 60; // 7 giờ * 60 phút
        const utcNow = new Date(now.getTime() - (now.getTimezoneOffset() * 60 * 1000));
        const vietnamNow = new Date(utcNow.getTime() + (vietnamOffset * 60 * 1000));

        const startOfDay = new Date(vietnamNow);
        startOfDay.setUTCHours(0, 0, 0, 0);
        const startOfDayUTC = new Date(startOfDay.getTime() - (vietnamOffset * 60 * 1000));

        const endOfDay = new Date(vietnamNow);
        endOfDay.setUTCHours(23, 59, 59, 999);
        const endOfDayUTC = new Date(endOfDay.getTime() - (vietnamOffset * 60 * 1000));

        // Tối ưu: Giảm limit và chỉ lấy fields cần thiết
        const ptCheckInRecords = await PTCheckInRecord.find({
            checkInTime: {
                $gte: startOfDayUTC,
                $lte: endOfDayUTC
            }
        })
            .select('pt buoiTap checkInTime checkOutTime checkInStatus checkOutStatus thoiGianMuonCheckIn thoiGianSomCheckOut tienLuong tienPhat sessionDuration')
            .populate({
                path: 'pt',
                select: 'hoTen sdt'
            })
            .populate({
                path: 'buoiTap',
                select: 'tenBuoiTap gioBatDau gioKetThuc ngayTap chiNhanh',
                populate: {
                    path: 'chiNhanh',
                    select: 'tenChiNhanh diaChi'
                }
            })
            .sort({ checkInTime: -1 })
            .limit(50); // Giảm từ 100 xuống 50 để tăng tốc

        return ptCheckInRecords.map(record => ({
            _id: record._id,
            pt: {
                _id: record.pt._id,
                hoTen: record.pt.hoTen
            },
            buoiTap: record.buoiTap ? {
                _id: record.buoiTap._id,
                tenBuoiTap: record.buoiTap.tenBuoiTap,
                gioBatDau: record.buoiTap.gioBatDau,
                gioKetThuc: record.buoiTap.gioKetThuc,
                ngayTap: record.buoiTap.ngayTap
            } : null,
            chiNhanh: record.buoiTap?.chiNhanh ? {
                _id: record.buoiTap.chiNhanh._id,
                tenChiNhanh: record.buoiTap.chiNhanh.tenChiNhanh
            } : null,
            checkInTime: record.checkInTime,
            checkOutTime: record.checkOutTime || null,
            isCheckedOut: !!record.checkOutTime,
            checkInStatus: record.checkInStatus,
            checkOutStatus: record.checkOutStatus,
            thoiGianMuonCheckIn: record.thoiGianMuonCheckIn || 0,
            thoiGianSomCheckOut: record.thoiGianSomCheckOut || 0,
            tienLuong: record.tienLuong || 0,
            tienPhat: record.tienPhat || 0,
            sessionDuration: record.sessionDuration || null
        }));
    } catch (error) {
        console.error('Error in getRecentPTCheckIns:', error);
        return [];
    }
};

// Lấy danh sách đăng ký gần đây (bao gồm cả gia hạn)
const getRecentRegistrations = async () => {
    try {
        const now = new Date();
        // Lấy các đăng ký trong 30 ngày gần đây
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Tối ưu: Giảm limit và chỉ lấy fields cần thiết
        const registrations = await ChiTietGoiTap.find({
            trangThaiThanhToan: 'DA_THANH_TOAN',
            $or: [
                { ngayDangKy: { $gte: thirtyDaysAgo } },
                { thoiGianDangKy: { $gte: thirtyDaysAgo } }
            ]
        })
            .select('nguoiDungId maHoiVien goiTapId maGoiTap branchId ptDuocChon ngayDangKy thoiGianDangKy soTienThanhToan giaGoiTapGoc isUpgrade createdAt')
            .populate('nguoiDungId', 'hoTen sdt email')
            .populate('maHoiVien', 'hoTen sdt email')
            .populate('goiTapId', 'tenGoiTap donGia')
            .populate('maGoiTap', 'tenGoiTap donGia')
            .populate('branchId', 'tenChiNhanh')
            .populate('ptDuocChon', 'hoTen chuyenMon')
            .sort({ ngayDangKy: -1, thoiGianDangKy: -1 })
            .limit(30); // Giảm từ 50 xuống 30 để tăng tốc

        return registrations.map(reg => {
            const user = reg.nguoiDungId || reg.maHoiVien;
            const goiTap = reg.goiTapId || reg.maGoiTap;
            const thoiGianDangKy = reg.ngayDangKy || reg.thoiGianDangKy || reg.createdAt;

            return {
                _id: reg._id,
                hoTen: user?.hoTen || 'N/A',
                goiTap: goiTap?.tenGoiTap || 'N/A',
                chiNhanh: reg.branchId?.tenChiNhanh || '—',
                ptPhuTrach: reg.ptDuocChon?.hoTen || '—',
                thoiGianDangKy: thoiGianDangKy,
                tongTien: reg.soTienThanhToan || reg.giaGoiTapGoc || goiTap?.donGia || 0,
                isUpgrade: reg.isUpgrade || false // Đánh dấu là gia hạn hay đăng ký mới
            };
        });
    } catch (error) {
        console.error('Error in getRecentRegistrations:', error);
        return [];
    }
};

// Helper function để thêm timeout cho các promise
const withTimeout = (promise, timeoutMs = 15000) => {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), timeoutMs)
        )
    ]);
};

// API tối ưu - chỉ lấy dữ liệu tối thiểu cần thiết
exports.getOverallStats = async (req, res) => {
    const startTime = Date.now();
    try {
        // Tối ưu: Chia thành 2 nhóm với timeout ngắn hơn
        // Nhóm quan trọng: timeout 12s, nhóm phụ: timeout 8s
        // Chỉ lấy các thống kê cơ bản nhất
        const [
            memberByBranchData,
            newMemberData,
            revenueData,
            packageData,
            ptData,
            checkInData,
            statusData
        ] = await Promise.all([
            withTimeout(callStatsFunction(exports.getMemberStatsByBranch, {}), 12000).catch(() => []),
            withTimeout(callStatsFunction(exports.getNewMemberStats, {}), 12000).catch(() => ({
                homNay: { soLuong: 0, soSanh: 0, thayDoi: '0', trend: 'flat' },
                tuanNay: { soLuong: 0, soSanh: 0, thayDoi: '0', trend: 'flat' },
                thangNay: { soLuong: 0, soSanh: 0, thayDoi: '0', trend: 'flat' },
                namNay: { soLuong: 0, soSanh: 0, thayDoi: '0', trend: 'flat' }
            })),
            withTimeout(callStatsFunction(exports.getRevenueStats, { query: { period: 'month' } }), 12000).catch(() => ({
                hienTai: { doanhThu: 0, soLuong: 0 },
                kyTruoc: { doanhThu: 0, soLuong: 0 },
                thayDoi: 0,
                trend: 'flat',
                theoChiNhanh: []
            })),
            withTimeout(callStatsFunction(exports.getPackageStats, {}), 12000).catch(() => ({
                tongSoDangKy: 0,
                theoGoiTap: [],
                goiPhobienNhat: null
            })),
            withTimeout(callStatsFunction(exports.getPTStats, {}), 12000).catch(() => ({
                tongSoPT: 0,
                dangHoatDong: 0,
                tamNgung: 0,
                topPT: []
            })),
            withTimeout(callStatsFunction(exports.getCheckInStats, {}), 12000).catch(() => ({
                thangNay: { soLuongCheckIn: 0, soHoiVien: 0, tyLeThamGia: 0, trungBinhMoiHoiVien: 0 },
                thangTruoc: { soLuongCheckIn: 0 },
                thayDoi: '0',
                theoChiNhanh: []
            })),
            withTimeout(callStatsFunction(exports.getMemberStatusStats, {}), 12000).catch(() => ({
                tongSo: 0,
                chiTiet: []
            }))
        ]);

        // Nhóm phụ: timeout ngắn hơn và có thể bỏ qua
        const [
            expiringData,
            recentCheckIns
        ] = await Promise.allSettled([
            withTimeout(callStatsFunction(exports.getExpiringPackages, {}), 8000).catch(() => ({
                trong7Ngay: { soLuong: 0, danhSach: [] },
                trong15Ngay: { soLuong: 0, danhSach: [] },
                trong30Ngay: { soLuong: 0, danhSach: [] },
                daHetHan: { soLuong: 0, danhSach: [] }
            })),
            withTimeout(getRecentCheckIns(), 5000).catch(() => [])
        ]);

        const elapsedTime = Date.now() - startTime;
        console.log(`[getOverallStats] Total time: ${elapsedTime}ms`);

        // Trả về dữ liệu tối thiểu - loại bỏ các thống kê không cần thiết
        res.json({
            success: true,
            data: {
                hoiVienTheoChiNhanh: memberByBranchData || [],
                hoiVienMoi: newMemberData || {},
                goiSapHetHan: expiringData.status === 'fulfilled' ? expiringData.value : {
                    trong7Ngay: { soLuong: 0, danhSach: [] },
                    trong15Ngay: { soLuong: 0, danhSach: [] },
                    trong30Ngay: { soLuong: 0, danhSach: [] },
                    daHetHan: { soLuong: 0, danhSach: [] }
                },
                doanhThu: revenueData || {},
                goiTap: packageData || { tongSoDangKy: 0, theoGoiTap: [], goiPhobienNhat: null },
                pt: ptData || {},
                checkIn: checkInData || {},
                trangThaiHoiVien: statusData || {},
                recentCheckIns: recentCheckIns.status === 'fulfilled' ? recentCheckIns.value : []
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

