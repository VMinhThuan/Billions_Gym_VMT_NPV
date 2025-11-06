const express = require('express');
const router = express.Router();
const exerciseController = require('../controllers/exercise.controller');
const auth = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');

const ptAndAdmin = ['PT', 'OngChu'];
const allUsers = ['HoiVien', 'PT', 'OngChu'];

// Tạo bài tập mới (chỉ PT và admin)
router.post('/', auth, authorize(ptAndAdmin), exerciseController.createExercise);

// Lấy tất cả bài tập (tất cả user, có filter)
router.get('/', auth, authorize(allUsers), exerciseController.getAllExercises);

// Lấy chi tiết bài tập (tất cả user)
router.get('/:id', auth, authorize(allUsers), exerciseController.getExerciseById);

// Cập nhật bài tập (chỉ PT và admin)
router.put('/:id', auth, authorize(ptAndAdmin), exerciseController.updateExercise);

// Xóa bài tập (chỉ PT và admin)
router.delete('/:id', auth, authorize(ptAndAdmin), exerciseController.deleteExercise);

module.exports = router;

