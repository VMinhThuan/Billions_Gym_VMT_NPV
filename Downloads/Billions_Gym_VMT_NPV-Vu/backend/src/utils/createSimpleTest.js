const mongoose = require('mongoose');
require('dotenv').config();

const TaiKhoan = require('../models/TaiKhoan');
const { HoiVien } = require('../models/NguoiDung');
const { hashPassword } = require('./hashPassword');

async function createSimpleTestAccount() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Delete existing test account if exists
        await TaiKhoan.deleteOne({ sdt: '1234567890' });
        await HoiVien.deleteOne({ sdt: '1234567890' });

        // Create simple test account
        const hoiVien = new HoiVien({
            sdt: '1234567890',
            hoTen: 'Test User',
            ngaySinh: new Date('1990-01-01'),
            gioiTinh: 'Nam',
            email: 'test@test.com'
        });
        await hoiVien.save();
        
        const hashedPassword = await hashPassword('123456');
        const taiKhoan = new TaiKhoan({
            sdt: '1234567890',
            matKhau: hashedPassword,
            nguoiDung: hoiVien._id,
            trangThaiTK: 'DANG_HOAT_DONG'
        });
        await taiKhoan.save();

        console.log('✅ Created simple test account:');
        console.log('📱 SDT: 1234567890');
        console.log('🔑 Password: 123456');
        console.log('👤 Role: HoiVien');
        console.log('✨ Status: DANG_HOAT_DONG');

        // Verify the account
        const verify = await TaiKhoan.findOne({ sdt: '1234567890' }).populate('nguoiDung');
        console.log('\n🔍 Verification:', {
            sdt: verify.sdt,
            status: verify.trangThaiTK,
            role: verify.nguoiDung?.vaiTro,
            name: verify.nguoiDung?.hoTen
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

createSimpleTestAccount();