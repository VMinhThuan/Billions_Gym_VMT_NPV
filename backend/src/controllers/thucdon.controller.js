const ThucDon = require('../models/ThucDon');

// Hàm xác định bữa ăn hiện tại dựa vào giờ
const getCurrentMealType = () => {
    const currentHour = new Date().getHours();

    if (currentHour >= 5 && currentHour < 11) {
        return 'SANG'; // 5:00 - 10:59
    } else if (currentHour >= 11 && currentHour < 14) {
        return 'TRUA'; // 11:00 - 13:59
    } else if (currentHour >= 14 && currentHour < 18) {
        return 'CHIEU'; // 14:00 - 17:59
    } else {
        return 'TOI'; // 18:00 - 4:59
    }
};

// Lấy danh sách bữa ăn lành mạnh/gợi ý
const getHealthyMeals = async (req, res) => {
    try {
        const { hoiVienId, buaAn } = req.query;
        const limit = parseInt(req.query.limit) || 10;

        // Xác định bữa ăn cần lấy (từ query hoặc tự động dựa vào giờ)
        const mealType = buaAn || getCurrentMealType();

        // Tìm thực đơn đang active của hội viên hoặc các món ăn đề xuất chung
        const query = hoiVienId
            ? { hoiVien: hoiVienId, trangThai: 'DANG_SU_DUNG' }
            : { trangThai: 'DANG_SU_DUNG' };

        const thucDonList = await ThucDon.find(query)
            .sort({ createdAt: -1 })
            .limit(5);

        // Trích xuất các món ăn từ thực đơn theo bữa ăn
        const meals = [];

        thucDonList.forEach(thucDon => {
            thucDon.thucDonChiTiet.forEach(ngay => {
                let mealsToAdd = [];

                // Lấy món ăn theo bữa tương ứng
                switch (mealType) {
                    case 'SANG':
                        mealsToAdd = ngay.buaSang || [];
                        break;
                    case 'TRUA':
                        mealsToAdd = ngay.buaTrua || [];
                        break;
                    case 'CHIEU':
                        mealsToAdd = ngay.buaChieu || [];
                        break;
                    case 'TOI':
                        mealsToAdd = ngay.buaToi || [];
                        break;
                    default:
                        // Nếu không xác định được, lấy tất cả
                        mealsToAdd = [
                            ...(ngay.buaSang || []),
                            ...(ngay.buaTrua || []),
                            ...(ngay.buaChieu || []),
                            ...(ngay.buaToi || [])
                        ];
                }

                mealsToAdd.forEach(monAn => {
                    // Chỉ thêm món có đủ thông tin và chưa có trong danh sách
                    if (monAn.tenMonAn && monAn.thongTinDinhDuong &&
                        !meals.find(m => m.tenMonAn === monAn.tenMonAn)) {
                        meals.push({
                            id: monAn._id || monAn.tenMonAn,
                            tenMonAn: monAn.tenMonAn,
                            moTa: monAn.moTa,
                            hinhAnh: monAn.hinhAnh,
                            loaiMonAn: monAn.loaiMonAn,
                            thongTinDinhDuong: monAn.thongTinDinhDuong,
                            danhGia: monAn.danhGia,
                            mucDoKho: monAn.mucDoKho,
                            thoiGianNau: monAn.thoiGianNau,
                            buaAn: mealType
                        });
                    }
                });
            });
        });

        // Nếu không có món ăn nào, trả về danh sách mẫu
        if (meals.length === 0) {
            return res.json({
                success: true,
                data: getSampleMeals(),
                message: 'Danh sách món ăn mẫu',
                buaAn: mealType
            });
        }

        const sortedMeals = meals
            .sort((a, b) => (b.danhGia || 0) - (a.danhGia || 0))
            .slice(0, limit);

        res.json({
            success: true,
            data: sortedMeals,
            total: meals.length,
            buaAn: mealType,
            currentTime: new Date().toLocaleTimeString('vi-VN')
        });

    } catch (error) {
        console.error('Error fetching healthy meals:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách bữa ăn',
            error: error.message
        });
    }
};

// Dữ liệu mẫu khi chưa có thực đơn
const getSampleMeals = () => [
    {
        id: 'sample-1',
        tenMonAn: 'Cơm gà nướng',
        moTa: 'Ức gà nướng giàu protein kèm cơm gạo lứt',
        hinhAnh: 'https://images.unsplash.com/photo-1646809156467-6e825869b29f?q=80&w=1170&auto=format&fit=crop',
        loaiMonAn: 'TRUA',
        thongTinDinhDuong: {
            calories: 450,
            protein: 35,
            carbohydrate: 45,
            fat: 12,
            fiber: 4
        },
        danhGia: 5,
        mucDoKho: 'DE'
    },
    {
        id: 'sample-2',
        tenMonAn: 'Cá hồi nướng với rau củ',
        moTa: 'Cá hồi giàu omega-3 kèm rau củ hấp',
        hinhAnh: 'https://images.unsplash.com/photo-1661081090288-fd8ffc486dd7?q=80&w=1170&auto=format&fit=crop',
        loaiMonAn: 'TOI',
        thongTinDinhDuong: {
            calories: 380,
            protein: 32,
            carbohydrate: 25,
            fat: 18,
            fiber: 6
        },
        danhGia: 5,
        mucDoKho: 'TRUNG_BINH'
    },
    {
        id: 'sample-3',
        tenMonAn: 'Cơm gạo lứt với thịt bò',
        moTa: 'Thịt bò nạc xào rau củ với cơm gạo lứt',
        hinhAnh: 'https://img.taste.com.au/HYj36Q1G/w1200-h675-cfill-q80/taste/2016/11/middle-eastern-lamb-koftas-with-aromatic-lentil-rice-106574-1.jpeg',
        loaiMonAn: 'TRUA',
        thongTinDinhDuong: {
            calories: 420,
            protein: 28,
            carbohydrate: 48,
            fat: 14,
            fiber: 5
        },
        danhGia: 4,
        mucDoKho: 'TRUNG_BINH'
    }
];

module.exports = {
    getHealthyMeals
};
