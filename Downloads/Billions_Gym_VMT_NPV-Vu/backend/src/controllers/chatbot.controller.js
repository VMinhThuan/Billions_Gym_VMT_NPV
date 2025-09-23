const chatbotService = require('../services/chatbot.service');
const authMiddleware = require('../middlewares/auth.middleware');

// Gửi tin nhắn đến chatbot
const sendMessage = async (req, res) => {
    try {
        const { message } = req.body;
        const hoiVienId = req.user.id; // Từ auth middleware

        if (!message || message.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Tin nhắn không được để trống'
            });
        }

        const result = await chatbotService.processMessage(hoiVienId, message);

        res.status(200).json({
            success: result.success,
            message: result.success ? 'Xử lý tin nhắn thành công' : 'Có lỗi xảy ra',
            data: {
                response: result.response,
                context: result.context,
                sessionId: result.sessionId
            }
        });

    } catch (error) {
        console.error('Lỗi gửi tin nhắn chatbot:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi xử lý tin nhắn'
        });
    }
};

// Lấy lịch sử chat
const getChatHistory = async (req, res) => {
    try {
        const hoiVienId = req.user.id;
        const { limit = 50 } = req.query;

        const result = await chatbotService.getChatHistory(hoiVienId, parseInt(limit));

        res.status(200).json({
            success: true,
            message: 'Lấy lịch sử chat thành công',
            data: result
        });

    } catch (error) {
        console.error('Lỗi lấy lịch sử chat:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi lấy lịch sử chat'
        });
    }
};

// Tạo session mới
const createSession = async (req, res) => {
    try {
        const hoiVienId = req.user.id;

        const session = await chatbotService.createChatbotSession(hoiVienId);

        res.status(201).json({
            success: true,
            message: 'Tạo session chatbot thành công',
            data: {
                sessionId: session.sessionId,
                currentContext: session.currentContext
            }
        });

    } catch (error) {
        console.error('Lỗi tạo session chatbot:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi tạo session'
        });
    }
};

// Đóng session
const closeSession = async (req, res) => {
    try {
        const hoiVienId = req.user.id;

        await chatbotService.closeSession(hoiVienId);

        res.status(200).json({
            success: true,
            message: 'Đóng session thành công'
        });

    } catch (error) {
        console.error('Lỗi đóng session:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi đóng session'
        });
    }
};

// Lấy thông tin session hiện tại
const getCurrentSession = async (req, res) => {
    try {
        const hoiVienId = req.user.id;

        const session = await chatbotService.getCurrentSession(hoiVienId);

        res.status(200).json({
            success: true,
            message: 'Lấy thông tin session thành công',
            data: {
                sessionId: session.sessionId,
                currentContext: session.currentContext,
                isActive: session.isActive,
                lastActivity: session.lastActivity,
                messageCount: session.messages.length
            }
        });

    } catch (error) {
        console.error('Lỗi lấy session hiện tại:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi lấy session'
        });
    }
};

// Lấy thông tin profile người dùng cho chatbot
const getUserProfile = async (req, res) => {
    try {
        const hoiVienId = req.user.id;

        const profile = await chatbotService.getUserProfile(hoiVienId);

        res.status(200).json({
            success: true,
            message: 'Lấy thông tin profile thành công',
            data: profile
        });

    } catch (error) {
        console.error('Lỗi lấy profile người dùng:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi lấy profile'
        });
    }
};

module.exports = {
    sendMessage,
    getChatHistory,
    createSession,
    closeSession,
    getCurrentSession,
    getUserProfile
};
