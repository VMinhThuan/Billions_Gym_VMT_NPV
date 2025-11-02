const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const ThucDon = require('../src/models/ThucDon');
const { HoiVien } = require('../src/models/NguoiDung');

const sampleMeals = [
    {
        tenMonAn: 'Gà nướng với cơm gạo lứt',
        moTa: 'Ức gà nướng giàu protein kèm cơm gạo lứt và rau củ',
        hinhAnh: 'https://images.unsplash.com/photo-1646809156467-6e825869b29f?q=80&w=1170&auto=format&fit=crop',
        congThucNauAn: `
1. Ướp ức gà với muối, tiêu, tỏi băm, dầu ô liu trong 30 phút
2. Nướng gà ở 180°C trong 25-30 phút cho đến khi chín vàng
3. Nấu cơm gạo lứt theo hướng dẫn
4. Luộc/hấp rau củ (bông cải xanh, cà rốt)
5. Bày món và thưởng thức
        `.trim(),
        loaiMonAn: 'TRUA',
        thoiGianNau: 45,
        danhSachNguyenLieu: [
            { tenNguyenLieu: 'Ức gà', soLuong: 150, donVi: 'gram' },
            { tenNguyenLieu: 'Cơm gạo lứt', soLuong: 100, donVi: 'gram' },
            { tenNguyenLieu: 'Bông cải xanh', soLuong: 80, donVi: 'gram' },
            { tenNguyenLieu: 'Cà rốt', soLuong: 50, donVi: 'gram' },
            { tenNguyenLieu: 'Dầu ô liu', soLuong: 10, donVi: 'ml' }
        ],
        thongTinDinhDuong: {
            calories: 450,
            protein: 35,
            carbohydrate: 45,
            fat: 12,
            fiber: 6,
            duong: 2,
            natri: 350,
            canxi: 45,
            sat: 2.5,
            vitaminC: 35,
            vitaminD: 0
        },
        phanKhuc: 1,
        danhGia: 5,
        mucDoKho: 'DE'
    },
    {
        tenMonAn: 'Cá hồi nướng với rau củ',
        moTa: 'Phi lê cá hồi giàu omega-3 kèm rau củ hấp và khoai tây',
        hinhAnh: 'https://images.unsplash.com/photo-1661081090288-fd8ffc486dd7?q=80&w=1170&auto=format&fit=crop',
        congThucNauAn: `
1. Ướp cá hồi với chanh, muối, tiêu trong 20 phút
2. Nướng cá ở 200°C trong 15-20 phút
3. Hấp các loại rau củ (bông cải, súp lơ, cà rốt)
4. Luộc khoai tây và nghiền nhẹ
5. Sắp xếp đĩa và trang trí với chanh
        `.trim(),
        loaiMonAn: 'TOI',
        thoiGianNau: 40,
        danhSachNguyenLieu: [
            { tenNguyenLieu: 'Phi lê cá hồi', soLuong: 150, donVi: 'gram' },
            { tenNguyenLieu: 'Bông cải xanh', soLuong: 100, donVi: 'gram' },
            { tenNguyenLieu: 'Súp lơ', soLuong: 80, donVi: 'gram' },
            { tenNguyenLieu: 'Khoai tây', soLuong: 100, donVi: 'gram' },
            { tenNguyenLieu: 'Chanh', soLuong: 1, donVi: 'quả' }
        ],
        thongTinDinhDuong: {
            calories: 420,
            protein: 32,
            carbohydrate: 28,
            fat: 20,
            fiber: 7,
            duong: 4,
            natri: 320,
            canxi: 55,
            sat: 1.8,
            vitaminC: 65,
            vitaminD: 450
        },
        phanKhuc: 1,
        danhGia: 5,
        mucDoKho: 'TRUNG_BINH'
    },
    {
        tenMonAn: 'Bát cơm thịt bò xào rau củ',
        moTa: 'Thịt bò nạc xào với nhiều loại rau củ và cơm gạo lứt',
        hinhAnh: 'https://img.taste.com.au/HYj36Q1G/w1200-h675-cfill-q80/taste/2016/11/middle-eastern-lamb-koftas-with-aromatic-lentil-rice-106574-1.jpeg',
        congThucNauAn: `
1. Thái thịt bò nạc thành miếng vừa ăn, ướp gia vị
2. Xào thịt bò trên lửa lớn cho săn lại
3. Thêm rau củ (ớt chuông, hành tây, cà rốt) xào chung
4. Nấu cơm gạo lứt
5. Cho thịt bò xào lên cơm và thưởng thức
        `.trim(),
        loaiMonAn: 'TRUA',
        thoiGianNau: 35,
        danhSachNguyenLieu: [
            { tenNguyenLieu: 'Thịt bò nạc', soLuong: 120, donVi: 'gram' },
            { tenNguyenLieu: 'Cơm gạo lứt', soLuong: 100, donVi: 'gram' },
            { tenNguyenLieu: 'Ớt chuông', soLuong: 60, donVi: 'gram' },
            { tenNguyenLieu: 'Hành tây', soLuong: 50, donVi: 'gram' },
            { tenNguyenLieu: 'Cà rốt', soLuong: 50, donVi: 'gram' }
        ],
        thongTinDinhDuong: {
            calories: 420,
            protein: 28,
            carbohydrate: 48,
            fat: 14,
            fiber: 6,
            duong: 5,
            natri: 380,
            canxi: 40,
            sat: 3.2,
            vitaminC: 55,
            vitaminD: 0
        },
        phanKhuc: 1,
        danhGia: 4,
        mucDoKho: 'TRUNG_BINH'
    },
    {
        tenMonAn: 'Salad gà quinoa',
        moTa: 'Salad tươi mát với gà nướng, quinoa và rau xanh',
        hinhAnh: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1170&auto=format&fit=crop',
        congThucNauAn: `
1. Nấu quinoa theo hướng dẫn và để nguội
2. Nướng ức gà với gia vị, thái lát
3. Rửa sạch rau xanh (rau diếp, rau cải)
4. Trộn quinoa, gà, rau xanh, cà chua bi
5. Rưới dressing (dầu ô liu, chanh, mù tạt)
        `.trim(),
        loaiMonAn: 'TRUA',
        thoiGianNau: 30,
        danhSachNguyenLieu: [
            { tenNguyenLieu: 'Ức gà', soLuong: 120, donVi: 'gram' },
            { tenNguyenLieu: 'Quinoa', soLuong: 60, donVi: 'gram' },
            { tenNguyenLieu: 'Rau diếp', soLuong: 80, donVi: 'gram' },
            { tenNguyenLieu: 'Cà chua bi', soLuong: 50, donVi: 'gram' },
            { tenNguyenLieu: 'Dầu ô liu', soLuong: 15, donVi: 'ml' }
        ],
        thongTinDinhDuong: {
            calories: 380,
            protein: 30,
            carbohydrate: 35,
            fat: 15,
            fiber: 8,
            duong: 3,
            natri: 280,
            canxi: 60,
            sat: 2.8,
            vitaminC: 45,
            vitaminD: 0
        },
        phanKhuc: 1,
        danhGia: 5,
        mucDoKho: 'DE'
    },
    {
        tenMonAn: 'Bát cháo yến mạch với trái cây',
        moTa: 'Cháo yến mạch bổ dưỡng với chuối, việt quất và hạnh nhân',
        hinhAnh: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?q=80&w=1170&auto=format&fit=crop',
        congThucNauAn: `
1. Nấu yến mạch với sữa tươi hoặc nước
2. Thêm một chút mật ong khi gần chín
3. Thái chuối, rửa việt quất
4. Cho yến mạch vào bát, thêm trái cây lên trên
5. Rắc hạnh nhân băm và hạt chia
        `.trim(),
        loaiMonAn: 'SANG',
        thoiGianNau: 15,
        danhSachNguyenLieu: [
            { tenNguyenLieu: 'Yến mạch', soLuong: 60, donVi: 'gram' },
            { tenNguyenLieu: 'Sữa tươi', soLuong: 250, donVi: 'ml' },
            { tenNguyenLieu: 'Chuối', soLuong: 1, donVi: 'quả' },
            { tenNguyenLieu: 'Việt quất', soLuong: 50, donVi: 'gram' },
            { tenNguyenLieu: 'Hạnh nhân', soLuong: 20, donVi: 'gram' }
        ],
        thongTinDinhDuong: {
            calories: 350,
            protein: 12,
            carbohydrate: 52,
            fat: 12,
            fiber: 9,
            duong: 18,
            natri: 85,
            canxi: 280,
            sat: 1.5,
            vitaminC: 12,
            vitaminD: 45
        },
        phanKhuc: 1,
        danhGia: 5,
        mucDoKho: 'DE'
    },
    {
        tenMonAn: 'Trứng chiên rau củ',
        moTa: 'Trứng ốp la với rau củ xào và bánh mì nguyên cám',
        hinhAnh: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=1170&auto=format&fit=crop',
        congThucNauAn: `
1. Xào rau củ (ớt chuông, hành tây, nấm) với ít dầu
2. Đánh trứng và chiên ốp la
3. Nướng bánh mì nguyên cám
4. Bày rau củ, trứng và bánh mì ra đĩa
5. Ăn kèm với sốt cà chua nếu thích
        `.trim(),
        loaiMonAn: 'SANG',
        thoiGianNau: 20,
        danhSachNguyenLieu: [
            { tenNguyenLieu: 'Trứng gà', soLuong: 2, donVi: 'quả' },
            { tenNguyenLieu: 'Ớt chuông', soLuong: 50, donVi: 'gram' },
            { tenNguyenLieu: 'Nấm', soLuong: 60, donVi: 'gram' },
            { tenNguyenLieu: 'Bánh mì nguyên cám', soLuong: 2, donVi: 'lát' },
            { tenNguyenLieu: 'Dầu ô liu', soLuong: 10, donVi: 'ml' }
        ],
        thongTinDinhDuong: {
            calories: 320,
            protein: 18,
            carbohydrate: 28,
            fat: 16,
            fiber: 5,
            duong: 4,
            natri: 320,
            canxi: 75,
            sat: 2.2,
            vitaminC: 35,
            vitaminD: 82
        },
        phanKhuc: 1,
        danhGia: 4,
        mucDoKho: 'DE'
    }
];

async function seedThucDon() {
    try {
        // Lấy URI từ .env hoặc tham số dòng lệnh
        const mongoUri = process.env.MONGODB_URI || process.argv[2];
        if (!mongoUri) {
            console.error('❌ Không tìm thấy MONGODB_URI. Vui lòng đặt biến môi trường MONGODB_URI trong file .env hoặc truyền làm tham số:');
            console.error('   ví dụ (PowerShell): $env:MONGODB_URI="mongodb://localhost:27017/your_db"; node scripts/seedThucDon.js');
            console.error('   hoặc: node scripts/seedThucDon.js "mongodb://localhost:27017/your_db"');
            return;
        }

        // Kết nối MongoDB
        await mongoose.connect(mongoUri);
        console.log('✓ Đã kết nối MongoDB');

        // Lấy một user làm mẫu (hoặc tạo thực đơn chung không cần user)
        const sampleUser = await HoiVien.findOne();

        if (!sampleUser) {
            console.log('⚠ Không tìm thấy hội viên nào. Tạo thực đơn mẫu chung...');
        }

        // Tạo 3 thực đơn tuần (mỗi tuần 7 ngày)
        const thucDonList = [];

        for (let weekIndex = 0; weekIndex < 3; weekIndex++) {
            const ngayBatDau = new Date();
            ngayBatDau.setDate(ngayBatDau.getDate() + (weekIndex * 7));

            const ngayKetThuc = new Date(ngayBatDau);
            ngayKetThuc.setDate(ngayKetThuc.getDate() + 6);

            const thucDonChiTiet = [];

            // Tạo thực đơn cho 7 ngày
            for (let day = 0; day < 7; day++) {
                const ngay = new Date(ngayBatDau);
                ngay.setDate(ngay.getDate() + day);

                // Chọn ngẫu nhiên các món ăn cho mỗi bữa (từ TẤT CẢ 6 món)
                const buaSang = [sampleMeals[Math.floor(Math.random() * sampleMeals.length)]];
                const buaTrua = [sampleMeals[Math.floor(Math.random() * sampleMeals.length)]];
                const buaToi = [sampleMeals[Math.floor(Math.random() * sampleMeals.length)]];
                const buaChieu = [sampleMeals[Math.floor(Math.random() * sampleMeals.length)]];

                const tongCalories =
                    buaSang.reduce((sum, m) => sum + m.thongTinDinhDuong.calories, 0) +
                    buaTrua.reduce((sum, m) => sum + m.thongTinDinhDuong.calories, 0) +
                    buaToi.reduce((sum, m) => sum + m.thongTinDinhDuong.calories, 0) +
                    buaChieu.reduce((sum, m) => sum + m.thongTinDinhDuong.calories, 0);

                const tongProtein =
                    buaSang.reduce((sum, m) => sum + m.thongTinDinhDuong.protein, 0) +
                    buaTrua.reduce((sum, m) => sum + m.thongTinDinhDuong.protein, 0) +
                    buaToi.reduce((sum, m) => sum + m.thongTinDinhDuong.protein, 0) +
                    buaChieu.reduce((sum, m) => sum + m.thongTinDinhDuong.protein, 0);

                const tongCarb =
                    buaSang.reduce((sum, m) => sum + m.thongTinDinhDuong.carbohydrate, 0) +
                    buaTrua.reduce((sum, m) => sum + m.thongTinDinhDuong.carbohydrate, 0) +
                    buaToi.reduce((sum, m) => sum + m.thongTinDinhDuong.carbohydrate, 0) +
                    buaChieu.reduce((sum, m) => sum + m.thongTinDinhDuong.carbohydrate, 0);

                const tongFat =
                    buaSang.reduce((sum, m) => sum + m.thongTinDinhDuong.fat, 0) +
                    buaTrua.reduce((sum, m) => sum + m.thongTinDinhDuong.fat, 0) +
                    buaToi.reduce((sum, m) => sum + m.thongTinDinhDuong.fat, 0) +
                    buaChieu.reduce((sum, m) => sum + m.thongTinDinhDuong.fat, 0);

                thucDonChiTiet.push({
                    ngay,
                    buaSang,
                    buaTrua,
                    buaChieu,
                    buaToi,
                    doUongBoSung: [],
                    tongCalories,
                    tongProtein,
                    tongCarb,
                    tongFat,
                    ghiChu: `Thực đơn ngày ${day + 1} - Tuần ${weekIndex + 1}`
                });
            }

            const thucDon = {
                hoiVien: sampleUser ? sampleUser._id : new mongoose.Types.ObjectId(),
                ngayBatDau,
                ngayKetThuc,
                loaiThucDon: 'TUAN',
                mucTieuDinhDuong: {
                    mucTieuChinh: weekIndex % 2 === 0 ? 'TANG_CO_BAP' : 'GIAM_MO',
                    caloriesNgay: 1800,
                    proteinNgay: 120,
                    carbNgay: 180,
                    fatNgay: 60,
                    soLuongBuaAn: 4,
                    soLuongNuocUong: 2500
                },
                thongTinCaNhan: sampleUser ? {
                    tuoi: 25,
                    canNang: 70,
                    chieuCao: 170,
                    bmi: 24.2,
                    hoatDongHangNgay: 'HOAT_DONG_VUA',
                    tinhTrangSucKhoe: 'BINH_THUONG',
                    diUng: [],
                    sothich: ['Gà', 'Cá'],
                    kiengCu: []
                } : undefined,
                hoatDongTapLuyen: {
                    cacacBaiTapChinh: ['Squat', 'Bench Press', 'Deadlift'],
                    tanSuatTap: 4,
                    thoidGianTap: 60,
                    doKhoTap: 'TRUNG_BINH',
                    loaiHinhTap: 'CO_BAP'
                },
                thucDonChiTiet,
                goiYTuAI: {
                    lyDoGoiY: 'Thực đơn được thiết kế dựa trên mục tiêu tăng cơ và giảm mỡ',
                    cacLuuY: [
                        'Uống đủ nước mỗi ngày',
                        'Ăn đúng giờ',
                        'Tăng protein sau tập'
                    ],
                    goiYThayThe: [
                        'Có thể thay gà bằng cá ngừ',
                        'Thay cơm trắng bằng cơm gạo lứt'
                    ],
                    danhGiaPhuhop: 9,
                    ngayTaoGoiY: new Date()
                },
                trangThai: 'DANG_SU_DUNG'
            };

            thucDonList.push(thucDon);
        }

        // Xóa dữ liệu cũ (nếu có)
        await ThucDon.deleteMany({});
        console.log('✓ Đã xóa dữ liệu thực đơn cũ');

        // Chèn dữ liệu mới
        const result = await ThucDon.insertMany(thucDonList);
        console.log(`✓ Đã tạo ${result.length} thực đơn mẫu`);

        console.log('\n📋 Thống kê:');
        console.log(`   - Số thực đơn: ${result.length}`);
        console.log(`   - Số món ăn khác nhau: ${sampleMeals.length}`);
        console.log(`   - Tổng số bữa ăn: ${result.length * 7 * 4}`);

        console.log('\n✅ Hoàn tất! Dữ liệu đã được chèn vào database.');

    } catch (error) {
        console.error('❌ Lỗi:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n✓ Đã đóng kết nối MongoDB');
    }
}

// Chạy script
seedThucDon();
