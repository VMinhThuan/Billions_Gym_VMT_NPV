const TaiKhoan = require('../models/TaiKhoan');
const { NguoiDung } = require('../models/NguoiDung');
const OTP = require('../models/OTP');
const bcrypt = require('bcryptjs');
const twilio = require('twilio');
const mongoose = require('mongoose');

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const findTaiKhoanBySdt = async (sdt) => {
    try {
        // Sử dụng lean() để trả về plain JavaScript object, không phải Mongoose document
        // Điều này giúp cải thiện hiệu suất
        return await TaiKhoan.findOne({ sdt }).lean();
    } catch (error) {
        console.error('Error finding TaiKhoan by sdt:', error);
        throw error;
    }
};

const findNguoiDungById = async (id) => {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('ID người dùng không hợp lệ');
    }
    return NguoiDung.findById(id).populate('hangHoiVien');
};

const guiOTPQuenMatKhau = async (sdt) => {
    try {
        const taiKhoan = await TaiKhoan.findOne({ sdt });

        if (!taiKhoan) {
            throw new Error('Số điện thoại chưa được đăng ký.');
        }

        // Kiểm tra rate limiting - cho phép gửi OTP mỗi 60 giây
        const recentOTP = await OTP.findOne({
            sdt,
            createdAt: { $gte: new Date(Date.now() - 60000) }
        });

        if (recentOTP) {
            throw new Error('Vui lòng đợi 60 giây trước khi yêu cầu mã OTP mới.');
        }

        // Xóa các OTP cũ của số điện thoại này 
        await OTP.deleteMany({ sdt });

        // Tạo mã OTP mới (6 chữ số)
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Lưu OTP vào database
        const otpRecord = await OTP.create({ sdt, otp });

        // Gửi SMS qua Twilio
        let smsSuccess = false;
        let messageSid = null;

        try {
            if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
                throw new Error('Cấu hình Twilio chưa đầy đủ. Vui lòng kiểm tra biến môi trường.');
            }

            // Format số điện thoại
            let sdtQuocTe = sdt;
            if (sdt.startsWith('0')) {
                sdtQuocTe = `+84${sdt.substring(1)}`;
            } else if (!sdt.startsWith('+')) {
                sdtQuocTe = `+84${sdt}`;
            }

            if (!/^\+84[0-9]{9}$/.test(sdtQuocTe)) {
                throw new Error('Số điện thoại không đúng định dạng Việt Nam.');
            }

            try {
                const account = await twilioClient.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
            } catch (connectionError) {
                throw new Error('Không thể kết nối đến Twilio. Vui lòng kiểm tra cấu hình.');
            }

            const message = await twilioClient.messages.create({
                body: `[BILLIONS GYM] Mã OTP của bạn là: ${otp}. Mã có hiệu lực trong 5 phút. Không chia sẻ mã này với ai.`,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: sdtQuocTe
            });

            messageSid = message.sid;
            smsSuccess = true;

        } catch (twilioError) {
            // Xử lý các lỗi cụ thể của Twilio
            if (twilioError.code === 21211) {
                throw new Error('Số điện thoại không hợp lệ.');
            } else if (twilioError.code === 21614) {
                throw new Error('Số điện thoại không hỗ trợ tin nhắn SMS.');
            } else if (twilioError.code === 63007) {
                throw new Error('Số điện thoại đã bị chặn bởi Twilio.');
            }

            if (process.env.NODE_ENV === 'development') {
                smsSuccess = true;
            } else {
                throw new Error(`Không thể gửi tin nhắn SMS: ${twilioError.message}`);
            }
        }

        if (smsSuccess) {
            return {
                success: true,
                message: 'Mã OTP đã được gửi thành công đến số điện thoại của bạn.',
                phoneNumber: sdt,
                otpLength: 6,
                expiresIn: '5 phút',
                messageSid: messageSid
            };
        } else {
            throw new Error('Không thể gửi mã OTP. Vui lòng thử lại sau.');
        }

    } catch (error) {
        throw error;
    }
};

const xacThucOTP = async (sdt, otp) => {
    // Kiểm tra format OTP
    if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
        throw new Error('Mã OTP phải có 6 chữ số.');
    }

    const otpRecord = await OTP.findOne({ sdt, otp });

    if (!otpRecord) {
        throw new Error('Mã OTP không hợp lệ hoặc đã hết hạn.');
    }
    // Kiểm tra thời gian hết hạn 
    const now = new Date();
    const otpAge = now - otpRecord.createdAt;
    const maxAge = 5 * 60 * 1000;

    if (otpAge > maxAge) {
        await OTP.deleteOne({ _id: otpRecord._id });
        throw new Error('Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.');
    }
    return {
        success: true,
        message: 'Xác thực OTP thành công.',
        phoneNumber: sdt,
        expiresAt: new Date(otpRecord.createdAt.getTime() + maxAge)
    };
};

const datLaiMatKhauVoiOTP = async (sdt, otp, matKhauMoi) => {
    try {
        // Kiểm tra format mật khẩu mới
        if (!matKhauMoi || matKhauMoi.length < 6) {
            throw new Error('Mật khẩu mới phải có ít nhất 6 ký tự.');
        }
        const otpRecord = await OTP.findOne({ sdt, otp });

        if (!otpRecord) {
            throw new Error('Mã OTP không hợp lệ hoặc đã hết hạn.');
        }
        // Kiểm tra thời gian hết hạn OTP
        const now = new Date();
        const otpAge = now - otpRecord.createdAt;
        const maxAge = 5 * 60 * 1000; // 5 phút

        if (otpAge > maxAge) {
            await OTP.deleteOne({ _id: otpRecord._id });
            throw new Error('Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.');
        }
        // Tìm tài khoản
        const taiKhoan = await TaiKhoan.findOne({ sdt });
        if (!taiKhoan) {
            throw new Error('Không tìm thấy tài khoản.');
        }

        const isSamePassword = await bcrypt.compare(matKhauMoi, taiKhoan.matKhau);
        if (isSamePassword) {
            throw new Error('Mật khẩu mới phải khác mật khẩu hiện tại.');
        }

        // Băm mật khẩu mới
        const salt = await bcrypt.genSalt(12);
        taiKhoan.matKhau = await bcrypt.hash(matKhauMoi, salt);
        await taiKhoan.save();

        // Xóa OTP đã sử dụng
        await OTP.deleteOne({ _id: otpRecord._id });

        return {
            success: true,
            message: 'Mật khẩu đã được đặt lại thành công.',
            phoneNumber: sdt
        };

    } catch (error) {
        throw error;
    }
};

const findTaiKhoanByUserId = async (userId) => {
    const taiKhoan = await TaiKhoan.findOne({ nguoiDung: userId });
    return taiKhoan;
};

const updatePassword = async (taiKhoanId, hashedPassword) => {
    const result = await TaiKhoan.findByIdAndUpdate(taiKhoanId, { matKhau: hashedPassword });
    return result;
};

module.exports = {
    findTaiKhoanBySdt,
    findNguoiDungById,
    guiOTPQuenMatKhau,
    xacThucOTP,
    datLaiMatKhauVoiOTP,
    findTaiKhoanByUserId,
    updatePassword
};
