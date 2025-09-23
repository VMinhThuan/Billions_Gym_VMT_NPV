const mongoose = require('mongoose');
require('dotenv').config();

const TaiKhoan = require('../models/TaiKhoan');
const { OngChu } = require('../models/NguoiDung');
const { hashPassword } = require('./hashPassword');

async function seedOngChu() {
    await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

    // Kiểm tra đã có Ông chủ chưa
    const ongChuDaCo = await OngChu.findOne();
    if (ongChuDaCo) {
        console.log('Đã có Ông chủ trong hệ thống.');
        await mongoose.disconnect();
        return;
    }

    // Tạo thông tin Ông chủ
    const ongChu = new OngChu({
        sdt: '0900003004',
        hoTen: 'Admin',
        ngaySinh: new Date('1980-01-01'),
        gioiTinh: 'Nam',
        email: 'admin@billiongym.com'
    });
    await ongChu.save();


    // Hash mật khẩu trước khi lưu
    const plainPassword = 'admin';
    const hashedPassword = await hashPassword(plainPassword);

    const taiKhoan = new TaiKhoan({
        sdt: '0900003004',
        matKhau: hashedPassword,
        nguoiDung: ongChu._id
    });
    await taiKhoan.save();

    console.log('Đã tạo tài khoản Ông Chủ!');
    await mongoose.disconnect();
}

seedOngChu().catch(err => {
    console.error(err);
    mongoose.disconnect();
});
