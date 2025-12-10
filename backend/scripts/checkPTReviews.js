const mongoose = require('mongoose');
require('dotenv').config();

const SessionReview = require('../src/models/SessionReview');
const BuoiTap = require('../src/models/BuoiTap');
const { PT } = require('../src/models/NguoiDung');

(async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('🔌 DB connected');

        // Tìm PT đầu tiên
        const pt = await PT.findOne();
        if (!pt) {
            console.log('❌ Không tìm thấy PT nào');
            process.exit(1);
        }

        console.log('\n📋 PT Info:');
        console.log('  ID:', pt._id);
        console.log('  Tên:', pt.hoTen);
        console.log('  SDT:', pt.sdt);

        // Tìm buổi tập của PT
        const ptId = pt._id;
        const ptIdString = ptId.toString();
        const ptObjectId = new mongoose.Types.ObjectId(ptId);

        console.log('\n🔍 Querying BuoiTap with:');
        console.log('  ptId:', ptId);
        console.log('  ptIdString:', ptIdString);
        console.log('  ptObjectId:', ptObjectId);

        const buoiTaps = await BuoiTap.find({
            $or: [
                { ptPhuTrach: ptId },
                { ptPhuTrach: ptObjectId },
                { ptPhuTrach: ptIdString }
            ]
        })
            .select('_id tenBuoiTap ptPhuTrach ngayTap')
            .lean();

        console.log('\n📊 BuoiTaps found:', buoiTaps.length);
        if (buoiTaps.length > 0) {
            console.log('  Sample BuoiTap:');
            buoiTaps.slice(0, 3).forEach((bt, idx) => {
                console.log(`    ${idx + 1}. ${bt.tenBuoiTap} (${bt._id})`);
                console.log(`       ptPhuTrach: ${bt.ptPhuTrach} (type: ${typeof bt.ptPhuTrach})`);
                console.log(`       ngayTap: ${bt.ngayTap}`);
            });
        }

        const buoiTapIds = buoiTaps.map(bt => bt._id);
        console.log('\n📝 BuoiTapIds:', buoiTapIds.length, 'ids');

        // Tìm SessionReview
        const allSessionReviews = await SessionReview.find({
            buoiTapId: { $in: buoiTapIds }
        })
            .populate('buoiTapId', 'tenBuoiTap ptPhuTrach')
            .populate('hoiVienId', 'hoTen')
            .lean();

        console.log('\n⭐ Total SessionReviews:', allSessionReviews.length);
        if (allSessionReviews.length > 0) {
            console.log('  Sample SessionReviews:');
            allSessionReviews.slice(0, 5).forEach((sr, idx) => {
                console.log(`    ${idx + 1}. BuoiTap: ${sr.buoiTapId?.tenBuoiTap || 'N/A'}`);
                console.log(`       HoiVien: ${sr.hoiVienId?.hoTen || 'N/A'}`);
                console.log(`       ptRating: ${sr.ptRating} (type: ${typeof sr.ptRating})`);
                console.log(`       branchRating: ${sr.branchRating}`);
                console.log(`       ptComment: ${sr.ptComment || '(empty)'}`);
                console.log(`       isCompleted: ${sr.isCompleted}`);
            });
        }

        const reviewsWithPTRating = allSessionReviews.filter(sr =>
            sr.ptRating !== null && sr.ptRating !== undefined
        );
        console.log('\n✅ SessionReviews with ptRating:', reviewsWithPTRating.length);

        const reviewsWithBranchRating = allSessionReviews.filter(sr =>
            sr.branchRating !== null && sr.branchRating !== undefined
        );
        console.log('🏢 SessionReviews with branchRating:', reviewsWithBranchRating.length);

        const completedReviews = allSessionReviews.filter(sr => sr.isCompleted);
        console.log('✔️  Completed reviews:', completedReviews.length);

    } catch (err) {
        console.error('❌ Lỗi:', err);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 DB disconnected');
    }
})();

