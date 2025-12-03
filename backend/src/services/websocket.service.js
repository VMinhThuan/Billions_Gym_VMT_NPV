const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const ChatRoom = require('../models/ChatRoom');
const ChatMessage = require('../models/ChatMessage');
const { PT } = require('../models/NguoiDung');

let io = null;

// Store online users with their socket IDs and last activity
const onlineUsers = new Map(); // userId -> { socketId, lastActivity, role }

// Check for inactive users every minute
setInterval(async () => {
    const now = Date.now();
    const inactiveTimeout = 5 * 60 * 1000; // 5 minutes

    for (const [userId, userData] of onlineUsers.entries()) {
        if (now - userData.lastActivity > inactiveTimeout) {
            // User has been inactive for more than 5 minutes
            if (userData.role === 'PT') {
                try {
                    await PT.findByIdAndUpdate(userId, {
                        isOnline: false,
                        lastActivity: new Date(userData.lastActivity)
                    });

                    // Broadcast PT status change
                    io.emit('pt-status-changed', {
                        ptId: userId,
                        isOnline: false
                    });

                    console.log(`[WebSocket] PT ${userId} marked as offline due to inactivity`);
                } catch (err) {
                    console.error('[WebSocket] Error updating PT offline status:', err);
                }
            }
            onlineUsers.delete(userId);
        }
    }
}, 60000); // Check every minute

// Khởi tạo Socket.IO server
exports.initializeSocketIO = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    // Middleware xác thực Socket.IO
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                return next(new Error('Authentication error: No token provided'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.id;
            socket.userRole = decoded.vaiTro;
            next();
        } catch (err) {
            next(new Error('Authentication error: Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`[WebSocket] User connected: ${socket.userId} (${socket.userRole})`);

        // Add user to online users
        onlineUsers.set(socket.userId, {
            socketId: socket.id,
            lastActivity: Date.now(),
            role: socket.userRole
        });

        // If PT connects, update their online status
        if (socket.userRole === 'PT') {
            PT.findByIdAndUpdate(socket.userId, {
                isOnline: true,
                lastActivity: new Date()
            }).then(() => {
                // Broadcast PT online status to all clients
                io.emit('pt-status-changed', {
                    ptId: socket.userId,
                    isOnline: true
                });
                console.log(`[WebSocket] PT ${socket.userId} is now online`);
            }).catch(err => {
                console.error('[WebSocket] Error updating PT online status:', err);
            });
        }

        // Update activity on any action
        const updateActivity = () => {
            const userData = onlineUsers.get(socket.userId);
            if (userData) {
                userData.lastActivity = Date.now();
                onlineUsers.set(socket.userId, userData);
            }

            // Update PT lastActivity in database
            if (socket.userRole === 'PT') {
                PT.findByIdAndUpdate(socket.userId, {
                    lastActivity: new Date()
                }).catch(err => {
                    console.error('[WebSocket] Error updating PT lastActivity:', err);
                });
            }
        };

        // Join room với học viên
        socket.on('join-room', async (roomId) => {
            updateActivity();
            try {
                // Kiểm tra user có quyền truy cập room không
                const room = await ChatRoom.findOne({
                    _id: roomId,
                    participants: socket.userId
                });

                if (!room) {
                    socket.emit('error', { message: 'Không có quyền truy cập phòng chat này' });
                    return;
                }

                socket.join(roomId);
                console.log(`[WebSocket] User ${socket.userId} joined room ${roomId}`);
                socket.emit('joined-room', { roomId });
            } catch (err) {
                console.error('[WebSocket] Error joining room:', err);
                socket.emit('error', { message: 'Lỗi khi tham gia phòng chat' });
            }
        });

        // Gửi tin nhắn
        socket.on('send-message', async (data) => {
            updateActivity();
            try {
                const { roomId, message, type = 'text', fileUrl, fileName, fileSize } = data;

                // Kiểm tra quyền truy cập
                const room = await ChatRoom.findOne({
                    _id: roomId,
                    participants: socket.userId
                });

                if (!room) {
                    socket.emit('error', { message: 'Không có quyền gửi tin nhắn' });
                    return;
                }

                // Tạo tin nhắn mới
                const chatMessage = await ChatMessage.create({
                    room: roomId,
                    sender: socket.userId,
                    senderModel: socket.userRole === 'PT' ? 'PT' : 'HoiVien',
                    message: message || '',
                    type: type,
                    fileUrl: fileUrl || null,
                    fileName: fileName || null,
                    fileSize: fileSize || null,
                    isRead: false
                });

                // Cập nhật lastMessage trong room
                room.lastMessage = message || fileName || 'Đã gửi file';
                room.lastMessageAt = new Date();
                room.lastMessageBy = socket.userId;
                room.lastMessageByModel = socket.userRole === 'PT' ? 'PT' : 'HoiVien';
                await room.save();

                // Populate sender để gửi thông tin đầy đủ
                await chatMessage.populate('sender', 'hoTen anhDaiDien');

                // Gửi tin nhắn đến tất cả users trong room
                io.to(roomId).emit('new-message', {
                    _id: chatMessage._id,
                    room: chatMessage.room,
                    sender: chatMessage.sender,
                    message: chatMessage.message,
                    type: chatMessage.type,
                    fileUrl: chatMessage.fileUrl,
                    fileName: chatMessage.fileName,
                    fileSize: chatMessage.fileSize,
                    createdAt: chatMessage.createdAt
                });

                console.log(`[WebSocket] Message sent in room ${roomId} by ${socket.userId}`);
            } catch (err) {
                console.error('[WebSocket] Error sending message:', err);
                socket.emit('error', { message: 'Lỗi khi gửi tin nhắn' });
            }
        });

        // Typing indicator
        socket.on('typing', (data) => {
            updateActivity();
            const { roomId } = data;
            socket.to(roomId).emit('user-typing', {
                userId: socket.userId,
                roomId: roomId
            });
        });

        socket.on('stop-typing', (data) => {
            updateActivity();
            const { roomId } = data;
            socket.to(roomId).emit('user-stop-typing', {
                userId: socket.userId,
                roomId: roomId
            });
        });

        // Đánh dấu tin nhắn đã đọc
        socket.on('mark-read', async (data) => {
            updateActivity();
            try {
                const { roomId } = data;

                await ChatMessage.updateMany(
                    {
                        room: roomId,
                        sender: { $ne: socket.userId },
                        isRead: false
                    },
                    {
                        isRead: true,
                        readAt: new Date()
                    }
                );

                socket.to(roomId).emit('messages-read', { roomId });
            } catch (err) {
                console.error('[WebSocket] Error marking messages as read:', err);
            }
        });

        // Disconnect
        socket.on('disconnect', async () => {
            console.log(`[WebSocket] User disconnected: ${socket.userId}`);

            // Remove from online users
            onlineUsers.delete(socket.userId);

            // If PT disconnects, update their online status
            if (socket.userRole === 'PT') {
                try {
                    await PT.findByIdAndUpdate(socket.userId, {
                        isOnline: false,
                        lastActivity: new Date()
                    });

                    // Broadcast PT offline status
                    io.emit('pt-status-changed', {
                        ptId: socket.userId,
                        isOnline: false
                    });

                    console.log(`[WebSocket] PT ${socket.userId} is now offline`);
                } catch (err) {
                    console.error('[WebSocket] Error updating PT offline status:', err);
                }
            }
        });
    });

    return io;
};

// Get Socket.IO instance
exports.getIO = () => {
    return io;
};

