const userService = require('../services/user.service');

exports.lockTaiKhoan = async (req, res) => {
    try {
        const { id } = req.params;
        const tk = await userService.lockTaiKhoan(id);
        res.json({ message: 'Khóa tài khoản thành công', taiKhoan: tk });
    } catch (err) {
        if (err.message === 'Không tìm thấy tài khoản') {
            return res.status(404).json({ message: err.message });
        }
        res.status(500).json({ message: 'Khóa tài khoản thất bại', error: err.message });
    }
};

exports.unlockTaiKhoan = async (req, res) => {
    try {
        const { id } = req.params;
        const tk = await userService.unlockTaiKhoan(id);
        res.json({ message: 'Mở khóa tài khoản thành công', taiKhoan: tk });
    } catch (err) {
        if (err.message === 'Không tìm thấy tài khoản') {
            return res.status(404).json({ message: err.message });
        }
        res.status(500).json({ message: 'Mở khóa tài khoản thất bại', error: err.message });
    }
};

// Hội Viên
exports.createHoiVien = async (req, res) => {
    try {
        const hoiVien = await userService.createHoiVien(req.body);
        res.status(201).json(hoiVien);
    } catch (err) {
        if (err.code === 400) {
            return res.status(400).json({ message: err.message });
        }
        if (err && err.code === 11000 && typeof err.keyPattern === 'object' && err.keyPattern !== null) {
            if ('email' in err.keyPattern) {
                return res.status(400).json({ message: 'Email đã tồn tại, vui lòng chọn email khác.' });
            }
            if ('sdt' in err.keyPattern) {
                return res.status(400).json({ message: 'Số điện thoại đã tồn tại, vui lòng chọn số khác.' });
            }
        }
        res.status(400).json({ message: 'Tạo hội viên thất bại', error: err.message });
    }
};

exports.getAllHoiVien = async (req, res) => {
    try {
        const { q } = req.query;
        let hoiViens;
        if (q) {
            hoiViens = await userService.searchHoiVien(q);
        } else {
            hoiViens = await userService.getAllHoiVien();
        }
        res.json(hoiViens);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
};

exports.getHoiVienById = async (req, res) => {
    try {
        const hoiVien = await userService.getHoiVienById(req.params.id);
        if (!hoiVien) return res.status(404).json({ message: 'Không tìm thấy hội viên' });
        res.json(hoiVien);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
};

exports.getPTById = async (req, res) => {
    try {
        const pt = await userService.getPTById(req.params.id);
        if (!pt) return res.status(404).json({ message: 'Không tìm thấy PT' });
        res.json(pt);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
};

exports.updateHoiVien = async (req, res) => {
    try {
        // Kiểm tra quyền hạn với convert string để đảm bảo so sánh đúng
        if (req.user.vaiTro === 'HoiVien' && req.params.id.toString() !== req.user.id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Bạn chỉ có thể cập nhật thông tin của chính mình'
            });
        }

        const hoiVien = await userService.updateHoiVien(req.params.id, req.body);

        if (!hoiVien) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy hội viên'
            });
        }

        res.json({
            success: true,
            message: 'Cập nhật thông tin thành công',
            data: hoiVien
        });
    } catch (err) {

        if (err && err.code === 11000 && typeof err.keyPattern === 'object' && err.keyPattern !== null) {
            if ('email' in err.keyPattern) {
                return res.status(400).json({
                    success: false,
                    message: 'Email đã tồn tại, vui lòng chọn email khác.'
                });
            }
            if ('sdt' in err.keyPattern) {
                return res.status(400).json({
                    success: false,
                    message: 'Số điện thoại đã tồn tại, vui lòng chọn số khác.'
                });
            }
        }
        res.status(400).json({
            success: false,
            message: 'Cập nhật thất bại',
            error: err.message
        });
    }
};

exports.checkEmailExists = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Email là bắt buộc' });
        }

        const exists = await userService.checkEmailExists(email, req.user?.id);
        res.json({ exists });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
};

exports.checkPhoneExists = async (req, res) => {
    try {
        const { sdt } = req.body;
        if (!sdt) {
            return res.status(400).json({ message: 'Số điện thoại là bắt buộc' });
        }

        const exists = await userService.checkPhoneExists(sdt, req.user?.id);
        res.json({ exists });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
};



exports.deleteHoiVien = async (req, res) => {
    try {
        const hoiVien = await userService.deleteHoiVien(req.params.id);
        if (!hoiVien) return res.status(404).json({ message: 'Không tìm thấy hội viên' });
        res.json({ message: 'Xóa hội viên thành công' });
    } catch (err) {
        res.status(500).json({ message: 'Xóa thất bại', error: err.message });
    }
};

// PT
exports.createPT = async (req, res) => {
    try {
        // Xóa email nếu nó là empty, null, hoặc undefined
        if (!req.body.email || req.body.email.trim() === '') {
            delete req.body.email;
        }

        const pt = await userService.createPT(req.body);
        res.status(201).json(pt);
    } catch (err) {
        if (err.code === 400) {
            return res.status(400).json({ message: err.message });
        }
        if (err && err.code === 11000 && typeof err.keyPattern === 'object' && err.keyPattern !== null) {
            if ('email' in err.keyPattern) {
                return res.status(400).json({ message: 'Email đã tồn tại, vui lòng chọn email khác.' });
            }
            if ('sdt' in err.keyPattern) {
                return res.status(400).json({ message: 'Số điện thoại đã tồn tại, vui lòng chọn số khác.' });
            }
        }
        res.status(400).json({ message: 'Tạo PT thất bại', error: err.message });
    }
};

exports.getAllPT = async (req, res) => {
    try {
        const { q, branchId, highlight, limit } = req.query;
        let pts;

        // If search query provided, delegate to searchPT
        if (q) {
            pts = await userService.searchPT(q);
        } else {
            // Pass options to service for smarter querying
            pts = await userService.getAllPT({ branchId, highlight: highlight === 'true' || highlight === true, limit, q });
        }

        // Return as-is (service returns array). Keep old callers compatibility.
        res.json(pts);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
};

exports.updatePT = async (req, res) => {
    try {
        const pt = await userService.updatePT(req.params.id, req.body);
        if (!pt) return res.status(404).json({ message: 'Không tìm thấy PT' });
        res.json(pt);
    } catch (err) {
        if (err && err.code === 11000 && typeof err.keyPattern === 'object' && err.keyPattern !== null) {
            if ('email' in err.keyPattern) {
                return res.status(400).json({ message: 'Email đã tồn tại, vui lòng chọn email khác.' });
            }
            if ('sdt' in err.keyPattern) {
                return res.status(400).json({ message: 'Số điện thoại đã tồn tại, vui lòng chọn số khác.' });
            }
        }
        res.status(400).json({ message: 'Cập nhật thất bại', error: err.message });
    }
};

exports.deletePT = async (req, res) => {
    try {
        const pt = await userService.deletePT(req.params.id);
        if (!pt) return res.status(404).json({ message: 'Không tìm thấy PT' });
        res.json({ message: 'Xóa PT thành công' });
    } catch (err) {
        res.status(500).json({ message: 'Xóa thất bại', error: err.message });
    }
};

exports.resetPTPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '1';
        const taiKhoan = await userService.resetPTPassword(id, newPassword);
        res.json({
            message: `Đã đặt lại mật khẩu PT về ${newPassword}`,
            taiKhoan
        });
    } catch (err) {
        if (err.code === 404) {
            return res.status(404).json({ message: err.message });
        }
        res.status(500).json({ message: 'Đặt lại mật khẩu PT thất bại', error: err.message });
    }
};

exports.createPTAccount = async (req, res) => {
    try {
        const { id } = req.params;
        const defaultPassword = typeof req.body?.defaultPassword === 'string' ? req.body.defaultPassword : undefined;
        const taiKhoan = await userService.createPTAccount(id, { defaultPassword });
        const responsePassword = defaultPassword && defaultPassword.trim() !== '' ? defaultPassword.trim() : '1';
        res.status(201).json({
            message: 'Tạo tài khoản PT thành công',
            taiKhoan,
            defaultPassword: responsePassword
        });
    } catch (err) {
        if (err.code === 404) {
            return res.status(404).json({ message: err.message });
        }
        if (err.code === 400) {
            return res.status(400).json({ message: err.message });
        }
        if (err.code === 409) {
            return res.status(409).json({ message: err.message });
        }
        res.status(500).json({ message: 'Tạo tài khoản PT thất bại', error: err.message });
    }
};

// Cập nhật trạng thái hội viên
exports.updateMemberStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const memberId = req.params.id;

        if (!status) {
            return res.status(400).json({ message: 'Trạng thái là bắt buộc' });
        }

        const validStatuses = ['DANG_HOAT_DONG', 'TAM_NGUNG', 'HET_HAN'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
        }

        const updatedMember = await userService.updateHoiVien(memberId, { trangThaiHoiVien: status });
        if (!updatedMember) {
            return res.status(404).json({ message: 'Không tìm thấy hội viên' });
        }

        res.json({
            message: 'Cập nhật trạng thái hội viên thành công',
            member: updatedMember
        });
    } catch (err) {
        res.status(500).json({ message: 'Cập nhật thất bại', error: err.message });
    }
};

// Lấy danh sách học viên của PT
exports.getPTStudents = async (req, res) => {
    try {
        const ptId = req.user.id;

        if (!req.user || (req.user.vaiTro !== 'PT' && req.user.vaiTro !== 'OngChu')) {
            return res.json([]);
        }

        // Lấy tất cả đặt lịch cho PT này
        const LichHenPT = require('../models/LichHenPT');

        const bookings = await LichHenPT.find({
            pt: ptId,
            trangThaiLichHen: { $in: ['DA_XAC_NHAN', 'HOAN_THANH'] }
        }).populate({
            path: 'hoiVien',
            select: 'hoTen sdt email anhDaiDien',
            model: 'NguoiDung'
        });

        // Xử lý trường hợp không có đặt lịch
        if (!bookings || bookings.length === 0) {
            return res.json([]);
        }

        // Lấy danh sách học viên từ đặt lịch
        const studentsMap = new Map();
        bookings.forEach(booking => {
            if (booking.hoiVien) {
                const studentId = booking.hoiVien._id.toString();
                if (!studentsMap.has(studentId)) {
                    studentsMap.set(studentId, {
                        _id: booking.hoiVien._id,
                        hoTen: booking.hoiVien.hoTen,
                        sdt: booking.hoiVien.sdt,
                        email: booking.hoiVien.email,
                        avatar: booking.hoiVien.anhDaiDien,
                        lastBookingDate: booking.ngayHen
                    });
                } else {
                    // Cập nhật ngày đặt lịch nếu đặt lịch này mới hơn
                    const existingStudent = studentsMap.get(studentId);
                    if (new Date(booking.ngayHen) > new Date(existingStudent.lastBookingDate)) {
                        existingStudent.lastBookingDate = booking.ngayHen;
                    }
                }
            }
        });

        const students = Array.from(studentsMap.values());

        res.json(students);
    } catch (err) {
        res.json([]);
    }
};

// Lấy tài khoản theo số điện thoại
exports.getTaiKhoanByPhone = async (req, res) => {
    try {
        const { sdt } = req.params;
        const taiKhoan = await userService.getTaiKhoanByPhone(sdt);
        if (!taiKhoan) return res.json(null);
        return res.json(taiKhoan);
    } catch (err) {
        return res.json(null);
    }
};

// Lấy hạng hội viên của người dùng
exports.getUserWithRank = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await userService.getUserWithRank(id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
        }
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        console.error('Lỗi khi lấy hạng hội viên:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getUserProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const profile = await userService.getUserProfile(userId);
        res.status(200).json({ success: true, data: profile });
    } catch (error) {
        console.error('Lỗi khi lấy thông tin người dùng:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateUserProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const updatedProfile = await userService.updateUserProfile(userId, req.body);
        res.status(200).json({ success: true, message: 'Cập nhật thông tin thành công', data: updatedProfile });
    } catch (error) {
        console.error('Lỗi khi cập nhật thông tin người dùng:', error);
        if (error && error.code === 11000 && typeof error.keyPattern === 'object' && error.keyPattern !== null) {
            if ('email' in error.keyPattern) {
                return res.status(400).json({ success: false, message: 'Email đã tồn tại, vui lòng chọn email khác.' });
            }
            if ('sdt' in error.keyPattern) {
                return res.status(400).json({ success: false, message: 'Số điện thoại đã tồn tại, vui lòng chọn số khác.' });
            }
        }
        res.status(500).json({ success: false, message: error.message });
    }
};