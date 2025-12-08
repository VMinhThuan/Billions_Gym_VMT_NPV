const SessionReview = require('../models/SessionReview');
const BuoiTap = require('../models/BuoiTap');
const { HoiVien } = require('../models/NguoiDung');

// Lấy tất cả đánh giá từ học viên của PT (từ SessionReview - đánh giá buổi tập)
exports.getPTReviews = async (req, res) => {
    try {
        const ptId = req.user.id;
        const { page = 1, limit = 20, rating } = req.query;

        // Lấy tất cả buổi tập của PT để lấy buoiTapIds
        const mongoose = require('mongoose');
        // Chuyển đổi ptId sang ObjectId để đảm bảo match chính xác
        const ptObjectId = mongoose.Types.ObjectId.isValid(ptId)
            ? new mongoose.Types.ObjectId(ptId)
            : ptId;

        console.log('[getPTReviews] PT ID:', ptId, 'Type:', typeof ptId);
        console.log('[getPTReviews] PT ObjectId:', ptObjectId);

        const buoiTaps = await BuoiTap.find({
            ptPhuTrach: ptObjectId
        })
            .select('_id')
            .lean();

        console.log('[getPTReviews] BuoiTaps found:', buoiTaps.length);

        const buoiTapIds = buoiTaps.map(bt => bt._id);

        if (buoiTapIds.length === 0) {
            console.log('[getPTReviews] No buoiTaps found, returning empty');
            return res.json({
                success: true,
                data: {
                    reviews: [],
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: 0,
                        pages: 0
                    },
                    summary: {
                        avgRating: 0,
                        totalReviews: 0,
                        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
                    }
                }
            });
        }

        // Kiểm tra tổng số SessionReview cho các buoiTapIds này (không filter ptRating)
        const allReviewsCount = await SessionReview.countDocuments({
            buoiTapId: { $in: buoiTapIds }
        });
        console.log('[getPTReviews] Total SessionReviews for buoiTaps:', allReviewsCount);

        // Kiểm tra số review có ptRating
        const reviewsWithPTRatingCount = await SessionReview.countDocuments({
            buoiTapId: { $in: buoiTapIds },
            ptRating: { $ne: null, $exists: true }
        });
        console.log('[getPTReviews] Reviews with ptRating:', reviewsWithPTRatingCount);

        // Query SessionReview với filter theo buoiTapIds và chỉ lấy những review có ptRating (đánh giá PT)
        const query = {
            buoiTapId: { $in: buoiTapIds },
            ptRating: { $ne: null, $exists: true } // Chỉ lấy review có đánh giá PT
        };

        if (rating) {
            query.ptRating = parseInt(rating);
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Lấy reviews với populate thông tin buổi tập và học viên
        const sessionReviews = await SessionReview.find(query)
            .populate('buoiTapId', 'tenBuoiTap ngayTap gioBatDau gioKetThuc ptPhuTrach')
            .populate('hoiVienId', 'hoTen anhDaiDien')
            .sort({ ngayTao: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        console.log('[getPTReviews] SessionReviews found:', sessionReviews.length);
        if (sessionReviews.length > 0) {
            console.log('[getPTReviews] Sample review:', {
                _id: sessionReviews[0]._id,
                buoiTapId: sessionReviews[0].buoiTapId?._id,
                ptRating: sessionReviews[0].ptRating,
                ptComment: sessionReviews[0].ptComment,
                hoiVienId: sessionReviews[0].hoiVienId?._id
            });
        }

        const total = await SessionReview.countDocuments(query);
        console.log('[getPTReviews] Total reviews matching query:', total);

        // Format reviews để tương thích với frontend
        const reviews = sessionReviews.map(sr => ({
            _id: sr._id,
            rating: sr.ptRating,
            comment: sr.ptComment || '',
            hoiVienId: sr.hoiVienId ? {
                _id: sr.hoiVienId._id,
                hoTen: sr.hoiVienId.hoTen,
                anhDaiDien: sr.hoiVienId.anhDaiDien
            } : null,
            buoiTap: sr.buoiTapId ? {
                _id: sr.buoiTapId._id,
                tenBuoiTap: sr.buoiTapId.tenBuoiTap,
                ngayTap: sr.buoiTapId.ngayTap,
                gioBatDau: sr.buoiTapId.gioBatDau,
                gioKetThuc: sr.buoiTapId.gioKetThuc
            } : null,
            createdAt: sr.ngayTao || sr.createdAt,
            updatedAt: sr.ngayCapNhat || sr.updatedAt
        }));

        // Tính rating trung bình từ tất cả reviews có ptRating
        const allSessionReviews = await SessionReview.find({
            buoiTapId: { $in: buoiTapIds },
            ptRating: { $ne: null }
        }).select('ptRating').lean();

        const avgRating = allSessionReviews.length > 0
            ? (allSessionReviews.reduce((sum, r) => sum + (r.ptRating || 0), 0) / allSessionReviews.length).toFixed(1)
            : 0;

        // Phân bố rating - tính số lượng trước
        const ratingCount = {
            5: 0,
            4: 0,
            3: 0,
            2: 0,
            1: 0
        };
        allSessionReviews.forEach(r => {
            const rating = r.ptRating;
            if (rating && ratingCount.hasOwnProperty(rating)) {
                ratingCount[rating]++;
            }
        });

        // Convert sang phần trăm
        const totalReviews = allSessionReviews.length;
        const ratingDistribution = {
            5: totalReviews > 0 ? Math.round((ratingCount[5] / totalReviews) * 100) : 0,
            4: totalReviews > 0 ? Math.round((ratingCount[4] / totalReviews) * 100) : 0,
            3: totalReviews > 0 ? Math.round((ratingCount[3] / totalReviews) * 100) : 0,
            2: totalReviews > 0 ? Math.round((ratingCount[2] / totalReviews) * 100) : 0,
            1: totalReviews > 0 ? Math.round((ratingCount[1] / totalReviews) * 100) : 0
        };

        console.log('[getPTReviews] Rating distribution:', ratingDistribution);

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
                    totalReviews: allSessionReviews.length,
                    ratingDistribution
                }
            }
        });
    } catch (err) {
        console.error('Error in getPTReviews:', err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

// Lấy tất cả đánh giá của một hội viên cho PT này
exports.getStudentReviews = async (req, res) => {
    try {
        const ptId = req.user.id;
        const { hoiVienId } = req.params;

        const mongoose = require('mongoose');
        const ptObjectId = mongoose.Types.ObjectId.isValid(ptId)
            ? new mongoose.Types.ObjectId(ptId)
            : ptId;
        const hoiVienObjectId = mongoose.Types.ObjectId.isValid(hoiVienId)
            ? new mongoose.Types.ObjectId(hoiVienId)
            : hoiVienId;

        // Lấy tất cả buổi tập của PT
        const buoiTaps = await BuoiTap.find({
            ptPhuTrach: ptObjectId
        })
            .select('_id')
            .lean();

        const buoiTapIds = buoiTaps.map(bt => bt._id);

        if (buoiTapIds.length === 0) {
            return res.json({
                success: true,
                data: {
                    reviews: [],
                    studentInfo: null
                }
            });
        }

        // Lấy tất cả reviews của hội viên này cho các buổi tập của PT
        const sessionReviews = await SessionReview.find({
            buoiTapId: { $in: buoiTapIds },
            hoiVienId: hoiVienObjectId,
            ptRating: { $ne: null, $exists: true }
        })
            .populate('buoiTapId', 'tenBuoiTap ngayTap gioBatDau gioKetThuc')
            .populate('hoiVienId', 'hoTen anhDaiDien sdt')
            .sort({ ngayTao: -1 })
            .lean();

        // Format reviews
        const reviews = sessionReviews.map(sr => ({
            _id: sr._id,
            rating: sr.ptRating,
            comment: sr.ptComment || '',
            buoiTap: sr.buoiTapId ? {
                _id: sr.buoiTapId._id,
                tenBuoiTap: sr.buoiTapId.tenBuoiTap,
                ngayTap: sr.buoiTapId.ngayTap,
                gioBatDau: sr.buoiTapId.gioBatDau,
                gioKetThuc: sr.buoiTapId.gioKetThuc
            } : null,
            createdAt: sr.ngayTao || sr.createdAt,
            updatedAt: sr.ngayCapNhat || sr.updatedAt
        }));

        // Thông tin hội viên
        const studentInfo = sessionReviews.length > 0 && sessionReviews[0].hoiVienId
            ? {
                _id: sessionReviews[0].hoiVienId._id,
                hoTen: sessionReviews[0].hoiVienId.hoTen,
                anhDaiDien: sessionReviews[0].hoiVienId.anhDaiDien,
                sdt: sessionReviews[0].hoiVienId.sdt
            }
            : null;

        // Tính rating trung bình
        const avgRating = reviews.length > 0
            ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
            : 0;

        res.json({
            success: true,
            data: {
                reviews,
                studentInfo,
                summary: {
                    totalReviews: reviews.length,
                    avgRating: parseFloat(avgRating)
                }
            }
        });
    } catch (err) {
        console.error('Error in getStudentReviews:', err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

