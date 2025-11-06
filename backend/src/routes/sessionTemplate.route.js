const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/sessionTemplate.controller');
const auth = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');

// Public listing for frontend consumption (no auth required)
router.get('/public', ctrl.list);
router.get('/public/:id', ctrl.detail);

// Admin/management endpoints (protected)
router.get('/', auth, authorize(['OngChu', 'PT']), ctrl.list);
router.get('/:id', auth, authorize(['OngChu', 'PT']), ctrl.detail);
router.post('/create-session', auth, authorize(['OngChu']), ctrl.createSessionFromTemplate);

module.exports = router;


