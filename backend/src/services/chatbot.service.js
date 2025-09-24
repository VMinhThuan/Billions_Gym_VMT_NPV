const ChatbotSession = require('../models/ChatbotSession');
const dinhDuongService = require('./dinhduong.service');
const goiTapService = require('./goitap.service');
const lichHenPTService = require('./lichhenpt.service');
const { HoiVien } = require('../models/NguoiDung');
const ChiSoCoThe = require('../models/ChiSoCoThe');
const LichSuTap = require('../models/LichSuTap');

// Tạo session mới cho chatbot
const createChatbotSession = async (hoiVienId) => {
    try {
        const sessionId = `chat_${hoiVienId}_${Date.now()}`;

        const session = new ChatbotSession({
            hoiVien: hoiVienId,
            sessionId: sessionId,
            messages: [],
            currentContext: 'general',
            isActive: true
        });

        await session.save();
        return session;
    } catch (error) {
        console.error('Lỗi tạo session chatbot:', error);
        throw error;
    }
};

// Lấy session hiện tại của hội viên
const getCurrentSession = async (hoiVienId) => {
    try {
        let session = await ChatbotSession.findOne({
            hoiVien: hoiVienId,
            isActive: true
        }).populate('hoiVien', 'hoTen sdt gioiTinh ngaySinh');

        if (!session) {
            session = await createChatbotSession(hoiVienId);
        }

        return session;
    } catch (error) {
        console.error('Lỗi lấy session chatbot:', error);
        throw error;
    }
};

// Phân tích intent từ tin nhắn người dùng
const analyzeIntent = (message) => {
    const messageLower = message.toLowerCase();

    // Mở rộng từ khóa dinh dưỡng
    const nutritionKeywords = [
        'dinh dưỡng', 'ăn uống', 'calo', 'calories', 'protein', 'carb', 'fat', 'vitamin',
        'thực đơn', 'menu', 'bữa ăn', 'tăng cân', 'giảm cân', 'cơ bắp', 'mỡ', 'béo',
        'nước', 'uống nước', 'bổ sung', 'thực phẩm', 'rau củ', 'thịt', 'cá', 'trứng',
        'sữa', 'phô mai', 'bơ', 'dầu', 'đường', 'muối', 'khoáng chất', 'chất xơ',
        'tinh bột', 'đường huyết', 'insulin', 'metabolism', 'trao đổi chất',
        'thực phẩm chức năng', 'supplement', 'whey', 'creatine', 'bcaa', 'omega',
        'cholesterol', 'đường', 'sugar', 'keto', 'paleo', 'vegan', 'vegetarian',
        'ăn kiêng', 'diet', 'thực đơn giảm cân', 'thực đơn tăng cân', 'meal plan',
        'ăn', 'thức ăn', 'food', 'drink', 'uống', 'nước', 'water'
    ];

    // Mở rộng từ khóa tập luyện
    const workoutKeywords = [
        'tập luyện', 'workout', 'exercise', 'gym', 'phòng gym', 'tập gym', 'fitness',
        'cardio', 'strength', 'sức mạnh', 'bền bỉ', 'endurance', 'flexibility', 'linh hoạt',
        'bài tập', 'exercise', 'reps', 'sets', 'weight', 'tạ', 'dumbbell', 'barbell',
        'bench press', 'squat', 'deadlift', 'pull up', 'push up', 'plank', 'crunch',
        'chạy bộ', 'running', 'đi bộ', 'walking', 'bơi lội', 'swimming', 'yoga', 'pilates',
        'aerobic', 'zumba', 'kickboxing', 'boxing', 'martial arts', 'võ thuật',
        'tập', 'bài tập', 'luyện tập', 'thể dục', 'sport', 'thể thao'
    ];

    // Mở rộng từ khóa gói tập
    const membershipKeywords = [
        'gói tập', 'membership', 'đăng ký', 'register', 'gia hạn', 'renew', 'hết hạn', 'expired',
        'phí', 'fee', 'giá', 'price', 'cost', 'tháng', 'month', 'năm', 'year', 'thử', 'trial',
        'miễn phí', 'free', 'khuyến mãi', 'promotion', 'sale', 'discount', 'giảm giá',
        'combo', 'package', 'bundle', 'vip', 'premium', 'basic', 'standard',
        'pt', 'personal trainer', 'huấn luyện viên', 'coach', 'instructor',
        'gói', 'thẻ', 'học phí', 'membership', 'subscription'
    ];

    // Mở rộng từ khóa đặt lịch
    const bookingKeywords = [
        'đặt lịch', 'booking', 'book', 'lịch tập', 'schedule', 'pt', 'personal trainer',
        'huấn luyện viên', 'trainer', 'coach', 'lớp học', 'group class', 'class',
        'thời gian', 'time', 'ca tập', 'session', 'hủy lịch', 'cancel', 'reschedule',
        'appointment', 'meeting', 'lịch hẹn', 'thay đổi lịch', 'change schedule'
    ];

    // Mở rộng từ khóa sức khỏe
    const healthKeywords = [
        'sức khỏe', 'health', 'bmi', 'cân nặng', 'weight', 'chiều cao', 'height',
        'mục tiêu', 'goal', 'target', 'kết quả', 'result', 'tiến độ', 'progress',
        'thể lực', 'fitness', 'stamina', 'sức bền', 'muscle', 'cơ bắp', 'strength',
        'injury', 'chấn thương', 'recovery', 'phục hồi', 'rest', 'nghỉ ngơi', 'sleep',
        'giấc ngủ', 'stress', 'căng thẳng', 'mental health', 'sức khỏe tinh thần'
    ];

    // Mở rộng từ khóa chung
    const generalKeywords = [
        'xin chào', 'hello', 'hi', 'hey', 'cảm ơn', 'thanks', 'thank you', 'tạm biệt', 'bye',
        'giúp đỡ', 'help', 'hỗ trợ', 'support', 'thông tin', 'information', 'hướng dẫn', 'guide',
        'cách', 'how', 'làm sao', 'what', 'gì', 'tại sao', 'why', 'khi nào', 'when', 'ở đâu', 'where',
        'ai', 'who', 'như thế nào', 'how to', 'tutorial', 'hướng dẫn', 'instruction',
        'chào', 'greeting', 'welcome'
    ];

    // Từ khóa câu hỏi
    const questionKeywords = [
        'gì', 'what', 'tại sao', 'why', 'như thế nào', 'how', 'khi nào', 'when',
        'ở đâu', 'where', 'ai', 'who', 'bao nhiêu', 'how much', 'how many',
        'có thể', 'can', 'có', 'have', 'là', 'is', 'are', 'được không', 'ok'
    ];

    // Từ khóa cảm xúc
    const emotionKeywords = [
        'tốt', 'good', 'tuyệt', 'great', 'awesome', 'amazing', 'xấu', 'bad', 'tệ', 'terrible',
        'vui', 'happy', 'buồn', 'sad', 'lo lắng', 'worried', 'sợ', 'afraid', 'thích', 'like',
        'không thích', 'dislike', 'ghét', 'hate', 'yêu', 'love', 'thương', 'care'
    ];

    // Tính điểm cho từng intent
    let scores = {
        nutrition: 0,
        workout: 0,
        membership: 0,
        booking: 0,
        health: 0,
        general: 0
    };

    // Đếm từ khóa cho mỗi intent
    nutritionKeywords.forEach(keyword => {
        if (messageLower.includes(keyword)) scores.nutrition += 1;
    });

    workoutKeywords.forEach(keyword => {
        if (messageLower.includes(keyword)) scores.workout += 1;
    });

    membershipKeywords.forEach(keyword => {
        if (messageLower.includes(keyword)) scores.membership += 1;
    });

    bookingKeywords.forEach(keyword => {
        if (messageLower.includes(keyword)) scores.booking += 1;
    });

    healthKeywords.forEach(keyword => {
        if (messageLower.includes(keyword)) scores.health += 1;
    });

    generalKeywords.forEach(keyword => {
        if (messageLower.includes(keyword)) scores.general += 1;
    });

    // Bonus cho câu hỏi
    if (questionKeywords.some(keyword => messageLower.includes(keyword))) {
        Object.keys(scores).forEach(key => scores[key] += 0.5);
    }

    // Bonus cho cảm xúc
    if (emotionKeywords.some(keyword => messageLower.includes(keyword))) {
        scores.general += 1;
    }

    // Tìm intent có điểm cao nhất
    const maxScore = Math.max(...Object.values(scores));
    const bestIntent = Object.keys(scores).find(key => scores[key] === maxScore);

    // Tính confidence dựa trên điểm số
    const totalKeywords = Object.values(scores).reduce((sum, score) => sum + score, 0);
    const confidence = totalKeywords > 0 ? Math.min(0.9, maxScore / totalKeywords + 0.3) : 0.6;

    // Xác định context và intent
    let context = 'general';
    let intent = 'general_question';

    switch (bestIntent) {
        case 'nutrition':
            context = 'nutrition';
            intent = 'nutrition_advice';
            break;
        case 'workout':
            context = 'workout';
            intent = 'workout_advice';
            break;
        case 'membership':
            context = 'membership';
            intent = 'membership_info';
            break;
        case 'booking':
            context = 'booking';
            intent = 'booking_help';
            break;
        case 'health':
            context = 'health';
            intent = 'health_consultation';
            break;
        default:
            context = 'general';
            intent = 'general_question';
    }

    return {
        intent: intent,
        context: context,
        confidence: confidence,
        scores: scores
    };
};

// Xử lý tin nhắn dinh dưỡng
const handleNutritionQuery = async (session, message, userProfile) => {
    try {
        const { mucTieu, hoatDongTap } = userProfile;

        // Tạo gợi ý dinh dưỡng AI
        const nutritionAdvice = await dinhDuongService.taoGoiYDinhDuongAI(
            session.hoiVien._id,
            mucTieu || 'DUY_TRI',
            {
                canNang: userProfile.canNang,
                chieuCao: userProfile.chieuCao,
                hoatDong: hoatDongTap || 'HOAT_DONG_VUA'
            }
        );

        const goiY = nutritionAdvice.data.goiYAI;

        let response = `🍎 **Gợi ý dinh dưỡng cho bạn:**\n\n`;
        response += `**${goiY.tieuDe}**\n\n`;
        response += `${goiY.noiDungGoiY}\n\n`;

        if (goiY.cacThucPhamNenAn.length > 0) {
            response += `✅ **Thực phẩm nên ăn:**\n`;
            goiY.cacThucPhamNenAn.forEach(food => {
                response += `• ${food}\n`;
            });
            response += `\n`;
        }

        if (goiY.cacThucPhamNenTranh.length > 0) {
            response += `❌ **Thực phẩm nên tránh:**\n`;
            goiY.cacThucPhamNenTranh.forEach(food => {
                response += `• ${food}\n`;
            });
            response += `\n`;
        }

        if (goiY.thoidDiemAnUong.length > 0) {
            response += `⏰ **Thời điểm ăn uống:**\n`;
            goiY.thoidDiemAnUong.forEach(tip => {
                response += `• ${tip}\n`;
            });
            response += `\n`;
        }

        if (goiY.luuYDacBiet.length > 0) {
            response += `💡 **Lưu ý đặc biệt:**\n`;
            goiY.luuYDacBiet.forEach(note => {
                response += `• ${note}\n`;
            });
        }

        return response;
    } catch (error) {
        console.error('Lỗi xử lý câu hỏi dinh dưỡng:', error);
        return "Xin lỗi, tôi không thể tạo gợi ý dinh dưỡng lúc này. Vui lòng thử lại sau.";
    }
};

// Xử lý tin nhắn về gói tập
const handleMembershipQuery = async (session, message) => {
    try {
        const packages = await goiTapService.getAllGoiTap();
        const monthlyPackages = await goiTapService.getMonthlyPackages();

        let response = `💪 **Thông tin gói tập hiện có:**\n\n`;

        // Kiểm tra kịch bản cụ thể
        const messageLower = message.toLowerCase();

        if (messageLower.includes('miễn phí') || messageLower.includes('thử')) {
            response += `🎁 **Gói tập thử miễn phí:**\n`;
            response += `• **Gói 3 ngày thử nghiệm** - MIỄN PHÍ\n`;
            response += `  - Trải nghiệm đầy đủ các dịch vụ\n`;
            response += `  - Hỗ trợ tư vấn 1-1\n`;
            response += `  - Không ràng buộc, không phí ẩn\n\n`;
            response += `**Điều kiện:**\n`;
            response += `• Chỉ dành cho khách hàng mới\n`;
            response += `• Cần đăng ký thông tin cá nhân\n`;
            response += `• Có thể chuyển đổi sang gói trả phí bất kỳ lúc nào\n\n`;
            response += `Bạn có muốn đăng ký gói thử miễn phí không?`;
        } else if (messageLower.includes('dài hạn') || messageLower.includes('1 năm') || messageLower.includes('6 tháng')) {
            response += `🎯 **Gói tập dài hạn - Tiết kiệm tối đa:**\n`;
            packages.forEach(pkg => {
                if (pkg.donViThoiHan !== 'THANG') {
                    const discount = pkg.donViThoiHan === 'NAM' ? '20%' : pkg.donViThoiHan === '6_THANG' ? '15%' : '10%';
                    response += `• **${pkg.tenGoiTap}** - ${pkg.gia.toLocaleString('vi-VN')}đ/${pkg.donViThoiHan.toLowerCase()}\n`;
                    response += `  💰 Tiết kiệm ${discount} so với gói tháng\n`;
                    response += `  ${pkg.moTa}\n\n`;
                }
            });
            response += `**Ưu đãi đặc biệt:**\n`;
            response += `• Tặng kèm 2 buổi PT cá nhân\n`;
            response += `• Miễn phí đánh giá thể lực định kỳ\n`;
            response += `• Ưu tiên đặt lịch các lớp hot\n\n`;
            response += `Bạn quan tâm gói nào? Tôi có thể tư vấn chi tiết hơn!`;
        } else if (messageLower.includes('combo') || messageLower.includes('pt')) {
            response += `🏋️ **Gói Combo + PT Cá nhân:**\n`;
            response += `• **Gói VIP** - 2,500,000đ/tháng\n`;
            response += `  - Tập gym không giới hạn\n`;
            response += `  - 8 buổi PT cá nhân/tháng\n`;
            response += `  - Tư vấn dinh dưỡng chuyên sâu\n`;
            response += `  - Theo dõi tiến độ hàng tuần\n\n`;
            response += `• **Gói Premium** - 1,800,000đ/tháng\n`;
            response += `  - Tập gym không giới hạn\n`;
            response += `  - 4 buổi PT cá nhân/tháng\n`;
            response += `  - Tư vấn dinh dưỡng cơ bản\n\n`;
            response += `**Lợi ích:**\n`;
            response += `• Kết quả nhanh chóng và hiệu quả\n`;
            response += `• Lịch tập linh hoạt theo thời gian của bạn\n`;
            response += `• Hỗ trợ 24/7 từ huấn luyện viên\n\n`;
            response += `Bạn muốn tìm hiểu thêm về gói nào?`;
        } else {
            response += `**📅 Gói tập theo tháng:**\n`;
            monthlyPackages.forEach(pkg => {
                response += `• **${pkg.tenGoiTap}** - ${pkg.gia.toLocaleString('vi-VN')}đ/tháng\n`;
                response += `  ${pkg.moTa}\n\n`;
            });

            response += `**🎯 Gói tập dài hạn:**\n`;
            packages.forEach(pkg => {
                if (pkg.donViThoiHan !== 'THANG') {
                    response += `• **${pkg.tenGoiTap}** - ${pkg.gia.toLocaleString('vi-VN')}đ/${pkg.donViThoiHan.toLowerCase()}\n`;
                    response += `  ${pkg.moTa}\n\n`;
                }
            });

            response += `\n💡 **Khuyến nghị:**\n`;
            response += `• Nếu bạn mới bắt đầu: Chọn gói 1 tháng để trải nghiệm\n`;
            response += `• Nếu đã quen: Gói 3-6 tháng sẽ tiết kiệm hơn\n`;
            response += `• Muốn cam kết lâu dài: Gói 1 năm có ưu đãi tốt nhất\n\n`;
            response += `Bạn muốn tôi tư vấn gói nào phù hợp với mục tiêu của bạn?`;
        }

        return response;
    } catch (error) {
        console.error('Lỗi xử lý câu hỏi gói tập:', error);
        return "Xin lỗi, tôi không thể lấy thông tin gói tập lúc này. Vui lòng thử lại sau.";
    }
};

// Xử lý tin nhắn về đặt lịch
const handleBookingQuery = async (session, message) => {
    try {
        let response = `📅 **Hỗ trợ đặt lịch tập:**\n\n`;

        response += `**🏋️ Lớp học nhóm:**\n`;
        response += `• Yoga - 6:00-7:00 (T2,4,6)\n`;
        response += `• Cardio - 18:00-19:00 (T3,5,7)\n`;
        response += `• Zumba - 19:00-20:00 (T2,4,6)\n\n`;

        response += `**👨‍💼 PT cá nhân:**\n`;
        response += `• Có thể đặt lịch linh hoạt theo thời gian của bạn\n`;
        response += `• Hỗ trợ 1-1 với huấn luyện viên chuyên nghiệp\n`;
        response += `• Phù hợp cho người mới bắt đầu\n\n`;

        response += `**📱 Cách đặt lịch:**\n`;
        response += `• Vào màn hình "Đặt lịch" trong app\n`;
        response += `• Chọn loại hình tập (nhóm/PT)\n`;
        response += `• Chọn thời gian phù hợp\n`;
        response += `• Xác nhận đặt lịch\n\n`;

        response += `Bạn muốn đặt lịch loại nào? Tôi có thể hướng dẫn chi tiết hơn!`;

        return response;
    } catch (error) {
        console.error('Lỗi xử lý câu hỏi đặt lịch:', error);
        return "Xin lỗi, tôi không thể hỗ trợ đặt lịch lúc này. Vui lòng thử lại sau.";
    }
};

// Xử lý tin nhắn chung
const handleGeneralQuery = async (session, message) => {
    const messageLower = message.toLowerCase();

    // Kịch bản chăm sóc khách hàng cũ
    if (messageLower.includes('lâu không') || messageLower.includes('quay lại') ||
        messageLower.includes('khách hàng cũ') || messageLower.includes('welcome back')) {
        return `🎉 **Chào mừng bạn quay lại!**\n\n` +
            `Tôi thấy bạn đã từng là thành viên của Billions Gym. Chúng tôi rất vui được chào đón bạn trở lại!\n\n` +
            `**Ưu đãi đặc biệt cho khách hàng cũ:**\n` +
            `• Giảm 30% cho gói tập đầu tiên\n` +
            `• Tặng kèm 1 buổi PT cá nhân miễn phí\n` +
            `• Ưu tiên đặt lịch các lớp hot\n` +
            `• Hỗ trợ tư vấn dinh dưỡng miễn phí\n\n` +
            `Bạn muốn tìm hiểu về gói tập nào phù hợp với mục tiêu hiện tại?`;
    }

    // Kịch bản khuyến mãi - flash sale
    if (messageLower.includes('khuyến mãi') || messageLower.includes('sale') ||
        messageLower.includes('giảm giá') || messageLower.includes('flash sale')) {
        return `🔥 **FLASH SALE - Chỉ còn 24h!**\n\n` +
            `**⚡ Ưu đãi đặc biệt:**\n` +
            `• Gói 3 tháng: Giảm 50% - Chỉ còn 1,500,000đ\n` +
            `• Gói 6 tháng: Giảm 60% - Chỉ còn 2,400,000đ\n` +
            `• Gói 1 năm: Giảm 70% - Chỉ còn 3,600,000đ\n\n` +
            `**🎁 Quà tặng kèm:**\n` +
            `• 2 buổi PT cá nhân miễn phí\n` +
            `• Túi tập cao cấp\n` +
            `• Bình nước thể thao\n\n` +
            `**⏰ Hạn sử dụng:** Chỉ đến hết ngày hôm nay!\n\n` +
            `Bạn muốn đăng ký ngay không? Tôi có thể hỗ trợ bạn hoàn tất thủ tục!`;
    }

    // Kịch bản nhắc lịch tập định kỳ
    if (messageLower.includes('nhắc lịch') || messageLower.includes('lịch tập') ||
        messageLower.includes('reminder') || messageLower.includes('nhắc nhở')) {
        return `⏰ **Nhắc lịch tập thông minh:**\n\n` +
            `Tôi có thể giúp bạn:\n\n` +
            `**📱 Nhắc lịch tự động:**\n` +
            `• Nhắc nhở trước giờ tập 30 phút\n` +
            `• Gửi lời động viên hàng ngày\n` +
            `• Thông báo lịch PT cá nhân\n` +
            `• Nhắc uống nước đủ lượng\n\n` +
            `**🎯 Theo dõi tiến độ:**\n` +
            `• Đếm ngược đến mục tiêu\n` +
            `• Thống kê số buổi tập\n` +
            `• Cập nhật cân nặng định kỳ\n\n` +
            `Bạn muốn bật tính năng nhắc lịch không? Tôi sẽ thiết lập cho bạn!`;
    }

    // Kịch bản chăm sóc sau buổi tập
    if (messageLower.includes('sau tập') || messageLower.includes('mệt') ||
        messageLower.includes('phục hồi') || messageLower.includes('recovery')) {
        return `💪 **Chăm sóc sau buổi tập:**\n\n` +
            `Tuyệt vời! Bạn đã hoàn thành buổi tập. Đây là những điều bạn nên làm:\n\n` +
            `**🥤 Ngay sau tập (0-30 phút):**\n` +
            `• Uống 500ml nước để bù nước\n` +
            `• Ăn protein + carb (chuối + sữa)\n` +
            `• Thực hiện giãn cơ nhẹ nhàng\n\n` +
            `**🍽️ Trong 2 giờ tiếp theo:**\n` +
            `• Bữa ăn chính giàu protein\n` +
            `• Nghỉ ngơi, tránh stress\n` +
            `• Uống đủ nước (2-3L/ngày)\n\n` +
            `**😴 Trước khi ngủ:**\n` +
            `• Tắm nước ấm để thư giãn\n` +
            `• Ngủ đủ 7-8 tiếng\n` +
            `• Tránh caffeine và rượu bia\n\n` +
            `Bạn có câu hỏi gì về phục hồi không?`;
    }

    const responses = [
        "Xin chào! Tôi là AI trợ lý của Billions Gym. Tôi có thể giúp bạn:\n\n• 🍎 Tư vấn dinh dưỡng và thực đơn\n• 💪 Gợi ý bài tập phù hợp\n• 📅 Hỗ trợ đặt lịch tập\n• 💳 Tư vấn gói tập\n• 📝 Thu thập phản hồi\n\nBạn cần hỗ trợ gì hôm nay?",

        "Chào bạn! Tôi ở đây để hỗ trợ bạn trong hành trình fitness. Hãy cho tôi biết bạn đang quan tâm đến điều gì:\n\n• Dinh dưỡng và ăn uống\n• Bài tập và luyện tập\n• Gói tập và giá cả\n• Đặt lịch và lịch trình\n• Phản hồi và góp ý",

        "Hello! 👋 Tôi là trợ lý AI của Billions Gym. Tôi có thể giúp bạn với nhiều vấn đề về fitness và gym. Bạn muốn tìm hiểu về điều gì?"
    ];

    return responses[Math.floor(Math.random() * responses.length)];
};

// Xử lý tin nhắn tập luyện
const handleWorkoutQuery = async (session, message) => {
    const messageLower = message.toLowerCase();

    // Câu hỏi về bài tập cụ thể
    if (messageLower.includes('bài tập') || messageLower.includes('exercise') ||
        messageLower.includes('tập gì') || messageLower.includes('workout plan')) {
        return `💪 **Gợi ý bài tập cho bạn:**\n\n` +
            `**🏋️ Bài tập cơ bản:**\n` +
            `• Push-up: 3 sets x 10-15 reps\n` +
            `• Squat: 3 sets x 15-20 reps\n` +
            `• Plank: 3 sets x 30-60 giây\n` +
            `• Lunges: 3 sets x 10 mỗi chân\n\n` +
            `**🔥 Bài tập nâng cao:**\n` +
            `• Deadlift: 4 sets x 5-8 reps\n` +
            `• Bench Press: 4 sets x 6-10 reps\n` +
            `• Pull-ups: 3 sets x 5-10 reps\n` +
            `• Burpees: 3 sets x 10-15 reps\n\n` +
            `**⏰ Lịch tập gợi ý:**\n` +
            `• Thứ 2,4,6: Tập thân trên\n` +
            `• Thứ 3,5,7: Tập thân dưới\n` +
            `• Chủ nhật: Nghỉ ngơi hoặc cardio nhẹ\n\n` +
            `Bạn muốn tôi tạo lịch tập chi tiết hơn không?`;
    }

    // Câu hỏi về cardio
    if (messageLower.includes('cardio') || messageLower.includes('chạy bộ') ||
        messageLower.includes('bơi lội') || messageLower.includes('aerobic')) {
        return `🏃‍♂️ **Cardio cho sức khỏe tim mạch:**\n\n` +
            `**🔥 Cardio cường độ cao (HIIT):**\n` +
            `• 20 phút: 30s nhanh + 30s chậm\n` +
            `• Burpees, Jumping Jacks, Mountain Climbers\n` +
            `• Đốt cháy 300-400 calo\n\n` +
            `**🏊‍♀️ Cardio cường độ vừa:**\n` +
            `• Chạy bộ: 30-45 phút\n` +
            `• Bơi lội: 30-60 phút\n` +
            `• Đạp xe: 45-60 phút\n\n` +
            `**📊 Tần suất:**\n` +
            `• Người mới: 3-4 lần/tuần\n` +
            `• Người có kinh nghiệm: 5-6 lần/tuần\n\n` +
            `Bạn muốn tôi tư vấn chương trình cardio phù hợp không?`;
    }

    // Câu hỏi về form tập
    if (messageLower.includes('form') || messageLower.includes('kỹ thuật') ||
        messageLower.includes('đúng cách') || messageLower.includes('sai form')) {
        return `🎯 **Kỹ thuật tập đúng cách:**\n\n` +
            `**✅ Nguyên tắc cơ bản:**\n` +
            `• Khởi động 5-10 phút trước khi tập\n` +
            `• Giữ lưng thẳng, core căng\n` +
            `• Thở đúng: Hít vào khi thả, thở ra khi co\n` +
            `• Tập chậm, kiểm soát chuyển động\n\n` +
            `**⚠️ Lỗi thường gặp:**\n` +
            `• Cong lưng khi squat/deadlift\n` +
            `• Khóa khớp hoàn toàn\n` +
            `• Tập quá nhanh, mất kiểm soát\n` +
            `• Bỏ qua khởi động\n\n` +
            `**💡 Lời khuyên:**\n` +
            `• Bắt đầu với tạ nhẹ để học form\n` +
            `• Quay video để tự kiểm tra\n` +
            `• Nhờ PT hướng dẫn nếu có thể\n\n` +
            `Bạn cần tư vấn kỹ thuật cho bài tập nào cụ thể?`;
    }

    // Câu hỏi về thời gian tập
    if (messageLower.includes('bao lâu') || messageLower.includes('thời gian') ||
        messageLower.includes('duration') || messageLower.includes('tập bao nhiêu')) {
        return `⏱️ **Thời gian tập luyện tối ưu:**\n\n` +
            `**🏋️ Tập sức mạnh:**\n` +
            `• Người mới: 30-45 phút\n` +
            `• Có kinh nghiệm: 45-90 phút\n` +
            `• Tần suất: 3-4 lần/tuần\n\n` +
            `**🏃‍♂️ Cardio:**\n` +
            `• Cường độ vừa: 30-60 phút\n` +
            `• HIIT: 15-30 phút\n` +
            `• Tần suất: 3-5 lần/tuần\n\n` +
            `**🔄 Nghỉ ngơi:**\n` +
            `• Giữa các set: 30-90 giây\n` +
            `• Giữa các bài: 1-3 phút\n` +
            `• Nghỉ giữa các ngày tập: 1-2 ngày\n\n` +
            `**💪 Lịch tập gợi ý:**\n` +
            `• Thứ 2: Thân trên (45 phút)\n` +
            `• Thứ 3: Cardio (30 phút)\n` +
            `• Thứ 4: Thân dưới (45 phút)\n` +
            `• Thứ 5: Nghỉ\n` +
            `• Thứ 6: Full body (60 phút)\n` +
            `• Thứ 7: Cardio (30 phút)\n` +
            `• Chủ nhật: Nghỉ\n\n` +
            `Bạn muốn tôi tạo lịch tập chi tiết hơn không?`;
    }

    return `💪 **Tôi có thể giúp bạn về:**\n\n` +
        `• 🏋️ Gợi ý bài tập phù hợp\n` +
        `• 🎯 Kỹ thuật tập đúng cách\n` +
        `• ⏰ Lịch tập tối ưu\n` +
        `• 🔥 Cardio và HIIT\n` +
        `• 💪 Tập sức mạnh\n` +
        `• 🏃‍♂️ Chạy bộ và bơi lội\n\n` +
        `Bạn muốn tư vấn về chủ đề nào?`;
};

// Xử lý tin nhắn sức khỏe
const handleHealthQuery = async (session, message) => {
    const messageLower = message.toLowerCase();

    // Câu hỏi về BMI
    if (messageLower.includes('bmi') || messageLower.includes('cân nặng') ||
        messageLower.includes('chiều cao') || messageLower.includes('weight')) {
        return `📊 **BMI và sức khỏe:**\n\n` +
            `**📏 Công thức BMI:**\n` +
            `BMI = Cân nặng (kg) / [Chiều cao (m)]²\n\n` +
            `**📈 Phân loại BMI:**\n` +
            `• Dưới 18.5: Thiếu cân\n` +
            `• 18.5-24.9: Bình thường ✅\n` +
            `• 25-29.9: Thừa cân\n` +
            `• Trên 30: Béo phì\n\n` +
            `**💡 Lưu ý:**\n` +
            `• BMI không phản ánh tỷ lệ cơ/mỡ\n` +
            `• Người tập gym có thể có BMI cao nhưng khỏe mạnh\n` +
            `• Nên kết hợp đo body fat %\n\n` +
            `Bạn muốn tôi tính BMI cho bạn không?`;
    }

    // Câu hỏi về mục tiêu
    if (messageLower.includes('mục tiêu') || messageLower.includes('goal') ||
        messageLower.includes('kết quả') || messageLower.includes('target')) {
        return `🎯 **Thiết lập mục tiêu tập luyện:**\n\n` +
            `**📋 Mục tiêu SMART:**\n` +
            `• Specific (Cụ thể): Tăng cơ, giảm mỡ, tăng sức bền\n` +
            `• Measurable (Đo được): Số kg, số cm, thời gian\n` +
            `• Achievable (Khả thi): Phù hợp với khả năng\n` +
            `• Relevant (Liên quan): Phù hợp với nhu cầu\n` +
            `• Time-bound (Có thời hạn): 3 tháng, 6 tháng, 1 năm\n\n` +
            `**🏆 Mục tiêu phổ biến:**\n` +
            `• Giảm cân: 0.5-1kg/tuần\n` +
            `• Tăng cơ: 0.25-0.5kg/tháng\n` +
            `• Tăng sức mạnh: 5-10% mỗi tháng\n` +
            `• Cải thiện sức bền: 10-20% mỗi tháng\n\n` +
            `**📊 Theo dõi tiến độ:**\n` +
            `• Đo cân nặng hàng tuần\n` +
            `• Chụp ảnh so sánh hàng tháng\n` +
            `• Ghi nhật ký tập luyện\n` +
            `• Đo body fat % định kỳ\n\n` +
            `Bạn có mục tiêu cụ thể nào muốn đạt được không?`;
    }

    // Câu hỏi về chấn thương
    if (messageLower.includes('chấn thương') || messageLower.includes('đau') ||
        messageLower.includes('injury') || messageLower.includes('hurt')) {
        return `🏥 **Xử lý chấn thương tập luyện:**\n\n` +
            `**🚨 Nguyên tắc RICE:**\n` +
            `• Rest (Nghỉ ngơi): Dừng hoạt động gây đau\n` +
            `• Ice (Chườm đá): 15-20 phút, 3-4 lần/ngày\n` +
            `• Compression (Băng ép): Giảm sưng\n` +
            `• Elevation (Nâng cao): Giảm sưng\n\n` +
            `**⚠️ Dấu hiệu cần đi bác sĩ:**\n` +
            `• Đau dữ dội, không giảm sau 48h\n` +
            `• Sưng, bầm tím nghiêm trọng\n` +
            `• Không thể cử động khớp\n` +
            `• Sốt, mệt mỏi bất thường\n\n` +
            `**🔄 Phòng ngừa chấn thương:**\n` +
            `• Khởi động đầy đủ trước khi tập\n` +
            `• Tăng tải trọng từ từ\n` +
            `• Tập đúng kỹ thuật\n` +
            `• Nghỉ ngơi đủ giữa các buổi tập\n\n` +
            `**💪 Tập luyện an toàn:**\n` +
            `• Bắt đầu với tạ nhẹ\n` +
            `• Tập với spotter khi cần\n` +
            `• Lắng nghe cơ thể\n` +
            `• Không tập khi quá mệt\n\n` +
            `Bạn đang gặp vấn đề gì cụ thể? Tôi có thể tư vấn cách xử lý.`;
    }

    return `🏥 **Tôi có thể tư vấn về:**\n\n` +
        `• 📊 BMI và cân nặng lý tưởng\n` +
        `• 🎯 Thiết lập mục tiêu tập luyện\n` +
        `• 🏥 Xử lý chấn thương và phòng ngừa\n` +
        `• 💪 Theo dõi tiến độ và kết quả\n` +
        `• 🧘‍♀️ Sức khỏe tinh thần và stress\n` +
        `• 😴 Giấc ngủ và phục hồi\n\n` +
        `Bạn cần tư vấn về chủ đề nào?`;
};

// Cải thiện phân tích intent dựa trên ngữ cảnh
const enhanceIntentAnalysis = (intentAnalysis, session, message) => {
    const messageLower = message.toLowerCase();

    // Kiểm tra ngữ cảnh từ cuộc trò chuyện trước
    const recentMessages = session.messages.slice(-3);
    const hasRecentNutritionContext = recentMessages.some(msg =>
        msg.context === 'nutrition' || msg.intent === 'nutrition_advice'
    );
    const hasRecentWorkoutContext = recentMessages.some(msg =>
        msg.context === 'workout' || msg.intent === 'workout_advice'
    );
    const hasRecentHealthContext = recentMessages.some(msg =>
        msg.context === 'health' || msg.intent === 'health_consultation'
    );

    // Từ khóa chuyển đổi ngữ cảnh
    const contextSwitchKeywords = [
        'chuyển sang', 'bây giờ', 'tiếp theo', 'còn gì nữa', 'khác',
        'ngoài ra', 'thêm nữa', 'cũng', 'và', 'cùng với'
    ];

    // Nếu có từ khóa chuyển đổi và ngữ cảnh gần đây
    if (contextSwitchKeywords.some(keyword => messageLower.includes(keyword))) {
        if (hasRecentNutritionContext && messageLower.includes('tập')) {
            return {
                ...intentAnalysis,
                intent: 'workout_advice',
                context: 'workout',
                confidence: Math.min(0.9, intentAnalysis.confidence + 0.2)
            };
        }
        if (hasRecentWorkoutContext && (messageLower.includes('ăn') || messageLower.includes('dinh dưỡng'))) {
            return {
                ...intentAnalysis,
                intent: 'nutrition_advice',
                context: 'nutrition',
                confidence: Math.min(0.9, intentAnalysis.confidence + 0.2)
            };
        }
    }

    // Cải thiện confidence dựa trên ngữ cảnh
    if (intentAnalysis.confidence < 0.7) {
        if (hasRecentNutritionContext && intentAnalysis.intent === 'nutrition_advice') {
            intentAnalysis.confidence = Math.min(0.9, intentAnalysis.confidence + 0.3);
        }
        if (hasRecentWorkoutContext && intentAnalysis.intent === 'workout_advice') {
            intentAnalysis.confidence = Math.min(0.9, intentAnalysis.confidence + 0.3);
        }
        if (hasRecentHealthContext && intentAnalysis.intent === 'health_consultation') {
            intentAnalysis.confidence = Math.min(0.9, intentAnalysis.confidence + 0.3);
        }
    }

    // Xử lý câu hỏi follow-up
    const followUpKeywords = [
        'còn gì nữa', 'thêm nữa', 'khác', 'nữa', 'tiếp', 'sau đó',
        'rồi sao', 'thế thì', 'vậy thì', 'ok', 'được', 'tốt'
    ];

    if (followUpKeywords.some(keyword => messageLower.includes(keyword))) {
        // Giữ nguyên intent từ ngữ cảnh gần đây
        if (hasRecentNutritionContext) {
            return {
                ...intentAnalysis,
                intent: 'nutrition_advice',
                context: 'nutrition',
                confidence: 0.8
            };
        }
        if (hasRecentWorkoutContext) {
            return {
                ...intentAnalysis,
                intent: 'workout_advice',
                context: 'workout',
                confidence: 0.8
            };
        }
        if (hasRecentHealthContext) {
            return {
                ...intentAnalysis,
                intent: 'health_consultation',
                context: 'health',
                confidence: 0.8
            };
        }
    }

    return intentAnalysis;
};

// Lấy thông tin profile người dùng
const getUserProfile = async (hoiVienId) => {
    try {
        const hoiVien = await HoiVien.findById(hoiVienId);
        const chiSoCoThe = await ChiSoCoThe.findOne({ hoiVien: hoiVienId }).sort({ ngayDo: -1 });
        const lichSuTap = await LichSuTap.find({ hoiVien: hoiVienId }).sort({ ngayTap: -1 }).limit(7);

        const tuoi = hoiVien.ngaySinh ?
            new Date().getFullYear() - new Date(hoiVien.ngaySinh).getFullYear() : null;

        return {
            mucTieu: chiSoCoThe?.mucTieu || 'DUY_TRI',
            hoatDongTap: lichSuTap.length >= 4 ? 'HOAT_DONG_MANH' :
                lichSuTap.length >= 2 ? 'HOAT_DONG_VUA' : 'HOAT_DONG_NHE',
            canNang: chiSoCoThe?.canNang,
            chieuCao: chiSoCoThe?.chieuCao,
            gioiTinh: hoiVien.gioiTinh,
            tuoi: tuoi
        };
    } catch (error) {
        console.error('Lỗi lấy profile người dùng:', error);
        return {};
    }
};

// Xử lý tin nhắn chính
const processMessage = async (hoiVienId, message) => {
    try {
        // Lấy session hiện tại
        const session = await getCurrentSession(hoiVienId);

        // Lấy profile người dùng
        const userProfile = await getUserProfile(hoiVienId);

        // Phân tích intent với ML model
        const intentAnalysis = await analyzeIntentWithML(message);

        // Cải thiện phân tích dựa trên ngữ cảnh
        const enhancedAnalysis = enhanceIntentAnalysis(intentAnalysis, session, message);

        // Thêm tin nhắn người dùng vào session
        session.messages.push({
            type: 'user',
            content: message,
            context: enhancedAnalysis.context,
            intent: enhancedAnalysis.intent
        });

        // Xử lý tin nhắn dựa trên intent
        let botResponse = '';

        switch (enhancedAnalysis.intent) {
            case 'nutrition_advice':
                botResponse = await handleNutritionQuery(session, message, userProfile);
                break;
            case 'workout_advice':
                botResponse = await handleWorkoutQuery(session, message);
                break;
            case 'membership_info':
                botResponse = await handleMembershipQuery(session, message);
                break;
            case 'booking_help':
                botResponse = await handleBookingQuery(session, message);
                break;
            case 'health_consultation':
                botResponse = await handleHealthQuery(session, message);
                break;
            case 'feedback':
                botResponse = "Cảm ơn bạn đã góp ý! Tôi sẽ chuyển phản hồi của bạn đến đội ngũ quản lý. Bạn có thể gửi phản hồi chi tiết hơn không?";
                break;
            case 'greeting':
                botResponse = "Xin chào! 👋 Tôi là AI trợ lý của Billions Gym. Tôi có thể giúp bạn về dinh dưỡng, tập luyện, gói tập và nhiều hơn nữa. Bạn cần hỗ trợ gì hôm nay?";
                break;
            default:
                botResponse = await handleGeneralQuery(session, message);
        }

        // Thêm phản hồi bot vào session
        session.messages.push({
            type: 'bot',
            content: botResponse,
            context: enhancedAnalysis.context,
            intent: enhancedAnalysis.intent,
            confidence: enhancedAnalysis.confidence || 0.8,
            entities: enhancedAnalysis.entities || {}
        });

        // Cập nhật context hiện tại
        session.currentContext = enhancedAnalysis.context;
        session.lastActivity = new Date();

        // Lưu session
        await session.save();

        return {
            success: true,
            response: botResponse,
            context: enhancedAnalysis.context,
            sessionId: session.sessionId
        };

    } catch (error) {
        console.error('Lỗi xử lý tin nhắn chatbot:', error);
        return {
            success: false,
            response: "Xin lỗi, tôi gặp sự cố kỹ thuật. Vui lòng thử lại sau.",
            context: 'general',
            sessionId: null
        };
    }
};

// Lấy lịch sử chat
const getChatHistory = async (hoiVienId, limit = 50) => {
    try {
        const session = await getCurrentSession(hoiVienId);

        return {
            success: true,
            messages: session.messages.slice(-limit),
            sessionId: session.sessionId,
            currentContext: session.currentContext
        };
    } catch (error) {
        console.error('Lỗi lấy lịch sử chat:', error);
        throw error;
    }
};

// Đóng session
const closeSession = async (hoiVienId) => {
    try {
        await ChatbotSession.updateOne(
            { hoiVien: hoiVienId, isActive: true },
            { isActive: false }
        );

        return { success: true };
    } catch (error) {
        console.error('Lỗi đóng session:', error);
        throw error;
    }
};

/**
 * Phân tích intent với ML model
 */
const analyzeIntentWithML = async (message) => {
    try {
        // Import ML training service
        const mlTrainingService = require('./mlTraining.service');

        // Tạo dataset và model
        const dataset = await mlTrainingService.createTrainingDataset();
        const model = await mlTrainingService.trainModel(dataset.trainData);

        // Predict intent
        const intentPrediction = model.intentModel.predict(message);
        const entities = model.entityModel.extract(message);

        return {
            intent: intentPrediction.intent,
            confidence: intentPrediction.confidence,
            entities: entities,
            context: intentPrediction.intent
        };

    } catch (error) {
        console.error('Lỗi ML intent analysis:', error);
        // Fallback to simple intent analysis
        const simpleAnalysis = analyzeIntent(message);
        return {
            intent: simpleAnalysis.intent,
            confidence: 0.7,
            entities: {},
            context: simpleAnalysis.context
        };
    }
};

module.exports = {
    createChatbotSession,
    getCurrentSession,
    processMessage,
    getChatHistory,
    closeSession,
    getUserProfile,
    analyzeIntentWithML
};
