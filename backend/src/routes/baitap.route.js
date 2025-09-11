const express = require('express');
const router = express.Router();
const baiTapController = require('../controllers/baitap.controller');
const auth = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');

const allowedRoles = ['OngChu', 'PT'];

router.post('/', auth, authorize(allowedRoles), baiTapController.createBaiTap);
router.get('/', auth, baiTapController.getAllBaiTap);
router.get('/:id', auth, baiTapController.getBaiTapById);
router.put('/:id', auth, authorize(allowedRoles), baiTapController.updateBaiTap);
router.delete('/:id', auth, authorize(allowedRoles), baiTapController.deleteBaiTap);

module.exports = router;
