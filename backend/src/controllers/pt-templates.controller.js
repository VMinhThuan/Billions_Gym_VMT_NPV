const TemplateBuoiTap = require('../models/TemplateBuoiTap');

const DEFAULT_TEMPLATES = [
    { ten: 'Boxing Cardio', caloTieuHao: 550, moTa: 'Cardio cường độ cao với boxing & footwork.', doKho: 'TRUNG_BINH' },
    { ten: 'Advanced Full Body', caloTieuHao: 600, moTa: 'Full body nâng cao, tạ + plyo.', doKho: 'KHO' },
    { ten: 'Core Focus', caloTieuHao: 400, moTa: 'Core & stability, plank/anti-rotation.', doKho: 'TRUNG_BINH' },
    { ten: 'Shoulders and Abs', caloTieuHao: 420, moTa: 'Vai + core, presses & raises.', doKho: 'TRUNG_BINH' },
    { ten: 'Chest and Triceps', caloTieuHao: 480, moTa: 'Ngực + tay sau, đẩy và isolation.', doKho: 'TRUNG_BINH' },
    { ten: 'Back and Biceps', caloTieuHao: 470, moTa: 'Lưng + tay trước, kéo & hinge.', doKho: 'TRUNG_BINH' },
    { ten: 'Leg Day Intense', caloTieuHao: 650, moTa: 'Chân nặng, squat/hinge/lunge.', doKho: 'KHO' },
    { ten: 'Full Body Beginner', caloTieuHao: 380, moTa: 'Full body cơ bản, bài máy + tạ nhẹ.', doKho: 'DE' },
    { ten: 'Pull Day', caloTieuHao: 450, moTa: 'Ngày kéo: lưng, tay trước.', doKho: 'TRUNG_BINH' },
    { ten: 'Push Day', caloTieuHao: 450, moTa: 'Ngày đẩy: ngực, vai, tay sau.', doKho: 'TRUNG_BINH' },
    { ten: 'Barbell Power', caloTieuHao: 520, moTa: 'Compound với barbell, sức mạnh.', doKho: 'TRUNG_BINH' },
    { ten: 'Dumbbell Strength', caloTieuHao: 480, moTa: 'Tạ đơn, sức mạnh & kiểm soát.', doKho: 'TRUNG_BINH' },
    { ten: 'Bodyweight Circuit', caloTieuHao: 430, moTa: 'Circuit bodyweight, tim mạch + core.', doKho: 'DE' },
    { ten: 'Plyometrics Explosive', caloTieuHao: 600, moTa: 'Nhảy plyo, phát lực, tim mạch cao.', doKho: 'KHO' },
    { ten: 'Yoga Flow', caloTieuHao: 320, moTa: 'Yoga flow, linh hoạt & thở.', doKho: 'DE' },
    { ten: 'Flexibility Mobility', caloTieuHao: 280, moTa: 'Giãn cơ, mobility, phục hồi.', doKho: 'DE' },
    { ten: 'Endurance Cardio', caloTieuHao: 520, moTa: 'Cardio dài, steady-state/interval.', doKho: 'TRUNG_BINH' },
    { ten: 'Upper Body Strength', caloTieuHao: 480, moTa: 'Thân trên, compound + isolation.', doKho: 'TRUNG_BINH' },
    { ten: 'Lower Body Power', caloTieuHao: 550, moTa: 'Thân dưới, power & hypertrophy.', doKho: 'TRUNG_BINH' },
    { ten: 'Cardio HIIT', caloTieuHao: 580, moTa: 'HIIT cardio ngắn, cường độ cao.', doKho: 'KHO' },
];

async function ensureDefaultTemplates() {
    const timeoutPromise = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error('count timeout')), ms));
    const total = await Promise.race([
        TemplateBuoiTap.countDocuments({}).maxTimeMS(4000),
        timeoutPromise(4500)
    ]).catch(() => 0);

    if (total > 0) return;

    // Upsert 20 default templates so PT luôn có bộ mặc định
    await Promise.all(
        DEFAULT_TEMPLATES.map((t) =>
            TemplateBuoiTap.updateOne(
                { ten: t.ten },
                { $set: { ...t } },
                { upsert: true }
            ).maxTimeMS(6000)
        )
    ).catch((err) => {
        console.warn('ensureDefaultTemplates fallback:', err.message);
    });
}

function paginateDefaults(defaults, page, limit) {
    const start = (page - 1) * limit;
    const end = start + limit;
    return {
        templates: defaults.slice(start, end),
        total: defaults.length,
        pages: Math.ceil(defaults.length / limit)
    };
}

// Lấy danh sách template
exports.getTemplates = async (req, res) => {
    try {
        await ensureDefaultTemplates();
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

        const parsedLimit = parseInt(limit, 10);
        const safeLimit = Number.isNaN(parsedLimit) ? 20 : Math.min(Math.max(parsedLimit, 1), 100);
        const parsedPage = parseInt(page, 10);
        const safePage = Number.isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
        const skip = (safePage - 1) * safeLimit;

        const timeoutPromise = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error('Query timeout')), ms));

        let templates = [];
        let total = 0;
        let errored = false;

        try {
            templates = await Promise.race([
                TemplateBuoiTap.find(query)
                    .populate('baiTap', 'tenBaiTap moTa hinhAnh')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(safeLimit)
                    .lean()
                    .maxTimeMS(5000),
                timeoutPromise(6000)
            ]);
        } catch (err) {
            errored = true;
            console.warn('getTemplates fallback due to error:', err.message);
            templates = [];
        }

        if (!errored) {
            total = await Promise.race([
                TemplateBuoiTap.countDocuments(query).maxTimeMS(5000),
                timeoutPromise(5500)
            ]).catch(() => 0);
        }

        // Nếu DB lỗi hoặc timeout, trả bộ mặc định tại backend để FE không bị trắng
        if (errored) {
            const defaultPaged = paginateDefaults(DEFAULT_TEMPLATES, safePage, safeLimit);
            return res.json({
                success: true,
                data: {
                    templates: defaultPaged.templates,
                    pagination: {
                        page: safePage,
                        limit: safeLimit,
                        total: defaultPaged.total,
                        pages: defaultPaged.pages
                    },
                    fallback: true
                }
            });
        }

        res.json({
            success: true,
            data: {
                templates,
                pagination: {
                    page: safePage,
                    limit: safeLimit,
                    total,
                    pages: safeLimit > 0 ? Math.ceil(total / safeLimit) : 0
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

