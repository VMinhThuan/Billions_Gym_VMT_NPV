const mongoose = require('mongoose');

// Kết nối MongoDB
mongoose.connect('mongodb://localhost:27017/billions_gym', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const NguoiDungSchema = new mongoose.Schema({
    soCCCD: { type: String, unique: true },
    hoTen: { type: String, required: true },
    ngaySinh: { type: Date },
    diaChi: { type: String },
    gioiTinh: { type: String, required: true },
    anhDaiDien: { type: String },
    email: { type: String, unique: true, sparse: true },
    sdt: { type: String, unique: true, required: true },
}, { discriminatorKey: 'vaiTro', collection: 'nguoiDungs' });

const NguoiDung = mongoose.model('NguoiDung', NguoiDungSchema);

async function fixEmailDuplicates() {
    try {
        console.log('🔍 Đang kiểm tra các bản ghi có email null hoặc undefined...');

        // Tìm tất cả bản ghi có email null hoặc undefined
        const recordsWithNullEmail = await NguoiDung.find({
            $or: [
                { email: null },
                { email: undefined },
                { email: '' }
            ]
        });

        console.log(`📊 Tìm thấy ${recordsWithNullEmail.length} bản ghi có email null/undefined`);

        if (recordsWithNullEmail.length > 0) {
            console.log('🔧 Đang xóa email khỏi các bản ghi...');

            // Xóa email khỏi các bản ghi có email null/undefined
            const result = await NguoiDung.updateMany(
                {
                    $or: [
                        { email: null },
                        { email: undefined },
                        { email: '' }
                    ]
                },
                {
                    $unset: { email: 1 }
                }
            );

            console.log(`✅ Đã cập nhật ${result.modifiedCount} bản ghi`);
        }

        console.log('🎉 Hoàn thành việc sửa lỗi email duplicate!');

    } catch (error) {
        console.error('❌ Lỗi:', error);
    } finally {
        mongoose.connection.close();
    }
}

fixEmailDuplicates();
