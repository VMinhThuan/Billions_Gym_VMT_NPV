const express = require('express');
const router = express.Router();
const ptReviewsController = require('../controllers/pt-reviews.controller');
const auth = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');

router.use(auth);
router.use(authorize(['PT', 'OngChu']));

router.get('/', ptReviewsController.getPTReviews);
router.get('/student/:hoiVienId', ptReviewsController.getStudentReviews);

module.exports = router;

