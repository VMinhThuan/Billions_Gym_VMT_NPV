/**
 * Script to add database indexes for better performance
 * Run this once: node scripts/addIndexes.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function addIndexes() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 75000,
        });
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;

        // Add indexes for BaiTap collection
        console.log('\n📊 Adding indexes to BaiTap collection...');
        await db.collection('baitaps').createIndex({ status: 1 });
        console.log('✅ Created index on status');
        
        await db.collection('baitaps').createIndex({ createdAt: -1 });
        console.log('✅ Created index on createdAt');
        
        await db.collection('baitaps').createIndex({ mucDoKho: 1 });
        console.log('✅ Created index on mucDoKho');
        
        await db.collection('baitaps').createIndex({ nhomCo: 1 });
        console.log('✅ Created index on nhomCo');

        // Add indexes for NguoiDung (PT) collection
        console.log('\n📊 Adding indexes to NguoiDung collection...');
        await db.collection('nguoidungs').createIndex({ trangThaiPT: 1 });
        console.log('✅ Created index on trangThaiPT');
        
        await db.collection('nguoidungs').createIndex({ vaiTro: 1 });
        console.log('✅ Created index on vaiTro');
        
        await db.collection('nguoidungs').createIndex({ 
            trangThaiPT: 1, 
            vaiTro: 1 
        });
        console.log('✅ Created compound index on trangThaiPT + vaiTro');

        // List all indexes
        console.log('\n📋 Current indexes on BaiTap:');
        const baitapIndexes = await db.collection('baitaps').indexes();
        console.log(JSON.stringify(baitapIndexes, null, 2));

        console.log('\n📋 Current indexes on NguoiDung:');
        const nguoidungIndexes = await db.collection('nguoidungs').indexes();
        console.log(JSON.stringify(nguoidungIndexes, null, 2));

        console.log('\n✅ All indexes created successfully!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error adding indexes:', error);
        process.exit(1);
    }
}

addIndexes();
