const express = require('express');
const router = express.Router();
const lichTapController = require('../controllers/lichtap.controller');
const auth = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');

const ptAndOngChu = ['PT', 'OngChu'];

router.get('/', auth, lichTapController.getAllLichTapHoiVien);
router.post('/', auth, authorize(ptAndOngChu), lichTapController.createLichTap);
router.get('/hoivien/:maHoiVien', auth, lichTapController.getLichTapByHoiVien);
router.post('/:lichTapId/buoitap', auth, authorize(ptAndOngChu), lichTapController.addBuoiTap);
router.put('/buoitap/:buoiTapId', auth, authorize(ptAndOngChu), lichTapController.updateBuoiTap);
router.delete('/:lichTapId/buoitap/:buoiTapId', auth, authorize(ptAndOngChu), lichTapController.deleteBuoiTap);

module.exports = router;