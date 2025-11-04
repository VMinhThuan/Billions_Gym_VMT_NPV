const sessionPlaylistService = require('../services/sessionPlaylist.service');
const mongoose = require('mongoose');

const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

exports.getSessionPlaylist = async (req, res) => {
    try {
        const { sessionId } = req.params;

        if (!isValidObjectId(sessionId)) {
            return res.status(400).json({ message: 'ID buổi tập không hợp lệ' });
        }

        const playlist = await sessionPlaylistService.getSessionPlaylist(sessionId);
        res.json(playlist);
    } catch (err) {
        if (err.message === 'Không tìm thấy buổi tập') {
            return res.status(404).json({ message: err.message });
        }
        res.status(500).json({
            message: 'Lỗi server',
            error: err.message
        });
    }
};

exports.addExerciseToSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { exerciseId, position, is_preview } = req.body;

        if (!isValidObjectId(sessionId)) {
            return res.status(400).json({ message: 'ID buổi tập không hợp lệ' });
        }

        if (!exerciseId || !isValidObjectId(exerciseId)) {
            return res.status(400).json({ message: 'ID bài tập không hợp lệ' });
        }

        const playlistItem = await sessionPlaylistService.addExerciseToSession(
            sessionId,
            exerciseId,
            position || null,
            is_preview || false
        );

        res.status(201).json({
            message: 'Thêm bài tập vào playlist thành công',
            data: playlistItem
        });
    } catch (err) {
        res.status(400).json({
            message: 'Thêm bài tập thất bại',
            error: err.message
        });
    }
};

exports.removeExerciseFromSession = async (req, res) => {
    try {
        const { sessionId, itemId } = req.params;

        if (!isValidObjectId(sessionId)) {
            return res.status(400).json({ message: 'ID buổi tập không hợp lệ' });
        }

        if (!isValidObjectId(itemId)) {
            return res.status(400).json({ message: 'ID item không hợp lệ' });
        }

        const result = await sessionPlaylistService.removeExerciseFromSession(sessionId, itemId);
        res.json({
            message: 'Xóa bài tập khỏi playlist thành công',
            data: result
        });
    } catch (err) {
        res.status(400).json({
            message: 'Xóa bài tập thất bại',
            error: err.message
        });
    }
};

exports.reorderPlaylist = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { newOrder } = req.body;

        if (!isValidObjectId(sessionId)) {
            return res.status(400).json({ message: 'ID buổi tập không hợp lệ' });
        }

        if (!newOrder || !Array.isArray(newOrder)) {
            return res.status(400).json({ message: 'Thứ tự mới không hợp lệ' });
        }

        const playlist = await sessionPlaylistService.reorderPlaylist(sessionId, newOrder);
        res.json({
            message: 'Sắp xếp lại playlist thành công',
            data: playlist
        });
    } catch (err) {
        res.status(400).json({
            message: 'Sắp xếp lại thất bại',
            error: err.message
        });
    }
};

exports.updatePlaylistItem = async (req, res) => {
    try {
        const { sessionId, itemId } = req.params;
        const { position, is_preview } = req.body;

        if (!isValidObjectId(sessionId)) {
            return res.status(400).json({ message: 'ID buổi tập không hợp lệ' });
        }

        if (!isValidObjectId(itemId)) {
            return res.status(400).json({ message: 'ID item không hợp lệ' });
        }

        const updateData = {};
        if (position !== undefined) updateData.position = position;
        if (is_preview !== undefined) updateData.is_preview = is_preview;

        const playlistItem = await sessionPlaylistService.updatePlaylistItem(itemId, updateData);
        res.json({
            message: 'Cập nhật playlist item thành công',
            data: playlistItem
        });
    } catch (err) {
        res.status(400).json({
            message: 'Cập nhật thất bại',
            error: err.message
        });
    }
};

