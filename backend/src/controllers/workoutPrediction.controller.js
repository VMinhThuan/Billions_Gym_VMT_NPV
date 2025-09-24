const workoutPredictionService = require('../services/workoutPrediction.service');

// Dự báo thời gian và phương pháp tập luyện hiệu quả
const duBaoThoiGianVaPhuongPhapTap = async (req, res) => {
    try {
        const { hoiVienId, mucTieu, soBuoiTapTuan } = req.body;

        // Validate input
        if (!hoiVienId || !mucTieu || !soBuoiTapTuan) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin bắt buộc: hoiVienId, mucTieu, soBuoiTapTuan'
            });
        }

        // Validate mục tiêu
        const mucTieuHopLe = ['GIAM_CAN', 'TANG_CO_BAP', 'TANG_CAN', 'DUY_TRI'];
        if (!mucTieuHopLe.includes(mucTieu)) {
            return res.status(400).json({
                success: false,
                message: 'Mục tiêu không hợp lệ. Chọn: GIAM_CAN, TANG_CO_BAP, TANG_CAN, DUY_TRI'
            });
        }

        // Validate số buổi tập
        if (soBuoiTapTuan < 1 || soBuoiTapTuan > 7) {
            return res.status(400).json({
                success: false,
                message: 'Số buổi tập phải từ 1-7 buổi/tuần'
            });
        }

        const ketQua = await workoutPredictionService.duBaoThoiGianTap(
            hoiVienId,
            mucTieu,
            soBuoiTapTuan
        );

        res.json({
            success: true,
            message: 'Dự báo thời gian và phương pháp tập luyện thành công',
            data: ketQua
        });

    } catch (error) {
        console.error('Lỗi dự báo thời gian và phương pháp tập:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi dự báo thời gian và phương pháp tập'
        });
    }
};

// Dự báo hiệu quả tập luyện
const duBaoHieuQuaTap = async (req, res) => {
    try {
        const { hoiVienId, thoiGianTap, soBuoiTapTuan } = req.body;

        // Validate input
        if (!hoiVienId || !thoiGianTap || !soBuoiTapTuan) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin bắt buộc: hoiVienId, thoiGianTap, soBuoiTapTuan'
            });
        }

        // Validate thời gian tập
        if (thoiGianTap < 15 || thoiGianTap > 180) {
            return res.status(400).json({
                success: false,
                message: 'Thời gian tập phải từ 15-180 phút'
            });
        }

        // Validate số buổi tập
        if (soBuoiTapTuan < 1 || soBuoiTapTuan > 7) {
            return res.status(400).json({
                success: false,
                message: 'Số buổi tập phải từ 1-7 buổi/tuần'
            });
        }

        const ketQua = await workoutPredictionService.duBaoHieuQuaTap(
            hoiVienId,
            thoiGianTap,
            soBuoiTapTuan
        );

        res.json({
            success: true,
            message: 'Dự báo hiệu quả tập luyện thành công',
            data: ketQua
        });

    } catch (error) {
        console.error('Lỗi dự báo hiệu quả tập:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi dự báo hiệu quả tập luyện'
        });
    }
};

// Phân tích lịch sử tập luyện
const phanTichLichSuTap = async (req, res) => {
    try {
        const { hoiVienId } = req.params;

        if (!hoiVienId) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu hoiVienId'
            });
        }

        const ketQua = await workoutPredictionService.phanTichLichSuTap(hoiVienId);

        res.json({
            success: true,
            message: 'Phân tích lịch sử tập luyện thành công',
            data: ketQua
        });

    } catch (error) {
        console.error('Lỗi phân tích lịch sử tập:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi phân tích lịch sử tập luyện'
        });
    }
};

// Lấy gợi ý phương pháp tập luyện
const layGoiYPhuongPhapTap = async (req, res) => {
    try {
        const { hoiVienId, mucTieu } = req.query;

        if (!hoiVienId || !mucTieu) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin: hoiVienId, mucTieu'
            });
        }

        // Validate mục tiêu
        const mucTieuHopLe = ['GIAM_CAN', 'TANG_CO_BAP', 'TANG_CAN', 'DUY_TRI'];
        if (!mucTieuHopLe.includes(mucTieu)) {
            return res.status(400).json({
                success: false,
                message: 'Mục tiêu không hợp lệ'
            });
        }

        const ketQua = await workoutPredictionService.gopYPhuongPhapTap(
            hoiVienId,
            mucTieu
        );

        res.json({
            success: true,
            message: 'Lấy gợi ý phương pháp tập luyện thành công',
            data: ketQua
        });

    } catch (error) {
        console.error('Lỗi lấy gợi ý phương pháp tập:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi lấy gợi ý phương pháp tập luyện'
        });
    }
};

// Tính thời gian tập luyện tối ưu
const tinhThoiGianToiUu = async (req, res) => {
    try {
        const { hoiVienId, mucTieu, soBuoiTapTuan } = req.body;

        if (!hoiVienId || !mucTieu || !soBuoiTapTuan) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin bắt buộc'
            });
        }

        const ketQua = await workoutPredictionService.tinhThoiGianToiUu(
            hoiVienId,
            mucTieu,
            soBuoiTapTuan
        );

        res.json({
            success: true,
            message: 'Tính thời gian tập luyện tối ưu thành công',
            data: ketQua
        });

    } catch (error) {
        console.error('Lỗi tính thời gian tối ưu:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi tính thời gian tối ưu'
        });
    }
};

// Dự báo tiến độ tập luyện
const duBaoTienDoTap = async (req, res) => {
    try {
        const { hoiVienId, mucTieu } = req.body;

        if (!hoiVienId || !mucTieu) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin bắt buộc'
            });
        }

        const ketQua = await workoutPredictionService.duBaoTienDoTap(
            hoiVienId,
            mucTieu
        );

        res.json({
            success: true,
            message: 'Dự báo tiến độ tập luyện thành công',
            data: ketQua
        });

    } catch (error) {
        console.error('Lỗi dự báo tiến độ:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi dự báo tiến độ tập luyện'
        });
    }
};

module.exports = {
    duBaoThoiGianVaPhuongPhapTap,
    duBaoHieuQuaTap,
    phanTichLichSuTap,
    layGoiYPhuongPhapTap,
    tinhThoiGianToiUu,
    duBaoTienDoTap
};
