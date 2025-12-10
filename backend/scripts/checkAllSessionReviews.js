const mongoose = require('mongoose');
require('dotenv').config();

const SessionReview = require('../src/models/SessionReview');
const BuoiTap = require('../src/models/BuoiTap');
const CheckInRecord = require('../src/models/CheckInRecord');
const NguoiDung = require('../src/models/NguoiDung');

(async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('🔌 DB connected');

        // Đếm tổng số SessionReview
        const totalReviews = await SessionReview.countDocuments();
        console.log('\n📊 Total SessionReviews in DB:', totalReviews);

        if (totalReviews === 0) {
            console.log('❌ Không có SessionReview nào trong database!');
            console.log('   Có thể học viên chưa đánh giá hoặc đánh giá chưa được lưu.');

            // Kiểm tra CheckInRecord có check-out không
            const checkOutRecords = await CheckInRecord.find({
                checkOutTime: { $ne: null }
            }).countDocuments();
            console.log('\n✅ CheckInRecords with checkOut:', checkOutRecords);

            process.exit(0);
        }

        // Lấy tất cả SessionReview (không populate để tránh lỗi)
        const allReviews = await SessionReview.find()
            .lean();

        // Populate thủ công
        for (let sr of allReviews) {
            if (sr.buoiTapId) {
                const buoiTap = await BuoiTap.findById(sr.buoiTapId).select('tenBuoiTap ptPhuTrach ngayTap').lean();
                sr.buoiTapInfo = buoiTap;
            }
            if (sr.hoiVienId) {
                const { HoiVien } = require('../src/models/NguoiDung');
                const hoiVien = await HoiVien.findById(sr.hoiVienId).select('hoTen sdt').lean();
                sr.hoiVienInfo = hoiVien;
            }
        }

        console.log('\n📋 All SessionReviews:');
        allReviews.forEach((sr, idx) => {
            console.log(`\n  ${idx + 1}. Review ID: ${sr._id}`);
            console.log(`     BuoiTapId: ${sr.buoiTapId}`);
            console.log(`     BuoiTap Info: ${sr.buoiTapInfo?.tenBuoiTap || 'N/A'} (${sr.buoiTapInfo?._id || 'N/A'})`);
            console.log(`     PT: ${sr.buoiTapInfo?.ptPhuTrach || 'N/A'} (type: ${typeof sr.buoiTapInfo?.ptPhuTrach})`);
            console.log(`     HoiVienId: ${sr.hoiVienId}`);
            console.log(`     HoiVien Info: ${sr.hoiVienInfo?.hoTen || 'N/A'} (${sr.hoiVienInfo?._id || 'N/A'})`);
            console.log(`     ptRating: ${sr.ptRating} (type: ${typeof sr.ptRating})`);
            console.log(`     branchRating: ${sr.branchRating}`);
            console.log(`     ptComment: ${sr.ptComment || '(empty)'}`);
            console.log(`     isCompleted: ${sr.isCompleted}`);
            console.log(`     ngayTao: ${sr.ngayTao}`);
        });

        // Kiểm tra có review nào có ptRating không
        const reviewsWithPTRating = allReviews.filter(sr =>
            sr.ptRating !== null && sr.ptRating !== undefined
        );
        console.log('\n✅ Reviews with ptRating:', reviewsWithPTRating.length);

        // Kiểm tra các PT có reviews
        const ptIds = new Set();
        allReviews.forEach(sr => {
            if (sr.buoiTapInfo?.ptPhuTrach) {
                ptIds.add(sr.buoiTapInfo.ptPhuTrach.toString());
            }
        });
        console.log('\n👥 PTs with reviews:', Array.from(ptIds));

    } catch (err) {
        console.error('❌ Lỗi:', err);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 DB disconnected');
    }
})();

