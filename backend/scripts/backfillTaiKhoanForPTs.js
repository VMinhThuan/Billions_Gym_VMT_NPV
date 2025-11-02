/*
  Backfill TaiKhoan for PTs:
  - Với mỗi PT, kiểm tra có tài khoản (taiKhoans) liên kết bằng nguoiDung hay chưa
  - Nếu chưa có, tạo tài khoản mới với mật khẩu mặc định '123456'
  - Nếu số điện thoại của PT đã trùng với 1 tài khoản khác, tự động sinh sđt mới (09xxxxxxxx) không trùng
  - Đồng bộ lại sđt ở cả PT và TaiKhoan
*/

require('dotenv').config();
const mongoose = require('mongoose');
const TaiKhoan = require('../src/models/TaiKhoan');
const { PT } = require('../src/models/NguoiDung');
const { hashPassword } = require('../src/utils/hashPassword');

function randomPhone() {
    return '09' + Math.floor(10000000 + Math.random() * 90000000);
}

async function ensureUniquePhone(currentSdt) {
    let sdt = currentSdt && /^\d{10,11}$/.test(currentSdt) ? currentSdt : randomPhone();
    let existed = await TaiKhoan.findOne({ sdt });
    while (existed) {
        sdt = randomPhone();
        existed = await TaiKhoan.findOne({ sdt });
    }
    return sdt;
}

async function main() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✔️ Connected');

    const pts = await PT.find();
    const hashed = await hashPassword('123456');
    let created = 0, fixed = 0;

    for (const pt of pts) {
        let tk = await TaiKhoan.findOne({ nguoiDung: pt._id });
        if (!tk) {
            // Nếu sdt PT đang bị chiếm bởi tài khoản khác, đổi sdt mới
            let sdt = await ensureUniquePhone(pt.sdt);
            if (sdt !== pt.sdt) {
                pt.sdt = sdt;
                await pt.save();
                fixed++;
            }
            await TaiKhoan.create({ sdt, matKhau: hashed, nguoiDung: pt._id, trangThaiTK: 'DANG_HOAT_DONG' });
            created++;
            continue;
        }
        // Nếu tk tồn tại nhưng sdt tk khác sdt pt, ưu tiên sdt tk; hoặc đồng bộ theo tk
        if (tk.sdt !== pt.sdt) {
            pt.sdt = tk.sdt;
            await pt.save();
            fixed++;
        }
    }

    console.log(`✨ Done. Created ${created} accounts, fixed ${fixed} phones.`);
    await mongoose.disconnect();
}

main().catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});


