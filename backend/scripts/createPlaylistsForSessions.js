const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Session = require('../src/models/Session');
const SessionPlaylistItem = require('../src/models/SessionPlaylistItem');
const TemplateBuoiTap = require('../src/models/TemplateBuoiTap');
const SessionOption = require('../src/models/SessionOption');
const Exercise = require('../src/models/Exercise'); // Cần import để populate hoạt động

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        createPlaylistsForSessions();
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

async function createPlaylistsForSessions() {
    try {
        console.log('🌱 Starting to create playlists for sessions...\n');

        // Lấy tất cả templates với bài tập đã được gán
        const templates = await TemplateBuoiTap.find({
            baiTap: { $exists: true, $ne: [] }
        }).populate('baiTap');
        console.log(`📋 Found ${templates.length} templates with exercises\n`);

        if (templates.length === 0) {
            console.log('⚠️  No templates with exercises found. Please run assignExercisesToTemplates.js first.');
            process.exit(1);
        }

        let totalPlaylistsCreated = 0;
        let totalItemsCreated = 0;

        // Xử lý Session model
        const sessions = await Session.find();
        console.log(`📦 Found ${sessions.length} Session records\n`);

        if (sessions.length > 0) {
            for (const session of sessions) {
                // Tìm template tương ứng dựa trên doKho và các tiêu chí khác
                // Hoặc nếu session có taiLieuBaiTap thì dùng luôn
                let exercisesToAdd = [];

                if (session.taiLieuBaiTap && session.taiLieuBaiTap.length > 0) {
                    exercisesToAdd = session.taiLieuBaiTap;
                } else {
                    // Tìm template phù hợp dựa trên doKho
                    const matchingTemplate = templates.find(t => t.doKho === session.doKho);
                    if (matchingTemplate && matchingTemplate.baiTap && matchingTemplate.baiTap.length > 0) {
                        exercisesToAdd = matchingTemplate.baiTap.map(ex => ex._id || ex);
                    }
                }

                if (exercisesToAdd.length === 0) continue;

                // Kiểm tra xem đã có playlist chưa
                const existingPlaylist = await SessionPlaylistItem.find({ session_id: session._id });

                if (existingPlaylist.length > 0) {
                    console.log(`   ⏭️  Session ${session._id} already has ${existingPlaylist.length} playlist items, skipping...`);
                    continue;
                }

                // Tạo playlist items
                const playlistItems = exercisesToAdd.map((exerciseId, index) => ({
                    session_id: session._id,
                    exercise_id: exerciseId,
                    position: index + 1,
                    is_preview: index === 0 // Đánh dấu bài tập đầu tiên là preview
                }));

                await SessionPlaylistItem.insertMany(playlistItems);
                console.log(`   ✅ Created playlist for Session ${session._id}: ${playlistItems.length} exercises`);
                totalPlaylistsCreated++;
                totalItemsCreated += playlistItems.length;
            }
        }

        // Xử lý SessionOption: Tạo Session từ SessionOption và playlist tương ứng
        const sessionOptions = await SessionOption.find().populate('templateRef');
        console.log(`\n📦 Found ${sessionOptions.length} SessionOption records\n`);

        if (sessionOptions.length > 0) {
            for (const sessionOption of sessionOptions) {
                let exercisesToAdd = [];

                // Nếu có templateRef, lấy bài tập từ template
                if (sessionOption.templateRef && sessionOption.templateRef.baiTap) {
                    exercisesToAdd = sessionOption.templateRef.baiTap.map(ex => ex._id || ex);
                } else {
                    // Tìm template phù hợp dựa trên loai và doKho
                    const matchingTemplate = templates.find(t =>
                        t.loai === sessionOption.loai && t.doKho === sessionOption.doKho
                    );
                    if (matchingTemplate && matchingTemplate.baiTap && matchingTemplate.baiTap.length > 0) {
                        exercisesToAdd = matchingTemplate.baiTap.map(ex => ex._id || ex);
                    }
                }

                if (exercisesToAdd.length === 0) continue;

                // Kiểm tra SessionOption có đủ thông tin để tạo Session không
                if (!sessionOption.ngay || !sessionOption.gioBatDau || !sessionOption.gioKetThuc) {
                    console.log(`   ⚠️  SessionOption ${sessionOption._id} thiếu thông tin ngày/giờ, bỏ qua...`);
                    continue;
                }

                // Tìm hoặc tạo Session tương ứng với SessionOption
                let session = await Session.findOne({
                    chiNhanh: sessionOption.chiNhanh,
                    ptPhuTrach: sessionOption.ptPhuTrach,
                    ngay: sessionOption.ngay,
                    gioBatDau: sessionOption.gioBatDau,
                    gioKetThuc: sessionOption.gioKetThuc
                });

                // Nếu chưa có Session, tạo mới
                if (!session) {
                    session = await Session.create({
                        chiNhanh: sessionOption.chiNhanh,
                        ptPhuTrach: sessionOption.ptPhuTrach,
                        ngay: sessionOption.ngay,
                        gioBatDau: sessionOption.gioBatDau,
                        gioKetThuc: sessionOption.gioKetThuc,
                        doKho: sessionOption.doKho || 'TRUNG_BINH',
                        taiLieuBaiTap: exercisesToAdd,
                        hinhAnh: sessionOption.hinhAnh || '',
                        soLuongToiDa: sessionOption.soLuongToiDa || 20,
                        trangThai: 'HOAT_DONG'
                    });
                    console.log(`   ➕ Created new Session ${session._id} from SessionOption`);
                }

                // Kiểm tra xem đã có playlist chưa
                const existingPlaylist = await SessionPlaylistItem.find({ session_id: session._id });

                if (existingPlaylist.length > 0) {
                    console.log(`   ⏭️  Session ${session._id} already has ${existingPlaylist.length} playlist items, skipping...`);
                    continue;
                }

                // Tạo playlist items
                const playlistItems = exercisesToAdd.map((exerciseId, index) => ({
                    session_id: session._id,
                    exercise_id: exerciseId,
                    position: index + 1,
                    is_preview: index === 0 // Đánh dấu bài tập đầu tiên là preview
                }));

                await SessionPlaylistItem.insertMany(playlistItems);
                console.log(`   ✅ Created playlist for SessionOption ${sessionOption._id} -> Session ${session._id}: ${playlistItems.length} exercises`);
                totalPlaylistsCreated++;
                totalItemsCreated += playlistItems.length;
            }
        }

        console.log(`\n🎉 Successfully created playlists!`);
        console.log(`📊 Total playlists created: ${totalPlaylistsCreated}`);
        console.log(`📊 Total playlist items created: ${totalItemsCreated}`);
        console.log(`📋 Average items per playlist: ${totalPlaylistsCreated > 0 ? (totalItemsCreated / totalPlaylistsCreated).toFixed(1) : 0}`);

        // Thống kê theo template
        const statsByTemplate = {};
        for (const template of templates) {
            const exerciseCount = template.baiTap ? template.baiTap.length : 0;
            const key = `${template.loai || 'Unknown'}_${template.doKho || 'TRUNG_BINH'}`;
            statsByTemplate[key] = (statsByTemplate[key] || 0) + exerciseCount;
        }

        console.log('\n📊 Statistics by Template:');
        Object.entries(statsByTemplate).forEach(([key, count]) => {
            console.log(`   ${key}: ${count} exercises assigned`);
        });

        process.exit(0);

    } catch (error) {
        console.error('❌ Error creating playlists:', error);
        process.exit(1);
    }
}

