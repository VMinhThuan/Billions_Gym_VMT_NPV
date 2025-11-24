const BuoiTap = require('../models/BuoiTap');

// Lấy lịch sử làm việc
exports.getWorkHistory = async (req, res) => {
    try {
        const ptId = req.user.id;
        const { startDate, endDate, trangThai, page = 1, limit = 20 } = req.query;

        const query = { ptPhuTrach: ptId };

        if (startDate || endDate) {
            query.ngayTap = {};
            if (startDate) {
                query.ngayTap.$gte = new Date(startDate);
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.ngayTap.$lte = end;
            }
        }

        if (trangThai) {
            query.trangThai = trangThai;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const buoiTaps = await BuoiTap.find(query)
            .populate('chiNhanh', 'tenChiNhanh')
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
        console.error('Error in getWorkHistory:', err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

