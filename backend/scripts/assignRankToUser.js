const path = require('path');
// Load .env from the backend project root explicitly
try {
    require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });
} catch (e) {
    // ignore
}
const fs = require('fs');
const mongoose = require('mongoose');

// Connect to project services
const hangHoiVienService = require('../src/services/hanghoivien.service');

const userId = process.argv[2] || '68cccb75b7bd0254cdd71fab';
// Allow passing MONGODB_URI as the second argument for one-off runs: node assignRankToUser.js <userId> <mongoUri>
const cliMongoUri = process.argv[3];

async function main() {
    let mongoUri = cliMongoUri || process.env.MONGODB_URI;
    // If dotenv didn't inject (some environments), try to read .env manually
    if (!mongoUri) {
        try {
            // try backend/.env first
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
        console.error('MONGODB_URI not provided. You can either set backend/.env or pass the URI as the second argument.');
        console.error('Usage: node assignRankToUser.js <userId> <mongoUri(optional)>');
        process.exit(1);
    }

    try {
        await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('Connected to MongoDB');

        console.log(`Assigning rank to user ${userId}...`);
        const updatedUser = await hangHoiVienService.tinhHangHoiVien(userId);

        console.log('Result:', updatedUser ? {
            id: updatedUser._id,
            hangHoiVien: updatedUser.hangHoiVien,
            ngayDatHang: updatedUser.ngayDatHang
        } : null);

        await mongoose.disconnect();
        console.log('Disconnected');
        process.exit(0);
    } catch (err) {
        console.error('Error running script:', err);
        try { await mongoose.disconnect(); } catch (e) { }
        process.exit(1);
    }
}

main();
