const express = require('express');
const router = express.Router();
const ptChatController = require('../controllers/pt-chat.controller');
const auth = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Tạo thư mục uploads nếu chưa có
const uploadsDir = path.join(__dirname, '../../uploads/chat');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Cấu hình multer cho upload file
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Cho phép ảnh và file
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Chỉ cho phép upload ảnh và file (pdf, doc, xls, txt)'));
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    },
    fileFilter: fileFilter
});

// Tất cả routes đều yêu cầu authentication và role PT
router.use(auth);
router.use(authorize(['PT', 'OngChu']));

// Phòng chat
router.get('/rooms', ptChatController.getChatRooms);
router.get('/rooms/:hoiVienId', ptChatController.getOrCreateRoom);

// Tin nhắn
router.get('/rooms/:roomId/messages', ptChatController.getChatMessages);

// Upload file
router.post('/upload', upload.single('file'), ptChatController.uploadChatFile);

module.exports = router;

