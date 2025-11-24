const express = require('express');
const router = express.Router();
const ptReportsController = require('../controllers/pt-reports.controller');
const auth = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');

router.use(auth);
router.use(authorize(['PT', 'OngChu']));

router.get('/student/:hoiVienId', ptReportsController.getStudentReport);

module.exports = router;

