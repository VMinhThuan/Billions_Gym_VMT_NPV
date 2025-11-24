const TemplateBuoiTap = require('../models/TemplateBuoiTap');

// Lấy danh sách template
exports.getTemplates = async (req, res) => {
    try {
        const { page = 1, limit = 20, search, doKho } = req.query;

        const query = {};
        if (search) {
            query.$or = [
                { ten: { $regex: search, $options: 'i' } },
                { moTa: { $regex: search, $options: 'i' } }
            ];
        }
        if (doKho) {
            query.doKho = doKho;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const templates = await TemplateBuoiTap.find(query)
            .populate('baiTap', 'tenBaiTap moTa hinhAnh')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await TemplateBuoiTap.countDocuments(query);

        res.json({
            success: true,
            data: {
                templates,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            }
        });
    } catch (err) {
        console.error('Error in getTemplates:', err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

// Lấy template theo ID
exports.getTemplateById = async (req, res) => {
    try {
        const { id } = req.params;

        const template = await TemplateBuoiTap.findById(id)
            .populate('baiTap', 'tenBaiTap moTa hinhAnh videoUrl');

        if (!template) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy template'
            });
        }

        res.json({
            success: true,
            data: template
        });
    } catch (err) {
        console.error('Error in getTemplateById:', err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

// Tạo template mới
exports.createTemplate = async (req, res) => {
    try {
        const { ten, moTa, loai, doKho, baiTap, hinhAnh } = req.body;

        if (!ten) {
            return res.status(400).json({
                success: false,
                message: 'Tên template không được để trống'
            });
        }

        const template = await TemplateBuoiTap.create({
            ten,
            moTa: moTa || '',
            loai: loai || '',
            doKho: doKho || 'TRUNG_BINH',
            baiTap: baiTap || [],
            hinhAnh: hinhAnh || ''
        });

        res.status(201).json({
            success: true,
            message: 'Tạo template thành công',
            data: template
        });
    } catch (err) {
        console.error('Error in createTemplate:', err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

// Cập nhật template
exports.updateTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const template = await TemplateBuoiTap.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        )
            .populate('baiTap', 'tenBaiTap moTa hinhAnh');

        if (!template) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy template'
            });
        }

        res.json({
            success: true,
            message: 'Cập nhật template thành công',
            data: template
        });
    } catch (err) {
        console.error('Error in updateTemplate:', err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

// Xóa template
exports.deleteTemplate = async (req, res) => {
    try {
        const { id } = req.params;

        const template = await TemplateBuoiTap.findByIdAndDelete(id);

        if (!template) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy template'
            });
        }

        res.json({
            success: true,
            message: 'Xóa template thành công'
        });
    } catch (err) {
        console.error('Error in deleteTemplate:', err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

