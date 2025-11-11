// fixLichTapDates.js
// Script để sửa lại ngày trong LichTap danhSachBuoiTap để khớp với ngày trong BuoiTap

const mongoose = require('mongoose');
require('dotenv').config();

const { HoiVien } = require('../src/models/NguoiDung');
const BuoiTap = require('../src/models/BuoiTap');
const LichTap = require('../src/models/LichTap');

async function fixLichTapDates() {
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
        console.log('');

        // Find LichTap
        const lichTap = await LichTap.findOne({ hoiVien: hoiVien._id });
        if (!lichTap) {
            console.log('❌ LichTap not found');
            process.exit(1);
        }
        console.log('✅ LichTap found:', lichTap._id.toString());
        console.log(`   Current danhSachBuoiTap count: ${lichTap.danhSachBuoiTap.length}`);
        console.log('');

        // Get today's date range (Vietnam timezone)
        const now = new Date();
        const utcTime = now.getTime() + (now.getTimezoneOffset() * 60 * 1000);
        const vietnamTime = new Date(utcTime + (7 * 60 * 60 * 1000));
        const year = vietnamTime.getUTCFullYear();
        const month = vietnamTime.getUTCMonth();
        const date = vietnamTime.getUTCDate();
        const todayVietnam = new Date(Date.UTC(year, month, date, 0, 0, 0, 0));
        const todayUTC = new Date(todayVietnam.getTime() - (7 * 60 * 60 * 1000));
        const tomorrowUTC = new Date(todayUTC);
        tomorrowUTC.setDate(tomorrowUTC.getDate() + 1);

        console.log('📅 Today range (UTC):');
        console.log('   From:', todayUTC.toISOString());
        console.log('   To:', tomorrowUTC.toISOString());
        console.log('   Local:', todayUTC.toLocaleString('vi-VN'));
        console.log('');

        // Find all buoi taps where member is registered today
        const buoiTaps = await BuoiTap.find({
            'danhSachHoiVien.hoiVien': hoiVien._id,
            ngayTap: {
                $gte: todayUTC,
                $lt: tomorrowUTC
            }
        });

        console.log(`📊 Found ${buoiTaps.length} buoi taps for today\n`);

        if (buoiTaps.length === 0) {
            console.log('⚠️  No buoi taps found for today');
            process.exit(0);
        }

        // Update LichTap: remove old entries and add new ones
        console.log('🔄 Updating LichTap...');

        // Remove all existing entries for today
        lichTap.danhSachBuoiTap = lichTap.danhSachBuoiTap.filter(bt => {
            if (!bt.ngayTap) return true;
            const btDate = new Date(bt.ngayTap);
            return !(btDate >= todayUTC && btDate < tomorrowUTC);
        });

        // Add today's buoi taps
        let addedCount = 0;
        for (const buoiTap of buoiTaps) {
            // Check if already exists
            const exists = lichTap.danhSachBuoiTap.find(
                bt => bt.buoiTap?.toString() === buoiTap._id.toString()
            );

            if (!exists) {
                lichTap.danhSachBuoiTap.push({
                    buoiTap: buoiTap._id,
                    ngayTap: buoiTap.ngayTap, // Use the exact date from BuoiTap
                    gioBatDau: buoiTap.gioBatDau,
                    gioKetThuc: buoiTap.gioKetThuc,
                    ptPhuTrach: buoiTap.ptPhuTrach,
                    trangThai: 'DA_DANG_KY',
                    ngayDangKy: new Date()
                });
                addedCount++;
            }
        }

        // Also update cacBuoiTap array
        for (const buoiTap of buoiTaps) {
            if (!lichTap.cacBuoiTap.includes(buoiTap._id)) {
                lichTap.cacBuoiTap.push(buoiTap._id);
            }
        }

        await lichTap.save();

        console.log(`✅ Added ${addedCount} buoi taps for today`);
        console.log(`✅ Total buoi taps in LichTap: ${lichTap.danhSachBuoiTap.length}`);
        console.log('');

        // Verify
        const todayBuoiTaps = lichTap.danhSachBuoiTap.filter(bt => {
            if (!bt.ngayTap) return false;
            const btDate = new Date(bt.ngayTap);
            return btDate >= todayUTC && btDate < tomorrowUTC;
        });

        console.log(`📅 Buoi taps for today in LichTap: ${todayBuoiTaps.length}`);
        if (todayBuoiTaps.length > 0) {
            console.log('\n📋 Sample buoi taps:');
            todayBuoiTaps.slice(0, 5).forEach((bt, idx) => {
                const btDate = new Date(bt.ngayTap);
                console.log(`   ${idx + 1}. ${bt.gioBatDau} - ${bt.gioKetThuc}`);
                console.log(`      Date: ${btDate.toISOString()} (${btDate.toLocaleString('vi-VN')})`);
                console.log(`      Status: ${bt.trangThai}`);
            });
        }

        console.log('\n✅ LichTap updated successfully!');

        await mongoose.disconnect();
        console.log('\n✅ Disconnected from database');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

fixLichTapDates()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('💥 Failed:', error);
        process.exit(1);
    });

