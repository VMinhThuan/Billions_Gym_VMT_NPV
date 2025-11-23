const { PT } = require('../models/NguoiDung');

// Lấy profile PT
exports.getPTProfile = async (req, res) => {
    try {
        const ptId = req.user.id;

        const pt = await PT.findById(ptId)
            .populate('chinhanh', 'tenChiNhanh')
            .select('-__v');

        if (!pt) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin PT'
            });
        }

        res.json({
            success: true,
            data: pt
        });
    } catch (err) {
        console.error('Error in getPTProfile:', err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

// Cập nhật profile PT
exports.updatePTProfile = async (req, res) => {
    try {
        const ptId = req.user.id;
        const updateData = req.body;

        // Chỉ cho phép cập nhật một số field
        const allowedFields = [
            'moTa',
            'chuyenMon',
            'bangCapChungChi',
            'anhDaiDien'
        ];

        const filteredData = {};
        Object.keys(updateData).forEach(key => {
            if (allowedFields.includes(key)) {
                filteredData[key] = updateData[key];
            }
        });

        const pt = await PT.findByIdAndUpdate(
            ptId,
            { $set: filteredData },
            { new: true, runValidators: true }
        )
            .populate('chinhanh', 'tenChiNhanh');

        if (!pt) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin PT'
            });
        }

        res.json({
            success: true,
            message: 'Cập nhật profile thành công',
            data: pt
        });
    } catch (err) {
        console.error('Error in updatePTProfile:', err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

