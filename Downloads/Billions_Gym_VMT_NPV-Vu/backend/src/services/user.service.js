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

const getHoiVienById = async (id) => {
    return HoiVien.findById(id);
}

const getPTById = async (id) => {
    return PT.findById(id);
}

const updateHoiVien = async (id, data) => {
    console.log('🔧 SERVICE - updateHoiVien called with:', { id, data });

    // ✅ SỬA: Chỉ convert date nếu có giá trị
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
    console.log('🔧 SERVICE - Found oldHoiVien:', oldHoiVien ? 'Yes' : 'No');
    if (!oldHoiVien) {
        console.log('❌ SERVICE - HoiVien not found with id:', id);
        return null;
    }

    console.log('🔧 SERVICE - Old HoiVien data:', {
        hoTen: oldHoiVien.hoTen,
        email: oldHoiVien.email,
        sdt: oldHoiVien.sdt,
        gioiTinh: oldHoiVien.gioiTinh
    });

    // ✅ SỬA: Kiểm tra email đã tồn tại - chỉ khi có thay đổi
    if (data.email !== undefined && data.email !== oldHoiVien.email) {
        console.log('🔧 SERVICE - Checking email uniqueness for:', data.email);
        const existedHoiVien = await HoiVien.findOne({ email: data.email, _id: { $ne: id } });
        const existedPT = await PT.findOne({ email: data.email });

        console.log('🔧 SERVICE - Email check results:', { existedHoiVien: !!existedHoiVien, existedPT: !!existedPT });

        if (existedHoiVien || existedPT) {
            console.log('🔧 SERVICE - Email already exists, throwing error');
            const err = new Error('Email đã tồn tại, vui lòng chọn email khác.');
            err.code = 11000;
            err.keyPattern = { email: 1 };
            throw err;
        }
    }

    // ✅ SỬA: Kiểm tra số điện thoại - chỉ khi có thay đổi
    if (data.sdt !== undefined && data.sdt !== oldHoiVien.sdt) {
        console.log('🔧 SERVICE - Checking phone uniqueness for:', data.sdt);
        const existedTK = await TaiKhoan.findOne({
            sdt: data.sdt,
            nguoiDung: { $ne: id }
        });
        console.log('🔧 SERVICE - Phone check result:', !!existedTK);

        if (existedTK) {
            console.log('🔧 SERVICE - Phone already exists, throwing error');
            const err = new Error('Số điện thoại đã tồn tại ở tài khoản khác');
            err.code = 11000;
            err.keyPattern = { sdt: 1 };
            throw err;
        }
        // ✅ THÊM: Cập nhật số điện thoại trong TaiKhoan
        console.log('🔧 SERVICE - Updating phone in TaiKhoan');
        await TaiKhoan.updateOne({ nguoiDung: id }, { sdt: data.sdt });
    }

    // ✅ SỬA: Chỉ cập nhật những trường có giá trị và khác với giá trị cũ
    const updateData = {};

    // Chỉ cập nhật những trường có trong data và khác với giá trị cũ
    if (data.hoTen !== undefined && data.hoTen !== oldHoiVien.hoTen) {
        if (data.hoTen && data.hoTen.trim() !== '') {
            updateData.hoTen = data.hoTen.trim();
        }
    }

    if (data.email !== undefined && data.email !== oldHoiVien.email) {
        // ✅ SỬA: Chỉ cập nhật email nếu có giá trị, không cho phép xóa
        if (data.email && data.email.trim() !== '') {
            updateData.email = data.email.trim();
        }
    }

    if (data.sdt !== undefined && data.sdt !== oldHoiVien.sdt) {
        // ✅ SỬA: Không cho phép xóa sdt vì cần để đăng nhập
        if (data.sdt && data.sdt.trim() !== '') {
            updateData.sdt = data.sdt.trim();
        } else {
            // Nếu cố gắng xóa sdt, giữ nguyên giá trị cũ
            console.log('🔧 SERVICE - Cannot delete sdt, keeping original value');
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

    // Xử lý ngaySinh - chỉ update nếu có giá trị mới
    if (data.ngaySinh !== undefined && data.ngaySinh !== null) {
        updateData.ngaySinh = data.ngaySinh;
    }

    console.log('🔧 SERVICE - Fields to update:', Object.keys(updateData));

    // Nếu không có trường nào cần cập nhật
    if (Object.keys(updateData).length === 0) {
        console.log('🔧 SERVICE - No fields to update, returning current data');
        return oldHoiVien;
    }

    console.log('🔧 SERVICE - About to update HoiVien with data:', updateData);

    try {
        const result = await HoiVien.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
            context: 'query'
        });
        console.log('🔧 SERVICE - Update result:', result ? 'Success' : 'Failed');
        return result;
    } catch (updateError) {
        console.log('❌ SERVICE - Update failed with error:', updateError.message);
        console.log('❌ SERVICE - Update error details:', updateError);
        throw updateError;
    }
};

const deleteHoiVien = async (id) => {
    await TaiKhoan.deleteOne({ nguoiDung: id });
    return HoiVien.findByIdAndDelete(id);
};

const createPT = async (data) => {
    console.log('📝 CreatePT - Received data:', JSON.stringify(data, null, 2));

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

module.exports = {
    createHoiVien,
    getAllHoiVien,
    getHoiVienById,
    getPTById,
    updateHoiVien,
    deleteHoiVien,
    createPT,
    getAllPT,
    updatePT,
    deletePT,
    lockTaiKhoan,
    unlockTaiKhoan,
    checkEmailExists,
    checkPhoneExists
};
