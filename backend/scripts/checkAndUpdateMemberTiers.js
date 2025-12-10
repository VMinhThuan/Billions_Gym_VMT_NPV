/**
 * Script kiểm tra và cập nhật hạng hội viên dựa trên tổng tiền đã thanh toán
 * 
 * Usage:
 * node scripts/checkAndUpdateMemberTiers.js [hoiVienId]
 * 
 * Nếu không có hoiVienId, sẽ cập nhật tất cả hội viên
 */

const mongoose = require('mongoose');
require('dotenv').config();

const HangHoiVien = require('../src/models/HangHoiVien');
const { HoiVien } = require('../src/models/NguoiDung');
const ChiTietGoiTap = require('../src/models/ChiTietGoiTap');
const hangHoiVienService = require('../src/services/hanghoivien.service');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/billions_gym';

async function checkAndUpdateMemberTiers(hoiVienId = null) {
    try {
        // Kết nối MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Đã kết nối MongoDB');

        // Lấy tất cả hạng hội viên
        const allHangs = await HangHoiVien.find({ kichHoat: true }).sort({ thuTu: 1 });
        console.log('\n📊 DANH SÁCH HẠNG HỘI VIÊN:');
        console.log('='.repeat(80));
        allHangs.forEach((hang, index) => {
            console.log(`${index + 1}. ${hang.tenHienThi} (${hang.tenHang})`);
            console.log(`   Điều kiện: Tổng tiền tích lũy >= ${hang.dieuKienDatHang.soTienTichLuy.toLocaleString('vi-VN')} VNĐ`);
            console.log(`   Màu sắc: ${hang.mauSac}`);
            console.log(`   Thứ tự: ${hang.thuTu}`);
            console.log('');
        });

        if (hoiVienId) {
            // Kiểm tra và cập nhật hạng cho một hội viên cụ thể
            console.log(`\n🔍 Kiểm tra hạng hội viên cho ID: ${hoiVienId}`);
            console.log('='.repeat(80));

            const hoiVien = await HoiVien.findById(hoiVienId);
            if (!hoiVien) {
                console.error(`❌ Không tìm thấy hội viên với ID: ${hoiVienId}`);
                process.exit(1);
            }

            // Tính tổng tiền đã thanh toán
            const hoiVienObjectId = mongoose.Types.ObjectId.isValid(hoiVienId)
                ? new mongoose.Types.ObjectId(hoiVienId)
                : hoiVienId;

            const tongTienDaChi = await ChiTietGoiTap.aggregate([
                {
                    $match: {
                        $or: [
                            { nguoiDungId: hoiVienObjectId },
                            { maHoiVien: hoiVienObjectId }
                        ],
                        trangThaiThanhToan: 'DA_THANH_TOAN'
                    }
                },
                {
                    $group: {
                        _id: null,
                        tongTien: {
                            $sum: {
                                $ifNull: ['$soTienThanhToan', 0]
                            }
                        }
                    }
                }
            ]);

            const soTienTichLuy = tongTienDaChi.length > 0 ? tongTienDaChi[0].tongTien : 0;

            console.log(`\n📋 Thông tin hội viên:`);
            console.log(`   Tên: ${hoiVien.hoTen}`);
            console.log(`   Email: ${hoiVien.email || 'N/A'}`);
            console.log(`   SĐT: ${hoiVien.sdt || 'N/A'}`);
            console.log(`   Tổng tiền đã thanh toán: ${soTienTichLuy.toLocaleString('vi-VN')} VNĐ`);

            const currentHang = await HangHoiVien.findById(hoiVien.hangHoiVien);
            console.log(`   Hạng hiện tại: ${currentHang ? currentHang.tenHienThi : 'Chưa có hạng'}`);

            // Tìm hạng phù hợp
            let recommendedHang = null;
            for (const hang of allHangs) {
                const soTienYeuCau = hang.dieuKienDatHang.soTienTichLuy || 0;
                if (soTienTichLuy >= soTienYeuCau) {
                    recommendedHang = hang;
                }
            }

            if (recommendedHang) {
                console.log(`   Hạng nên có: ${recommendedHang.tenHienThi} (${recommendedHang.tenHang})`);
                console.log(`   Điều kiện: >= ${recommendedHang.dieuKienDatHang.soTienTichLuy.toLocaleString('vi-VN')} VNĐ`);

                if (!currentHang || currentHang._id.toString() !== recommendedHang._id.toString()) {
                    console.log(`\n🔄 Cập nhật hạng hội viên...`);
                    const updatedHoiVien = await hangHoiVienService.tinhHangHoiVien(hoiVienId);
                    const newHang = await HangHoiVien.findById(updatedHoiVien.hangHoiVien);
                    console.log(`✅ Đã cập nhật hạng thành: ${newHang ? newHang.tenHienThi : 'N/A'}`);
                } else {
                    console.log(`\n✅ Hạng hội viên đã đúng, không cần cập nhật.`);
                }
            } else {
                console.log(`\n⚠️ Không tìm thấy hạng phù hợp với tổng tiền ${soTienTichLuy.toLocaleString('vi-VN')} VNĐ`);
            }
        } else {
            // Cập nhật hạng cho tất cả hội viên
            console.log(`\n🔄 Cập nhật hạng cho tất cả hội viên...`);
            console.log('='.repeat(80));

            const allHoiViens = await HoiVien.find();
            console.log(`Tổng số hội viên: ${allHoiViens.length}`);

            let updatedCount = 0;
            let errorCount = 0;

            for (const hoiVien of allHoiViens) {
                try {
                    const beforeHang = await HangHoiVien.findById(hoiVien.hangHoiVien);
                    const updatedHoiVien = await hangHoiVienService.tinhHangHoiVien(hoiVien._id);
                    const afterHang = await HangHoiVien.findById(updatedHoiVien.hangHoiVien);

                    if (!beforeHang || beforeHang._id.toString() !== afterHang._id.toString()) {
                        updatedCount++;
                        console.log(`✅ ${hoiVien.hoTen}: ${beforeHang ? beforeHang.tenHienThi : 'Chưa có'} → ${afterHang.tenHienThi} (${updatedHoiVien.soTienTichLuy.toLocaleString('vi-VN')} VNĐ)`);
                    }
                } catch (error) {
                    errorCount++;
                    console.error(`❌ Lỗi cập nhật hạng cho ${hoiVien.hoTen}:`, error.message);
                }
            }

            console.log(`\n📊 Kết quả:`);
            console.log(`   Đã cập nhật: ${updatedCount} hội viên`);
            console.log(`   Lỗi: ${errorCount} hội viên`);
        }

        console.log('\n✅ Hoàn tất!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Đã ngắt kết nối MongoDB');
    }
}

// Lấy tham số từ command line
const hoiVienId = process.argv[2] || null;

checkAndUpdateMemberTiers(hoiVienId);

