const aiService = require('../services/ai.service');

/**
 * Chat endpoint - xử lý tin nhắn chat với AI
 * POST /api/ai/chat
 */
exports.chat = async (req, res) => {
    try {
        const { message, conversationHistory = [] } = req.body;
        const userId = req.user.id;
        const vaiTro = req.user.vaiTro;

        if (!message || message.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Tin nhắn không được để trống'
            });
        }

        // Lấy context người dùng
        const userContext = await aiService.getUserContext(userId, vaiTro);

        // Xử lý tin nhắn với AI
        const result = await aiService.processChatMessage(message, userContext, conversationHistory);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error in AI chat:', error);

        // Log chi tiết lỗi để debug
        if (error.message && error.message.includes('GoogleGenerativeAI')) {
            console.error('Gemini API Error Details:', {
                message: error.message,
                stack: error.stack
            });
        }

        // Trả về message rõ ràng hơn cho user
        let errorMessage = 'Lỗi xử lý tin nhắn AI';
        if (error.message && error.message.includes('model')) {
            errorMessage = 'Model AI không khả dụng. Vui lòng thử lại sau.';
        } else if (error.message && error.message.includes('API key')) {
            errorMessage = 'Lỗi cấu hình AI. Vui lòng liên hệ quản trị viên.';
        } else if (error.message) {
            errorMessage = error.message;
        }

        res.status(500).json({
            success: false,
            message: errorMessage,
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

/**
 * Search endpoint - tìm kiếm full-text
 * GET /api/ai/search?q=...
 */
exports.search = async (req, res) => {
    try {
        const { q } = req.query;
        const userId = req.user.id;
        const vaiTro = req.user.vaiTro;

        if (!q || q.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Từ khóa tìm kiếm không được để trống'
            });
        }

        // Lấy context người dùng
        const userContext = await aiService.getUserContext(userId, vaiTro);

        // Tìm kiếm
        const result = await aiService.search(q, userContext);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error in AI search:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi tìm kiếm',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

/**
 * Query endpoint - truy vấn có cấu trúc
 * POST /api/ai/query
 */
exports.query = async (req, res) => {
    try {
        const queryPayload = req.body;
        const userId = req.user.id;
        const vaiTro = req.user.vaiTro;

        if (!queryPayload || !queryPayload.resource) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu resource trong query payload'
            });
        }

        // Lấy context người dùng
        const userContext = await aiService.getUserContext(userId, vaiTro);

        // Xử lý query
        const result = await aiService.processQuery(queryPayload, userContext);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error in AI query:', error);

        // Kiểm tra lỗi quyền truy cập
        if (error.message && error.message.includes('quyền')) {
            return res.status(403).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi truy vấn dữ liệu',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

/**
 * Action endpoint - thực hiện các action nghiệp vụ
 * POST /api/ai/action/:name
 */
exports.action = async (req, res) => {
    try {
        const { name } = req.params;
        const actionPayload = req.body;
        const userId = req.user.id;
        const vaiTro = req.user.vaiTro;

        // Lấy context người dùng
        const userContext = await aiService.getUserContext(userId, vaiTro);

        // Xử lý các action được whitelist
        switch (name) {
            case 'get_my_package':
                // Lấy gói tập của hội viên
                if (userContext.vaiTro !== 'HoiVien') {
                    return res.status(403).json({
                        success: false,
                        message: 'Chỉ hội viên mới có thể xem gói tập của mình'
                    });
                }

                const ChiTietGoiTap = require('../models/ChiTietGoiTap');
                const chiTietGoiTap = await ChiTietGoiTap.findOne({
                    nguoiDungId: userId,
                    trangThaiSuDung: { $in: ['DANG_HOAT_DONG', 'DANG_SU_DUNG'] }
                }).populate('goiTapId').populate('branchId');

                return res.json({
                    success: true,
                    data: chiTietGoiTap
                });

            case 'get_my_schedule':
                // Lấy lịch tập của hội viên
                if (userContext.vaiTro !== 'HoiVien') {
                    return res.status(403).json({
                        success: false,
                        message: 'Chỉ hội viên mới có thể xem lịch tập của mình'
                    });
                }

                const LichTap = require('../models/LichTap');
                const lichTap = await LichTap.findOne({ hoiVien: userId })
                    .populate('hoiVien', 'hoTen')
                    .populate('pt', 'hoTen')
                    .populate({
                        path: 'cacBuoiTap',
                        populate: {
                            path: 'cacBaiTap.baiTap'
                        }
                    });

                return res.json({
                    success: true,
                    data: lichTap
                });

            case 'get_my_history':
                // Lấy lịch sử tập
                if (userContext.vaiTro !== 'HoiVien') {
                    return res.status(403).json({
                        success: false,
                        message: 'Chỉ hội viên mới có thể xem lịch sử tập của mình'
                    });
                }

                const LichSuTap = require('../models/LichSuTap');
                const lichSuTap = await LichSuTap.find({ hoiVien: userId })
                    .sort({ ngayTap: -1 })
                    .limit(30);

                return res.json({
                    success: true,
                    data: lichSuTap,
                    total: lichSuTap.length
                });

            case 'get_my_payments':
                // Lấy lịch sử thanh toán
                if (userContext.vaiTro !== 'HoiVien') {
                    return res.status(403).json({
                        success: false,
                        message: 'Chỉ hội viên mới có thể xem lịch sử thanh toán của mình'
                    });
                }

                const ChiTietGoiTap2 = require('../models/ChiTietGoiTap');
                const chiTietGoiTap2 = await ChiTietGoiTap2.find({ nguoiDungId: userId })
                    .populate('maThanhToan')
                    .sort({ ngayDangKy: -1 });

                return res.json({
                    success: true,
                    data: chiTietGoiTap2.map(ct => ({
                        goiTap: ct.goiTapId,
                        soTien: ct.soTienThanhToan,
                        trangThai: ct.trangThaiThanhToan,
                        ngayThanhToan: ct.ngayDangKy,
                        thanhToan: ct.maThanhToan
                    }))
                });

            default:
                return res.status(400).json({
                    success: false,
                    message: `Action '${name}' không được hỗ trợ`
                });
        }
    } catch (error) {
        console.error('Error in AI action:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi thực hiện action',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};
