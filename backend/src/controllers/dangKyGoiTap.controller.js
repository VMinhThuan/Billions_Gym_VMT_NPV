const ChiTietGoiTap = require('../models/ChiTietGoiTap');
const { HoiVien } = require('../models/NguoiDung');
const GoiTap = require('../models/GoiTap');

// Đăng ký gói tập mới
const dangKyGoiTap = async (req, res) => {
    try {
        const { maHoiVien, maGoiTap, ngayBatDau, soTienThanhToan, trangThaiThanhToan, ghiChu } = req.body;

        console.log('🔍 Backend - Received registration data:', req.body);

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
        const dangKyMoi = new ChiTietGoiTap({
            maHoiVien,
            maGoiTap,
            ngayBatDau: new Date(ngayBatDau),
            ngayKetThuc,
            soTienThanhToan: soTienThanhToan || goiTap.donGia,
            trangThaiThanhToan,
            ghiChu
        });

        await dangKyMoi.save();

        // Populate thông tin chi tiết
        const result = await ChiTietGoiTap.findById(dangKyMoi._id)
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
        const { trangThai, tenHoiVien } = req.query;

        console.log('🔍 Backend - Fetching packages for member:', maHoiVien);
        console.log('🔍 Backend - Query params:', { trangThai, tenHoiVien });

        let filter = {};

        // Nếu có tenHoiVien, tìm member ID trước
        if (tenHoiVien) {
            console.log('🔍 Backend - Searching by member name:', tenHoiVien);
            const foundMembers = await HoiVien.find({
                hoTen: { $regex: tenHoiVien, $options: 'i' }
            }).limit(5);

            if (foundMembers.length === 0) {
                console.log('❌ No members found with name:', tenHoiVien);
                return res.json({
                    message: 'Không tìm thấy hội viên',
                    data: []
                });
            }

            const memberIds = foundMembers.map(m => m._id);
            console.log('🔍 Backend - Found member IDs:', memberIds);

            filter.maHoiVien = { $in: memberIds };
        } else {
            // Sử dụng trực tiếp member ID
            filter.maHoiVien = maHoiVien;
        }

        if (trangThai) {
            filter.trangThai = trangThai;
        }

        console.log('🔍 Backend - MongoDB filter:', filter);

        const dangKyList = await ChiTietGoiTap.find(filter)
            .populate('maHoiVien', 'hoTen email sdt ngayThamGia trangThaiHoiVien')
            .populate('maGoiTap', 'tenGoiTap donGia thoiHan donViThoiHan moTa')
            .populate('ptDuocChon', 'hoTen chuyenMon danhGia')
            .sort({ thuTuUuTien: -1, createdAt: -1 });

        console.log('🔍 Backend - Found packages:', dangKyList.length);
        console.log('🔍 Backend - Package details:', dangKyList);

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

        const hoiVienList = await ChiTietGoiTap.find(filter)
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

        const activePackage = await ChiTietGoiTap.getActivePackage(maHoiVien);

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

        const dangKy = await ChiTietGoiTap.findById(id);
        if (!dangKy) {
            return res.status(404).json({ message: 'Không tìm thấy đăng ký gói tập' });
        }

        // Kiểm tra xem có gói nào đang hoạt động không
        const activePackage = await ChiTietGoiTap.findOne({
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

        const dangKy = await ChiTietGoiTap.findById(id);
        if (!dangKy) {
            return res.status(404).json({ message: 'Không tìm thấy đăng ký gói tập' });
        }

        dangKy.trangThaiThanhToan = trangThaiThanhToan;
        if (maThanhToan) {
            dangKy.maThanhToan = maThanhToan;
        }

        await dangKy.save();

        const result = await ChiTietGoiTap.findById(id)
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

        const dangKy = await ChiTietGoiTap.findById(id);
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
        const stats = await ChiTietGoiTap.getPackageStats();

        // Thống kê tổng quan
        const tongQuan = await ChiTietGoiTap.aggregate([
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
        const { page = 1, limit = 100, trangThai, search } = req.query; 
        const skip = (page - 1) * limit;

        console.log('🔍 Backend - getAllDangKy params:', { page, limit, trangThai, search });

        let filter = {};
        if (trangThai) {
            filter.trangThai = trangThai;
        }

        // Nếu không có search và không có filter đặc biệt, trả về tất cả mà không phân trang
        if (!search && !trangThai) {
            console.log('🔍 Backend - Returning all registrations without pagination');
            const allRegistrations = await ChiTietGoiTap.find(filter)
                .populate('maHoiVien', 'hoTen email sdt')
                .populate('maGoiTap', 'tenGoiTap donGia thoiHan donViThoiHan')
                .populate('ptDuocChon', 'hoTen chuyenMon')
                .sort({ createdAt: -1 });

            return res.json({
                message: 'Lấy danh sách đăng ký thành công',
                data: allRegistrations,
                pagination: {
                    currentPage: 1,
                    totalPages: 1,
                    totalItems: allRegistrations.length,
                    itemsPerPage: allRegistrations.length
                }
            });
        }

        // Xử lý tìm kiếm
        if (search) {
            const searchRegex = new RegExp(search, 'i');
            const hoiVienIds = await HoiVien.find({ hoTen: searchRegex }).distinct('_id');
            const goiTapIds = await GoiTap.find({ tenGoiTap: searchRegex }).distinct('_id');

            filter.$or = [
                { maHoiVien: { $in: hoiVienIds } },
                { maGoiTap: { $in: goiTapIds } }
            ];
        }

        const dangKyList = await ChiTietGoiTap.find(filter)
            .populate('maHoiVien', 'hoTen email sdt')
            .populate('maGoiTap', 'tenGoiTap donGia thoiHan donViThoiHan')
            .populate('ptDuocChon', 'hoTen chuyenMon')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await ChiTietGoiTap.countDocuments(filter);

        console.log('🔍 Backend - Returning paginated results:', {
            total,
            returned: dangKyList.length,
            page: parseInt(page),
            limit: parseInt(limit)
        });

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
