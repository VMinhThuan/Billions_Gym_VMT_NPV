const express = require('express');
const router = express.Router();
const DangKyGoiTap = require('../models/DangKyGoiTap');
const { HoiVien } = require('../models/NguoiDung');
const GoiTap = require('../models/GoiTap');

// GET /api/dangkygoitap - Lấy tất cả đăng ký gói tập
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 50, trangThai, search } = req.query;

        let query = {};

        // Filter by status
        if (trangThai && trangThai !== 'all') {
            query.trangThai = trangThai;
        }

        // Search functionality
        if (search) {
            const members = await HoiVien.find({
                $or: [
                    { hoTen: { $regex: search, $options: 'i' } },
                    { sdt: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ]
            }).select('_id');

            const memberIds = members.map(m => m._id);
            query.maHoiVien = { $in: memberIds };
        }

        const registrations = await DangKyGoiTap.find(query)
            .populate('maHoiVien', 'hoTen email sdt ngayThamGia trangThaiHoiVien')
            .populate('maGoiTap', 'tenGoiTap donGia thoiHan donViThoiHan moTa')
            .populate('ptDuocChon', 'hoTen')
            .sort({ createdAt: -1, thuTuUuTien: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await DangKyGoiTap.countDocuments(query);

        res.json({
            data: registrations,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error fetching registrations:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể tải danh sách đăng ký gói tập',
            error: error.message
        });
    }
});

// GET /api/dangkygoitap/member/:memberId - Lấy tất cả gói tập của một hội viên
router.get('/member/:memberId', async (req, res) => {
    try {
        const { memberId } = req.params;

        const packages = await DangKyGoiTap.getAllPackagesByMember(memberId);

        res.json(packages);
    } catch (error) {
        console.error('Error fetching member packages:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể tải gói tập của hội viên',
            error: error.message
        });
    }
});

// GET /api/dangkygoitap/package/:packageId - Lấy danh sách hội viên của một gói tập
router.get('/package/:packageId', async (req, res) => {
    try {
        const { packageId } = req.params;

        const members = await DangKyGoiTap.getMembersByPackage(packageId);

        res.json(members);
    } catch (error) {
        console.error('Error fetching package members:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể tải danh sách hội viên của gói tập',
            error: error.message
        });
    }
});

// GET /api/dangkygoitap/stats - Lấy thống kê gói tập
router.get('/stats', async (req, res) => {
    try {
        const stats = await DangKyGoiTap.getPackageStats();

        res.json(stats);
    } catch (error) {
        console.error('Error fetching package stats:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể tải thống kê gói tập',
            error: error.message
        });
    }
});

// GET /api/dangkygoitap/member/:memberId/active - Lấy gói đang hoạt động của hội viên
router.get('/member/:memberId/active', async (req, res) => {
    try {
        const { memberId } = req.params;

        const activePackage = await DangKyGoiTap.getActivePackage(memberId);

        if (!activePackage) {
            return res.status(404).json({
                success: false,
                message: 'Hội viên không có gói tập đang hoạt động'
            });
        }

        res.json(activePackage);
    } catch (error) {
        console.error('Error fetching active package:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể tải gói tập đang hoạt động',
            error: error.message
        });
    }
});

// POST /api/dangkygoitap - Tạo đăng ký gói tập mới
router.post('/', async (req, res) => {
    try {
        const {
            maHoiVien,
            maGoiTap,
            ngayBatDau,
            ngayKetThuc,
            soTienThanhToan,
            trangThaiThanhToan = 'CHUA_THANH_TOAN',
            ghiChu
        } = req.body;

        // Validate required fields
        if (!maHoiVien || !maGoiTap || !ngayBatDau) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin bắt buộc: maHoiVien, maGoiTap, ngayBatDau'
            });
        }

        // Check if member exists
        const member = await HoiVien.findById(maHoiVien);
        if (!member) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy hội viên'
            });
        }

        // Check if package exists
        const packageInfo = await GoiTap.findById(maGoiTap);
        if (!packageInfo) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy gói tập'
            });
        }

        // Calculate end date if not provided
        let calculatedEndDate = ngayKetThuc;
        if (!calculatedEndDate) {
            const startDate = new Date(ngayBatDau);
            const endDate = new Date(startDate);

            switch (packageInfo.donViThoiHan) {
                case 'Ngày':
                    endDate.setDate(startDate.getDate() + packageInfo.thoiHan);
                    break;
                case 'Tháng':
                    endDate.setMonth(startDate.getMonth() + packageInfo.thoiHan);
                    break;
                case 'Năm':
                    endDate.setFullYear(startDate.getFullYear() + packageInfo.thoiHan);
                    break;
            }
            calculatedEndDate = endDate;
        }

        // Create new registration
        const newRegistration = new DangKyGoiTap({
            maHoiVien,
            maGoiTap,
            ngayBatDau: new Date(ngayBatDau),
            ngayKetThuc: calculatedEndDate,
            soTienThanhToan: soTienThanhToan || packageInfo.donGia,
            trangThaiThanhToan,
            ghiChu,
            trangThai: 'DANG_HOAT_DONG'
        });

        const savedRegistration = await newRegistration.save();

        // Populate the response
        const populatedRegistration = await DangKyGoiTap.findById(savedRegistration._id)
            .populate('maHoiVien', 'hoTen email sdt')
            .populate('maGoiTap', 'tenGoiTap donGia thoiHan donViThoiHan');

        res.status(201).json({
            success: true,
            message: 'Đăng ký gói tập thành công',
            data: populatedRegistration
        });
    } catch (error) {
        console.error('Error creating registration:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể tạo đăng ký gói tập',
            error: error.message
        });
    }
});

// PUT /api/dangkygoitap/:id/reactivate - Kích hoạt lại gói tập
router.put('/:id/reactivate', async (req, res) => {
    try {
        const { id } = req.params;

        const registration = await DangKyGoiTap.findById(id);
        if (!registration) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đăng ký gói tập'
            });
        }

        if (registration.trangThai !== 'TAM_DUNG') {
            return res.status(400).json({
                success: false,
                message: 'Chỉ có thể kích hoạt lại gói tập đang tạm dừng'
            });
        }

        if (!registration.soNgayConLai || registration.soNgayConLai <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Gói tập không còn thời gian để kích hoạt lại'
            });
        }

        // Tạm dừng tất cả gói đang hoạt động khác của hội viên này
        await DangKyGoiTap.updateMany(
            {
                maHoiVien: registration.maHoiVien,
                trangThai: 'DANG_HOAT_DONG',
                _id: { $ne: id }
            },
            {
                $set: {
                    trangThai: 'TAM_DUNG',
                    ngayTamDung: new Date(),
                    lyDoTamDung: `Tạm dừng do kích hoạt lại gói: ${registration.maGoiTap}`
                }
            }
        );

        // Kích hoạt lại gói tập
        const reactivatedPackage = await registration.kichHoatLai();

        const populatedPackage = await DangKyGoiTap.findById(reactivatedPackage._id)
            .populate('maHoiVien', 'hoTen email sdt')
            .populate('maGoiTap', 'tenGoiTap donGia thoiHan donViThoiHan');

        res.json({
            success: true,
            message: 'Kích hoạt lại gói tập thành công',
            data: populatedPackage
        });
    } catch (error) {
        console.error('Error reactivating package:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể kích hoạt lại gói tập',
            error: error.message
        });
    }
});

// PUT /api/dangkygoitap/:id/cancel - Hủy đăng ký gói tập
router.put('/:id/cancel', async (req, res) => {
    try {
        const { id } = req.params;
        const { lyDo } = req.body;

        const registration = await DangKyGoiTap.findById(id);
        if (!registration) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đăng ký gói tập'
            });
        }

        if (registration.trangThai === 'DA_HUY') {
            return res.status(400).json({
                success: false,
                message: 'Gói tập đã được hủy trước đó'
            });
        }

        // Update registration status
        registration.trangThai = 'DA_HUY';
        registration.ghiChu = `${registration.ghiChu || ''}\nLý do hủy: ${lyDo || 'Không có lý do'}`;

        await registration.save();

        // Nếu có gói tạm dừng, kích hoạt lại gói có priority cao nhất
        const pausedPackages = await DangKyGoiTap.find({
            maHoiVien: registration.maHoiVien,
            trangThai: 'TAM_DUNG',
            soNgayConLai: { $gt: 0 }
        }).sort({ thuTuUuTien: -1 }).limit(1);

        if (pausedPackages.length > 0) {
            await pausedPackages[0].kichHoatLai();
        }

        const populatedRegistration = await DangKyGoiTap.findById(registration._id)
            .populate('maHoiVien', 'hoTen email sdt')
            .populate('maGoiTap', 'tenGoiTap donGia thoiHan donViThoiHan');

        res.json({
            success: true,
            message: 'Hủy đăng ký gói tập thành công',
            data: populatedRegistration
        });
    } catch (error) {
        console.error('Error canceling registration:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể hủy đăng ký gói tập',
            error: error.message
        });
    }
});

// PUT /api/dangkygoitap/:id/payment - Cập nhật trạng thái thanh toán
router.put('/:id/payment', async (req, res) => {
    try {
        const { id } = req.params;
        const { trangThaiThanhToan, soTienThanhToan } = req.body;

        const registration = await DangKyGoiTap.findById(id);
        if (!registration) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đăng ký gói tập'
            });
        }

        // Update payment status
        if (trangThaiThanhToan) {
            registration.trangThaiThanhToan = trangThaiThanhToan;
        }

        if (soTienThanhToan !== undefined) {
            registration.soTienThanhToan = soTienThanhToan;
        }

        await registration.save();

        const populatedRegistration = await DangKyGoiTap.findById(registration._id)
            .populate('maHoiVien', 'hoTen email sdt')
            .populate('maGoiTap', 'tenGoiTap donGia thoiHan donViThoiHan');

        res.json({
            success: true,
            message: 'Cập nhật trạng thái thanh toán thành công',
            data: populatedRegistration
        });
    } catch (error) {
        console.error('Error updating payment status:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể cập nhật trạng thái thanh toán',
            error: error.message
        });
    }
});

// GET /api/dangkygoitap/:id - Lấy chi tiết một đăng ký
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const registration = await DangKyGoiTap.findById(id)
            .populate('maHoiVien', 'hoTen email sdt ngayThamGia trangThaiHoiVien')
            .populate('maGoiTap', 'tenGoiTap donGia thoiHan donViThoiHan moTa')
            .populate('ptDuocChon', 'hoTen chuyenMon')
            .populate('lichTapDuocTao');

        if (!registration) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đăng ký gói tập'
            });
        }

        res.json(registration);
    } catch (error) {
        console.error('Error fetching registration details:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể tải chi tiết đăng ký gói tập',
            error: error.message
        });
    }
});

// DELETE /api/dangkygoitap/:id - Xóa đăng ký gói tập
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const registration = await DangKyGoiTap.findById(id);
        if (!registration) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đăng ký gói tập'
            });
        }

        // Only allow deletion if not paid or if explicitly confirmed
        if (registration.trangThaiThanhToan === 'DA_THANH_TOAN' && !req.body.forceDelete) {
            return res.status(400).json({
                success: false,
                message: 'Không thể xóa đăng ký đã thanh toán. Sử dụng forceDelete=true để xác nhận xóa.'
            });
        }

        await DangKyGoiTap.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Xóa đăng ký gói tập thành công'
        });
    } catch (error) {
        console.error('Error deleting registration:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể xóa đăng ký gói tập',
            error: error.message
        });
    }
});

module.exports = router;
