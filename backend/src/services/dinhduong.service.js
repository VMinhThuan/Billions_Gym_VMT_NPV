const DinhDuong = require('../models/DinhDuong');
const ThucDon = require('../models/ThucDon');
const BuoiTap = require('../models/BuoiTap');
const LichSuTap = require('../models/LichSuTap');
const ChiSoCoThe = require('../models/ChiSoCoThe');
const { HoiVien } = require('../models/NguoiDung');

const thucPhamDatabase = {
    protein: [
        { ten: 'Ức gà luộc', calories: 165, protein: 31, carb: 0, fat: 3.6 },
        { ten: 'Cá hồi nướng', calories: 208, protein: 25, carb: 0, fat: 12 },
        { ten: 'Trứng gà luộc', calories: 155, protein: 13, carb: 1.1, fat: 11 },
        { ten: 'Đậu phụ chiên', calories: 144, protein: 15, carb: 4, fat: 8 },
        { ten: 'Tôm luộc', calories: 99, protein: 18, carb: 0.2, fat: 1.4 },
        { ten: 'Thịt bò nạm', calories: 250, protein: 26, carb: 0, fat: 15 }
    ],
    carb: [
        { ten: 'Cơm gạo lứt', calories: 111, protein: 2.6, carb: 23, fat: 0.9 },
        { ten: 'Khoai lang luộc', calories: 86, protein: 1.6, carb: 20, fat: 0.1 },
        { ten: 'Yến mạch', calories: 389, protein: 17, carb: 66, fat: 7 },
        { ten: 'Bánh mì nguyên cám', calories: 247, protein: 13, carb: 41, fat: 4 },
        { ten: 'Chuối', calories: 89, protein: 1.1, carb: 23, fat: 0.3 },
        { ten: 'Khoai tây luộc', calories: 77, protein: 2, carb: 17, fat: 0.1 }
    ],
    vegetables: [
        { ten: 'Bông cải xanh luộc', calories: 35, protein: 2.8, carb: 7, fat: 0.4 },
        { ten: 'Cà rót nướng', calories: 25, protein: 1, carb: 6, fat: 0.2 },
        { ten: 'Rau chân vịt xào', calories: 23, protein: 2.9, carb: 3.7, fat: 0.4 },
        { ten: 'Cà chua sống', calories: 18, protein: 0.9, carb: 3.9, fat: 0.2 },
        { ten: 'Dưa chuột', calories: 16, protein: 0.7, carb: 4, fat: 0.1 },
        { ten: 'Rau xà lách', calories: 15, protein: 1.4, carb: 2.9, fat: 0.2 }
    ],
    fat: [
        { ten: 'Bơ', calories: 160, protein: 2, carb: 9, fat: 15 },
        { ten: 'Dầu olive', calories: 884, protein: 0, carb: 0, fat: 100 },
        { ten: 'Hạt điều', calories: 553, protein: 18, carb: 30, fat: 44 },
        { ten: 'Hạt óc chó', calories: 654, protein: 15, carb: 14, fat: 65 },
        { ten: 'Dầu dừa', calories: 862, protein: 0, carb: 0, fat: 100 }
    ]
};

// Lấy thông tin dinh dưỡng của hội viên
const getThongTinDinhDuongHoiVien = async (maHoiVien) => {
    try {
        const dinhDuong = await DinhDuong.find({ hoiVien: maHoiVien }).sort({ createdAt: -1 }).limit(5);
        const thucDon = await ThucDon.find({ hoiVien: maHoiVien }).sort({ createdAt: -1 }).limit(5);
        return { dinhDuong, thucDon };
    } catch (error) {
        console.error('Lỗi lấy thông tin dinh dưỡng:', error);
        throw error;
    }
};

// AI - Tính toán nhu cầu calories dựa trên thông tin cá nhân
const tinhNhuCauCalories = (canNang, chieuCao, tuoi, gioiTinh, hoatDong, mucTieu) => {
    let bmr;
    if (gioiTinh === 'NAM') {
        bmr = 88.362 + (13.397 * canNang) + (4.799 * chieuCao) - (5.677 * tuoi);
    } else {
        bmr = 447.593 + (9.247 * canNang) + (3.098 * chieuCao) - (4.330 * tuoi);
    }

    const heSoHoatDong = {
        'IT_HOAT_DONG': 1.2,
        'HOAT_DONG_NHE': 1.375,
        'HOAT_DONG_VUA': 1.55,
        'HOAT_DONG_MANH': 1.725
    };

    const tdee = bmr * (heSoHoatDong[hoatDong] || 1.55);

    const dieuChinhMucTieu = {
        'GIAM_CAN': -500,
        'GIAM_MO': -300,
        'DUY_TRI': 0,
        'TANG_CAN': 300,
        'TANG_CO_BAP': 500
    };

    return Math.round(tdee + (dieuChinhMucTieu[mucTieu] || 0));
};

// AI - Phân tích hoạt động tập luyện gần đây
const phanTichHoatDongTapLuyen = async (maHoiVien) => {
    try {
        // Lấy lịch sử tập 7 ngày gần nhất
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);

        const lichSuTap = await LichSuTap.find({
            hoiVien: maHoiVien,
            ngayTap: { $gte: startDate }
        }).populate({
            path: 'buoiTap',
            populate: {
                path: 'cacBaiTap.baiTap',
                select: 'tenBaiTap nhomCo'
            }
        }).sort({ ngayTap: -1 });

        if (lichSuTap.length === 0) {
            return {
                tanSuatTap: 0,
                thoiGianTap: 0,
                nhomCoTapChinh: [],
                doKhoTap: 'DE',
                caloTieuHao: 0,
                ngayTapGanNhat: null
            };
        }

        const tanSuatTap = lichSuTap.length;

        const thoiGianTap = lichSuTap.reduce((total, ls) => total + (ls.caloTieuHao || 0) / 10, 0);

        const nhomCoMap = {};
        lichSuTap.forEach(ls => {
            if (ls.buoiTap && ls.buoiTap.cacBaiTap) {
                ls.buoiTap.cacBaiTap.forEach(bt => {
                    if (bt.baiTap && bt.baiTap.nhomCo) {
                        nhomCoMap[bt.baiTap.nhomCo] = (nhomCoMap[bt.baiTap.nhomCo] || 0) + 1;
                    }
                });
            }
        });

        const nhomCoTapChinh = Object.keys(nhomCoMap)
            .sort((a, b) => nhomCoMap[b] - nhomCoMap[a])
            .slice(0, 3);

        // Tính độ khó trung bình
        const avgCalo = lichSuTap.reduce((total, ls) => total + (ls.caloTieuHao || 0), 0) / lichSuTap.length;
        let doKhoTap = 'DE';
        if (avgCalo > 300) doKhoTap = 'KHO';
        else if (avgCalo > 200) doKhoTap = 'TRUNG_BINH';

        return {
            tanSuatTap,
            thoiGianTap: Math.round(thoiGianTap),
            nhomCoTapChinh,
            doKhoTap,
            caloTieuHao: Math.round(avgCalo),
            ngayTapGanNhat: lichSuTap[0].ngayTap
        };

    } catch (error) {
        console.error('Lỗi phân tích hoạt động tập luyện:', error);
        return {
            tanSuatTap: 0,
            thoiGianTap: 0,
            nhomCoTapChinh: [],
            doKhoTap: 'DE',
            caloTieuHao: 0,
            ngayTapGanNhat: null
        };
    }
};

// AI - Tạo gợi ý dinh dưỡng thông minh
const taoGoiYDinhDuongAI = async (maHoiVien, mucTieu, thongTinThem = {}) => {
    try {
        const hoiVien = await HoiVien.findById(maHoiVien);
        if (!hoiVien) {
            throw new Error('Không tìm thấy thông tin hội viên');
        }

        const chiSoCoThe = await ChiSoCoThe.findOne({ hoiVien: maHoiVien }).sort({ ngayDo: -1 });

        // Phân tích hoạt động tập luyện
        const hoatDongTap = await phanTichHoatDongTapLuyen(maHoiVien);

        const tuoi = new Date().getFullYear() - new Date(hoiVien.ngaySinh).getFullYear();

        // Tính nhu cầu calories
        const canNang = chiSoCoThe?.canNang || thongTinThem.canNang || 70;
        const chieuCao = chiSoCoThe?.chieuCao || thongTinThem.chieuCao || 170;
        const hoatDong = thongTinThem.hoatDong || 'HOAT_DONG_VUA';

        const nhuCauCalories = tinhNhuCauCalories(canNang, chieuCao, tuoi, hoiVien.gioiTinh, hoatDong, mucTieu);

        // Tính tỷ lệ macro theo mục tiêu và hoạt động tập
        let tiLeMacro = { protein: 25, carb: 45, fat: 30 };

        if (mucTieu === 'TANG_CO_BAP' && hoatDongTap.nhomCoTapChinh.length > 0) {
            tiLeMacro = { protein: 30, carb: 40, fat: 30 }; // Tăng protein cho tăng cơ
        } else if (mucTieu === 'GIAM_CAN' || mucTieu === 'GIAM_MO') {
            tiLeMacro = { protein: 30, carb: 35, fat: 35 }; // Giảm carb cho giảm cân
        } else if (hoatDongTap.doKhoTap === 'KHO') {
            tiLeMacro = { protein: 25, carb: 50, fat: 25 }; // Tăng carb cho tập nặng
        }

        const goiYCuThe = taoGoiYCuThe(mucTieu, hoatDongTap, { canNang, chieuCao, tuoi });

        const dinhDuong = new DinhDuong({
            hoiVien: maHoiVien,
            buaAn: `Gợi ý dinh dưỡng cho mục tiêu ${mucTieu}`,
            luongCalo: nhuCauCalories,
            loaiGoiY: 'DINH_DUONG_TONG_QUAT',
            phanTichTapLuyen: hoatDongTap,
            mucTieuDinhDuong: {
                mucTieuChinh: mucTieu,
                caloMucTieu: nhuCauCalories,
                tiLeMacro
            },
            goiYAI: goiYCuThe
        });

        await dinhDuong.save();

        return {
            success: true,
            data: dinhDuong,
            thongTinThem: {
                nhuCauCalories,
                proteinGram: Math.round(nhuCauCalories * tiLeMacro.protein / 100 / 4),
                carbGram: Math.round(nhuCauCalories * tiLeMacro.carb / 100 / 4),
                fatGram: Math.round(nhuCauCalories * tiLeMacro.fat / 100 / 9)
            }
        };

    } catch (error) {
        console.error('Lỗi tạo gợi ý dinh dưỡng AI:', error);
        throw error;
    }
};

// Tạo gợi ý cụ thể dựa trên mục tiêu và hoạt động
const taoGoiYCuThe = (mucTieu, hoatDongTap, thongTinCaNhan) => {
    const goiY = {
        tieuDe: '',
        noiDungGoiY: '',
        cacThucPhamNenAn: [],
        cacThucPhamNenTranh: [],
        thoidDiemAnUong: [],
        boSungCanThiet: [],
        luuYDacBiet: [],
        danhGiaDoPhuhop: 8
    };

    switch (mucTieu) {
        case 'TANG_CO_BAP':
            goiY.tieuDe = 'Gợi ý dinh dưỡng tăng cơ bắp';
            goiY.noiDungGoiY = 'Chế độ dinh dưỡng tập trung vào protein chất lượng cao và carbohydrate phức hợp để hỗ trợ quá trình phục hồi và phát triển cơ bắp.';
            goiY.cacThucPhamNenAn = ['Ức gà', 'Cá hồi', 'Trứng', 'Yến mạch', 'Cơm gạo lứt', 'Rau xanh', 'Hạt điều'];
            goiY.cacThucPhamNenTranh = ['Đồ chiên rán', 'Đồ ngọt', 'Thức ăn nhanh', 'Nước ngọt có ga'];
            goiY.thoidDiemAnUong = [
                'Ăn protein trong vòng 30 phút sau tập',
                'Chia nhỏ 5-6 bữa trong ngày',
                'Uống protein shake trước khi ngủ'
            ];
            goiY.boSungCanThiet = ['Whey protein', 'Creatine', 'Vitamin D', 'Omega-3'];
            break;

        case 'GIAM_CAN':
        case 'GIAM_MO':
            goiY.tieuDe = 'Gợi ý dinh dưỡng giảm cân hiệu quả';
            goiY.noiDungGoiY = 'Tạo cân bằng calories âm với thực phẩm giàu chất xơ và protein để duy trì cảm giác no lâu và bảo toàn cơ bắp.';
            goiY.cacThucPhamNenAn = ['Ức gà luộc', 'Cá', 'Rau xanh', 'Quinoa', 'Bơ', 'Trứng', 'Dưa chuột'];
            goiY.cacThucPhamNenTranh = ['Bánh kẹo', 'Thức ăn chiên', 'Nước ngọt', 'Rượu bia', 'Thực phẩm chế biến'];
            goiY.thoidDiemAnUong = [
                'Ăn sáng đầy đủ, trưa vừa phải, tối ít',
                'Ngưng ăn 3 tiếng trước khi ngủ',
                'Uống nước trước mỗi bữa ăn'
            ];
            goiY.boSungCanThiet = ['L-Carnitine', 'Green tea extract', 'Vitamin B complex'];
            break;

        case 'DUY_TRI':
            goiY.tieuDe = 'Gợi ý dinh dưỡng duy trì sức khỏe';
            goiY.noiDungGoiY = 'Chế độ ăn cân bằng với đầy đủ các nhóm chất dinh dưỡng để duy trì sức khỏe và năng lượng ổn định.';
            goiY.cacThucPhamNenAn = ['Thịt nạc', 'Cá', 'Rau củ đa dạng', 'Trái cây', 'Ngũ cốc nguyên hạt'];
            goiY.cacThucPhamNenTranh = ['Thực phẩm quá mặn', 'Đồ uống có cồn', 'Thực phẩm chế biến sẵn'];
            goiY.thoidDiemAnUong = [
                'Ăn đều đặn 3 bữa chính',
                'Bổ sung 1-2 bữa phụ nếu cần',
                'Uống đủ 2-2.5L nước/ngày'
            ];
            goiY.boSungCanThiet = ['Multivitamin', 'Omega-3', 'Probiotics'];
            break;
    }

    // Điều chỉnh dựa trên hoạt động tập luyện
    if (hoatDongTap.tanSuatTap >= 4) {
        goiY.luuYDacBiet.push('Tăng lượng carb vào những ngày tập nặng');
        goiY.luuYDacBiet.push('Uống đủ nước để bù trừ mất nước qua mồ hôi');
    }

    if (hoatDongTap.nhomCoTapChinh.includes('Ngực') || hoatDongTap.nhomCoTapChinh.includes('Vai')) {
        goiY.luuYDacBiet.push('Tăng protein để hỗ trợ phục hồi cơ thượng thể');
    }

    if (hoatDongTap.doKhoTap === 'KHO') {
        goiY.thoidDiemAnUong.push('Ăn carb 1-2 tiếng trước tập để có năng lượng');
        goiY.boSungCanThiet.push('BCAA');
    }

    return goiY;
};

// Tạo thực đơn tự động
const taoThucDonTuDong = async (maHoiVien, loaiThucDon = 'TUAN', mucTieu) => {
    try {
        // Lấy thông tin gợi ý dinh dưỡng gần nhất
        const goiYGanNhat = await DinhDuong.findOne({
            hoiVien: maHoiVien,
            'mucTieuDinhDuong.mucTieuChinh': mucTieu
        }).sort({ createdAt: -1 });

        if (!goiYGanNhat) {
            throw new Error('Vui lòng tạo gợi ý dinh dưỡng trước khi tạo thực đơn');
        }

        const caloMucTieu = goiYGanNhat.mucTieuDinhDuong.caloMucTieu;
        const tiLeMacro = goiYGanNhat.mucTieuDinhDuong.tiLeMacro;

        // Tính gram cho từng macro
        const proteinGram = Math.round(caloMucTieu * tiLeMacro.protein / 100 / 4);
        const carbGram = Math.round(caloMucTieu * tiLeMacro.carb / 100 / 4);
        const fatGram = Math.round(caloMucTieu * tiLeMacro.fat / 100 / 9);

        // Tạo thực đơn cho từng ngày
        const soNgay = loaiThucDon === 'TUAN' ? 7 : 30;
        const ngayBatDau = new Date();
        const ngayKetThuc = new Date();
        ngayKetThuc.setDate(ngayBatDau.getDate() + soNgay);

        const thucDonChiTiet = [];

        for (let i = 0; i < soNgay; i++) {
            const ngayHienTai = new Date(ngayBatDau);
            ngayHienTai.setDate(ngayBatDau.getDate() + i);

            const thucDonNgay = taoThucDonMotNgay(caloMucTieu, proteinGram, carbGram, fatGram, mucTieu);
            thucDonNgay.ngay = ngayHienTai;

            thucDonChiTiet.push(thucDonNgay);
        }

        // Tạo thực đơn
        const thucDon = new ThucDon({
            hoiVien: maHoiVien,
            ngayBatDau,
            ngayKetThuc,
            loaiThucDon: loaiThucDon.toUpperCase(),
            mucTieuDinhDuong: {
                mucTieuChinh: mucTieu,
                caloriesNgay: caloMucTieu,
                proteinNgay: proteinGram,
                carbNgay: carbGram,
                fatNgay: fatGram
            },
            thucDonChiTiet,
            goiYTuAI: {
                lyDoGoiY: `Thực đơn được tạo tự động cho mục tiêu ${mucTieu}`,
                cacLuuY: goiYGanNhat.goiYAI.luuYDacBiet,
                danhGiaPhuhop: 8,
                ngayTaoGoiY: new Date()
            }
        });

        await thucDon.save();

        goiYGanNhat.thucDonLienKet = thucDon._id;
        await goiYGanNhat.save();

        return {
            success: true,
            data: thucDon
        };

    } catch (error) {
        console.error('Lỗi tạo thực đơn tự động:', error);
        throw error;
    }
};

// Tạo thực đơn cho một ngày
const taoThucDonMotNgay = (tongCalo, proteinGram, carbGram, fatGram, mucTieu) => {
    // Phân bổ calories cho từng bữa
    const phanBoCalo = {
        sang: Math.round(tongCalo * 0.25),
        trua: Math.round(tongCalo * 0.35),
        chieu: Math.round(tongCalo * 0.15),
        toi: Math.round(tongCalo * 0.25)
    };

    const thucDonNgay = {
        buaSang: taoMonAnTheoBua('SANG', phanBoCalo.sang, proteinGram * 0.25, carbGram * 0.3, fatGram * 0.2),
        buaTrua: taoMonAnTheoBua('TRUA', phanBoCalo.trua, proteinGram * 0.4, carbGram * 0.4, fatGram * 0.4),
        buaChieu: taoMonAnTheoBua('CHIEU', phanBoCalo.chieu, proteinGram * 0.15, carbGram * 0.15, fatGram * 0.2),
        buaToi: taoMonAnTheoBua('TOI', phanBoCalo.toi, proteinGram * 0.35, carbGram * 0.25, fatGram * 0.3),
        tongCalories: tongCalo,
        tongProtein: proteinGram,
        tongCarb: carbGram,
        tongFat: fatGram,
        ghiChu: `Thực đơn cho mục tiêu ${mucTieu}`
    };

    return thucDonNgay;
};

// Tạo món ăn theo bữa
const taoMonAnTheoBua = (loaiBua, caloMucTieu, proteinMucTieu, carbMucTieu, fatMucTieu) => {
    const monAnMau = {
        SANG: [
            {
                tenMonAn: 'Yến mạch với trứng và chuối',
                thongTinDinhDuong: { calories: 350, protein: 15, carbohydrate: 45, fat: 12 },
                danhSachNguyenLieu: [
                    { tenNguyenLieu: 'Yến mạch', soLuong: 50, donVi: 'gram' },
                    { tenNguyenLieu: 'Trứng gà', soLuong: 1, donVi: 'quả' },
                    { tenNguyenLieu: 'Chuối', soLuong: 1, donVi: 'quả' }
                ],
                congThucNauAn: 'Nấu yến mạch với nước, chiên trứng, thái chuối'
            }
        ],
        TRUA: [
            {
                tenMonAn: 'Cơm gạo lứt với ức gà và rau xanh',
                thongTinDinhDuong: { calories: 450, protein: 35, carbohydrate: 40, fat: 15 },
                danhSachNguyenLieu: [
                    { tenNguyenLieu: 'Cơm gạo lứt', soLuong: 100, donVi: 'gram' },
                    { tenNguyenLieu: 'Ức gà', soLuong: 120, donVi: 'gram' },
                    { tenNguyenLieu: 'Bông cải xanh', soLuong: 150, donVi: 'gram' }
                ],
                congThucNauAn: 'Nấu cơm, luộc ức gà, luộc rau xanh'
            }
        ],
        CHIEU: [
            {
                tenMonAn: 'Sinh tố protein với hạt',
                thongTinDinhDuong: { calories: 200, protein: 12, carbohydrate: 15, fat: 8 },
                danhSachNguyenLieu: [
                    { tenNguyenLieu: 'Sữa tươi không đường', soLuong: 200, donVi: 'ml' },
                    { tenNguyenLieu: 'Hạt điều', soLuong: 20, donVi: 'gram' },
                    { tenNguyenLieu: 'Chuối', soLuong: 0.5, donVi: 'quả' }
                ],
                congThucNauAn: 'Xay sinh tố tất cả nguyên liệu'
            }
        ],
        TOI: [
            {
                tenMonAn: 'Cá hồi nướng với khoai lang',
                thongTinDinhDuong: { calories: 380, protein: 28, carbohydrate: 25, fat: 18 },
                danhSachNguyenLieu: [
                    { tenNguyenLieu: 'Cá hồi', soLuong: 120, donVi: 'gram' },
                    { tenNguyenLieu: 'Khoai lang', soLuong: 100, donVi: 'gram' },
                    { tenNguyenLieu: 'Rau xà lách', soLuong: 100, donVi: 'gram' }
                ],
                congThucNauAn: 'Nướng cá hồi, luộc khoai lang, trộn salad'
            }
        ]
    };

    return monAnMau[loaiBua] || [];
};

// Lấy danh sách gợi ý dinh dưỡng của hội viên
const getGoiYDinhDuongByHoiVien = async (maHoiVien, options = {}) => {
    try {
        const { limit = 10, page = 1, loaiGoiY = null } = options;

        let query = { hoiVien: maHoiVien };
        if (loaiGoiY) {
            query.loaiGoiY = loaiGoiY;
        }

        const goiYList = await DinhDuong.find(query)
            .populate('thucDonLienKet', 'ngayBatDau ngayKetThuc loaiThucDon trangThai')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await DinhDuong.countDocuments(query);

        return {
            success: true,
            data: goiYList,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total
            }
        };

    } catch (error) {
        console.error('Lỗi lấy gợi ý dinh dưỡng:', error);
        throw error;
    }
};

// Cập nhật phản hồi cho gợi ý dinh dưỡng
const capNhatPhanHoiGoiY = async (goiYId, danhGia, phanHoi, trangThai) => {
    try {
        const goiY = await DinhDuong.findByIdAndUpdate(
            goiYId,
            {
                danhGiaHaiLong: danhGia,
                phanHoi: phanHoi,
                trangThai: trangThai || 'DA_XEM',
                ngayCapNhat: new Date()
            },
            { new: true }
        );

        if (!goiY) {
            throw new Error('Không tìm thấy gợi ý dinh dưỡng');
        }

        return {
            success: true,
            data: goiY
        };

    } catch (error) {
        console.error('Lỗi cập nhật phản hồi:', error);
        throw error;
    }
};

module.exports = {
    getThongTinDinhDuongHoiVien,
    taoGoiYDinhDuongAI,
    taoThucDonTuDong,
    getGoiYDinhDuongByHoiVien,
    capNhatPhanHoiGoiY,
    phanTichHoatDongTapLuyen,
    tinhNhuCauCalories
};
