const Template = require('../models/TemplateBuoiTap');
const Session = require('../models/Session');
const { PT } = require('../models/NguoiDung');

exports.list = async (req, res) => {
    try {
        const { doKho, loai } = req.query;
        const q = {};
        if (doKho) q.doKho = doKho;
        if (loai) q.loai = loai;
        const items = await Template.find(q).sort({ ten: 1 });
        res.json(items);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.detail = async (req, res) => {
    try {
        const item = await Template.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Không tìm thấy template' });
        res.json(item);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Tạo session từ template
exports.createSessionFromTemplate = async (req, res) => {
    try {
        const { templateId, chiNhanh, ptPhuTrach, ngay, gioBatDau, gioKetThuc, soLuongToiDa } = req.body;
        const tpl = await Template.findById(templateId);
        if (!tpl) return res.status(404).json({ message: 'Không tìm thấy template' });
        const pt = await PT.findById(ptPhuTrach);
        if (!pt) return res.status(400).json({ message: 'PT không tồn tại' });
        if (String(pt.chinhanh) !== String(chiNhanh)) return res.status(400).json({ message: 'PT không thuộc chi nhánh' });

        const payload = {
            chiNhanh,
            ptPhuTrach,
            ngay,
            gioBatDau,
            gioKetThuc,
            taiLieuBaiTap: tpl.baiTap || [],
            hinhAnh: tpl.hinhAnh,
            doKho: tpl.doKho,
            soLuongToiDa: soLuongToiDa || 20,
        };
        const session = await Session.create(payload);
        res.status(201).json(session);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};


