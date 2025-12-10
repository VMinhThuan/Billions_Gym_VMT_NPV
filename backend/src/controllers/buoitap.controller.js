const buoiTapService = require('../services/buoitap.service');
const mongoose = require('mongoose');

const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

exports.createBuoiTap = async (req, res) => {
    try {
        const buoiTap = await buoiTapService.createBuoiTap(req.body);
        res.status(201).json({
            message: 'Tạo buổi tập thành công',
            data: buoiTap
        });
    } catch (err) {
        res.status(400).json({ message: 'Tạo buổi tập thất bại', error: err.message });
    }
};

exports.getBuoiTapById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({ message: 'ID buổi tập không hợp lệ' });
        }

        const buoiTap = await buoiTapService.getBuoiTapById(id);
        if (!buoiTap) return res.status(404).json({ message: 'Không tìm thấy buổi tập' });
        res.json(buoiTap);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
};

exports.getBuoiTapByHoiVien = async (req, res) => {
    try {
        const { maHoiVien } = req.params;
        const { trangThai } = req.query;
        const requesterId = req.user?.id;
        const requesterRole = req.user?.vaiTro;

        if (!isValidObjectId(maHoiVien)) {
            return res.status(400).json({ success: false, message: 'ID hội viên không hợp lệ' });
        }

        // Chỉ cho phép hội viên xem lịch của chính mình (trừ PT/Admin)
        if (requesterRole === 'HoiVien' && requesterId && requesterId !== maHoiVien) {
            return res.status(403).json({ success: false, message: 'Không có quyền truy cập' });
        }

        const LichTap = require('../models/LichTap');

        const queryStart = Date.now();
        const lichTaps = await LichTap.find({
            hoiVien: maHoiVien,
            trangThai: { $ne: 'HUY' }
        })
            .populate('chiNhanh', 'tenChiNhanh diaChi')
            .populate({
                path: 'danhSachBuoiTap.ptPhuTrach',
                select: 'hoTen chuyenMon anhDaiDien'
            })
            .populate({
                path: 'danhSachBuoiTap.buoiTap',
                select: 'tenBuoiTap ngayTap gioBatDau gioKetThuc soLuongToiDa soLuongHienTai trangThai moTa chiNhanh ptPhuTrach',
                populate: [
                    { path: 'chiNhanh', select: 'tenChiNhanh diaChi' },
                    { path: 'ptPhuTrach', select: 'hoTen chuyenMon anhDaiDien' }
                ]
            })
            .sort({ tuanBatDau: -1 })
            .limit(10)
            .lean()
            .maxTimeMS(15000);

        // Chuyển đổi dữ liệu về list các buổi tập (flatten)
        const buoiTapList = [];
        (lichTaps || []).forEach(lichTap => {
            const ds = Array.isArray(lichTap.danhSachBuoiTap) ? lichTap.danhSachBuoiTap : [];
            ds.forEach(item => {
                const buoiTapInfo = item.buoiTap || {};
                const status = item.trangThai || buoiTapInfo.trangThai;

                if (trangThai && status !== trangThai) return;

                buoiTapList.push({
                    _id: buoiTapInfo._id || item._id,
                    tenBuoiTap: buoiTapInfo.tenBuoiTap || 'Buổi tập',
                    ngayTap: item.ngayTap || buoiTapInfo.ngayTap,
                    gioBatDau: item.gioBatDau || buoiTapInfo.gioBatDau,
                    gioKetThuc: item.gioKetThuc || buoiTapInfo.gioKetThuc,
                    trangThai: status,
                    chiNhanh: buoiTapInfo.chiNhanh || lichTap.chiNhanh,
                    ptPhuTrach: item.ptPhuTrach || buoiTapInfo.ptPhuTrach,
                    lichTapId: lichTap._id,
                    raw: item
                });
            });
        });

        const duration = Date.now() - queryStart;
        console.log(`✅ [getBuoiTapByHoiVien] Found ${buoiTapList.length} sessions in ${duration}ms for hoiVien=${maHoiVien}`);

        return res.json({
            success: true,
            data: buoiTapList
        });
    } catch (err) {
        console.error('❌ getBuoiTapByHoiVien error:', err);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy buổi tập của hội viên',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

exports.getAllBuoiTap = async (req, res) => {
    try {
        const { trangThai } = req.query;
        const buoiTaps = await buoiTapService.getAllBuoiTap(trangThai);
        res.json(buoiTaps);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
};

exports.updateBuoiTap = async (req, res) => {
    try {
        const buoiTap = await buoiTapService.updateBuoiTap(req.params.id, req.body);
        if (!buoiTap) return res.status(404).json({ message: 'Không tìm thấy buổi tập' });
        res.json({
            message: 'Cập nhật buổi tập thành công',
            data: buoiTap
        });
    } catch (err) {
        res.status(400).json({ message: 'Cập nhật thất bại', error: err.message });
    }
};

exports.hoanThanhBuoiTap = async (req, res) => {
    try {
        const maHoiVien = req.user.id;
        const buoiTap = await buoiTapService.hoanThanhBuoiTap(req.params.id, maHoiVien);
        if (!buoiTap) return res.status(404).json({ message: 'Không tìm thấy buổi tập' });
        res.json({
            message: 'Hoàn thành buổi tập thành công',
            data: buoiTap
        });
    } catch (err) {
        res.status(400).json({ message: 'Cập nhật thất bại', error: err.message });
    }
};

exports.deleteBuoiTap = async (req, res) => {
    try {
        const buoiTap = await buoiTapService.deleteBuoiTap(req.params.id);
        if (!buoiTap) return res.status(404).json({ message: 'Không tìm thấy buổi tập' });
        res.json({ message: 'Xóa buổi tập thành công' });
    } catch (err) {
        res.status(400).json({ message: 'Xóa thất bại', error: err.message });
    }
};

exports.addBaiTapToBuoiTap = async (req, res) => {
    try {
        const { buoiTapId } = req.params;
        const { maBaiTap, soLanLap, soSet, trongLuong, thoiGianNghi } = req.body;

        if (!isValidObjectId(buoiTapId)) {
            return res.status(400).json({ message: 'ID buổi tập không hợp lệ' });
        }

        if (maBaiTap && !isValidObjectId(maBaiTap)) {
            return res.status(400).json({ message: 'ID bài tập không hợp lệ' });
        }

        const buoiTap = await buoiTapService.addBaiTapToBuoiTap(buoiTapId, {
            maBaiTap,
            soLanLap,
            soSet,
            trongLuong,
            thoiGianNghi
        });

        res.json({
            message: 'Thêm bài tập vào buổi tập thành công',
            data: buoiTap
        });
    } catch (err) {
        res.status(400).json({ message: 'Thêm bài tập thất bại', error: err.message });
    }
};

exports.removeBaiTapFromBuoiTap = async (req, res) => {
    try {
        const { buoiTapId, baiTapId } = req.params;

        console.log('Xóa bài tập:', { buoiTapId, baiTapId });

        if (!isValidObjectId(buoiTapId)) {
            return res.status(400).json({ message: 'ID buổi tập không hợp lệ' });
        }

        if (!isValidObjectId(baiTapId)) {
            return res.status(400).json({ message: 'ID bài tập không hợp lệ' });
        }

        const buoiTap = await buoiTapService.removeBaiTapFromBuoiTap(buoiTapId, baiTapId);

        res.json({
            message: 'Xóa bài tập khỏi buổi tập thành công',
            data: buoiTap
        });
    } catch (err) {
        console.error('Lỗi xóa bài tập:', err);
        res.status(400).json({ message: 'Xóa bài tập thất bại', error: err.message });
    }
};
