const express = require('express');
const router = express.Router();
const chiTietGoiTapController = require('../controllers/chitietgoitap.controller');
const { getActivePackage } = require('../controllers/dangKyGoiTap.controller');
const auth = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');

const hoiVien = ['HoiVien'];
const admin = ['OngChu'];
const ptAndAdmin = ['PT', 'OngChu'];
const allUsers = ['HoiVien', 'PT', 'OngChu'];

// Hội viên đăng ký gói tập
router.post('/dangky', auth, authorize(hoiVien), chiTietGoiTapController.dangkyGoiTap);

// Lấy danh sách đăng ký gói tập 
router.get('/', chiTietGoiTapController.getAllChiTietGoiTap);

// Lấy thông tin chi tiết gói tập theo ID
router.get('/:id', chiTietGoiTapController.getChiTietGoiTapById);

// Lấy thống kê đăng ký gói tập
router.get('/stats', auth, authorize(admin), chiTietGoiTapController.getStats);

// Lấy thông tin đăng ký gói tập của hội viên
router.get('/hoivien/:maHoiVien', auth, chiTietGoiTapController.getChiTietGoiTapByHoiVien);

// Lấy gói tập đang hoạt động (alias route)
router.get('/hoi-vien/:maHoiVien/active', getActivePackage);

// Kiểm tra khả năng chỉnh sửa
router.get('/:id/can-edit', auth, chiTietGoiTapController.checkEditPermission);

// Cập nhật trạng thái thanh toán
router.put('/:id/thanhtoan', auth, authorize(ptAndAdmin), chiTietGoiTapController.updateTrangThaiThanhToan);

// Cập nhật thông tin đăng ký
router.put('/:id', auth, authorize(admin), chiTietGoiTapController.updateChiTietGoiTap);

// Cập nhật chi nhánh cho đăng ký gói tập (cho phép Hội viên tự xác nhận/đổi)
router.patch('/:id/branch', auth, authorize(allUsers), async (req, res) => {
    try {
        const { id } = req.params;
        const { branchId } = req.body;
        if (!branchId) {
            return res.status(400).json({ success: false, message: 'Thiếu branchId' });
        }
        const updated = await chiTietGoiTapController.updateBranchDirect(id, branchId, req.user.id);
        if (!updated) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đăng ký hoặc không có quyền' });
        }
        return res.json({ success: true, data: updated });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
});

// Hủy đăng ký gói tập
router.delete('/:id', auth, authorize(allUsers), chiTietGoiTapController.deleteChiTietGoiTap);

module.exports = router;
