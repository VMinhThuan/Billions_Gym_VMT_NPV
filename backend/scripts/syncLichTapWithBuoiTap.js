// syncLichTapWithBuoiTap.js
// Script để đồng bộ ngày trong LichTap.danhSachBuoiTap với BuoiTap.ngayTap

const mongoose = require('mongoose');
require('dotenv').config();

const { HoiVien } = require('../src/models/NguoiDung');
const BuoiTap = require('../src/models/BuoiTap');
const LichTap = require('../src/models/LichTap');

async function syncLichTapWithBuoiTap() {
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

        // Get all buoi taps where member is registered
        const allBuoiTaps = await BuoiTap.find({
            'danhSachHoiVien.hoiVien': hoiVien._id
        });

        console.log(`📊 Found ${allBuoiTaps.length} total registered buoi taps\n`);

        // Create a map of buoiTapId -> BuoiTap
        const buoiTapMap = new Map();
        allBuoiTaps.forEach(bt => {
            buoiTapMap.set(bt._id.toString(), bt);
        });

        // Update danhSachBuoiTap: sync dates with BuoiTap
        let updatedCount = 0;
        let addedCount = 0;
        const existingBuoiTapIds = new Set();

        for (const btEntry of lichTap.danhSachBuoiTap) {
            if (btEntry.buoiTap) {
                existingBuoiTapIds.add(btEntry.buoiTap.toString());
                const buoiTap = buoiTapMap.get(btEntry.buoiTap.toString());
                if (buoiTap) {
                    // Update ngayTap to match BuoiTap
                    if (!btEntry.ngayTap || new Date(btEntry.ngayTap).getTime() !== buoiTap.ngayTap.getTime()) {
                        btEntry.ngayTap = buoiTap.ngayTap;
                        btEntry.gioBatDau = buoiTap.gioBatDau;
                        btEntry.gioKetThuc = buoiTap.gioKetThuc;
                        btEntry.ptPhuTrach = buoiTap.ptPhuTrach;
                        updatedCount++;
                    }
                }
            }
        }

        // Add missing buoi taps
        for (const buoiTap of allBuoiTaps) {
            if (!existingBuoiTapIds.has(buoiTap._id.toString())) {
                lichTap.danhSachBuoiTap.push({
                    buoiTap: buoiTap._id,
                    ngayTap: buoiTap.ngayTap,
                    gioBatDau: buoiTap.gioBatDau,
                    gioKetThuc: buoiTap.gioKetThuc,
                    ptPhuTrach: buoiTap.ptPhuTrach,
                    trangThai: 'DA_DANG_KY',
                    ngayDangKy: new Date()
                });
                addedCount++;
            }
        }

        // Update cacBuoiTap array
        lichTap.cacBuoiTap = allBuoiTaps.map(bt => bt._id);

        await lichTap.save();

        console.log(`✅ Updated ${updatedCount} buoi tap dates`);
        console.log(`✅ Added ${addedCount} new buoi taps`);
        console.log(`✅ Total buoi taps in LichTap: ${lichTap.danhSachBuoiTap.length}`);
        console.log('');

        // Verify today's buoi taps
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

        const todayBuoiTaps = lichTap.danhSachBuoiTap.filter(bt => {
            if (!bt.ngayTap) return false;
            const btDate = new Date(bt.ngayTap);
            return btDate >= todayUTC && btDate < tomorrowUTC;
        });

        console.log(`📅 Buoi taps for today in LichTap: ${todayBuoiTaps.length}`);
        if (todayBuoiTaps.length > 0) {
            console.log('\n📋 Sample buoi taps for today:');
            todayBuoiTaps.slice(0, 5).forEach((bt, idx) => {
                const btDate = new Date(bt.ngayTap);
                console.log(`   ${idx + 1}. ${bt.gioBatDau} - ${bt.gioKetThuc}`);
                console.log(`      Date: ${btDate.toISOString()}`);
                console.log(`      Status: ${bt.trangThai}`);
            });
        }

        console.log('\n✅ LichTap synced successfully!');

        await mongoose.disconnect();
        console.log('\n✅ Disconnected from database');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

syncLichTapWithBuoiTap()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('💥 Failed:', error);
        process.exit(1);
    });

