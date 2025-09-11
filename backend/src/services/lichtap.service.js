const LichTap = require('../models/LichTap');
const BuoiTap = require('../models/BuoiTap');
const { HoiVien } = require('../models/NguoiDung');
const mongoose = require('mongoose');

const createLichTap = async (data) => {
    const { hoiVien } = data;

    if (!mongoose.Types.ObjectId.isValid(hoiVien)) {
        throw new Error('ID hội viên không đúng định dạng');
    }

    const hoiVienDoc = await HoiVien.findById(hoiVien);
    if (!hoiVienDoc) {
        throw new Error('Không tìm thấy hội viên');
    }
    const existedLichTap = await LichTap.findOne({ hoiVien });
    if (existedLichTap) {
        throw new Error('Hội viên này đã có lịch tập.');
    }
    const lichTap = new LichTap(data);
    await lichTap.save();
    return lichTap;
};

const getLichTapByHoiVien = async (maHoiVien) => {
    const lichTap = await LichTap.findOne({ hoiVien: maHoiVien }).populate({
        path: 'cacBuoiTap',
        populate: {
            path: 'cacBaiTap.baiTap',
            model: 'BaiTap'
        }
    });
    if (!lichTap) {
        throw new Error('Hội viên này chưa có lịch tập');
    }
    return lichTap;
};

const addBuoiTap = async (lichTapId, buoiTapData) => {
    const buoiTap = new BuoiTap(buoiTapData);
    await buoiTap.save();
    const lichTap = await LichTap.findByIdAndUpdate(
        lichTapId,
        { $push: { cacBuoiTap: buoiTap._id } },
        { new: true }
    );
    if (!lichTap) {
        throw new Error('Không tìm thấy lịch tập');
    }
    return buoiTap;
};

const updateBuoiTap = async (buoiTapId, buoiTapData) => {
    const buoiTap = await BuoiTap.findByIdAndUpdate(buoiTapId, buoiTapData, { new: true });
    if (!buoiTap) {
        throw new Error('Không tìm thấy buổi tập');
    }
    return buoiTap;
};

const deleteBuoiTap = async (lichTapId, buoiTapId) => {
    await BuoiTap.findByIdAndDelete(buoiTapId);
    const lichTap = await LichTap.findByIdAndUpdate(
        lichTapId,
        { $pull: { cacBuoiTap: buoiTapId } }
    );
    if (!lichTap) {
        throw new Error('Không tìm thấy lịch tập');
    }
    return { message: 'Đã xóa buổi tập' };
};

module.exports = {
    createLichTap,
    getLichTapByHoiVien,
    addBuoiTap,
    updateBuoiTap,
    deleteBuoiTap,
};