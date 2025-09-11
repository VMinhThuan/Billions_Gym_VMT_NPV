const TaiKhoan = require('../models/TaiKhoan');
const { NguoiDung } = require('../models/NguoiDung');

const findTaiKhoanBySdt = async (sdt) => {
    return TaiKhoan.findOne({ sdt });
};

const findNguoiDungById = async (id) => {
    return NguoiDung.findById(id);
};

module.exports = {
    findTaiKhoanBySdt,
    findNguoiDungById
};
