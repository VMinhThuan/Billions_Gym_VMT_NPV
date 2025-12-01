const ChatRoom = require('../models/ChatRoom');
const ChatMessage = require('../models/ChatMessage');
const { NguoiDung } = require('../models/NguoiDung');
const mongoose = require('mongoose');

// Lấy danh sách phòng chat của hội viên (chat với các PT)
exports.getChatRooms = async (req, res) => {
    try {
        const memberId = req.user.id;

        // Lấy tất cả phòng chat mà hội viên tham gia
        const rooms = await ChatRoom.find({
            participants: memberId
        })
            .populate({
                path: 'participants',
                select: 'hoTen anhDaiDien vaiTro chuyenMon'
            })
            .sort({ lastMessageAt: -1 });

        // Lọc và format dữ liệu
        const formattedRooms = rooms
            .filter(room => room.participants && room.participants.length > 0)
            .map(room => {
                const participants = Array.isArray(room.participants)
                    ? room.participants
                    : [room.participants];

                // Tìm PT trong phòng chat (người không phải là hội viên)
                const pt = participants.find(p => p._id && p._id.toString() !== memberId.toString());

                return {
                    _id: room._id,
                    pt: pt, // Thông tin PT
                    lastMessage: room.lastMessage,
                    lastMessageAt: room.lastMessageAt,
                    unreadCount: 0 // Sẽ tính sau
                };
            })
            .filter(room => room.pt); // Chỉ lấy rooms có PT

        res.json({
            success: true,
            data: formattedRooms
        });
    } catch (err) {
        console.error('Error in member getChatRooms:', err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

// Lấy lịch sử tin nhắn
exports.getChatMessages = async (req, res) => {
    try {
        const memberId = req.user.id;
        const { roomId } = req.params;
        const { page = 1, limit = 50 } = req.query;

        // Kiểm tra hội viên có trong phòng chat không
        const room = await ChatRoom.findOne({
            _id: roomId,
            participants: memberId
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
                sender: { $ne: memberId },
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
        console.error('Error in member getChatMessages:', err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

// Upload file cho chat
exports.uploadChatFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Không có file được upload'
            });
        }

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
        console.error('Error in member uploadChatFile:', err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

// Tạo hoặc lấy phòng chat với PT
exports.getOrCreateRoom = async (req, res) => {
    try {
        const memberId = req.user.id;
        const { ptId } = req.params;

        console.log('🟢 Member creating room with PT:', { memberId, ptId });

        // Kiểm tra PT có tồn tại không
        const pt = await NguoiDung.findById(ptId);
        if (!pt) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy PT'
            });
        }

        // Kiểm tra PT có phải là PT không
        if (pt.vaiTro !== 'PT') {
            return res.status(400).json({
                success: false,
                message: 'Người dùng này không phải là PT'
            });
        }

        // Tìm hoặc tạo phòng chat (hội viên là người đầu tiên, PT là người thứ hai)
        let room = await ChatRoom.findOne({
            participants: { $all: [memberId, ptId] }
        }).populate('participants', 'hoTen anhDaiDien vaiTro chuyenMon');

        if (!room) {
            // Tạo phòng chat mới
            room = await ChatRoom.create({
                participants: [memberId, ptId],
                participantModel: 'HoiVien', // Set model type
                lastMessage: null,
                lastMessageAt: new Date()
            });

            // Populate participants
            room = await ChatRoom.findById(room._id)
                .populate('participants', 'hoTen anhDaiDien vaiTro chuyenMon');

            console.log('✅ Created new room:', room._id);
        } else {
            console.log('✅ Found existing room:', room._id);
        }

        res.json({
            success: true,
            data: room
        });
    } catch (err) {
        console.error('❌ Error in member getOrCreateRoom:', err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};
