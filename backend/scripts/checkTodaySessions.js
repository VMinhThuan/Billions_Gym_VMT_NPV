// checkTodaySessions.js
// Script để kiểm tra buổi tập hôm nay cho hội viên

const mongoose = require('mongoose');
require('dotenv').config();

const { HoiVien } = require('../src/models/NguoiDung');
const BuoiTap = require('../src/models/BuoiTap');

async function checkTodaySessions() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/billions-gym');
        console.log('✅ Connected to database\n');

        // Find the member
        const hoiVien = await HoiVien.findOne({ sdt: '0987654321' });
        if (!hoiVien) {
            console.log('❌ Member not found');
            process.exit(1);
        }
        console.log('✅ Member found:', hoiVien.hoTen);
        console.log('   ID:', hoiVien._id.toString());
        console.log('   Status:', hoiVien.trangThaiHoiVien);
        console.log('');

        // Get today's date range (UTC)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        console.log('📅 Today range (UTC):');
        console.log('   From:', today.toISOString());
        console.log('   To:', tomorrow.toISOString());
        console.log('   Local:', today.toLocaleString('vi-VN'));
        console.log('');

        // Find all buoi taps today
        const allBuoiTaps = await BuoiTap.find({
            ngayTap: { $gte: today, $lt: tomorrow }
        });
        console.log('📊 Total buoi taps today:', allBuoiTaps.length);
        console.log('');

        if (allBuoiTaps.length === 0) {
            console.log('⚠️  No buoi taps found for today!');
            console.log('   This might be a timezone issue or no sessions were created for today.');

            // Check if there are any buoi taps at all
            const anyBuoiTap = await BuoiTap.findOne().sort({ ngayTap: 1 });
            if (anyBuoiTap) {
                console.log('\n📅 Nearest buoi tap:');
                console.log('   Date:', anyBuoiTap.ngayTap);
                console.log('   Name:', anyBuoiTap.tenBuoiTap);
            }
        } else {
            // Find buoi taps where member is registered
            const registeredBuoiTaps = await BuoiTap.find({
                'danhSachHoiVien.hoiVien': hoiVien._id,
                ngayTap: { $gte: today, $lt: tomorrow }
            });
            console.log('✅ Registered buoi taps:', registeredBuoiTaps.length);
            console.log('');

            if (registeredBuoiTaps.length > 0) {
                console.log('📋 Sample registered sessions (first 5):');
                registeredBuoiTaps.slice(0, 5).forEach((bt, idx) => {
                    const memberInfo = bt.danhSachHoiVien.find(
                        m => m.hoiVien.toString() === hoiVien._id.toString()
                    );
                    console.log(`   ${idx + 1}. ${bt.tenBuoiTap}`);
                    console.log(`      Time: ${bt.gioBatDau} - ${bt.gioKetThuc}`);
                    console.log(`      Date: ${bt.ngayTap.toLocaleString('vi-VN')}`);
                    console.log(`      Status: ${bt.trangThai}`);
                    console.log(`      Attendance: ${memberInfo?.trangThai || 'N/A'}`);
                    console.log('');
                });
            } else {
                console.log('⚠️  No registered sessions found for this member');
                console.log('\n🔍 Checking first buoi tap registration:');
                const firstBt = allBuoiTaps[0];
                console.log('   Buoi tap:', firstBt.tenBuoiTap);
                console.log('   Date:', firstBt.ngayTap.toLocaleString('vi-VN'));
                console.log('   danhSachHoiVien length:', firstBt.danhSachHoiVien?.length || 0);
                if (firstBt.danhSachHoiVien && firstBt.danhSachHoiVien.length > 0) {
                    console.log('   First member ID:', firstBt.danhSachHoiVien[0].hoiVien?.toString());
                    console.log('   Our member ID:', hoiVien._id.toString());
                    const match = firstBt.danhSachHoiVien[0].hoiVien?.toString() === hoiVien._id.toString();
                    console.log('   Match:', match);
                }
            }
        }

        await mongoose.disconnect();
        console.log('\n✅ Disconnected from database');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkTodaySessions()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('💥 Failed:', error);
        process.exit(1);
    });

