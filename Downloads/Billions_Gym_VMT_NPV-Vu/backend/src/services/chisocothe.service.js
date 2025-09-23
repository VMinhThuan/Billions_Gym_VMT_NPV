const ChiSoCoThe = require('../models/ChiSoCoThe');
const { HoiVien } = require('../models/NguoiDung');

const tinhBMI = (chieuCao, canNang) => {
    if (!chieuCao || !canNang) return null;
    const chieuCaoMet = chieuCao / 100;
    return Math.round((canNang / (chieuCaoMet * chieuCaoMet)) * 100) / 100;
};

const danhGiaBMI = (bmi) => {
    if (!bmi) return null;
    if (bmi < 18.5) return 'Thiếu cân';
    if (bmi < 25) return 'Bình thường';
    if (bmi < 30) return 'Thừa cân';
    return 'Béo phì';
};

const createChiSoCoThe = async (data) => {
    const hoiVien = await HoiVien.findById(data.hoiVien);
    if (!hoiVien) {
        throw new Error('Không tìm thấy hội viên');
    }

    if (data.chieuCao && data.canNang) {
        data.bmi = tinhBMI(data.chieuCao, data.canNang);
    }

    const chiSoCoThe = new ChiSoCoThe(data);
    await chiSoCoThe.save();

    return await ChiSoCoThe.findById(chiSoCoThe._id)
        .populate('hoiVien', 'hoTen email');
};

const getAllChiSoCoThe = async (filters = {}) => {
    const query = {};

    if (filters.hoiVien) query.hoiVien = filters.hoiVien;
    if (filters.ngayBatDau && filters.ngayKetThuc) {
        query.ngayDo = {
            $gte: new Date(filters.ngayBatDau),
            $lte: new Date(filters.ngayKetThuc)
        };
    } else if (filters.ngayBatDau) {
        query.ngayDo = { $gte: new Date(filters.ngayBatDau) };
    } else if (filters.ngayKetThuc) {
        query.ngayDo = { $lte: new Date(filters.ngayKetThuc) };
    }

    return await ChiSoCoThe.find(query)
        .populate('hoiVien', 'hoTen email')
        .sort({ ngayDo: -1 });
};

const getChiSoCoTheById = async (id) => {
    const chiSo = await ChiSoCoThe.findById(id)
        .populate('hoiVien', 'hoTen email sdt');

    if (chiSo && chiSo.bmi) {
        return {
            ...chiSo.toObject(),
            danhGiaBMI: danhGiaBMI(chiSo.bmi)
        };
    }

    return chiSo;
};

const getChiSoCoTheByHoiVien = async (hoiVienId, limit = null) => {
    let query = ChiSoCoThe.find({ hoiVien: hoiVienId })
        .populate('hoiVien', 'hoTen email')
        .sort({ ngayDo: -1 });

    if (limit) {
        query = query.limit(limit);
    }

    const chiSos = await query;

    return chiSos.map(chiSo => ({
        ...chiSo.toObject(),
        danhGiaBMI: chiSo.bmi ? danhGiaBMI(chiSo.bmi) : null
    }));
};

const getLatestChiSoByHoiVien = async (hoiVienId) => {
    const chiSo = await ChiSoCoThe.findOne({ hoiVien: hoiVienId })
        .populate('hoiVien', 'hoTen email')
        .sort({ ngayDo: -1 });

    if (chiSo && chiSo.bmi) {
        return {
            ...chiSo.toObject(),
            danhGiaBMI: danhGiaBMI(chiSo.bmi)
        };
    }

    return chiSo;
};

const updateChiSoCoThe = async (id, data) => {
    const chiSoCoThe = await ChiSoCoThe.findById(id);
    if (!chiSoCoThe) {
        throw new Error('Không tìm thấy chỉ số cơ thể');
    }

    const newChieuCao = data.chieuCao || chiSoCoThe.chieuCao;
    const newCanNang = data.canNang || chiSoCoThe.canNang;

    if (newChieuCao && newCanNang) {
        data.bmi = tinhBMI(newChieuCao, newCanNang);
    }

    Object.assign(chiSoCoThe, data);
    await chiSoCoThe.save();

    const updatedChiSo = await ChiSoCoThe.findById(id)
        .populate('hoiVien', 'hoTen email');

    return {
        ...updatedChiSo.toObject(),
        danhGiaBMI: updatedChiSo.bmi ? danhGiaBMI(updatedChiSo.bmi) : null
    };
};

const deleteChiSoCoThe = async (id) => {
    const chiSoCoThe = await ChiSoCoThe.findById(id);
    if (!chiSoCoThe) {
        throw new Error('Không tìm thấy chỉ số cơ thể');
    }

    await ChiSoCoThe.findByIdAndDelete(id);
    return chiSoCoThe;
};

const getThongKeChiSo = async (hoiVienId, soLanGanNhat = 10) => {
    const chiSos = await ChiSoCoThe.find({ hoiVien: hoiVienId })
        .sort({ ngayDo: -1 })
        .limit(soLanGanNhat);

    if (chiSos.length === 0) {
        return {
            message: 'Chưa có dữ liệu chỉ số cơ thể',
            data: []
        };
    }

    const latest = chiSos[0];
    const oldest = chiSos[chiSos.length - 1];

    const xuHuong = {
        canNang: latest.canNang && oldest.canNang ?
            Math.round((latest.canNang - oldest.canNang) * 100) / 100 : null,
        bmi: latest.bmi && oldest.bmi ?
            Math.round((latest.bmi - oldest.bmi) * 100) / 100 : null,
        nhipTim: latest.nhipTim && oldest.nhipTim ?
            latest.nhipTim - oldest.nhipTim : null
    };

    return {
        chiSoHienTai: {
            ...latest.toObject(),
            danhGiaBMI: latest.bmi ? danhGiaBMI(latest.bmi) : null
        },
        xuHuongThayDoi: xuHuong,
        lichSuChiSo: chiSos.map(chiSo => ({
            ...chiSo.toObject(),
            danhGiaBMI: chiSo.bmi ? danhGiaBMI(chiSo.bmi) : null
        })),
        tongSoLanDo: chiSos.length
    };
};

module.exports = {
    createChiSoCoThe,
    getAllChiSoCoThe,
    getChiSoCoTheById,
    getChiSoCoTheByHoiVien,
    getLatestChiSoByHoiVien,
    updateChiSoCoThe,
    deleteChiSoCoThe,
    getThongKeChiSo,
    tinhBMI,
    danhGiaBMI
};
