const mongoose = require('mongoose');
const FaceEncoding = require('../src/models/FaceEncoding');
const { HoiVien } = require('../src/models/NguoiDung');
require('dotenv').config();

// Connect to MongoDB (removed deprecated options)
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/billions-gym').then(() => {
    console.log('Connected to MongoDB');
    checkFaceEncodings();
}).catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

async function checkFaceEncodings() {
    try {
        console.log('\n=== KIỂM TRA DỮ LIỆU FACE ENCODINGS ===\n');

        const faceEncodings = await FaceEncoding.find({ isActive: true }).populate('hoiVien', 'tenDangNhap hoTen email');

        console.log(`Tổng số face encodings: ${faceEncodings.length}\n`);

        if (faceEncodings.length === 0) {
            console.log('⚠️  KHÔNG CÓ DỮ LIỆU FACE ENCODING NÀO TRONG DATABASE!');
            console.log('   Điều này có nghĩa là chưa có ai đăng ký gương mặt.\n');
            process.exit(0);
        }

        for (const encoding of faceEncodings) {
            console.log(`\n--- Hội viên: ${encoding.hoiVien?.hoTen || encoding.hoiVien?.tenDangNhap || 'N/A'} ---`);
            console.log(`   ID: ${encoding.hoiVien?._id || 'N/A'}`);
            console.log(`   Face Encoding ID: ${encoding._id}`);
            console.log(`   Số lượng encodings: ${encoding.encodings?.length || 0}`);
            console.log(`   Average encoding: ${encoding.averageEncoding ? 'Có (' + encoding.averageEncoding.length + ' giá trị)' : 'KHÔNG CÓ ❌'}`);
            console.log(`   Created: ${encoding.createdAt}`);
            console.log(`   Updated: ${encoding.updatedAt}`);

            // Kiểm tra chi tiết
            if (!encoding.encodings || encoding.encodings.length !== 3) {
                console.log(`   ⚠️  CẢNH BÁO: Không đủ 3 encodings!`);
            }

            if (encoding.encodings) {
                encoding.encodings.forEach((enc, idx) => {
                    if (!Array.isArray(enc) || enc.length !== 128) {
                        console.log(`   ⚠️  CẢNH BÁO: Encoding ${idx + 1} không hợp lệ (length: ${enc?.length || 0})`);
                    }
                });
            }

            if (!encoding.averageEncoding || encoding.averageEncoding.length !== 128) {
                console.log(`   ❌ LỖI: Average encoding không hợp lệ!`);
            } else {
                // Validate average encoding values
                const hasInvalidValues = encoding.averageEncoding.some(val =>
                    typeof val !== 'number' || isNaN(val) || !isFinite(val)
                );
                if (hasInvalidValues) {
                    console.log(`   ❌ LỖI: Average encoding chứa giá trị không hợp lệ (NaN, Infinity, etc.)`);
                }
            }

            // Validate stored encodings values
            if (encoding.encodings) {
                encoding.encodings.forEach((enc, idx) => {
                    if (Array.isArray(enc)) {
                        const hasInvalidValues = enc.some(val =>
                            typeof val !== 'number' || isNaN(val) || !isFinite(val)
                        );
                        if (hasInvalidValues) {
                            console.log(`   ❌ LỖI: Encoding ${idx + 1} chứa giá trị không hợp lệ (NaN, Infinity, etc.)`);
                        }

                        // Check if encoding is all zeros (invalid)
                        const isAllZeros = enc.every(val => val === 0);
                        if (isAllZeros) {
                            console.log(`   ❌ LỖI: Encoding ${idx + 1} là mảng toàn số 0 (không hợp lệ)!`);
                        }
                    }
                });
            }
        }

        console.log('\n=== KẾT THÚC KIỂM TRA ===\n');
        console.log('📝 Lưu ý: Nếu có lỗi, vui lòng đăng ký lại gương mặt.');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

