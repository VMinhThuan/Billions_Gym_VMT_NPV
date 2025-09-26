const goiTapService = require('../services/goitap.service');

exports.createGoiTap = async (req, res) => {
    try {
        const goiTap = await goiTapService.createGoiTap(req.body);
        res.status(201).json(goiTap);
    } catch (err) {
        res.status(400).json({ message: 'Tạo gói tập thất bại', error: err.message });
    }
};

exports.getAllGoiTap = async (req, res) => {
    try {
        const ds = await goiTapService.getAllGoiTap();
        res.json(ds);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
};

exports.getGoiTapById = async (req, res) => {
    try {
        const goiTap = await goiTapService.getGoiTapById(req.params.id);
        if (!goiTap) return res.status(404).json({ message: 'Không tìm thấy gói tập' });
        res.json(goiTap);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
};

exports.updateGoiTap = async (req, res) => {
    try {
        const goiTap = await goiTapService.updateGoiTap(req.params.id, req.body);
        if (!goiTap) return res.status(404).json({ message: 'Không tìm thấy gói tập' });
        res.json(goiTap);
    } catch (err) {
        res.status(400).json({ message: 'Cập nhật thất bại', error: err.message });
    }
};

exports.deleteGoiTap = async (req, res) => {
    try {
        const result = await goiTapService.deleteGoiTap(req.params.id);
        if (!result) return res.status(404).json({ message: 'Không tìm thấy gói tập' });
        if (result.kichHoat === false) {
            return res.json({ message: 'Gói tập đã được ngừng kích hoạt (ẩn)', goiTap: result });
        }
        res.json({ message: 'Xóa gói tập thành công' });
    } catch (err) {
        res.status(400).json({ message: 'Xóa thất bại', error: err.message });
    }
};

// Get monthly packages only
exports.getMonthlyPackages = async (req, res) => {
    try {
        const monthlyPackages = await goiTapService.getMonthlyPackages();
        res.json(monthlyPackages);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
};

// Get packages by time unit
exports.getPackagesByTimeUnit = async (req, res) => {
    try {
        const { donViThoiHan } = req.params;
        const packages = await goiTapService.getPackagesByTimeUnit(donViThoiHan);
        res.json(packages);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
};

// Get packages by type
exports.getPackagesByType = async (req, res) => {
    try {
        const { loaiGoiTap } = req.params;
        const packages = await goiTapService.getPackagesByType(loaiGoiTap);
        res.json(packages);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
};

// Get popular packages
exports.getPopularPackages = async (req, res) => {
    try {
        const packages = await goiTapService.getPopularPackages();
        res.json(packages);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
};

// Get permanent packages
exports.getPermanentPackages = async (req, res) => {
    try {
        const packages = await goiTapService.getPermanentPackages();
        res.json(packages);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
};

// Get time-based packages
exports.getTimeBasedPackages = async (req, res) => {
    try {
        const packages = await goiTapService.getTimeBasedPackages();
        res.json(packages);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
};