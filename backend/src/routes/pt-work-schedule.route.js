const express = require('express');
const router = express.Router();
const ptWorkScheduleController = require('../controllers/pt-work-schedule.controller');
const auth = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');

router.use(auth);
router.use(authorize(['PT', 'OngChu']));

router.get('/', ptWorkScheduleController.getWorkSchedule);
router.put('/', ptWorkScheduleController.updateWorkSchedule);
router.delete('/:thu', ptWorkScheduleController.deleteWorkSchedule);

module.exports = router;

