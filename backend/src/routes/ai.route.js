const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Tất cả routes đều yêu cầu authentication
router.use(authMiddleware);

// Chat endpoint
router.post('/chat', aiController.chat);

// Search endpoint
router.get('/search', aiController.search);

// Query endpoint
router.post('/query', aiController.query);

// Action endpoint
router.post('/action/:name', aiController.action);

module.exports = router;
