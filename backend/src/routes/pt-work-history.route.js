const express = require('express');
const router = express.Router();
const ptWorkHistoryController = require('../controllers/pt-work-history.controller');
const auth = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');

router.use(auth);
router.use(authorize(['PT', 'OngChu']));

router.get('/', ptWorkHistoryController.getWorkHistory);

module.exports = router;

