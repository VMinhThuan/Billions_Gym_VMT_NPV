const mongoose = require('mongoose');
require('dotenv').config();

const SessionReview = require('../src/models/SessionReview');
const BuoiTap = require('../src/models/BuoiTap');
const { PT } = require('../src/models/NguoiDung');

(async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('🔌 DB connected');

        // Tìm tất cả PT
        const allPTs = await PT.find().select('hoTen sdt _id').lean();
        console.log('\n👥 All PTs:');
        allPTs.forEach((pt, idx) => {
            console.log(`  ${idx + 1}. ${pt.hoTen} (${pt.sdt}) - ID: ${pt._id}`);
        });

        // Kiểm tra từng PT
        for (const pt of allPTs) {
            const ptId = pt._id;
            const ptIdString = ptId.toString();
            const ptObjectId = new mongoose.Types.ObjectId(ptId);

            console.log(`\n\n🔍 Checking PT: ${pt.hoTen} (${ptId})`);

            // Tìm buổi tập của PT
            const buoiTaps = await BuoiTap.find({
                $or: [
                    { ptPhuTrach: ptId },
                    { ptPhuTrach: ptObjectId },
                    { ptPhuTrach: ptIdString }
                ]
            })
                .select('_id tenBuoiTap ptPhuTrach')
                .lean();

            console.log(`  📊 BuoiTaps: ${buoiTaps.length}`);

            if (buoiTaps.length > 0) {
                const buoiTapIds = buoiTaps.map(bt => bt._id);

                // Tìm SessionReview
                const reviews = await SessionReview.find({
                    buoiTapId: { $in: buoiTapIds },
                    ptRating: { $ne: null, $exists: true }
                })
                    .lean();

                console.log(`  ⭐ Reviews with ptRating: ${reviews.length}`);

                if (reviews.length > 0) {
                    reviews.forEach((sr, idx) => {
                        console.log(`    ${idx + 1}. Review ID: ${sr._id}`);
                        console.log(`       ptRating: ${sr.ptRating}`);
                        console.log(`       ptComment: ${sr.ptComment || '(empty)'}`);
                    });
                }
            }
        }

        // Kiểm tra review có sẵn
        const allReviews = await SessionReview.find({
            ptRating: { $ne: null, $exists: true }
        }).lean();

        console.log('\n\n📋 All Reviews with ptRating:');
        for (const sr of allReviews) {
            const buoiTap = await BuoiTap.findById(sr.buoiTapId).select('tenBuoiTap ptPhuTrach').lean();
            console.log(`  Review: ${sr._id}`);
            console.log(`    BuoiTap: ${buoiTap?.tenBuoiTap || 'N/A'} (${sr.buoiTapId})`);
            console.log(`    PT: ${buoiTap?.ptPhuTrach || 'N/A'}`);
            console.log(`    ptRating: ${sr.ptRating}`);
        }

    } catch (err) {
        console.error('❌ Lỗi:', err);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 DB disconnected');
    }
})();

