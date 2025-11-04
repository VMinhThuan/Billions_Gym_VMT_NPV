const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Exercise = require('../src/models/BaiTap'); // BaiTap (alias cho Exercise)
const TemplateBuoiTap = require('../src/models/TemplateBuoiTap');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        assignExercisesToTemplates();
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

// Map loai template sang nhomCo hoặc keyword để tìm bài tập phù hợp
const getExerciseKeywordsForTemplate = (loai) => {
    const mapping = {
        'Pull': ['Lưng', 'Xô', 'Tay trước'],
        'Push': ['Ngực', 'Vai', 'Tay sau'],
        'Legs': ['Đùi', 'Mông', 'Bắp chân'],
        'Cardio': ['Cardio', 'Tim mạch', 'Toàn thân'],
        'Boxing': ['Boxing', 'Tay', 'Tim mạch'],
        'ShoulderAbs': ['Vai', 'Bụng'],
        'BB': ['Sức mạnh', 'Tạ đòn'],
        'FullBody': ['Toàn thân'],
        'Core': ['Bụng', 'Core'],
        'Yoga': ['Yoga', 'Linh hoạt'],
        'HIIT': ['HIIT', 'Tim mạch'],
        'Strength': ['Sức mạnh'],
        'Endurance': ['Tim mạch', 'Sức bền'],
        'Flexibility': ['Linh hoạt', 'Giãn cơ'],
        'CrossFit': ['Toàn thân', 'Sức mạnh'],
        'Calisthenics': ['Bodyweight', 'Toàn thân'],
        'Bodybuilding': ['Tăng cơ', 'Toàn thân'],
        'Functional': ['Chức năng', 'Toàn thân'],
        'Recovery': ['Phục hồi', 'Linh hoạt'],
        'BackBiceps': ['Lưng', 'Tay trước'],
        'ChestTriceps': ['Ngực', 'Tay sau'],
        'Upper': ['Ngực', 'Lưng', 'Vai', 'Tay'],
        'Lower': ['Đùi', 'Mông', 'Bắp chân'],
        'Plyo': ['Sức bật', 'Plyometric'],
        'Bodyweight': ['Bodyweight', 'Toàn thân'],
        'Mobility': ['Linh hoạt', 'Mobility'],
        'DB': ['Tạ đơn', 'Dumbbell']
    };
    return mapping[loai] || ['Toàn thân'];
};

// Map loai template sang difficulty
const getDifficultyForTemplate = (doKho) => {
    if (doKho === 'DE') return 'beginner';
    if (doKho === 'TRUNG_BINH') return 'intermediate';
    if (doKho === 'KHO') return 'advanced';
    return 'intermediate';
};

async function assignExercisesToTemplates() {
    try {
        console.log('🌱 Starting to assign exercises to templates...\n');

        // Lấy tất cả templates
        const templates = await TemplateBuoiTap.find().sort({ ten: 1 });
        console.log(`📋 Found ${templates.length} templates in database\n`);

        if (templates.length === 0) {
            console.log('⚠️  No templates found. Please seed templates first.');
            process.exit(1);
        }

        // Lấy tất cả exercises
        const allExercises = await Exercise.find({ status: 'active' });
        console.log(`📦 Found ${allExercises.length} active exercises\n`);

        if (allExercises.length === 0) {
            console.log('⚠️  No exercises found. Please seed exercises first.');
            process.exit(1);
        }

        let totalAssigned = 0;

        // Với mỗi template
        for (const template of templates) {
            console.log(`\n📝 Processing template: ${template.ten} (${template.loai})`);

            // Lấy keywords phù hợp
            const keywords = getExerciseKeywordsForTemplate(template.loai);
            const targetDifficulty = getDifficultyForTemplate(template.doKho);

            console.log(`   Keywords: ${keywords.join(', ')}`);
            console.log(`   Target difficulty: ${targetDifficulty}`);

            // Tìm bài tập phù hợp
            const matchingExercises = allExercises.filter(ex => {
                // Kiểm tra difficulty
                const exDifficulty = ex.difficulty || (ex.mucDoKho === 'DE' ? 'beginner' : ex.mucDoKho === 'TRUNG_BINH' ? 'intermediate' : ex.mucDoKho === 'KHO' ? 'advanced' : 'beginner');

                // Ưu tiên difficulty trùng
                if (exDifficulty !== targetDifficulty) return false;

                // Kiểm tra nhomCo có chứa keyword không
                const nhomCo = (ex.nhomCo || '').toLowerCase();
                const matchesKeyword = keywords.some(keyword =>
                    nhomCo.includes(keyword.toLowerCase()) ||
                    (ex.tenBaiTap || ex.title || '').toLowerCase().includes(keyword.toLowerCase()) ||
                    (ex.moTa || ex.description || '').toLowerCase().includes(keyword.toLowerCase())
                );

                return matchesKeyword;
            });

            // Nếu không tìm thấy đủ với difficulty chính xác, lấy thêm từ difficulty gần
            let selectedExercises = [...matchingExercises];

            if (selectedExercises.length < 20) {
                const additionalExercises = allExercises.filter(ex => {
                    const exDifficulty = ex.difficulty || (ex.mucDoKho === 'DE' ? 'beginner' : ex.mucDoKho === 'TRUNG_BINH' ? 'intermediate' : ex.mucDoKho === 'KHO' ? 'advanced' : 'beginner');

                    // Bỏ qua những bài đã chọn
                    if (selectedExercises.some(e => e._id.toString() === ex._id.toString())) return false;

                    // Nếu là intermediate, có thể lấy beginner hoặc advanced
                    if (targetDifficulty === 'intermediate') {
                        if (exDifficulty !== 'beginner' && exDifficulty !== 'advanced') return false;
                    }
                    // Nếu là beginner, chỉ lấy beginner hoặc intermediate
                    else if (targetDifficulty === 'beginner') {
                        if (exDifficulty !== 'beginner' && exDifficulty !== 'intermediate') return false;
                    }
                    // Nếu là advanced, chỉ lấy advanced hoặc intermediate
                    else if (targetDifficulty === 'advanced') {
                        if (exDifficulty !== 'advanced' && exDifficulty !== 'intermediate') return false;
                    }

                    const nhomCo = (ex.nhomCo || '').toLowerCase();
                    return keywords.some(keyword =>
                        nhomCo.includes(keyword.toLowerCase()) ||
                        (ex.tenBaiTap || ex.title || '').toLowerCase().includes(keyword.toLowerCase()) ||
                        (ex.moTa || ex.description || '').toLowerCase().includes(keyword.toLowerCase())
                    );
                });

                selectedExercises.push(...additionalExercises);
            }

            // Nếu vẫn chưa đủ, lấy bất kỳ bài tập nào cùng loai
            if (selectedExercises.length < 20) {
                const moreExercises = allExercises.filter(ex => {
                    if (selectedExercises.some(e => e._id.toString() === ex._id.toString())) return false;
                    return true;
                });
                selectedExercises.push(...moreExercises);
            }

            // Giới hạn 20 bài tập
            const finalExercises = selectedExercises.slice(0, 20);
            const exerciseIds = finalExercises.map(ex => ex._id);

            // Cập nhật template với danh sách bài tập
            await TemplateBuoiTap.updateOne(
                { _id: template._id },
                { $set: { baiTap: exerciseIds } }
            );

            console.log(`   ✅ Assigned ${finalExercises.length} exercises:`);
            finalExercises.forEach((ex, idx) => {
                const difficulty = ex.difficulty || (ex.mucDoKho === 'DE' ? 'beginner' : ex.mucDoKho === 'TRUNG_BINH' ? 'intermediate' : ex.mucDoKho === 'KHO' ? 'advanced' : 'beginner');
                console.log(`      ${idx + 1}. ${ex.tenBaiTap || ex.title} (${difficulty})`);
            });

            totalAssigned += finalExercises.length;
        }

        console.log(`\n🎉 Successfully assigned exercises to all templates!`);
        console.log(`📊 Total exercises assigned: ${totalAssigned}`);
        console.log(`📋 Average exercises per template: ${(totalAssigned / templates.length).toFixed(1)}`);

        // Thống kê
        const statsByTemplate = {};
        for (const template of templates) {
            const updatedTemplate = await TemplateBuoiTap.findById(template._id).populate('baiTap');
            const exerciseCount = updatedTemplate.baiTap ? updatedTemplate.baiTap.length : 0;
            statsByTemplate[template.loai || 'Unknown'] = (statsByTemplate[template.loai || 'Unknown'] || 0) + exerciseCount;
        }

        console.log('\n📊 Statistics by Template Type:');
        Object.entries(statsByTemplate).forEach(([type, count]) => {
            console.log(`   ${type}: ${count} exercises`);
        });

        process.exit(0);

    } catch (error) {
        console.error('❌ Error assigning exercises to templates:', error);
        process.exit(1);
    }
}

