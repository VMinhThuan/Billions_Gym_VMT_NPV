const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const ThucDon = require('../src/models/ThucDon');

async function checkUniqueMeals() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Đã kết nối MongoDB\n');

        const thucDonList = await ThucDon.find({ trangThai: 'DANG_SU_DUNG' });

        console.log(`📊 Tìm thấy ${thucDonList.length} thực đơn\n`);

        const uniqueMeals = new Set();
        const mealDetails = [];

        thucDonList.forEach((thucDon, index) => {
            console.log(`\n=== Thực đơn ${index + 1} ===`);
            console.log(`Từ ngày: ${thucDon.ngayBatDau.toLocaleDateString('vi-VN')}`);
            console.log(`Đến ngày: ${thucDon.ngayKetThuc.toLocaleDateString('vi-VN')}`);
            console.log(`Số ngày: ${thucDon.thucDonChiTiet.length}`);

            thucDon.thucDonChiTiet.forEach((ngay, dayIndex) => {
                const allMealsInDay = [
                    ...(ngay.buaSang || []),
                    ...(ngay.buaTrua || []),
                    ...(ngay.buaChieu || []),
                    ...(ngay.buaToi || [])
                ];

                console.log(`  Ngày ${dayIndex + 1}: ${allMealsInDay.length} bữa`);

                allMealsInDay.forEach(meal => {
                    if (meal.tenMonAn) {
                        uniqueMeals.add(meal.tenMonAn);
                        if (!mealDetails.find(m => m.name === meal.tenMonAn)) {
                            mealDetails.push({
                                name: meal.tenMonAn,
                                rating: meal.danhGia,
                                type: meal.loaiMonAn
                            });
                        }
                    }
                });
            });
        });

        console.log('\n\n📋 === KẾT QUẢ THỐNG KÊ ===\n');
        console.log(`Tổng số món ăn UNIQUE: ${uniqueMeals.size}`);
        console.log('\nDanh sách các món ăn:');
        mealDetails.forEach((meal, i) => {
            console.log(`${i + 1}. ${meal.name} (Loại: ${meal.type}, Rating: ${meal.rating})`);
        });

    } catch (error) {
        console.error('❌ Lỗi:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n✓ Đã đóng kết nối MongoDB');
    }
}

checkUniqueMeals();
