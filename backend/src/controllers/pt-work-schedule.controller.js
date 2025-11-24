const LichLamViecPT = require('../models/LichLamViecPT');

// Lấy lịch làm việc của PT
exports.getWorkSchedule = async (req, res) => {
    try {
        const ptId = req.user.id;

        const schedules = await LichLamViecPT.find({ pt: ptId })
            .sort({ thu: 1 });

        res.json({
            success: true,
            data: schedules
        });
    } catch (err) {
        console.error('Error in getWorkSchedule:', err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

// Tạo hoặc cập nhật lịch làm việc
exports.updateWorkSchedule = async (req, res) => {
    try {
        const ptId = req.user.id;
        const { thu, gioLamViec, ghiChu } = req.body;

        if (!thu || !gioLamViec || !Array.isArray(gioLamViec)) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin lịch làm việc'
            });
        }

        // Tìm hoặc tạo lịch làm việc
        let schedule = await LichLamViecPT.findOne({
            pt: ptId,
            thu: thu
        });

        if (schedule) {
            schedule.gioLamViec = gioLamViec;
            schedule.ghiChu = ghiChu || '';
            await schedule.save();
        } else {
            schedule = await LichLamViecPT.create({
                pt: ptId,
                thu: thu,
                gioLamViec: gioLamViec,
                ghiChu: ghiChu || ''
            });
        }

        res.json({
            success: true,
            message: 'Cập nhật lịch làm việc thành công',
            data: schedule
        });
    } catch (err) {
        console.error('Error in updateWorkSchedule:', err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

// Xóa lịch làm việc
exports.deleteWorkSchedule = async (req, res) => {
    try {
        const ptId = req.user.id;
        const { thu } = req.params;

        const schedule = await LichLamViecPT.findOneAndDelete({
            pt: ptId,
            thu: thu
        });

        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy lịch làm việc'
            });
        }

        res.json({
            success: true,
            message: 'Xóa lịch làm việc thành công'
        });
    } catch (err) {
        console.error('Error in deleteWorkSchedule:', err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

