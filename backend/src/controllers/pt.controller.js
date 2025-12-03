const BuoiTap = require('../models/BuoiTap');
const PTNote = require('../models/PTNote');
const PTAssignment = require('../models/PTAssignment');
const ChiSoCoThe = require('../models/ChiSoCoThe');
const LichSuTap = require('../models/LichSuTap');
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

        // Lấy số học viên (từ các buổi tập PT phụ trách)
        const buoiTaps = await BuoiTap.find({ ptPhuTrach: ptId })
            .select('danhSachHoiVien');

        const uniqueHoiVienIds = new Set();
        buoiTaps.forEach(buoiTap => {
            buoiTap.danhSachHoiVien.forEach(member => {
                uniqueHoiVienIds.add(member.hoiVien.toString());
            });
        });
        const soHoiVien = uniqueHoiVienIds.size;

        // Lấy số buổi tập hôm nay
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const buoiTapHomNay = await BuoiTap.countDocuments({
            ptPhuTrach: ptId,
            ngayTap: { $gte: today, $lt: tomorrow }
        });

        // Lấy số buổi tập tuần này
        const startOfWeek = new Date(today);
        const dayOfWeek = today.getDay();
        startOfWeek.setDate(today.getDate() - dayOfWeek);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);

        const buoiTapTuanNay = await BuoiTap.countDocuments({
            ptPhuTrach: ptId,
            ngayTap: { $gte: startOfWeek, $lt: endOfWeek }
        });

        // Lấy lịch sắp tới (5 buổi tập tiếp theo)
        const lichSapToi = await BuoiTap.find({
            ptPhuTrach: ptId,
            ngayTap: { $gte: today }
        })
            .populate('chiNhanh', 'tenChiNhanh')
            .sort({ ngayTap: 1, gioBatDau: 1 })
            .limit(5)
            .select('tenBuoiTap ngayTap gioBatDau gioKetThuc chiNhanh soLuongHienTai soLuongToiDa');

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

