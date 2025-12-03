const express = require('express');
const router = express.Router();
const nutritionPlanController = require('../controllers/nutritionPlan.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// POST /api/nutrition/plan - Generate nutrition plan với Gemini AI
router.post('/plan', authMiddleware, nutritionPlanController.generatePlan);

// GET /api/nutrition/plan/latest - Lấy plan mới nhất
router.get('/plan/latest', authMiddleware, nutritionPlanController.getLatestPlan);

// GET /api/nutrition/plan/history - Lấy lịch sử mục tiêu đã tạo
router.get('/plan/history', authMiddleware, nutritionPlanController.getGoalHistory);

// GET /api/nutrition/plan/recommend-calories - Gợi ý calories theo mục tiêu
router.get('/plan/recommend-calories', authMiddleware, nutritionPlanController.getRecommendedCalories);

// GET /api/nutrition/meals - Lấy tất cả meals từ database
router.get('/meals', authMiddleware, nutritionPlanController.getAllMeals);

// GET /api/nutrition/meals/featured - Lấy featured, popular, recommended meals
router.get('/meals/featured', authMiddleware, nutritionPlanController.getFeaturedMeals);

// POST /api/nutrition/meals/add-to-plan - Thêm meal vào user meal plan
router.post('/meals/add-to-plan', authMiddleware, nutritionPlanController.addMealToPlan);

// GET /api/nutrition/my-meals - Lấy user meal plan cho một ngày
router.get('/my-meals', authMiddleware, nutritionPlanController.getMyMeals);

// GET /api/nutrition/my-meals/week - Lấy user meal plan cho một tuần
router.get('/my-meals/week', authMiddleware, nutritionPlanController.getMyMealsWeek);

// GET /api/nutrition/member-meal-plans/:memberId - Lấy meal plan của một member (for admin)
router.get('/member-meal-plans/:memberId', authMiddleware, nutritionPlanController.getMemberMealPlan);

// DELETE /api/nutrition/my-meals/remove - Xóa món ăn khỏi user meal plan
router.delete('/my-meals/remove', authMiddleware, nutritionPlanController.removeMealFromPlan);

// POST /api/nutrition/my-meals/duplicate - Thêm món ăn vào ngày khác (duplicate)
router.post('/my-meals/duplicate', authMiddleware, nutritionPlanController.duplicateMeal);

// GET /api/nutrition/member-meal-plans/:memberId - Lấy meal plan của một member (for admin)
router.get('/member-meal-plans/:memberId', authMiddleware, nutritionPlanController.getMemberMealPlan);

// POST /api/nutrition/member-meal-plans/add - Thêm meal vào member plan (for admin)
router.post('/member-meal-plans/add', authMiddleware, nutritionPlanController.addMealToMemberPlan);

// DELETE /api/nutrition/member-meal-plans/remove - Xóa meal khỏi member plan (for admin)
router.delete('/member-meal-plans/remove', authMiddleware, nutritionPlanController.removeMealFromMemberPlan);

module.exports = router;

