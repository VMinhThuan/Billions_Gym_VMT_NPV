const express = require('express');
const router = express.Router();
const ptGoalsController = require('../controllers/pt-goals.controller');
const auth = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');

// Tất cả routes yêu cầu PT / Ông chủ
router.use(auth);
router.use(authorize(['PT', 'OngChu']));

// GET /api/pt/goals?date=YYYY-MM-DD
router.get('/', ptGoalsController.getMyGoals);

// POST /api/pt/goals
router.post('/', ptGoalsController.createGoal);

// PUT /api/pt/goals/:id/status
router.put('/:id/status', ptGoalsController.updateGoalStatus);

// DELETE /api/pt/goals/:id
router.delete('/:id', ptGoalsController.deleteGoal);

module.exports = router;


