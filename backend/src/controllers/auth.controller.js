const authService = require('../services/auth.service');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

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
            return res.status(401).json({ message: 'Đăng nhập thất bại' });
        }

        if (taiKhoan.trangThaiTK === 'DA_KHOA') {
            return res.status(403).json({ message: 'Tài khoản đã bị khóa, vui lòng liên hệ quản trị viên.' });
        }

        const isMatch = await bcrypt.compare(matKhau, taiKhoan.matKhau);
        if (!isMatch) {
            return res.status(401).json({ message: 'Đăng nhập thất bại' });
        }

        const nguoiDung = await authService.findNguoiDungById(taiKhoan.nguoiDung);
        if (!nguoiDung) return res.status(401).json({ message: 'Không tìm thấy người dùng' });

        // Validate nguoiDung._id
        if (!nguoiDung._id) {
            console.error('No _id found in nguoiDung:', nguoiDung);
            return res.status(500).json({ message: 'Lỗi dữ liệu người dùng' });
        }

        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(nguoiDung._id)) {
            console.error('Invalid ObjectId in nguoiDung._id:', nguoiDung._id);
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
        // Trả về thông báo cụ thể cho từng loại lỗi
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

// Debug endpoint để kiểm tra cấu hình Twilio
exports.debugTwilio = async (req, res) => {
    try {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN ? 'Hidden' : 'Not set';
        const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

        // Test Twilio connection
        const twilio = require('twilio');
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

        try {
            const account = await client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();

            res.json({
                status: 'success',
                twilioAccountStatus: account.status,
                configuredPhoneNumber: phoneNumber,
                accountSid: accountSid
            });
        } catch (twilioError) {
            res.status(500).json({
                status: 'error',
                message: 'Twilio connection failed',
                error: twilioError.message
            });
        }

    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Debug failed',
            error: error.message
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

        // Find user's account
        const taiKhoan = await authService.findTaiKhoanByUserId(userId);
        if (!taiKhoan) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy tài khoản'
            });
        }

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, taiKhoan.matKhau);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu hiện tại không đúng'
            });
        }

        // Hash new password
        const saltRounds = 10;
        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update password
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