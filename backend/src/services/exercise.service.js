const Exercise = require('../models/BaiTap'); // BaiTap (alias cho Exercise)
const SessionPlaylistItem = require('../models/SessionPlaylistItem');

const createExercise = async (data) => {
    const exercise = new Exercise(data);
    await exercise.save();
    return exercise;
};

const getExerciseById = async (id) => {
    return await Exercise.findById(id);
};

const getAllExercises = async (filters = {}) => {
    const query = {};

    if (filters.type) {
        query.type = filters.type;
    }

    if (filters.status) {
        query.status = filters.status;
    }

    if (filters.search) {
        query.$or = [
            { title: { $regex: filters.search, $options: 'i' } },
            { description: { $regex: filters.search, $options: 'i' } }
        ];
    }

    return await Exercise.find(query)
        .sort({ createdAt: -1 });
};

const updateExercise = async (id, data) => {
    const exercise = await Exercise.findByIdAndUpdate(
        id,
        data,
        { new: true, runValidators: true }
    );
    return exercise;
};

const checkExerciseInUse = async (exerciseId) => {
    const count = await SessionPlaylistItem.countDocuments({ exercise_id: exerciseId });
    return count > 0;
};

const deleteExercise = async (id) => {
    // Kiểm tra xem exercise có đang được sử dụng trong playlist không
    const inUse = await checkExerciseInUse(id);

    if (inUse) {
        // Soft delete: chuyển status thành inactive
        return await Exercise.findByIdAndUpdate(
            id,
            { status: 'inactive' },
            { new: true }
        );
    } else {
        // Hard delete: xóa hoàn toàn nếu không có reference
        return await Exercise.findByIdAndDelete(id);
    }
};

module.exports = {
    createExercise,
    getExerciseById,
    getAllExercises,
    updateExercise,
    deleteExercise,
    checkExerciseInUse
};

