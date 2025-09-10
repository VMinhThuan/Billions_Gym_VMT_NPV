const authService = require('../services/auth.service');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
    if (!req.body || (!req.body.sdt && !req.body.matKhau)) {
        return res.status(400).json({ message: 'Vui lòng nhập số điện thoại và mật khẩu.' });
    }
    if (!req.body.sdt) {
        return res.status(400).json({ message: 'Vui lòng nhập số điện thoại.' });
    }
    if (!req.body.matKhau) {
        return res.status(400).json({ message: 'Vui lòng nhập mật khẩu.' });
    }
    const { sdt, matKhau } = req.body;

    try {
        const taiKhoan = await authService.findTaiKhoanBySdt(sdt);
        if (!taiKhoan) return res.status(401).json({ message: 'Sai tài khoản hoặc mật khẩu' });

        if (taiKhoan.trangThaiTK === 'DA_KHOA') {
            return res.status(403).json({ message: 'Tài khoản đã bị khóa, vui lòng liên hệ quản trị viên.' });
        }

        const isMatch = await bcrypt.compare(matKhau, taiKhoan.matKhau);
        if (!isMatch) return res.status(401).json({ message: 'Sai tài khoản hoặc mật khẩu' });

        const nguoiDung = await authService.findNguoiDungById(taiKhoan.nguoiDung);
        if (!nguoiDung) return res.status(401).json({ message: 'Không tìm thấy người dùng' });

        const token = jwt.sign({ id: nguoiDung._id, vaiTro: nguoiDung.vaiTro, sdt: taiKhoan.sdt }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRATION || '1h' });
        res.json({ token, nguoiDung });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
};
