const PTGoal = require('../models/PTGoal');

// Lấy mục tiêu theo ngày (mặc định hôm nay)
exports.getMyGoals = async (req, res) => {
    try {
        const ptId = req.user.id;
        const { date } = req.query; // yyyy-mm-dd

        const targetDate = date ? new Date(date) : new Date();
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(startOfDay);
        endOfDay.setDate(endOfDay.getDate() + 1);

        const goals = await PTGoal.find({
            pt: ptId,
            date: { $gte: startOfDay, $lt: endOfDay }
        }).sort({ createdAt: 1 });

        res.json({ success: true, data: goals });
    } catch (err) {
        console.error('Error in getMyGoals:', err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

// Tạo mục tiêu mới trong ngày
exports.createGoal = async (req, res) => {
    try {
        const ptId = req.user.id;
        const { title, description, date } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({ success: false, message: 'Tiêu đề mục tiêu không được để trống' });
        }

        const targetDate = date ? new Date(date) : new Date();
        targetDate.setHours(0, 0, 0, 0);

        const goal = await PTGoal.create({
            pt: ptId,
            title: title.trim(),
            description: description?.trim() || '',
            date: targetDate
        });

        res.status(201).json({ success: true, data: goal });
    } catch (err) {
        console.error('Error in createGoal:', err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

// Cập nhật trạng thái mục tiêu
exports.updateGoalStatus = async (req, res) => {
    try {
        const ptId = req.user.id;
        const { id } = req.params;
        const { status } = req.body;

        if (!['PENDING', 'COMPLETED'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
        }

        const goal = await PTGoal.findOneAndUpdate(
            { _id: id, pt: ptId },
            { status },
            { new: true }
        );

        if (!goal) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy mục tiêu' });
        }

        res.json({ success: true, data: goal });
    } catch (err) {
        console.error('Error in updateGoalStatus:', err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

// Xóa mục tiêu
exports.deleteGoal = async (req, res) => {
    try {
        const ptId = req.user.id;
        const { id } = req.params;

        const goal = await PTGoal.findOneAndDelete({ _id: id, pt: ptId });

        if (!goal) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy mục tiêu' });
        }

        res.json({ success: true, message: 'Xóa mục tiêu thành công' });
    } catch (err) {
        console.error('Error in deleteGoal:', err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};


