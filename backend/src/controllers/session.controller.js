const Session = require('../models/Session');
const { PT } = require('../models/NguoiDung');

// Helper: kiểm tra PT thuộc chi nhánh
async function assertPTInBranch(ptId, chiNhanhId) {
    const pt = await PT.findById(ptId);
    if (!pt) throw new Error('PT không tồn tại');
    if (!pt.chinhanh || String(pt.chinhanh) !== String(chiNhanhId)) {
        const err = new Error('PT không thuộc chi nhánh này');
        err.code = 400; throw err;
    }
}

exports.create = async (req, res) => {
    try {
        const payload = req.body;
        await assertPTInBranch(payload.ptPhuTrach, payload.chiNhanh);
        const session = await Session.create(payload);
        return res.status(201).json(session);
    } catch (err) {
        return res.status(400).json({ message: err.message || 'Tạo buổi tập thất bại' });
    }
};

// Lấy buổi tập theo tuần (ISO week start monday)
exports.byWeek = async (req, res) => {
    try {
        const { from, to, chiNhanh, pt } = req.query;
        const q = {};
        if (from && to) {
            q.ngay = { $gte: new Date(from), $lte: new Date(to) };
        }
        if (chiNhanh) q.chiNhanh = chiNhanh;
        if (pt) q.ptPhuTrach = pt;
        const data = await Session.find(q).populate('ptPhuTrach', 'hoTen sdt').populate('chiNhanh', 'tenChiNhanh');
        return res.json(data);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// Đăng ký 1 slot (chỉ tăng số lượng - phần lưu danh sách người đăng ký làm sau)
exports.register = async (req, res) => {
    try {
        const { id } = req.params;
        const s = await Session.findById(id);
        if (!s) return res.status(404).json({ message: 'Không tìm thấy buổi tập' });
        if (!s.canRegister()) return res.status(400).json({ message: 'Buổi tập đã hết chỗ hoặc không hoạt động' });
        s.soLuongDaDangKy += 1;
        if (s.soLuongDaDangKy >= s.soLuongToiDa) s.trangThai = 'HET_CHO';
        await s.save();
        return res.json(s);
    } catch (err) {
        return res.status(400).json({ message: err.message });
    }
};

exports.unregister = async (req, res) => {
    try {
        const { id } = req.params;
        const s = await Session.findById(id);
        if (!s) return res.status(404).json({ message: 'Không tìm thấy buổi tập' });
        if (s.soLuongDaDangKy > 0) {
            s.soLuongDaDangKy -= 1;
            if (s.trangThai === 'HET_CHO' && s.soLuongDaDangKy < s.soLuongToiDa) s.trangThai = 'HOAT_DONG';
            await s.save();
        }
        return res.json(s);
    } catch (err) {
        return res.status(400).json({ message: err.message });
    }
};

exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const payload = req.body;
        if (payload.ptPhuTrach && payload.chiNhanh) {
            await assertPTInBranch(payload.ptPhuTrach, payload.chiNhanh);
        }
        const s = await Session.findByIdAndUpdate(id, payload, { new: true });
        return res.json(s);
    } catch (err) {
        return res.status(400).json({ message: err.message });
    }
};

exports.delete = async (req, res) => {
    try {
        const { id } = req.params;
        await Session.findByIdAndDelete(id);
        return res.json({ success: true });
    } catch (err) {
        return res.status(400).json({ message: err.message });
    }
};


