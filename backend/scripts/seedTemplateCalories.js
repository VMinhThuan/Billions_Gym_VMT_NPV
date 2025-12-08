/* Seed calories for templateBuoiTaps */
const path = require('path');
const mongoose = require('mongoose');
const TemplateBuoiTap = require('../src/models/TemplateBuoiTap');
// Load env (backend/.env)
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const templates = [
    { ten: 'Boxing Cardio', caloTieuHao: 550, moTa: 'Cardio cường độ cao với boxing & footwork.' },
    { ten: 'Advanced Full Body', caloTieuHao: 600, moTa: 'Full body nâng cao, tạ + plyo.' },
    { ten: 'Core Focus', caloTieuHao: 400, moTa: 'Core & stability, plank/anti-rotation.' },
    { ten: 'Shoulders and Abs', caloTieuHao: 420, moTa: 'Vai + core, presses & raises.' },
    { ten: 'Chest and Triceps', caloTieuHao: 480, moTa: 'Ngực + tay sau, đẩy và isolation.' },
    { ten: 'Back and Biceps', caloTieuHao: 470, moTa: 'Lưng + tay trước, kéo & hinge.' },
    { ten: 'Leg Day Intense', caloTieuHao: 650, moTa: 'Chân nặng, squat/hinge/lunge.' },
    { ten: 'Full Body Beginner', caloTieuHao: 380, moTa: 'Full body cơ bản, bài máy + tạ nhẹ.' },
    { ten: 'Pull Day', caloTieuHao: 450, moTa: 'Ngày kéo: lưng, tay trước.' },
    { ten: 'Push Day', caloTieuHao: 450, moTa: 'Ngày đẩy: ngực, vai, tay sau.' },
    { ten: 'Barbell Power', caloTieuHao: 520, moTa: 'Compound với barbell, sức mạnh.' },
    { ten: 'Dumbbell Strength', caloTieuHao: 480, moTa: 'Tạ đơn, sức mạnh & kiểm soát.' },
    { ten: 'Bodyweight Circuit', caloTieuHao: 430, moTa: 'Circuit bodyweight, tim mạch + core.' },
    { ten: 'Plyometrics Explosive', caloTieuHao: 600, moTa: 'Nhảy plyo, phát lực, tim mạch cao.' },
    { ten: 'Yoga Flow', caloTieuHao: 320, moTa: 'Yoga flow, linh hoạt & thở.' },
    { ten: 'Flexibility Mobility', caloTieuHao: 280, moTa: 'Giãn cơ, mobility, phục hồi.' },
    { ten: 'Endurance Cardio', caloTieuHao: 520, moTa: 'Cardio dài, steady-state/interval.' },
    { ten: 'Upper Body Strength', caloTieuHao: 480, moTa: 'Thân trên, compound + isolation.' },
    { ten: 'Lower Body Power', caloTieuHao: 550, moTa: 'Thân dưới, power & hypertrophy.' },
    { ten: 'Cardio HIIT', caloTieuHao: 580, moTa: 'HIIT cardio ngắn, cường độ cao.' },
];

async function run() {
    try {
        const uri = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DB_URI;
        if (!uri) throw new Error('Missing MONGO_URI / MONGODB_URI / DB_URI in env');

        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        for (const t of templates) {
            const res = await TemplateBuoiTap.findOneAndUpdate(
                { ten: t.ten },
                { $set: { caloTieuHao: t.caloTieuHao, moTa: t.moTa } },
                { new: true, upsert: true }
            );
            console.log(`Upserted template: ${t.ten} -> ${res.caloTieuHao} kcal`);
        }

        console.log('Seeding completed');
    } catch (err) {
        console.error('Seed error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

run();

