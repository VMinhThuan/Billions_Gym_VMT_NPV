const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const BuoiTap = require('../src/models/BuoiTap');
const ChiNhanh = require('../src/models/ChiNhanh');
const { PT } = require('../src/models/NguoiDung');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        seedBuoiTap();
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

async function seedBuoiTap() {
    try {
        console.log('🌱 Starting to seed BuoiTap data...');

        // Lấy chi nhánh đầu tiên
        const chiNhanh = await ChiNhanh.findOne();
        if (!chiNhanh) {
            console.error('❌ No chi nhánh found. Please seed chi nhánh first.');
            return;
        }

        // Lấy PT đầu tiên thuộc chi nhánh này
        const pt = await PT.findOne({ chinhanh: chiNhanh._id });
        if (!pt) {
            console.error('❌ No PT found for this chi nhánh. Please seed PT data first.');
            return;
        }

        console.log(`📍 Using chi nhánh: ${chiNhanh.tenChiNhanh}`);
        console.log(`👨‍💼 Using PT: ${pt.hoTen}`);

        // Tạo buổi tập cho tuần hiện tại
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Thứ 2

        const buoiTaps = [];

        // Tạo buổi tập cho 7 ngày trong tuần
        for (let day = 0; day < 7; day++) {
            const currentDay = new Date(startOfWeek);
            currentDay.setDate(startOfWeek.getDate() + day);

            // Tạo 3 buổi tập mỗi ngày: sáng, chiều, tối
            const timeSlots = [
                { start: '06:00', end: '08:00', name: 'Buổi sáng' },
                { start: '14:00', end: '16:00', name: 'Buổi chiều' },
                { start: '18:00', end: '20:00', name: 'Buổi tối' }
            ];

            for (const slot of timeSlots) {
                const buoiTap = new BuoiTap({
                    tenBuoiTap: `${slot.name} - ${currentDay.toLocaleDateString('vi-VN')}`,
                    chiNhanh: chiNhanh._id,
                    ptPhuTrach: pt._id,
                    ngayTap: currentDay,
                    gioBatDau: slot.start,
                    gioKetThuc: slot.end,
                    soLuongToiDa: 10,
                    soLuongHienTai: Math.floor(Math.random() * 8), // Random 0-7
                    trangThai: 'CHUAN_BI',
                    danhSachHoiVien: [],
                    moTa: `Buổi tập ${slot.name} tại ${chiNhanh.tenChiNhanh}`,
                    ghiChu: `PT: ${pt.hoTen} - Chuyên môn: ${pt.chuyenMon}`
                });

                buoiTaps.push(buoiTap);
            }
        }

        // Xóa dữ liệu cũ nếu có
        await BuoiTap.deleteMany({ chiNhanh: chiNhanh._id });
        console.log('🗑️ Cleared existing BuoiTap data for this chi nhánh');

        // Lưu dữ liệu mới
        const savedBuoiTaps = await BuoiTap.insertMany(buoiTaps);
        console.log(`✅ Successfully created ${savedBuoiTaps.length} BuoiTap records`);

        // Hiển thị thống kê
        const stats = {
            total: savedBuoiTaps.length,
            byDay: {},
            byTime: {}
        };

        savedBuoiTaps.forEach(buoi => {
            const dayName = buoi.ngayTap.toLocaleDateString('vi-VN', { weekday: 'long' });
            const timeSlot = `${buoi.gioBatDau}-${buoi.gioKetThuc}`;

            stats.byDay[dayName] = (stats.byDay[dayName] || 0) + 1;
            stats.byTime[timeSlot] = (stats.byTime[timeSlot] || 0) + 1;
        });

        console.log('\n📊 Statistics:');
        console.log('By Day:', stats.byDay);
        console.log('By Time:', stats.byTime);

        console.log('\n🎉 BuoiTap seeding completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding BuoiTap:', error);
        process.exit(1);
    }
}
