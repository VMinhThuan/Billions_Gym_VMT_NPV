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
        hoTen: 'Họ tên',
        ngaySinh: 'Ngày sinh',
        gioiTinh: 'Giới tính',
        sdt: 'Số điện thoại'
    };
    for (const [field, fieldName] of Object.entries(requiredFields)) {
        if (!data[field]) {
            const err = new Error(`${fieldName} là bắt buộc.`);
            err.code = 400;
            throw err;
        }
    }

    // Xóa email nếu rỗng, null hoặc không phải chuỗi
    if (!data.email || data.email.trim() === '' || data.email === null || typeof data.email !== 'string') {
        delete data.email;
    }

    // Chỉ kiểm tra email nếu có giá trị hợp lệ
    if (data.email) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            const err = new Error('Email không đúng định dạng.');
            err.code = 400;
            throw err;
        }
        const existed = await HoiVien.findOne({ email: data.email }) || await PT.findOne({ email: data.email });
        if (existed) {
            const err = new Error('Email đã tồn tại, vui lòng chọn email khác.');
            err.code = 11000;
            err.keyPattern = { email: 1 };
            throw err;
        }
    }

    if (!/^\d{10,11}$/.test(data.sdt)) {
        const err = new Error('Số điện thoại phải có 10-11 chữ số.');
        err.code = 400;
        throw err;
    }

    const existedTK = await TaiKhoan.findOne({ sdt: data.sdt });
    if (existedTK) {
        const err = new Error('Số điện thoại đã tồn tại ở tài khoản khác');
        err.code = 11000;
        err.keyPattern = { sdt: 1 };
        throw err;
    }

    // Tạo dữ liệu Hội viên, chỉ thêm email nếu hợp lệ
    const hoiVienData = {
        hoTen: data.hoTen,
        ngaySinh: data.ngaySinh,
        gioiTinh: data.gioiTinh,
        sdt: data.sdt,
        ngayThamGia: data.ngayThamGia || new Date(),
        trangThaiHoiVien: data.trangThaiHoiVien || 'DANG_HOAT_DONG'
    };

    if (data.email) {
        hoiVienData.email = data.email.trim();
    }
    if (data.soCCCD) {
        hoiVienData.soCCCD = data.soCCCD;
    }
    if (data.diaChi) {
        hoiVienData.diaChi = data.diaChi;
    }
    if (data.anhDaiDien) {
        hoiVienData.anhDaiDien = data.anhDaiDien;
    }
    if (data.ngayHetHan) {
        hoiVienData.ngayHetHan = data.ngayHetHan;
    }

    const hoiVien = await HoiVien.create(hoiVienData);

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

const searchHoiVien = async (query) => {
    const searchRegex = new RegExp(query, 'i'); // 'i' for case-insensitive
    return HoiVien.find({
        $or: [
            { hoTen: { $regex: searchRegex } },
            { email: { $regex: searchRegex } },
            { sdt: { $regex: searchRegex } }
        ]
    });
};

const getHoiVienById = async (id) => {
    return HoiVien.findById(id);
}

const getPTById = async (id) => {
    return PT.findById(id);
}

const updateHoiVien = async (id, data) => {
    console.log('🔧 SERVICE - updateHoiVien called with:', { id, data });

    if (data.ngaySinh && data.ngaySinh !== null) {
        data.ngaySinh = toVNTime(data.ngaySinh);
    }
    if (data.ngayThamGia && data.ngayThamGia !== null) {
        data.ngayThamGia = toVNTime(data.ngayThamGia);
    }
    if (data.ngayHetHan && data.ngayHetHan !== null) {
        data.ngayHetHan = toVNTime(data.ngayHetHan);
    }

    const oldHoiVien = await HoiVien.findById(id);
    if (!oldHoiVien) {
        console.log('❌ SERVICE - HoiVien not found with id:', id);
        return null;
    }

    // Xóa email nếu rỗng hoặc không hợp lệ
    if (data.email !== undefined && (!data.email || data.email.trim() === '' || data.email === null)) {
        delete data.email;
    }

    // Kiểm tra trùng lặp email nếu có giá trị hợp lệ
    if (data.email && data.email !== oldHoiVien.email) {
        console.log('🔧 SERVICE - Checking email uniqueness for:', data.email);
        const existedHoiVien = await HoiVien.findOne({ email: data.email, _id: { $ne: id } });
        const existedPT = await PT.findOne({ email: data.email });
        if (existedHoiVien || existedPT) {
            console.log('🔧 SERVICE - Email already exists, throwing error');
            const err = new Error('Email đã tồn tại, vui lòng chọn email khác.');
            err.code = 11000;
            err.keyPattern = { email: 1 };
            throw err;
        }
    }

    // Kiểm tra số điện thoại nếu thay đổi
    if (data.sdt !== undefined && data.sdt !== oldHoiVien.sdt) {
        console.log('🔧 SERVICE - Checking phone uniqueness for:', data.sdt);
        const existedTK = await TaiKhoan.findOne({
            sdt: data.sdt,
            nguoiDung: { $ne: id }
        });
        if (existedTK) {
            console.log('🔧 SERVICE - Phone already exists, throwing error');
            const err = new Error('Số điện thoại đã tồn tại ở tài khoản khác');
            err.code = 11000;
            err.keyPattern = { sdt: 1 };
            throw err;
        }
        await TaiKhoan.updateOne({ nguoiDung: id }, { sdt: data.sdt });
    }

    const updateData = {};
    if (data.hoTen !== undefined && data.hoTen !== oldHoiVien.hoTen) {
        if (data.hoTen && data.hoTen.trim() !== '') {
            updateData.hoTen = data.hoTen.trim();
        }
    }
    if (data.email && data.email !== oldHoiVien.email) {
        updateData.email = data.email.trim();
    }
    if (data.sdt !== undefined && data.sdt !== oldHoiVien.sdt) {
        if (data.sdt && data.sdt.trim() !== '') {
            updateData.sdt = data.sdt.trim();
        }
    }
    if (data.gioiTinh !== undefined && data.gioiTinh !== oldHoiVien.gioiTinh) {
        updateData.gioiTinh = data.gioiTinh;
    }
    if (data.diaChi !== undefined && data.diaChi !== oldHoiVien.diaChi) {
        updateData.diaChi = data.diaChi;
    }
    if (data.avatar !== undefined && data.avatar !== oldHoiVien.avatar) {
        updateData.avatar = data.avatar;
    }
    if (data.ngaySinh !== undefined && data.ngaySinh !== null) {
        updateData.ngaySinh = data.ngaySinh;
    }
    if (data.ngayThamGia !== undefined && data.ngayThamGia !== null) {
        updateData.ngayThamGia = data.ngayThamGia;
    }
    if (data.ngayHetHan !== undefined && data.ngayHetHan !== null) {
        updateData.ngayHetHan = data.ngayHetHan;
    }

    return HoiVien.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
};

const deleteHoiVien = async (id) => {
    await TaiKhoan.deleteOne({ nguoiDung: id });
    return HoiVien.findByIdAndDelete(id);
};

const createPT = async (data) => {
    if (data.ngaySinh) data.ngaySinh = toVNTime(data.ngaySinh);

    const requiredFields = {
        hoTen: 'Họ tên',
        ngaySinh: 'Ngày sinh',
        gioiTinh: 'Giới tính',
        sdt: 'Số điện thoại',
        chuyenMon: 'Chuyên môn',
        bangCapChungChi: 'Bằng cấp chứng chỉ'
    };
    for (const [field, fieldName] of Object.entries(requiredFields)) {
        if (!data[field]) {
            const err = new Error(`${fieldName} là bắt buộc.`);
            err.code = 400;
            throw err;
        }
    }

    // Xóa email nếu rỗng, null hoặc không phải chuỗi
    if (!data.email || data.email.trim() === '' || data.email === null || typeof data.email !== 'string') {
        delete data.email;
    }

    // Chỉ kiểm tra email nếu có giá trị hợp lệ
    if (data.email) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            const err = new Error('Email không đúng định dạng.');
            err.code = 400;
            throw err;
        }
        const existed = await PT.findOne({ email: data.email }) || await HoiVien.findOne({ email: data.email });
        if (existed) {
            const err = new Error('Email đã tồn tại, vui lòng chọn email khác.');
            err.code = 11000;
            err.keyPattern = { email: 1 };
            throw err;
        }
    }

    if (!/^\d{10,11}$/.test(data.sdt)) {
        const err = new Error('Số điện thoại phải có 10-11 chữ số.');
        err.code = 400;
        throw err;
    }

    const existedTK = await TaiKhoan.findOne({ sdt: data.sdt });
    if (existedTK) {
        const err = new Error('Số điện thoại đã tồn tại ở tài khoản khác');
        err.code = 11000;
        err.keyPattern = { sdt: 1 };
        throw err;
    }

    console.log('🚀 Creating PT with data:', JSON.stringify(data, null, 2));

    // Tạo dữ liệu PT, chỉ thêm email nếu hợp lệ
    const ptData = {
        hoTen: data.hoTen,
        ngaySinh: data.ngaySinh,
        gioiTinh: data.gioiTinh,
        sdt: data.sdt,
        chuyenMon: data.chuyenMon,
        bangCapChungChi: data.bangCapChungChi,
        kinhNghiem: data.kinhNghiem || 0,
        trangThaiPT: data.trangThaiPT || 'DANG_HOAT_DONG'
    };

    if (data.email) {
        ptData.email = data.email.trim();
    }
    if (data.soCCCD) {
        ptData.soCCCD = data.soCCCD;
    }
    if (data.diaChi) {
        ptData.diaChi = data.diaChi;
    }
    if (data.anhDaiDien) {
        ptData.anhDaiDien = data.anhDaiDien;
    }
    if (data.moTa) {
        ptData.moTa = data.moTa;
    }
    if (data.danhGia && data.danhGia >= 1 && data.danhGia <= 5) {
        ptData.danhGia = data.danhGia;
    }

    const pt = await PT.create(ptData);

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

const searchPT = async (query) => {
    const searchRegex = new RegExp(query, 'i');
    return PT.find({
        $or: [
            { hoTen: searchRegex },
            { sdt: searchRegex },
            { email: searchRegex }
        ]
    });
};

const updatePT = async (id, data) => {
    if (data.ngaySinh) data.ngaySinh = toVNTime(data.ngaySinh);

    const oldPT = await PT.findById(id);
    if (!oldPT) return null;

    // Xóa email nếu rỗng hoặc không hợp lệ
    if (data.email !== undefined && (!data.email || data.email.trim() === '' || data.email === null)) {
        delete data.email;
    }

    // Kiểm tra trùng lặp email nếu có giá trị hợp lệ
    if (data.email && data.email !== oldPT.email) {
        const existedHoiVien = await HoiVien.findOne({ email: data.email });
        const existedPT = await PT.findOne({ email: data.email, _id: { $ne: id } });
        if (existedHoiVien || existedPT) {
            const err = new Error('Email đã tồn tại, vui lòng chọn email khác.');
            err.code = 11000;
            err.keyPattern = { email: 1 };
            throw err;
        }
    }

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

    const updateData = { ...data };
    if (data.email && data.email !== oldPT.email) {
        updateData.email = data.email.trim();
    }
    if ('danhGia' in updateData) {
        if (!updateData.danhGia || updateData.danhGia < 1 || updateData.danhGia > 5) {
            delete updateData.danhGia;
            await PT.findByIdAndUpdate(id, { $unset: { danhGia: "" } });
        }
    }

    return PT.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
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

const checkEmailExists = async (email, excludeId = null) => {
    try {
        let query = { email };
        if (excludeId) {
            query._id = { $ne: excludeId };
        }

        const hoiVien = await HoiVien.findOne(query);
        const pt = await PT.findOne(query);

        return !!(hoiVien || pt);
    } catch (error) {
        throw error;
    }
};

const checkPhoneExists = async (sdt, excludeId = null) => {
    try {
        let query = { sdt };
        if (excludeId) {
            query.nguoiDung = { $ne: excludeId };
        }

        const taiKhoan = await TaiKhoan.findOne(query);
        return !!taiKhoan;
    } catch (error) {
        throw error;
    }
};

const getTaiKhoanByPhone = async (sdt) => {
    try {
        const taiKhoan = await TaiKhoan.findOne({ sdt }).populate('nguoiDung');
        if (!taiKhoan) {
            throw new Error('Không tìm thấy tài khoản');
        }
        return taiKhoan;
    } catch (error) {
        console.error('Error getting account by phone:', error);
        throw error;
    }
};

module.exports = {
    createHoiVien,
    getAllHoiVien,
    getHoiVienById,
    getPTById,
    updateHoiVien,
    deleteHoiVien,
    createPT,
    getAllPT,
    searchPT,
    updatePT,
    deletePT,
    lockTaiKhoan,
    unlockTaiKhoan,
    checkEmailExists,
    checkPhoneExists,
    getTaiKhoanByPhone,
    searchHoiVien
};
