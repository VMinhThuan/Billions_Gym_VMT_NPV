const ChiTietGoiTap = require('../models/ChiTietGoiTap');
const GoiTap = require('../models/GoiTap');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
dayjs.extend(utc);
dayjs.extend(timezone);

function toVNTime(date) {
    return dayjs(date).tz('Asia/Ho_Chi_Minh', true).toDate();
}

const createChiTietGoiTap = async (data) => {
    const existed = await ChiTietGoiTap.findOne({ maHoiVien: data.maHoiVien, maGoiTap: data.maGoiTap });
    if (existed) throw new Error('Hội viên đã đăng ký gói tập này rồi!');
    if (!data.ngayDangKy) {
        data.ngayDangKy = toVNTime(new Date());
    } else {
        data.ngayDangKy = toVNTime(data.ngayDangKy);
    }
    if (!data.ngayKetThuc) {
        const goiTap = await GoiTap.findById(data.maGoiTap);
        if (!goiTap) throw new Error('Không tìm thấy gói tập');
        const thoiHan = goiTap.thoiHan || 1;
        const ngayKetThuc = dayjs(data.ngayDangKy).add(thoiHan, 'day').tz('Asia/Ho_Chi_Minh', true).toDate();
        data.ngayKetThuc = ngayKetThuc;
    } else {
        data.ngayKetThuc = toVNTime(data.ngayKetThuc);
    }
    return await ChiTietGoiTap.create(data);
};

const getAllChiTietGoiTap = async (filter = {}) => {
    return await ChiTietGoiTap.find(filter).populate('maHoiVien').populate('maGoiTap');
};

const updateChiTietGoiTap = async (id, data) => {
    if (data.ngayDangKy) data.ngayDangKy = toVNTime(data.ngayDangKy);
    if (data.ngayKetThuc) data.ngayKetThuc = toVNTime(data.ngayKetThuc);
    return await ChiTietGoiTap.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

const deleteChiTietGoiTap = async (id) => {
    return await ChiTietGoiTap.findByIdAndDelete(id);
};

const getChiTietGoiTapByHoiVien = async (maHoiVien) => {
    return await ChiTietGoiTap.find({ maHoiVien })
        .populate('maGoiTap')
        .sort({ ngayDangKy: -1 });
};

module.exports = {
    createChiTietGoiTap,
    getAllChiTietGoiTap,
    updateChiTietGoiTap,
    deleteChiTietGoiTap,
    getChiTietGoiTapByHoiVien
};