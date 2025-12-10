const mongoose = require('mongoose');
require('dotenv').config();

const SessionReview = require('../src/models/SessionReview');
const BuoiTap = require('../src/models/BuoiTap');
const { PT } = require('../src/models/NguoiDung');

(async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('🔌 DB connected\n');

        // Lấy tất cả SessionReview
        const allReviews = await SessionReview.find()
            .lean();

        console.log('📊 Total SessionReviews in DB:', allReviews.length);
        console.log('');

        if (allReviews.length === 0) {
            console.log('❌ Không có review nào trong database!');
            process.exit(0);
        }

        // Kiểm tra từng review
        for (const review of allReviews) {
            const buoiTap = await BuoiTap.findById(review.buoiTapId)
                .select('tenBuoiTap ptPhuTrach')
                .lean();

            if (!buoiTap) {
                console.log(`⚠️  Review ${review._id}: BuoiTap không tồn tại`);
                continue;
            }

            const pt = await PT.findById(buoiTap.ptPhuTrach)
                .select('hoTen sdt')
                .lean();

            console.log('📋 Review:', review._id);
            console.log('  BuoiTap:', buoiTap.tenBuoiTap, `(${review.buoiTapId})`);
            console.log('  PT:', pt ? `${pt.hoTen} (${pt.sdt})` : 'N/A', `(${buoiTap.ptPhuTrach})`);
            console.log('  ptRating:', review.ptRating, '(type:', typeof review.ptRating, ')');
            console.log('  branchRating:', review.branchRating);
            console.log('  ptComment:', review.ptComment || '(empty)');
            console.log('  ngayTao:', review.ngayTao);
            console.log('');
        }

        // Tìm tất cả PT và kiểm tra reviews của họ
        const allPTs = await PT.find()
            .select('hoTen sdt _id')
            .limit(10)
            .lean();

        console.log('\n👥 Checking reviews for first 10 PTs:');
        for (const pt of allPTs) {
            const ptObjectId = new mongoose.Types.ObjectId(pt._id);
            const buoiTaps = await BuoiTap.find({
                ptPhuTrach: ptObjectId
            })
                .select('_id')
                .lean();

            const buoiTapIds = buoiTaps.map(bt => bt._id);

            if (buoiTapIds.length > 0) {
                const reviews = await SessionReview.find({
                    buoiTapId: { $in: buoiTapIds },
                    ptRating: { $ne: null, $exists: true }
                })
                    .select('ptRating')
                    .lean();

                if (reviews.length > 0) {
                    const avg = (reviews.reduce((sum, r) => sum + (r.ptRating || 0), 0) / reviews.length).toFixed(1);
                    console.log(`  ${pt.hoTen} (${pt.sdt}): ${reviews.length} reviews, avg: ${avg}`);
                }
            }
        }

    } catch (err) {
        console.error('❌ Lỗi:', err);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 DB disconnected');
    }
})();

