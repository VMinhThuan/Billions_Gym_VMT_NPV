/*
 * Script migration: Xóa các fields tiếng Anh khỏi collection BaiTap
 * - title (đã có tenBaiTap)
 * - description (đã có moTa)
 * - duration_sec (đã có thoiGian)
 * - difficulty (đã có mucDoKho)
 * 
 * Usage: node scripts/removeEnglishFieldsFromBaiTap.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const BaiTap = require('../src/models/BaiTap');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/billions_gym';

async function removeEnglishFields() {
    try {
        console.log('🔌 Đang kết nối MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Đã kết nối MongoDB');

        // Đếm số documents có các fields tiếng Anh
        const countWithTitle = await BaiTap.countDocuments({ title: { $exists: true } });
        const countWithDescription = await BaiTap.countDocuments({ description: { $exists: true } });
        const countWithDurationSec = await BaiTap.countDocuments({ duration_sec: { $exists: true } });
        const countWithDifficulty = await BaiTap.countDocuments({ difficulty: { $exists: true } });

        console.log(`\n📊 Thống kê documents có fields tiếng Anh:`);
        console.log(`   - title: ${countWithTitle} documents`);
        console.log(`   - description: ${countWithDescription} documents`);
        console.log(`   - duration_sec: ${countWithDurationSec} documents`);
        console.log(`   - difficulty: ${countWithDifficulty} documents`);

        if (countWithTitle === 0 && countWithDescription === 0 && countWithDurationSec === 0 && countWithDifficulty === 0) {
            console.log('\n✅ Không có documents nào chứa fields tiếng Anh. Không cần migration.');
            await mongoose.disconnect();
            return;
        }

        console.log('\n🗑️  Bắt đầu xóa các fields tiếng Anh...');

        // Dùng collection trực tiếp để đảm bảo $unset hoạt động
        const db = mongoose.connection.db;
        const collection = db.collection('BaiTap');

        // Xóa các fields tiếng Anh khỏi tất cả documents
        const result = await collection.updateMany(
            {},
            {
                $unset: {
                    title: '',
                    description: '',
                    duration_sec: '',
                    difficulty: ''
                }
            }
        );

        console.log(`\n✅ Đã cập nhật ${result.modifiedCount} documents`);
        console.log(`   - Đã xóa title, description, duration_sec, difficulty`);

        // Verify: Đếm lại để đảm bảo đã xóa
        const remainingTitle = await BaiTap.countDocuments({ title: { $exists: true } });
        const remainingDescription = await BaiTap.countDocuments({ description: { $exists: true } });
        const remainingDurationSec = await BaiTap.countDocuments({ duration_sec: { $exists: true } });
        const remainingDifficulty = await BaiTap.countDocuments({ difficulty: { $exists: true } });

        console.log(`\n🔍 Kiểm tra lại:`);
        console.log(`   - title còn lại: ${remainingTitle} documents`);
        console.log(`   - description còn lại: ${remainingDescription} documents`);
        console.log(`   - duration_sec còn lại: ${remainingDurationSec} documents`);
        console.log(`   - difficulty còn lại: ${remainingDifficulty} documents`);

        if (remainingTitle === 0 && remainingDescription === 0 && remainingDurationSec === 0 && remainingDifficulty === 0) {
            console.log('\n✅ Migration hoàn tất! Tất cả fields tiếng Anh đã được xóa.');
        } else {
            console.log('\n⚠️  Vẫn còn một số fields tiếng Anh. Có thể cần chạy lại script.');
        }

        await mongoose.disconnect();
        console.log('\n✅ Đã ngắt kết nối MongoDB');
    } catch (error) {
        console.error('❌ Lỗi:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

// Chạy migration
removeEnglishFields();

