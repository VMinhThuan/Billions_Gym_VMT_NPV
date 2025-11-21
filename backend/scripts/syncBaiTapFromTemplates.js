const mongoose = require('mongoose');
require('dotenv').config();

const BuoiTap = require('../src/models/BuoiTap');
const TemplateBuoiTap = require('../src/models/TemplateBuoiTap');

async function syncBaiTapFromTemplates() {
    try {
        console.log('🚀 Bắt đầu sync baiTap từ TemplateBuoiTap sang BuoiTap...\n');

        // Lấy tất cả templates
        const templates = await TemplateBuoiTap.find();
        console.log(`📚 Tìm thấy ${templates.length} templates\n`);

        if (templates.length === 0) {
            console.log('⚠️  Không có template nào trong database');
            return;
        }

        let totalUpdated = 0;
        let totalSkipped = 0;

        // Với mỗi template
        for (const template of templates) {
            console.log(`\n📝 Xử lý template: "${template.ten}"`);
            console.log(`   - Template ID: ${template._id}`);
            console.log(`   - Số bài tập trong template: ${template.baiTap?.length || 0}`);

            if (!template.baiTap || template.baiTap.length === 0) {
                console.log(`   ⚠️  Template này chưa có baiTap, bỏ qua`);
                totalSkipped++;
                continue;
            }

            // Tìm tất cả BuoiTap có tenBuoiTap khớp với template.ten
            const matchingBuoiTaps = await BuoiTap.find({
                tenBuoiTap: template.ten
            });

            console.log(`   🔍 Tìm thấy ${matchingBuoiTaps.length} BuoiTap có tên "${template.ten}"`);

            if (matchingBuoiTaps.length === 0) {
                console.log(`   ℹ️  Không có BuoiTap nào khớp với template này`);
                totalSkipped++;
                continue;
            }

            // Cập nhật baiTap cho tất cả BuoiTap khớp
            const updateResult = await BuoiTap.updateMany(
                { tenBuoiTap: template.ten },
                { $set: { baiTap: template.baiTap } }
            );

            console.log(`   ✅ Đã cập nhật ${updateResult.modifiedCount} BuoiTap với ${template.baiTap.length} bài tập`);
            totalUpdated += updateResult.modifiedCount;

            // Log một vài ví dụ
            if (matchingBuoiTaps.length > 0) {
                const sampleBuoiTap = matchingBuoiTaps[0];
                console.log(`   📋 Ví dụ BuoiTap đã cập nhật:`);
                console.log(`      - ID: ${sampleBuoiTap._id}`);
                console.log(`      - Tên: ${sampleBuoiTap.tenBuoiTap}`);
                console.log(`      - Ngày tập: ${sampleBuoiTap.ngayTap}`);
                console.log(`      - Giờ: ${sampleBuoiTap.gioBatDau} - ${sampleBuoiTap.gioKetThuc}`);
            }
        }

        console.log(`\n🎉 Hoàn tất sync baiTap!`);
        console.log(`📊 Tổng kết:`);
        console.log(`   - Tổng số templates: ${templates.length}`);
        console.log(`   - Số BuoiTap đã cập nhật: ${totalUpdated}`);
        console.log(`   - Số templates bị bỏ qua: ${totalSkipped}`);

        // Thống kê chi tiết
        const allBuoiTaps = await BuoiTap.find();
        const buoiTapsWithBaiTap = allBuoiTaps.filter(bt => bt.baiTap && bt.baiTap.length > 0);
        const buoiTapsWithoutBaiTap = allBuoiTaps.filter(bt => !bt.baiTap || bt.baiTap.length === 0);

        console.log(`\n📈 Thống kê BuoiTap:`);
        console.log(`   - Tổng số BuoiTap: ${allBuoiTaps.length}`);
        console.log(`   - BuoiTap có baiTap: ${buoiTapsWithBaiTap.length}`);
        console.log(`   - BuoiTap chưa có baiTap: ${buoiTapsWithoutBaiTap.length}`);

        if (buoiTapsWithoutBaiTap.length > 0) {
            console.log(`\n⚠️  Các BuoiTap chưa có baiTap (mẫu 10 đầu tiên):`);
            const uniqueNames = [...new Set(buoiTapsWithoutBaiTap.slice(0, 10).map(bt => bt.tenBuoiTap))];
            uniqueNames.forEach(name => {
                console.log(`   - "${name}"`);
            });
        }

    } catch (error) {
        console.error('❌ Lỗi khi sync baiTap:', error);
        throw error;
    }
}

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('🔌 Đã kết nối MongoDB\n');

        await syncBaiTapFromTemplates();

        await mongoose.disconnect();
        console.log('\n✅ Đã ngắt kết nối MongoDB');
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

run();

