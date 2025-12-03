require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');

const GoiTap = require(path.join(__dirname, '..', 'src', 'models', 'GoiTap'));

const TRIAL_PACKAGE_NAME = 'Gói thử 5 phút';

async function main() {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
        console.error('⚠️  MONGODB_URI chưa được cấu hình trong file .env');
        process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('🔌 Đã kết nối MongoDB');

    const data = {
        tenGoiTap: TRIAL_PACKAGE_NAME,
        moTa: 'Gói trải nghiệm nhanh trong 5 phút để kiểm tra quy trình check-in/check-out.',
        donGia: 50000,
        giaGoc: 50000,
        thoiHan: 5,
        donViThoiHan: 'Phut',
        loaiThoiHan: 'TinhTheoNgay',
        soLuongNguoiThamGia: 1,
        loaiGoiTap: 'CaNhan',
        popular: false,
        kichHoat: true,
        quyenLoi: [
            {
                tenQuyenLoi: 'Trải nghiệm nhanh',
                moTa: 'Dùng thử đầy đủ quy trình trong 5 phút',
                icon: '⚡',
                loai: 'co_ban'
            },
            {
                tenQuyenLoi: 'Hỗ trợ check-in',
                moTa: 'Nhân viên hỗ trợ kiểm tra hệ thống',
                icon: '🤖',
                loai: 'co_ban'
            }
        ]
    };

    const result = await GoiTap.findOneAndUpdate(
        { tenGoiTap: TRIAL_PACKAGE_NAME },
        { $set: data },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log('✅ Đã thêm/cập nhật gói tập thử:', result.tenGoiTap);
    console.log(`   - Thời hạn: ${result.thoiHan} ${result.donViThoiHan}`);
    console.log(`   - Giá: ${result.donGia.toLocaleString('vi-VN')}đ`);

    await mongoose.disconnect();
    process.exit(0);
}

main().catch(error => {
    console.error('❌ Lỗi khi thêm gói tập thử:', error);
    process.exit(1);
});

