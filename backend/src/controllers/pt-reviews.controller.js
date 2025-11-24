const Review = require('../models/Review');
const BuoiTap = require('../models/BuoiTap');
const { HoiVien } = require('../models/NguoiDung');

// Lấy tất cả đánh giá từ học viên của PT
exports.getPTReviews = async (req, res) => {
    try {
        const ptId = req.user.id;
        const { page = 1, limit = 20, rating } = req.query;

        // Lấy tất cả học viên của PT
        const buoiTaps = await BuoiTap.find({ ptPhuTrach: ptId })
            .select('danhSachHoiVien');

        const hoiVienIds = new Set();
        buoiTaps.forEach(buoiTap => {
            buoiTap.danhSachHoiVien.forEach(member => {
                hoiVienIds.add(member.hoiVien.toString());
            });
        });

        // Lấy reviews từ học viên của PT
        const query = {
            hoiVienId: { $in: Array.from(hoiVienIds) },
            trangThai: 'active'
        };

        if (rating) {
            query.rating = parseInt(rating);
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const reviews = await Review.find(query)
            .populate('hoiVienId', 'hoTen anhDaiDien')
            .populate('goiTapId', 'tenGoiTap')
            .sort({ ngayTao: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Review.countDocuments(query);

        // Tính rating trung bình
        const allReviews = await Review.find(query).select('rating');
        const avgRating = allReviews.length > 0
            ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1)
            : 0;

        // Phân bố rating
        const ratingDistribution = {
            5: 0,
            4: 0,
            3: 0,
            2: 0,
            1: 0
        };
        allReviews.forEach(r => {
            if (ratingDistribution.hasOwnProperty(r.rating)) {
                ratingDistribution[r.rating]++;
            }
        });

        res.json({
            success: true,
            data: {
                reviews,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                },
                summary: {
                    avgRating: parseFloat(avgRating),
                    totalReviews: allReviews.length,
                    ratingDistribution
                }
            }
        });
    } catch (err) {
        console.error('Error in getPTReviews:', err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

