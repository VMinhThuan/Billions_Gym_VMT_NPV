const LichHenPT = require('../models/LichHenPT');
const { HoiVien, PT } = require('../models/NguoiDung');

const createLichHenPT = async (data) => {
    const hoiVien = await HoiVien.findById(data.hoiVien);
    if (!hoiVien) {
        throw new Error('Không tìm thấy hội viên');
    }

    const pt = await PT.findById(data.pt);
    if (!pt) {
        throw new Error('Không tìm thấy personal trainer');
    }

    const existingAppointment = await LichHenPT.findOne({
        pt: data.pt,
        ngayHen: data.ngayHen,
        gioHen: data.gioHen,
        trangThaiLichHen: { $in: ['CHO_XAC_NHAN', 'DA_XAC_NHAN'] }
    });

    if (existingAppointment) {
        throw new Error('PT đã có lịch hẹn vào thời gian này');
    }

    const lichHenPT = new LichHenPT(data);
    await lichHenPT.save();

    return await LichHenPT.findById(lichHenPT._id)
        .populate('hoiVien', 'hoTen sdt email')
        .populate('pt', 'hoTen sdt chuyenMon');
};

const getAllLichHenPT = async (filters = {}) => {
    const query = {};

    if (filters.hoiVien) query.hoiVien = filters.hoiVien;
    if (filters.pt) query.pt = filters.pt;
    if (filters.trangThaiLichHen) query.trangThaiLichHen = filters.trangThaiLichHen;
    if (filters.ngayHen) {
        const startDate = new Date(filters.ngayHen);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
        query.ngayHen = { $gte: startDate, $lt: endDate };
    }

    return await LichHenPT.find(query)
        .populate('hoiVien', 'hoTen sdt email')
        .populate('pt', 'hoTen sdt chuyenMon')
        .sort({ ngayHen: 1, gioHen: 1 });
};

const getLichHenPTById = async (id) => {
    return await LichHenPT.findById(id)
        .populate('hoiVien', 'hoTen sdt email')
        .populate('pt', 'hoTen sdt chuyenMon');
};

const getLichHenPTByHoiVien = async (hoiVienId, trangThai = null) => {
    const query = { hoiVien: hoiVienId };
    if (trangThai) {
        query.trangThaiLichHen = trangThai;
    }

    return await LichHenPT.find(query)
        .populate('pt', 'hoTen sdt chuyenMon')
        .sort({ ngayHen: -1 });
};

const getLichHenPTByPT = async (ptId, trangThai = null) => {
    const query = { pt: ptId };
    if (trangThai) {
        query.trangThaiLichHen = trangThai;
    }

    return await LichHenPT.find(query)
        .populate('hoiVien', 'hoTen sdt email')
        .sort({ ngayHen: -1 });
};

const updateLichHenPT = async (id, data) => {
    const lichHenPT = await LichHenPT.findById(id);
    if (!lichHenPT) {
        throw new Error('Không tìm thấy lịch hẹn');
    }

    if (data.ngayHen || data.gioHen || data.pt) {
        const checkData = {
            pt: data.pt || lichHenPT.pt,
            ngayHen: data.ngayHen || lichHenPT.ngayHen,
            gioHen: data.gioHen || lichHenPT.gioHen
        };

        const existingAppointment = await LichHenPT.findOne({
            _id: { $ne: id },
            pt: checkData.pt,
            ngayHen: checkData.ngayHen,
            gioHen: checkData.gioHen,
            trangThaiLichHen: { $in: ['CHO_XAC_NHAN', 'DA_XAC_NHAN'] }
        });

        if (existingAppointment) {
            throw new Error('PT đã có lịch hẹn vào thời gian này');
        }
    }

    Object.assign(lichHenPT, data);
    await lichHenPT.save();

    return await LichHenPT.findById(id)
        .populate('hoiVien', 'hoTen sdt email')
        .populate('pt', 'hoTen sdt chuyenMon');
};

const xacNhanLichHenPT = async (id) => {
    const lichHenPT = await LichHenPT.findById(id);
    if (!lichHenPT) {
        throw new Error('Không tìm thấy lịch hẹn');
    }

    if (lichHenPT.trangThaiLichHen !== 'CHO_XAC_NHAN') {
        throw new Error('Chỉ có thể xác nhận lịch hẹn đang chờ xác nhận');
    }

    lichHenPT.trangThaiLichHen = 'DA_XAC_NHAN';
    await lichHenPT.save();

    return await LichHenPT.findById(id)
        .populate('hoiVien', 'hoTen sdt email')
        .populate('pt', 'hoTen sdt chuyenMon');
};

const huyLichHenPT = async (id) => {
    const lichHenPT = await LichHenPT.findById(id);
    if (!lichHenPT) {
        throw new Error('Không tìm thấy lịch hẹn');
    }

    if (lichHenPT.trangThaiLichHen === 'HOAN_THANH') {
        throw new Error('Không thể hủy lịch hẹn đã hoàn thành');
    }

    lichHenPT.trangThaiLichHen = 'DA_HUY';
    await lichHenPT.save();

    return await LichHenPT.findById(id)
        .populate('hoiVien', 'hoTen sdt email')
        .populate('pt', 'hoTen sdt chuyenMon');
};

const hoanThanhLichHenPT = async (id) => {
    const lichHenPT = await LichHenPT.findById(id);
    if (!lichHenPT) {
        throw new Error('Không tìm thấy lịch hẹn');
    }

    if (lichHenPT.trangThaiLichHen !== 'DA_XAC_NHAN') {
        throw new Error('Chỉ có thể hoàn thành lịch hẹn đã được xác nhận');
    }

    lichHenPT.trangThaiLichHen = 'HOAN_THANH';
    await lichHenPT.save();

    return await LichHenPT.findById(id)
        .populate('hoiVien', 'hoTen sdt email')
        .populate('pt', 'hoTen sdt chuyenMon');
};

const deleteLichHenPT = async (id) => {
    const lichHenPT = await LichHenPT.findById(id);
    if (!lichHenPT) {
        throw new Error('Không tìm thấy lịch hẹn');
    }

    await LichHenPT.findByIdAndDelete(id);
    return lichHenPT;
};

module.exports = {
    createLichHenPT,
    getAllLichHenPT,
    getLichHenPTById,
    getLichHenPTByHoiVien,
    getLichHenPTByPT,
    updateLichHenPT,
    xacNhanLichHenPT,
    huyLichHenPT,
    hoanThanhLichHenPT,
    deleteLichHenPT
};
