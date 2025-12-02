/**
 * Script để kiểm tra và tạo thông báo cho các gói tập đã hết hạn
 * Có thể chạy định kỳ (cron job) để tự động tạo thông báo
 * Chạy: node scripts/checkExpiredPackages.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const ChiTietGoiTap = require('../src/models/ChiTietGoiTap');
const UserNotification = require('../src/models/UserNotification');
const GoiTap = require('../src/models/GoiTap');
const { HoiVien, NguoiDung } = require('../src/models/NguoiDung');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/billions_gym';

async function checkExpiredPackages() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const currentTime = new Date();
        currentTime.setHours(0, 0, 0, 0);

        // Tìm tất cả gói tập đã hết hạn nhưng chưa có thông báo
        const expiredPackages = await ChiTietGoiTap.find({
            ngayKetThuc: { $exists: true, $ne: null, $lt: currentTime },
            trangThaiThanhToan: 'DA_THANH_TOAN',
            $or: [
                { trangThaiSuDung: { $in: ['DANG_HOAT_DONG', 'DANG_SU_DUNG', 'DANG_KICH_HOAT'] } },
                { trangThaiSuDung: { $exists: false } }
            ]
        })
            .populate('goiTapId')
            .populate('maGoiTap')
            .populate('nguoiDungId')
            .populate('maHoiVien');

        console.log(`📊 Found ${expiredPackages.length} expired packages`);

        let notificationsCreated = 0;
        let notificationsSkipped = 0;
        let errors = 0;

        for (const pkg of expiredPackages) {
            try {
                const userId = pkg.nguoiDungId?._id || pkg.maHoiVien?._id;
                if (!userId) {
                    console.warn(`⚠️ Skipping package ${pkg._id}: no user found`);
                    notificationsSkipped++;
                    continue;
                }

                // Kiểm tra xem đã có thông báo chưa
                const existingNotification = await UserNotification.findOne({
                    userId: userId,
                    loaiThongBao: 'GOI_TAP_HET_HAN',
                    'duLieuLienQuan.chiTietGoiTapId': pkg._id.toString(),
                    daDoc: false
                });

                if (existingNotification) {
                    console.log(`⏭️ Notification already exists for package ${pkg._id}, user ${userId}`);
                    notificationsSkipped++;
                    continue;
                }

                const goiTap = pkg.goiTapId || pkg.maGoiTap;
                const tenGoiTap = goiTap?.tenGoiTap || 'của bạn';

                // Tạo thông báo
                await UserNotification.create({
                    userId: userId,
                    loaiThongBao: 'GOI_TAP_HET_HAN',
                    tieuDe: 'Gói tập đã hết hạn',
                    noiDung: `Gói tập "${tenGoiTap}" đã hết hạn. Vui lòng gia hạn hoặc đăng ký gói tập mới để tiếp tục sử dụng dịch vụ.`,
                    duLieuLienQuan: {
                        chiTietGoiTapId: pkg._id,
                        goiTapId: goiTap?._id,
                        ngayKetThuc: pkg.ngayKetThuc
                    },
                    daDoc: false
                });

                notificationsCreated++;
                console.log(`✅ Created notification for user ${userId}, package ${pkg._id} (${tenGoiTap})`);

            } catch (error) {
                errors++;
                console.error(`❌ Error processing package ${pkg._id}:`, error.message);
            }
        }

        console.log('\n📈 Summary:');
        console.log(`   Notifications Created: ${notificationsCreated}`);
        console.log(`   Skipped: ${notificationsSkipped}`);
        console.log(`   Errors: ${errors}`);

    } catch (error) {
        console.error('❌ Fatal error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

checkExpiredPackages();

