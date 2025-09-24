const mongoose = require('mongoose');
require('dotenv').config();

const TaiKhoan = require('../models/TaiKhoan');
const { HoiVien, PT, OngChu } = require('../models/NguoiDung');
const { hashPassword } = require('./hashPassword');

async function createTestAccounts() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('Connected to MongoDB');

        // Check existing accounts
        const allAccounts = await TaiKhoan.find().populate('nguoiDung');
        console.log('Existing accounts:');
        allAccounts.forEach(acc => {
            console.log(`- SDT: ${acc.sdt}, Role: ${acc.nguoiDung?.vaiTro || 'No role'}, Status: ${acc.trangThaiTK}`);
        });

        // Create HoiVien test account
        let hoiVien = await HoiVien.findOne({ sdt: '0123456789' });
        if (!hoiVien) {
            hoiVien = new HoiVien({
                sdt: '0123456789',
                hoTen: 'Test HoiVien',
                ngaySinh: new Date('1990-01-01'),
                gioiTinh: 'Nam',
                email: 'hoivien@test.com'
            });
            await hoiVien.save();
            
            const hashedPassword = await hashPassword('123456');
            const taiKhoanHV = new TaiKhoan({
                sdt: '0123456789',
                matKhau: hashedPassword,
                nguoiDung: hoiVien._id,
                trangThaiTK: 'HOAT_DONG'
            });
            await taiKhoanHV.save();
            console.log('✅ Created HoiVien test account: 0123456789 / 123456');
        }

        // Create PT test account
        let pt = await PT.findOne({ sdt: '0987654321' });
        if (!pt) {
            pt = new PT({
                sdt: '0987654321',
                hoTen: 'Test PT',
                ngaySinh: new Date('1985-01-01'),
                gioiTinh: 'Nam',
                email: 'pt@test.com',
                chuyenMon: 'Gym Training'
            });
            await pt.save();
            
            const hashedPassword = await hashPassword('123456');
            const taiKhoanPT = new TaiKhoan({
                sdt: '0987654321',
                matKhau: hashedPassword,
                nguoiDung: pt._id,
                trangThaiTK: 'HOAT_DONG'
            });
            await taiKhoanPT.save();
            console.log('✅ Created PT test account: 0987654321 / 123456');
        }

        // Check admin account
        const adminAccount = await TaiKhoan.findOne({ sdt: '0900003004' }).populate('nguoiDung');
        if (adminAccount) {
            console.log('✅ Admin account exists: 0900003004 / admin');
            console.log('Admin status:', adminAccount.trangThaiTK);
            console.log('Admin user:', adminAccount.nguoiDung?.vaiTro);
        } else {
            console.log('❌ Admin account not found, running seedOngChu...');
            // If admin doesn't exist, create it
            const ongChu = new OngChu({
                sdt: '0900003004',
                hoTen: 'Admin',
                ngaySinh: new Date('1980-01-01'),
                gioiTinh: 'Nam',
                email: 'admin@billiongym.com'
            });
            await ongChu.save();

            const hashedPassword = await hashPassword('admin');
            const taiKhoan = new TaiKhoan({
                sdt: '0900003004',
                matKhau: hashedPassword,
                nguoiDung: ongChu._id,
                trangThaiTK: 'HOAT_DONG'
            });
            await taiKhoan.save();
            console.log('✅ Created admin account: 0900003004 / admin');
        }

        console.log('\n📋 Test accounts summary:');
        console.log('👨‍💼 Admin: 0900003004 / admin');
        console.log('🏃‍♂️ HoiVien: 0123456789 / 123456');
        console.log('💪 PT: 0987654321 / 123456');

    } catch (error) {
        console.error('Error creating test accounts:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

createTestAccounts();