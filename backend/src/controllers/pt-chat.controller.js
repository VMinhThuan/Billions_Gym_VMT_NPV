const ChatRoom = require('../models/ChatRoom');
const ChatMessage = require('../models/ChatMessage');
const { HoiVien } = require('../models/NguoiDung');
const mongoose = require('mongoose');

// Lấy danh sách phòng chat với học viên
exports.getChatRooms = async (req, res) => {
    try {
        const ptId = req.user.id;

        // Lấy tất cả phòng chat mà PT tham gia
        const rooms = await ChatRoom.find({
            participants: ptId
        })
            .populate({
                path: 'participants',
                select: 'hoTen anhDaiDien'
            })
            .sort({ lastMessageAt: -1 });

        // Lọc và format dữ liệu với unread count
        const formattedRooms = await Promise.all(
            rooms
                .filter(room => room.participants && room.participants.length > 0)
                .map(async (room) => {
                    const participants = Array.isArray(room.participants)
                        ? room.participants
                        : [room.participants];

                    const hoiVien = participants.find(p => p._id && p._id.toString() !== ptId.toString());

                    // Đếm số tin nhắn chưa đọc (tin nhắn từ hội viên mà PT chưa đọc)
                    const unreadCount = await ChatMessage.countDocuments({
                        room: room._id,
                        sender: { $ne: ptId },
                        isRead: false
                    });

                    return {
                        _id: room._id,
                        hoiVien: hoiVien,
                        lastMessage: room.lastMessage,
                        lastMessageAt: room.lastMessageAt,
                        unreadCount: unreadCount
                    };
                })
        );

        const filteredRooms = formattedRooms.filter(room => room.hoiVien);

        res.json({
            success: true,
            data: filteredRooms
        });
    } catch (err) {
        console.error('Error in getChatRooms:', err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

// Lấy lịch sử tin nhắn
exports.getChatMessages = async (req, res) => {
    try {
        const ptId = req.user.id;
        const { roomId } = req.params;
        const { page = 1, limit = 50 } = req.query;

        // Kiểm tra PT có trong phòng chat không
        const room = await ChatRoom.findOne({
            _id: roomId,
            participants: ptId
        });

        if (!room) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền truy cập phòng chat này'
            });
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const messages = await ChatMessage.find({ room: roomId })
            .populate('sender', 'hoTen anhDaiDien')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Đánh dấu tin nhắn là đã đọc
        await ChatMessage.updateMany(
            {
                room: roomId,
                sender: { $ne: ptId },
                isRead: false
            },
            {
                isRead: true,
                readAt: new Date()
            }
        );

        res.json({
            success: true,
            data: messages.reverse() // Đảo ngược để hiển thị từ cũ đến mới
        });
    } catch (err) {
        console.error('Error in getChatMessages:', err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

// Upload file cho chat (sẽ được xử lý qua multer middleware)
exports.uploadChatFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Không có file được upload'
            });
        }

        // File đã được upload qua multer, trả về URL
        const fileUrl = `/uploads/chat/${req.file.filename}`;

        res.json({
            success: true,
            data: {
                fileUrl,
                fileName: req.file.originalname,
                fileSize: req.file.size,
                fileType: req.file.mimetype
            }
        });
    } catch (err) {
        console.error('Error in uploadChatFile:', err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

// Tạo hoặc lấy phòng chat với học viên
exports.getOrCreateRoom = async (req, res) => {
    try {
        const ptId = req.user.id;
        const { hoiVienId } = req.params;

        // Kiểm tra học viên có tồn tại không
        const hoiVien = await HoiVien.findById(hoiVienId);
        if (!hoiVien) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy học viên'
            });
        }

        // Tìm hoặc tạo phòng chat
        const room = await ChatRoom.findOrCreateRoom(ptId, hoiVienId);

        res.json({
            success: true,
            data: room
        });
    } catch (err) {
        console.error('Error in getOrCreateRoom:', err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

// Xóa toàn bộ cuộc trò chuyện (room và messages)
exports.deleteChatRoom = async (req, res) => {
    try {
        const ptId = req.user.id;
        const { roomId } = req.params;

        // Kiểm tra PT có trong phòng chat không
        const room = await ChatRoom.findOne({
            _id: roomId,
            participants: ptId
        });

        if (!room) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền xóa phòng chat này'
            });
        }

        // Xóa tất cả tin nhắn trong phòng chat
        await ChatMessage.deleteMany({ room: roomId });

        // Xóa luôn cả phòng chat
        await ChatRoom.findByIdAndDelete(roomId);

        res.json({
            success: true,
            message: 'Đã xóa cuộc trò chuyện'
        });
    } catch (err) {
        console.error('Error in deleteChatRoom:', err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

