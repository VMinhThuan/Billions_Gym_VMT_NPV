const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
require('dotenv').config();
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 4000;

console.log('🚀 Starting server...');
console.log('urrl', process.env.FRONTEND_URL);

// CORS configuration - allow localhost for development
const allowedOrigins = [
    process.env.FRONTEND_URL,
    process.env.FRONTEND_URL_CLIENT,
    process.env.FRONTEND_URL_APP,
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    'https://billions-gym.vercel.app',
    'https://billions-fitness.vercel.app',
].filter(Boolean); // Remove undefined values

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            // Trong development, cho phép tất cả origins để mobile app có thể kết nối
            if (process.env.NODE_ENV === 'development') {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 86400, // 24 hours
}));
// Increase timeout for all requests
app.use((req, res, next) => {
    req.setTimeout(30000); // 30 seconds timeout
    res.setTimeout(30000);
    next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static files from uploads directory
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 30000, // Tăng lên 30 giây
    socketTimeoutMS: 75000, // Tăng socket timeout
    connectTimeoutMS: 30000, // Tăng connection timeout
    retryWrites: true,
    retryReads: true,
    maxPoolSize: 50, // Tăng pool size cho nhiều concurrent requests
    minPoolSize: 5, // Tăng min pool
    maxIdleTimeMS: 10000, // Giảm idle time để recycle connections nhanh hơn
    family: 4, // Use IPv4, skip trying IPv6
    heartbeatFrequencyMS: 10000 // Check connection mỗi 10s
})
    .then(async () => {
        console.log('Đã kết nối MongoDB thành công');

        // Kiểm tra kết nối MongoDB
        const dbState = mongoose.connection.readyState;
        if (dbState === 1) {
            console.log('Trạng thái MongoDB: Connected');
        } else {
            console.log(`Trạng thái MongoDB: ${dbState} (0=disconnected, 1=connected, 2=connecting, 3=disconnecting)`);
        }

        // Khởi động service tự động check-out
        const autoCheckoutService = require('./src/services/autoCheckout.service');

        // Chạy ngay lần đầu sau 30 giây (để đảm bảo server đã sẵn sàng)
        setTimeout(async () => {
            console.log('[Auto Check-out] Chạy lần đầu tiên...');
            await autoCheckoutService.autoCheckoutExpiredSessions();
        }, 30000);

        // Chạy định kỳ mỗi 10 phút (600000 ms)
        const AUTO_CHECKOUT_INTERVAL = 10 * 60 * 1000; // 10 phút
        setInterval(async () => {
            console.log('[Auto Check-out] Chạy định kỳ...');
            await autoCheckoutService.autoCheckoutExpiredSessions();
        }, AUTO_CHECKOUT_INTERVAL);

        console.log(`[Auto Check-out] Đã khởi động service tự động check-out (chạy mỗi ${AUTO_CHECKOUT_INTERVAL / 1000 / 60} phút)`);

        // Start PT Session Notification Service
        const { startPTSessionNotificationService } = require('./src/services/pt-session-notification.service');
        startPTSessionNotificationService();
    })
    .catch(err => {
        console.error('Lỗi kết nối MongoDB:', err.message);
        console.error('Chi tiết lỗi:', err);
        process.exit(1);
    });

// Event handlers for MongoDB connection
mongoose.connection.on('connected', () => {
    console.log('✅ Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ Mongoose connection error:', err);
    console.error('Error name:', err.name);
    console.error('Error code:', err.code);
});

mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ Mongoose disconnected from MongoDB');
});

mongoose.connection.on('reconnected', () => {
    console.log('🔄 Mongoose reconnected to MongoDB');
});

// Connection timeout handler
mongoose.connection.on('timeout', () => {
    console.error('⏱️ MongoDB connection timeout detected');
});

// Middleware để check MongoDB connection trước khi xử lý request
const checkMongoConnection = (req, res, next) => {
    if (mongoose.connection.readyState !== 1) {
        console.error('⚠️ MongoDB not connected, state:', mongoose.connection.readyState);
        return res.status(503).json({
            message: 'Database not available. Please try again.',
            state: mongoose.connection.readyState,
            retryable: true
        });
    }
    next();
};

// Graceful shutdown
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('Mongoose connection closed through app termination');
    process.exit(0);
});

const authRouter = require('./src/routes/auth.route');
const userRouter = require('./src/routes/user.route');
const baiTapRouter = require('./src/routes/baitap.route');
const lichTapRouter = require('./src/routes/lichtap.route');
const goiTapRouter = require('./src/routes/goitap.route');
const chiTietGoiTapRouter = require('./src/routes/chitietgoitap.route');
const buoiTapRouter = require('./src/routes/buoitap.route');
const lichSuTapRouter = require('./src/routes/lichsutap.route');
const dinhDuongRouter = require('./src/routes/dinhduong.route');
const thucDonRouter = require('./src/routes/thucdon.route');
const thanhToanRouter = require('./src/routes/thanhtoan.route');
const chiSoCoTheRouter = require('./src/routes/chisocothe.route');
const lichHenPTRouter = require('./src/routes/lichhenpt.route');
const hangHoiVienRouter = require('./src/routes/hanghoivien.route');
const chatbotRouter = require('./src/routes/chatbot.route');
const mlTrainingRouter = require('./src/routes/mlTraining.route');
const workoutPredictionRouter = require('./src/routes/workoutPrediction.route');
const packageWorkflowRouter = require('./src/routes/packageWorkflow.routes');
const dangKyGoiTapRouter = require('./src/routes/dangKyGoiTap.routes');
const reviewRouter = require('./src/routes/review.route');
const paymentRouter = require('./src/routes/payment.route');
const sessionRouter = require('./src/routes/session.route');
const sessionTemplateRouter = require('./src/routes/sessionTemplate.route');
const exerciseRouter = require('./src/routes/exercise.route');
const sessionPlaylistRouter = require('./src/routes/sessionPlaylist.route');
const chiNhanhRouter = require('./src/routes/chinhanh.route');
const notificationRouter = require('./src/routes/notification.route');
const aiRouter = require('./src/routes/ai.route');
const faceRouter = require('./src/routes/face.route');
const checkinRouter = require('./src/routes/checkin.route');
const ptCheckinRouter = require('./src/routes/pt-checkin.route');
const watchHistoryRouter = require('./src/routes/watchHistory.routes');
const statisticsRouter = require('./src/routes/statistics.route');
const yearlyGoalsRouter = require('./src/routes/yearlyGoals.route');
const nutritionPlanRouter = require('./src/routes/nutritionPlan.route');
const ptRouter = require('./src/routes/pt.route');
const ptChatRouter = require('./src/routes/pt-chat.route');
const memberChatRouter = require('./src/routes/member-chat.route');
const ptStatisticsRouter = require('./src/routes/pt-statistics.route');
const ptWorkScheduleRouter = require('./src/routes/pt-work-schedule.route');
const ptReviewsRouter = require('./src/routes/pt-reviews.route');
const ptWorkHistoryRouter = require('./src/routes/pt-work-history.route');
const ptProfileRouter = require('./src/routes/pt-profile.route');
const ptReportsRouter = require('./src/routes/pt-reports.route');
const ptTemplatesRouter = require('./src/routes/pt-templates.route');
const ptGoalsRouter = require('./src/routes/pt-goals.route');
const sessionReviewRouter = require('./src/routes/session-review.route');
const ptTemplatesController = require('./src/controllers/pt-templates.controller');

app.use('/api/auth', authRouter);
// app.use('/api/users', userRouter);
app.use('/api/user', userRouter);
app.use('/api/baitap', checkMongoConnection, baiTapRouter);
app.use('/api/lich-tap', lichTapRouter);
app.use('/api/lichtap', lichTapRouter);
app.use('/api/goitap', goiTapRouter);
app.use('/api/chitietgoitap', chiTietGoiTapRouter);
app.use('/api/buoitap', buoiTapRouter);
app.use('/api/lichsutap', lichSuTapRouter);
app.use('/api/dinhduong', dinhDuongRouter);
app.use('/api/thucdon', thucDonRouter);
app.use('/api/thanhtoan', thanhToanRouter);
app.use('/api/chisocothe', chiSoCoTheRouter);
app.use('/api/lichhenpt', lichHenPTRouter);
app.use('/api/hanghoivien', hangHoiVienRouter);
app.use('/api/chatbot', chatbotRouter);
app.use('/api/ml-training', mlTrainingRouter);
app.use('/api/workout-prediction', workoutPredictionRouter);
app.use('/api/package-workflow', packageWorkflowRouter);
app.use('/api/dang-ky-goi-tap', dangKyGoiTapRouter);
app.use('/api', reviewRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/sessions', sessionRouter);
app.use('/api/sessions/:sessionId/playlist', sessionPlaylistRouter);
// Template buổi tập: giữ cả hai prefix để tương thích
app.use('/api/session-templates', sessionTemplateRouter);
app.use('/api/session-template', sessionTemplateRouter); // alias để tránh 404 trên mobile
app.use('/api/exercises', exerciseRouter);
app.use('/api/chinhanh', chiNhanhRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/ai', aiRouter);
app.use('/api/face', faceRouter);
app.use('/api/checkin', checkinRouter);
app.use('/api/pt/checkin', ptCheckinRouter);
app.use('/api/watch-history', watchHistoryRouter);
app.use('/api/statistics', statisticsRouter);
app.use('/api/yearly-goals', yearlyGoalsRouter);
app.use('/api/nutrition', nutritionPlanRouter);
app.use('/api/pt', checkMongoConnection, ptRouter);
app.use('/api/pt/chat', ptChatRouter);
app.use('/api/member/chat', memberChatRouter);
app.use('/api/pt/statistics', ptStatisticsRouter);
app.use('/api/pt/work-schedule', ptWorkScheduleRouter);
app.use('/api/pt/reviews', ptReviewsRouter);
app.use('/api/pt/work-history', ptWorkHistoryRouter);
app.use('/api/pt/profile', ptProfileRouter);
app.use('/api/pt/reports', ptReportsRouter);
app.use('/api/pt/templates', ptTemplatesRouter);
// Public template list cho mobile/app
app.get('/api/pt-templates', ptTemplatesController.getTemplatesPublic);
app.use('/api/pt/goals', ptGoalsRouter);
app.use('/api/session-reviews', sessionReviewRouter);

// Initialize WebSocket
const websocketService = require('./src/services/websocket.service');
websocketService.initializeSocketIO(server);
console.log('WebSocket service initialized');

// Health check endpoint
app.get('/health', (req, res) => {
    const dbState = mongoose.connection.readyState;
    const states = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
    };

    res.json({
        status: dbState === 1 ? 'OK' : 'ERROR',
        database: states[dbState] || 'unknown',
        timestamp: new Date().toISOString()
    });
});

// Configure server timeout
server.timeout = 30000; // 30 seconds
server.keepAliveTimeout = 65000; // 65 seconds
server.headersTimeout = 66000; // 66 seconds

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`Nutrition API: http://localhost:${PORT}/api/nutrition/plan`);
    console.log(`CORS enabled for: ${allowedOrigins.join(', ')}`);
    console.log(`Server timeout: ${server.timeout}ms`);
    console.log(`Keep-alive timeout: ${server.keepAliveTimeout}ms`);
});