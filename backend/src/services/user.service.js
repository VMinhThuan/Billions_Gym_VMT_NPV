const { HoiVien, PT } = require('../models/NguoiDung');
const TaiKhoan = require('../models/TaiKhoan');
const ChiTietGoiTap = require('../models/ChiTietGoiTap');
const LichTap = require('../models/LichTap');
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
    // Aggregation để lấy chi nhánh và tổng tiền tích lũy từ ChiTietGoiTap
    const hoiViens = await HoiVien.aggregate([
        {
            // Lookup ChiTietGoiTap để lấy thông tin gói tập
            $lookup: {
                from: 'chitietgoitaps',
                localField: '_id',
                foreignField: 'nguoiDungId',
                as: 'cacGoiTap'
            }
        },
        {
            // Lookup LichTap để lấy chi nhánh từ lịch tập (nếu có)
            $lookup: {
                from: 'lichtaps',
                localField: '_id',
                foreignField: 'hoiVien',
                as: 'cacLichTap'
            }
        },
        {
            $addFields: {
                // Lấy chi nhánh từ gói mới nhất đã thanh toán (ưu tiên branchId trong ChiTietGoiTap)
                // Nếu không có thì lấy từ LichTap
                maChiNhanh: {
                    $let: {
                        vars: {
                            // Lấy các gói đã thanh toán và sắp xếp theo thời gian đăng ký giảm dần
                            sortedPackages: {
                                $sortArray: {
                                    input: {
                                        $filter: {
                                            input: '$cacGoiTap',
                                            as: 'goi',
                                            cond: { $eq: ['$$goi.trangThaiThanhToan', 'DA_THANH_TOAN'] }
                                        }
                                    },
                                    sortBy: { thoiGianDangKy: -1 }
                                }
                            }
                        },
                        in: {
                            $cond: {
                                if: { $gt: [{ $size: '$$sortedPackages' }, 0] },
                                then: {
                                    // Lấy branchId từ gói mới nhất
                                    $ifNull: [
                                        { $arrayElemAt: ['$$sortedPackages.branchId', 0] },
                                        // Nếu gói không có branchId, lấy từ LichTap tương ứng
                                        {
                                            $let: {
                                                vars: {
                                                    latestLichTap: {
                                                        $arrayElemAt: [
                                                            {
                                                                $sortArray: {
                                                                    input: '$cacLichTap',
                                                                    sortBy: { createdAt: -1 }
                                                                }
                                                            },
                                                            0
                                                        ]
                                                    }
                                                },
                                                in: {
                                                    $ifNull: ['$$latestLichTap.chiNhanh', null]
                                                }
                                            }
                                        }
                                    ]
                                },
                                else: {
                                    // Nếu không có gói đã thanh toán, lấy từ LichTap mới nhất
                                    $let: {
                                        vars: {
                                            latestLichTap: {
                                                $arrayElemAt: [
                                                    {
                                                        $sortArray: {
                                                            input: '$cacLichTap',
                                                            sortBy: { createdAt: -1 }
                                                        }
                                                    },
                                                    0
                                                ]
                                            }
                                        },
                                        in: {
                                            $ifNull: ['$$latestLichTap.chiNhanh', null]
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                // Tính tổng tiền tích lũy từ các gói đã thanh toán
                // Tổng = sum(soTienThanhToan) hoặc sum(giaGoiTapGoc + soTienBu) nếu không có soTienThanhToan
                soTienTichLuy: {
                    $sum: {
                        $map: {
                            input: {
                                $filter: {
                                    input: '$cacGoiTap',
                                    as: 'goi',
                                    cond: { $eq: ['$$goi.trangThaiThanhToan', 'DA_THANH_TOAN'] }
                                }
                            },
                            as: 'goiDaThanhToan',
                            in: {
                                // Ưu tiên dùng soTienThanhToan, nếu không có thì tính giaGoiTapGoc + soTienBu
                                $ifNull: [
                                    '$$goiDaThanhToan.soTienThanhToan',
                                    {
                                        $add: [
                                            { $ifNull: ['$$goiDaThanhToan.giaGoiTapGoc', 0] },
                                            { $ifNull: ['$$goiDaThanhToan.soTienBu', 0] }
                                        ]
                                    }
                                ]
                            }
                        }
                    }
                }
            }
        },
        {
            // Populate hangHoiVien
            $lookup: {
                from: 'hanghoiviens',
                localField: 'hangHoiVien',
                foreignField: '_id',
                as: 'hangHoiVienInfo'
            }
        },
        {
            $addFields: {
                hangHoiVien: {
                    $cond: {
                        if: { $gt: [{ $size: '$hangHoiVienInfo' }, 0] },
                        then: { $arrayElemAt: ['$hangHoiVienInfo', 0] },
                        else: null
                    }
                }
            }
        },
        {
            $project: {
                'cacGoiTap': 0,
                'cacLichTap': 0,
                'hangHoiVienInfo': 0
            }
        }
    ]);

    // Convert ObjectId về string để trả về JSON
    return hoiViens.map(hv => ({
        ...hv,
        _id: hv._id.toString(),
        maChiNhanh: hv.maChiNhanh ? hv.maChiNhanh.toString() : null,
        hangHoiVien: hv.hangHoiVien ? {
            _id: hv.hangHoiVien._id ? hv.hangHoiVien._id.toString() : null,
            tenHienThi: hv.hangHoiVien.tenHienThi,
            tenHang: hv.hangHoiVien.tenHang,
            mauSac: hv.hangHoiVien.mauSac
        } : null,
        soTienTichLuy: hv.soTienTichLuy || 0
    }));
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
    return PT.findById(id).select('+isOnline +lastActivity');
}

const updateHoiVien = async (id, data) => {
    // Chỉ convert date nếu có giá trị
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
        return null;
    }

    // ✅ SỬA: Kiểm tra email đã tồn tại - chỉ khi có thay đổi
    if (data.email !== undefined && data.email !== oldHoiVien.email) {
        const existedHoiVien = await HoiVien.findOne({ email: data.email, _id: { $ne: id } });
        const existedPT = await PT.findOne({ email: data.email });

        if (existedHoiVien || existedPT) {
            const err = new Error('Email đã tồn tại, vui lòng chọn email khác.');
            err.code = 11000;
            err.keyPattern = { email: 1 };
            throw err;
        }
    }

    // ✅ SỬA: Kiểm tra số điện thoại - chỉ khi có thay đổi
    if (data.sdt !== undefined && data.sdt !== oldHoiVien.sdt) {
        const existedTK = await TaiKhoan.findOne({
            sdt: data.sdt,
            nguoiDung: { $ne: id }
        });

        if (existedTK) {
            const err = new Error('Số điện thoại đã tồn tại ở tài khoản khác');
            err.code = 11000;
            err.keyPattern = { sdt: 1 };
            throw err;
        }
        // ✅ THÊM: Cập nhật số điện thoại trong TaiKhoan
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

    // Xử lý trangThaiHoiVien
    if (data.trangThaiHoiVien !== undefined && data.trangThaiHoiVien !== oldHoiVien.trangThaiHoiVien) {
        updateData.trangThaiHoiVien = data.trangThaiHoiVien;

        // Đồng bộ trạng thái tài khoản với trạng thái hội viên
        const trangThaiTK = data.trangThaiHoiVien === 'DANG_HOAT_DONG' ? 'DANG_HOAT_DONG' : 'DA_KHOA';
        await TaiKhoan.updateOne({ nguoiDung: id }, { trangThaiTK: trangThaiTK });
    }

    // Xử lý ngaySinh - chỉ update nếu có giá trị mới
    if (data.ngaySinh !== undefined && data.ngaySinh !== null) {
        updateData.ngaySinh = data.ngaySinh;
    }

    // Nếu không có trường nào cần cập nhật
    if (Object.keys(updateData).length === 0) {
        return oldHoiVien;
    }

    try {
        const result = await HoiVien.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
            context: 'query'
        });
        return result;
    } catch (updateError) {
        throw updateError;
    }
};

const deleteHoiVien = async (id) => {
    await TaiKhoan.deleteOne({ nguoiDung: id });
    return HoiVien.findByIdAndDelete(id);
};

const createPT = async (data) => {
    // Clean data - ensure email is either a valid string or undefined
    if (data.email === undefined || data.email === null || (typeof data.email === 'string' && data.email.trim() === '')) {
        data.email = undefined;
    } else {
        data.email = data.email.trim();
    }

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

    // Chỉ kiểm tra email trùng lặp nếu email là một string hợp lệ
    if (typeof data.email === 'string' && data.email.length > 0) {
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

    // Tạo object PT chỉ với các field có giá trị
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

    // Chỉ thêm các field optional nếu có giá trị
    if (typeof data.email === 'string' && data.email.trim() !== '') {
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
    // Chỉ thêm đánh giá nếu có giá trị hợp lệ (1-5)
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

/**
 * Get PTs with optional filters.
 * options: { branchId, highlight, limit, q }
 */
const getAllPT = async (options = {}) => {
    const { branchId, highlight, limit, q } = options || {};

    // If there's a search query, delegate to searchPT
    if (q) return searchPT(q);

    // Highlight mode: return top-rated PTs across branches
    if (highlight) {
        const lim = parseInt(limit, 10) || 5;
        let pts = await PT.find({ trangThaiPT: 'DANG_HOAT_DONG' })
            .select('+isOnline +lastActivity')
            .sort({ danhGia: -1, kinhNghiem: -1 })
            .limit(lim);

        // Fallback to base model if no results
        if (!pts || pts.length === 0) {
            pts = await require('../models/NguoiDung').NguoiDung.find({ vaiTro: 'PT' })
                .select('+isOnline +lastActivity')
                .sort({ danhGia: -1, kinhNghiem: -1 })
                .limit(lim);
        }
        return pts;
    }

    // Branch-specific PTs
    if (branchId) {
        let pts = await PT.find({ trangThaiPT: 'DANG_HOAT_DONG', chinhanh: branchId })
            .select('+isOnline +lastActivity');
        if (!pts || pts.length === 0) {
            pts = await require('../models/NguoiDung').NguoiDung.find({ vaiTro: 'PT', chinhanh: branchId })
                .select('+isOnline +lastActivity');
        }
        return pts;
    }

    // Default: return all PTs
    return PT.find().select('+isOnline +lastActivity');
};

const searchPT = async (query) => {
    const searchRegex = new RegExp(query, 'i');
    return PT.find({
        $or: [
            { hoTen: searchRegex },
            { sdt: searchRegex },
            { email: searchRegex }
        ]
    }).select('+isOnline +lastActivity');
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

    // Tạo object update chỉ với các field có giá trị hợp lệ
    const updateData = { ...data };

    // Xử lý đánh giá - chỉ update nếu có giá trị hợp lệ hoặc xóa nếu là 0
    if ('danhGia' in updateData) {
        if (!updateData.danhGia || updateData.danhGia < 1 || updateData.danhGia > 5) {
            // Nếu đánh giá không hợp lệ, xóa field này khỏi update
            delete updateData.danhGia;
            // Và unset field trong database
            await PT.findByIdAndUpdate(id, { $unset: { danhGia: "" } });
        }
    }

    return PT.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
};

const deletePT = async (id) => {
    await TaiKhoan.deleteOne({ nguoiDung: id });
    return PT.findByIdAndDelete(id);
};

const resetPTPassword = async (ptId, newPassword = '1') => {
    const pt = await PT.findById(ptId);
    if (!pt) {
        const err = new Error('Không tìm thấy huấn luyện viên');
        err.code = 404;
        throw err;
    }

    const taiKhoan = await TaiKhoan.findOne({ nguoiDung: ptId });
    if (!taiKhoan) {
        const err = new Error('Huấn luyện viên này chưa có tài khoản để đặt lại mật khẩu');
        err.code = 404;
        throw err;
    }

    const plainPassword = (typeof newPassword === 'string' && newPassword.trim() !== '')
        ? newPassword.trim()
        : '1';
    const hashedPassword = await hashPassword(plainPassword);

    taiKhoan.matKhau = hashedPassword;
    await taiKhoan.save();

    return {
        _id: taiKhoan._id,
        sdt: taiKhoan.sdt,
        trangThaiTK: taiKhoan.trangThaiTK,
        nguoiDung: taiKhoan.nguoiDung
    };
};

const createPTAccount = async (ptId, options = {}) => {
    const pt = await PT.findById(ptId);
    if (!pt) {
        const err = new Error('Không tìm thấy huấn luyện viên');
        err.code = 404;
        throw err;
    }

    if (!pt.sdt) {
        const err = new Error('PT chưa có số điện thoại để tạo tài khoản');
        err.code = 400;
        throw err;
    }

    const existedByUser = await TaiKhoan.findOne({ nguoiDung: ptId });
    if (existedByUser) {
        const err = new Error('Huấn luyện viên này đã có tài khoản');
        err.code = 409;
        throw err;
    }

    const existedByPhone = await TaiKhoan.findOne({ sdt: pt.sdt });
    if (existedByPhone) {
        const err = new Error('Số điện thoại đã được dùng cho tài khoản khác');
        err.code = 409;
        throw err;
    }

    const defaultPassword = (typeof options.defaultPassword === 'string' && options.defaultPassword.trim() !== '')
        ? options.defaultPassword.trim()
        : '1';
    const hashedPassword = await hashPassword(defaultPassword);

    const taiKhoan = await TaiKhoan.create({
        sdt: pt.sdt,
        matKhau: hashedPassword,
        nguoiDung: pt._id,
        trangThaiTK: 'DANG_HOAT_DONG'
    });

    return {
        _id: taiKhoan._id,
        sdt: taiKhoan.sdt,
        trangThaiTK: taiKhoan.trangThaiTK,
        nguoiDung: taiKhoan.nguoiDung
    };
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
        // Trả về null nếu không có – tránh ném lỗi để controller có thể trả 200 rỗng
        return taiKhoan || null;
    } catch (error) {
        console.error('Error getting account by phone:', error);
        // An toàn: không ném lỗi 500 cho trường hợp này, trả null
        return null;
    }
};

// Lấy hạng hội viên của người dùng
const getUserWithRank = async (userId) => {
    const user = await HoiVien.findById(userId).populate('hangHoiVien');
    if (!user) {
        throw new Error('Không tìm thấy người dùng');
    }
    return {
        id: user._id,
        hoTen: user.hoTen,
        hangHoiVien: user.hangHoiVien ? user.hangHoiVien.tenHang : 'Chưa có hạng'
    };
};

const getUserProfile = async (userId) => {
    const user = await TaiKhoan.findOne({ nguoiDung: userId }).populate({
        path: 'nguoiDung',
        populate: {
            path: 'hangHoiVien'
        }
    });
    if (!user) {
        throw new Error('Không tìm thấy người dùng');
    }
    return user.nguoiDung;
};

const updateUserProfile = async (userId, data) => {
    const taiKhoan = await TaiKhoan.findOne({ nguoiDung: userId });
    if (!taiKhoan) {
        throw new Error('Không tìm thấy tài khoản');
    }
    if (data.sdt && data.sdt !== taiKhoan.sdt) {
        const existedTK = await TaiKhoan.findOne({ sdt: data.sdt, nguoiDung: { $ne: userId } });
        if (existedTK) {
            const err = new Error('Số điện thoại đã tồn tại ở tài khoản khác');
            err.code = 11000;
            err.keyPattern = { sdt: 1 };
            throw err;
        }
        taiKhoan.sdt = data.sdt;
        await taiKhoan.save();
    }

    const user = await HoiVien.findById(userId) || await PT.findById(userId);
    if (!user) {
        throw new Error('Không tìm thấy người dùng');
    }
    const updateData = { ...data };
    return user.constructor.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
    );
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
    resetPTPassword,
    createPTAccount,
    lockTaiKhoan,
    unlockTaiKhoan,
    checkEmailExists,
    checkPhoneExists,
    getTaiKhoanByPhone,
    searchHoiVien,
    getUserWithRank,
    getUserProfile,
    updateUserProfile
};
