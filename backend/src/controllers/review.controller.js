const mongoose = require('mongoose');
const Review = require('../models/Review');
const GoiTap = require('../models/GoiTap');
const NguoiDung = require('../models/NguoiDung');
const DangKyGoiTap = require('../models/DangKyGoiTap');

// GET /api/goitap/:id/reviews - Lấy danh sách reviews của gói tập
const getReviewsByPackageId = async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 10 } = req.query;

        // Kiểm tra gói tập có tồn tại không
        const goiTap = await GoiTap.findById(id);
        if (!goiTap) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy gói tập'
            });
        }

        // Lấy danh sách reviews với phân trang
        const skip = (page - 1) * limit;
        const reviews = await Review.find({
            goiTapId: id,
            trangThai: 'active'
        })
            .populate('hoiVienId', 'hoTen anhDaiDien')
            .sort({ ngayTao: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Tính tổng số reviews
        const totalReviews = await Review.countDocuments({
            goiTapId: id,
            trangThai: 'active'
        });

        // Tính rating trung bình
        const ratingStats = await Review.aggregate([
            { $match: { goiTapId: mongoose.Types.ObjectId(id), trangThai: 'active' } },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: '$rating' },
                    totalCount: { $sum: 1 },
                    ratingDistribution: {
                        $push: '$rating'
                    }
                }
            }
        ]);

        const stats = ratingStats[0] || { averageRating: 0, totalCount: 0, ratingDistribution: [] };

        // Tính phân bố rating
        const distribution = [1, 2, 3, 4, 5].map(rating => ({
            rating,
            count: stats.ratingDistribution.filter(r => r === rating).length
        }));

        res.json({
            success: true,
            data: {
                reviews,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalReviews / limit),
                    totalReviews,
                    hasNext: page < Math.ceil(totalReviews / limit),
                    hasPrev: page > 1
                },
                stats: {
                    averageRating: Math.round(stats.averageRating * 10) / 10,
                    totalCount: stats.totalCount,
                    distribution
                }
            }
        });
    } catch (error) {
        console.error('Error getting reviews:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy danh sách đánh giá',
            error: error.message
        });
    }
};

// POST /api/goitap/:id/review - Tạo review mới
const createReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, comment, hinhAnh } = req.body;
        const userId = req.user.id;

        // Kiểm tra gói tập có tồn tại không
        const goiTap = await GoiTap.findById(id);
        if (!goiTap) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy gói tập'
            });
        }

        // Kiểm tra hội viên đã mua gói tập chưa
        const dangKyGoiTap = await DangKyGoiTap.findOne({
            hoiVienId: userId,
            goiTapId: id,
            trangThai: 'active'
        });

        if (!dangKyGoiTap) {
            return res.status(403).json({
                success: false,
                message: 'Bạn cần mua gói tập này trước khi có thể đánh giá'
            });
        }

        // Kiểm tra đã review chưa
        const existingReview = await Review.findOne({
            goiTapId: id,
            hoiVienId: userId
        });

        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: 'Bạn đã đánh giá gói tập này rồi'
            });
        }

        // Validation
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating phải từ 1 đến 5 sao'
            });
        }

        if (!comment || comment.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Nội dung đánh giá không được để trống'
            });
        }

        if (comment.trim().length > 1000) {
            return res.status(400).json({
                success: false,
                message: 'Nội dung đánh giá không được quá 1000 ký tự'
            });
        }

        if (hinhAnh && hinhAnh.length > 3) {
            return res.status(400).json({
                success: false,
                message: 'Chỉ được tải lên tối đa 3 hình ảnh'
            });
        }

        // Tạo review mới
        const newReview = new Review({
            goiTapId: id,
            hoiVienId: userId,
            rating,
            comment: comment.trim(),
            hinhAnh: hinhAnh || []
        });

        await newReview.save();

        // Populate thông tin hội viên
        await newReview.populate('hoiVienId', 'hoTen anhDaiDien');

        res.status(201).json({
            success: true,
            message: 'Đánh giá đã được gửi thành công',
            data: newReview
        });
    } catch (error) {
        console.error('Error creating review:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi tạo đánh giá',
            error: error.message
        });
    }
};

// PUT /api/reviews/:reviewId - Cập nhật review
const updateReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { rating, comment, hinhAnh } = req.body;
        const userId = req.user.id;

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đánh giá'
            });
        }

        // Kiểm tra quyền sở hữu
        if (review.hoiVienId.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền chỉnh sửa đánh giá này'
            });
        }

        // Validation
        if (rating && (rating < 1 || rating > 5)) {
            return res.status(400).json({
                success: false,
                message: 'Rating phải từ 1 đến 5 sao'
            });
        }

        if (comment && comment.trim().length > 1000) {
            return res.status(400).json({
                success: false,
                message: 'Nội dung đánh giá không được quá 1000 ký tự'
            });
        }

        if (hinhAnh && hinhAnh.length > 3) {
            return res.status(400).json({
                success: false,
                message: 'Chỉ được tải lên tối đa 3 hình ảnh'
            });
        }

        // Cập nhật review
        const updateData = {};
        if (rating) updateData.rating = rating;
        if (comment) updateData.comment = comment.trim();
        if (hinhAnh) updateData.hinhAnh = hinhAnh;

        const updatedReview = await Review.findByIdAndUpdate(
            reviewId,
            updateData,
            { new: true, runValidators: true }
        ).populate('hoiVienId', 'hoTen anhDaiDien');

        res.json({
            success: true,
            message: 'Đánh giá đã được cập nhật thành công',
            data: updatedReview
        });
    } catch (error) {
        console.error('Error updating review:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi cập nhật đánh giá',
            error: error.message
        });
    }
};

// DELETE /api/reviews/:reviewId - Xóa review
const deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const userId = req.user.id;

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đánh giá'
            });
        }

        // Kiểm tra quyền sở hữu
        if (review.hoiVienId.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền xóa đánh giá này'
            });
        }

        // Soft delete
        review.trangThai = 'deleted';
        await review.save();

        res.json({
            success: true,
            message: 'Đánh giá đã được xóa thành công'
        });
    } catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi xóa đánh giá',
            error: error.message
        });
    }
};

module.exports = {
    getReviewsByPackageId,
    createReview,
    updateReview,
    deleteReview
};
