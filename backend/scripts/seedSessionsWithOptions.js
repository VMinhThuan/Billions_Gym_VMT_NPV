const mongoose = require('mongoose');
require('dotenv').config();

const ChiNhanh = require('../src/models/ChiNhanh');
const { PT } = require('../src/models/NguoiDung');
const CaSlot = require('../src/models/CaSlot');
const SessionOption = require('../src/models/SessionOption');
const TemplateBuoiTap = require('../src/models/TemplateBuoiTap');

// ⚙️ Helper random - đảm bảo chọn ngẫu nhiên buổi tập mà không trùng trong cùng ca
const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// ⚙️ Helper gán PT - đảm bảo phân đều PT cho 10 buổi/ca, thêm 1–2 người xen kẽ nếu >10 PT
const assignPTsToWorkouts = (ptList, numWorkouts) => {
  const assigned = [];
  let ptIndex = 0;
  const hasExtraPT = ptList.length > 10;

  for (let i = 0; i < numWorkouts; i++) {
    if (hasExtraPT && i % 3 === 0) {
      // Một số buổi có 2 PT (mỗi 3 buổi thì có 1 buổi 2 PT)
      assigned.push([
        ptList[ptIndex % ptList.length]._id,
        ptList[(ptIndex + 1) % ptList.length]._id,
      ]);
      ptIndex += 2;
    } else {
      // Buổi chỉ có 1 PT
      assigned.push([ptList[ptIndex % ptList.length]._id]);
      ptIndex++;
    }
  }
  return assigned;
};

// ⚙️ Tạo dữ liệu cho 1 tháng
const generateMonthlyWorkouts = async (month, year) => {
  try {
    console.log(`🚀 Bắt đầu tạo lịch buổi tập cho tháng ${month}/${year}`);
    
    // 1. Dữ liệu nguồn - Lấy 20 template buổi tập từ TemplateBuoiTap
    const templates = await TemplateBuoiTap.find().lean();
    if (!templates.length) {
      throw new Error('Không có template buổi tập trong DB');
    }
    console.log(`📚 Loaded ${templates.length} templates`);

    // Lấy 10 chi nhánh (mỗi chi nhánh đã có PTs và CaSlots — 8 ca/ngày)
    const chinhanhs = await ChiNhanh.find().lean();
    if (!chinhanhs.length) {
      throw new Error('Không có chi nhánh');
    }
    console.log(`🏢 Loaded ${chinhanhs.length} chi nhánh`);

    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    
    // Xóa dữ liệu cũ của tháng này (nếu có)
    const deleted = await SessionOption.deleteMany({ thangKey: monthKey });
    console.log(`🧹 Đã xóa ${deleted.deletedCount} buổi tập cũ của tháng ${monthKey}`);

    let totalSessions = 0;

    for (const cn of chinhanhs) {
      console.log(`🏋️ Đang xử lý chi nhánh: ${cn.tenChiNhanh || cn._id}`);
      
      // Lấy danh sách PT của chi nhánh này
      const ptList = await PT.find({ chinhanh: cn._id }).lean();
      if (!ptList.length) {
        console.log(`⚠️ Bỏ qua chi nhánh ${cn.tenChiNhanh} (không có PT)`);
        continue;
      }

      // Lấy 8 ca của chi nhánh này
      const caSlots = await CaSlot.find({ chiNhanh: cn._id }).lean();
      if (!caSlots.length) {
        console.log(`⚠️ Bỏ qua chi nhánh ${cn.tenChiNhanh} (không có ca làm việc)`);
        continue;
      }

      console.log(`  📊 Chi nhánh có ${ptList.length} PT và ${caSlots.length} ca`);

      // 30 ngày cho tháng (hoặc số ngày thực tế của tháng)
      const daysInMonth = new Date(year, month, 0).getDate();
      
      for (let day = 1; day <= daysInMonth; day++) {
        const ngayTap = new Date(year, month - 1, day);
        ngayTap.setHours(0, 0, 0, 0); // Normalize to start of day

        for (const ca of caSlots) {
          // 2. Phân bổ logic - Mỗi ca: 10 buổi tập (random từ 20 templates)
          // 3. Random hợp lý - shuffleArray() đảm bảo chọn ngẫu nhiên buổi tập mà không trùng trong cùng ca
          const randomTemplates = shuffleArray(templates).slice(0, 10);
          
          // assignPTsToWorkouts() đảm bảo phân đều PT cho 10 buổi/ca, thêm 1–2 người xen kẽ nếu >10 PT
          const ptAssignments = assignPTsToWorkouts(ptList, 10);

          const sessionsToCreate = randomTemplates.map((template, i) => {
            const ptIds = ptAssignments[i];
            return {
              caSlot: ca._id,
              chiNhanh: cn._id,
              ptPhuTrach: ptIds[0], // PT chính
              ptHoTro: ptIds.slice(1), // PT phụ (nếu có)
              ngay: ngayTap,
              gioBatDau: ca.gioBatDau,
              gioKetThuc: ca.gioKetThuc,
              templateRef: template._id,
              thangKey: monthKey,
              loai: template.loai || 'General',
              doKho: template.doKho || 'TRUNG_BINH',
              hinhAnh: template.hinhAnh || '',
              soLuongToiDa: 20,
              soLuongDaDangKy: 0,
              trangThai: 'HOAT_DONG'
            };
          });

          // Tạo 10 buổi tập cho ca này
          const createdSessions = await SessionOption.insertMany(sessionsToCreate);
          
          // Cập nhật CaSlot với danh sách session IDs
          await CaSlot.updateOne(
            { _id: ca._id },
            { $push: { sessionOptions: { $each: createdSessions.map(s => s._id) } } }
          );

          totalSessions += createdSessions.length;
        }
      }
      
      console.log(`  ✅ Hoàn thành chi nhánh ${cn.tenChiNhanh}: ${caSlots.length * daysInMonth * 10} buổi tập`);
    }

    // 5. Kết quả - Mỗi chi nhánh có 8 ca/ngày × 30 ngày × 10 buổi tập = 2400 buổi/tháng/chi nhánh
    // 10 chi nhánh → tổng cộng 24.000 buổi tập mỗi tháng
    console.log(`🎯 Hoàn tất tạo lịch buổi tập cho tháng ${month}/${year}!`);
    console.log(`📈 Tổng số buổi tập đã tạo: ${totalSessions}`);
    console.log(`📊 Dự kiến: ${chinhanhs.length} chi nhánh × 8 ca × ${new Date(year, month, 0).getDate()} ngày × 10 buổi = ${chinhanhs.length * 8 * new Date(year, month, 0).getDate() * 10} buổi`);

  } catch (err) {
    console.error('❌ Lỗi khi tạo lịch buổi tập:', err);
    throw err;
  }
};

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('🔌 DB connected');

  // Lấy tháng/năm từ environment hoặc dùng tháng hiện tại
  const now = new Date();
  const targetYear = parseInt(process.env.TARGET_YEAR || now.getFullYear(), 10);
  const targetMonth = parseInt(process.env.TARGET_MONTH || (now.getMonth() + 1), 10); // 1-12

  await generateMonthlyWorkouts(targetMonth, targetYear);
  
  console.log('✅ Hoàn thành tất cả!');
  await mongoose.disconnect();
}

run().catch(err => { 
  console.error('❌ Seed error', err); 
  process.exit(1); 
});
