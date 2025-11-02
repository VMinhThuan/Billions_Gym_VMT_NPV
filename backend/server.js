const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 4000;

console.log('urrl', process.env.FRONTEND_URL);

app.use(cors({
    origin: [
        process.env.FRONTEND_URL,
        process.env.FRONTEND_URL_CLIENT,
    ],
    credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds instead of 10
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    connectTimeoutMS: 10000, // Try initial connection for 10 seconds
    retryWrites: true,
    retryReads: true,
    maxPoolSize: 10, // Maintain up to 10 socket connections
    minPoolSize: 5, // Maintain at least 5 socket connections
    maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
    family: 4 // Use IPv4, skip trying IPv6
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
    })
    .catch(err => {
        console.error('Lỗi kết nối MongoDB:', err.message);
        console.error('Chi tiết lỗi:', err);
        process.exit(1);
    });

// Event handlers for MongoDB connection
mongoose.connection.on('connected', () => {
    console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.warn('Mongoose disconnected from MongoDB');
});

mongoose.connection.on('reconnected', () => {
    console.log('Mongoose reconnected to MongoDB');
});

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

app.use('/api/auth', authRouter);
// app.use('/api/users', userRouter);
app.use('/api/user', userRouter);
app.use('/api/baitap', baiTapRouter);
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
app.use('/api/session-templates', sessionTemplateRouter);
app.use('/api/exercises', exerciseRouter);
app.use('/api/chinhanh', chiNhanhRouter);
app.use('/api/notifications', notificationRouter);

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

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});