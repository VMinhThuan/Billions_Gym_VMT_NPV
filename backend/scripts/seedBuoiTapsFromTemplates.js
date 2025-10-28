const mongoose = require('mongoose');
require('dotenv').config();
const ChiNhanh = require('../src/models/ChiNhanh');
const { PT } = require('../src/models/NguoiDung');
const CaSlot = require('../src/models/CaSlot');
const BuoiTap = require('../src/models/BuoiTap');
const TemplateBuoiTap = require('../src/models/TemplateBuoiTap');

// 8 ca cố định trong ngày (giờ mở cửa: 06:00 - 23:00, nghỉ 12:00-13:00)
const CA_SLOTS = [
    { start: '06:00', end: '08:00' },
    { start: '08:00', end: '10:00' },
    { start: '10:00', end: '12:00' },
    { start: '13:00', end: '15:00' },
    { start: '15:00', end: '17:00' },
    { start: '17:00', end: '19:00' },
    { start: '19:00', end: '21:00' },
    { start: '21:00', end: '23:00' },
];

// ⚙️ Helper random
const shuffleArray = (array) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

// ⚙️ Helper gán PT
const assignPTsToWorkouts = (ptList, numWorkouts) => {
    const assigned = [];
    let ptIndex = 0;
    const hasExtraPT = ptList.length > 10;

    for (let i = 0; i < numWorkouts; i++) {
        if (hasExtraPT && i % 3 === 0) {
            // Một số buổi có 2 PT
            assigned.push([
                ptList[ptIndex % ptList.length]._id,
                ptList[(ptIndex + 1) % ptList.length]._id,
            ]);
            ptIndex += 2;
        } else {
            assigned.push([ptList[ptIndex % ptList.length]._id]);
            ptIndex++;
        }
    }
    return assigned;
};

// ⚙️ Tạo CaSlots cho chi nhánh nếu chưa có
const ensureCaSlotsExist = async (chiNhanh, targetMonth, targetYear) => {
    const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
        const ngayTap = new Date(targetYear, targetMonth - 1, day);
        
        // Kiểm tra xem ngày này đã có CaSlots chưa
        const existingSlots = await CaSlot.find({ 
            chiNhanh: chiNhanh._id, 
            ngay: {
                $gte: new Date(ngayTap.getFullYear(), ngayTap.getMonth(), ngayTap.getDate()),
                $lt: new Date(ngayTap.getFullYear(), ngayTap.getMonth(), ngayTap.getDate() + 1)
            }
        });
        
        if (existingSlots.length < 8) {
            // Tạo thiếu CaSlots cho ngày này
            for (const slot of CA_SLOTS) {
                const existingSlot = existingSlots.find(s => s.gioBatDau === slot.start && s.gioKetThuc === slot.end);
                if (!existingSlot) {
                    await CaSlot.create({
                        chiNhanh: chiNhanh._id,
                        ngay: ngayTap,
                        gioBatDau: slot.start,
                        gioKetThuc: slot.end,
                        sessionOptions: []
                    });
                }
            }
        }
    }
};

// ⚙️ Tạo dữ liệu cho 1 tháng
const generateMonthlyWorkouts = async (month, year) => {
    try {
        console.log(`🚀 Bắt đầu tạo lịch tập cho tháng ${month}/${year}`);
        
        const templates = await TemplateBuoiTap.find();
        if (!templates.length) {
            throw new Error('Không có template buổi tập trong DB');
        }
        console.log(`📚 Loaded ${templates.length} templates`);
        
        // Log template names để debug
        console.log('📋 Templates available:');
        templates.forEach((t, i) => console.log(`   ${i+1}. ${t.ten} (${t.loai}) - ${t.doKho}`));

        const chinhanhs = await ChiNhanh.find();
        if (!chinhanhs.length) {
            throw new Error('Không có chi nhánh');
        }
        console.log(`🏢 Loaded ${chinhanhs.length} chi nhánh`);

        // Xóa dữ liệu cũ của tháng (nếu có)
        const deleteResult = await BuoiTap.deleteMany({ 
            $expr: {
                $and: [
                    { $eq: [{ $month: "$ngayTap" }, month] },
                    { $eq: [{ $year: "$ngayTap" }, year] }
                ]
            }
        });
        console.log(`🧹 Đã xóa ${deleteResult.deletedCount} buổi tập cũ của tháng ${month}/${year}`);

        for (const cn of chinhanhs) {
            console.log(`🏋️ Đang xử lý chi nhánh: ${cn.tenChiNhanh}`);
            
            const ptList = await PT.find({ chinhanh: cn._id });
            if (!ptList.length) {
                console.log(`⚠️ Bỏ qua ${cn.tenChiNhanh} (không có PT)`);
                continue;
            }

            // Đảm bảo chi nhánh có đủ CaSlots
            await ensureCaSlotsExist(cn, month, year);

            // Lấy CaSlots của chi nhánh này sau khi đã tạo đủ
            const caSlots = await CaSlot.find({ chiNhanh: cn._id }).sort({ gioBatDau: 1 });
            console.log(`   📊 ${ptList.length} PTs, ${caSlots.length} ca làm việc`);

            // Tính số ngày trong tháng
            const daysInMonth = new Date(year, month, 0).getDate();

            for (let day = 1; day <= daysInMonth; day++) {
                const ngayTap = new Date(year, month - 1, day);
                
                // Lấy CaSlots cho ngày cụ thể
                const dailyCaSlots = await CaSlot.find({ 
                    chiNhanh: cn._id,
                    ngay: {
                        $gte: new Date(ngayTap.getFullYear(), ngayTap.getMonth(), ngayTap.getDate()),
                        $lt: new Date(ngayTap.getFullYear(), ngayTap.getMonth(), ngayTap.getDate() + 1)
                    }
                }).sort({ gioBatDau: 1 });

                if (!dailyCaSlots.length) continue;

                // Shuffle templates cho ngày này
                const dailyShuffledTemplates = shuffleArray(templates);

                for (let caIndex = 0; caIndex < dailyCaSlots.length; caIndex++) {
                    const ca = dailyCaSlots[caIndex];
                    
                    // Chọn 10 templates KHÁC NHAU cho ca này
                    // Sử dụng offset để đảm bảo mỗi ca có set templates khác nhau
                    const selectedTemplates = [];
                    const usedTemplateIds = new Set();
                    
                    let templateIndex = (caIndex * 2) % dailyShuffledTemplates.length;
                    
                    while (selectedTemplates.length < 10 && selectedTemplates.length < templates.length) {
                        const template = dailyShuffledTemplates[templateIndex % dailyShuffledTemplates.length];
                        
                        if (!usedTemplateIds.has(template._id.toString())) {
                            selectedTemplates.push(template);
                            usedTemplateIds.add(template._id.toString());
                        }
                        
                        templateIndex++;
                        
                        // Tránh vòng lặp vô hạn
                        if (templateIndex > dailyShuffledTemplates.length * 2) break;
                    }
                    
                    // Nếu không đủ 10 templates unique, lấy thêm từ đầu
                    while (selectedTemplates.length < 10) {
                        const remainingTemplates = dailyShuffledTemplates.filter(t => 
                            !usedTemplateIds.has(t._id.toString())
                        );
                        
                        if (remainingTemplates.length === 0) {
                            // Nếu hết templates unique, reset và lấy lại
                            usedTemplateIds.clear();
                            selectedTemplates.push(dailyShuffledTemplates[selectedTemplates.length % dailyShuffledTemplates.length]);
                        } else {
                            const template = remainingTemplates[0];
                            selectedTemplates.push(template);
                            usedTemplateIds.add(template._id.toString());
                        }
                    }
                    
                    const ptAssignments = assignPTsToWorkouts(ptList, selectedTemplates.length);

                    const buoiTaps = selectedTemplates.map((tpl, i) => ({
                        tenBuoiTap: tpl.ten, // Sử dụng tên từ template
                        chiNhanh: cn._id,
                        ptPhuTrach: ptAssignments[i][0], // PT chính
                        ngayTap,
                        gioBatDau: ca.gioBatDau,
                        gioKetThuc: ca.gioKetThuc,
                        soLuongToiDa: 20,
                        soLuongHienTai: 0,
                        trangThai: 'CHUAN_BI',
                        moTa: `${tpl.ten} - ${tpl.loai} (${tpl.doKho})`,
                        ghiChu: `Template: ${tpl.ten}`
                    }));

                    await BuoiTap.insertMany(buoiTaps);
                    
                    // Log để debug
                    if (day === 1 && caIndex === 0) {
                        console.log(`   🔍 Ca đầu tiên có các buổi tập:`);
                        selectedTemplates.forEach((t, i) => console.log(`      ${i+1}. ${t.ten} (${t.loai})`));
                    }
                }
            }
            
            console.log(`✅ Hoàn tất chi nhánh ${cn.tenChiNhanh}: ${daysInMonth * 8 * 10} buổi tập`);
        }

        const totalSessions = await BuoiTap.countDocuments({
            $expr: {
                $and: [
                    { $eq: [{ $month: "$ngayTap" }, month] },
                    { $eq: [{ $year: "$ngayTap" }, year] }
                ]
            }
        });

        console.log(`🎯 Hoàn tất tạo lịch tập cho tháng ${month}/${year}!`);
        console.log(`📈 Tổng cộng: ${totalSessions} buổi tập đã được tạo`);
        
    } catch (err) {
        console.error('❌ Lỗi khi tạo lịch tập:', err);
        throw err;
    }
};

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔌 DB connected');

    // Lấy tháng/năm từ env hoặc dùng tháng hiện tại
    const now = new Date();
    const targetMonth = parseInt(process.env.TARGET_MONTH || now.getMonth() + 1, 10);
    const targetYear = parseInt(process.env.TARGET_YEAR || now.getFullYear(), 10);

    await generateMonthlyWorkouts(targetMonth, targetYear);
    await mongoose.disconnect();
}

run().catch(err => { 
    console.error('❌ Seed error', err); 
    process.exit(1); 
});
