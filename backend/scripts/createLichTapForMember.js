// createLichTapForMember.js
// Script để tạo LichTap cho hội viên Ngô Nguyễn Anh Tú và liên kết với các BuoiTap đã đăng ký

const mongoose = require('mongoose');
require('dotenv').config();

const { HoiVien } = require('../src/models/NguoiDung');
const { PT } = require('../src/models/NguoiDung');
const BuoiTap = require('../src/models/BuoiTap');
const LichTap = require('../src/models/LichTap');
const ChiNhanh = require('../src/models/ChiNhanh');
const GoiTap = require('../src/models/GoiTap');

async function createLichTapForMember() {
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

        // Find all buoi taps where member is registered today
        const buoiTaps = await BuoiTap.find({
            'danhSachHoiVien.hoiVien': hoiVien._id,
            ngayTap: {
                $gte: todayUTC,
                $lt: tomorrowUTC
            }
        }).populate('chiNhanh').populate('ptPhuTrach');

        console.log(`📊 Found ${buoiTaps.length} registered buoi taps today\n`);

        if (buoiTaps.length === 0) {
            console.log('⚠️  No buoi taps found for today');
            process.exit(0);
        }

        // Get unique chiNhanh and PT from buoi taps
        const chiNhanhIds = [...new Set(buoiTaps.map(bt => bt.chiNhanh?._id?.toString()).filter(Boolean))];
        const ptIds = [...new Set(buoiTaps.map(bt => bt.ptPhuTrach?._id?.toString()).filter(Boolean))];

        if (chiNhanhIds.length === 0 || ptIds.length === 0) {
            console.log('❌ Missing chiNhanh or PT information');
            process.exit(1);
        }

        // Use first chiNhanh and PT
        const chiNhanhId = chiNhanhIds[0];
        const ptId = ptIds[0];

        console.log('📋 Using:');
        console.log('   ChiNhanh ID:', chiNhanhId);
        console.log('   PT ID:', ptId);
        console.log('');

        // Find or create a GoiTap (required field)
        let goiTap = await GoiTap.findOne();
        if (!goiTap) {
            console.log('⚠️  No GoiTap found. Creating a default one...');
            goiTap = await GoiTap.create({
                tenGoiTap: 'Gói tập mặc định',
                donGia: 0,
                thoiHan: 1,
                donViThoiHan: 'thang',
                moTa: 'Gói tập mặc định cho test'
            });
            console.log('✅ Created default GoiTap:', goiTap._id);
        }
        console.log('✅ Using GoiTap:', goiTap._id);
        console.log('');

        // Check if LichTap already exists for this member
        let lichTap = await LichTap.findOne({ hoiVien: hoiVien._id });

        if (lichTap) {
            console.log('ℹ️  LichTap already exists, updating...');
            console.log('   LichTap ID:', lichTap._id.toString());
        } else {
            console.log('📝 Creating new LichTap...');

            // Calculate date range (from today to 30 days later)
            const ngayBatDau = todayUTC;
            const ngayKetThuc = new Date(todayUTC);
            ngayKetThuc.setDate(ngayKetThuc.getDate() + 30);

            lichTap = new LichTap({
                hoiVien: hoiVien._id,
                pt: ptId,
                ngayBatDau: ngayBatDau,
                ngayKetThuc: ngayKetThuc,
                goiTap: goiTap._id,
                chiNhanh: chiNhanhId,
                tuanBatDau: ngayBatDau,
                tuanKetThuc: ngayKetThuc,
                soNgayTapTrongTuan: 7, // Full week
                gioTapUuTien: [],
                danhSachBuoiTap: [],
                trangThai: 'DANG_HOAT_DONG',
                trangThaiLich: 'DANG_HOAT_DONG'
            });
        }

        // Add today's buoi taps to danhSachBuoiTap
        let addedCount = 0;
        for (const buoiTap of buoiTaps) {
            // Check if already in danhSachBuoiTap
            const exists = lichTap.danhSachBuoiTap.find(
                bt => bt.buoiTap?.toString() === buoiTap._id.toString()
            );

            if (!exists) {
                lichTap.danhSachBuoiTap.push({
                    buoiTap: buoiTap._id,
                    ngayTap: buoiTap.ngayTap,
                    gioBatDau: buoiTap.gioBatDau,
                    gioKetThuc: buoiTap.gioKetThuc,
                    ptPhuTrach: buoiTap.ptPhuTrach?._id || buoiTap.ptPhuTrach,
                    trangThai: 'DA_DANG_KY',
                    ngayDangKy: new Date()
                });
                addedCount++;
            }
        }

        // Also add to cacBuoiTap array
        for (const buoiTap of buoiTaps) {
            if (!lichTap.cacBuoiTap.includes(buoiTap._id)) {
                lichTap.cacBuoiTap.push(buoiTap._id);
            }
        }

        await lichTap.save();

        console.log(`✅ Added ${addedCount} new buoi taps to LichTap`);
        console.log(`✅ Total buoi taps in LichTap: ${lichTap.danhSachBuoiTap.length}`);
        console.log('');

        // Verify
        const todayBuoiTaps = lichTap.danhSachBuoiTap.filter(bt => {
            const btDate = new Date(bt.ngayTap);
            return btDate >= todayUTC && btDate < tomorrowUTC;
        });

        console.log(`📅 Buoi taps for today in LichTap: ${todayBuoiTaps.length}`);
        if (todayBuoiTaps.length > 0) {
            console.log('\n📋 Sample buoi taps:');
            todayBuoiTaps.slice(0, 5).forEach((bt, idx) => {
                console.log(`   ${idx + 1}. ${bt.gioBatDau} - ${bt.gioKetThuc} (Status: ${bt.trangThai})`);
            });
        }

        console.log('\n✅ LichTap created/updated successfully!');
        console.log('   LichTap ID:', lichTap._id.toString());

        await mongoose.disconnect();
        console.log('\n✅ Disconnected from database');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

createLichTapForMember()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('💥 Failed:', error);
        process.exit(1);
    });

