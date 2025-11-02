const ChiNhanh = require('../models/ChiNhanh');
const { PT } = require('../models/NguoiDung');
const BuoiTap = require('../models/BuoiTap');
const GoiTap = require('../models/GoiTap');
const LichTap = require('../models/LichTap');
const SessionOption = require('../models/SessionOption');

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
            const query = {
                chiNhanh: chiNhanhId,
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
            const filteredSessions = mapped.filter(buoi => isSessionAllowedForPackage(buoi, goiTap));

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

        // Kiểm tra còn chỗ trống
        if (buoiTap.daDay) {
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

        // Thêm hội viên vào buổi tập
        await buoiTap.themHoiVien(userId);

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
    const ngayTap = new Date(buoiTap.ngayTap);
    const thuTrongTuan = ngayTap.getDay(); // 0 = Chủ nhật, 1 = Thứ 2, ...

    // Ràng buộc cho gói Morning Fitness
    if (tenGoiTap.includes('morning') || tenGoiTap.includes('sáng')) {
        return gioBatDau >= 5 && gioBatDau <= 11;
    }

    // Ràng buộc cho gói Weekend Gym
    if (tenGoiTap.includes('weekend') || tenGoiTap.includes('cuối tuần')) {
        return thuTrongTuan === 6 || thuTrongTuan === 0; // Thứ 7 hoặc Chủ nhật
    }

    // Ràng buộc cho gói Evening
    if (tenGoiTap.includes('evening') || tenGoiTap.includes('tối')) {
        return gioBatDau >= 17 && gioBatDau <= 22;
    }

    // Gói khác không có ràng buộc
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