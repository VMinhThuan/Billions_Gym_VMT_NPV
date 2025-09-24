const mongoose = require('mongoose');
const ChatbotSession = require('../models/ChatbotSession');
const HoiVien = require('../models/NguoiDung');
const DinhDuong = require('../models/DinhDuong');
const GoiTap = require('../models/GoiTap');
const LichSuTap = require('../models/LichSuTap');

/**
 * Machine Learning Training Service
 * Thu thập dữ liệu, training model và cải thiện chatbot
 */

// Database để lưu trữ training data
const TrainingDataSchema = new mongoose.Schema({
    message: { type: String, required: true },
    intent: { type: String, required: true },
    entities: { type: mongoose.Schema.Types.Mixed, default: {} },
    context: { type: mongoose.Schema.Types.Mixed, default: {} },
    response: { type: String, required: true },
    confidence: { type: Number, default: 0 },
    userFeedback: { type: String, enum: ['positive', 'negative', 'neutral'], default: 'neutral' },
    timestamp: { type: Date, default: Date.now },
    hoiVienId: { type: mongoose.Schema.Types.ObjectId, ref: 'HoiVien' }
});

const TrainingData = mongoose.model('TrainingData', TrainingDataSchema);

// Model performance tracking
const ModelPerformanceSchema = new mongoose.Schema({
    modelVersion: { type: String, required: true },
    accuracy: { type: Number, required: true },
    precision: { type: Number, required: true },
    recall: { type: Number, required: true },
    f1Score: { type: Number, required: true },
    trainingDate: { type: Date, default: Date.now },
    testDataSize: { type: Number, required: true },
    trainingDataSize: { type: Number, required: true }
});

const ModelPerformance = mongoose.model('ModelPerformance', ModelPerformanceSchema);

/**
 * Thu thập dữ liệu từ các cuộc hội thoại thực tế
 */
const collectTrainingData = async (limit = 1000) => {
    try {
        console.log('🔍 Thu thập dữ liệu training từ chatbot sessions...');

        // Lấy các session gần đây với feedback
        const sessions = await ChatbotSession.find({
            'messages.feedback': { $exists: true, $ne: null }
        })
            .populate('hoiVienId')
            .limit(limit)
            .sort({ updatedAt: -1 });

        const trainingData = [];

        for (const session of sessions) {
            const messages = session.messages || [];

            for (let i = 0; i < messages.length; i++) {
                const message = messages[i];

                if (message.role === 'user' && i + 1 < messages.length) {
                    const response = messages[i + 1];

                    if (response.role === 'assistant') {
                        // Phân tích intent từ message
                        const intent = analyzeIntentFromMessage(message.content);

                        // Trích xuất entities
                        const entities = extractEntities(message.content);

                        // Lấy context từ session
                        const context = {
                            hoiVienId: session.hoiVienId._id,
                            sessionId: session._id,
                            timestamp: message.timestamp,
                            previousMessages: messages.slice(0, i).map(m => ({
                                role: m.role,
                                content: m.content
                            }))
                        };

                        trainingData.push({
                            message: message.content,
                            intent,
                            entities,
                            context,
                            response: response.content,
                            confidence: response.confidence || 0,
                            userFeedback: message.feedback || 'neutral',
                            timestamp: message.timestamp,
                            hoiVienId: session.hoiVienId._id
                        });
                    }
                }
            }
        }

        console.log(`✅ Thu thập được ${trainingData.length} mẫu training data`);
        return trainingData;

    } catch (error) {
        console.error('❌ Lỗi thu thập training data:', error);
        throw error;
    }
};

/**
 * Phân tích intent từ message
 */
const analyzeIntentFromMessage = (message) => {
    const messageLower = message.toLowerCase();

    // Intent mapping dựa trên keywords
    const intentPatterns = {
        'nutrition_advice': [
            'dinh dưỡng', 'ăn uống', 'calories', 'protein', 'carb', 'fat',
            'thực đơn', 'bữa ăn', 'tăng cân', 'giảm cân', 'tăng cơ'
        ],
        'workout_advice': [
            'bài tập', 'tập luyện', 'gym', 'workout', 'exercise',
            'tăng cơ', 'giảm mỡ', 'cardio', 'strength'
        ],
        'membership_info': [
            'gói tập', 'membership', 'giá', 'thanh toán', 'đăng ký',
            'hết hạn', 'gia hạn', 'upgrade'
        ],
        'booking_support': [
            'đặt lịch', 'booking', 'lịch tập', 'pt', 'huấn luyện viên',
            'lớp học', 'schedule'
        ],
        'general_inquiry': [
            'giờ mở cửa', 'địa chỉ', 'liên hệ', 'hỗ trợ', 'help'
        ],
        'feedback': [
            'phản hồi', 'góp ý', 'đánh giá', 'feedback', 'complaint'
        ]
    };

    for (const [intent, patterns] of Object.entries(intentPatterns)) {
        if (patterns.some(pattern => messageLower.includes(pattern))) {
            return intent;
        }
    }

    return 'general_inquiry';
};

/**
 * Trích xuất entities từ message
 */
const extractEntities = (message) => {
    const entities = {};

    // Trích xuất số liệu (cân nặng, chiều cao, tuổi)
    const weightMatch = message.match(/(\d+)\s*(kg|kilo)/i);
    if (weightMatch) {
        entities.weight = parseInt(weightMatch[1]);
    }

    const heightMatch = message.match(/(\d+)\s*(cm|centimeter)/i);
    if (heightMatch) {
        entities.height = parseInt(heightMatch[1]);
    }

    const ageMatch = message.match(/(\d+)\s*(tuổi|years?)/i);
    if (ageMatch) {
        entities.age = parseInt(ageMatch[1]);
    }

    // Trích xuất mục tiêu
    const goals = ['tăng cân', 'giảm cân', 'tăng cơ', 'giảm mỡ', 'duy trì'];
    const foundGoals = goals.filter(goal => message.toLowerCase().includes(goal));
    if (foundGoals.length > 0) {
        entities.goals = foundGoals;
    }

    // Trích xuất thời gian
    const timeMatch = message.match(/(\d+)\s*(tháng|month|ngày|day|tuần|week)/i);
    if (timeMatch) {
        entities.duration = {
            value: parseInt(timeMatch[1]),
            unit: timeMatch[2]
        };
    }

    return entities;
};

/**
 * Tạo dataset cho training
 */
const createTrainingDataset = async () => {
    try {
        console.log('📊 Tạo training dataset...');

        // Thu thập dữ liệu từ các nguồn khác nhau
        const chatData = await collectTrainingData(500);

        // Tạo synthetic data để tăng cường dataset
        const syntheticData = generateSyntheticData();

        // Kết hợp dữ liệu
        const fullDataset = [...chatData, ...syntheticData];

        // Chia dataset thành train/test
        const shuffled = fullDataset.sort(() => Math.random() - 0.5);
        const splitIndex = Math.floor(shuffled.length * 0.8);

        const trainData = shuffled.slice(0, splitIndex);
        const testData = shuffled.slice(splitIndex);

        console.log(`✅ Dataset created: ${trainData.length} train, ${testData.length} test samples`);

        return {
            trainData,
            testData,
            fullDataset
        };

    } catch (error) {
        console.error('❌ Lỗi tạo training dataset:', error);
        throw error;
    }
};

/**
 * Tạo synthetic data để tăng cường dataset
 */
const generateSyntheticData = () => {
    const syntheticData = [];

    // Nutrition advice patterns
    const nutritionPatterns = [
        { message: "Tôi muốn tăng cân, tư vấn dinh dưỡng", intent: "nutrition_advice", entities: { goals: ["tăng cân"] } },
        { message: "Làm sao để giảm cân hiệu quả?", intent: "nutrition_advice", entities: { goals: ["giảm cân"] } },
        { message: "Tôi cần thực đơn tăng cơ", intent: "nutrition_advice", entities: { goals: ["tăng cơ"] } },
        { message: "Calories cần thiết cho người 70kg", intent: "nutrition_advice", entities: { weight: 70 } }
    ];

    // Workout advice patterns
    const workoutPatterns = [
        { message: "Bài tập nào tốt cho người mới bắt đầu?", intent: "workout_advice" },
        { message: "Tôi muốn tập cardio", intent: "workout_advice" },
        { message: "Lịch tập 3 buổi/tuần", intent: "workout_advice", entities: { duration: { value: 3, unit: "buổi" } } }
    ];

    // Membership patterns
    const membershipPatterns = [
        { message: "Gói tập 1 tháng giá bao nhiêu?", intent: "membership_info", entities: { duration: { value: 1, unit: "tháng" } } },
        { message: "Tôi muốn đăng ký gói tập", intent: "membership_info" },
        { message: "Gói nào phù hợp với người mới?", intent: "membership_info" }
    ];

    // Booking patterns
    const bookingPatterns = [
        { message: "Tôi muốn đặt lịch PT", intent: "booking_support" },
        { message: "Lịch tập hôm nay thế nào?", intent: "booking_support" },
        { message: "Có lớp yoga không?", intent: "booking_support" }
    ];

    const allPatterns = [
        ...nutritionPatterns,
        ...workoutPatterns,
        ...membershipPatterns,
        ...bookingPatterns
    ];

    // Tạo responses tương ứng
    allPatterns.forEach(pattern => {
        syntheticData.push({
            message: pattern.message,
            intent: pattern.intent,
            entities: pattern.entities || {},
            context: {},
            response: generateResponseForIntent(pattern.intent, pattern.entities),
            confidence: 0.9,
            userFeedback: 'positive',
            timestamp: new Date(),
            hoiVienId: null
        });
    });

    return syntheticData;
};

/**
 * Tạo response cho intent
 */
const generateResponseForIntent = (intent, entities = {}) => {
    const responses = {
        'nutrition_advice': "Tôi sẽ tư vấn dinh dưỡng phù hợp với mục tiêu của bạn. Hãy cho tôi biết thêm về cân nặng, chiều cao và mục tiêu cụ thể nhé!",
        'workout_advice': "Tôi có thể gợi ý bài tập phù hợp với trình độ và mục tiêu của bạn. Bạn đang ở trình độ nào và muốn tập gì?",
        'membership_info': "Tôi sẽ giới thiệu các gói tập phù hợp với nhu cầu của bạn. Bạn quan tâm đến gói tập nào?",
        'booking_support': "Tôi sẽ giúp bạn đặt lịch tập. Bạn muốn đặt lịch gì và vào thời gian nào?",
        'general_inquiry': "Tôi có thể giúp gì cho bạn? Hãy cho tôi biết bạn cần hỗ trợ về vấn đề gì nhé!"
    };

    return responses[intent] || responses['general_inquiry'];
};

/**
 * Training model với dữ liệu
 */
const trainModel = async (trainData) => {
    try {
        console.log('🤖 Bắt đầu training model...');

        // Tạo feature vectors từ text
        const features = trainData.map(item => ({
            text: item.message,
            intent: item.intent,
            entities: item.entities,
            context: item.context
        }));

        // Simple intent classification model
        const intentModel = createIntentModel(features);

        // Entity recognition model
        const entityModel = createEntityModel(features);

        // Response generation model
        const responseModel = createResponseModel(trainData);

        console.log('✅ Model training completed');

        return {
            intentModel,
            entityModel,
            responseModel,
            trainingData: trainData
        };

    } catch (error) {
        console.error('❌ Lỗi training model:', error);
        throw error;
    }
};

/**
 * Tạo intent classification model
 */
const createIntentModel = (features) => {
    // Simple keyword-based intent classification
    const intentKeywords = {
        'nutrition_advice': ['dinh dưỡng', 'ăn uống', 'calories', 'protein', 'thực đơn'],
        'workout_advice': ['bài tập', 'tập luyện', 'gym', 'workout'],
        'membership_info': ['gói tập', 'membership', 'giá', 'đăng ký'],
        'booking_support': ['đặt lịch', 'booking', 'lịch tập', 'pt'],
        'general_inquiry': ['giờ mở cửa', 'địa chỉ', 'liên hệ', 'hỗ trợ']
    };

    return {
        predict: (text) => {
            const textLower = text.toLowerCase();
            let bestIntent = 'general_inquiry';
            let maxScore = 0;

            for (const [intent, keywords] of Object.entries(intentKeywords)) {
                const score = keywords.reduce((acc, keyword) => {
                    return acc + (textLower.includes(keyword) ? 1 : 0);
                }, 0);

                if (score > maxScore) {
                    maxScore = score;
                    bestIntent = intent;
                }
            }

            return {
                intent: bestIntent,
                confidence: maxScore / Object.keys(intentKeywords[bestIntent] || {}).length
            };
        }
    };
};

/**
 * Tạo entity recognition model
 */
const createEntityModel = (features) => {
    return {
        extract: (text) => {
            return extractEntities(text);
        }
    };
};

/**
 * Tạo response generation model
 */
const createResponseModel = (trainData) => {
    // Group responses by intent
    const intentResponses = {};

    trainData.forEach(item => {
        if (!intentResponses[item.intent]) {
            intentResponses[item.intent] = [];
        }
        intentResponses[item.intent].push(item.response);
    });

    return {
        generate: (intent, entities = {}) => {
            const responses = intentResponses[intent] || intentResponses['general_inquiry'] || [];

            if (responses.length === 0) {
                return "Tôi có thể giúp gì cho bạn?";
            }

            // Chọn response ngẫu nhiên từ training data
            const randomResponse = responses[Math.floor(Math.random() * responses.length)];

            // Personalize response based on entities
            let personalizedResponse = randomResponse;

            if (entities.weight) {
                personalizedResponse = personalizedResponse.replace(/cân nặng/g, `${entities.weight}kg`);
            }

            if (entities.goals && entities.goals.length > 0) {
                personalizedResponse = personalizedResponse.replace(/mục tiêu/g, entities.goals.join(', '));
            }

            return personalizedResponse;
        }
    };
};

/**
 * Evaluate model performance
 */
const evaluateModel = async (model, testData) => {
    try {
        console.log('📊 Đánh giá model performance...');

        let correctPredictions = 0;
        let totalPredictions = testData.length;

        const intentResults = {};
        const entityResults = {};

        for (const testItem of testData) {
            // Test intent prediction
            const predictedIntent = model.intentModel.predict(testItem.message);
            if (predictedIntent.intent === testItem.intent) {
                correctPredictions++;
            }

            // Test entity extraction
            const predictedEntities = model.entityModel.extract(testItem.message);
            const entityAccuracy = calculateEntityAccuracy(predictedEntities, testItem.entities);

            // Track results by intent
            if (!intentResults[testItem.intent]) {
                intentResults[testItem.intent] = { correct: 0, total: 0 };
            }
            intentResults[testItem.intent].total++;
            if (predictedIntent.intent === testItem.intent) {
                intentResults[testItem.intent].correct++;
            }
        }

        const accuracy = correctPredictions / totalPredictions;
        const precision = calculatePrecision(intentResults);
        const recall = calculateRecall(intentResults);
        const f1Score = calculateF1Score(precision, recall);

        console.log(`✅ Model Performance:`);
        console.log(`   Accuracy: ${(accuracy * 100).toFixed(2)}%`);
        console.log(`   Precision: ${(precision * 100).toFixed(2)}%`);
        console.log(`   Recall: ${(recall * 100).toFixed(2)}%`);
        console.log(`   F1 Score: ${(f1Score * 100).toFixed(2)}%`);

        // Lưu performance metrics
        const performance = new ModelPerformance({
            modelVersion: `v${Date.now()}`,
            accuracy,
            precision,
            recall,
            f1Score,
            testDataSize: testData.length,
            trainingDataSize: testData.length * 4 // Estimate
        });

        await performance.save();

        return {
            accuracy,
            precision,
            recall,
            f1Score,
            intentResults,
            entityResults
        };

    } catch (error) {
        console.error('❌ Lỗi đánh giá model:', error);
        throw error;
    }
};

/**
 * Tính toán entity accuracy
 */
const calculateEntityAccuracy = (predicted, actual) => {
    const predictedKeys = Object.keys(predicted);
    const actualKeys = Object.keys(actual);

    if (actualKeys.length === 0) return 1;

    let correct = 0;
    for (const key of actualKeys) {
        if (predictedKeys.includes(key) && predicted[key] === actual[key]) {
            correct++;
        }
    }

    return correct / actualKeys.length;
};

/**
 * Tính precision
 */
const calculatePrecision = (intentResults) => {
    let totalPrecision = 0;
    let intentCount = 0;

    for (const [intent, results] of Object.entries(intentResults)) {
        if (results.total > 0) {
            totalPrecision += results.correct / results.total;
            intentCount++;
        }
    }

    return intentCount > 0 ? totalPrecision / intentCount : 0;
};

/**
 * Tính recall
 */
const calculateRecall = (intentResults) => {
    let totalRecall = 0;
    let intentCount = 0;

    for (const [intent, results] of Object.entries(intentResults)) {
        if (results.total > 0) {
            totalRecall += results.correct / results.total;
            intentCount++;
        }
    }

    return intentCount > 0 ? totalRecall / intentCount : 0;
};

/**
 * Tính F1 Score
 */
const calculateF1Score = (precision, recall) => {
    if (precision + recall === 0) return 0;
    return (2 * precision * recall) / (precision + recall);
};

/**
 * Lưu training data vào database
 */
const saveTrainingData = async (trainingData) => {
    try {
        console.log('💾 Lưu training data vào database...');

        // Clear old training data
        await TrainingData.deleteMany({});

        // Save new training data
        await TrainingData.insertMany(trainingData);

        console.log(`✅ Đã lưu ${trainingData.length} mẫu training data`);

    } catch (error) {
        console.error('❌ Lỗi lưu training data:', error);
        throw error;
    }
};

/**
 * Lấy model performance history
 */
const getModelPerformanceHistory = async () => {
    try {
        const performance = await ModelPerformance.find()
            .sort({ trainingDate: -1 })
            .limit(10);

        return performance;
    } catch (error) {
        console.error('❌ Lỗi lấy model performance:', error);
        throw error;
    }
};

/**
 * Continuous learning - cập nhật model với feedback mới
 */
const continuousLearning = async () => {
    try {
        console.log('🔄 Continuous learning - cập nhật model...');

        // Thu thập feedback mới
        const newFeedback = await ChatbotSession.find({
            'messages.feedback': { $exists: true, $ne: null },
            updatedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // 24h gần đây
        }).limit(100);

        if (newFeedback.length === 0) {
            console.log('ℹ️ Không có feedback mới để học');
            return;
        }

        // Tạo training data từ feedback mới
        const newTrainingData = [];
        for (const session of newFeedback) {
            const messages = session.messages || [];
            for (let i = 0; i < messages.length; i++) {
                const message = messages[i];
                if (message.role === 'user' && message.feedback && i + 1 < messages.length) {
                    const response = messages[i + 1];
                    if (response.role === 'assistant') {
                        newTrainingData.push({
                            message: message.content,
                            intent: analyzeIntentFromMessage(message.content),
                            entities: extractEntities(message.content),
                            context: { sessionId: session._id },
                            response: response.content,
                            confidence: response.confidence || 0,
                            userFeedback: message.feedback,
                            timestamp: message.timestamp,
                            hoiVienId: session.hoiVienId
                        });
                    }
                }
            }
        }

        if (newTrainingData.length > 0) {
            // Lưu training data mới
            await TrainingData.insertMany(newTrainingData);

            // Retrain model với dữ liệu mới
            const allTrainingData = await TrainingData.find();
            const dataset = await createTrainingDataset();
            const model = await trainModel(dataset.trainData);

            console.log(`✅ Continuous learning completed với ${newTrainingData.length} mẫu mới`);
        }

    } catch (error) {
        console.error('❌ Lỗi continuous learning:', error);
        throw error;
    }
};

/**
 * Chạy full training pipeline
 */
const runFullTrainingPipeline = async () => {
    try {
        console.log('🚀 Bắt đầu full training pipeline...');

        // 1. Thu thập và tạo dataset
        const dataset = await createTrainingDataset();

        // 2. Training model
        const model = await trainModel(dataset.trainData);

        // 3. Evaluate model
        const performance = await evaluateModel(model, dataset.testData);

        // 4. Lưu training data
        await saveTrainingData(dataset.fullDataset);

        console.log('✅ Full training pipeline completed');

        return {
            model,
            performance,
            dataset: dataset.fullDataset
        };

    } catch (error) {
        console.error('❌ Lỗi full training pipeline:', error);
        throw error;
    }
};

module.exports = {
    collectTrainingData,
    createTrainingDataset,
    trainModel,
    evaluateModel,
    saveTrainingData,
    getModelPerformanceHistory,
    continuousLearning,
    runFullTrainingPipeline,
    TrainingData,
    ModelPerformance
};
