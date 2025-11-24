const mongoose = require('mongoose');

const ChatRoomSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'participantModel',
        required: true
    }],
    participantModel: {
        type: String,
        enum: ['PT', 'HoiVien'],
        required: true
    },
    lastMessage: {
        type: String
    },
    lastMessageAt: {
        type: Date
    },
    lastMessageBy: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'lastMessageByModel'
    },
    lastMessageByModel: {
        type: String,
        enum: ['PT', 'HoiVien']
    }
}, {
    timestamps: true,
    collection: 'chatrooms'
});

// Index để tối ưu query
ChatRoomSchema.index({ participants: 1 });
ChatRoomSchema.index({ lastMessageAt: -1 });

// Method để tìm hoặc tạo room giữa PT và HoiVien
ChatRoomSchema.statics.findOrCreateRoom = async function (ptId, hoiVienId) {
    // Tìm room có cả PT và HoiVien
    let room = await this.findOne({
        participants: { $all: [ptId, hoiVienId] }
    });

    if (!room) {
        room = await this.create({
            participants: [ptId, hoiVienId],
            participantModel: 'PT'
        });
    }

    return room;
};

module.exports = mongoose.model('ChatRoom', ChatRoomSchema);

