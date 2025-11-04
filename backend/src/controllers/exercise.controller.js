const exerciseService = require('../services/exercise.service');
const mongoose = require('mongoose');

const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

exports.createExercise = async (req, res) => {
    try {
        const exercise = await exerciseService.createExercise(req.body);
        res.status(201).json({
            message: 'Tạo bài tập thành công',
            data: exercise
        });
    } catch (err) {
        res.status(400).json({
            message: 'Tạo bài tập thất bại',
            error: err.message
        });
    }
};

exports.getAllExercises = async (req, res) => {
    try {
        const filters = {
            type: req.query.type,
            status: req.query.status,
            search: req.query.search
        };
        const exercises = await exerciseService.getAllExercises(filters);
        res.json(exercises);
    } catch (err) {
        res.status(500).json({
            message: 'Lỗi server',
            error: err.message
        });
    }
};

exports.getExerciseById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({ message: 'ID bài tập không hợp lệ' });
        }

        const exercise = await exerciseService.getExerciseById(id);
        if (!exercise) {
            return res.status(404).json({ message: 'Không tìm thấy bài tập' });
        }
        res.json(exercise);
    } catch (err) {
        res.status(500).json({
            message: 'Lỗi server',
            error: err.message
        });
    }
};

exports.updateExercise = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({ message: 'ID bài tập không hợp lệ' });
        }

        const exercise = await exerciseService.updateExercise(id, req.body);
        if (!exercise) {
            return res.status(404).json({ message: 'Không tìm thấy bài tập' });
        }
        res.json({
            message: 'Cập nhật bài tập thành công',
            data: exercise
        });
    } catch (err) {
        res.status(400).json({
            message: 'Cập nhật thất bại',
            error: err.message
        });
    }
};

exports.deleteExercise = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({ message: 'ID bài tập không hợp lệ' });
        }

        const exercise = await exerciseService.deleteExercise(id);
        if (!exercise) {
            return res.status(404).json({ message: 'Không tìm thấy bài tập' });
        }
        res.json({
            message: 'Xóa bài tập thành công',
            data: exercise
        });
    } catch (err) {
        res.status(400).json({
            message: 'Xóa thất bại',
            error: err.message
        });
    }
};

