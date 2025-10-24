/*
  Seed 10 chi nhánh tại TP.HCM
  Chạy: node scripts/seedChiNhanh.js
*/
require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');

// Kết nối model
const ChiNhanh = require(path.join(__dirname, '..', 'src', 'models', 'ChiNhanh'));

async function main() {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
        console.error('MONGODB_URI chưa được cấu hình trong .env');
        process.exit(1);
    }

    await mongoose.connect(mongoUri);

    const branches = [
        {
            tenChiNhanh: 'Billions Q1 - Nguyễn Huệ',
            diaChi: '22 Nguyễn Huệ, Quận 1, TP.HCM',
            soDienThoai: '028-1111-0001',
            location: { type: 'Point', coordinates: [106.703597, 10.775658] },
            thuTu: 1,
        },
        {
            tenChiNhanh: 'Billions Q3 - Võ Thị Sáu',
            diaChi: '150 Võ Thị Sáu, Quận 3, TP.HCM',
            soDienThoai: '028-1111-0003',
            location: { type: 'Point', coordinates: [106.686729, 10.786733] },
            thuTu: 2,
        },
        {
            tenChiNhanh: 'Billions Q5 - Trần Hưng Đạo',
            diaChi: '350 Trần Hưng Đạo, Quận 5, TP.HCM',
            soDienThoai: '028-1111-0005',
            location: { type: 'Point', coordinates: [106.666389, 10.754944] },
            thuTu: 3,
        },
        {
            tenChiNhanh: 'Billions Q7 - Phú Mỹ Hưng',
            diaChi: 'Tân Phú, Quận 7, TP.HCM',
            soDienThoai: '028-1111-0007',
            location: { type: 'Point', coordinates: [106.721478, 10.732537] },
            thuTu: 4,
        },
        {
            tenChiNhanh: 'Billions Q10 - 3/2',
            diaChi: '600 Đường 3/2, Quận 10, TP.HCM',
            soDienThoai: '028-1111-0010',
            location: { type: 'Point', coordinates: [106.667953, 10.77277] },
            thuTu: 5,
        },
        {
            tenChiNhanh: 'Billions Q11 - Lạc Long Quân',
            diaChi: '800 Lạc Long Quân, Quận 11, TP.HCM',
            soDienThoai: '028-1111-0011',
            location: { type: 'Point', coordinates: [106.642159, 10.764893] },
            thuTu: 6,
        },
        {
            tenChiNhanh: 'Billions Bình Thạnh - Điện Biên Phủ',
            diaChi: '700 Điện Biên Phủ, Bình Thạnh, TP.HCM',
            soDienThoai: '028-1111-0012',
            location: { type: 'Point', coordinates: [106.710593, 10.80036] },
            thuTu: 7,
        },
        {
            tenChiNhanh: 'Billions Phú Nhuận - Phan Xích Long',
            diaChi: '180 Phan Xích Long, Phú Nhuận, TP.HCM',
            soDienThoai: '028-1111-0013',
            location: { type: 'Point', coordinates: [106.68171, 10.80086] },
            thuTu: 8,
        },
        {
            tenChiNhanh: 'Billions Tân Bình - Cộng Hòa',
            diaChi: '400 Cộng Hòa, Tân Bình, TP.HCM',
            soDienThoai: '028-1111-0014',
            location: { type: 'Point', coordinates: [106.650781, 10.80187] },
            thuTu: 9,
        },
        {
            tenChiNhanh: 'Billions TP Thủ Đức - Xa Lộ Hà Nội',
            diaChi: 'Xa Lộ Hà Nội, TP Thủ Đức, TP.HCM',
            soDienThoai: '028-1111-0015',
            location: { type: 'Point', coordinates: [106.752246, 10.848059] },
            thuTu: 10,
        },
    ];

    let upserted = 0;
    for (const b of branches) {
        await ChiNhanh.updateOne(
            { tenChiNhanh: b.tenChiNhanh },
            { $set: b },
            { upsert: true }
        );
        upserted += 1;
    }

    console.log(`Đã seed/ cập nhật ${upserted} chi nhánh.`);
    await mongoose.disconnect();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});


