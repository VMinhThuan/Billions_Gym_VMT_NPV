const mongoose = require('mongoose');
const dayjs = require('dayjs');
const { HoiVien } = require('../models/NguoiDung');
const LichSuTap = require('../models/LichSuTap');
const { BuoiTap } = require('../models/BuoiTap');
// Sử dụng Exercise model (đã merge với BaiTap)
const Exercise = require('../models/BaiTap'); // BaiTap (alias cho Exercise)
const BaiTap = Exercise; // Alias cho backward compatibility

// Phân tích lịch sử tập luyện
const phanTichLichSuTap = (lichSuTap) => {
    if (lichSuTap.length === 0) {
        return {
            soBuoiTap: 0,
            thoiGianTrungBinh: 0,
            caloTieuHaoTrungBinh: 0,
            tanSuatTap: 0,
            xuHuong: 'chua_co_du_lieu',
            nhomCoTapChinh: [],
            doKhoTap: 'DE'
        };
    }

    const soBuoiTap = lichSuTap.length;
    const thoiGianTrungBinh = lichSuTap.reduce((total, ls) => {
        return total + (ls.buoiTap?.thoiLuong || 60);
    }, 0) / soBuoiTap;

    const caloTieuHaoTrungBinh = lichSuTap.reduce((total, ls) => {
        return total + (ls.caloTieuHao || 0);
    }, 0) / soBuoiTap;

    // Tính tần suất tập (buổi/tuần)
    const ngayDau = dayjs(lichSuTap[lichSuTap.length - 1].ngayTap);
    const ngayCuoi = dayjs(lichSuTap[0].ngayTap);
    const soTuan = Math.max(1, ngayCuoi.diff(ngayDau, 'week'));
    const tanSuatTap = soBuoiTap / soTuan;

    // Phân tích xu hướng
    const xuHuong = phanTichXuHuong(lichSuTap);

    // Phân tích nhóm cơ tập chính
    const nhomCoMap = {};
    lichSuTap.forEach(ls => {
        if (ls.buoiTap?.cacBaiTap) {
            ls.buoiTap.cacBaiTap.forEach(bt => {
                if (bt.baiTap?.nhomCo) {
                    nhomCoMap[bt.baiTap.nhomCo] = (nhomCoMap[bt.baiTap.nhomCo] || 0) + 1;
                }
            });
        }
    });

    const nhomCoTapChinh = Object.keys(nhomCoMap)
        .sort((a, b) => nhomCoMap[b] - nhomCoMap[a])
        .slice(0, 3);

    // Đánh giá độ khó tập
    const doKhoTap = danhGiaDoKhoTap(lichSuTap);

    return {
        soBuoiTap,
        thoiGianTrungBinh: Math.round(thoiGianTrungBinh),
        caloTieuHaoTrungBinh: Math.round(caloTieuHaoTrungBinh),
        tanSuatTap: Math.round(tanSuatTap * 10) / 10,
        xuHuong,
        nhomCoTapChinh,
        doKhoTap
    };
};

// Phân tích xu hướng tập luyện
const phanTichXuHuong = (lichSuTap) => {
    if (lichSuTap.length < 7) return 'chua_co_du_lieu';

    const tuanGanNhat = lichSuTap.slice(0, 7);
    const tuanTruoc = lichSuTap.slice(7, 14);

    if (tuanTruoc.length === 0) return 'tang_truong';

    const soBuoiTuanGanNhat = tuanGanNhat.length;
    const soBuoiTuanTruoc = tuanTruoc.length;

    if (soBuoiTuanGanNhat > soBuoiTuanTruoc) return 'tang_truong';
    if (soBuoiTuanGanNhat < soBuoiTuanTruoc) return 'giam_sut';
    return 'on_dinh';
};

// Đánh giá độ khó tập
const danhGiaDoKhoTap = (lichSuTap) => {
    if (lichSuTap.length === 0) return 'DE';

    const thoiGianTrungBinh = lichSuTap.reduce((total, ls) => {
        return total + (ls.buoiTap?.thoiLuong || 60);
    }, 0) / lichSuTap.length;

    if (thoiGianTrungBinh < 45) return 'DE';
    if (thoiGianTrungBinh < 75) return 'TRUNG_BINH';
    if (thoiGianTrungBinh < 105) return 'KHO';
    return 'RAT_KHO';
};

// Dự báo thời gian tập luyện hiệu quả
const duBaoThoiGianTap = async (hoiVienId, mucTieu, soBuoiTapTuan) => {
    try {
        const hoiVien = await HoiVien.findById(hoiVienId);
        if (!hoiVien) {
            throw new Error('Không tìm thấy hội viên');
        }

        // Lấy lịch sử tập luyện 30 ngày gần nhất
        const startDate = dayjs().subtract(30, 'day').toDate();
        const lichSuTap = await LichSuTap.find({
            hoiVien: hoiVienId,
            ngayTap: { $gte: startDate }
        }).populate('buoiTap');

        // Phân tích dữ liệu lịch sử
        const phanTichLichSu = phanTichLichSuTap(lichSuTap);

        // Tính toán thời gian tập luyện tối ưu
        const thoiGianToiUu = tinhThoiGianToiUu(phanTichLichSu, mucTieu, soBuoiTapTuan);

        // Dự báo tiến độ
        const duBaoTienDo = duBaoTienDoTap(phanTichLichSu, thoiGianToiUu, mucTieu);

        // Gợi ý phương pháp tập luyện
        const phuongPhapTap = gopYPhuongPhapTap(phanTichLichSu, mucTieu, hoiVien);

        return {
            thoiGianToiUu,
            duBaoTienDo,
            phuongPhapTap,
            phanTichLichSu
        };
    } catch (error) {
        console.error('Lỗi dự báo thời gian tập:', error);
        throw error;
    }
};


// Tính thời gian tập luyện tối ưu
const tinhThoiGianToiUu = (phanTichLichSu, mucTieu, soBuoiTapTuan) => {
    const { thoiGianTrungBinh, xuHuong, doKhoTap } = phanTichLichSu;

    // Thời gian cơ sở dựa trên mục tiêu
    let thoiGianCoSo = 60; // 60 phút mặc định

    switch (mucTieu) {
        case 'GIAM_CAN':
            thoiGianCoSo = 75; // Tập lâu hơn để đốt cháy calories
            break;
        case 'TANG_CO_BAP':
            thoiGianCoSo = 90; // Tập lâu hơn để phát triển cơ bắp
            break;
        case 'TANG_CAN':
            thoiGianCoSo = 45; // Tập ngắn hơn, tập trung vào sức mạnh
            break;
        case 'DUY_TRI':
            thoiGianCoSo = 60; // Thời gian cân bằng
            break;
    }

    // Điều chỉnh dựa trên lịch sử
    if (thoiGianTrungBinh > 0) {
        thoiGianCoSo = Math.round((thoiGianCoSo + thoiGianTrungBinh) / 2);
    }

    // Điều chỉnh dựa trên xu hướng
    if (xuHuong === 'tang_truong') {
        thoiGianCoSo = Math.min(thoiGianCoSo + 15, 120); // Tăng tối đa 15 phút
    } else if (xuHuong === 'giam_sut') {
        thoiGianCoSo = Math.max(thoiGianCoSo - 10, 30); // Giảm tối thiểu 30 phút
    }

    // Điều chỉnh dựa trên độ khó
    if (doKhoTap === 'DE') {
        thoiGianCoSo = Math.min(thoiGianCoSo + 10, 90);
    } else if (doKhoTap === 'RAT_KHO') {
        thoiGianCoSo = Math.max(thoiGianCoSo - 15, 45);
    }

    // Điều chỉnh dựa trên số buổi tập/tuần
    if (soBuoiTapTuan >= 5) {
        thoiGianCoSo = Math.min(thoiGianCoSo, 75); // Ít thời gian hơn nếu tập nhiều
    } else if (soBuoiTapTuan <= 2) {
        thoiGianCoSo = Math.min(thoiGianCoSo + 20, 120); // Nhiều thời gian hơn nếu tập ít
    }

    return {
        thoiGianToiUu: thoiGianCoSo,
        thoiGianToiThieu: Math.max(thoiGianCoSo - 15, 30),
        thoiGianToiDa: Math.min(thoiGianCoSo + 30, 120),
        lyDo: taoLyDoThoiGian(mucTieu, xuHuong, doKhoTap, soBuoiTapTuan)
    };
};

// Tạo lý do cho thời gian tập
const taoLyDoThoiGian = (mucTieu, xuHuong, doKhoTap, soBuoiTapTuan) => {
    const lyDo = [];

    // Lý do dựa trên mục tiêu
    switch (mucTieu) {
        case 'GIAM_CAN':
            lyDo.push('Thời gian này giúp đốt cháy calories hiệu quả');
            break;
        case 'TANG_CO_BAP':
            lyDo.push('Thời gian đủ để kích thích phát triển cơ bắp');
            break;
        case 'TANG_CAN':
            lyDo.push('Thời gian phù hợp để tập trung vào sức mạnh');
            break;
        case 'DUY_TRI':
            lyDo.push('Thời gian cân bằng để duy trì sức khỏe');
            break;
    }

    // Lý do dựa trên xu hướng
    if (xuHuong === 'tang_truong') {
        lyDo.push('Tăng thời gian để duy trì xu hướng tích cực');
    } else if (xuHuong === 'giam_sut') {
        lyDo.push('Giảm thời gian để tránh quá tải');
    }

    // Lý do dựa trên số buổi tập
    if (soBuoiTapTuan >= 5) {
        lyDo.push('Tập nhiều buổi nên mỗi buổi không cần quá dài');
    } else if (soBuoiTapTuan <= 2) {
        lyDo.push('Tập ít buổi nên mỗi buổi cần đủ thời gian');
    }

    return lyDo;
};

// Dự báo tiến độ tập luyện
const duBaoTienDoTap = (phanTichLichSu, thoiGianToiUu, mucTieu) => {
    const { tanSuatTap, xuHuong, caloTieuHaoTrungBinh } = phanTichLichSu;

    // Dự báo dựa trên xu hướng hiện tại
    let duBaoTuan = tanSuatTap;

    if (xuHuong === 'tang_truong') {
        duBaoTuan = Math.min(tanSuatTap + 0.5, 7);
    } else if (xuHuong === 'giam_sut') {
        duBaoTuan = Math.max(tanSuatTap - 0.5, 1);
    }

    // Dự báo calories tiêu hao
    const caloTieuHaoDuBao = Math.round(caloTieuHaoTrungBinh * duBaoTuan);

    // Dự báo thời gian đạt mục tiêu
    const thoiGianDatMucTieu = duBaoThoiGianDatMucTieu(mucTieu, duBaoTuan, caloTieuHaoDuBao);

    return {
        duBaoTuan: Math.round(duBaoTuan * 10) / 10,
        caloTieuHaoDuBao,
        thoiGianDatMucTieu,
        khaNangThanhCong: tinhKhaNangThanhCong(xuHuong, tanSuatTap, mucTieu)
    };
};

// Dự báo thời gian đạt mục tiêu
const duBaoThoiGianDatMucTieu = (mucTieu, duBaoTuan, caloTieuHaoDuBao) => {
    const tuanCanThiet = {
        'GIAM_CAN': 12, // 3 tháng
        'TANG_CO_BAP': 16, // 4 tháng
        'TANG_CAN': 8, // 2 tháng
        'DUY_TRI': 4 // 1 tháng
    };

    const tuanCoSo = tuanCanThiet[mucTieu] || 8;

    // Điều chỉnh dựa trên tần suất tập
    let heSoDieuChinh = 1;
    if (duBaoTuan >= 5) {
        heSoDieuChinh = 0.8; // Nhanh hơn 20%
    } else if (duBaoTuan <= 2) {
        heSoDieuChinh = 1.5; // Chậm hơn 50%
    }

    const tuanDuBao = Math.round(tuanCoSo * heSoDieuChinh);

    return {
        tuan: tuanDuBao,
        thang: Math.round(tuanDuBao / 4 * 10) / 10,
        ngay: tuanDuBao * 7
    };
};

// Tính khả năng thành công
const tinhKhaNangThanhCong = (xuHuong, tanSuatTap, mucTieu) => {
    let diem = 50; // Điểm cơ sở

    // Điều chỉnh dựa trên xu hướng
    if (xuHuong === 'tang_truong') diem += 20;
    else if (xuHuong === 'on_dinh') diem += 10;
    else if (xuHuong === 'giam_sut') diem -= 15;

    // Điều chỉnh dựa trên tần suất tập
    if (tanSuatTap >= 4) diem += 15;
    else if (tanSuatTap >= 3) diem += 10;
    else if (tanSuatTap >= 2) diem += 5;
    else diem -= 10;

    // Điều chỉnh dựa trên mục tiêu
    switch (mucTieu) {
        case 'DUY_TRI':
            diem += 10; // Dễ đạt nhất
            break;
        case 'TANG_CAN':
            diem += 5; // Tương đối dễ
            break;
        case 'GIAM_CAN':
            diem -= 5; // Cần kiên trì
            break;
        case 'TANG_CO_BAP':
            diem -= 10; // Khó nhất
            break;
    }

    return Math.max(0, Math.min(100, diem));
};

// Gợi ý phương pháp tập luyện
const gopYPhuongPhapTap = (phanTichLichSu, mucTieu, hoiVien) => {
    const { nhomCoTapChinh, doKhoTap, xuHuong } = phanTichLichSu;

    const phuongPhap = {
        phuongPhapChinh: '',
        baiTapGopY: [],
        lichTapGopY: {},
        luuY: [],
        thoiDiemTap: '',
        cheDoNghi: ''
    };

    // Phương pháp chính dựa trên mục tiêu
    switch (mucTieu) {
        case 'GIAM_CAN':
            phuongPhap.phuongPhapChinh = 'Cardio + HIIT + Tập tạ nhẹ';
            phuongPhap.baiTapGopY = [
                'Chạy bộ 20-30 phút',
                'HIIT 15-20 phút',
                'Squat, Lunges, Push-ups',
                'Plank, Mountain Climbers'
            ];
            phuongPhap.thoiDiemTap = 'Sáng sớm hoặc chiều tối';
            phuongPhap.cheDoNghi = 'Nghỉ 1-2 ngày/tuần';
            break;

        case 'TANG_CO_BAP':
            phuongPhap.phuongPhapChinh = 'Tập tạ nặng + Compound exercises';
            phuongPhap.baiTapGopY = [
                'Squat, Deadlift, Bench Press',
                'Pull-ups, Dips, Rows',
                'Overhead Press, Barbell Rows',
                'Bicep Curls, Tricep Extensions'
            ];
            phuongPhap.thoiDiemTap = 'Chiều tối (16h-20h)';
            phuongPhap.cheDoNghi = 'Nghỉ 2-3 ngày/tuần giữa các nhóm cơ';
            break;

        case 'TANG_CAN':
            phuongPhap.phuongPhapChinh = 'Tập tạ nặng + Ăn nhiều calories';
            phuongPhap.baiTapGopY = [
                'Squat, Deadlift nặng',
                'Bench Press, Overhead Press',
                'Barbell Rows, Pull-ups',
                'Leg Press, Calf Raises'
            ];
            phuongPhap.thoiDiemTap = 'Chiều tối (17h-19h)';
            phuongPhap.cheDoNghi = 'Nghỉ 2-3 ngày/tuần';
            break;

        case 'DUY_TRI':
            phuongPhap.phuongPhapChinh = 'Tập toàn thân + Cardio nhẹ';
            phuongPhap.baiTapGopY = [
                'Full body workout',
                'Chạy bộ nhẹ 20-30 phút',
                'Yoga, Pilates',
                'Swimming, Cycling'
            ];
            phuongPhap.thoiDiemTap = 'Bất kỳ thời gian nào trong ngày';
            phuongPhap.cheDoNghi = 'Nghỉ 1-2 ngày/tuần';
            break;
    }

    // Lịch tập gợi ý
    phuongPhap.lichTapGopY = taoLichTapGopY(mucTieu, phanTichLichSu);

    // Lưu ý dựa trên phân tích
    if (doKhoTap === 'DE') {
        phuongPhap.luuY.push('Tăng dần cường độ tập để tránh chấn thương');
    } else if (doKhoTap === 'RAT_KHO') {
        phuongPhap.luuY.push('Giảm cường độ tập để tránh kiệt sức');
    }

    if (xuHuong === 'giam_sut') {
        phuongPhap.luuY.push('Bắt đầu lại từ từ, không nóng vội');
    }

    if (nhomCoTapChinh.length > 0) {
        phuongPhap.luuY.push(`Tập trung vào nhóm cơ: ${nhomCoTapChinh.join(', ')}`);
    }

    return phuongPhap;
};

// Tạo lịch tập gợi ý
const taoLichTapGopY = (mucTieu, phanTichLichSu) => {
    const { tanSuatTap } = phanTichLichSu;

    const lichTap = {
        '2_buoi': {
            'T2': 'Upper Body + Cardio',
            'T5': 'Lower Body + Cardio'
        },
        '3_buoi': {
            'T2': 'Upper Body',
            'T4': 'Lower Body',
            'T6': 'Full Body + Cardio'
        },
        '4_buoi': {
            'T2': 'Upper Body',
            'T3': 'Cardio',
            'T5': 'Lower Body',
            'T6': 'Upper Body'
        },
        '5_buoi': {
            'T2': 'Upper Body',
            'T3': 'Cardio',
            'T4': 'Lower Body',
            'T5': 'Upper Body',
            'T6': 'Lower Body + Cardio'
        }
    };

    let soBuoi = Math.round(tanSuatTap);
    if (soBuoi < 2) soBuoi = 2;
    if (soBuoi > 5) soBuoi = 5;

    const key = `${soBuoi}_buoi`;
    return lichTap[key] || lichTap['3_buoi'];
};

// Dự báo hiệu quả tập luyện
const duBaoHieuQuaTap = async (hoiVienId, thoiGianTap, soBuoiTapTuan) => {
    try {
        const hoiVien = await HoiVien.findById(hoiVienId);
        if (!hoiVien) {
            throw new Error('Không tìm thấy hội viên');
        }

        // Tính calories tiêu hao dự kiến
        const caloTieuHaoDuKien = tinhCaloTieuHaoDuKien(hoiVien, thoiGianTap, soBuoiTapTuan);

        // Dự báo kết quả sau 1 tháng
        const ketQuaDuBao = duBaoKetQuaMotThang(hoiVien, caloTieuHaoDuKien, soBuoiTapTuan);

        // Gợi ý tối ưu hóa
        const toiUuHoa = gopYToiUuHoa(hoiVien, thoiGianTap, soBuoiTapTuan);

        return {
            caloTieuHaoDuKien,
            ketQuaDuBao,
            toiUuHoa
        };
    } catch (error) {
        console.error('Lỗi dự báo hiệu quả tập:', error);
        throw error;
    }
};

// Tính calories tiêu hao dự kiến
const tinhCaloTieuHaoDuKien = (hoiVien, thoiGianTap, soBuoiTapTuan) => {
    const { canNang, gioiTinh, tuoi } = hoiVien;

    // Tính BMR cơ bản
    let bmr;
    if (gioiTinh === 'NAM') {
        bmr = 88.362 + (13.397 * canNang) + (4.799 * 170) - (5.677 * tuoi); // Giả sử chiều cao 170cm
    } else {
        bmr = 447.593 + (9.247 * canNang) + (3.098 * 160) - (4.330 * tuoi); // Giả sử chiều cao 160cm
    }

    // Calories tiêu hao cho 1 buổi tập (dựa trên thời gian)
    const caloMoiPhut = 8; // Trung bình 8 calo/phút
    const caloMoiBuoi = thoiGianTap * caloMoiPhut;

    // Calories tiêu hao mỗi tuần
    const caloMoiTuan = caloMoiBuoi * soBuoiTapTuan;

    // Calories tiêu hao mỗi tháng
    const caloMoiThang = caloMoiTuan * 4.33; // 4.33 tuần/tháng

    return {
        moiBuoi: Math.round(caloMoiBuoi),
        moiTuan: Math.round(caloMoiTuan),
        moiThang: Math.round(caloMoiThang),
        bmr: Math.round(bmr)
    };
};

// Dự báo kết quả sau 1 tháng
const duBaoKetQuaMotThang = (hoiVien, caloTieuHaoDuKien, soBuoiTapTuan) => {
    const { canNang, gioiTinh } = hoiVien;

    // Tính giảm cân dự kiến (1kg = 7700 calo)
    const caloThieuHut = caloTieuHaoDuKien.moiThang - (caloTieuHaoDuKien.bmr * 30 * 0.1); // Giả sử ăn đủ BMR
    const giamCanDuKien = Math.max(0, caloThieuHut / 7700);

    // Dự báo cải thiện sức khỏe
    const caiThienSucKhoe = {
        timMach: soBuoiTapTuan >= 3 ? 'Cải thiện đáng kể' : 'Cải thiện nhẹ',
        coBap: soBuoiTapTuan >= 4 ? 'Tăng cường rõ rệt' : 'Tăng cường nhẹ',
        sucBen: soBuoiTapTuan >= 3 ? 'Tăng cường tốt' : 'Tăng cường vừa phải',
        linhHoat: soBuoiTapTuan >= 2 ? 'Cải thiện' : 'Duy trì'
    };

    return {
        giamCanDuKien: Math.round(giamCanDuKien * 10) / 10,
        caiThienSucKhoe,
        mucDoHieuQua: danhGiaMucDoHieuQua(soBuoiTapTuan, caloTieuHaoDuKien.moiTuan)
    };
};

// Đánh giá mức độ hiệu quả
const danhGiaMucDoHieuQua = (soBuoiTapTuan, caloTieuHaoTuan) => {
    if (soBuoiTapTuan >= 5 && caloTieuHaoTuan >= 2000) return 'Rất hiệu quả';
    if (soBuoiTapTuan >= 4 && caloTieuHaoTuan >= 1500) return 'Hiệu quả cao';
    if (soBuoiTapTuan >= 3 && caloTieuHaoTuan >= 1000) return 'Hiệu quả tốt';
    if (soBuoiTapTuan >= 2 && caloTieuHaoTuan >= 500) return 'Hiệu quả vừa phải';
    return 'Cần cải thiện';
};

// Gợi ý tối ưu hóa
const gopYToiUuHoa = (hoiVien, thoiGianTap, soBuoiTapTuan) => {
    const gopY = [];

    // Gợi ý dựa trên thời gian tập
    if (thoiGianTap < 45) {
        gopY.push('Tăng thời gian tập lên 45-60 phút để đạt hiệu quả tốt hơn');
    } else if (thoiGianTap > 90) {
        gopY.push('Giảm thời gian tập xuống 60-75 phút để tránh kiệt sức');
    }

    // Gợi ý dựa trên số buổi tập
    if (soBuoiTapTuan < 3) {
        gopY.push('Tăng số buổi tập lên 3-4 buổi/tuần để đạt mục tiêu nhanh hơn');
    } else if (soBuoiTapTuan > 6) {
        gopY.push('Giảm số buổi tập xuống 4-5 buổi/tuần để cơ thể có thời gian phục hồi');
    }

    // Gợi ý chung
    gopY.push('Kết hợp tập tạ và cardio để đạt hiệu quả tối ưu');
    gopY.push('Nghỉ ngơi đầy đủ giữa các buổi tập');
    gopY.push('Uống đủ nước và ăn uống cân bằng');

    return gopY;
};

module.exports = {
    duBaoThoiGianTap,
    duBaoHieuQuaTap,
    phanTichLichSuTap,
    tinhThoiGianToiUu,
    duBaoTienDoTap,
    gopYPhuongPhapTap
};
