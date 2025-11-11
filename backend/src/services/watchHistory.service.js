const WatchHistory = require('../models/WatchHistory');

class WatchHistoryService {
    /**
     * Lấy tiến độ xem của user cho tất cả templates
     * @param {String} userId - ID của người dùng
     * @returns {Object} - Object chứa tiến độ { templateId: [exerciseId1, exerciseId2, ...] }
     */
    async getUserWatchProgress(userId) {
        const histories = await WatchHistory.find({ nguoiDung: userId })
            .select('template baiTapDaXem')
            .lean();

        // Format: { templateId: [exerciseId1, exerciseId2, ...] }
        const progress = {};
        histories.forEach(h => {
            progress[h.template.toString()] = h.baiTapDaXem.map(id => id.toString());
        });

        return progress;
    }

    /**
     * Lấy tiến độ xem của user cho 1 template cụ thể
     * @param {String} userId - ID của người dùng
     * @param {String} templateId - ID của template
     * @returns {Object|null} - Watch history hoặc null
     */
    async getTemplateWatchHistory(userId, templateId) {
        return await WatchHistory.findOne({
            nguoiDung: userId,
            template: templateId
        }).lean();
    }

    /**
     * Đánh dấu bài tập đã xem
     * @param {String} userId - ID của người dùng
     * @param {String} templateId - ID của template
     * @param {String} exerciseId - ID của bài tập
     * @returns {Object} - Watch history đã cập nhật
     */
    async markExerciseAsWatched(userId, templateId, exerciseId) {
        // Tìm hoặc tạo watch history
        let history = await WatchHistory.findOne({
            nguoiDung: userId,
            template: templateId
        });

        if (!history) {
            history = new WatchHistory({
                nguoiDung: userId,
                template: templateId,
                baiTapDaXem: []
            });
        }

        // Thêm exercise vào danh sách đã xem (nếu chưa có)
        if (!history.baiTapDaXem.includes(exerciseId)) {
            history.baiTapDaXem.push(exerciseId);
        }

        history.lanXemCuoi = new Date();
        await history.save();

        return history;
    }

    /**
     * Đánh dấu nhiều bài tập đã xem cùng lúc
     * @param {String} userId - ID của người dùng
     * @param {String} templateId - ID của template
     * @param {Array} exerciseIds - Mảng các exercise IDs
     * @returns {Object} - Watch history đã cập nhật
     */
    async markMultipleExercisesAsWatched(userId, templateId, exerciseIds) {
        let history = await WatchHistory.findOne({
            nguoiDung: userId,
            template: templateId
        });

        if (!history) {
            history = new WatchHistory({
                nguoiDung: userId,
                template: templateId,
                baiTapDaXem: []
            });
        }

        // Thêm tất cả exercises chưa có vào danh sách
        exerciseIds.forEach(exerciseId => {
            if (!history.baiTapDaXem.includes(exerciseId)) {
                history.baiTapDaXem.push(exerciseId);
            }
        });

        history.lanXemCuoi = new Date();
        await history.save();

        return history;
    }

    /**
     * Reset tiến độ xem cho 1 template cụ thể
     * @param {String} userId - ID của người dùng
     * @param {String} templateId - ID của template
     * @returns {Boolean} - true nếu xóa thành công
     */
    async resetTemplateProgress(userId, templateId) {
        const result = await WatchHistory.findOneAndDelete({
            nguoiDung: userId,
            template: templateId
        });

        return !!result;
    }

    /**
     * Reset tất cả tiến độ xem của user
     * @param {String} userId - ID của người dùng
     * @returns {Number} - Số lượng records đã xóa
     */
    async resetAllUserProgress(userId) {
        const result = await WatchHistory.deleteMany({ nguoiDung: userId });
        return result.deletedCount;
    }

    /**
     * Lấy thống kê tiến độ xem
     * @param {String} userId - ID của người dùng
     * @returns {Object} - Thống kê { totalTemplates, totalWatched, averageProgress }
     */
    async getUserWatchStats(userId) {
        const histories = await WatchHistory.find({ nguoiDung: userId })
            .populate('template', 'ten baiTap')
            .lean();

        const stats = {
            totalTemplates: histories.length,
            totalVideosWatched: 0,
            templatesProgress: []
        };

        histories.forEach(h => {
            const totalVideos = h.template?.baiTap?.length || 0;
            const watchedCount = h.baiTapDaXem.length;
            const progress = totalVideos > 0 ? Math.round((watchedCount / totalVideos) * 100) : 0;

            stats.totalVideosWatched += watchedCount;
            stats.templatesProgress.push({
                templateId: h.template._id,
                templateName: h.template.ten,
                watchedCount,
                totalVideos,
                progress,
                lastWatched: h.lanXemCuoi
            });
        });

        return stats;
    }
}

module.exports = new WatchHistoryService();
