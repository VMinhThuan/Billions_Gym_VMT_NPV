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

// Get monthly packages only
const getMonthlyPackages = async () => {
    return await GoiTap.find({
        donViThoiHan: 'Thang',
        kichHoat: true
    }).sort({ donGia: 1 });
};

// Get packages by time unit
const getPackagesByTimeUnit = async (donViThoiHan) => {
    return await GoiTap.find({
        donViThoiHan: donViThoiHan,
        kichHoat: true
    }).sort({ donGia: 1 });
};

// Get active packages only
const getActivePackages = async () => {
    return await GoiTap.find({ kichHoat: true }).sort({ donGia: 1 });
};

// Get packages by type
const getPackagesByType = async (loaiGoiTap) => {
    return await GoiTap.find({
        loaiGoiTap: loaiGoiTap,
        kichHoat: true
    }).sort({ donGia: 1 });
};

// Get popular packages
const getPopularPackages = async () => {
    return await GoiTap.find({
        popular: true,
        kichHoat: true
    }).sort({ donGia: 1 });
};

// Get permanent packages
const getPermanentPackages = async () => {
    return await GoiTap.find({
        loaiThoiHan: 'VinhVien',
        kichHoat: true
    }).sort({ donGia: 1 });
};

// Get time-based packages
const getTimeBasedPackages = async () => {
    return await GoiTap.find({
        loaiThoiHan: 'TinhTheoNgay',
        kichHoat: true
    }).sort({ donGia: 1 });
};

module.exports = {
    createGoiTap,
    getAllGoiTap,
    getGoiTapById,
    updateGoiTap,
    deleteGoiTap,
    getMonthlyPackages,
    getPackagesByTimeUnit,
    getActivePackages,
    getPackagesByType,
    getPopularPackages,
    getPermanentPackages,
    getTimeBasedPackages
};
