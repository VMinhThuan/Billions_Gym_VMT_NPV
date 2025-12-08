const ChiNhanh = require('../models/ChiNhanh');
const { PT } = require('../models/NguoiDung');
const BuoiTap = require('../models/BuoiTap');
const GoiTap = require('../models/GoiTap');
const LichTap = require('../models/LichTap');
const SessionOption = require('../models/SessionOption');
const ChiTietGoiTap = require('../models/ChiTietGoiTap');
const UserNotification = require('../models/UserNotification');

/**
 * Lấy các buổi tập khả dụng cho chi nhánh, tuần và gói cụ thể
 */
exports.getAvailableSessions = async (req, res) => {
    try {
        try {
            const { chiNhanhId, tuanBatDau, goiTapId } = req.query;
            const userId = req.user?.id; // Optional chaining để tránh lỗi khi không có auth

            if (!chiNhanhId || !tuanBatDau || !goiTapId) {
                return res.status(400).json({
                    success: false,
                    message: 'Thiếu thông tin bắt buộc: chiNhanhId, tuanBatDau, goiTapId'
                });
            }

            // Kiểm tra gói tập của user có còn hạn không
            if (userId) {
                const activePackage = await ChiTietGoiTap.findOne({
                    $and: [
                        {
                            $or: [
                                { maHoiVien: userId },
                                { nguoiDungId: userId }
                            ]
                        },
                        {
                            $or: [
                                { trangThaiThanhToan: 'DA_THANH_TOAN' },
                                { trangThaiDangKy: 'HOAN_THANH' },
                                { trangThaiSuDung: { $in: ['DANG_HOAT_DONG', 'DANG_SU_DUNG'] } }
                            ]
                        }
                    ]
                })
                    .populate('goiTapId')
                    .populate('maGoiTap')
                    .sort({ ngayDangKy: -1, thoiGianDangKy: -1 });

                if (activePackage) {
                    const currentTime = new Date();
                    if (activePackage.ngayKetThuc && new Date(activePackage.ngayKetThuc) < currentTime) {
                        return res.status(400).json({
                            success: false,
                            message: 'Gói tập của bạn đã hết hạn. Vui lòng gia hạn hoặc đăng ký gói tập mới.',
                            isExpired: true
                        });
                    }
                }
            }

            // Lấy thông tin gói tập để kiểm tra ràng buộc
            const goiTap = await GoiTap.findById(goiTapId);
            if (!goiTap) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy gói tập'
                });
            }

            // Tính ngày bắt đầu và kết thúc tuần (local timezone)
            const startDate = new Date(tuanBatDau);
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6);

            // Normalize to local day bounds for consistent comparison with DB-stored dates
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);

            console.log('🔍 Searching sessions:', {
                chiNhanhId,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                goiTapId
            });

            // Debug: Check branch ID format and existence
            console.log('🏢 Branch ID being searched:', chiNhanhId);

            // Check if this branch ID exists and what branches are available
            const allBranches = await ChiNhanh.find({}, '_id tenChiNhanh').limit(5);
            console.log('🏢 Available branches:', allBranches.map(b => ({ id: b._id, name: b.tenChiNhanh })));

            // Check what branch IDs exist in BuoiTap collection
            const distinctBranchIds = await BuoiTap.distinct('chiNhanh');
            console.log('🏢 Branch IDs in BuoiTap collection:', distinctBranchIds);

            // Query BuoiTap collection with correct field names
            // Thêm filter theo ngày để chỉ lấy sessions trong tuần
            const query = {
                chiNhanh: chiNhanhId,
                ngayTap: {
                    $gte: startDate,
                    $lte: endDate
                },
                trangThai: { $in: ['CHUAN_BI', 'DANG_DIEN_RA'] }
            };
            console.log('🔎 MongoDB Query:', JSON.stringify(query, null, 2));

            // First check total sessions for this branch
            const totalBranchSessions = await BuoiTap.countDocuments({ chiNhanh: chiNhanhId });
            console.log(`📊 Total BuoiTap sessions for branch ${chiNhanhId}: ${totalBranchSessions}`);

            // If no sessions for this branch, try the first available branch ID
            let actualQuery = query;
            if (totalBranchSessions === 0 && distinctBranchIds.length > 0) {
                console.log('⚠️ No sessions for requested branch, using first available branch:', distinctBranchIds[0]);
                actualQuery = {
                    chiNhanh: distinctBranchIds[0],
                    ngayTap: {
                        $gte: startDate,
                        $lte: endDate
                    },
                    trangThai: { $in: ['CHUAN_BI', 'DANG_DIEN_RA'] }
                };
            }

            // Lấy các buổi tập từ BuoiTap collection
            const sessions = await BuoiTap.find(actualQuery)
                .populate('ptPhuTrach', 'hoTen chuyenMon')
                .populate('chiNhanh', 'tenChiNhanh')
                .sort({ ngayTap: 1, gioBatDau: 1 });

            console.log(`📊 Found ${sessions.length} sessions in database after filtering`);

            // Debug: Log first few sessions if any found
            if (sessions.length > 0) {
                console.log('🔍 First session sample:', {
                    _id: sessions[0]._id,
                    chiNhanh: sessions[0].chiNhanh,
                    ngayTap: sessions[0].ngayTap,
                    tenBuoiTap: sessions[0].tenBuoiTap
                });
            } else {
                // Check if there are any sessions for this branch at all
                const totalSessions = await BuoiTap.countDocuments({ chiNhanh: chiNhanhId });
                console.log(`⚠️ No sessions found for date range, but branch has ${totalSessions} total sessions`);

                // Check sessions in different date ranges
                const sampleSessions = await BuoiTap.find({ chiNhanh: chiNhanhId }).limit(3);
                console.log('📅 Sample sessions:', sampleSessions.map(s => ({ _id: s._id, tenBuoiTap: s.tenBuoiTap, trangThai: s.trangThai })));
            }

            // Map về cấu trúc FE đang dùng và thêm logic kiểm tra thời gian
            const now = new Date();
            const mapped = sessions.map(s => {
                try {
                    const sessionStart = new Date(s.ngayTap || new Date());
                    const [hours, minutes] = (s.gioBatDau || '00:00').split(':');
                    sessionStart.setHours(parseInt(hours) || 0, parseInt(minutes) || 0, 0, 0);

                    const sessionEnd = new Date(s.ngayTap || new Date());
                    const [endHours, endMinutes] = (s.gioKetThuc || '00:00').split(':');
                    sessionEnd.setHours(parseInt(endHours) || 0, parseInt(endMinutes) || 0, 0, 0);

                    const isSessionStarted = sessionStart <= now;
                    const isSessionFull = (s.soLuongHienTai || 0) >= (s.soLuongToiDa || 0);

                    return {
                        _id: s._id,
                        chiNhanh: s.chiNhanh,
                        ptPhuTrach: s.ptPhuTrach,
                        ngay: s.ngayTap,
                        gioBatDau: s.gioBatDau || '00:00',
                        gioKetThuc: s.gioKetThuc || '00:00',
                        soLuongToiDa: s.soLuongToiDa || 0,
                        soLuongHienTai: s.soLuongHienTai || 0,
                        trangThai: s.trangThai || 'CHUAN_BI',
                        hinhAnh: s.hinhAnh || '',
                        doKho: s.doKho || 'DE',
                        tenBuoiTap: s.tenBuoiTap || 'Buổi tập',
                        moTa: s.moTa || '',
                        conChoTrong: Math.max(0, (s.soLuongToiDa || 0) - (s.soLuongHienTai || 0)),
                        daDay: isSessionFull,
                        daBatDau: isSessionStarted,
                        coTheDangKy: !isSessionStarted && !isSessionFull
                    };
                } catch (err) {
                    console.error('Error mapping session:', s._id, err);
                    return null;
                }
            }).filter(Boolean);

            // Lọc theo ràng buộc gói tập
            // LƯU Ý: isSessionAllowedForPackage sẽ:
            // - Chỉ áp dụng ràng buộc cho các gói đặc biệt (Weekend Gym, Morning, Evening)
            // - Return true cho TẤT CẢ các gói khác (cho phép đăng ký từ T2 đến CN)
            console.log(`🔍 [Package Filter] Before filter: ${mapped.length} sessions`);
            const tenGoiTap = goiTap.tenGoiTap.toLowerCase();
            const isWeekendPackage = tenGoiTap.includes('weekend') || tenGoiTap.includes('cuối tuần');

            if (isWeekendPackage) {
                console.log(`🔍 [Weekend Gym] Filtering sessions for Weekend Gym package (ID: ${goiTap._id})`);
                mapped.forEach((buoi, index) => {
                    const allowed = isSessionAllowedForPackage(buoi, goiTap);
                    console.log(`🔍 [Weekend Gym] Session ${index + 1}:`, {
                        tenBuoiTap: buoi.tenBuoiTap,
                        ngay: buoi.ngay,
                        ngayType: typeof buoi.ngay,
                        allowed,
                        thuTrongTuan: allowed ? 'N/A' : (() => {
                            const ngayTapValue = buoi.ngayTap || buoi.ngay;
                            let ngayTap;
                            if (ngayTapValue instanceof Date) {
                                const year = ngayTapValue.getFullYear();
                                const month = ngayTapValue.getMonth();
                                const day = ngayTapValue.getDate();
                                ngayTap = new Date(year, month, day, 12, 0, 0);
                            } else {
                                const tempDate = new Date(ngayTapValue);
                                const year = tempDate.getFullYear();
                                const month = tempDate.getMonth();
                                const day = tempDate.getDate();
                                ngayTap = new Date(year, month, day, 12, 0, 0);
                            }
                            const thu = ngayTap.getDay();
                            return thu + ' (' + ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][thu] + ')';
                        })()
                    });
                });
            } else {
                console.log(`🔍 [Package Filter] Non-restricted package (${goiTap.tenGoiTap}), allowing all sessions`);
            }

            // Filter sessions: Weekend Gym chỉ cho phép T7-CN, các gói khác cho phép tất cả
            const filteredSessions = mapped.filter(buoi => {
                const allowed = isSessionAllowedForPackage(buoi, goiTap);
                if (!allowed) {
                    console.log('🚫 [Filter] Session bị loại bỏ:', {
                        tenBuoiTap: buoi.tenBuoiTap,
                        ngayTap: buoi.ngayTap || buoi.ngay,
                        goiTapId: goiTap._id,
                        tenGoiTap: goiTap.tenGoiTap
                    });
                }
                return allowed;
            });
            console.log(`🔍 [Package Filter] After filter: ${filteredSessions.length} sessions (from ${mapped.length} total)`);
            console.log(`🔍 [Package Filter] Package info:`, {
                goiTapId: goiTap._id,
                tenGoiTap: goiTap.tenGoiTap,
                isWeekendPackage: (goiTap.tenGoiTap || '').toLowerCase().includes('weekend') || (goiTap.tenGoiTap || '').toLowerCase().includes('cuối tuần')
            });

            // Thêm cờ có thể đăng ký (chỉ những buổi chưa bắt đầu và còn chỗ)
            const sessionsWithStatus = filteredSessions.map(buoi => ({
                ...buoi,
                coTheDangKy: buoi.conChoTrong > 0 && !buoi.daBatDau
            }));

            console.log(`✅ Returning ${sessionsWithStatus.length} available sessions to frontend`);

            res.json({
                success: true,
                data: {
                    sessions: sessionsWithStatus,
                    packageConstraints: getPackageConstraints(goiTap),
                    weekInfo: {
                        startDate,
                        endDate,
                        days: getWeekDays(startDate)
                    }
                }
            });

        } catch (error) {
            console.error('❌ Error in getAvailableSessions:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi server khi lấy danh sách buổi tập: ' + error.message,
                error: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    } catch (error) {
        console.error('❌ Error in getAvailableSessions:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy danh sách buổi tập: ' + error.message,
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

/**
 * Đăng ký buổi tập cho hội viên
 */
exports.registerSession = async (req, res) => {
    try {
        const { buoiTapId } = req.body;
        const userId = req.user.id;

        console.log('📝 registerSession - Request body:', req.body);
        console.log('📝 registerSession - User ID:', userId);

        if (!buoiTapId) {
            console.log('❌ registerSession - Missing buoiTapId');
            return res.status(400).json({
                success: false,
                message: 'Thiếu buoiTapId'
            });
        }

        // Lấy thông tin buổi tập
        const buoiTap = await BuoiTap.findById(buoiTapId)
            .populate('chiNhanh')
            .populate('ptPhuTrach');

        if (!buoiTap) {
            console.log('❌ registerSession - BuoiTap not found:', buoiTapId);
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy buổi tập'
            });
        }

        console.log('✅ registerSession - Found BuoiTap:', buoiTap._id);

        // Kiểm tra còn chỗ trống
        if (buoiTap.daDay) {
            console.log('❌ registerSession - BuoiTap is full');
            return res.status(400).json({
                success: false,
                message: 'Buổi tập đã đầy'
            });
        }

        // Kiểm tra hội viên đã đăng ký chưa
        const existingRegistration = buoiTap.danhSachHoiVien.find(
            member => member.hoiVien.toString() === userId.toString()
        );

        if (existingRegistration) {
            return res.status(400).json({
                success: false,
                message: 'Bạn đã đăng ký buổi tập này'
            });
        }

        // 1. Lấy TẤT CẢ gói tập của hội viên, sắp xếp theo ngày đăng ký mới nhất
        const allUserPackages = await ChiTietGoiTap.find({
            $or: [
                { maHoiVien: userId },
                { nguoiDungId: userId }
            ]
        })
            .populate('maGoiTap')
            .populate('goiTapId')
            .sort({ ngayDangKy: -1, thoiGianDangKy: -1 });

        // 2. Kiểm tra gói MỚI NHẤT (đã thanh toán) có đang trong quá trình đăng ký/nâng cấp chưa hoàn tất không
        // Ưu tiên kiểm tra gói mới nhất trước, vì nếu gói mới chưa hoàn tất thì không được đăng ký lịch
        const latestPaidPackage = allUserPackages.find(pkg =>
            pkg.trangThaiThanhToan === 'DA_THANH_TOAN'
        );

        if (latestPaidPackage) {
            // Nếu gói mới nhất CHƯA qua bước chọn PT (CHO_CHON_PT, DA_CHON_PT) thì CHẶN đăng ký
            // Lưu ý: trạng thái 'DA_TAO_LICH' được xem là gần hoàn tất và được phép đăng ký buổi lẻ
            if (latestPaidPackage.trangThaiDangKy &&
                ['CHO_CHON_PT', 'DA_CHON_PT'].includes(latestPaidPackage.trangThaiDangKy)) {
                const goiTapPending = latestPaidPackage.goiTapId || latestPaidPackage.maGoiTap;
                console.log('⚠️ registerSession - Latest paid package not completed, blocking session registration:', {
                    packageId: latestPaidPackage._id,
                    tenGoiTap: goiTapPending?.tenGoiTap,
                    trangThaiDangKy: latestPaidPackage.trangThaiDangKy,
                    trangThaiSuDung: latestPaidPackage.trangThaiSuDung
                });

                return res.status(400).json({
                    success: false,
                    message: 'Bạn đang có gói tập mới cần hoàn tất các bước đăng ký / nâng cấp. Vui lòng hoàn tất quy trình gói tập trước khi đăng ký thêm buổi tập.',
                    pendingPackageId: latestPaidPackage._id,
                    trangThaiDangKy: latestPaidPackage.trangThaiDangKy
                });
            }
        }

        // 3. Tìm gói tập đang hoạt động và ĐÃ HOÀN TẤT (trangThaiDangKy = 'HOAN_THANH' hoặc 'DA_TAO_LICH')
        const activePackage = allUserPackages.find(pkg => {
            const isPaid = pkg.trangThaiThanhToan === 'DA_THANH_TOAN';
            const isCompleted = ['HOAN_THANH', 'DA_TAO_LICH'].includes(pkg.trangThaiDangKy);
            const isActive = !pkg.trangThaiSuDung || !['HET_HAN', 'DA_HUY'].includes(pkg.trangThaiSuDung);
            const notExpired = !pkg.ngayKetThuc || new Date(pkg.ngayKetThuc) >= new Date();

            return isPaid && isCompleted && isActive && notExpired;
        });

        console.log('📦 registerSession - Active package found:', activePackage ? 'Yes' : 'No');

        // Kiểm tra gói tập có tồn tại và ĐÃ HOÀN TẤT không
        if (!activePackage) {
            return res.status(400).json({
                success: false,
                message: 'Bạn chưa có gói tập đang hoạt động và đã hoàn tất. Vui lòng hoàn tất quy trình đăng ký gói tập trước khi đăng ký buổi tập.'
            });
        }

        // Đảm bảo gói tập đã hoàn tất workflow (HOAN_THANH hoặc DA_TAO_LICH)
        if (!['HOAN_THANH', 'DA_TAO_LICH'].includes(activePackage.trangThaiDangKy)) {
            return res.status(400).json({
                success: false,
                message: 'Gói tập của bạn chưa hoàn tất quy trình đăng ký. Vui lòng hoàn tất các bước đăng ký / nâng cấp gói tập trước khi đăng ký buổi tập.',
                trangThaiDangKy: activePackage.trangThaiDangKy
            });
        }

        // Kiểm tra gói tập đã hết hạn chưa
        const currentTime = new Date();
        if (activePackage.ngayKetThuc) {
            const ngayKetThuc = new Date(activePackage.ngayKetThuc);
            if (ngayKetThuc < currentTime) {
                // Tạo notification về gói tập hết hạn (nếu chưa có)
                try {
                    const existingNotification = await UserNotification.findOne({
                        userId: userId,
                        loaiThongBao: 'GOI_TAP_HET_HAN',
                        'duLieuLienQuan.chiTietGoiTapId': activePackage._id.toString(),
                        daDoc: false
                    });

                    if (!existingNotification) {
                        const goiTap = activePackage.goiTapId || activePackage.maGoiTap;
                        await UserNotification.create({
                            userId: userId,
                            loaiThongBao: 'GOI_TAP_HET_HAN',
                            tieuDe: 'Gói tập đã hết hạn',
                            noiDung: `Gói tập "${goiTap?.tenGoiTap || 'của bạn'}" đã hết hạn. Vui lòng gia hạn hoặc đăng ký gói tập mới để tiếp tục sử dụng dịch vụ.`,
                            duLieuLienQuan: {
                                chiTietGoiTapId: activePackage._id,
                                goiTapId: goiTap?._id
                            },
                            daDoc: false
                        });
                        console.log(`📢 Created expiration notification for user ${userId}, package ${activePackage._id}`);
                    }
                } catch (notifError) {
                    console.error('❌ Error creating expiration notification:', notifError);
                }

                return res.status(400).json({
                    success: false,
                    message: 'Gói tập của bạn đã hết hạn. Vui lòng gia hạn hoặc đăng ký gói tập mới để tiếp tục đăng ký buổi tập.'
                });
            }
        }

        if (activePackage) {
            console.log('📦 registerSession - Package details:', {
                id: activePackage._id,
                trangThaiThanhToan: activePackage.trangThaiThanhToan,
                trangThaiDangKy: activePackage.trangThaiDangKy,
                trangThaiSuDung: activePackage.trangThaiSuDung,
                ngayKetThuc: activePackage.ngayKetThuc,
                isExpired: activePackage.ngayKetThuc ? new Date(activePackage.ngayKetThuc) < currentTime : false
            });
            const goiTap = activePackage.goiTapId || activePackage.maGoiTap;
            if (goiTap) {
                // Kiểm tra buổi tập có phù hợp với gói tập không
                const buoiTapForCheck = {
                    gioBatDau: buoiTap.gioBatDau || '00:00',
                    ngayTap: buoiTap.ngayTap
                };

                if (!isSessionAllowedForPackage(buoiTapForCheck, goiTap)) {
                    const tenGoiTap = goiTap.tenGoiTap.toLowerCase();
                    let errorMessage = 'Buổi tập này không phù hợp với gói tập của bạn';

                    if (tenGoiTap.includes('weekend') || tenGoiTap.includes('cuối tuần')) {
                        errorMessage = 'Gói Weekend Gym chỉ cho phép đăng ký vào Thứ 7 và Chủ nhật';
                    } else if (tenGoiTap.includes('morning') || tenGoiTap.includes('sáng')) {
                        errorMessage = 'Gói Morning Fitness chỉ cho phép đăng ký vào khung giờ sáng (05:00-11:00)';
                    } else if (tenGoiTap.includes('evening') || tenGoiTap.includes('tối')) {
                        errorMessage = 'Gói Evening chỉ cho phép đăng ký vào khung giờ tối (17:00-22:00)';
                    }

                    return res.status(400).json({
                        success: false,
                        message: errorMessage
                    });
                }
            }
        }

        // Thêm hội viên vào buổi tập
        await buoiTap.themHoiVien(userId);

        // Cập nhật LichTap nếu có
        const lichTap = await LichTap.findOne({ hoiVien: userId });
        if (lichTap) {
            // Kiểm tra xem buổi tập đã có trong danhSachBuoiTap chưa
            const existingBuoiTap = lichTap.danhSachBuoiTap.find(
                bt => bt.buoiTap?.toString() === buoiTapId.toString()
            );

            if (!existingBuoiTap) {
                lichTap.danhSachBuoiTap.push({
                    buoiTap: buoiTap._id,
                    ngayTap: buoiTap.ngayTap,
                    gioBatDau: buoiTap.gioBatDau,
                    gioKetThuc: buoiTap.gioKetThuc,
                    ptPhuTrach: buoiTap.ptPhuTrach,
                    trangThai: 'DA_DANG_KY',
                    ngayDangKy: new Date()
                });

                // Thêm vào cacBuoiTap nếu chưa có
                if (!lichTap.cacBuoiTap.includes(buoiTap._id)) {
                    lichTap.cacBuoiTap.push(buoiTap._id);
                }

                await lichTap.save();
            }
        }

        console.log('✅ registerSession - Registration successful for user:', userId, 'buoiTap:', buoiTapId);

        res.json({
            success: true,
            message: 'Đăng ký buổi tập thành công',
            data: {
                buoiTap: buoiTap,
                registrationInfo: {
                    ngayDangKy: new Date(),
                    trangThai: 'DA_DANG_KY'
                }
            }
        });

    } catch (error) {
        console.error('Error registering session:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi đăng ký buổi tập'
        });
    }
};

/**
 * Hủy đăng ký buổi tập (chỉ cho phép hủy trước 1 ngày)
 */
exports.cancelSession = async (req, res) => {
    try {
        const { buoiTapId } = req.body;
        const userId = req.user.id;

        if (!buoiTapId) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu buoiTapId'
            });
        }

        // Lấy thông tin buổi tập
        const buoiTap = await BuoiTap.findById(buoiTapId)
            .populate('chiNhanh')
            .populate('ptPhuTrach');

        if (!buoiTap) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy buổi tập'
            });
        }

        // Kiểm tra hội viên có đăng ký buổi tập này không
        const existingRegistration = buoiTap.danhSachHoiVien.find(
            member => member.hoiVien.toString() === userId.toString()
        );

        if (!existingRegistration) {
            return res.status(400).json({
                success: false,
                message: 'Bạn chưa đăng ký buổi tập này'
            });
        }

        // Kiểm tra trạng thái buổi tập
        if (existingRegistration.trangThai === 'DA_THAM_GIA') {
            return res.status(400).json({
                success: false,
                message: 'Không thể hủy buổi tập đã tham gia'
            });
        }

        // Kiểm tra thời gian: chỉ cho phép hủy trước 1 ngày
        const now = new Date();
        const buoiTapDate = new Date(buoiTap.ngayTap);
        const timeDiff = buoiTapDate.getTime() - now.getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);

        if (hoursDiff < 24) {
            return res.status(400).json({
                success: false,
                message: 'Chỉ có thể hủy buổi tập trước 24 giờ. Thời gian còn lại: ' + Math.round(hoursDiff) + ' giờ'
            });
        }

        // Xóa hội viên khỏi buổi tập
        await buoiTap.xoaHoiVien(userId);

        // Cập nhật LichTap nếu có
        const lichTap = await LichTap.findOne({ hoiVien: userId });
        if (lichTap) {
            // Xóa buổi tập khỏi danhSachBuoiTap
            lichTap.danhSachBuoiTap = lichTap.danhSachBuoiTap.filter(
                bt => bt.buoiTap?.toString() !== buoiTapId.toString()
            );

            // Xóa khỏi cacBuoiTap
            lichTap.cacBuoiTap = lichTap.cacBuoiTap.filter(
                id => id.toString() !== buoiTapId.toString()
            );

            await lichTap.save();
        }

        res.json({
            success: true,
            message: 'Hủy đăng ký buổi tập thành công',
            data: {
                buoiTap: buoiTap
            }
        });

    } catch (error) {
        console.error('Error canceling session:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi hủy đăng ký buổi tập'
        });
    }
};

/**
 * Lấy danh sách buổi tập có sẵn trong tuần hiện tại
 */
exports.getAvailableSessionsThisWeek = async (req, res) => {
    try {
        const userId = req.user.id;

        // Lấy thông tin hội viên
        const { HoiVien } = require('../models/NguoiDung');
        console.log('🔍 [available-sessions-this-week] Checking available sessions for user:', userId);
        const hoiVien = await HoiVien.findById(userId);
        if (!hoiVien) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy hội viên'
            });
        }

        // Ưu tiên lấy chi nhánh & gói tập từ LichTap (nếu đã tạo lịch)
        const lichTap = await LichTap.findOne({ hoiVien: userId })
            .populate('chiNhanh')
            .populate('goiTap');

        let chiNhanhId = null;
        let goiTapId = null;
        const chiNhanhIdFromQuery = req.query?.chiNhanhId || req.query?.branchId;
        const goiTapIdFromQuery = req.query?.goiTapId;

        if (lichTap && lichTap.chiNhanh) {
            chiNhanhId = lichTap.chiNhanh._id;
            goiTapId = lichTap.goiTap?._id || null;
            console.log('🏋️ [available-sessions-this-week] Using branch from LichTap:', {
                chiNhanhId,
                goiTapId
            });
        }

        // Nếu chưa có LichTap (trường hợp gói 1 tháng 299k, khách chỉ mua gói nhưng chưa tạo lịch),
        // fallback sang gói tập đang hoạt động của hội viên để lấy chi nhánh.
        if (!chiNhanhId) {
            console.log('ℹ️ [available-sessions-this-week] No LichTap with branch found. Fallback to active package.');

            const currentTime = new Date();

            const allUserPackages = await ChiTietGoiTap.find({
                $or: [
                    { maHoiVien: userId },
                    { nguoiDungId: userId }
                ]
            })
                .populate('maGoiTap')
                .populate('goiTapId')
                .populate('branchId')
                .sort({ ngayDangKy: -1, thoiGianDangKy: -1 });

            // Gói hợp lệ: đã thanh toán + đang hoạt động + chưa hết hạn
            const validPackages = allUserPackages.filter(pkg => {
                const isPaid = pkg.trangThaiThanhToan === 'DA_THANH_TOAN' || pkg.trangThaiDangKy === 'HOAN_THANH';
                const isActive = !pkg.trangThaiSuDung || ['DANG_HOAT_DONG', 'DANG_SU_DUNG', 'DANG_KICH_HOAT'].includes(pkg.trangThaiSuDung);
                const notExpired = !pkg.ngayKetThuc || new Date(pkg.ngayKetThuc) >= currentTime;
                return isPaid && isActive && notExpired;
            });

            const activePackage = validPackages[0] || allUserPackages[0] || null;

            console.log('📦 [available-sessions-this-week] Active package for fallback:', activePackage ? {
                _id: activePackage._id,
                tenGoiTap: activePackage.goiTapId?.tenGoiTap || activePackage.maGoiTap?.tenGoiTap,
                branchId: activePackage.branchId?._id,
                trangThaiThanhToan: activePackage.trangThaiThanhToan,
                trangThaiDangKy: activePackage.trangThaiDangKy,
                trangThaiSuDung: activePackage.trangThaiSuDung,
                ngayKetThuc: activePackage.ngayKetThuc
            } : null);

            if (activePackage && activePackage.branchId) {
                chiNhanhId = activePackage.branchId._id;
                goiTapId = activePackage.goiTapId?._id || activePackage.maGoiTap?._id || null;

                // Kiểm tra gói tập có hết hạn không
                if (activePackage.ngayKetThuc && new Date(activePackage.ngayKetThuc) < currentTime) {
                    // Tạo notification về gói tập hết hạn (nếu chưa có)
                    try {
                        const existingNotification = await UserNotification.findOne({
                            userId: userId,
                            loaiThongBao: 'GOI_TAP_HET_HAN',
                            'duLieuLienQuan.chiTietGoiTapId': activePackage._id.toString(),
                            daDoc: false
                        });

                        if (!existingNotification) {
                            const goiTap = activePackage.goiTapId || activePackage.maGoiTap;
                            await UserNotification.create({
                                userId: userId,
                                loaiThongBao: 'GOI_TAP_HET_HAN',
                                tieuDe: 'Gói tập đã hết hạn',
                                noiDung: `Gói tập "${goiTap?.tenGoiTap || 'của bạn'}" đã hết hạn. Vui lòng gia hạn hoặc đăng ký gói tập mới để tiếp tục sử dụng dịch vụ.`,
                                duLieuLienQuan: {
                                    chiTietGoiTapId: activePackage._id,
                                    goiTapId: goiTap?._id
                                },
                                daDoc: false
                            });
                            console.log(`📢 Created expiration notification for user ${userId}, package ${activePackage._id}`);
                        }
                    } catch (notifError) {
                        console.error('❌ Error creating expiration notification:', notifError);
                    }

                    return res.status(400).json({
                        success: false,
                        message: 'Gói tập của bạn đã hết hạn. Vui lòng gia hạn hoặc đăng ký gói tập mới để tiếp tục đăng ký buổi tập.',
                        isExpired: true
                    });
                }
            }
        }

        // Cho phép override chi nhánh/gói từ query (case: user chọn chi nhánh khác)
        if (chiNhanhIdFromQuery) {
            chiNhanhId = chiNhanhIdFromQuery;
            if (goiTapIdFromQuery) {
                goiTapId = goiTapIdFromQuery;
            }
            console.log('🔀 [available-sessions-this-week] Override chi nhánh từ query:', {
                chiNhanhId,
                goiTapId
            });
        }

        if (!chiNhanhId) {
            return res.status(400).json({
                success: false,
                message: 'Hội viên chưa chọn chi nhánh cho gói tập. Vui lòng hoàn tất đăng ký gói tập hoặc chọn chi nhánh.'
            });
        }

        // Tính ngày đầu và cuối tuần hiện tại (Vietnam timezone)
        const now = new Date();
        const utcTime = now.getTime() + (now.getTimezoneOffset() * 60 * 1000);
        const vietnamTime = new Date(utcTime + (7 * 60 * 60 * 1000));
        const dayOfWeek = vietnamTime.getUTCDay(); // 0 = Sunday, 1 = Monday, ...
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Số ngày cần lùi lại để đến thứ 2

        const weekStart = new Date(vietnamTime);
        weekStart.setUTCDate(vietnamTime.getUTCDate() - daysToMonday);
        weekStart.setUTCHours(0, 0, 0, 0);
        const weekStartUTC = new Date(weekStart.getTime() - (7 * 60 * 60 * 1000));

        const weekEnd = new Date(weekStart);
        weekEnd.setUTCDate(weekStart.getUTCDate() + 7);
        const weekEndUTC = new Date(weekEnd.getTime() - (7 * 60 * 60 * 1000));

        // Lấy các buổi tập trong tuần tại chi nhánh của hội viên
        const buoiTaps = await BuoiTap.find({
            chiNhanh: chiNhanhId,
            ngayTap: {
                $gte: weekStartUTC,
                $lt: weekEndUTC
            },
            trangThai: { $ne: 'HUY' }
        })
            .populate('ptPhuTrach', 'hoTen')
            .populate('chiNhanh', 'tenChiNhanh')
            .sort({ ngayTap: 1, gioBatDau: 1 });

        // Xác định gói tập hiện tại (nếu có) để áp dụng ràng buộc Weekend/Morning/Evening
        let goiTapForFilter = null;
        if (goiTapId) {
            try {
                goiTapForFilter = await GoiTap.findById(goiTapId);
                console.log('📦 [available-sessions-this-week] Using package for filter:', {
                    goiTapId: goiTapId,
                    tenGoiTap: goiTapForFilter?.tenGoiTap
                });
            } catch (e) {
                console.error('❌ [available-sessions-this-week] Error loading GoiTap for filter:', e);
            }
        }

        // Lọc các buổi tập mà hội viên chưa đăng ký, còn chỗ
        // Và (nếu có gói Weekend/Morning/Evening) thì chỉ giữ các buổi phù hợp với gói
        const availableSessions = buoiTaps.filter(bt => {
            // Kiểm tra còn chỗ
            if (bt.daDay) return false;

            // Kiểm tra hội viên chưa đăng ký buổi tập cụ thể này trong BuoiTap.danhSachHoiVien
            const isRegistered = bt.danhSachHoiVien.some(
                member => member.hoiVien.toString() === userId.toString()
            );
            if (isRegistered) return false;

            // Kiểm tra xem người dùng đã đăng ký khung giờ này trong LichTap chưa
            // Lấy ngày và giờ của buổi tập hiện tại
            const btNgayTap = new Date(bt.ngayTap);
            const btNgayTapStr = btNgayTap.toISOString().split('T')[0]; // YYYY-MM-DD
            const btGioBatDau = bt.gioBatDau || '00:00';

            // Kiểm tra trong LichTap xem đã có buổi tập nào cùng ngày và cùng khung giờ chưa
            if (lichTap && lichTap.danhSachBuoiTap && lichTap.danhSachBuoiTap.length > 0) {
                const hasConflictingSession = lichTap.danhSachBuoiTap.some(scheduledBuoi => {
                    const scheduledNgayTap = new Date(scheduledBuoi.ngayTap);
                    const scheduledNgayTapStr = scheduledNgayTap.toISOString().split('T')[0];
                    const scheduledGioBatDau = scheduledBuoi.gioBatDau || '00:00';

                    // Kiểm tra cùng ngày và cùng khung giờ
                    const isSameDay = btNgayTapStr === scheduledNgayTapStr;
                    const isSameTimeSlot = btGioBatDau === scheduledGioBatDau;

                    return isSameDay && isSameTimeSlot && scheduledBuoi.trangThai !== 'HUY';
                });

                if (hasConflictingSession) {
                    console.log('🚫 [available-sessions-this-week] Session filtered - already registered same time slot:', {
                        sessionId: bt._id,
                        tenBuoiTap: bt.tenBuoiTap,
                        ngayTap: btNgayTapStr,
                        gioBatDau: btGioBatDau
                    });
                    return false;
                }
            }

            // Áp dụng ràng buộc theo gói (Weekend Gym chỉ T7/CN, Morning/Evening theo khung giờ...)
            if (goiTapForFilter) {
                const buoiTapForCheck = {
                    gioBatDau: bt.gioBatDau || '00:00',
                    ngayTap: bt.ngayTap
                };

                const allowed = isSessionAllowedForPackage(buoiTapForCheck, goiTapForFilter);
                if (!allowed) {
                    console.log('🚫 [available-sessions-this-week] Session filtered out by package rules:', {
                        sessionId: bt._id,
                        tenBuoiTap: bt.tenBuoiTap,
                        ngayTap: bt.ngayTap,
                        gioBatDau: bt.gioBatDau,
                        tenGoiTap: goiTapForFilter.tenGoiTap
                    });
                    return false;
                }
            }

            return true;
        });

        res.json({
            success: true,
            data: availableSessions
        });

    } catch (error) {
        console.error('Error getting available sessions:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi lấy danh sách buổi tập'
        });
    }
};

/**
 * Tạo lịch tập cho hội viên
 */
exports.createWorkoutSchedule = async (req, res) => {
    try {
        console.log('🎯 createWorkoutSchedule called with:', req.body);
        const {
            goiTapId,
            chiNhanhId,
            tuanBatDau,
            soNgayTapTrongTuan,
            gioTapUuTien,
            danhSachBuoiTap
        } = req.body;
        const userId = req.user.id;

        // Validation
        if (!goiTapId || !chiNhanhId || !tuanBatDau || !soNgayTapTrongTuan || !danhSachBuoiTap) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin bắt buộc'
            });
        }

        if (danhSachBuoiTap.length > soNgayTapTrongTuan) {
            return res.status(400).json({
                success: false,
                message: 'Số buổi tập vượt quá giới hạn'
            });
        }

        // Lấy thông tin gói tập để kiểm tra ràng buộc
        const goiTap = await GoiTap.findById(goiTapId);
        if (!goiTap) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy gói tập'
            });
        }

        // Validate tất cả các buổi tập có phù hợp với gói tập không
        for (const buoi of danhSachBuoiTap) {
            const buoiTap = await BuoiTap.findById(buoi.buoiTapId);
            if (!buoiTap) {
                return res.status(404).json({
                    success: false,
                    message: `Không tìm thấy buổi tập với ID: ${buoi.buoiTapId}`
                });
            }

            const buoiTapForCheck = {
                gioBatDau: buoiTap.gioBatDau || buoi.gioBatDau || '00:00',
                ngayTap: buoiTap.ngayTap || new Date(buoi.ngayTap)
            };

            if (!isSessionAllowedForPackage(buoiTapForCheck, goiTap)) {
                const tenGoiTap = goiTap.tenGoiTap.toLowerCase();
                let errorMessage = 'Một số buổi tập không phù hợp với gói tập của bạn';

                if (tenGoiTap.includes('weekend') || tenGoiTap.includes('cuối tuần')) {
                    errorMessage = 'Gói Weekend Gym chỉ cho phép đăng ký vào Thứ 7 và Chủ nhật';
                } else if (tenGoiTap.includes('morning') || tenGoiTap.includes('sáng')) {
                    errorMessage = 'Gói Morning Fitness chỉ cho phép đăng ký vào khung giờ sáng (05:00-11:00)';
                } else if (tenGoiTap.includes('evening') || tenGoiTap.includes('tối')) {
                    errorMessage = 'Gói Evening chỉ cho phép đăng ký vào khung giờ tối (17:00-22:00)';
                }

                return res.status(400).json({
                    success: false,
                    message: errorMessage
                });
            }
        }

        // Tính ngày kết thúc tuần
        const startDate = new Date(tuanBatDau);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);

        // Get PT from the first session or use a default PT
        let ptId = null;
        if (danhSachBuoiTap.length > 0) {
            const firstSession = await BuoiTap.findById(danhSachBuoiTap[0].buoiTapId);
            if (firstSession && firstSession.ptPhuTrach) {
                ptId = firstSession.ptPhuTrach;
            }
        }

        // If no PT found, get any available PT
        if (!ptId) {
            const { PT } = require('../models/NguoiDung');
            const anyPT = await PT.findOne();
            if (anyPT) {
                ptId = anyPT._id;
            }
        }

        // Tạo lịch tập mới với schema phù hợp
        const lichTap = new LichTap({
            hoiVien: userId,
            pt: ptId, // Required field
            ngayBatDau: startDate, // Required field
            ngayKetThuc: endDate, // Required field
            goiTap: goiTapId,
            chiNhanh: chiNhanhId,
            tuanBatDau: startDate,
            tuanKetThuc: endDate,
            soNgayTapTrongTuan,
            gioTapUuTien: gioTapUuTien || [],
            danhSachBuoiTap: danhSachBuoiTap.map(buoi => ({
                buoiTap: buoi.buoiTapId,
                ngayTap: new Date(buoi.ngayTap),
                gioBatDau: buoi.gioBatDau,
                gioKetThuc: buoi.gioKetThuc,
                ptPhuTrach: buoi.ptPhuTrach,
                trangThai: 'DA_DANG_KY',
                ngayDangKy: new Date()
            })),
            trangThai: 'DANG_HOAT_DONG'
        });

        await lichTap.save();

        // Xóa notification đăng ký lịch tập tuần sau nếu có
        try {
            const weekStartStr = startDate.toISOString().split('T')[0]; // YYYY-MM-DD
            await UserNotification.deleteMany({
                userId: userId,
                loaiThongBao: 'WORKOUT_REMINDER',
                'duLieuLienQuan.weekStart': weekStartStr
            });
            console.log('✅ [Backend] Deleted schedule registration notifications for user:', userId);
        } catch (error) {
            console.error('❌ [Backend] Error deleting schedule registration notifications:', error);
            // Không throw error, chỉ log
        }

        // Đăng ký các buổi tập (sử dụng SessionOption model)
        for (const buoi of danhSachBuoiTap) {
            const session = await BuoiTap.findById(buoi.buoiTapId);
            if (session) {
                // Tăng số lượng đã đăng ký
                session.soLuongHienTai = (session.soLuongHienTai || 0) + 1;
                if (session.soLuongHienTai >= session.soLuongToiDa) {
                    session.trangThai = 'HET_CHO';
                }
                await session.save();
            }
        }

        // Populate để trả về đầy đủ thông tin
        const populatedLichTap = await LichTap.findById(lichTap._id)
            .populate('hoiVien', 'hoTen sdt')
            .populate('pt', 'hoTen chuyenMon')
            .populate('goiTap', 'tenGoiTap donGia')
            .populate('chiNhanh', 'tenChiNhanh diaChi')
            .populate('danhSachBuoiTap.ptPhuTrach', 'hoTen chuyenMon')
            .populate('danhSachBuoiTap.buoiTap');

        res.json({
            success: true,
            message: 'Tạo lịch tập thành công',
            data: populatedLichTap
        });

    } catch (error) {
        console.error('Error creating workout schedule:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi tạo lịch tập'
        });
    }
};

/**
 * Lấy lịch tập của hội viên
 */
exports.getMemberSchedule = async (req, res) => {
    try {
        const { hoiVienId } = req.params;
        const userId = req.user.id;

        // Kiểm tra quyền truy cập
        if (hoiVienId !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền truy cập'
            });
        }

        const lichTaps = await LichTap.find({ hoiVien: hoiVienId })
            .populate('goiTap', 'tenGoiTap donGia')
            .populate('chiNhanh', 'tenChiNhanh diaChi')
            .populate('danhSachBuoiTap.ptPhuTrach', 'hoTen chuyenMon')
            .populate('danhSachBuoiTap.buoiTap')
            .sort({ tuanBatDau: -1 });

        res.json({
            success: true,
            data: lichTaps
        });

    } catch (error) {
        console.error('Error getting member schedule:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy lịch tập'
        });
    }
};

/**
 * Lấy tất cả lịch tập (cho dashboard)
 */
exports.getAllSchedules = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;

        let query = {};

        // Nếu là hội viên, chỉ lấy lịch tập của họ
        if (userRole === 'HoiVien') {
            query.hoiVien = userId;
        }

        const lichTaps = await LichTap.find(query)
            .populate('hoiVien', 'hoTen sdt')
            .populate('goiTap', 'tenGoiTap donGia')
            .populate('chiNhanh', 'tenChiNhanh diaChi')
            .populate('pt', 'hoTen chuyenMon')
            .sort({ ngayBatDau: -1 })
            .limit(10);

        // Chuyển đổi dữ liệu để phù hợp với frontend
        const formattedData = lichTaps.map(lichTap => ({
            _id: lichTap._id,
            tenBuoiTap: lichTap.goiTap?.tenGoiTap || 'Buổi tập',
            thoiGian: lichTap.ngayBatDau ? new Date(lichTap.ngayBatDau).toLocaleString('vi-VN') : '',
            ptName: lichTap.pt?.hoTen || 'Chưa có PT',
            ptAvatar: lichTap.pt?.anhDaiDien || 'https://i.pravatar.cc/150?img=12',
            trangThai: lichTap.trangThaiLich || 'DANG_HOAT_DONG'
        }));

        res.json({
            success: true,
            data: formattedData
        });

    } catch (error) {
        console.error('Error getting all schedules:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi lấy danh sách lịch tập',
            error: error.message
        });
    }
};

// Helper functions

/**
 * Kiểm tra buổi tập có phù hợp với gói tập không
 */
function isSessionAllowedForPackage(buoiTap, goiTap) {
    const tenGoiTap = goiTap.tenGoiTap.toLowerCase();
    const gioBatDau = parseInt(buoiTap.gioBatDau.split(':')[0]);

    // Lấy ngày tập - có thể là 'ngayTap' hoặc 'ngay' tùy vào context
    const ngayTapValue = buoiTap.ngayTap || buoiTap.ngay;

    // Debug: Log thông tin gói tập để kiểm tra
    const isWeekendPackage = tenGoiTap.includes('weekend') || tenGoiTap.includes('cuối tuần');
    if (!isWeekendPackage) {
        // Nếu không phải Weekend Gym, return true ngay lập tức (cho phép tất cả)
        console.log('✅ [Package Check] Non-restricted package, allowing session:', {
            goiTapId: goiTap._id,
            tenGoiTap: goiTap.tenGoiTap,
            sessionId: buoiTap._id,
            tenBuoiTap: buoiTap.tenBuoiTap,
            ngayTap: ngayTapValue
        });
        return true;
    }

    // Xử lý ngày tập - đảm bảo lấy đúng ngày theo timezone local (Vietnam UTC+7)
    let ngayTap;
    if (ngayTapValue instanceof Date) {
        // Nếu là Date object từ MongoDB, có thể là UTC
        // Lấy local date components để tránh timezone issues
        // Sử dụng getFullYear, getMonth, getDate thay vì UTC để lấy theo local timezone
        const year = ngayTapValue.getFullYear();
        const month = ngayTapValue.getMonth();
        const day = ngayTapValue.getDate();
        ngayTap = new Date(year, month, day, 12, 0, 0); // Set giữa trưa để tránh timezone shift
    } else if (typeof ngayTapValue === 'string') {
        // Nếu là string ISO (có T hoặc có timezone), parse cẩn thận
        if (ngayTapValue.includes('T') || ngayTapValue.includes('Z') || ngayTapValue.includes('+')) {
            // ISO string với time - lấy phần date và tạo local date
            const dateStr = ngayTapValue.split('T')[0];
            const [year, month, day] = dateStr.split('-').map(Number);
            ngayTap = new Date(year, month - 1, day, 12, 0, 0); // Month is 0-indexed, set giữa trưa
        } else if (ngayTapValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
            // Format YYYY-MM-DD
            const [year, month, day] = ngayTapValue.split('-').map(Number);
            ngayTap = new Date(year, month - 1, day, 12, 0, 0);
        } else {
            // Fallback: parse như bình thường và normalize
            const tempDate = new Date(ngayTapValue);
            const year = tempDate.getFullYear();
            const month = tempDate.getMonth();
            const day = tempDate.getDate();
            ngayTap = new Date(year, month, day, 12, 0, 0);
        }
    } else {
        // Fallback: parse và normalize
        const tempDate = new Date(ngayTapValue);
        const year = tempDate.getFullYear();
        const month = tempDate.getMonth();
        const day = tempDate.getDate();
        ngayTap = new Date(year, month, day, 12, 0, 0);
    }

    // Lấy thứ trong tuần (0 = Chủ nhật, 1 = Thứ 2, ..., 6 = Thứ 7)
    const thuTrongTuan = ngayTap.getDay();

    // Ràng buộc cho gói Morning Fitness
    if (tenGoiTap.includes('morning') || tenGoiTap.includes('sáng')) {
        return gioBatDau >= 5 && gioBatDau <= 11;
    }

    // Ràng buộc cho gói Weekend Gym (chỉ cho phép Thứ 7 và Chủ nhật)
    // LƯU Ý: Chỉ áp dụng cho gói có tên chứa "weekend" hoặc "cuối tuần"
    // Các gói khác sẽ return true ở cuối hàm (cho phép đăng ký từ T2 đến CN)
    if (tenGoiTap.includes('weekend') || tenGoiTap.includes('cuối tuần')) {
        // Thứ 7 = 6, Chủ nhật = 0
        const isWeekend = thuTrongTuan === 6 || thuTrongTuan === 0;
        console.log('🔍 [Weekend Gym Check]', {
            tenGoiTap,
            goiTapId: goiTap._id,
            ngayTapOriginal: ngayTapValue,
            ngayTapParsed: ngayTap.toISOString(),
            thuTrongTuan,
            isWeekend,
            ngayTapType: typeof ngayTapValue,
            dayName: ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][thuTrongTuan]
        });
        return isWeekend;
    }

    // Ràng buộc cho gói Evening (chỉ cho phép khung giờ tối)
    if (tenGoiTap.includes('evening') || tenGoiTap.includes('tối')) {
        return gioBatDau >= 17 && gioBatDau <= 22;
    }

    // Các gói khác KHÔNG có ràng buộc - cho phép đăng ký từ T2 đến CN
    // Bao gồm: Basic, Premium, VIP, và các gói khác không phải Weekend/Morning/Evening
    return true;
}

/**
 * Lấy ràng buộc của gói tập
 */
function getPackageConstraints(goiTap) {
    const tenGoiTap = goiTap.tenGoiTap.toLowerCase();

    if (tenGoiTap.includes('morning') || tenGoiTap.includes('sáng')) {
        return {
            timeRestriction: '05:00-11:00',
            dayRestriction: null,
            description: 'Chỉ được chọn buổi tập vào khung giờ sáng (05:00-11:00)'
        };
    }

    if (tenGoiTap.includes('weekend') || tenGoiTap.includes('cuối tuần')) {
        return {
            timeRestriction: null,
            dayRestriction: ['Thứ 7', 'Chủ nhật'],
            description: 'Chỉ được chọn ngày Thứ 7 và Chủ nhật'
        };
    }

    if (tenGoiTap.includes('evening') || tenGoiTap.includes('tối')) {
        return {
            timeRestriction: '17:00-22:00',
            dayRestriction: null,
            description: 'Chỉ được chọn buổi tập vào khung giờ tối (17:00-22:00)'
        };
    }

    return {
        timeRestriction: null,
        dayRestriction: null,
        description: 'Không có ràng buộc thời gian'
    };
}

/**
 * Lấy danh sách ngày trong tuần
 */
function getWeekDays(startDate) {
    const days = [];
    const start = new Date(startDate);

    for (let i = 0; i < 7; i++) {
        const day = new Date(start);
        day.setDate(start.getDate() + i);
        days.push({
            date: day,
            dayOfWeek: day.getDay(),
            dayName: getDayName(day.getDay()),
            isToday: isToday(day),
            isPast: day < new Date()
        });
    }

    return days;
}

function getDayName(dayOfWeek) {
    const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    return days[dayOfWeek];
}

function isToday(date) {
    const today = new Date();
    return date.toDateString() === today.toDateString();
}

/**
 * Kiểm tra điều kiện đăng ký lịch tập tuần sau
 */
exports.checkRegistrationEligibility = async (req, res) => {
    try {
        // Kiểm tra role - chỉ Hội viên mới có thể đăng ký lịch tập
        if (req.user.vaiTro !== 'HoiVien') {
            return res.json({
                success: true,
                canRegister: false,
                hasCompletedPackage: false,
                isRegistrationTime: false,
                message: 'Chức năng này chỉ dành cho Hội viên',
                userRole: req.user.vaiTro
            });
        }

        const userId = req.user.id;

        // Kiểm tra hội viên có gói tập đang hoạt động VÀ đã hoàn tất việc đăng ký gói tập
        // Chỉ cho phép đăng ký khi trangThaiDangKy = 'HOAN_THANH' (đã hoàn tất workflow)

        // Trước tiên, kiểm tra tất cả gói tập của user để debug
        const allPackages = await ChiTietGoiTap.find({
            $or: [
                { maHoiVien: userId },
                { nguoiDungId: userId }
            ]
        })
            .populate('maGoiTap')
            .populate('goiTapId')
            .populate('branchId')
            .sort({ ngayDangKy: -1, thoiGianDangKy: -1 });

        console.log('📦 All packages for user:', {
            userId,
            totalPackages: allPackages.length,
            packages: allPackages.map(p => ({
                _id: p._id,
                trangThaiDangKy: p.trangThaiDangKy,
                trangThaiSuDung: p.trangThaiSuDung,
                ngayKetThuc: p.ngayKetThuc,
                goiTapId: p.goiTapId?._id || p.maGoiTap?._id
            }))
        });

        // Tính tuần tiếp theo (Thứ 2) - di chuyển lên trước để dùng cho cả 2 trường hợp
        const now = new Date();
        const currentTime = now; // Dùng cho kiểm tra hết hạn
        const day = now.getDay(); // 0 = CN, 6 = T7
        const daysUntilMonday = day === 0 ? 1 : 8 - day;
        const nextWeekStart = new Date(now);
        nextWeekStart.setDate(now.getDate() + daysUntilMonday);
        nextWeekStart.setHours(0, 0, 0, 0);
        const nextWeekEnd = new Date(nextWeekStart);
        nextWeekEnd.setDate(nextWeekStart.getDate() + 6);
        nextWeekEnd.setHours(23, 59, 59, 999);

        // Kiểm tra thời gian hiện tại có phải T7/CN từ 12h trưa trở đi
        const hour = now.getHours();
        const minute = now.getMinutes();
        const isSaturday = day === 6;
        const isSunday = day === 0;
        // Cho phép đăng ký từ 12h trưa trở đi trong ngày T7/CN
        const isRegistrationTime = (isSaturday || isSunday) && hour >= 12;

        // Lấy tất cả gói tập của user và filter trong code để tìm gói đang hoạt động tốt nhất
        const allUserPackages = await ChiTietGoiTap.find({
            $or: [
                { maHoiVien: userId },
                { nguoiDungId: userId }
            ]
        })
            .populate('maGoiTap')
            .populate('goiTapId')
            .populate('branchId')
            .sort({ ngayDangKy: -1, thoiGianDangKy: -1 });

        // QUAN TRỌNG: Kiểm tra gói MỚI NHẤT (đã thanh toán) có đang trong quá trình workflow chưa hoàn tất không
        // Nếu gói mới nhất chưa hoàn tất, KHÔNG cho phép đăng ký lịch tập
        const latestPaidPackage = allUserPackages.find(pkg =>
            pkg.trangThaiThanhToan === 'DA_THANH_TOAN'
        );

        if (latestPaidPackage) {
            // Nếu gói mới nhất chưa hoàn tất workflow (chưa chọn PT hoặc chưa tạo lịch), CHẶN đăng ký
            // Lưu ý: trạng thái 'DA_TAO_LICH' được xem là gần hoàn tất và sẽ được cho phép tiếp tục
            if (latestPaidPackage.trangThaiDangKy &&
                ['CHO_CHON_PT', 'DA_CHON_PT'].includes(latestPaidPackage.trangThaiDangKy)) {
                console.log('⚠️ [Backend] Latest paid package not completed - block registration:', {
                    pendingPackageId: latestPaidPackage._id,
                    trangThaiDangKy: latestPaidPackage.trangThaiDangKy,
                    trangThaiSuDung: latestPaidPackage.trangThaiSuDung
                });

                return res.json({
                    success: false,
                    canRegister: false,
                    message: 'Bạn đang có gói tập mới cần hoàn tất các bước đăng ký / nâng cấp. Vui lòng hoàn tất quy trình gói tập trước khi đăng ký lịch tập.',
                    hasActivePackage: true,
                    hasCompletedPackage: false,
                    isRegistrationTime,
                    packageInfo: {
                        _id: latestPaidPackage._id,
                        trangThaiThanhToan: latestPaidPackage.trangThaiThanhToan,
                        trangThaiDangKy: latestPaidPackage.trangThaiDangKy,
                        trangThaiSuDung: latestPaidPackage.trangThaiSuDung
                    },
                    nextWeekStart: nextWeekStart.toISOString(),
                    nextWeekEnd: nextWeekEnd.toISOString()
                });
            }
        }

        // Filter và sắp xếp gói tập theo độ ưu tiên - CHỈ tìm gói ĐÃ HOÀN TẤT
        let activePackage = null;

        // Ưu tiên 1: Gói đã thanh toán, ĐÃ HOÀN TẤT (trangThaiDangKy === 'HOAN_THANH' hoặc 'DA_TAO_LICH'),
        // chưa hết hạn và KHÔNG ở trạng thái bị huỷ / hết hạn
        const validPackages = allUserPackages.filter(pkg => {
            const isPaid = pkg.trangThaiThanhToan === 'DA_THANH_TOAN';
            const isCompleted = ['HOAN_THANH', 'DA_TAO_LICH'].includes(pkg.trangThaiDangKy);
            // Chấp nhận mọi trạng thái sử dụng trừ HET_HAN / DA_HUY
            const isActive = !pkg.trangThaiSuDung || !['HET_HAN', 'DA_HUY'].includes(pkg.trangThaiSuDung);
            const notExpired = !pkg.ngayKetThuc || new Date(pkg.ngayKetThuc) >= currentTime;
            return isPaid && isCompleted && isActive && notExpired;
        });

        if (validPackages.length > 0) {
            // Ưu tiên gói mới nhất (đã sort ở trên)
            activePackage = validPackages[0];
        } else {
            // Nếu không có gói hợp lệ, không cho phép đăng ký
            activePackage = null;
        }

        console.log('📦 [Backend] Package selection logic:', {
            userId,
            totalPackages: allUserPackages.length,
            validPackagesCount: validPackages.length,
            selectedPackage: activePackage ? {
                _id: activePackage._id,
                tenGoiTap: activePackage.goiTapId?.tenGoiTap || activePackage.maGoiTap?.tenGoiTap,
                goiTapId: activePackage.goiTapId?._id || activePackage.maGoiTap?._id,
                trangThaiThanhToan: activePackage.trangThaiThanhToan,
                trangThaiDangKy: activePackage.trangThaiDangKy,
                trangThaiSuDung: activePackage.trangThaiSuDung,
                ngayKetThuc: activePackage.ngayKetThuc,
                isExpired: activePackage.ngayKetThuc ? new Date(activePackage.ngayKetThuc) < currentTime : false
            } : null,
            allPackages: allUserPackages.map(p => ({
                _id: p._id,
                tenGoiTap: p.goiTapId?.tenGoiTap || p.maGoiTap?.tenGoiTap,
                goiTapId: p.goiTapId?._id || p.maGoiTap?._id,
                trangThaiThanhToan: p.trangThaiThanhToan,
                trangThaiDangKy: p.trangThaiDangKy,
                trangThaiSuDung: p.trangThaiSuDung,
                ngayKetThuc: p.ngayKetThuc,
                isExpired: p.ngayKetThuc ? new Date(p.ngayKetThuc) < currentTime : false
            }))
        });

        console.log('📦 [Backend] Active package check:', {
            userId,
            foundPackage: !!activePackage,
            packageStatus: activePackage ? {
                _id: activePackage._id,
                trangThaiDangKy: activePackage.trangThaiDangKy,
                trangThaiSuDung: activePackage.trangThaiSuDung,
                goiTapId: activePackage.goiTapId?._id || activePackage.maGoiTap?._id,
                chiNhanhId: activePackage.branchId?._id,
                ngayKetThuc: activePackage.ngayKetThuc
            } : null,
            allPackagesCount: allPackages.length,
            allPackagesStatus: allPackages.map(p => ({
                _id: p._id,
                trangThaiDangKy: p.trangThaiDangKy,
                trangThaiSuDung: p.trangThaiSuDung
            }))
        });

        console.log('🕐 [Backend] Registration time check:', {
            day,
            dayName: isSaturday ? 'Saturday' : isSunday ? 'Sunday' : 'Other',
            hour,
            minute,
            isSaturday,
            isSunday,
            isRegistrationTime,
            now: now.toISOString(),
            localTime: now.toLocaleString('vi-VN')
        });

        // Kiểm tra gói tập có hợp lệ không (đã thanh toán & đã hoàn tất workflow & đang hoạt động)
        const hasValidPackage = activePackage && (
            activePackage.trangThaiThanhToan === 'DA_THANH_TOAN' &&
            ['HOAN_THANH', 'DA_TAO_LICH'].includes(activePackage.trangThaiDangKy) &&
            (!activePackage.trangThaiSuDung || !['HET_HAN', 'DA_HUY'].includes(activePackage.trangThaiSuDung))
        );

        if (!hasValidPackage) {
            console.log('⚠️ [Backend] No valid (fully completed) package found:', {
                hasPackage: !!activePackage,
                packageStatus: activePackage ? {
                    trangThaiThanhToan: activePackage.trangThaiThanhToan,
                    trangThaiDangKy: activePackage.trangThaiDangKy,
                    trangThaiSuDung: activePackage.trangThaiSuDung
                } : null
            });

            return res.json({
                success: false,
                canRegister: false,
                message: 'Bạn chưa có gói tập đang hoạt động hoặc chưa hoàn tất quy trình đăng ký gói tập. Vui lòng hoàn tất đăng ký / nâng cấp gói tập trước khi đặt lịch.',
                hasActivePackage: false,
                hasCompletedPackage: false,
                isRegistrationTime,
                nextWeekStart: nextWeekStart.toISOString(),
                nextWeekEnd: new Date(nextWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString()
            });
        }

        // Lưu nextWeekEnd để dùng cho notification
        const nextWeekEndForNotification = new Date(nextWeekEnd);

        const existingSchedule = await LichTap.findOne({
            hoiVien: userId,
            tuanBatDau: {
                $gte: nextWeekStart,
                $lte: nextWeekEnd
            },
            trangThai: { $ne: 'HUY' }
        });

        // Cho phép đăng ký nếu:
        // 1. Đúng thời gian (T7/CN từ 12h trưa)
        // 2. Chưa đăng ký lịch tập cho tuần sau
        // 3. Có gói tập hợp lệ
        const canRegister = isRegistrationTime && !existingSchedule && hasValidPackage;

        // Tạo notification nếu có thể đăng ký và đúng thời gian
        if (canRegister && isRegistrationTime) {
            try {
                // Kiểm tra xem đã có notification cho tuần này chưa
                const weekStartStr = nextWeekStart.toISOString().split('T')[0]; // YYYY-MM-DD
                const existingNotification = await UserNotification.findOne({
                    userId: userId,
                    loaiThongBao: 'WORKOUT_REMINDER',
                    'duLieuLienQuan.weekStart': weekStartStr,
                    createdAt: {
                        $gte: new Date(new Date().setHours(0, 0, 0, 0)) // Từ đầu ngày hôm nay
                    }
                });

                if (!existingNotification) {
                    // Tạo notification mới
                    const nextWeekEnd = new Date(nextWeekStart);
                    nextWeekEnd.setDate(nextWeekStart.getDate() + 6);
                    const weekRange = `${nextWeekStart.toLocaleDateString('vi-VN')} - ${nextWeekEnd.toLocaleDateString('vi-VN')}`;

                    const notification = new UserNotification({
                        userId: userId,
                        tieuDe: 'Đăng ký lịch tập tuần sau',
                        noiDung: `Vui lòng đăng ký lịch tập cho tuần sau (${weekRange}). Bạn có thể đăng ký các buổi tập phù hợp với lịch trình của mình.`,
                        loaiThongBao: 'WORKOUT_REMINDER',
                        daDoc: false,
                        duLieuLienQuan: {
                            weekStart: weekStartStr,
                            nextWeekStart: nextWeekStart.toISOString(),
                            nextWeekEnd: nextWeekEnd.toISOString(),
                            actionUrl: '/schedule',
                            canRegister: true
                        }
                    });

                    await notification.save();
                    console.log('✅ [Backend] Created schedule registration notification for user:', userId);
                } else {
                    console.log('ℹ️ [Backend] Schedule registration notification already exists for user:', userId);
                }
            } catch (error) {
                console.error('❌ [Backend] Error creating schedule registration notification:', error);
                // Không throw error, chỉ log để không ảnh hưởng đến response
            }
        }

        console.log('✅ [Backend] Eligibility check result:', {
            canRegister,
            isRegistrationTime,
            hasExistingSchedule: !!existingSchedule,
            hasActivePackage: hasValidPackage,
            hasCompletedPackage: hasValidPackage,
            nextWeekStart: nextWeekStart.toISOString(),
            nextWeekEnd: nextWeekEnd.toISOString(),
            reason: !isRegistrationTime ? 'Not registration time' :
                !hasValidPackage ? 'No valid package' :
                    existingSchedule ? 'Already registered' :
                        'Can register',
            packageInfo: activePackage ? {
                _id: activePackage._id,
                trangThaiThanhToan: activePackage.trangThaiThanhToan,
                trangThaiDangKy: activePackage.trangThaiDangKy,
                trangThaiSuDung: activePackage.trangThaiSuDung
            } : null
        });

        // Log thông tin gói tập đang được trả về
        const returnedPackage = activePackage ? {
            _id: activePackage._id,
            goiTapId: activePackage.goiTapId?._id || activePackage.maGoiTap?._id,
            chiNhanhId: activePackage.branchId?._id,
            tenGoiTap: activePackage.goiTapId?.tenGoiTap || activePackage.maGoiTap?.tenGoiTap,
            trangThaiDangKy: activePackage.trangThaiDangKy,
            trangThaiSuDung: activePackage.trangThaiSuDung
        } : null;

        console.log('📦 [Backend] Returning activePackage to frontend:', {
            userId,
            returnedPackage,
            isWeekendPackage: returnedPackage?.tenGoiTap?.toLowerCase().includes('weekend') || returnedPackage?.tenGoiTap?.toLowerCase().includes('cuối tuần'),
            allPackages: allPackages.map(p => ({
                _id: p._id,
                tenGoiTap: p.goiTapId?.tenGoiTap || p.maGoiTap?.tenGoiTap,
                goiTapId: p.goiTapId?._id || p.maGoiTap?._id,
                trangThaiDangKy: p.trangThaiDangKy,
                trangThaiSuDung: p.trangThaiSuDung
            }))
        });

        return res.json({
            success: true,
            canRegister,
            message: canRegister
                ? 'Bạn có thể đăng ký lịch tập cho tuần sau'
                : existingSchedule
                    ? 'Bạn đã đăng ký lịch tập cho tuần này rồi'
                    : !isRegistrationTime
                        ? 'Chỉ có thể đăng ký vào Thứ 7 hoặc Chủ nhật từ 12h trưa trở đi'
                        : !hasValidPackage
                            ? 'Bạn chưa có gói tập đang hoạt động'
                            : 'Không thể đăng ký lịch tập',
            nextWeekStart: nextWeekStart.toISOString(),
            nextWeekEnd: nextWeekEnd.toISOString(),
            isRegistrationTime,
            hasExistingSchedule: !!existingSchedule,
            hasCompletedPackage: hasValidPackage,
            activePackage: returnedPackage
        });

    } catch (error) {
        console.error('Error checking registration eligibility:', error);
        res.status(500).json({
            success: false,
            canRegister: false,
            message: 'Lỗi server khi kiểm tra điều kiện đăng ký',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};