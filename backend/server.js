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

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('Đã kết nối MongoDB');
    })
    .catch(err => {
        console.error('Lỗi kết nối MongoDB:', err);
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
const chiNhanhRouter = require('./src/routes/chinhanh.route');
const notificationRouter = require('./src/routes/notification.route');

app.use('/api/auth', authRouter);
// app.use('/api/users', userRouter);
app.use('/api/user', userRouter);
app.use('/api/baitap', baiTapRouter);
app.use('/api/lichtap', lichTapRouter);
app.use('/api/goitap', goiTapRouter);
app.use('/api/chitietgoitap', chiTietGoiTapRouter);
app.use('/api/buoitap', buoiTapRouter);
app.use('/api/lichsutap', lichSuTapRouter);
app.use('/api/dinhduong', dinhDuongRouter);
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
app.use('/api/chinhanh', chiNhanhRouter);
app.use('/api/notifications', notificationRouter);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});