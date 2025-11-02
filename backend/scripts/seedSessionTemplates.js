require('dotenv').config();
const mongoose = require('mongoose');
const Template = require('../src/models/TemplateBuoiTap');

const T = (ten, doKho, hinhAnh, loai, moTa = '') => ({ ten, doKho, hinhAnh, loai, moTa, baiTap: [] });

const templates = [
    T('Full Body Beginner', 'DE', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=600&fit=crop', 'FullBody'),
    T('Upper Body Strength', 'TRUNG_BINH', 'https://images.unsplash.com/photo-1551836022-deb498b8ce96?w=400&h=600&fit=crop', 'Upper'),
    T('Lower Body Power', 'TRUNG_BINH', 'https://images.unsplash.com/photo-1552674604-bfbb4b3a4e23?w=400&h=600&fit=crop', 'Lower'),
    T('Cardio HIIT', 'KHO', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop', 'Cardio'),
    T('Core Focus', 'DE', 'https://images.unsplash.com/photo-1594381898412-9c1f03b9b7b6?w=400&h=600&fit=crop', 'Core'),
    T('Push Day', 'TRUNG_BINH', 'https://images.unsplash.com/photo-1607345368928-199ea74c8d03?w=400&h=600&fit=crop', 'Push'),
    T('Pull Day', 'TRUNG_BINH', 'https://images.unsplash.com/photo-1611258026544-9960e8a93be0?w=400&h=600&fit=crop', 'Pull'),
    T('Leg Day Intense', 'KHO', 'https://images.unsplash.com/photo-1597190123245-5e7d2a3a2f9e?w=400&h=600&fit=crop', 'Legs'),
    T('Yoga Flow', 'DE', 'https://images.unsplash.com/photo-1608248597869-7f38fd0fa8e7?w=400&h=600&fit=crop', 'Yoga'),
    T('Boxing Cardio', 'TRUNG_BINH', 'https://images.unsplash.com/photo-1574680178050-b95e0fc3f3d7?w=400&h=600&fit=crop', 'Boxing'),
    T('Advanced Full Body', 'KHO', 'https://images.unsplash.com/photo-1519710164239-da54291b26ef?w=400&h=600&fit=crop', 'FullBody'),
    T('Back and Biceps', 'TRUNG_BINH', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=600&fit=crop', 'BackBiceps'),
    T('Chest and Triceps', 'TRUNG_BINH', 'https://images.unsplash.com/photo-1518611016407-adee195df3e1?w=400&h=600&fit=crop', 'ChestTriceps'),
    T('Shoulders and Abs', 'DE', 'https://images.unsplash.com/photo-1579260663785-6d7d8e7a5c92?w=400&h=600&fit=crop', 'ShoulderAbs'),
    T('Endurance Cardio', 'TRUNG_BINH', 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=600&fit=crop', 'Cardio'),
    T('Plyometrics Explosive', 'KHO', 'https://images.unsplash.com/photo-1535224206242-487f7090b5bb?w=400&h=600&fit=crop', 'Plyo'),
    T('Bodyweight Circuit', 'DE', 'https://images.unsplash.com/photo-1518894639645-6b961e696a41?w=400&h=600&fit=crop', 'Bodyweight'),
    T('Dumbbell Strength', 'TRUNG_BINH', 'https://images.unsplash.com/photo-1519710164239-da54291b26f0?w=400&h=600&fit=crop', 'DB'),
    T('Barbell Power', 'KHO', 'https://images.unsplash.com/photo-1517838277536-f5f9b2d18827?w=400&h=600&fit=crop', 'BB'),
    T('Flexibility Mobility', 'DE', 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=600&fit=crop', 'Mobility'),
];

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔌 Connected');
    await Template.deleteMany({});
    await Template.insertMany(templates);
    console.log('✅ Seeded 20 session templates');
    await mongoose.disconnect();
}

run().catch(err => { console.error('❌ Error', err); process.exit(1); });


