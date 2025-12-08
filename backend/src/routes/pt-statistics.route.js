const express = require('express');
const router = express.Router();
const ptStatisticsController = require('../controllers/pt-statistics.controller');
const auth = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');

router.use(auth);
router.use(authorize(['PT', 'OngChu']));

router.get('/', ptStatisticsController.getPTStatistics);
router.get('/overall', ptStatisticsController.getOverallStats);
router.get('/students', ptStatisticsController.getStudentStatistics);
router.get('/sessions', ptStatisticsController.getSessionStatistics);

module.exports = router;

