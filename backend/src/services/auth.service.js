const TaiKhoan = require('../models/TaiKhoan');
const { NguoiDung } = require('../models/NguoiDung');
const OTP = require('../models/OTP');
const bcrypt = require('bcryptjs');
const twilio = require('twilio');
const mongoose = require('mongoose');

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const findTaiKhoanBySdt = async (sdt) => {
    return TaiKhoan.findOne({ sdt });
};

const findNguoiDungById = async (id) => {
    // Validate ObjectId
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('ID người dùng không hợp lệ');
    }
    return NguoiDung.findById(id);
};

const guiOTPQuenMatKhau = async (sdt) => {
    try {
        // Bước 1: Kiểm tra số điện thoại có tồn tại trong hệ thống không
        console.log(`🔍 Checking if phone number exists: ${sdt}`);
        const taiKhoan = await TaiKhoan.findOne({ sdt });

        if (!taiKhoan) {
            console.log(`❌ Phone number not found: ${sdt}`);
            throw new Error('Số điện thoại chưa được đăng ký.');
        }

        console.log(`✅ Phone number found in system: ${sdt}`);

        // Bước 2: Kiểm tra rate limiting - chỉ cho phép gửi OTP mỗi 60 giây
        const recentOTP = await OTP.findOne({
            sdt,
            createdAt: { $gte: new Date(Date.now() - 60000) } // 60 giây
        });

        if (recentOTP) {
            console.log(`⏰ Rate limit: OTP sent too recently for ${sdt}`);
            throw new Error('Vui lòng đợi 60 giây trước khi yêu cầu mã OTP mới.');
        }

        // Bước 3: Xóa các OTP cũ của số điện thoại này (nếu có)
        await OTP.deleteMany({ sdt });
        console.log(`🧹 Cleaned old OTPs for: ${sdt}`);

        // Bước 4: Tạo mã OTP mới (6 chữ số)
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        console.log(`🔢 Generated OTP for ${sdt}: ${otp}`);

        // Bước 5: Lưu OTP vào database
        const otpRecord = await OTP.create({ sdt, otp });
        console.log(`💾 OTP saved to database with ID: ${otpRecord._id}`);

        // Bước 6: Gửi SMS qua Twilio
        let smsSuccess = false;
        let messageSid = null;

        try {
            // Kiểm tra cấu hình Twilio trước khi gửi
            if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
                throw new Error('Cấu hình Twilio chưa đầy đủ. Vui lòng kiểm tra biến môi trường.');
            }

            // Format số điện thoại: 0329982474 -> +84329982474
            let sdtQuocTe = sdt;
            if (sdt.startsWith('0')) {
                sdtQuocTe = `+84${sdt.substring(1)}`;
            } else if (!sdt.startsWith('+')) {
                sdtQuocTe = `+84${sdt}`;
            }

            // Validate số điện thoại
            if (!/^\+84[0-9]{9}$/.test(sdtQuocTe)) {
                throw new Error('Số điện thoại không đúng định dạng Việt Nam.');
            }

            console.log(`📱 Attempting to send SMS to: ${sdtQuocTe}`);
            console.log(`📞 From number: ${process.env.TWILIO_PHONE_NUMBER}`);
            console.log(`🔧 Twilio Account SID: ${process.env.TWILIO_ACCOUNT_SID}`);

            // Test Twilio connection trước khi gửi
            try {
                const account = await twilioClient.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
                console.log(`✅ Twilio account status: ${account.status}`);
            } catch (connectionError) {
                console.error('❌ Twilio connection failed:', connectionError.message);
                throw new Error('Không thể kết nối đến Twilio. Vui lòng kiểm tra cấu hình.');
            }

            const message = await twilioClient.messages.create({
                body: `[BILLIONS GYM] Mã OTP của bạn là: ${otp}. Mã có hiệu lực trong 5 phút. Không chia sẻ mã này với ai.`,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: sdtQuocTe
            });

            messageSid = message.sid;
            console.log(`✅ SMS sent successfully. Message SID: ${messageSid}`);
            smsSuccess = true;

        } catch (twilioError) {
            console.error('❌ Twilio SMS Error:', twilioError.message);
            console.error('❌ Error code:', twilioError.code);
            console.error('❌ Error details:', twilioError);

            // Xử lý các lỗi cụ thể của Twilio
            if (twilioError.code === 21211) {
                throw new Error('Số điện thoại không hợp lệ.');
            } else if (twilioError.code === 21614) {
                throw new Error('Số điện thoại không hỗ trợ tin nhắn SMS.');
            } else if (twilioError.code === 63007) {
                throw new Error('Số điện thoại đã bị chặn bởi Twilio.');
            }

            // Trong môi trường development, vẫn cho phép test mà không cần SMS thật
            if (process.env.NODE_ENV === 'development') {
                console.log(`⚠️  SMS failed in dev mode, but OTP saved: ${otp}`);
                smsSuccess = true; // Giả lập thành công trong dev mode
            } else {
                // Trong production, throw error nếu SMS fail
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
        console.error('❌ OTP Generation Error:', error.message);
        throw error;
    }
};

const xacThucOTP = async (sdt, otp) => {
    console.log(`🔍 Looking for OTP: ${otp} for phone: ${sdt}`);

    // Kiểm tra format OTP
    if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
        throw new Error('Mã OTP phải có 6 chữ số.');
    }

    const otpRecord = await OTP.findOne({ sdt, otp });

    if (!otpRecord) {
        console.log(`❌ OTP not found in database for ${sdt}`);

        // Debug: kiểm tra tất cả OTP cho số điện thoại này
        const allOtpsForPhone = await OTP.find({ sdt });
        console.log(`📋 All OTPs for ${sdt}:`, allOtpsForPhone.map(o => ({ otp: o.otp, createdAt: o.createdAt })));

        throw new Error('Mã OTP không hợp lệ hoặc đã hết hạn.');
    }

    // Kiểm tra thời gian hết hạn (5 phút)
    const now = new Date();
    const otpAge = now - otpRecord.createdAt;
    const maxAge = 5 * 60 * 1000; // 5 phút

    if (otpAge > maxAge) {
        console.log(`⏰ OTP expired for ${sdt}. Age: ${otpAge}ms, Max: ${maxAge}ms`);
        await OTP.deleteOne({ _id: otpRecord._id }); // Xóa OTP hết hạn
        throw new Error('Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.');
    }

    console.log(`✅ OTP found and valid for ${sdt}`);

    // Không xóa OTP ở đây, vì nó sẽ cần cho bước reset mật khẩu cuối cùng
    return {
        success: true,
        message: 'Xác thực OTP thành công.',
        phoneNumber: sdt,
        expiresAt: new Date(otpRecord.createdAt.getTime() + maxAge)
    };
};

const datLaiMatKhauVoiOTP = async (sdt, otp, matKhauMoi) => {
    try {
        console.log(`🔐 Resetting password for ${sdt} with OTP: ${otp}`);

        // Kiểm tra format mật khẩu mới
        if (!matKhauMoi || matKhauMoi.length < 6) {
            throw new Error('Mật khẩu mới phải có ít nhất 6 ký tự.');
        }

        // Tìm OTP trong DB
        const otpRecord = await OTP.findOne({ sdt, otp });

        if (!otpRecord) {
            console.log(`❌ OTP not found for ${sdt}`);
            throw new Error('Mã OTP không hợp lệ hoặc đã hết hạn.');
        }

        // Kiểm tra thời gian hết hạn OTP
        const now = new Date();
        const otpAge = now - otpRecord.createdAt;
        const maxAge = 5 * 60 * 1000; // 5 phút

        if (otpAge > maxAge) {
            console.log(`⏰ OTP expired for ${sdt}`);
            await OTP.deleteOne({ _id: otpRecord._id });
            throw new Error('Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.');
        }

        // Tìm tài khoản
        const taiKhoan = await TaiKhoan.findOne({ sdt });
        if (!taiKhoan) {
            console.log(`❌ Account not found for ${sdt}`);
            throw new Error('Không tìm thấy tài khoản.');
        }

        // Kiểm tra mật khẩu mới có khác mật khẩu cũ không
        const isSamePassword = await bcrypt.compare(matKhauMoi, taiKhoan.matKhau);
        if (isSamePassword) {
            throw new Error('Mật khẩu mới phải khác mật khẩu hiện tại.');
        }

        // Băm mật khẩu mới
        const salt = await bcrypt.genSalt(12);
        taiKhoan.matKhau = await bcrypt.hash(matKhauMoi, salt);
        await taiKhoan.save();

        console.log(`✅ Password updated for ${sdt}`);

        // Xóa OTP đã sử dụng
        await OTP.deleteOne({ _id: otpRecord._id });
        console.log(`🗑️ OTP deleted after successful password reset`);

        return {
            success: true,
            message: 'Mật khẩu đã được đặt lại thành công.',
            phoneNumber: sdt
        };

    } catch (error) {
        console.error('❌ Password Reset Error:', error.message);
        throw error;
    }
};

const findTaiKhoanByUserId = async (userId) => {
    console.log(`🔍 Finding TaiKhoan for userId: ${userId}`);
    const taiKhoan = await TaiKhoan.findOne({ nguoiDung: userId });
    console.log(`🔍 Found TaiKhoan:`, taiKhoan ? 'Yes' : 'No');
    return taiKhoan;
};

const updatePassword = async (taiKhoanId, hashedPassword) => {
    console.log(`🔧 Updating password for TaiKhoan ID: ${taiKhoanId}`);
    const result = await TaiKhoan.findByIdAndUpdate(taiKhoanId, { matKhau: hashedPassword });
    console.log(`🔧 Update result:`, result ? 'Success' : 'Failed');
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
