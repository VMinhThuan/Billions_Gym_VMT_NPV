const express = require('express');
const router = express.Router();
const faceController = require('../controllers/face.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// All routes require authentication
router.use(authMiddleware);

// Enroll face - Save 3 face encodings
router.post('/enroll', faceController.enrollFace);

// Validate enrollment encodings - Check if 3 encodings belong to the same person
router.post('/validate-enrollment', faceController.validateEnrollmentEncodings);

// Verify face - Compare face encoding
router.post('/verify', faceController.verifyFace);

// Check if member has face encoding
router.get('/check', faceController.checkFaceEncoding);

module.exports = router;

