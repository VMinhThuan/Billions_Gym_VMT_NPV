/**
 * Script để backfill các thanh toán đã thành công nhưng chưa có record trong ThanhToan
 * Chạy: node scripts/backfillThanhToan.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const ChiTietGoiTap = require('../src/models/ChiTietGoiTap');
const ThanhToan = require('../src/models/ThanhToan');
const GoiTap = require('../src/models/GoiTap');
const { NguoiDung } = require('../src/models/NguoiDung');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/billions_gym';

async function backfillThanhToan() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Tìm tất cả ChiTietGoiTap đã thanh toán thành công nhưng chưa có ThanhToan
        const registrations = await ChiTietGoiTap.find({
            trangThaiThanhToan: 'DA_THANH_TOAN'
        }).populate('goiTapId').populate('nguoiDungId');

        console.log(`📊 Found ${registrations.length} successful payments to check`);

        let created = 0;
        let updated = 0;
        let skipped = 0;
        let errors = 0;

        for (const registration of registrations) {
            try {
                // Kiểm tra xem đã có ThanhToan chưa
                const existingPayment = await ThanhToan.findOne({
                    maChiTietGoiTap: registration._id
                });

                if (existingPayment) {
                    // Nếu đã có nhưng status chưa đúng, update
                    if (existingPayment.trangThaiThanhToan !== 'THANH_CONG') {
                        existingPayment.trangThaiThanhToan = 'THANH_CONG';
                        existingPayment.ngayThanhToan = registration.thoiGianCapNhat || registration.thoiGianDangKy || new Date();
                        existingPayment.isLocked = true;
                        if (registration.thongTinThanhToan?.amount) {
                            existingPayment.soTien = registration.thongTinThanhToan.amount;
                        }
                        await existingPayment.save();
                        updated++;
                        console.log(`✅ Updated ThanhToan for registration ${registration._id}`);
                    } else {
                        skipped++;
                    }
                    continue;
                }

                // Tìm hoiVien từ nguoiDungId
                let hoiVienId = registration.maHoiVien || registration.nguoiDungId;
                if (!registration.maHoiVien && registration.nguoiDungId) {
                    try {
                        const user = await NguoiDung.findById(registration.nguoiDungId).select('_id');
                        hoiVienId = user?._id || registration.nguoiDungId;
                    } catch (userError) {
                        console.warn(`⚠️ Could not find user ${registration.nguoiDungId}, using as hoiVienId`);
                        hoiVienId = registration.nguoiDungId;
                    }
                }

                if (!hoiVienId) {
                    console.warn(`⚠️ Skipping registration ${registration._id}: no hoiVien found`);
                    skipped++;
                    continue;
                }

                // Tạo ThanhToan mới
                const amount = registration.thongTinThanhToan?.amount || registration.soTienThanhToan || 0;
                const newPayment = new ThanhToan({
                    hoiVien: hoiVienId,
                    maChiTietGoiTap: registration._id,
                    soTien: amount,
                    ngayThanhToan: registration.thoiGianCapNhat || registration.thoiGianDangKy || new Date(),
                    phuongThuc: 'CHUYEN_KHOAN',
                    noiDung: `Thanh toán gói tập: ${registration.goiTapId?.tenGoiTap || 'N/A'}`,
                    trangThaiThanhToan: 'THANH_CONG',
                    isLocked: true
                });

                await newPayment.save();
                created++;
                console.log(`✅ Created ThanhToan for registration ${registration._id}, amount: ${amount}, hoiVien: ${hoiVienId}`);

            } catch (error) {
                errors++;
                console.error(`❌ Error processing registration ${registration._id}:`, error.message);
            }
        }

        console.log('\n📈 Summary:');
        console.log(`   Created: ${created}`);
        console.log(`   Updated: ${updated}`);
        console.log(`   Skipped: ${skipped}`);
        console.log(`   Errors: ${errors}`);

    } catch (error) {
        console.error('❌ Fatal error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

backfillThanhToan();

