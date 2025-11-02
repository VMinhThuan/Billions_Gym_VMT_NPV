const express = require('express');
const router = express.Router({ mergeParams: true });
const sessionPlaylistController = require('../controllers/sessionPlaylist.controller');
const auth = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');

const ptAndAdmin = ['PT', 'OngChu'];
const allUsers = ['HoiVien', 'PT', 'OngChu'];

// Lấy playlist của session (tất cả user)
router.get('/', auth, authorize(allUsers), sessionPlaylistController.getSessionPlaylist);

// Thêm exercise vào playlist (chỉ PT và admin)
router.post('/', auth, authorize(ptAndAdmin), sessionPlaylistController.addExerciseToSession);

// Sắp xếp lại playlist (chỉ PT và admin)
router.put('/reorder', auth, authorize(ptAndAdmin), sessionPlaylistController.reorderPlaylist);

// Cập nhật playlist item (chỉ PT và admin)
router.put('/:itemId', auth, authorize(ptAndAdmin), sessionPlaylistController.updatePlaylistItem);

// Xóa exercise khỏi playlist (chỉ PT và admin)
router.delete('/:itemId', auth, authorize(ptAndAdmin), sessionPlaylistController.removeExerciseFromSession);

module.exports = router;

