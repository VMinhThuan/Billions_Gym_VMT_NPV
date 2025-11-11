// seedHoiVienTest.js
// Script để tạo hội viên "Ngô Nguyễn Anh Tú" và đăng ký vào các buổi tập hôm nay

const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
require('dotenv').config();

// Import models
const { HoiVien } = require('../src/models/NguoiDung');
const TaiKhoan = require('../src/models/TaiKhoan');
const BuoiTap = require('../src/models/BuoiTap');
const ChiNhanh = require('../src/models/ChiNhanh');
const { hashPassword } = require('../src/utils/hashPassword');

// Thông tin hội viên
const HOI_VIEN_INFO = {
    hoTen: 'Ngô Nguyễn Anh Tú',
    sdt: '0987654321',
    email: 'ngonguyenanhtu@example.com',
    ngaySinh: new Date('1995-05-15'),
    gioiTinh: 'Nam',
    trangThaiHoiVien: 'DANG_HOAT_DONG',
    matKhau: '123456' // Mật khẩu đơn giản để test
};

async function seedHoiVien() {
    try {
        // Kết nối database
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/billions-gym';
        await mongoose.connect(mongoUri);
        console.log('✅ Đã kết nối database');

        // Tìm hoặc tạo hội viên
        let hoiVien = await HoiVien.findOne({ sdt: HOI_VIEN_INFO.sdt });

        if (hoiVien) {
            console.log('ℹ️  Hội viên đã tồn tại:', hoiVien.hoTen);
            // Cập nhật thông tin nếu cần
            hoiVien.hoTen = HOI_VIEN_INFO.hoTen;
            hoiVien.email = HOI_VIEN_INFO.email;
            hoiVien.ngaySinh = HOI_VIEN_INFO.ngaySinh;
            hoiVien.gioiTinh = HOI_VIEN_INFO.gioiTinh;
            hoiVien.trangThaiHoiVien = HOI_VIEN_INFO.trangThaiHoiVien;
            await hoiVien.save();
            console.log('✅ Đã cập nhật thông tin hội viên');
        } else {
            // Tạo hội viên mới
            hoiVien = await HoiVien.create({
                hoTen: HOI_VIEN_INFO.hoTen,
                sdt: HOI_VIEN_INFO.sdt,
                email: HOI_VIEN_INFO.email,
                ngaySinh: HOI_VIEN_INFO.ngaySinh,
                gioiTinh: HOI_VIEN_INFO.gioiTinh,
                trangThaiHoiVien: HOI_VIEN_INFO.trangThaiHoiVien
            });
            console.log('✅ Đã tạo hội viên mới:', hoiVien.hoTen);
        }

        // Tạo hoặc cập nhật tài khoản
        let taiKhoan = await TaiKhoan.findOne({ sdt: HOI_VIEN_INFO.sdt });

        if (taiKhoan) {
            // Cập nhật mật khẩu
            const hashedPassword = await hashPassword(HOI_VIEN_INFO.matKhau);
            taiKhoan.matKhau = hashedPassword;
            taiKhoan.nguoiDung = hoiVien._id;
            taiKhoan.trangThaiTK = 'DANG_HOAT_DONG';
            await taiKhoan.save();
            console.log('✅ Đã cập nhật tài khoản');
        } else {
            // Tạo tài khoản mới
            const hashedPassword = await hashPassword(HOI_VIEN_INFO.matKhau);
            taiKhoan = await TaiKhoan.create({
                sdt: HOI_VIEN_INFO.sdt,
                matKhau: hashedPassword,
                nguoiDung: hoiVien._id,
                trangThaiTK: 'DANG_HOAT_DONG'
            });
            console.log('✅ Đã tạo tài khoản mới');
        }

        console.log('\n📋 Thông tin đăng nhập:');
        console.log('   Số điện thoại:', HOI_VIEN_INFO.sdt);
        console.log('   Mật khẩu:', HOI_VIEN_INFO.matKhau);

        // Tìm các buổi tập hôm nay
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const buoiTaps = await BuoiTap.find({
            ngayTap: {
                $gte: today,
                $lt: tomorrow
            },
            trangThai: { $ne: 'HUY' }
        });

        // Populate manually to avoid schema registration issues
        for (const buoiTap of buoiTaps) {
            if (buoiTap.chiNhanh) {
                const chiNhanh = await ChiNhanh.findById(buoiTap.chiNhanh);
                buoiTap.chiNhanh = chiNhanh;
            }
            if (buoiTap.ptPhuTrach) {
                const { PT } = require('../src/models/NguoiDung');
                const pt = await PT.findById(buoiTap.ptPhuTrach);
                buoiTap.ptPhuTrach = pt;
            }
        }

        console.log(`\n📅 Tìm thấy ${buoiTaps.length} buổi tập hôm nay`);

        if (buoiTaps.length === 0) {
            console.log('⚠️  Không có buổi tập nào hôm nay. Vui lòng tạo buổi tập trước.');
        } else {
            // Đăng ký vào tất cả các buổi tập
            let registeredCount = 0;
            let alreadyRegisteredCount = 0;
            let fullCount = 0;

            for (const buoiTap of buoiTaps) {
                try {
                    // Kiểm tra đã đăng ký chưa
                    const existingRegistration = buoiTap.danhSachHoiVien.find(
                        member => member.hoiVien.toString() === hoiVien._id.toString()
                    );

                    if (existingRegistration) {
                        console.log(`   ⏭️  Đã đăng ký: ${buoiTap.tenBuoiTap} (${buoiTap.gioBatDau} - ${buoiTap.gioKetThuc})`);
                        alreadyRegisteredCount++;
                        continue;
                    }

                    // Kiểm tra còn chỗ không
                    if (buoiTap.daDay) {
                        console.log(`   ❌ Đã đầy: ${buoiTap.tenBuoiTap} (${buoiTap.gioBatDau} - ${buoiTap.gioKetThuc})`);
                        fullCount++;
                        continue;
                    }

                    // Đăng ký vào buổi tập
                    await buoiTap.themHoiVien(hoiVien._id);
                    console.log(`   ✅ Đã đăng ký: ${buoiTap.tenBuoiTap} (${buoiTap.gioBatDau} - ${buoiTap.gioKetThuc}) tại ${buoiTap.chiNhanh?.tenChiNhanh || 'N/A'}`);
                    registeredCount++;
                } catch (error) {
                    console.error(`   ❌ Lỗi khi đăng ký buổi tập ${buoiTap.tenBuoiTap}:`, error.message);
                }
            }

            console.log('\n📊 Tổng kết:');
            console.log(`   ✅ Đã đăng ký mới: ${registeredCount} buổi tập`);
            console.log(`   ⏭️  Đã đăng ký trước đó: ${alreadyRegisteredCount} buổi tập`);
            console.log(`   ❌ Đã đầy: ${fullCount} buổi tập`);
        }

        console.log('\n✅ Hoàn thành seed hội viên test!');
        console.log('\n💡 Bạn có thể đăng nhập với:');
        console.log(`   SĐT: ${HOI_VIEN_INFO.sdt}`);
        console.log(`   Mật khẩu: ${HOI_VIEN_INFO.matKhau}`);

    } catch (error) {
        console.error('❌ Lỗi khi seed hội viên:', error);
        throw error;
    } finally {
        await mongoose.disconnect();
        console.log('\n✅ Đã ngắt kết nối database');
    }
}

// Chạy script
if (require.main === module) {
    seedHoiVien()
        .then(() => {
            console.log('\n🎉 Seed thành công!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Seed thất bại:', error);
            process.exit(1);
        });
}

module.exports = { seedHoiVien };

