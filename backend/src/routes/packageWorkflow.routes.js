const express = require('express');
const router = express.Router();
const packageWorkflowController = require('../controllers/packageWorkflow.controller');
const authenticateToken = require('../middlewares/auth.middleware');

// Routes cho workflow đăng ký gói tập
router.get('/workflow-status/:registrationId', authenticateToken, packageWorkflowController.getWorkflowStatus);
router.put('/update-branch/:registrationId', authenticateToken, packageWorkflowController.updateBranch);
router.post('/available-trainers/:chiTietGoiTapId', authenticateToken, packageWorkflowController.getAvailableTrainers);
router.post('/select-trainer/:chiTietGoiTapId', authenticateToken, packageWorkflowController.selectTrainer);
router.post('/generate-schedule/:chiTietGoiTapId', authenticateToken, packageWorkflowController.generateWorkoutSchedule);
router.post('/complete-workflow/:chiTietGoiTapId', authenticateToken, packageWorkflowController.completeWorkflow);
router.get('/member-schedule/:hoiVienId', authenticateToken, packageWorkflowController.getMemberWorkoutSchedule);

// Routes cho quản lý lịch làm việc PT
router.put('/trainer-schedule/:ptId', authenticateToken, packageWorkflowController.updateTrainerSchedule);
router.get('/trainer-schedule/:ptId', authenticateToken, packageWorkflowController.getTrainerSchedule);

module.exports = router;
