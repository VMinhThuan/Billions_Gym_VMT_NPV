const BuoiTap = require('../models/BuoiTap');
const LichTap = require('../models/LichTap');
const { HoiVien } = require('../models/NguoiDung');

const createBuoiTap = async (data) => {
    const buoiTap = new BuoiTap(data);
    await buoiTap.save();
    return await BuoiTap.findById(buoiTap._id)
        .populate('pt', 'hoTen sdt')
        .populate('cacBaiTap.baiTap');
};

const getBuoiTapById = async (id) => {
    return await BuoiTap.findById(id)
        .populate('pt', 'hoTen sdt chuyenMon')
        .populate('cacBaiTap.baiTap');
};

const getBuoiTapByHoiVien = async (maHoiVien, trangThai = null) => {
    let query = { hoiVien: maHoiVien };
    if (trangThai) {
        query.trangThaiTap = trangThai;
    }

    const buoiTaps = await BuoiTap.find(query)
        .populate('pt', 'hoTen sdt chuyenMon')
        .populate('hoiVien', 'hoTen')
        .populate('cacBaiTap.baiTap')
        .sort({ ngayTap: -1 });

    if (buoiTaps.length > 0) {
        return buoiTaps;
    }

    const lichTap = await LichTap.findOne({ hoiVien: maHoiVien })
        .populate({
            path: 'cacBuoiTap',
            populate: [
                { path: 'pt', select: 'hoTen sdt chuyenMon' },
                { path: 'cacBaiTap.baiTap' }
            ],
            match: trangThai ? { trangThaiTap: trangThai } : {}
        });

    if (lichTap && lichTap.cacBuoiTap.length > 0) {
        return lichTap.cacBuoiTap;
    }

    return [];
};

const getAllBuoiTap = async (trangThai = null) => {
    let query = {};
    if (trangThai) {
        query.trangThaiTap = trangThai;
    }

    return await BuoiTap.find(query)
        .populate('pt', 'hoTen sdt chuyenMon')
        .populate('hoiVien', 'hoTen')
        .populate('cacBaiTap.baiTap')
        .sort({ ngayTap: -1 });
};

const updateBuoiTap = async (id, data) => {
    return await BuoiTap.findByIdAndUpdate(id, data, { new: true, runValidators: true })
        .populate('pt', 'hoTen sdt')
        .populate('cacBaiTap.baiTap');
};

const hoanThanhBuoiTap = async (buoiTapId, maHoiVien) => {
    const buoiTap = await BuoiTap.findById(buoiTapId);
    if (!buoiTap) {
        throw new Error('Không tìm thấy buổi tập');
    }

    if (buoiTap.hoiVien && buoiTap.hoiVien.toString() !== maHoiVien) {
        throw new Error('Bạn không có quyền hoàn thành buổi tập này');
    }

    if (buoiTap.trangThaiTap === 'DA_HOAN_THANH') {
        throw new Error('Buổi tập này đã được hoàn thành rồi');
    }

    return await BuoiTap.findByIdAndUpdate(
        buoiTapId,
        {
            trangThaiTap: 'DA_HOAN_THANH',
            thoiGianKetThuc: new Date()
        },
        { new: true }
    ).populate('pt', 'hoTen sdt').populate('hoiVien', 'hoTen').populate('cacBaiTap.baiTap');
};

const deleteBuoiTap = async (id) => {
    await LichTap.updateMany(
        { cacBuoiTap: id },
        { $pull: { cacBuoiTap: id } }
    );

    return await BuoiTap.findByIdAndDelete(id);
};

const addBaiTapToBuoiTap = async (buoiTapId, baiTapData) => {
    const buoiTap = await BuoiTap.findById(buoiTapId);
    if (!buoiTap) {
        throw new Error('Không tìm thấy buổi tập');
    }

    const baiTapTrongBuoi = {
        baiTap: baiTapData.maBaiTap,
        soLanLap: baiTapData.soLanLap || 0,
        soSet: baiTapData.soSet || 1,
        trongLuong: baiTapData.trongLuong || 0,
        thoiGianNghi: baiTapData.thoiGianNghi || 60,
        ghiChu: baiTapData.ghiChu || ''
    };

    buoiTap.cacBaiTap.push(baiTapTrongBuoi);
    await buoiTap.save();

    return await BuoiTap.findById(buoiTapId)
        .populate('pt', 'hoTen sdt')
        .populate('cacBaiTap.baiTap');
};

const removeBaiTapFromBuoiTap = async (buoiTapId, baiTapId) => {
    const buoiTap = await BuoiTap.findById(buoiTapId);
    if (!buoiTap) {
        throw new Error('Không tìm thấy buổi tập');
    }

    console.log('Buổi tập trước khi xóa:', JSON.stringify(buoiTap.cacBaiTap, null, 2));
    console.log('Tìm bài tập có ID:', baiTapId);

    const baiTapIndex = buoiTap.cacBaiTap.findIndex(
        item => item.baiTap && item.baiTap.toString() === baiTapId
    );

    console.log('Index tìm thấy:', baiTapIndex);

    if (baiTapIndex === -1) {
        const baiTapIndexById = buoiTap.cacBaiTap.findIndex(
            item => item._id.toString() === baiTapId
        );

        if (baiTapIndexById === -1) {
            throw new Error('Không tìm thấy bài tập trong buổi tập này');
        } else {
            buoiTap.cacBaiTap.splice(baiTapIndexById, 1);
        }
    } else {
        buoiTap.cacBaiTap.splice(baiTapIndex, 1);
    }

    console.log('Buổi tập sau khi xóa:', JSON.stringify(buoiTap.cacBaiTap, null, 2));

    await buoiTap.save();

    return await BuoiTap.findById(buoiTapId)
        .populate('pt', 'hoTen sdt')
        .populate('hoiVien', 'hoTen')
        .populate('cacBaiTap.baiTap');
};

module.exports = {
    createBuoiTap,
    getBuoiTapById,
    getBuoiTapByHoiVien,
    getAllBuoiTap,
    updateBuoiTap,
    hoanThanhBuoiTap,
    deleteBuoiTap,
    addBaiTapToBuoiTap,
    removeBaiTapFromBuoiTap
};
