const mongoose = require('mongoose');
require('dotenv').config();

// Import model
const GoiTap = require('../src/models/GoiTap');

// Kết nối MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('✅ Đã kết nối MongoDB');
        updatePackageBenefits();
    })
    .catch(err => {
        console.error('❌ Lỗi kết nối MongoDB:', err);
        process.exit(1);
    });

// Dữ liệu quyền lợi cho từng gói
const packageBenefits = {
    // Gói 1: Gói Trải Nghiệm 7 Ngày - 199.000đ
    'Gói Trải Nghiệm 7 Ngày': [
        { tenQuyenLoi: 'Truy cập khu tập cơ bản', moTa: 'Giờ hành chính (8h-18h)', icon: '🏋️', loai: 'co_ban' },
        { tenQuyenLoi: 'Dụng cụ cardio cơ bản', moTa: 'Máy chạy bộ, xe đạp tập', icon: '🚴', loai: 'co_ban' },
        { tenQuyenLoi: 'Không sử dụng phòng tắm', moTa: 'Chỉ sử dụng toilet', icon: '🚫', loai: 'co_ban' },
        { tenQuyenLoi: 'Không có PT', moTa: 'Tự tập không hướng dẫn', icon: '👤', loai: 'co_ban' }
    ],

    // Gói 2: Weekend Gym - 300.000đ
    'Weekend Gym': [
        { tenQuyenLoi: 'Tập cuối tuần', moTa: 'Chỉ Thứ 7 & Chủ nhật', icon: '📅', loai: 'co_ban' },
        { tenQuyenLoi: 'Truy cập khu tập chung', moTa: 'Toàn bộ khu vực tập', icon: '🏋️', loai: 'co_ban' },
        { tenQuyenLoi: 'Locker dùng chung', moTa: 'Không cố định', icon: '🔒', loai: 'co_ban' },
        { tenQuyenLoi: 'Không có PT', moTa: 'Tự tập không hướng dẫn', icon: '👤', loai: 'co_ban' }
    ],

    // Gói 3: Gói 1 Tháng - 299.000đ
    'Gói 1 Tháng': [
        { tenQuyenLoi: 'Truy cập hàng ngày', moTa: 'Tất cả ngày trong tháng', icon: '📅', loai: 'co_ban' },
        { tenQuyenLoi: 'Dụng cụ cardio & máy cơ bản', moTa: 'Máy tập đầy đủ', icon: '🏋️', loai: 'co_ban' },
        { tenQuyenLoi: 'Không PT riêng', moTa: 'Tự tập không hướng dẫn', icon: '👤', loai: 'co_ban' },
        { tenQuyenLoi: 'Không xông hơi', moTa: 'Chỉ sử dụng phòng tập', icon: '🚫', loai: 'co_ban' }
    ],

    // Gói 4: Gói Student 1 Tháng - 500.000đ
    'Gói Student 1 Tháng': [
        { tenQuyenLoi: 'Truy cập toàn bộ khu tập', moTa: 'Tất cả khu vực', icon: '🏋️', loai: 'co_ban' },
        { tenQuyenLoi: 'Locker cá nhân', moTa: 'Cố định trong tháng', icon: '🔒', loai: 'co_ban' },
        { tenQuyenLoi: 'Giờ tập linh hoạt', moTa: '5h-22h hàng ngày', icon: '⏰', loai: 'co_ban' },
        { tenQuyenLoi: 'Giảm giá gói 3 tháng', moTa: 'Ưu đãi sinh viên', icon: '🎓', loai: 'co_ban' }
    ],

    // Gói 5: Morning Fitness - 450.000đ
    'Morning Fitness': [
        { tenQuyenLoi: 'Tập sáng sớm', moTa: '5h-10h sáng', icon: '🌅', loai: 'co_ban' },
        { tenQuyenLoi: 'Truy cập khu tập chính', moTa: 'Toàn bộ khu vực', icon: '🏋️', loai: 'co_ban' },
        { tenQuyenLoi: '1 buổi hướng dẫn ban đầu', moTa: 'Tư vấn tập luyện', icon: '👨‍🏫', loai: 'co_ban' },
        { tenQuyenLoi: 'Không PT định kỳ', moTa: 'Chỉ hướng dẫn 1 lần', icon: '👤', loai: 'co_ban' }
    ],

    // Gói 6: Gói Cơ Bản 1 Tháng - 800.000đ
    'Gói Cơ Bản 1 Tháng': [
        { tenQuyenLoi: 'Truy cập toàn bộ khu tập', moTa: 'Tất cả khu vực', icon: '🏋️', loai: 'co_ban' },
        { tenQuyenLoi: 'Locker cá nhân', moTa: 'Cố định trong tháng', icon: '🔒', loai: 'co_ban' },
        { tenQuyenLoi: 'Phòng tắm nước nóng', moTa: 'Sử dụng thoải mái', icon: '🚿', loai: 'co_ban' },
        { tenQuyenLoi: '1 buổi PT định hướng', moTa: 'Tư vấn chương trình tập', icon: '👨‍🏫', loai: 'co_ban' }
    ],

    // Gói 7: Gói Tiết Kiệm 3 Tháng - 2.100.000đ
    'Gói Tiết Kiệm 3 Tháng': [
        { tenQuyenLoi: 'Truy cập full 3 tháng', moTa: 'Không giới hạn', icon: '📅', loai: 'cao_cap' },
        { tenQuyenLoi: '2 buổi PT miễn phí', moTa: 'Hướng dẫn chuyên nghiệp', icon: '👨‍🏫', loai: 'cao_cap' },
        { tenQuyenLoi: 'Xông hơi khô', moTa: 'Sử dụng không giới hạn', icon: '🧖‍♂️', loai: 'cao_cap' },
        { tenQuyenLoi: 'Ưu tiên đăng ký lớp nhóm', moTa: 'Đặt chỗ trước', icon: '⭐', loai: 'cao_cap' }
    ],

    // Gói 8: Gói Personal Trainer 10 Buổi - 3.500.000đ
    'Gói Personal Trainer 10 Buổi': [
        { tenQuyenLoi: '10 buổi tập cùng PT', moTa: 'Huấn luyện cá nhân', icon: '👨‍🏫', loai: 'cao_cap' },
        { tenQuyenLoi: 'Chương trình tập cá nhân hóa', moTa: 'Theo mục tiêu riêng', icon: '📋', loai: 'cao_cap' },
        { tenQuyenLoi: 'Tư vấn dinh dưỡng cơ bản', moTa: 'Kế hoạch ăn uống', icon: '🥗', loai: 'cao_cap' },
        { tenQuyenLoi: 'Theo dõi tiến độ qua app', moTa: 'Báo cáo chi tiết', icon: '📱', loai: 'cao_cap' }
    ],

    // Gói 9: Gói Premium 6 Tháng - 5.500.000đ
    'Gói Premium 6 Tháng': [
        { tenQuyenLoi: 'Toàn bộ tiện ích phòng tập', moTa: 'Không giới hạn', icon: '🏋️', loai: 'vip' },
        { tenQuyenLoi: 'PT định kỳ 1 lần/tuần', moTa: '24 buổi trong 6 tháng', icon: '👨‍🏫', loai: 'vip' },
        { tenQuyenLoi: 'Dinh dưỡng nâng cao', moTa: 'Kế hoạch chi tiết', icon: '🥗', loai: 'vip' },
        { tenQuyenLoi: 'Đo InBody miễn phí hàng tháng', moTa: 'Theo dõi thành phần cơ thể', icon: '📊', loai: 'vip' },
        { tenQuyenLoi: 'Xông hơi khô & ướt', moTa: 'Sử dụng không giới hạn', icon: '🧖‍♂️', loai: 'vip' }
    ],

    // Gói 10: Gói VIP 12 Tháng - 9.900.000đ
    'Gói VIP 12 Tháng': [
        { tenQuyenLoi: 'Toàn quyền sử dụng khu tập', moTa: 'Không giới hạn', icon: '🏋️', loai: 'vip' },
        { tenQuyenLoi: 'Phòng xông hơi VIP', moTa: 'Khu vực riêng biệt', icon: '🧖‍♂️', loai: 'vip' },
        { tenQuyenLoi: '2 buổi massage/tháng', moTa: 'Thư giãn chuyên nghiệp', icon: '💆‍♂️', loai: 'vip' },
        { tenQuyenLoi: '8 buổi PT/năm', moTa: 'Huấn luyện cá nhân', icon: '👨‍🏫', loai: 'vip' },
        { tenQuyenLoi: 'Khăn tập & nước suối miễn phí', moTa: 'Hỗ trợ đầy đủ', icon: '🧴', loai: 'vip' },
        { tenQuyenLoi: 'Ưu tiên đặt lịch lớp nhóm', moTa: 'Đặt chỗ trước', icon: '⭐', loai: 'vip' }
    ],

    // Gói 11: Gói Family Couple 12 Tháng - 17.500.000đ
    'Gói Family Couple 12 Tháng': [
        { tenQuyenLoi: '2 người tập song song', moTa: 'Cặp đôi cùng tập', icon: '👫', loai: 'premium' },
        { tenQuyenLoi: 'Tất cả quyền lợi VIP 12 tháng', moTa: 'Đầy đủ tiện ích', icon: '👑', loai: 'premium' },
        { tenQuyenLoi: 'Dinh dưỡng cặp đôi', moTa: 'Kế hoạch ăn uống chung', icon: '🥗', loai: 'premium' },
        { tenQuyenLoi: 'Giảm 10% khi gia hạn', moTa: 'Ưu đãi dài hạn', icon: '💰', loai: 'premium' },
        { tenQuyenLoi: 'Ưu tiên hỗ trợ PT', moTa: 'Hướng dẫn chuyên biệt', icon: '👨‍🏫', loai: 'premium' }
    ],

    // Gói 12: Gói Lifetime VIP - 49.000.000đ
    'Gói Lifetime VIP': [
        { tenQuyenLoi: 'Truy cập trọn đời', moTa: 'Không giới hạn thời gian', icon: '♾️', loai: 'premium' },
        { tenQuyenLoi: 'PT riêng cố định', moTa: 'Huấn luyện viên riêng', icon: '👨‍🏫', loai: 'premium' },
        { tenQuyenLoi: 'Chuyên gia dinh dưỡng', moTa: 'Tư vấn chuyên sâu', icon: '🥗', loai: 'premium' },
        { tenQuyenLoi: 'Theo dõi sức khỏe AI', moTa: 'Công nghệ tiên tiến', icon: '🤖', loai: 'premium' },
        { tenQuyenLoi: 'Phòng thay đồ riêng', moTa: 'Khu vực VIP riêng biệt', icon: '🚿', loai: 'premium' },
        { tenQuyenLoi: 'Massage + spa miễn phí', moTa: 'Thư giãn không giới hạn', icon: '💆‍♂️', loai: 'premium' },
        { tenQuyenLoi: 'Hỗ trợ 24/7', moTa: 'Dịch vụ toàn hệ thống', icon: '🆘', loai: 'premium' }
    ]
};

async function updatePackageBenefits() {
    try {
        console.log('🔄 Bắt đầu cập nhật quyền lợi cho các gói tập...');

        for (const [packageName, benefits] of Object.entries(packageBenefits)) {
            // Tìm gói tập theo tên
            const packageToUpdate = await GoiTap.findOne({ tenGoiTap: packageName });

            if (packageToUpdate) {
                // Cập nhật quyền lợi
                packageToUpdate.quyenLoi = benefits;
                await packageToUpdate.save();

                console.log(`✅ Đã cập nhật quyền lợi cho: ${packageName} (${benefits.length} quyền lợi)`);
            } else {
                console.log(`⚠️  Không tìm thấy gói tập: ${packageName}`);
            }
        }

        console.log('🎉 Hoàn thành cập nhật quyền lợi cho tất cả gói tập!');

        // Hiển thị thống kê
        const totalPackages = await GoiTap.countDocuments({ quyenLoi: { $exists: true, $ne: [] } });
        console.log(`📊 Tổng số gói tập đã có quyền lợi: ${totalPackages}`);

    } catch (error) {
        console.error('❌ Lỗi khi cập nhật quyền lợi:', error);
    } finally {
        mongoose.connection.close();
        console.log('🔌 Đã đóng kết nối MongoDB');
    }
}
