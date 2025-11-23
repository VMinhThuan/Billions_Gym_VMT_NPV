const YearlyGoals = require('../models/YearlyGoals');

// Lấy mục tiêu năm hiện tại
exports.getCurrentYearGoals = async (req, res) => {
    try {
        const currentYear = new Date().getFullYear();
        let goals = await YearlyGoals.findOne({ nam: currentYear });

        // Nếu chưa có, tạo mục tiêu mặc định
        if (!goals) {
            goals = await YearlyGoals.create({
                nam: currentYear,
                hoiVienMoi: 100,
                doanhThu: 100000000,
                checkIn: 1000,
                goiTap: 50,
                hoiVienDangHoatDong: 200,
                tyLeGiaHan: 70,
                nguoiTao: req.user?.userId || null
            });
        }

        res.json(goals);
    } catch (error) {
        console.error('Error getting yearly goals:', error);
        res.status(500).json({ message: 'Lỗi khi lấy mục tiêu năm', error: error.message });
    }
};

// Cập nhật mục tiêu năm
exports.updateYearlyGoals = async (req, res) => {
    try {
        const currentYear = new Date().getFullYear();
        const { hoiVienMoi, doanhThu, checkIn, goiTap, hoiVienDangHoatDong, tyLeGiaHan } = req.body;

        let goals = await YearlyGoals.findOne({ nam: currentYear });

        if (!goals) {
            // Tạo mới nếu chưa có
            goals = await YearlyGoals.create({
                nam: currentYear,
                hoiVienMoi: hoiVienMoi || 100,
                doanhThu: doanhThu || 100000000,
                checkIn: checkIn || 1000,
                goiTap: goiTap || 50,
                hoiVienDangHoatDong: hoiVienDangHoatDong || 200,
                tyLeGiaHan: tyLeGiaHan || 70,
                nguoiTao: req.user?.userId || null,
                nguoiCapNhat: req.user?.userId || null
            });
        } else {
            // Cập nhật
            if (hoiVienMoi !== undefined) goals.hoiVienMoi = hoiVienMoi;
            if (doanhThu !== undefined) goals.doanhThu = doanhThu;
            if (checkIn !== undefined) goals.checkIn = checkIn;
            if (goiTap !== undefined) goals.goiTap = goiTap;
            if (hoiVienDangHoatDong !== undefined) goals.hoiVienDangHoatDong = hoiVienDangHoatDong;
            if (tyLeGiaHan !== undefined) goals.tyLeGiaHan = tyLeGiaHan;
            goals.nguoiCapNhat = req.user?.userId || null;
            await goals.save();
        }

        res.json({ message: 'Cập nhật mục tiêu thành công', goals });
    } catch (error) {
        console.error('Error updating yearly goals:', error);
        res.status(500).json({ message: 'Lỗi khi cập nhật mục tiêu', error: error.message });
    }
};

// Lấy tất cả mục tiêu các năm
exports.getAllYearlyGoals = async (req, res) => {
    try {
        const goals = await YearlyGoals.find().sort({ nam: -1 }).populate('nguoiTao nguoiCapNhat', 'hoTen email');
        res.json(goals);
    } catch (error) {
        console.error('Error getting all yearly goals:', error);
        res.status(500).json({ message: 'Lỗi khi lấy danh sách mục tiêu', error: error.message });
    }
};

