const SessionPlaylistItem = require('../models/SessionPlaylistItem');
const Session = require('../models/Session');
const Exercise = require('../models/Exercise');

const getSessionPlaylist = async (sessionId) => {
    // Kiểm tra session tồn tại
    const session = await Session.findById(sessionId);
    if (!session) {
        throw new Error('Không tìm thấy buổi tập');
    }

    const playlist = await SessionPlaylistItem.find({ session_id: sessionId })
        .populate('exercise_id')
        .sort({ position: 1 });

    return playlist;
};

const addExerciseToSession = async (sessionId, exerciseId, position = null, isPreview = false) => {
    // Kiểm tra session tồn tại
    const session = await Session.findById(sessionId);
    if (!session) {
        throw new Error('Không tìm thấy buổi tập');
    }

    // Kiểm tra exercise tồn tại và active
    const exercise = await Exercise.findById(exerciseId);
    if (!exercise) {
        throw new Error('Không tìm thấy bài tập');
    }
    if (exercise.status !== 'active') {
        throw new Error('Bài tập không hoạt động');
    }

    // Kiểm tra exercise đã có trong session chưa
    const existingItem = await SessionPlaylistItem.findOne({
        session_id: sessionId,
        exercise_id: exerciseId
    });
    if (existingItem) {
        throw new Error('Bài tập đã có trong playlist');
    }

    // Nếu không chỉ định position, tự động thêm vào cuối
    if (position === null) {
        const lastItem = await SessionPlaylistItem.findOne({ session_id: sessionId })
            .sort({ position: -1 });
        position = lastItem ? lastItem.position + 1 : 1;
    } else {
        // Kiểm tra position đã tồn tại chưa
        const existingPosition = await SessionPlaylistItem.findOne({
            session_id: sessionId,
            position: position
        });
        if (existingPosition) {
            throw new Error(`Position ${position} đã được sử dụng`);
        }
    }

    const playlistItem = new SessionPlaylistItem({
        session_id: sessionId,
        exercise_id: exerciseId,
        position: position,
        is_preview: isPreview
    });

    await playlistItem.save();
    return await SessionPlaylistItem.findById(playlistItem._id)
        .populate('exercise_id');
};

const removeExerciseFromSession = async (sessionId, playlistItemId) => {
    const item = await SessionPlaylistItem.findOne({
        _id: playlistItemId,
        session_id: sessionId
    });

    if (!item) {
        throw new Error('Không tìm thấy item trong playlist');
    }

    const removedPosition = item.position;

    // Xóa item
    await SessionPlaylistItem.findByIdAndDelete(playlistItemId);

    // Cập nhật lại position cho các item sau (giảm đi 1)
    await SessionPlaylistItem.updateMany(
        {
            session_id: sessionId,
            position: { $gt: removedPosition }
        },
        {
            $inc: { position: -1 }
        }
    );

    return { message: 'Đã xóa item khỏi playlist' };
};

const reorderPlaylist = async (sessionId, newOrder) => {
    // Kiểm tra session tồn tại
    const session = await Session.findById(sessionId);
    if (!session) {
        throw new Error('Không tìm thấy buổi tập');
    }

    // Validate newOrder: phải là array của { itemId, position }
    if (!Array.isArray(newOrder) || newOrder.length === 0) {
        throw new Error('Thứ tự mới không hợp lệ');
    }

    // Kiểm tra tất cả positions liên tục từ 1
    const positions = newOrder.map(item => item.position).sort((a, b) => a - b);
    for (let i = 0; i < positions.length; i++) {
        if (positions[i] !== i + 1) {
            throw new Error('Positions phải liên tục từ 1');
        }
    }

    // Kiểm tra không có position trùng
    const uniquePositions = new Set(positions);
    if (uniquePositions.size !== positions.length) {
        throw new Error('Không được có position trùng nhau');
    }

    // Validate tất cả items thuộc về session này
    const itemIds = newOrder.map(item => item.itemId);
    const items = await SessionPlaylistItem.find({
        _id: { $in: itemIds },
        session_id: sessionId
    });

    if (items.length !== itemIds.length) {
        throw new Error('Một số items không thuộc về session này');
    }

    // Update tất cả items
    const updatePromises = newOrder.map(({ itemId, position }) =>
        SessionPlaylistItem.findByIdAndUpdate(itemId, { position })
    );

    await Promise.all(updatePromises);

    // Trả về playlist đã được sắp xếp lại
    return await getSessionPlaylist(sessionId);
};

const updatePlaylistItem = async (playlistItemId, data) => {
    const item = await SessionPlaylistItem.findById(playlistItemId);
    if (!item) {
        throw new Error('Không tìm thấy playlist item');
    }

    // Nếu cập nhật position, kiểm tra không trùng
    if (data.position !== undefined && data.position !== item.position) {
        const existingPosition = await SessionPlaylistItem.findOne({
            session_id: item.session_id,
            position: data.position,
            _id: { $ne: playlistItemId }
        });
        if (existingPosition) {
            throw new Error(`Position ${data.position} đã được sử dụng`);
        }
    }

    const updatedItem = await SessionPlaylistItem.findByIdAndUpdate(
        playlistItemId,
        data,
        { new: true, runValidators: true }
    ).populate('exercise_id');

    return updatedItem;
};

module.exports = {
    getSessionPlaylist,
    addExerciseToSession,
    removeExerciseFromSession,
    reorderPlaylist,
    updatePlaylistItem
};

