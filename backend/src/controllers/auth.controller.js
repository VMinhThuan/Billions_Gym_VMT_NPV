const authService = require('../services/auth.service');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const TaiKhoan = require('../models/TaiKhoan');
const { NguoiDung } = require('../models/NguoiDung');

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
        if (!taiKhoan) {
            return res.status(401).json({ message: 'Số điện thoại hoặc mật khẩu không đúng.' });
        }

        if (taiKhoan.trangThaiTK === 'DA_KHOA') {
            return res.status(403).json({ message: 'Tài khoản đã bị khóa, vui lòng liên hệ quản trị viên.' });
        }

        const isMatch = await bcrypt.compare(matKhau, taiKhoan.matKhau);
        if (!isMatch) {
            return res.status(401).json({ message: 'Số điện thoại hoặc mật khẩu không đúng.' });
        }

        const nguoiDung = await authService.findNguoiDungById(taiKhoan.nguoiDung);
        if (!nguoiDung) return res.status(401).json({ message: 'Không tìm thấy người dùng' });

        if (!nguoiDung._id) {
            return res.status(500).json({ message: 'Lỗi dữ liệu người dùng' });
        }

        if (!mongoose.Types.ObjectId.isValid(nguoiDung._id)) {
            return res.status(500).json({ message: 'Lỗi dữ liệu người dùng' });
        }

        const token = jwt.sign({ id: nguoiDung._id.toString(), vaiTro: nguoiDung.vaiTro, sdt: taiKhoan.sdt }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRATION || '1h' });
        res.json({ token, nguoiDung });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
};

exports.forgotPassword = async (req, res) => {
    const { sdt } = req.body;
    if (!sdt) {
        return res.status(400).json({
            success: false,
            message: 'Vui lòng nhập số điện thoại.'
        });
    }

    try {
        const result = await authService.guiOTPQuenMatKhau(sdt);
        res.status(200).json({
            success: true,
            message: result.message
        });
    } catch (err) {
        if (err.message.includes('Số điện thoại chưa được đăng ký')) {
            return res.status(404).json({
                success: false,
                message: 'Số điện thoại này chưa được đăng ký trong hệ thống.',
                errorCode: 'PHONE_NOT_REGISTERED'
            });
        }

        if (err.message.includes('Twilio') || err.message.includes('SMS') || err.message.includes('cấu hình')) {
            return res.status(500).json({
                success: false,
                message: 'Không thể gửi tin nhắn OTP. Vui lòng thử lại sau.',
                errorCode: 'SMS_SEND_FAILED'
            });
        }

        if (err.message.includes('Số điện thoại không đúng định dạng')) {
            return res.status(400).json({
                success: false,
                message: 'Số điện thoại không đúng định dạng Việt Nam.',
                errorCode: 'INVALID_PHONE_FORMAT'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra. Vui lòng thử lại sau.',
            errorCode: 'INTERNAL_ERROR'
        });
    }
};

exports.verifyOtp = async (req, res) => {
    const { sdt, otp } = req.body;
    if (!sdt || !otp) {
        return res.status(400).json({
            success: false,
            message: 'Vui lòng cung cấp đầy đủ thông tin.'
        });
    }

    try {
        const result = await authService.xacThucOTP(sdt, otp);
        res.status(200).json({
            success: true,
            message: result.message
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message,
            errorCode: 'INVALID_OTP'
        });
    }
};

exports.resetPassword = async (req, res) => {
    const { sdt, otp, matKhauMoi } = req.body;
    if (!sdt || !otp || !matKhauMoi) {
        return res.status(400).json({
            success: false,
            message: 'Vui lòng cung cấp đầy đủ thông tin.'
        });
    }

    try {
        const result = await authService.datLaiMatKhauVoiOTP(sdt, otp, matKhauMoi);
        res.status(200).json({
            success: true,
            message: result.message
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message,
            errorCode: 'RESET_PASSWORD_FAILED'
        });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập đầy đủ thông tin'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu mới phải có ít nhất 6 ký tự'
            });
        }

        // Tìm tài khoản của người dùng
        const taiKhoan = await authService.findTaiKhoanByUserId(userId);
        if (!taiKhoan) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy tài khoản'
            });
        }

        // Kiểm tra mật khẩu hiện tại
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, taiKhoan.matKhau);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu hiện tại không đúng'
            });
        }

        // Hash mật khẩu mới
        const saltRounds = 10;
        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

        // Cập nhật mật khẩu
        await authService.updatePassword(taiKhoan._id, hashedNewPassword);

        res.json({
            success: true,
            message: 'Mật khẩu đã được thay đổi thành công'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi thay đổi mật khẩu',
            error: error.message
        });
    }
};

// Đăng ký tài khoản hội viên
exports.register = async (req, res) => {
    try {
        const { hoTen, sdt, email, matKhau, vaiTro = 'HoiVien' } = req.body || {};

        if (!hoTen || !sdt || !matKhau) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập họ tên, số điện thoại và mật khẩu.' });
        }

        // Kiểm tra trùng số điện thoại
        const existingAccount = await TaiKhoan.findOne({ sdt });
        if (existingAccount) {
            return res.status(409).json({ success: false, message: 'Số điện thoại đã tồn tại trong hệ thống.' });
        }

        // Kiểm tra trùng người dùng theo số điện thoại
        const existingUser = await NguoiDung.findOne({ sdt });
        if (existingUser) {
            return res.status(409).json({ success: false, message: 'Số điện thoại đã tồn tại trong hệ thống.' });
        }

        // Tạo người dùng
        const nguoiDung = await NguoiDung.create({
            hoTen,
            sdt,
            email: email || undefined,
            gioiTinh: 'Khac',
            vaiTro
        });

        // Băm mật khẩu và tạo tài khoản đăng nhập
        const salt = await bcrypt.genSalt(12);
        const hashed = await bcrypt.hash(matKhau, salt);
        await TaiKhoan.create({ sdt, matKhau: hashed, nguoiDung: nguoiDung._id, trangThaiTK: 'DANG_HOAT_DONG' });

        return res.status(201).json({ success: true, message: 'Đăng ký thành công', nguoiDung });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Lỗi server khi đăng ký', error: error.message });
    }
};