const express = require('express');
const router = express.Router();
const mlTrainingController = require('../controllers/mlTraining.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

/**
 * ML Training Routes
 * API endpoints cho machine learning training system
 */

// Tất cả routes đều cần authentication
router.use(authMiddleware);

// Chỉ admin mới có thể chạy training
router.use(roleMiddleware(['ADMIN']));

/**
 * @route   POST /api/ml-training/full-training
 * @desc    Chạy full training pipeline
 * @access  Private (Admin only)
 */
router.post('/full-training', mlTrainingController.runFullTraining);

/**
 * @route   GET /api/ml-training/collect-data
 * @desc    Thu thập training data
 * @access  Private (Admin only)
 */
router.get('/collect-data', mlTrainingController.collectTrainingData);

/**
 * @route   POST /api/ml-training/create-dataset
 * @desc    Tạo training dataset
 * @access  Private (Admin only)
 */
router.post('/create-dataset', mlTrainingController.createDataset);

/**
 * @route   POST /api/ml-training/train-model
 * @desc    Training model
 * @access  Private (Admin only)
 */
router.post('/train-model', mlTrainingController.trainModel);

/**
 * @route   POST /api/ml-training/evaluate-model
 * @desc    Đánh giá model performance
 * @access  Private (Admin only)
 */
router.post('/evaluate-model', mlTrainingController.evaluateModel);

/**
 * @route   POST /api/ml-training/save-data
 * @desc    Lưu training data vào database
 * @access  Private (Admin only)
 */
router.post('/save-data', mlTrainingController.saveTrainingData);

/**
 * @route   GET /api/ml-training/performance-history
 * @desc    Lấy model performance history
 * @access  Private (Admin only)
 */
router.get('/performance-history', mlTrainingController.getPerformanceHistory);

/**
 * @route   POST /api/ml-training/continuous-learning
 * @desc    Chạy continuous learning
 * @access  Private (Admin only)
 */
router.post('/continuous-learning', mlTrainingController.continuousLearning);

/**
 * @route   POST /api/ml-training/test-model
 * @desc    Test model với sample input
 * @access  Private (Admin only)
 */
router.post('/test-model', mlTrainingController.testModel);

/**
 * @route   GET /api/ml-training/stats
 * @desc    Lấy training data statistics
 * @access  Private (Admin only)
 */
router.get('/stats', mlTrainingController.getTrainingStats);

module.exports = router;
