/*
Backfill script: compute and set `kcal` for existing BaiTap documents
Usage: node scripts/add_kcal_to_baitap.js
Requires: set MONGO_URI in environment or in a .env file
*/

const mongoose = require('mongoose');
require('dotenv').config();
const path = require('path');

// Sử dụng Exercise model (đã merge với BaiTap)
const BaiTap = require(path.join(__dirname, '..', 'src', 'models', 'BaiTap'));

const MONGO_URI = process.env.MONGO_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/billions_gym';

function computeDefaultKcal(doc) {
    try {
        const thoiGian = doc.thoiGian || 0;
        if (thoiGian && Number(thoiGian) > 0) {
            return Math.round(Number(thoiGian) * 8);
        }

        const diff = (doc.mucDoKho || '').toLowerCase();
        if (diff.includes('de') || diff.includes('dễ')) return 50;
        if (diff.includes('khó') || diff.includes('kho')) return 150;
        return 100;
    } catch (e) {
        return 100;
    }
}

async function run() {
    console.log('Connecting to', MONGO_URI);
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

    try {
        const cursor = BaiTap.find({ $or: [{ kcal: { $exists: false } }, { kcal: null }] }).cursor();
        let updated = 0;
        for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
            const kcal = computeDefaultKcal(doc);
            doc.kcal = kcal;
            await doc.save();
            updated++;
            if (updated % 50 === 0) console.log('Updated', updated);
        }
        console.log('Backfill complete. Updated', updated, 'documents.');
    } catch (err) {
        console.error('Backfill error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
