const ChiSoCoThe = require('../models/ChiSoCoThe');
const LichSuTap = require('../models/LichSuTap');
const PTAssignment = require('../models/PTAssignment');
const BuoiTap = require('../models/BuoiTap');

// Báo cáo học viên
exports.getStudentReport = async (req, res) => {
    try {
        const ptId = req.user.id;
        const { hoiVienId } = req.params;
        const { startDate, endDate } = req.query;

        // Kiểm tra học viên có trong danh sách của PT không
        const buoiTap = await BuoiTap.findOne({
            ptPhuTrach: ptId,
            'danhSachHoiVien.hoiVien': hoiVienId
        });

        if (!buoiTap) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền xem báo cáo học viên này'
            });
        }

        // Lấy chỉ số cơ thể
        let chiSoQuery = { hoiVien: hoiVienId };
        if (startDate || endDate) {
            chiSoQuery.ngayDo = {};
            if (startDate) chiSoQuery.ngayDo.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                chiSoQuery.ngayDo.$lte = end;
            }
        }

        const chiSoCoThe = await ChiSoCoThe.find(chiSoQuery)
            .sort({ ngayDo: 1 });

        // Lấy lịch sử tập
        let lichSuQuery = { hoiVien: hoiVienId };
        if (startDate || endDate) {
            lichSuQuery.ngayTap = {};
            if (startDate) lichSuQuery.ngayTap.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                lichSuQuery.ngayTap.$lte = end;
            }
        }

        const lichSuTap = await LichSuTap.find(lichSuQuery)
            .populate('buoiTap', 'tenBuoiTap ngayTap gioBatDau gioKetThuc')
            .sort({ ngayTap: 1 });

        // Lấy bài tập đã gán
        const assignments = await PTAssignment.find({
            pt: ptId,
            hoiVien: hoiVienId
        })
            .populate('baiTap', 'tenBaiTap moTa')
            .sort({ ngayGan: -1 });

        // Tính toán tiến độ
        const tongBuoiTap = lichSuTap.length;
        const tongBaiTap = assignments.length;
        const baiTapHoanThanh = assignments.filter(a => a.trangThai === 'HOAN_THANH').length;

        // Phân tích chỉ số cơ thể
        const chiSoPhanTich = {
            canNang: chiSoCoThe.map(c => ({
                date: c.ngayDo,
                value: c.canNang
            })).filter(c => c.value),
            bmi: chiSoCoThe.map(c => ({
                date: c.ngayDo,
                value: c.bmi
            })).filter(c => c.value),
            tyLeMoCoThe: chiSoCoThe.map(c => ({
                date: c.ngayDo,
                value: c.tyLeMoCoThe
            })).filter(c => c.value)
        };

        res.json({
            success: true,
            data: {
                chiSoCoThe,
                lichSuTap,
                assignments,
                tongKet: {
                    tongBuoiTap,
                    tongBaiTap,
                    baiTapHoanThanh,
                    tiLeHoanThanh: tongBaiTap > 0
                        ? ((baiTapHoanThanh / tongBaiTap) * 100).toFixed(1)
                        : 0
                },
                chiSoPhanTich
            }
        });
    } catch (err) {
        console.error('Error in getStudentReport:', err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

