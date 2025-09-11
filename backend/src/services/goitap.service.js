const GoiTap = require('../models/GoiTap');
const ChiTietGoiTap = require('../models/ChiTietGoiTap');

function toVNTime(date) {
    const d = new Date(date);
    d.setHours(d.getHours() + 7);
    return d;
}

const createGoiTap = async (data) => {
    if (data.ngayBatDau) data.ngayBatDau = toVNTime(data.ngayBatDau);
    if (data.ngayKetThuc) data.ngayKetThuc = toVNTime(data.ngayKetThuc);
    return await GoiTap.create(data);
};

const getAllGoiTap = async () => {
    return await GoiTap.find();
};

const getGoiTapById = async (id) => {
    return await GoiTap.findById(id);
};

const updateGoiTap = async (id, data) => {
    if (data.ngayBatDau) data.ngayBatDau = toVNTime(data.ngayBatDau);
    if (data.ngayKetThuc) data.ngayKetThuc = toVNTime(data.ngayKetThuc);
    return await GoiTap.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

const deleteGoiTap = async (id) => {
    const count = await ChiTietGoiTap.countDocuments({ maGoiTap: id });
    if (count > 0) {
        return await GoiTap.findByIdAndUpdate(id, { kichHoat: false }, { new: true });
    } else {
        return await GoiTap.findByIdAndDelete(id);
    }
};

module.exports = {
    createGoiTap,
    getAllGoiTap,
    getGoiTapById,
    updateGoiTap,
    deleteGoiTap
};
