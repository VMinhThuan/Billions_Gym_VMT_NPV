const express = require('express');
const router = express.Router();
const ptProfileController = require('../controllers/pt-profile.controller');
const auth = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');

router.use(auth);
router.use(authorize(['PT', 'OngChu']));

router.get('/', ptProfileController.getPTProfile);
router.put('/', ptProfileController.updatePTProfile);

module.exports = router;

