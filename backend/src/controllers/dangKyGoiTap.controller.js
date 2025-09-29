const DangKyGoiTap = require('../models/DangKyGoiTap');
const { HoiVien } = require('../models/NguoiDung');
const GoiTap = require('../models/GoiTap');

// Đăng ký gói tập mới
const dangKyGoiTap = async (req, res) => {
    try {
        const { maHoiVien, maGoiTap, ngayBatDau, soTienThanhToan, ghiChu } = req.body;

        // Kiểm tra hội viên tồn tại
        const hoiVien = await HoiVien.findById(maHoiVien);
        if (!hoiVien) {
            return res.status(404).json({ message: 'Không tìm thấy hội viên' });
        }

        // Kiểm tra gói tập tồn tại
        const goiTap = await GoiTap.findById(maGoiTap);
        if (!goiTap) {
            return res.status(404).json({ message: 'Không tìm thấy gói tập' });
        }

        // Tính ngày kết thúc dựa trên thời hạn gói tập
        const ngayKetThuc = new Date(ngayBatDau);
        if (goiTap.donViThoiHan === 'Ngay') {
            ngayKetThuc.setDate(ngayKetThuc.getDate() + goiTap.thoiHan);
        } else if (goiTap.donViThoiHan === 'Thang') {
            ngayKetThuc.setMonth(ngayKetThuc.getMonth() + goiTap.thoiHan);
        } else if (goiTap.donViThoiHan === 'Nam') {
            ngayKetThuc.setFullYear(ngayKetThuc.getFullYear() + goiTap.thoiHan);
        }

        // Tạo đăng ký mới
        const dangKyMoi = new DangKyGoiTap({
            maHoiVien,
            maGoiTap,
            ngayBatDau: new Date(ngayBatDau),
            ngayKetThuc,
            soTienThanhToan: soTienThanhToan || goiTap.donGia,
            ghiChu
        });

        await dangKyMoi.save();

        // Populate thông tin chi tiết
        const result = await DangKyGoiTap.findById(dangKyMoi._id)
            .populate('maHoiVien', 'hoTen email sdt')
            .populate('maGoiTap', 'tenGoiTap donGia thoiHan donViThoiHan');

        res.status(201).json({
            message: 'Đăng ký gói tập thành công',
            data: result
        });
    } catch (error) {
        console.error('Error in dangKyGoiTap:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Lấy danh sách đăng ký gói tập của hội viên
const getDangKyByHoiVien = async (req, res) => {
    try {
        const { maHoiVien } = req.params;
        const { trangThai } = req.query;

        let filter = { maHoiVien };
        if (trangThai) {
            filter.trangThai = trangThai;
        }

        const dangKyList = await DangKyGoiTap.find(filter)
            .populate('maGoiTap', 'tenGoiTap donGia thoiHan donViThoiHan moTa')
            .populate('ptDuocChon', 'hoTen chuyenMon danhGia')
            .sort({ thuTuUuTien: -1, createdAt: -1 });

        res.json({
            message: 'Lấy danh sách đăng ký thành công',
            data: dangKyList
        });
    } catch (error) {
        console.error('Error in getDangKyByHoiVien:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Lấy danh sách hội viên của gói tập
const getHoiVienByGoiTap = async (req, res) => {
    try {
        const { maGoiTap } = req.params;
        const { trangThai } = req.query;

        let filter = { maGoiTap };
        if (trangThai) {
            filter.trangThai = trangThai;
        } else {
            filter.trangThai = { $in: ['DANG_HOAT_DONG', 'TAM_DUNG'] };
        }

        const hoiVienList = await DangKyGoiTap.find(filter)
            .populate('maHoiVien', 'hoTen email sdt ngayThamGia trangThaiHoiVien')
            .populate('ptDuocChon', 'hoTen chuyenMon')
            .sort({ createdAt: -1 });

        res.json({
            message: 'Lấy danh sách hội viên thành công',
            data: hoiVienList
        });
    } catch (error) {
        console.error('Error in getHoiVienByGoiTap:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Lấy gói tập đang hoạt động của hội viên
const getActivePackage = async (req, res) => {
    try {
        const { maHoiVien } = req.params;

        const activePackage = await DangKyGoiTap.getActivePackage(maHoiVien);

        if (!activePackage) {
            return res.status(404).json({ message: 'Không có gói tập đang hoạt động' });
        }

        res.json({
            message: 'Lấy gói tập đang hoạt động thành công',
            data: activePackage
        });
    } catch (error) {
        console.error('Error in getActivePackage:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Kích hoạt lại gói tập
const kichHoatLaiGoiTap = async (req, res) => {
    try {
        const { id } = req.params;

        const dangKy = await DangKyGoiTap.findById(id);
        if (!dangKy) {
            return res.status(404).json({ message: 'Không tìm thấy đăng ký gói tập' });
        }

        // Kiểm tra xem có gói nào đang hoạt động không
        const activePackage = await DangKyGoiTap.findOne({
            maHoiVien: dangKy.maHoiVien,
            trangThai: 'DANG_HOAT_DONG',
            _id: { $ne: id }
        });

        if (activePackage) {
            return res.status(400).json({ 
                message: 'Không thể kích hoạt vì đã có gói tập khác đang hoạt động' 
            });
        }

        const result = await dangKy.kichHoatLai();

        res.json({
            message: 'Kích hoạt lại gói tập thành công',
            data: result
        });
    } catch (error) {
        console.error('Error in kichHoatLaiGoiTap:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Cập nhật trạng thái thanh toán
const capNhatThanhToan = async (req, res) => {
    try {
        const { id } = req.params;
        const { trangThaiThanhToan, maThanhToan } = req.body;

        const dangKy = await DangKyGoiTap.findById(id);
        if (!dangKy) {
            return res.status(404).json({ message: 'Không tìm thấy đăng ký gói tập' });
        }

        dangKy.trangThaiThanhToan = trangThaiThanhToan;
        if (maThanhToan) {
            dangKy.maThanhToan = maThanhToan;
        }

        await dangKy.save();

        const result = await DangKyGoiTap.findById(id)
            .populate('maHoiVien', 'hoTen email sdt')
            .populate('maGoiTap', 'tenGoiTap donGia');

        res.json({
            message: 'Cập nhật trạng thái thanh toán thành công',
            data: result
        });
    } catch (error) {
        console.error('Error in capNhatThanhToan:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Hủy đăng ký gói tập
const huyDangKy = async (req, res) => {
    try {
        const { id } = req.params;
        const { lyDo } = req.body;

        const dangKy = await DangKyGoiTap.findById(id);
        if (!dangKy) {
            return res.status(404).json({ message: 'Không tìm thấy đăng ký gói tập' });
        }

        if (dangKy.trangThaiThanhToan === 'DA_THANH_TOAN') {
            return res.status(400).json({ 
                message: 'Không thể hủy gói tập đã thanh toán' 
            });
        }

        dangKy.trangThai = 'DA_HUY';
        dangKy.ghiChu = lyDo || 'Hủy đăng ký';

        await dangKy.save();

        res.json({
            message: 'Hủy đăng ký gói tập thành công',
            data: dangKy
        });
    } catch (error) {
        console.error('Error in huyDangKy:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Thống kê gói tập
const thongKeGoiTap = async (req, res) => {
    try {
        const stats = await DangKyGoiTap.getPackageStats();

        // Thống kê tổng quan
        const tongQuan = await DangKyGoiTap.aggregate([
            {
                $group: {
                    _id: null,
                    tongSoDangKy: { $sum: 1 },
                    soGoiDangHoatDong: {
                        $sum: { $cond: [{ $eq: ['$trangThai', 'DANG_HOAT_DONG'] }, 1, 0] }
                    },
                    soGoiTamDung: {
                        $sum: { $cond: [{ $eq: ['$trangThai', 'TAM_DUNG'] }, 1, 0] }
                    },
                    soGoiHetHan: {
                        $sum: { $cond: [{ $eq: ['$trangThai', 'HET_HAN'] }, 1, 0] }
                    },
                    tongDoanhThu: {
                        $sum: { $cond: [{ $eq: ['$trangThaiThanhToan', 'DA_THANH_TOAN'] }, '$soTienThanhToan', 0] }
                    }
                }
            }
        ]);

        res.json({
            message: 'Lấy thống kê thành công',
            data: {
                tongQuan: tongQuan[0] || {},
                chiTietTheoGoiTap: stats
            }
        });
    } catch (error) {
        console.error('Error in thongKeGoiTap:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Lấy tất cả đăng ký (cho admin)
const getAllDangKy = async (req, res) => {
    try {
        const { page = 1, limit = 10, trangThai, search } = req.query;
        const skip = (page - 1) * limit;

        let filter = {};
        if (trangThai) {
            filter.trangThai = trangThai;
        }

        let query = DangKyGoiTap.find(filter)
            .populate('maHoiVien', 'hoTen email sdt')
            .populate('maGoiTap', 'tenGoiTap donGia thoiHan donViThoiHan')
            .populate('ptDuocChon', 'hoTen chuyenMon')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Tìm kiếm theo tên hội viên hoặc tên gói tập
        if (search) {
            const searchRegex = new RegExp(search, 'i');
            const hoiVienIds = await HoiVien.find({ hoTen: searchRegex }).distinct('_id');
            const goiTapIds = await GoiTap.find({ tenGoiTap: searchRegex }).distinct('_id');
            
            filter.$or = [
                { maHoiVien: { $in: hoiVienIds } },
                { maGoiTap: { $in: goiTapIds } }
            ];
            
            query = DangKyGoiTap.find(filter)
                .populate('maHoiVien', 'hoTen email sdt')
                .populate('maGoiTap', 'tenGoiTap donGia thoiHan donViThoiHan')
                .populate('ptDuocChon', 'hoTen chuyenMon')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit));
        }

        const dangKyList = await query;
        const total = await DangKyGoiTap.countDocuments(filter);

        res.json({
            message: 'Lấy danh sách đăng ký thành công',
            data: dangKyList,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error in getAllDangKy:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

module.exports = {
    dangKyGoiTap,
    getDangKyByHoiVien,
    getHoiVienByGoiTap,
    getActivePackage,
    kichHoatLaiGoiTap,
    capNhatThanhToan,
    huyDangKy,
    thongKeGoiTap,
    getAllDangKy
};
