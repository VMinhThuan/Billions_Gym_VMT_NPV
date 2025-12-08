const SessionReview = require('../models/SessionReview');
const CheckInRecord = require('../models/CheckInRecord');
const BuoiTap = require('../models/BuoiTap');

// Tạo hoặc cập nhật đánh giá buổi tập
exports.createOrUpdateReview = async (req, res) => {
    try {
        const hoiVienId = req.user.id;
        const { checkInRecordId, ptRating, ptComment, branchRating, branchComment } = req.body;

        // Validate input
        if (!checkInRecordId) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp ID bản ghi check-in'
            });
        }

        // Kiểm tra check-in record có tồn tại và thuộc về hội viên này không
        const checkInRecord = await CheckInRecord.findById(checkInRecordId)
            .populate('buoiTap', 'ptPhuTrach chiNhanh');

        if (!checkInRecord) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bản ghi check-in'
            });
        }

        if (checkInRecord.hoiVien.toString() !== hoiVienId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền đánh giá buổi tập này'
            });
        }

        // Kiểm tra đã check-out chưa
        if (!checkInRecord.checkOutTime) {
            return res.status(400).json({
                success: false,
                message: 'Chỉ có thể đánh giá sau khi check-out'
            });
        }

        const buoiTapId = checkInRecord.buoiTap._id;

        // Tìm hoặc tạo review
        let review = await SessionReview.findOne({
            buoiTapId: buoiTapId,
            hoiVienId: hoiVienId
        });

        if (review) {
            // Cập nhật review hiện có
            if (ptRating !== undefined && ptRating !== null) {
                review.ptRating = ptRating;
            }
            if (ptComment !== undefined) {
                review.ptComment = ptComment || '';
            }
            if (branchRating !== undefined && branchRating !== null) {
                review.branchRating = branchRating;
            }
            if (branchComment !== undefined) {
                review.branchComment = branchComment || '';
            }
        } else {
            // Tạo review mới
            review = new SessionReview({
                buoiTapId: buoiTapId,
                hoiVienId: hoiVienId,
                checkInRecordId: checkInRecordId,
                ptRating: ptRating || null,
                ptComment: ptComment || '',
                branchRating: branchRating || null,
                branchComment: branchComment || ''
            });
        }

        await review.save();

        res.status(200).json({
            success: true,
            message: 'Đánh giá đã được lưu thành công',
            data: review
        });
    } catch (error) {
        console.error('Error in createOrUpdateReview:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lưu đánh giá',
            error: error.message
        });
    }
};

// Lấy đánh giá của một buổi tập
exports.getReviewByCheckInRecord = async (req, res) => {
    try {
        const hoiVienId = req.user.id;
        const { checkInRecordId } = req.params;

        const checkInRecord = await CheckInRecord.findById(checkInRecordId);

        if (!checkInRecord) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bản ghi check-in'
            });
        }

        if (checkInRecord.hoiVien.toString() !== hoiVienId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền xem đánh giá này'
            });
        }

        const review = await SessionReview.findOne({
            checkInRecordId: checkInRecordId,
            hoiVienId: hoiVienId
        })
            .populate('buoiTapId', 'tenBuoiTap ptPhuTrach chiNhanh')
            .populate('buoiTapId.ptPhuTrach', 'hoTen')
            .populate('buoiTapId.chiNhanh', 'tenChiNhanh');

        res.status(200).json({
            success: true,
            data: review || null
        });
    } catch (error) {
        console.error('Error in getReviewByCheckInRecord:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy đánh giá',
            error: error.message
        });
    }
};

// Lấy danh sách đánh giá chưa hoàn thành của hội viên
exports.getPendingReviews = async (req, res) => {
    try {
        const hoiVienId = req.user.id;

        const pendingReviews = await SessionReview.find({
            hoiVienId: hoiVienId,
            isCompleted: false
        })
            .populate('buoiTapId', 'tenBuoiTap ngayTap gioBatDau gioKetThuc ptPhuTrach chiNhanh')
            .populate('checkInRecordId', 'checkInTime checkOutTime')
            .sort({ ngayTao: -1 });

        res.status(200).json({
            success: true,
            data: pendingReviews
        });
    } catch (error) {
        console.error('Error in getPendingReviews:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy danh sách đánh giá',
            error: error.message
        });
    }
};

