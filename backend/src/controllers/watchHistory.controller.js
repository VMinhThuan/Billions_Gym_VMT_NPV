const WatchHistory = require('../models/WatchHistory');
const watchHistoryService = require('../services/watchHistory.service');

// Lấy tiến độ xem của user cho tất cả templates
exports.getWatchProgress = async (req, res) => {
    try {
        const userId = req.user._id;

        const progress = await watchHistoryService.getUserWatchProgress(userId);

        res.json({ success: true, data: progress });
    } catch (err) {
        console.error('Error getting watch progress:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Đánh dấu bài tập đã xem
exports.markAsWatched = async (req, res) => {
    try {
        console.log('🎯 markAsWatched called');
        console.log('req.user:', req.user);
        console.log('req.body:', req.body);

        const userId = req.user?._id;

        if (!userId) {
            console.error('❌ User ID not found in request');
            return res.status(401).json({
                success: false,
                message: 'Unauthorized - User not found'
            });
        }

        const { templateId, exerciseId } = req.body;

        if (!templateId || !exerciseId) {
            return res.status(400).json({
                success: false,
                message: 'templateId và exerciseId là bắt buộc'
            });
        }

        const history = await watchHistoryService.markExerciseAsWatched(
            userId,
            templateId,
            exerciseId
        );

        console.log('✅ Marked as watched:', { userId, templateId, exerciseId });

        res.json({
            success: true,
            data: {
                templateId: history.template.toString(),
                watchedCount: history.baiTapDaXem.length
            }
        });
    } catch (err) {
        console.error('❌ Error marking as watched:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Xóa tiến độ xem (reset progress)
exports.resetProgress = async (req, res) => {
    try {
        const userId = req.user._id;
        const { templateId } = req.body;

        let result;
        if (templateId) {
            // Reset progress cho 1 template cụ thể
            result = await watchHistoryService.resetTemplateProgress(userId, templateId);
            const message = result ? 'Đã reset tiến độ xem cho template' : 'Không tìm thấy tiến độ để reset';
            res.json({ success: true, message });
        } else {
            // Reset tất cả progress
            const deletedCount = await watchHistoryService.resetAllUserProgress(userId);
            res.json({
                success: true,
                message: `Đã reset tiến độ xem (${deletedCount} templates)`
            });
        }
    } catch (err) {
        console.error('Error resetting progress:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Lấy thống kê tiến độ xem của user
exports.getWatchStats = async (req, res) => {
    try {
        const userId = req.user._id;

        const stats = await watchHistoryService.getUserWatchStats(userId);

        res.json({ success: true, data: stats });
    } catch (err) {
        console.error('Error getting watch stats:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};
