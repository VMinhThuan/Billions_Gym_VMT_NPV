const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 4000;

console.log('urrl', process.env.FRONTEND_URL);

app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
}));
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
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

app.use('/api/auth', authRouter);
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

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Test endpoint: http://localhost:${PORT}/api/test`);
});