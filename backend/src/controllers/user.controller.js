const userService = require('../services/user.service');

exports.lockTaiKhoan = async (req, res) => {
    try {
        const { id } = req.params;
        const tk = await userService.lockTaiKhoan(id);
        res.json({ message: 'Khóa tài khoản thành công', taiKhoan: tk });
    } catch (err) {
        if (err.message === 'Không tìm thấy tài khoản') {
            return res.status(404).json({ message: err.message });
        }
        res.status(500).json({ message: 'Khóa tài khoản thất bại', error: err.message });
    }
};

exports.unlockTaiKhoan = async (req, res) => {
    try {
        const { id } = req.params;
        const tk = await userService.unlockTaiKhoan(id);
        res.json({ message: 'Mở khóa tài khoản thành công', taiKhoan: tk });
    } catch (err) {
        if (err.message === 'Không tìm thấy tài khoản') {
            return res.status(404).json({ message: err.message });
        }
        res.status(500).json({ message: 'Mở khóa tài khoản thất bại', error: err.message });
    }
};

// Hội Viên
exports.createHoiVien = async (req, res) => {
    try {
        const hoiVien = await userService.createHoiVien(req.body);
        res.status(201).json(hoiVien);
    } catch (err) {
        if (err.code === 400) {
            return res.status(400).json({ message: err.message });
        }
        if (err && err.code === 11000 && typeof err.keyPattern === 'object' && err.keyPattern !== null) {
            if ('email' in err.keyPattern) {
                return res.status(400).json({ message: 'Email đã tồn tại, vui lòng chọn email khác.' });
            }
            if ('sdt' in err.keyPattern) {
                return res.status(400).json({ message: 'Số điện thoại đã tồn tại, vui lòng chọn số khác.' });
            }
        }
        res.status(400).json({ message: 'Tạo hội viên thất bại', error: err.message });
    }
};

exports.getAllHoiVien = async (req, res) => {
    try {
        const hoiViens = await userService.getAllHoiVien();
        res.json(hoiViens);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
};

exports.updateHoiVien = async (req, res) => {
    try {
        const hoiVien = await userService.updateHoiVien(req.params.id, req.body);
        if (!hoiVien) return res.status(404).json({ message: 'Không tìm thấy hội viên' });
        res.json(hoiVien);
    } catch (err) {
        if (err && err.code === 11000 && typeof err.keyPattern === 'object' && err.keyPattern !== null) {
            if ('email' in err.keyPattern) {
                return res.status(400).json({ message: 'Email đã tồn tại, vui lòng chọn email khác.' });
            }
            if ('sdt' in err.keyPattern) {
                return res.status(400).json({ message: 'Số điện thoại đã tồn tại, vui lòng chọn số khác.' });
            }
        }
        res.status(400).json({ message: 'Cập nhật thất bại', error: err.message });
    }
};

exports.deleteHoiVien = async (req, res) => {
    try {
        const hoiVien = await userService.deleteHoiVien(req.params.id);
        if (!hoiVien) return res.status(404).json({ message: 'Không tìm thấy hội viên' });
        res.json({ message: 'Xóa hội viên thành công' });
    } catch (err) {
        res.status(500).json({ message: 'Xóa thất bại', error: err.message });
    }
};

// PT
exports.createPT = async (req, res) => {
    try {
        const pt = await userService.createPT(req.body);
        res.status(201).json(pt);
    } catch (err) {
        if (err.code === 400) {
            return res.status(400).json({ message: err.message });
        }
        if (err && err.code === 11000 && typeof err.keyPattern === 'object' && err.keyPattern !== null) {
            if ('email' in err.keyPattern) {
                return res.status(400).json({ message: 'Email đã tồn tại, vui lòng chọn email khác.' });
            }
            if ('sdt' in err.keyPattern) {
                return res.status(400).json({ message: 'Số điện thoại đã tồn tại, vui lòng chọn số khác.' });
            }
        }
        res.status(400).json({ message: 'Tạo PT thất bại', error: err.message });
    }
};

exports.getAllPT = async (req, res) => {
    try {
        const pts = await userService.getAllPT();
        res.json(pts);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
};

exports.updatePT = async (req, res) => {
    try {
        const pt = await userService.updatePT(req.params.id, req.body);
        if (!pt) return res.status(404).json({ message: 'Không tìm thấy PT' });
        res.json(pt);
    } catch (err) {
        if (err && err.code === 11000 && typeof err.keyPattern === 'object' && err.keyPattern !== null) {
            if ('email' in err.keyPattern) {
                return res.status(400).json({ message: 'Email đã tồn tại, vui lòng chọn email khác.' });
            }
            if ('sdt' in err.keyPattern) {
                return res.status(400).json({ message: 'Số điện thoại đã tồn tại, vui lòng chọn số khác.' });
            }
        }
        res.status(400).json({ message: 'Cập nhật thất bại', error: err.message });
    }
};

exports.deletePT = async (req, res) => {
    try {
        const pt = await userService.deletePT(req.params.id);
        if (!pt) return res.status(404).json({ message: 'Không tìm thấy PT' });
        res.json({ message: 'Xóa PT thành công' });
    } catch (err) {
        res.status(500).json({ message: 'Xóa thất bại', error: err.message });
    }
};
