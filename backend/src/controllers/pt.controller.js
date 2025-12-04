const BuoiTap = require('../models/BuoiTap');
const PTNote = require('../models/PTNote');
const PTAssignment = require('../models/PTAssignment');
const ChiSoCoThe = require('../models/ChiSoCoThe');
const LichSuTap = require('../models/LichSuTap');
const LichTap = require('../models/LichTap');
const Session = require('../models/Session');
const { HoiVien, PT } = require('../models/NguoiDung');
const BaiTap = require('../models/BaiTap');
const mongoose = require('mongoose');

// Lấy danh sách PT công khai (cho hội viên)
exports.getPublicPTList = async (req, res) => {
    try {
        const { limit = 10, sort = 'rating' } = req.query;

        // Lấy danh sách PT
        const pts = await PT.find({ trangThai: 'active' })
            .select('hoTen anhDaiDien chuyenMon soDienThoai email moTa danhGiaTrungBinh')
            .limit(parseInt(limit))
            .sort(sort === 'rating' ? { danhGiaTrungBinh: -1 } : { createdAt: -1 });

        res.json({
            success: true,
            data: pts
        });
    } catch (err) {
        console.error('Error in getPublicPTList:', err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

// Lấy thống kê tổng quan cho PT
exports.getPTDashboard = async (req, res) => {
    try {
        const ptId = req.user.id;

        // Debug: Log để kiểm tra
        console.log('[getPTDashboard] PT ID:', ptId);
        console.log('[getPTDashboard] PT ID type:', typeof ptId);

        // Đảm bảo ptId là ObjectId
        const ptObjectId = mongoose.Types.ObjectId.isValid(ptId) ? new mongoose.Types.ObjectId(ptId) : ptId;
        console.log('[getPTDashboard] PT ObjectId:', ptObjectId);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Lấy số buổi tập tuần này
        const startOfWeek = new Date(today);
        const dayOfWeek = today.getDay();
        startOfWeek.setDate(today.getDate() - dayOfWeek);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);

        // 1. Lấy từ BuoiTap (ptPhuTrach trực tiếp) - thử cả string và ObjectId
        const buoiTaps = await BuoiTap.find({
            $or: [
                { ptPhuTrach: ptId },
                { ptPhuTrach: ptObjectId },
                { ptPhuTrach: ptId.toString() }
            ]
        })
            .select('danhSachHoiVien ptPhuTrach');
        console.log('[getPTDashboard] BuoiTap count:', buoiTaps.length);
        if (buoiTaps.length > 0) {
            console.log('[getPTDashboard] Sample BuoiTap:', JSON.stringify(buoiTaps[0], null, 2));
        }

        // 2. Lấy từ LichTap (pt field hoặc ptPhuTrach trong danhSachBuoiTap) - thử cả string và ObjectId
        const lichTaps = await LichTap.find({
            $or: [
                { pt: ptId },
                { pt: ptObjectId },
                { pt: ptId.toString() },
                { 'danhSachBuoiTap.ptPhuTrach': ptId },
                { 'danhSachBuoiTap.ptPhuTrach': ptObjectId },
                { 'danhSachBuoiTap.ptPhuTrach': ptId.toString() }
            ]
        })
            .populate('hoiVien', 'hoTen')
            .select('hoiVien danhSachBuoiTap pt');
        console.log('[getPTDashboard] LichTap count:', lichTaps.length);
        if (lichTaps.length > 0) {
            console.log('[getPTDashboard] Sample LichTap:', JSON.stringify({
                _id: lichTaps[0]._id,
                pt: lichTaps[0].pt,
                danhSachBuoiTapCount: lichTaps[0].danhSachBuoiTap?.length || 0
            }, null, 2));
        }

        // 3. Lấy từ Session (ptPhuTrach) - thử cả string và ObjectId
        const sessions = await Session.find({
            $or: [
                { ptPhuTrach: ptId },
                { ptPhuTrach: ptObjectId },
                { ptPhuTrach: ptId.toString() }
            ]
        })
            .select('soLuongDaDangKy ptPhuTrach');
        console.log('[getPTDashboard] Session count:', sessions.length);
        if (sessions.length > 0) {
            console.log('[getPTDashboard] Sample Session:', JSON.stringify(sessions[0], null, 2));
        }

        // Tính số học viên duy nhất từ tất cả các nguồn
        const uniqueHoiVienIds = new Set();

        // Từ BuoiTap
        buoiTaps.forEach(buoiTap => {
            buoiTap.danhSachHoiVien.forEach(member => {
                uniqueHoiVienIds.add(member.hoiVien.toString());
            });
        });

        // Từ LichTap
        lichTaps.forEach(lichTap => {
            if (lichTap.hoiVien) {
                uniqueHoiVienIds.add(lichTap.hoiVien._id.toString());
            }
        });

        const soHoiVien = uniqueHoiVienIds.size;

        // Lấy số buổi tập hôm nay từ tất cả các nguồn
        // Lấy tất cả BuoiTap của PT trước
        const allBuoiTapsForToday = await BuoiTap.find({
            $or: [
                { ptPhuTrach: ptId },
                { ptPhuTrach: ptObjectId },
                { ptPhuTrach: ptId.toString() }
            ]
        }).select('ngayTap');

        let buoiTapHomNayBuoiTap = 0;
        allBuoiTapsForToday.forEach(bt => {
            if (bt.ngayTap) {
                const btDate = new Date(bt.ngayTap);
                btDate.setHours(0, 0, 0, 0);
                if (btDate >= today && btDate < tomorrow) {
                    buoiTapHomNayBuoiTap++;
                }
            }
        });

        console.log('[getPTDashboard] BuoiTap hôm nay count:', buoiTapHomNayBuoiTap);

        // Đếm từ LichTap - các buổi tập trong danhSachBuoiTap có ptPhuTrach = ptId và ngayTap hôm nay
        const lichTapsHomNay = await LichTap.find({
            $or: [
                { pt: ptId },
                { pt: ptObjectId },
                { pt: ptId.toString() },
                { 'danhSachBuoiTap.ptPhuTrach': ptId },
                { 'danhSachBuoiTap.ptPhuTrach': ptObjectId },
                { 'danhSachBuoiTap.ptPhuTrach': ptId.toString() }
            ]
        }).select('danhSachBuoiTap pt');

        let lichTapHomNay = 0;
        lichTapsHomNay.forEach(lichTap => {
            const isPTAssigned = lichTap.pt && lichTap.pt.toString() === ptId.toString();
            lichTap.danhSachBuoiTap.forEach(buoiTap => {
                const buoiTapDate = new Date(buoiTap.ngayTap);
                const isToday = buoiTapDate >= today && buoiTapDate < tomorrow;
                const isPTInBuoiTap = buoiTap.ptPhuTrach && buoiTap.ptPhuTrach.toString() === ptId.toString();

                if (isToday && (isPTAssigned || isPTInBuoiTap)) {
                    lichTapHomNay++;
                }
            });
        });

        // Đếm từ Session
        const sessionHomNay = await Session.countDocuments({
            $or: [
                { ptPhuTrach: ptId, ngay: { $gte: today, $lt: tomorrow } },
                { ptPhuTrach: ptObjectId, ngay: { $gte: today, $lt: tomorrow } },
                { ptPhuTrach: ptId.toString(), ngay: { $gte: today, $lt: tomorrow } }
            ]
        });

        const buoiTapHomNay = buoiTapHomNayBuoiTap + lichTapHomNay + sessionHomNay;

        // Lấy số buổi tập tuần này từ tất cả các nguồn
        const buoiTapTuanNayBuoiTap = await BuoiTap.countDocuments({
            $or: [
                { ptPhuTrach: ptId, ngayTap: { $gte: startOfWeek, $lt: endOfWeek } },
                { ptPhuTrach: ptObjectId, ngayTap: { $gte: startOfWeek, $lt: endOfWeek } },
                { ptPhuTrach: ptId.toString(), ngayTap: { $gte: startOfWeek, $lt: endOfWeek } }
            ]
        });

        const lichTapsTuanNay = await LichTap.find({
            $or: [
                { pt: ptId },
                { pt: ptObjectId },
                { pt: ptId.toString() },
                { 'danhSachBuoiTap.ptPhuTrach': ptId },
                { 'danhSachBuoiTap.ptPhuTrach': ptObjectId },
                { 'danhSachBuoiTap.ptPhuTrach': ptId.toString() }
            ]
        }).select('danhSachBuoiTap pt');

        let lichTapTuanNay = 0;
        lichTapsTuanNay.forEach(lichTap => {
            const isPTAssigned = lichTap.pt && lichTap.pt.toString() === ptId.toString();
            lichTap.danhSachBuoiTap.forEach(buoiTap => {
                const buoiTapDate = new Date(buoiTap.ngayTap);
                const isThisWeek = buoiTapDate >= startOfWeek && buoiTapDate < endOfWeek;
                const isPTInBuoiTap = buoiTap.ptPhuTrach && buoiTap.ptPhuTrach.toString() === ptId.toString();

                if (isThisWeek && (isPTAssigned || isPTInBuoiTap)) {
                    lichTapTuanNay++;
                }
            });
        });

        const sessionTuanNay = await Session.countDocuments({
            $or: [
                { ptPhuTrach: ptId, ngay: { $gte: startOfWeek, $lt: endOfWeek } },
                { ptPhuTrach: ptObjectId, ngay: { $gte: startOfWeek, $lt: endOfWeek } },
                { ptPhuTrach: ptId.toString(), ngay: { $gte: startOfWeek, $lt: endOfWeek } }
            ]
        });

        const buoiTapTuanNay = buoiTapTuanNayBuoiTap + lichTapTuanNay + sessionTuanNay;

        // Lấy lịch sắp tới từ tất cả các nguồn và merge lại
        // Lấy tất cả BuoiTap trước để debug
        const allBuoiTaps = await BuoiTap.find({
            $or: [
                { ptPhuTrach: ptId },
                { ptPhuTrach: ptObjectId },
                { ptPhuTrach: ptId.toString() }
            ]
        })
            .populate('chiNhanh', 'tenChiNhanh')
            .sort({ ngayTap: 1, gioBatDau: 1 })
            .select('tenBuoiTap ngayTap gioBatDau gioKetThuc chiNhanh soLuongHienTai soLuongToiDa ptPhuTrach');

        console.log('[getPTDashboard] All BuoiTap found:', allBuoiTaps.length);
        if (allBuoiTaps.length > 0) {
            allBuoiTaps.forEach((bt, idx) => {
                const buoiTapDate = new Date(bt.ngayTap);
                buoiTapDate.setHours(0, 0, 0, 0);
                console.log(`[getPTDashboard] BuoiTap ${idx + 1}:`, {
                    _id: bt._id,
                    tenBuoiTap: bt.tenBuoiTap,
                    ngayTap: bt.ngayTap,
                    ngayFormatted: buoiTapDate.toISOString().split('T')[0],
                    gioBatDau: bt.gioBatDau,
                    gioKetThuc: bt.gioKetThuc,
                    chiNhanh: bt.chiNhanh?.tenChiNhanh || 'N/A',
                    isTodayOrFuture: buoiTapDate >= today,
                    todayFormatted: today.toISOString().split('T')[0]
                });
            });
        }

        // Lọc các BuoiTap có ngày >= today
        const lichSapToiBuoiTap = allBuoiTaps.filter(bt => {
            if (!bt.ngayTap) return false;
            const buoiTapDate = new Date(bt.ngayTap);
            buoiTapDate.setHours(0, 0, 0, 0);
            return buoiTapDate >= today;
        });

        console.log('[getPTDashboard] Filtered BuoiTap (>= today):', lichSapToiBuoiTap.length);

        // Lấy từ LichTap - lấy tất cả để debug
        const allLichTaps = await LichTap.find({
            $or: [
                { pt: ptId },
                { pt: ptObjectId },
                { pt: ptId.toString() },
                { 'danhSachBuoiTap.ptPhuTrach': ptId },
                { 'danhSachBuoiTap.ptPhuTrach': ptObjectId },
                { 'danhSachBuoiTap.ptPhuTrach': ptId.toString() }
            ]
        })
            .populate('chiNhanh', 'tenChiNhanh')
            .populate('hoiVien', 'hoTen')
            .select('danhSachBuoiTap chiNhanh pt hoiVien');

        console.log('[getPTDashboard] All LichTap found:', allLichTaps.length);
        if (allLichTaps.length > 0) {
            allLichTaps.forEach((lt, idx) => {
                console.log(`[getPTDashboard] LichTap ${idx + 1}:`, {
                    _id: lt._id,
                    pt: lt.pt,
                    hoiVien: lt.hoiVien?.hoTen || 'N/A',
                    chiNhanh: lt.chiNhanh?.tenChiNhanh || 'N/A',
                    danhSachBuoiTapCount: lt.danhSachBuoiTap?.length || 0,
                    danhSachBuoiTap: lt.danhSachBuoiTap?.map(bt => ({
                        ngayTap: bt.ngayTap,
                        gioBatDau: bt.gioBatDau,
                        gioKetThuc: bt.gioKetThuc,
                        ptPhuTrach: bt.ptPhuTrach
                    })) || []
                });
            });
        }

        const lichSapToiLichTap = allLichTaps;

        // Lấy từ Session - lấy tất cả sessions trước để debug
        const allSessionsRaw = await Session.find({
            $or: [
                { ptPhuTrach: ptId },
                { ptPhuTrach: ptObjectId },
                { ptPhuTrach: ptId.toString() }
            ]
        })
            .populate('chiNhanh', 'tenChiNhanh')
            .sort({ ngay: 1, gioBatDau: 1 })
            .select('ngay gioBatDau gioKetThuc chiNhanh soLuongDaDangKy soLuongToiDa doKho');

        console.log('[getPTDashboard] All Sessions found:', allSessionsRaw.length);
        console.log('[getPTDashboard] Today date:', today);
        if (allSessionsRaw.length > 0) {
            allSessionsRaw.forEach((s, idx) => {
                const sessionDate = new Date(s.ngay);
                sessionDate.setHours(0, 0, 0, 0);
                const isTodayOrFuture = sessionDate >= today;
                console.log(`[getPTDashboard] Session ${idx + 1}:`, {
                    _id: s._id,
                    ngay: s.ngay,
                    ngayFormatted: sessionDate.toISOString().split('T')[0],
                    gioBatDau: s.gioBatDau,
                    gioKetThuc: s.gioKetThuc,
                    chiNhanh: s.chiNhanh?.tenChiNhanh || 'N/A',
                    isTodayOrFuture: isTodayOrFuture,
                    todayFormatted: today.toISOString().split('T')[0]
                });
            });
        }

        // Lọc các sessions có ngày >= today (bao gồm cả hôm nay)
        const lichSapToiSession = allSessionsRaw.filter(s => {
            if (!s.ngay) return false;
            const sessionDate = new Date(s.ngay);
            sessionDate.setHours(0, 0, 0, 0);
            return sessionDate >= today;
        });

        console.log('[getPTDashboard] Filtered Sessions (>= today):', lichSapToiSession.length);

        // Merge và format dữ liệu từ tất cả các nguồn
        const allSessions = [];

        // Từ BuoiTap
        lichSapToiBuoiTap.forEach(buoiTap => {
            if (buoiTap.ngayTap && buoiTap.gioBatDau && buoiTap.gioKetThuc) {
                allSessions.push({
                    _id: buoiTap._id,
                    tenBuoiTap: buoiTap.tenBuoiTap || 'Buổi tập',
                    ngayTap: buoiTap.ngayTap,
                    gioBatDau: buoiTap.gioBatDau,
                    gioKetThuc: buoiTap.gioKetThuc,
                    chiNhanh: buoiTap.chiNhanh || { tenChiNhanh: 'Chưa có' },
                    soLuongHienTai: buoiTap.soLuongHienTai || 0,
                    soLuongToiDa: buoiTap.soLuongToiDa || 0
                });
                console.log('[getPTDashboard] Added BuoiTap to allSessions:', {
                    tenBuoiTap: buoiTap.tenBuoiTap,
                    ngayTap: buoiTap.ngayTap,
                    chiNhanh: buoiTap.chiNhanh?.tenChiNhanh || 'N/A'
                });
            }
        });

        // Từ LichTap - extract các buổi tập từ danhSachBuoiTap
        lichSapToiLichTap.forEach(lichTap => {
            if (lichTap.danhSachBuoiTap && lichTap.danhSachBuoiTap.length > 0) {
                const isPTAssigned = lichTap.pt && lichTap.pt.toString() === ptId.toString();

                lichTap.danhSachBuoiTap.forEach(buoiTap => {
                    const buoiTapDate = new Date(buoiTap.ngayTap);
                    const isFuture = buoiTapDate >= today;
                    const isPTInBuoiTap = buoiTap.ptPhuTrach && buoiTap.ptPhuTrach.toString() === ptId.toString();

                    // Chỉ lấy các buổi tập có ptPhuTrach = ptId hoặc pt = ptId và ngày >= today
                    if (isFuture && (isPTAssigned || isPTInBuoiTap)) {
                        allSessions.push({
                            _id: buoiTap.buoiTap || buoiTap._id || lichTap._id,
                            tenBuoiTap: `Buổi tập - ${lichTap.hoiVien?.hoTen || 'Học viên'}`,
                            ngayTap: buoiTap.ngayTap,
                            gioBatDau: buoiTap.gioBatDau,
                            gioKetThuc: buoiTap.gioKetThuc,
                            chiNhanh: lichTap.chiNhanh,
                            soLuongHienTai: 1,
                            soLuongToiDa: 1
                        });
                    }
                });
            }
        });

        // Từ Session
        lichSapToiSession.forEach(session => {
            if (session.ngay && session.gioBatDau && session.gioKetThuc) {
                // Tạo tên buổi tập từ độ khó hoặc để mặc định
                let tenBuoiTap = 'Buổi tập';
                if (session.doKho) {
                    const doKhoMap = {
                        'DE': 'Buổi tập cơ bản',
                        'TRUNG_BINH': 'Buổi tập trung bình',
                        'KHO': 'Buổi tập nâng cao'
                    };
                    tenBuoiTap = doKhoMap[session.doKho] || 'Buổi tập';
                }

                // Kiểm tra chiNhanh
                let chiNhanhData = { tenChiNhanh: 'Chưa có' };
                if (session.chiNhanh) {
                    if (typeof session.chiNhanh === 'object' && session.chiNhanh.tenChiNhanh) {
                        chiNhanhData = session.chiNhanh;
                    } else if (typeof session.chiNhanh === 'string') {
                        chiNhanhData = { tenChiNhanh: session.chiNhanh };
                    }
                }

                allSessions.push({
                    _id: session._id,
                    tenBuoiTap: tenBuoiTap,
                    ngayTap: session.ngay,
                    gioBatDau: session.gioBatDau,
                    gioKetThuc: session.gioKetThuc,
                    chiNhanh: chiNhanhData,
                    soLuongHienTai: session.soLuongDaDangKy || 0,
                    soLuongToiDa: session.soLuongToiDa || 20
                });
                console.log('[getPTDashboard] Added session to allSessions:', {
                    tenBuoiTap: tenBuoiTap,
                    ngayTap: session.ngay,
                    gioBatDau: session.gioBatDau,
                    chiNhanh: chiNhanhData.tenChiNhanh
                });
            } else {
                console.log('[getPTDashboard] Skipping session due to missing data:', {
                    _id: session._id,
                    hasNgay: !!session.ngay,
                    hasGioBatDau: !!session.gioBatDau,
                    hasGioKetThuc: !!session.gioKetThuc
                });
            }
        });

        console.log('[getPTDashboard] All sessions after merge:', allSessions.length);
        if (allSessions.length > 0) {
            console.log('[getPTDashboard] Sample merged session:', JSON.stringify(allSessions[0], null, 2));
        }

        // Sắp xếp theo ngày và giờ, lấy 5 buổi gần nhất
        const lichSapToi = allSessions
            .sort((a, b) => {
                const dateA = new Date(a.ngayTap);
                const dateB = new Date(b.ngayTap);
                if (dateA.getTime() !== dateB.getTime()) {
                    return dateA - dateB;
                }
                // Nếu cùng ngày, sắp xếp theo giờ
                return a.gioBatDau.localeCompare(b.gioBatDau);
            })
            .slice(0, 5);

        console.log('[getPTDashboard] Total sessions found:', allSessions.length);
        console.log('[getPTDashboard] Final lichSapToi count:', lichSapToi.length);
        console.log('[getPTDashboard] buoiTapHomNay:', buoiTapHomNay);
        console.log('[getPTDashboard] buoiTapTuanNay:', buoiTapTuanNay);
        console.log('[getPTDashboard] soHoiVien:', soHoiVien);

        res.json({
            success: true,
            data: {
                soHoiVien,
                buoiTapHomNay,
                buoiTapTuanNay,
                lichSapToi
            }
        });
    } catch (err) {
        console.error('Error in getPTDashboard:', err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

// Lấy danh sách buổi tập PT phụ trách
exports.getMySessions = async (req, res) => {
    try {
        const ptId = req.user.id;
        const { trangThai, ngayBatDau, ngayKetThuc, page = 1, limit = 20 } = req.query;

        const query = { ptPhuTrach: ptId };

        if (trangThai) {
            query.trangThai = trangThai;
        }

        if (ngayBatDau || ngayKetThuc) {
            query.ngayTap = {};
            if (ngayBatDau) {
                query.ngayTap.$gte = new Date(ngayBatDau);
            }
            if (ngayKetThuc) {
                const endDate = new Date(ngayKetThuc);
                endDate.setHours(23, 59, 59, 999);
                query.ngayTap.$lte = endDate;
            }
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const buoiTaps = await BuoiTap.find(query)
            .populate('chiNhanh', 'tenChiNhanh')
            .populate('ptPhuTrach', 'hoTen')
            .populate('danhSachHoiVien.hoiVien', 'hoTen anhDaiDien')
            .populate('baiTap', 'tenBaiTap hinhAnh hinhAnhMinhHoa videoHuongDan')
            .sort({ ngayTap: -1, gioBatDau: 1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await BuoiTap.countDocuments(query);

        res.json({
            success: true,
            data: {
                buoiTaps,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            }
        });
    } catch (err) {
        console.error('Error in getMySessions:', err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

// Lấy danh sách học viên của PT
exports.getMyStudents = async (req, res) => {
    try {
        const ptId = req.user.id;
        const { search, page = 1, limit = 20 } = req.query;

        // Lấy tất cả học viên từ các buổi tập PT phụ trách
        const buoiTaps = await BuoiTap.find({ ptPhuTrach: ptId })
            .select('danhSachHoiVien');

        const hoiVienIds = new Set();
        buoiTaps.forEach(buoiTap => {
            buoiTap.danhSachHoiVien.forEach(member => {
                hoiVienIds.add(member.hoiVien.toString());
            });
        });

        const query = { _id: { $in: Array.from(hoiVienIds) } };

        if (search) {
            query.$or = [
                { hoTen: { $regex: search, $options: 'i' } },
                { sdt: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const hoiViens = await HoiVien.find(query)
            .select('hoTen sdt email anhDaiDien ngayThamGia')
            .sort({ hoTen: 1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await HoiVien.countDocuments(query);

        res.json({
            success: true,
            data: {
                hoiViens,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            }
        });
    } catch (err) {
        console.error('Error in getMyStudents:', err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

// Lấy chi tiết học viên
exports.getStudentDetail = async (req, res) => {
    try {
        const ptId = req.user.id;
        const { hoiVienId } = req.params;

        // Kiểm tra học viên có trong danh sách của PT không
        const buoiTap = await BuoiTap.findOne({
            ptPhuTrach: ptId,
            'danhSachHoiVien.hoiVien': hoiVienId
        });

        if (!buoiTap) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền xem thông tin học viên này'
            });
        }

        // Lấy thông tin học viên
        const hoiVien = await HoiVien.findById(hoiVienId)
            .select('hoTen sdt email anhDaiDien ngaySinh gioiTinh diaChi ngayThamGia hangHoiVien')
            .populate('hangHoiVien', 'tenHang');

        if (!hoiVien) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy học viên' });
        }

        // Lấy chỉ số cơ thể (mới nhất)
        const chiSoCoThe = await ChiSoCoThe.find({ hoiVien: hoiVienId })
            .sort({ ngayDo: -1 })
            .limit(10);

        // Lấy lịch sử tập
        const lichSuTap = await LichSuTap.find({ hoiVien: hoiVienId })
            .populate('buoiTap', 'tenBuoiTap ngayTap gioBatDau gioKetThuc')
            .sort({ ngayTap: -1 })
            .limit(20);

        res.json({
            success: true,
            data: {
                hoiVien,
                chiSoCoThe,
                lichSuTap
            }
        });
    } catch (err) {
        console.error('Error in getStudentDetail:', err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

// Thêm ghi chú cho học viên
exports.addStudentNote = async (req, res) => {
    try {
        const ptId = req.user.id;
        const { hoiVienId, noiDung } = req.body;

        if (!noiDung || !noiDung.trim()) {
            return res.status(400).json({ success: false, message: 'Nội dung ghi chú không được để trống' });
        }

        // Kiểm tra học viên có trong danh sách của PT không
        const buoiTap = await BuoiTap.findOne({
            ptPhuTrach: ptId,
            'danhSachHoiVien.hoiVien': hoiVienId
        });

        if (!buoiTap) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền thêm ghi chú cho học viên này'
            });
        }

        const note = await PTNote.create({
            pt: ptId,
            hoiVien: hoiVienId,
            noiDung: noiDung.trim()
        });

        res.status(201).json({
            success: true,
            message: 'Thêm ghi chú thành công',
            data: note
        });
    } catch (err) {
        console.error('Error in addStudentNote:', err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

// Lấy ghi chú của học viên
exports.getStudentNotes = async (req, res) => {
    try {
        const ptId = req.user.id;
        const { hoiVienId } = req.params;
        const { page = 1, limit = 20 } = req.query;

        // Kiểm tra học viên có trong danh sách của PT không
        const buoiTap = await BuoiTap.findOne({
            ptPhuTrach: ptId,
            'danhSachHoiVien.hoiVien': hoiVienId
        });

        if (!buoiTap) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền xem ghi chú của học viên này'
            });
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const notes = await PTNote.find({
            pt: ptId,
            hoiVien: hoiVienId
        })
            .sort({ ngayTao: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await PTNote.countDocuments({
            pt: ptId,
            hoiVien: hoiVienId
        });

        res.json({
            success: true,
            data: {
                notes,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            }
        });
    } catch (err) {
        console.error('Error in getStudentNotes:', err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

// Gán bài tập cho học viên
exports.assignExerciseToStudent = async (req, res) => {
    try {
        const ptId = req.user.id;
        const { hoiVienId, baiTapId, hanHoanThanh, ghiChu } = req.body;

        if (!baiTapId) {
            return res.status(400).json({ success: false, message: 'Vui lòng chọn bài tập' });
        }

        // Kiểm tra học viên có trong danh sách của PT không
        const buoiTap = await BuoiTap.findOne({
            ptPhuTrach: ptId,
            'danhSachHoiVien.hoiVien': hoiVienId
        });

        if (!buoiTap) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền gán bài tập cho học viên này'
            });
        }

        // Kiểm tra bài tập có tồn tại không
        const baiTap = await BaiTap.findById(baiTapId);
        if (!baiTap) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy bài tập' });
        }

        const assignment = await PTAssignment.create({
            pt: ptId,
            hoiVien: hoiVienId,
            baiTap: baiTapId,
            hanHoanThanh: hanHoanThanh ? new Date(hanHoanThanh) : null,
            ghiChu: ghiChu || ''
        });

        res.status(201).json({
            success: true,
            message: 'Gán bài tập thành công',
            data: assignment
        });
    } catch (err) {
        console.error('Error in assignExerciseToStudent:', err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

// Lấy danh sách bài tập đã gán
exports.getStudentExercises = async (req, res) => {
    try {
        const ptId = req.user.id;
        const { hoiVienId } = req.params;
        const { trangThai, page = 1, limit = 20 } = req.query;

        // Kiểm tra học viên có trong danh sách của PT không
        const buoiTap = await BuoiTap.findOne({
            ptPhuTrach: ptId,
            'danhSachHoiVien.hoiVien': hoiVienId
        });

        if (!buoiTap) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền xem bài tập của học viên này'
            });
        }

        const query = {
            pt: ptId,
            hoiVien: hoiVienId
        };

        if (trangThai) {
            query.trangThai = trangThai;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const assignments = await PTAssignment.find(query)
            .populate('baiTap', 'tenBaiTap moTa videoUrl hinhAnh')
            .sort({ ngayGan: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await PTAssignment.countDocuments(query);

        res.json({
            success: true,
            data: {
                assignments,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            }
        });
    } catch (err) {
        console.error('Error in getStudentExercises:', err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

// Cập nhật tiến độ học viên trong buổi tập
exports.updateSessionProgress = async (req, res) => {
    try {
        const ptId = req.user.id;
        const { buoiTapId, hoiVienId, trangThai } = req.body;

        if (!trangThai || !['DA_DANG_KY', 'DA_THAM_GIA', 'VANG_MAT', 'HUY'].includes(trangThai)) {
            return res.status(400).json({
                success: false,
                message: 'Trạng thái không hợp lệ'
            });
        }

        const buoiTap = await BuoiTap.findOne({
            _id: buoiTapId,
            ptPhuTrach: ptId
        });

        if (!buoiTap) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy buổi tập hoặc bạn không có quyền'
            });
        }

        await buoiTap.updateAttendanceStatus(hoiVienId, trangThai);

        res.json({
            success: true,
            message: 'Cập nhật tiến độ thành công',
            data: buoiTap
        });
    } catch (err) {
        console.error('Error in updateSessionProgress:', err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

// Thêm nhận xét cho buổi tập
exports.addSessionComment = async (req, res) => {
    try {
        const ptId = req.user.id;
        const { buoiTapId, ghiChu } = req.body;

        const buoiTap = await BuoiTap.findOne({
            _id: buoiTapId,
            ptPhuTrach: ptId
        });

        if (!buoiTap) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy buổi tập hoặc bạn không có quyền'
            });
        }

        buoiTap.ghiChu = ghiChu || '';
        await buoiTap.save();

        res.json({
            success: true,
            message: 'Thêm nhận xét thành công',
            data: buoiTap
        });
    } catch (err) {
        console.error('Error in addSessionComment:', err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

