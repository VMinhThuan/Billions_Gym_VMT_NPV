const mongoose = require('mongoose');
require('dotenv').config();

// Import model
const GoiTap = require('../src/models/GoiTap');

// Kết nối MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('✅ Đã kết nối MongoDB');
        updateMissingPackageBenefits();
    })
    .catch(err => {
        console.error('❌ Lỗi kết nối MongoDB:', err);
        process.exit(1);
    });

// Quyền lợi cho gói 299.000đ (Gói 1 tháng)
const missingPackageBenefits = {
    'Gói 1 tháng': [
        { tenQuyenLoi: 'Truy cập hàng ngày', moTa: 'Tất cả ngày trong tháng', icon: '📅', loai: 'co_ban' },
        { tenQuyenLoi: 'Dụng cụ cardio & máy cơ bản', moTa: 'Máy chạy bộ, xe đạp, tạ đơn', icon: '🏋️', loai: 'co_ban' },
        { tenQuyenLoi: 'Khu vực tập chung', moTa: 'Không gian tập luyện cơ bản', icon: '🏢', loai: 'co_ban' },
        { tenQuyenLoi: 'Không PT riêng', moTa: 'Tự tập không hướng dẫn', icon: '👤', loai: 'co_ban' },
        { tenQuyenLoi: 'Không xông hơi', moTa: 'Chỉ sử dụng phòng tập', icon: '🚫', loai: 'co_ban' }
    ]
};

async function updateMissingPackageBenefits() {
    try {
        console.log('🔄 Bắt đầu bổ sung quyền lợi cho gói tập còn thiếu...');

        for (const [packageName, benefits] of Object.entries(missingPackageBenefits)) {
            // Tìm gói tập theo tên
            const packageToUpdate = await GoiTap.findOne({ tenGoiTap: packageName });

            if (packageToUpdate) {
                // Cập nhật quyền lợi
                packageToUpdate.quyenLoi = benefits;
                await packageToUpdate.save();

                console.log(`✅ Đã bổ sung quyền lợi cho: ${packageName} (${benefits.length} quyền lợi)`);
                console.log(`   💰 Giá: ${packageToUpdate.donGia.toLocaleString('vi-VN')}đ`);
            } else {
                console.log(`⚠️  Không tìm thấy gói tập: ${packageName}`);
            }
        }

        console.log('🎉 Hoàn thành bổ sung quyền lợi!');

        // Hiển thị thống kê tổng
        const totalPackages = await GoiTap.countDocuments({ quyenLoi: { $exists: true, $ne: [] } });
        const packagesWithoutBenefits = await GoiTap.countDocuments({
            $or: [
                { quyenLoi: { $exists: false } },
                { quyenLoi: { $size: 0 } }
            ]
        });

        console.log(`📊 Tổng số gói tập đã có quyền lợi: ${totalPackages}`);
        console.log(`📊 Số gói tập chưa có quyền lợi: ${packagesWithoutBenefits}`);

        // Hiển thị danh sách gói tập chưa có quyền lợi
        if (packagesWithoutBenefits > 0) {
            console.log('\n📋 Danh sách gói tập chưa có quyền lợi:');
            const packagesWithoutBenefitsList = await GoiTap.find({
                $or: [
                    { quyenLoi: { $exists: false } },
                    { quyenLoi: { $size: 0 } }
                ]
            }, 'tenGoiTap donGia');

            packagesWithoutBenefitsList.forEach(pkg => {
                console.log(`   - ${pkg.tenGoiTap}: ${pkg.donGia.toLocaleString('vi-VN')}đ`);
            });
        }

    } catch (error) {
        console.error('❌ Lỗi khi bổ sung quyền lợi:', error);
    } finally {
        mongoose.connection.close();
        console.log('🔌 Đã đóng kết nối MongoDB');
    }
}
