/**
 * Script để backfill ngày kết thúc cho các gói tập chưa có ngày kết thúc
 * Chạy: node scripts/backfillNgayKetThuc.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const ChiTietGoiTap = require('../src/models/ChiTietGoiTap');
const GoiTap = require('../src/models/GoiTap');
const { addDuration } = require('../src/utils/duration.utils');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/billions_gym';

async function backfillNgayKetThuc() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Tìm tất cả ChiTietGoiTap chưa có ngày kết thúc nhưng có ngày bắt đầu
        const registrations = await ChiTietGoiTap.find({
            $or: [
                { ngayKetThuc: { $exists: false } },
                { ngayKetThuc: null }
            ],
            ngayBatDau: { $exists: true, $ne: null }
        }).populate('goiTapId').populate('maGoiTap');

        console.log(`📊 Found ${registrations.length} registrations without ngayKetThuc`);

        let updated = 0;
        let skipped = 0;
        let errors = 0;

        for (const registration of registrations) {
            try {
                // Lấy thông tin gói tập
                const packageInfo = registration.goiTapId || registration.maGoiTap;

                if (!packageInfo) {
                    console.warn(`⚠️ Skipping registration ${registration._id}: no package info`);
                    skipped++;
                    continue;
                }

                if (!packageInfo.thoiHan || !packageInfo.donViThoiHan) {
                    console.warn(`⚠️ Skipping registration ${registration._id}: package missing thoiHan or donViThoiHan`);
                    skipped++;
                    continue;
                }

                // Tính ngày kết thúc
                const ngayBatDau = new Date(registration.ngayBatDau);
                const ngayKetThuc = addDuration(ngayBatDau, packageInfo.thoiHan, packageInfo.donViThoiHan);

                // Cập nhật
                registration.ngayKetThuc = ngayKetThuc;
                await registration.save();

                updated++;
                console.log(`✅ Updated registration ${registration._id}: ngayKetThuc = ${ngayKetThuc.toISOString()}`);

            } catch (error) {
                errors++;
                console.error(`❌ Error processing registration ${registration._id}:`, error.message);
            }
        }

        console.log('\n📈 Summary:');
        console.log(`   Updated: ${updated}`);
        console.log(`   Skipped: ${skipped}`);
        console.log(`   Errors: ${errors}`);

    } catch (error) {
        console.error('❌ Fatal error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

backfillNgayKetThuc();

