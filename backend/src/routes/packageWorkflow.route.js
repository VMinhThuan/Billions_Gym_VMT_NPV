const express = require('express');
const router = express.Router();
const packageWorkflowController = require('../controllers/packageWorkflow.controller');
const { protect } = require('../middlewares/auth');

// Check schedule exists
router.get('/check-schedule-exists/:registrationId', protect, packageWorkflowController.checkScheduleExists);

// Get available trainers
router.get('/available-trainers/:chiTietGoiTapId', protect, packageWorkflowController.getAvailableTrainers);

// Select trainer
router.post('/select-trainer/:chiTietGoiTapId', protect, packageWorkflowController.selectTrainer);

// Generate workout schedule
router.post('/generate-schedule/:chiTietGoiTapId', protect, packageWorkflowController.generateWorkoutSchedule);

// Get member workout schedule
router.get('/member-schedule/:hoiVienId', protect, packageWorkflowController.getMemberWorkoutSchedule);

// Update trainer schedule
router.put('/trainer-schedule/:ptId', protect, packageWorkflowController.updateTrainerSchedule);

// Get trainer schedule
router.get('/trainer-schedule/:ptId', protect, packageWorkflowController.getTrainerSchedule);

// Complete workflow
router.post('/complete-workflow/:chiTietGoiTapId', protect, packageWorkflowController.completeWorkflow);

// Get workflow status
router.get('/workflow-status/:registrationId', protect, packageWorkflowController.getWorkflowStatus);

// Update branch
router.patch('/:registrationId/branch', protect, packageWorkflowController.updateBranch);

module.exports = router;