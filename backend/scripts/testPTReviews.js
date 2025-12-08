const mongoose = require('mongoose');
require('dotenv').config();

const SessionReview = require('../src/models/SessionReview');
const BuoiTap = require('../src/models/BuoiTap');
const { PT } = require('../src/models/NguoiDung');

(async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('🔌 DB connected\n');

        // Tìm PT đầu tiên có buổi tập
        const pt = await PT.findOne();
        if (!pt) {
            console.log('❌ Không tìm thấy PT nào');
            process.exit(1);
        }

        const ptId = pt._id;
        const ptObjectId = new mongoose.Types.ObjectId(ptId);

        console.log('📋 PT Info:');
        console.log('  ID:', ptId);
        console.log('  Tên:', pt.hoTen);
        console.log('  SDT:', pt.sdt);
        console.log('  ObjectId:', ptObjectId);
        console.log('');

        // Tìm buổi tập của PT
        const buoiTaps = await BuoiTap.find({
            ptPhuTrach: ptObjectId
        })
            .select('_id tenBuoiTap ptPhuTrach')
            .lean();

        console.log('📊 BuoiTaps của PT:', buoiTaps.length);
        if (buoiTaps.length > 0) {
            console.log('  Sample (3 đầu tiên):');
            buoiTaps.slice(0, 3).forEach((bt, idx) => {
                console.log(`    ${idx + 1}. ${bt.tenBuoiTap} (${bt._id})`);
            });
        }
        console.log('');

        const buoiTapIds = buoiTaps.map(bt => bt._id);

        // Tìm tất cả SessionReview cho các buoiTapIds này
        const allReviews = await SessionReview.find({
            buoiTapId: { $in: buoiTapIds }
        })
            .populate('buoiTapId', 'tenBuoiTap ptPhuTrach')
            .populate('hoiVienId', 'hoTen')
            .lean();

        console.log('⭐ Total SessionReviews:', allReviews.length);
        if (allReviews.length > 0) {
            console.log('  Chi tiết:');
            allReviews.forEach((sr, idx) => {
                console.log(`    ${idx + 1}. Review ID: ${sr._id}`);
                console.log(`       BuoiTap: ${sr.buoiTapId?.tenBuoiTap || 'N/A'}`);
                console.log(`       HoiVien: ${sr.hoiVienId?.hoTen || 'N/A'}`);
                console.log(`       ptRating: ${sr.ptRating} (type: ${typeof sr.ptRating})`);
                console.log(`       branchRating: ${sr.branchRating}`);
                console.log(`       ptComment: ${sr.ptComment || '(empty)'}`);
                console.log('');
            });
        }

        // Tìm reviews có ptRating
        const reviewsWithPTRating = await SessionReview.find({
            buoiTapId: { $in: buoiTapIds },
            ptRating: { $ne: null, $exists: true }
        })
            .select('ptRating ptComment')
            .lean();

        console.log('✅ Reviews với ptRating:', reviewsWithPTRating.length);
        if (reviewsWithPTRating.length > 0) {
            const ratings = reviewsWithPTRating.map(r => r.ptRating);
            const sum = ratings.reduce((a, b) => a + b, 0);
            const avg = (sum / ratings.length).toFixed(1);
            console.log('  Ratings:', ratings);
            console.log('  Tổng sao:', sum);
            console.log('  Trung bình:', avg);
        }

    } catch (err) {
        console.error('❌ Lỗi:', err);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 DB disconnected');
    }
})();

