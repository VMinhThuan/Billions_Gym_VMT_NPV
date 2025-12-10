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
        console.log('📋 getPublicPTList - Fetching PT list...');
        const startTime = Date.now();
        const { limit = 50, sort = 'rating', branchId } = req.query;

        // Build query với filter theo chi nhánh nếu có
        // Sử dụng query giống với /user/pt endpoint để đảm bảo tương thích
        const query = {
            trangThaiPT: 'DANG_HOAT_DONG'
        };

        // Thêm filter theo chi nhánh nếu có branchId
        // Đảm bảo branchId là ObjectId nếu cần
        if (branchId) {
            try {
                // Convert sang ObjectId nếu là string hợp lệ
                if (mongoose.Types.ObjectId.isValid(branchId)) {
                    query.chinhanh = new mongoose.Types.ObjectId(branchId);
                } else {
                    query.chinhanh = branchId;
                }
            } catch (e) {
                query.chinhanh = branchId;
            }
            console.log('📍 Filtering PTs by branchId:', branchId, 'Query:', JSON.stringify(query));
        }

        // Query tối ưu: sử dụng PT model trực tiếp (giống web app)
        // Không filter vaiTro vì PT model đã có discriminator
        let pts;

        // Giới hạn số lượng PT để tăng tốc độ (mặc định 20 thay vì 30 để nhanh hơn)
        const actualLimit = Math.min(parseInt(limit) || 20, 20);

        try {
            // Chỉ select các field cần thiết để tăng tốc độ
            // Bỏ các field không cần thiết như email, moTa chi tiết
            // Không sort để tăng tốc độ tối đa
            console.log('🔍 Executing PT query:', JSON.stringify(query));
            const queryStart = Date.now();

            // Sử dụng explain để debug nếu cần
            // const explain = await PT.find(query).explain('executionStats');
            // console.log('📊 Query explain:', JSON.stringify(explain, null, 2));

            pts = await PT.find(query)
                .select('hoTen anhDaiDien chuyenMon soDienThoai danhGia kinhNghiem bangCapChungChi gioiTinh chinhanh')
                .limit(actualLimit)
                .maxTimeMS(12000) // Timeout 12 giây (ít hơn frontend 6s)
                .lean() // Sử dụng lean() để tăng tốc độ
                .exec();

            const queryDuration = Date.now() - queryStart;
            console.log(`⏱️ PT query took ${queryDuration}ms, found ${pts.length} PTs`);

            // Nếu query quá chậm, log warning
            if (queryDuration > 5000) {
                console.warn(`⚠️ PT query took ${queryDuration}ms - consider optimizing`);
            }
        } catch (ptError) {
            // Fallback: thử query từ NguoiDung nếu PT model không hoạt động
            console.warn('⚠️ PT model query failed, trying NguoiDung fallback:', ptError.message);
            const { NguoiDung } = require('../models/NguoiDung');
            query.vaiTro = 'PT';
            pts = await NguoiDung.find(query)
                .select('hoTen anhDaiDien chuyenMon soDienThoai danhGia kinhNghiem bangCapChungChi gioiTinh chinhanh')
                .limit(actualLimit)
                .maxTimeMS(12000)
                .lean()
                .exec();
        }

        const duration = Date.now() - startTime;
        console.log(`✅ Successfully fetched ${pts.length} PTs in ${duration}ms${branchId ? ` (filtered by branch: ${branchId})` : ''}`);

        res.json({
            success: true,
            data: pts
        });
    } catch (err) {
        console.error('❌ getPublicPTList failed:', {
            message: err.message,
            code: err.code,
            name: err.name,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });

        // Trả về mảng rỗng thay vì error để tránh crash frontend
        console.warn('⚠️ Returning empty array to prevent crash');
        res.json({
            success: true,
            data: []
        });
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

// Lấy chi tiết học viên - MỞ RỘNG với đầy đủ thông tin
exports.getStudentDetail = async (req, res) => {
    try {
        const ptId = req.user.id;
        const ptObjectId = mongoose.Types.ObjectId.isValid(ptId) ? new mongoose.Types.ObjectId(ptId) : ptId;
        const { hoiVienId } = req.params;

        // Kiểm tra học viên có trong danh sách của PT không
        const buoiTap = await BuoiTap.findOne({
            ptPhuTrach: ptObjectId,
            'danhSachHoiVien.hoiVien': hoiVienId
        });

        if (!buoiTap) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền xem thông tin học viên này'
            });
        }

        // Lấy thông tin học viên đầy đủ
        const hoiVien = await HoiVien.findById(hoiVienId)
            .select('hoTen sdt email anhDaiDien ngaySinh gioiTinh diaChi ngayThamGia hangHoiVien')
            .populate('hangHoiVien', 'tenHang')
            .lean();

        if (!hoiVien) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy học viên' });
        }

        // Tính tuổi
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

        // 1. Lấy chỉ số cơ thể (tất cả để vẽ biểu đồ)
        const chiSoCoThe = await ChiSoCoThe.find({ hoiVien: hoiVienId })
            .sort({ ngayDo: -1 })
            .limit(30)
            .lean();

        // 2. Lấy gói tập đang hoạt động
        const ChiTietGoiTap = require('../models/ChiTietGoiTap');
        const goiTap = await ChiTietGoiTap.findOne({
            hoiVien: hoiVienId,
            trangThai: 'DANG_HOAT_DONG'
        })
            .populate('goiTap', 'tenGoi soBuoi giaTien')
            .lean();

        // 3. Lấy buổi tập sắp tới
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const buoiTapSapToi = await BuoiTap.find({
            ptPhuTrach: ptObjectId,
            ngayTap: { $gte: today },
            'danhSachHoiVien.hoiVien': hoiVienId
        })
            .select('tenBuoiTap ngayTap gioBatDau gioKetThuc chiNhanh soLuongHienTai soLuongToiDa')
            .populate('chiNhanh', 'tenChiNhanh')
            .sort({ ngayTap: 1, gioBatDau: 1 })
            .limit(10)
            .lean();

        // 4. Thống kê buổi tập
        const [tongBuoiTap, buoiTapHoanThanh, buoiTapHuy] = await Promise.all([
            BuoiTap.countDocuments({
                ptPhuTrach: ptObjectId,
                'danhSachHoiVien.hoiVien': hoiVienId
            }),
            BuoiTap.countDocuments({
                ptPhuTrach: ptObjectId,
                'danhSachHoiVien.hoiVien': hoiVienId,
                'danhSachHoiVien.trangThai': 'DA_THAM_GIA',
                trangThai: 'HOAN_THANH'
            }),
            BuoiTap.countDocuments({
                ptPhuTrach: ptObjectId,
                'danhSachHoiVien.hoiVien': hoiVienId,
                trangThai: 'HUY'
            })
        ]);

        // 5. Lấy lịch sử tập chi tiết
        const lichSuTap = await LichSuTap.find({ hoiVien: hoiVienId })
            .populate({
                path: 'buoiTap',
                select: 'tenBuoiTap ngayTap gioBatDau gioKetThuc trangThai ptPhuTrach',
                populate: { path: 'ptPhuTrach', select: 'hoTen' }
            })
            .sort({ ngayTap: -1 })
            .limit(50)
            .lean();

        // 5b. Lấy lịch sử buổi tập mà PT này phụ trách (dựa trên BuoiTap) để hiển thị check-in của hội viên với PT
        const lichSuBuoiTapPT = await BuoiTap.find({
            ptPhuTrach: ptObjectId,
            'danhSachHoiVien.hoiVien': hoiVienId,
            trangThai: { $ne: 'HUY' }
        })
            .select('tenBuoiTap ngayTap gioBatDau gioKetThuc chiNhanh trangThai danhSachHoiVien ptPhuTrach')
            .populate('chiNhanh', 'tenChiNhanh')
            .populate('ptPhuTrach', 'hoTen')
            .sort({ ngayTap: -1, gioBatDau: -1 })
            .limit(50)
            .lean();

        // Map calo từ TemplateBuoiTap theo tên buổi
        const templates = await require('../models/TemplateBuoiTap').find({})
            .select('ten caloTieuHao')
            .lean();
        const templateMap = new Map(templates.map(t => [t.ten.toLowerCase(), t.caloTieuHao]));

        // 6. Lấy ghi chú của PT
        const notes = await PTNote.find({
            pt: ptId,
            hoiVien: hoiVienId
        })
            .sort({ ngayTao: -1 })
            .limit(50)
            .lean();

        // 7. Lấy bài tập đã gán
        const exercises = await PTAssignment.find({
            pt: ptId,
            hoiVien: hoiVienId
        })
            .populate('baiTap', 'tenBaiTap moTa videoUrl hinhAnh')
            .sort({ ngayGan: -1 })
            .limit(50)
            .lean();

        // 8. Lấy buổi tập gần đây (đã hoàn thành)
        const buoiTapGanDay = await BuoiTap.find({
            ptPhuTrach: ptObjectId,
            'danhSachHoiVien.hoiVien': hoiVienId,
            trangThai: 'HOAN_THANH'
        })
            .select('tenBuoiTap ngayTap gioBatDau gioKetThuc')
            .sort({ ngayTap: -1 })
            .limit(10)
            .lean();

        res.json({
            success: true,
            data: {
                hoiVien: {
                    ...hoiVien,
                    tuoi: tuoi
                },
                chiSoCoThe,
                goiTap: goiTap ? {
                    tenGoi: goiTap.goiTap?.tenGoi || 'PT Package',
                    soBuoi: goiTap.goiTap?.soBuoi || 0,
                    soBuoiDaDung: goiTap.soBuoiDaDung || 0,
                    soBuoiConLai: goiTap.soBuoiConLai || 0,
                    ngayBatDau: goiTap.ngayBatDau,
                    ngayKetThuc: goiTap.ngayKetThuc,
                    giaTien: goiTap.goiTap?.giaTien || 0,
                    tyLeHoanThanh: goiTap.goiTap?.soBuoi > 0
                        ? Math.round((goiTap.soBuoiDaDung / goiTap.goiTap.soBuoi) * 100)
                        : 0
                } : null,
                buoiTapSapToi: buoiTapSapToi.map(bt => ({
                    _id: bt._id,
                    tenBuoiTap: bt.tenBuoiTap,
                    ngayTap: bt.ngayTap,
                    gioBatDau: bt.gioBatDau,
                    gioKetThuc: bt.gioKetThuc,
                    chiNhanh: bt.chiNhanh?.tenChiNhanh || 'Chưa có',
                    soLuongHienTai: bt.soLuongHienTai || 0,
                    soLuongToiDa: bt.soLuongToiDa || 0
                })),
                thongKe: {
                    tongBuoiTap,
                    buoiTapHoanThanh,
                    buoiTapHuy,
                    tyLeHoanThanh: tongBuoiTap > 0
                        ? Math.round((buoiTapHoanThanh / tongBuoiTap) * 100)
                        : 0
                },
                lichSuTap: lichSuTap.map(ls => ({
                    _id: ls._id,
                    ngayTap: ls.ngayTap,
                    buoiTap: ls.buoiTap ? {
                        _id: ls.buoiTap._id,
                        tenBuoiTap: ls.buoiTap.tenBuoiTap,
                        ngayTap: ls.buoiTap.ngayTap,
                        gioBatDau: ls.buoiTap.gioBatDau,
                        gioKetThuc: ls.buoiTap.gioKetThuc,
                        trangThai: ls.buoiTap.trangThai,
                        ptPhuTrach: ls.buoiTap.ptPhuTrach ? { hoTen: ls.buoiTap.ptPhuTrach.hoTen } : null
                    } : null,
                    caloTieuHao: ls.caloTieuHao || templateMap.get((ls.buoiTap?.tenBuoiTap || '').toLowerCase()) || null
                })),
                lichSuBuoiTapPT: lichSuBuoiTapPT.map(bt => ({
                    _id: bt._id,
                    tenBuoiTap: bt.tenBuoiTap,
                    ngayTap: bt.ngayTap,
                    gioBatDau: bt.gioBatDau,
                    gioKetThuc: bt.gioKetThuc,
                    chiNhanh: bt.chiNhanh?.tenChiNhanh || 'Chưa có',
                    trangThai: bt.trangThai,
                    ptPhuTrach: bt.ptPhuTrach ? { hoTen: bt.ptPhuTrach.hoTen } : null,
                    caloTieuHao: bt.caloTieuHao || templateMap.get((bt.tenBuoiTap || '').toLowerCase()) || null,
                    trangThaiHocVien: (() => {
                        const hv = bt.danhSachHoiVien?.find(m => m.hoiVien?.toString() === hoiVienId.toString());
                        return hv?.trangThai || null;
                    })()
                })),
                notes: notes.map(note => ({
                    _id: note._id,
                    noiDung: note.noiDung,
                    ngayTao: note.ngayTao,
                    ngayCapNhat: note.ngayCapNhat
                })),
                exercises: exercises.map(ex => ({
                    _id: ex._id,
                    baiTap: ex.baiTap,
                    trangThai: ex.trangThai,
                    ngayGan: ex.ngayGan,
                    hanHoanThanh: ex.hanHoanThanh,
                    ghiChu: ex.ghiChu
                })),
                buoiTapGanDay: buoiTapGanDay.map(bt => ({
                    _id: bt._id,
                    tenBuoiTap: bt.tenBuoiTap,
                    ngayTap: bt.ngayTap,
                    gioBatDau: bt.gioBatDau,
                    gioKetThuc: bt.gioKetThuc
                }))
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

