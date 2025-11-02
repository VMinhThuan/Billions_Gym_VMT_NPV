require('dotenv').config();
const mongoose = require('mongoose');
const Template = require('../src/models/TemplateBuoiTap');
const { PT } = require('../src/models/NguoiDung');
const ChiNhanh = require('../src/models/ChiNhanh');
const Session = require('../src/models/Session');

const SLOTS = [
    ['06:00', '08:00'], ['08:00', '10:00'], ['10:00', '12:00'],
    ['13:00', '15:00'], ['15:00', '17:00'], ['17:00', '19:00'],
    ['19:00', '21:00'], ['21:00', '23:00']
];

function pick(arr, i) { return arr[i % arr.length]; }

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔌 Connected');
    const templates = await Template.find({});
    const branches = await ChiNhanh.find({});
    const pts = await PT.find({});
    if (!templates.length) throw new Error('Chưa có template');

    const today = new Date();
    for (let d = 0; d < 7; d++) {
        const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + d);
        for (const branch of branches) {
            const ptsOfBranch = pts.filter(p => String(p.chinhanh) === String(branch._id));
            if (!ptsOfBranch.length) continue;
            for (let i = 0; i < SLOTS.length; i++) {
                const tpl = pick(templates, i + d);
                const pt = pick(ptsOfBranch, i + d);
                await Session.create({
                    chiNhanh: branch._id,
                    ptPhuTrach: pt._id,
                    ngay: date,
                    gioBatDau: SLOTS[i][0],
                    gioKetThuc: SLOTS[i][1],
                    taiLieuBaiTap: tpl.baiTap || [],
                    hinhAnh: tpl.hinhAnh,
                    doKho: tpl.doKho,
                    soLuongToiDa: 20,
                });
            }
        }
    }
    console.log('✅ Seed weekly schedule done');
    await mongoose.disconnect();
}

run().catch(err => { console.error('❌ Error', err); process.exit(1); });


