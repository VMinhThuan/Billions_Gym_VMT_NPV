const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
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

app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/baitap', baiTapRouter);
app.use('/api/lichtap', lichTapRouter);
app.use('/api/goitap', goiTapRouter);
app.use('/api/chitietgoitap', chiTietGoiTapRouter);
app.use('/api/buoitap', buoiTapRouter);
app.use('/api/lichsutap', lichSuTapRouter);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});