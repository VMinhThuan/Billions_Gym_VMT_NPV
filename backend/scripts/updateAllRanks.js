const path = require('path');
const fs = require('fs');

// Try to load dotenv quietly; some environments use dotenvx which behaves differently
try { require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') }); } catch (e) { }

const mongoose = require('mongoose');
const hangHoiVienService = require('../src/services/hanghoivien.service');

// Usage: node updateAllRanks.js [mongoUri]
const cliMongoUri = process.argv[2];

async function main() {
    let mongoUri = cliMongoUri || process.env.MONGODB_URI;

    // If dotenv didn't inject, try to read backend/.env or repo root .env manually
    if (!mongoUri) {
        try {
            const envCandidates = [
                path.resolve(__dirname, '..', '.env'), // backend/.env
                path.resolve(__dirname, '..', '..', '.env') // repo root .env
            ];
            for (const envPath of envCandidates) {
                if (fs.existsSync(envPath)) {
                    const content = fs.readFileSync(envPath, 'utf8');
                    const match = content.match(/MONGODB_URI=(.+)/);
                    if (match && match[1]) {
                        mongoUri = match[1].trim();
                        console.log('Loaded MONGODB_URI from', envPath);
                        break;
                    }
                }
            }
        } catch (e) {
            // ignore
        }
    }

    if (!mongoUri) {
        console.error('MONGODB_URI not provided. Put it in backend/.env or pass it as an argument.');
        console.error('Usage: node updateAllRanks.js "mongodb://..."');
        process.exit(1);
    }

    try {
        await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('Connected to MongoDB');

        console.log('Starting rank update for all members...');
        const results = await hangHoiVienService.capNhatHangTatCaHoiVien();

        console.log(`Rank update complete. Updated ${results.length} members (successful updates returned).`);
        if (results.length > 0) {
            const sample = results[0];
            const hang = sample.hangHoiVien && sample.hangHoiVien.tenHienThi ? sample.hangHoiVien.tenHienThi : sample.hangHoiVien;
            console.log('Sample updated member:', {
                id: sample._id,
                hangHoiVien: hang,
                ngayDatHang: sample.ngayDatHang
            });
        }

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
        process.exit(0);
    } catch (err) {
        console.error('Error updating ranks:', err);
        try { await mongoose.disconnect(); } catch (e) { }
        process.exit(1);
    }
}

main();
