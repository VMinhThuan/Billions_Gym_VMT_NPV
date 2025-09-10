const { HoiVien, PT } = require('../models/NguoiDung');
const TaiKhoan = require('../models/TaiKhoan');
const { hashPassword } = require('../utils/hashPassword');

function toVNTime(date) {
    const d = new Date(date);
    d.setHours(d.getHours() + 7);
    return d;
}

const createHoiVien = async (data) => {
    if (data.ngaySinh) data.ngaySinh = toVNTime(data.ngaySinh);
    if (data.ngayThamGia) data.ngayThamGia = toVNTime(data.ngayThamGia);
    if (data.ngayHetHan) data.ngayHetHan = toVNTime(data.ngayHetHan);

    const requiredFields = {
        'hoTen': 'Họ tên',
        'ngaySinh': 'Ngày sinh',
        'gioiTinh': 'Giới tính',
        'sdt': 'Số điện thoại'
    };
    for (const [field, fieldName] of Object.entries(requiredFields)) {
        if (!data[field]) {
            const err = new Error(`${fieldName} là bắt buộc.`);
            err.code = 400;
            throw err;
        }
    }

    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        const err = new Error('Email không đúng định dạng.');
        err.code = 400;
        throw err;
    }

    if (!/^\d{10,11}$/.test(data.sdt)) {
        const err = new Error('Số điện thoại phải có 10-11 chữ số.');
        err.code = 400;
        throw err;
    }

    if (data.email) {
        const existed = await HoiVien.findOne({ email: data.email }) || await PT.findOne({ email: data.email });
        if (existed) {
            const err = new Error('Email đã tồn tại, vui lòng chọn email khác.');
            err.code = 11000;
            err.keyPattern = { email: 1 };
            throw err;
        }
    }

    const existedTK = await TaiKhoan.findOne({ sdt: data.sdt });
    if (existedTK) {
        const err = new Error('Số điện thoại đã tồn tại ở tài khoản khác');
        err.code = 11000;
        err.keyPattern = { sdt: 1 };
        throw err;
    }

    const hoiVien = await HoiVien.create(data);

    const sdt = data.sdt;
    const ngaySinh = new Date(data.ngaySinh);
    const dd = String(ngaySinh.getDate()).padStart(2, '0');
    const mm = String(ngaySinh.getMonth() + 1).padStart(2, '0');
    const yyyy = ngaySinh.getFullYear();
    const plainPassword = `${dd}${mm}${yyyy}`;
    const hashedPassword = await hashPassword(plainPassword);
    await TaiKhoan.create({ sdt, matKhau: hashedPassword, nguoiDung: hoiVien._id });
    return hoiVien;
};

const getAllHoiVien = async () => {
    return HoiVien.find();
};

const updateHoiVien = async (id, data) => {
    if (data.ngaySinh) data.ngaySinh = toVNTime(data.ngaySinh);
    if (data.ngayThamGia) data.ngayThamGia = toVNTime(data.ngayThamGia);
    if (data.ngayHetHan) data.ngayHetHan = toVNTime(data.ngayHetHan);

    const oldHoiVien = await HoiVien.findById(id);
    if (!oldHoiVien) return null;

    if (data.email && data.email !== oldHoiVien.email) {
        const existed = await HoiVien.findOne({ email: data.email, _id: { $ne: id } }) || await PT.findOne({ email: data.email });
        if (existed) {
            const err = new Error('Email đã tồn tại, vui lòng chọn email khác.');
            err.code = 11000;
            err.keyPattern = { email: 1 };
            throw err;
        }
    }

    if (data.sdt && data.sdt !== oldHoiVien.sdt) {
        const existedTK = await TaiKhoan.findOne({ sdt: data.sdt, nguoiDung: { $ne: id } });
        if (existedTK) {
            const err = new Error('Số điện thoại đã tồn tại ở tài khoản khác');
            err.code = 11000;
            err.keyPattern = { sdt: 1 };
            throw err;
        }
        await TaiKhoan.updateOne({ nguoiDung: id }, { sdt: data.sdt });
    }
    return HoiVien.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

const deleteHoiVien = async (id) => {
    await TaiKhoan.deleteOne({ nguoiDung: id });
    return HoiVien.findByIdAndDelete(id);
};

const createPT = async (data) => {
    if (data.ngaySinh) data.ngaySinh = toVNTime(data.ngaySinh);

    const requiredFields = {
        'hoTen': 'Họ tên',
        'ngaySinh': 'Ngày sinh',
        'gioiTinh': 'Giới tính',
        'sdt': 'Số điện thoại'
    };
    for (const [field, fieldName] of Object.entries(requiredFields)) {
        if (!data[field]) {
            const err = new Error(`${fieldName} là bắt buộc.`);
            err.code = 400;
            throw err;
        }
    }

    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        const err = new Error('Email không đúng định dạng.');
        err.code = 400;
        throw err;
    }

    if (!/^\d{10,11}$/.test(data.sdt)) {
        const err = new Error('Số điện thoại phải có 10-11 chữ số.');
        err.code = 400;
        throw err;
    }

    if (data.email) {
        const existed = await PT.findOne({ email: data.email }) || await HoiVien.findOne({ email: data.email });
        if (existed) {
            const err = new Error('Email đã tồn tại, vui lòng chọn email khác.');
            err.code = 11000;
            err.keyPattern = { email: 1 };
            throw err;
        }
    }

    const existedTK = await TaiKhoan.findOne({ sdt: data.sdt });
    if (existedTK) {
        const err = new Error('Số điện thoại đã tồn tại ở tài khoản khác');
        err.code = 11000;
        err.keyPattern = { sdt: 1 };
        throw err;
    }

    const pt = await PT.create(data);
    const sdt = data.sdt;
    const ngaySinh = new Date(data.ngaySinh);
    const dd = String(ngaySinh.getDate()).padStart(2, '0');
    const mm = String(ngaySinh.getMonth() + 1).padStart(2, '0');
    const yyyy = ngaySinh.getFullYear();
    const plainPassword = `${dd}${mm}${yyyy}`;
    const hashedPassword = await hashPassword(plainPassword);
    await TaiKhoan.create({ sdt, matKhau: hashedPassword, nguoiDung: pt._id });
    return pt;
};

const getAllPT = async () => {
    return PT.find();
};

const updatePT = async (id, data) => {
    if (data.ngaySinh) data.ngaySinh = toVNTime(data.ngaySinh);

    const oldPT = await PT.findById(id);
    if (!oldPT) return null;

    if (data.sdt && data.sdt !== oldPT.sdt) {
        const existedTK = await TaiKhoan.findOne({ sdt: data.sdt, nguoiDung: { $ne: id } });
        if (existedTK) {
            const err = new Error('Số điện thoại đã tồn tại ở tài khoản khác');
            err.code = 11000;
            err.keyPattern = { sdt: 1 };
            throw err;
        }
        await TaiKhoan.updateOne({ nguoiDung: id }, { sdt: data.sdt });
    }
    return PT.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

const deletePT = async (id) => {
    await TaiKhoan.deleteOne({ nguoiDung: id });
    return PT.findByIdAndDelete(id);
};

const lockTaiKhoan = async (nguoiDungId) => {
    const tk = await TaiKhoan.findOneAndUpdate(
        { nguoiDung: nguoiDungId },
        { trangThaiTK: 'DA_KHOA' },
        { new: true }
    );
    if (!tk) throw new Error('Không tìm thấy tài khoản');

    const hoiVien = await HoiVien.findById(nguoiDungId);
    if (hoiVien && hoiVien.trangThaiHoiVien !== 'HET_HAN') {
        hoiVien.trangThaiHoiVien = 'TAM_NGUNG';
        await hoiVien.save();
    }
    const pt = await PT.findById(nguoiDungId);
    if (pt) {
        pt.trangThaiPT = 'NGUNG_LAM_VIEC';
        await pt.save();
    }
    return tk;
};

const unlockTaiKhoan = async (nguoiDungId) => {
    const tk = await TaiKhoan.findOneAndUpdate(
        { nguoiDung: nguoiDungId },
        { trangThaiTK: 'DANG_HOAT_DONG' },
        { new: true }
    );
    if (!tk) throw new Error('Không tìm thấy tài khoản');

    const hoiVien = await HoiVien.findById(nguoiDungId);
    if (hoiVien) {
        const now = new Date();
        if (hoiVien.ngayHetHan && now > hoiVien.ngayHetHan) {
            hoiVien.trangThaiHoiVien = 'HET_HAN';
        } else {
            hoiVien.trangThaiHoiVien = 'DANG_HOAT_DONG';
        }
        await hoiVien.save();
    }

    const pt = await PT.findById(nguoiDungId);
    if (pt) {
        pt.trangThaiPT = 'DANG_HOAT_DONG';
        await pt.save();
    }
    return tk;
};

module.exports = {
    createHoiVien,
    getAllHoiVien,
    updateHoiVien,
    deleteHoiVien,
    createPT,
    getAllPT,
    updatePT,
    deletePT,
    lockTaiKhoan,
    unlockTaiKhoan
};
