const mongoose = require('mongoose');
require('dotenv').config();

const { PT } = require('../src/models/NguoiDung');
const ChiNhanh = require('../src/models/ChiNhanh');
const BuoiTap = require('../src/models/BuoiTap');
const Session = require('../src/models/Session');
const LichTap = require('../src/models/LichTap');

(async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('🔌 DB connected');

        // 1. Tìm PT theo tên + số điện thoại
        const pt = await PT.findOne({
            hoTen: 'Phạm Ngọc Anh',
            sdt: '0996693823',
        }).lean();

        if (!pt) {
            console.log('❌ Không tìm thấy PT Phạm Ngọc Anh 0996693823');
            process.exit(0);
        }

        console.log('✅ Tìm thấy PT:', pt._id.toString(), pt.hoTen);

        // Tháng 12/2025
        const start = new Date(2025, 11, 1); // 01/12/2025
        const end = new Date(2026, 0, 1); // 01/01/2026

        // 2. Buổi tập trong collection BuoiTap mà PT phụ trách
        const buoiTaps = await BuoiTap.find({
            ptPhuTrach: pt._id,
            ngayTap: { $gte: start, $lt: end },
        })
            .populate('chiNhanh', 'tenChiNhanh')
            .sort({ ngayTap: 1, gioBatDau: 1 })
            .lean();

        // 3. Session nếu bạn có dùng model Session
        const sessions = await Session.find({
            ptPhuTrach: pt._id,
            ngay: { $gte: start, $lt: end },
        })
            .populate('chiNhanh', 'tenChiNhanh')
            .sort({ ngay: 1, gioBatDau: 1 })
            .lean();

        // 4. Buổi trong LichTap (nếu dùng danhSachBuoiTap.ptPhuTrach)
        const lichTaps = await LichTap.find({
            'danhSachBuoiTap.ptPhuTrach': pt._id,
            'danhSachBuoiTap.ngayTap': { $gte: start, $lt: end },
        })
            .populate('chiNhanh', 'tenChiNhanh')
            .populate('hoiVien', 'hoTen')
            .lean();

        console.log('\n=== BUỔI TẬP TỪ BUOITAP ===');
        if (buoiTaps.length === 0) {
            console.log('  (không có)');
        } else {
            buoiTaps.forEach((b) => {
                console.log(
                    `- ${b.tenBuoiTap} | ${b.ngayTap.toISOString().slice(0, 10)} | ` +
                    `${b.gioBatDau}-${b.gioKetThuc} | CN: ${b.chiNhanh?.tenChiNhanh || 'N/A'}`
                );
            });
        }

        console.log('\n=== BUỔI TẬP TỪ SESSION ===');
        if (sessions.length === 0) {
            console.log('  (không có)');
        } else {
            sessions.forEach((s) => {
                console.log(
                    `- ${s.ngay.toISOString().slice(0, 10)} | ${s.gioBatDau}-${s.gioKetThuc} | CN: ${s.chiNhanh?.tenChiNhanh || 'N/A'
                    }`
                );
            });
        }

        console.log('\n=== BUỔI TẬP TỪ LICHTAP ===');
        let lichTapCount = 0;
        lichTaps.forEach((lt) => {
            (lt.danhSachBuoiTap || []).forEach((b) => {
                const d = new Date(b.ngayTap);
                if (d >= start && d < end && String(b.ptPhuTrach) === String(pt._id)) {
                    lichTapCount++;
                    console.log(
                        `- ${lt.hoiVien?.hoTen || 'Học viên'} | ${d.toISOString().slice(0, 10)} | ` +
                        `${b.gioBatDau}-${b.gioKetThuc} | CN: ${lt.chiNhanh?.tenChiNhanh || 'N/A'}`
                    );
                }
            });
        });
        if (lichTapCount === 0) {
            console.log('  (không có)');
        }

        await mongoose.disconnect();
        console.log('\n✅ Done');
    } catch (err) {
        console.error('❌ Lỗi khi kiểm tra lịch PT:', err);
        process.exit(1);
    }
})();


