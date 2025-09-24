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

        // Kiểm tra database connection
        const mongoose = require('mongoose');
        if (mongoose.connection.readyState !== 1) {
            return res.status(500).json({
                success: false,
                message: 'Database connection error'
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
        // FINAL CLEANUP: Ensure empty, null, or undefined email is removed before processing
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
        const { q } = req.query;
        let pts;
        if (q) {
            pts = await userService.searchPT(q);
        } else {
            pts = await userService.getAllPT();
        }
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

// Admin specific endpoints for member management
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

// PT specific endpoints
exports.getPTStudents = async (req, res) => {
    try {
        const ptId = req.user.id; // Get PT ID from authenticated user

        // Check if user exists and has PT role
        if (!req.user || (req.user.vaiTro !== 'PT' && req.user.vaiTro !== 'OngChu')) {
            return res.json([]); // Return empty array instead of error
        }

        // Get all bookings for this PT
        const LichHenPT = require('../models/LichHenPT');

        const bookings = await LichHenPT.find({
            pt: ptId,
            trangThaiLichHen: { $in: ['DA_XAC_NHAN', 'HOAN_THANH'] }
        }).populate({
            path: 'hoiVien',
            select: 'hoTen sdt email anhDaiDien',
            model: 'NguoiDung'
        });

        // Handle case where no bookings found
        if (!bookings || bookings.length === 0) {
            return res.json([]);
        }

        // Extract unique students from bookings
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
                    // Update last booking date if this booking is more recent
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
        // Return empty array instead of error to avoid breaking frontend
        res.json([]);
    }
};

// Lấy tài khoản theo số điện thoại
exports.getTaiKhoanByPhone = async (req, res) => {
    try {
        const { sdt } = req.params;
        const taiKhoan = await userService.getTaiKhoanByPhone(sdt);
        res.json(taiKhoan);
    } catch (err) {
        if (err.message === 'Không tìm thấy tài khoản') {
            return res.status(404).json({ message: err.message });
        }
        res.status(500).json({ message: 'Lỗi khi lấy thông tin tài khoản', error: err.message });
    }
};

