const express = require('express');
const router = express.Router();
const ptController = require('../controllers/pt.controller');
const auth = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');

// Tất cả routes đều yêu cầu authentication và role PT
router.use(auth);
router.use(authorize(['PT', 'OngChu']));

// Dashboard
router.get('/dashboard', ptController.getPTDashboard);

// Buổi tập
router.get('/sessions', ptController.getMySessions);

// Học viên
router.get('/students', ptController.getMyStudents);
router.get('/students/:hoiVienId', ptController.getStudentDetail);

// Ghi chú
router.post('/students/:hoiVienId/notes', ptController.addStudentNote);
router.get('/students/:hoiVienId/notes', ptController.getStudentNotes);

// Bài tập
router.post('/students/:hoiVienId/exercises', ptController.assignExerciseToStudent);
router.get('/students/:hoiVienId/exercises', ptController.getStudentExercises);

// Tiến độ buổi tập
router.put('/sessions/progress', ptController.updateSessionProgress);
router.put('/sessions/:buoiTapId/comment', ptController.addSessionComment);

module.exports = router;

