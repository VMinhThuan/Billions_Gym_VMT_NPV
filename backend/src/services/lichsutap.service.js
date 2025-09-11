const LichSuTap = require('../models/LichSuTap');
const BuoiTap = require('../models/BuoiTap');

const createLichSuTap = async (data) => {
    const lichSu = new LichSuTap(data);
    await lichSu.save();
    return await LichSuTap.findById(lichSu._id)
        .populate('hoiVien', 'hoTen')
        .populate({
            path: 'buoiTap',
            populate: [
                { path: 'pt', select: 'hoTen' },
                { path: 'cacBaiTap', select: 'tenBaiTap nhomCo' }
            ]
        });
};

const getLichSuTapByHoiVien = async (maHoiVien, options = {}) => {
    const { startDate, endDate, limit = 20, page = 1 } = options;

    let query = { hoiVien: maHoiVien };

    if (startDate || endDate) {
        query.ngayTap = {};
        if (startDate) query.ngayTap.$gte = new Date(startDate);
        if (endDate) query.ngayTap.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const [lichSu, total] = await Promise.all([
        LichSuTap.find(query)
            .populate('hoiVien', 'hoTen')
            .populate({
                path: 'buoiTap',
                populate: [
                    { path: 'pt', select: 'hoTen' },
                    { path: 'cacBaiTap', select: 'tenBaiTap nhomCo' }
                ]
            })
            .sort({ ngayTap: -1 })
            .skip(skip)
            .limit(limit),
        LichSuTap.countDocuments(query)
    ]);

    return {
        data: lichSu,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    };
};

const getThongKeTapLuyen = async (maHoiVien, options = {}) => {
    const { startDate, endDate } = options;

    let matchQuery = { hoiVien: maHoiVien };

    if (startDate || endDate) {
        matchQuery.ngayTap = {};
        if (startDate) matchQuery.ngayTap.$gte = new Date(startDate);
        if (endDate) matchQuery.ngayTap.$lte = new Date(endDate);
    }

    const thongKe = await LichSuTap.aggregate([
        { $match: matchQuery },
        {
            $group: {
                _id: null,
                tongSoBuoiTap: { $sum: 1 },
                tongCaloTieuHao: { $sum: '$caloTieuHao' },
                danhGiaTrungBinh: { $avg: '$danhGia' },
                ngayTapGanNhat: { $max: '$ngayTap' },
                ngayTapDauTien: { $min: '$ngayTap' }
            }
        }
    ]);

    const thongKeTheoThang = await LichSuTap.aggregate([
        { $match: matchQuery },
        {
            $group: {
                _id: {
                    nam: { $year: '$ngayTap' },
                    thang: { $month: '$ngayTap' }
                },
                soBuoiTap: { $sum: 1 },
                caloTieuHao: { $sum: '$caloTieuHao' }
            }
        },
        { $sort: { '_id.nam': -1, '_id.thang': -1 } }
    ]);

    return {
        tongQuan: thongKe[0] || {
            tongSoBuoiTap: 0,
            tongCaloTieuHao: 0,
            danhGiaTrungBinh: 0,
            ngayTapGanNhat: null,
            ngayTapDauTien: null
        },
        thongKeTheoThang
    };
};

const updateLichSuTap = async (id, data) => {
    return await LichSuTap.findByIdAndUpdate(id, data, { new: true, runValidators: true })
        .populate('hoiVien', 'hoTen')
        .populate({
            path: 'buoiTap',
            populate: [
                { path: 'pt', select: 'hoTen' },
                { path: 'cacBaiTap', select: 'tenBaiTap nhomCo' }
            ]
        });
};

const deleteLichSuTap = async (id) => {
    return await LichSuTap.findByIdAndDelete(id);
};

module.exports = {
    createLichSuTap,
    getLichSuTapByHoiVien,
    getThongKeTapLuyen,
    updateLichSuTap,
    deleteLichSuTap
};
