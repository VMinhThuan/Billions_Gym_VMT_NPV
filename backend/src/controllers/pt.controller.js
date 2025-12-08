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
    const startTime = Date.now();
    const TIMEOUT_MS = 10000; // 10 giây timeout

    try {
        const ptId = req.user.id;
        const ptObjectId = mongoose.Types.ObjectId.isValid(ptId) ? new mongoose.Types.ObjectId(ptId) : ptId;

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

        // TỐI ƯU: Dùng Promise.race với timeout và giới hạn query
        const createTimeoutPromise = (ms) => new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Query timeout')), ms)
        );

        // TỐI ƯU: Chỉ query dữ liệu cần thiết với timeout và giới hạn
        const [buoiTaps, lichTaps, sessions] = await Promise.race([
            Promise.all([
                // 1. BuoiTap - chỉ lấy danhSachHoiVien để đếm học viên
                Promise.race([
                    BuoiTap.find({ ptPhuTrach: ptObjectId })
                        .select('danhSachHoiVien')
                        .limit(1000) // Giới hạn để tăng tốc
                        .lean()
                        .maxTimeMS(3000),
                    createTimeoutPromise(3000)
                ]).catch(() => []),

                // 2. LichTap - chỉ lấy hoiVien để đếm
                Promise.race([
                    LichTap.find({ pt: ptObjectId })
                        .select('hoiVien')
                        .limit(500)
                        .lean()
                        .maxTimeMS(3000),
                    createTimeoutPromise(3000)
                ]).catch(() => []),

                // 3. Session - không cần cho đếm học viên, bỏ qua
                Promise.resolve([])
            ]),
            createTimeoutPromise(5000)
        ]).catch(() => [[], [], []]);

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

        // TỐI ƯU: Đếm buổi tập hôm nay bằng countDocuments với timeout
        const [buoiTapHomNayCount, sessionHomNayCount] = await Promise.race([
            Promise.all([
                Promise.race([
                    BuoiTap.countDocuments({ ptPhuTrach: ptObjectId, ngayTap: { $gte: today, $lt: tomorrow } }).maxTimeMS(3000),
                    createTimeoutPromise(3000)
                ]).catch(() => 0),
                Promise.race([
                    Session.countDocuments({ ptPhuTrach: ptObjectId, ngay: { $gte: today, $lt: tomorrow } }).maxTimeMS(3000),
                    createTimeoutPromise(3000)
                ]).catch(() => 0)
            ]),
            createTimeoutPromise(5000)
        ]).catch(() => [0, 0]);

        const buoiTapHomNay = buoiTapHomNayCount + sessionHomNayCount;

        // TỐI ƯU: Đếm buổi tập tuần này bằng countDocuments
        const [buoiTapTuanNayCount, sessionTuanNayCount] = await Promise.race([
            Promise.all([
                Promise.race([
                    BuoiTap.countDocuments({ ptPhuTrach: ptObjectId, ngayTap: { $gte: startOfWeek, $lt: endOfWeek } }).maxTimeMS(3000),
                    createTimeoutPromise(3000)
                ]).catch(() => 0),
                Promise.race([
                    Session.countDocuments({ ptPhuTrach: ptObjectId, ngay: { $gte: startOfWeek, $lt: endOfWeek } }).maxTimeMS(3000),
                    createTimeoutPromise(3000)
                ]).catch(() => 0)
            ]),
            createTimeoutPromise(5000)
        ]).catch(() => [0, 0]);

        const buoiTapTuanNay = buoiTapTuanNayCount + sessionTuanNayCount;

        // TỐI ƯU: Chỉ lấy 5 buổi tập sắp tới với timeout
        const lichSapToi = await Promise.race([
            Promise.race([
                BuoiTap.find({ ptPhuTrach: ptObjectId, ngayTap: { $gte: today } })
                    .populate('chiNhanh', 'tenChiNhanh')
                    .sort({ ngayTap: 1, gioBatDau: 1 })
                    .limit(5)
                    .select('tenBuoiTap ngayTap gioBatDau gioKetThuc chiNhanh soLuongHienTai soLuongToiDa')
                    .lean()
                    .maxTimeMS(5000),
                createTimeoutPromise(5000)
            ]).then(buoiTaps => buoiTaps.map(bt => ({
                _id: bt._id,
                tenBuoiTap: bt.tenBuoiTap || 'Buổi tập',
                ngayTap: bt.ngayTap,
                gioBatDau: bt.gioBatDau,
                gioKetThuc: bt.gioKetThuc,
                chiNhanh: bt.chiNhanh || { tenChiNhanh: 'Chưa có' },
                soLuongHienTai: bt.soLuongHienTai || 0,
                soLuongToiDa: bt.soLuongToiDa || 0
            }))).catch(() => []),
            createTimeoutPromise(6000)
        ]).catch(() => []);

        const elapsedTime = Date.now() - startTime;
        console.log(`[getPTDashboard] Hoàn thành sau ${elapsedTime}ms`);

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
        const elapsedTime = Date.now() - startTime;
        console.error(`[getPTDashboard] ERROR sau ${elapsedTime}ms:`, err.message);
        console.error('[getPTDashboard] Error stack:', err.stack);

        // Trả về dữ liệu mặc định nếu timeout hoặc lỗi
        res.json({
            success: true,
            data: {
                soHoiVien: 0,
                buoiTapHomNay: 0,
                buoiTapTuanNay: 0,
                lichSapToi: []
            }
        });
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

        // Bảo vệ limit, tránh query quá lớn gây lỗi / quá tải
        const parsedLimit = parseInt(limit, 10);
        const safeLimit = Number.isNaN(parsedLimit) ? 20 : Math.min(Math.max(parsedLimit, 1), 500);
        const parsedPage = parseInt(page, 10);
        const safePage = Number.isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;

        const skip = (safePage - 1) * safeLimit;

        // TỐI ƯU: Thêm timeout và giảm populate
        const buoiTaps = await Promise.race([
            BuoiTap.find(query)
                .select('tenBuoiTap ngayTap gioBatDau gioKetThuc chiNhanh soLuongHienTai soLuongToiDa trangThai doKho danhSachHoiVien ptPhuTrach')
                .populate('chiNhanh', 'tenChiNhanh')
                .populate('ptPhuTrach', 'hoTen')
                .populate('danhSachHoiVien.hoiVien', 'hoTen') // đủ để hiển thị tên, giảm payload
                .sort({ ngayTap: -1, gioBatDau: 1 })
                .skip(skip)
                .limit(safeLimit)
                .lean()
                .maxTimeMS(5000), // Timeout 5s
            new Promise((_, reject) => setTimeout(() => reject(new Error('Query timeout')), 5000))
        ]);

        const total = await Promise.race([
            BuoiTap.countDocuments(query).maxTimeMS(3000),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Count timeout')), 3000))
        ]).catch(() => 0); // Nếu count timeout, trả về 0

        res.json({
            success: true,
            data: {
                buoiTaps,
                pagination: {
                    page: safePage,
                    limit: safeLimit,
                    total,
                    pages: Math.ceil(total / safeLimit)
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
        const ptObjectId = mongoose.Types.ObjectId.isValid(ptId) ? new mongoose.Types.ObjectId(ptId) : ptId;
        const { search, page = 1, limit = 50 } = req.query;

        // Lấy tất cả học viên từ các buổi tập PT phụ trách
        const buoiTaps = await BuoiTap.find({ ptPhuTrach: ptObjectId })
            .select('danhSachHoiVien')
            .lean();

        const hoiVienIds = new Set();
        buoiTaps.forEach(buoiTap => {
            if (Array.isArray(buoiTap.danhSachHoiVien)) {
                buoiTap.danhSachHoiVien.forEach(member => {
                    if (member.hoiVien) {
                        hoiVienIds.add(member.hoiVien.toString());
                    }
                });
            }
        });

        if (hoiVienIds.size === 0) {
            return res.json({
                success: true,
                data: {
                    hoiViens: [],
                    stats: {
                        totalStudents: 0,
                        activeStudents: 0,
                        upcomingSessions: 0
                    },
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: 0,
                        pages: 0
                    }
                }
            });
        }

        const query = { _id: { $in: Array.from(hoiVienIds) } };

        if (search) {
            query.$or = [
                { hoTen: { $regex: search, $options: 'i' } },
                { sdt: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Lấy thông tin học viên với populate
        const hoiViens = await HoiVien.find(query)
            .select('hoTen sdt email anhDaiDien ngayThamGia ngaySinh gioiTinh')
            .sort({ hoTen: 1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        const total = await HoiVien.countDocuments(query);

        // Lấy thêm thông tin cho mỗi học viên
        const enrichedStudents = await Promise.all(hoiViens.map(async (hoiVien) => {
            const hoiVienId = hoiVien._id;

            // 1. Lấy chỉ số cơ thể mới nhất
            const chiSoMoiNhat = await ChiSoCoThe.findOne({ hoiVien: hoiVienId })
                .sort({ ngayDo: -1 })
                .select('canNang chieuCao bmi ngayDo')
                .lean();

            // 2. Lấy gói tập đang hoạt động
            const ChiTietGoiTap = require('../models/ChiTietGoiTap');
            const goiTap = await ChiTietGoiTap.findOne({
                hoiVien: hoiVienId,
                trangThai: 'DANG_HOAT_DONG'
            })
                .populate('goiTap', 'tenGoi soBuoi')
                .select('soBuoiDaDung soBuoiConLai ngayBatDau ngayKetThuc goiTap')
                .lean();

            // 3. Lấy buổi tập sắp tới
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const buoiTapSapToi = await BuoiTap.findOne({
                ptPhuTrach: ptObjectId,
                ngayTap: { $gte: today },
                'danhSachHoiVien.hoiVien': hoiVienId
            })
                .select('tenBuoiTap ngayTap gioBatDau gioKetThuc chiNhanh')
                .populate('chiNhanh', 'tenChiNhanh')
                .sort({ ngayTap: 1, gioBatDau: 1 })
                .lean();

            // 4. Đếm số buổi tập đã hoàn thành
            const soBuoiDaTap = await BuoiTap.countDocuments({
                ptPhuTrach: ptObjectId,
                'danhSachHoiVien.hoiVien': hoiVienId,
                'danhSachHoiVien.trangThai': 'DA_THAM_GIA',
                trangThai: 'HOAN_THANH'
            });

            // 5. Tính tuổi
            let tuoi = null;
            if (hoiVien.ngaySinh) {
                const birthDate = new Date(hoiVien.ngaySinh);
                const today = new Date();
                tuoi = today.getFullYear() - birthDate.getFullYear();
                const monthDiff = today.getMonth() - birthDate.getMonth();
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                    tuoi--;
                }
            }

            // 6. Xác định trạng thái
            let trangThai = 'active';
            if (goiTap && goiTap.ngayKetThuc) {
                const ngayHetHan = new Date(goiTap.ngayKetThuc);
                if (ngayHetHan < today) {
                    trangThai = 'expired';
                }
            }

            return {
                _id: hoiVien._id,
                hoTen: hoiVien.hoTen,
                sdt: hoiVien.sdt,
                email: hoiVien.email,
                anhDaiDien: hoiVien.anhDaiDien,
                tuoi: tuoi,
                gioiTinh: hoiVien.gioiTinh || 'Nam',
                ngayThamGia: hoiVien.ngayThamGia,
                trangThai: trangThai,
                thongSo: chiSoMoiNhat ? {
                    canNang: chiSoMoiNhat.canNang,
                    chieuCao: chiSoMoiNhat.chieuCao,
                    bmi: chiSoMoiNhat.bmi ? chiSoMoiNhat.bmi.toFixed(1) : null,
                    ngayDo: chiSoMoiNhat.ngayDo
                } : null,
                goiTap: goiTap ? {
                    tenGoi: goiTap.goiTap?.tenGoi || 'PT Package',
                    sobuoiConLai: goiTap.soBuoiConLai || 0,
                    tongSoBuoi: goiTap.goiTap?.soBuoi || 0,
                    sobuoiDaDung: goiTap.soBuoiDaDung || 0,
                    ngayHetHan: goiTap.ngayKetThuc,
                    trangThai: 'DANG_HOAT_DONG'
                } : null,
                tienDo: {
                    sobuoiDaTap: soBuoiDaTap,
                    tyLeHoanThanh: goiTap && goiTap.goiTap?.soBuoi > 0
                        ? Math.round((goiTap.soBuoiDaDung / goiTap.goiTap.soBuoi) * 100)
                        : 0
                },
                lichHenSapToi: buoiTapSapToi ? {
                    ngay: buoiTapSapToi.ngayTap,
                    gio: buoiTapSapToi.gioBatDau,
                    loai: buoiTapSapToi.tenBuoiTap || 'Buổi tập',
                    diaDiem: buoiTapSapToi.chiNhanh?.tenChiNhanh || 'Chưa có'
                } : null
            };
        }));

        // Tính stats
        const activeStudents = enrichedStudents.filter(s => s.trangThai === 'active').length;
        const upcomingSessions = enrichedStudents.filter(s => s.lichHenSapToi !== null).length;

        res.json({
            success: true,
            data: {
                hoiViens: enrichedStudents,
                stats: {
                    totalStudents: total,
                    activeStudents: activeStudents,
                    upcomingSessions: upcomingSessions
                },
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

