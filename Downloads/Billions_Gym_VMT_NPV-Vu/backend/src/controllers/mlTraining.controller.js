const mlTrainingService = require('../services/mlTraining.service');

/**
 * ML Training Controller
 * API endpoints cho machine learning training system
 */

/**
 * Chạy full training pipeline
 */
const runFullTraining = async (req, res) => {
    try {
        console.log('🚀 API: Bắt đầu full training pipeline...');
        
        const result = await mlTrainingService.runFullTrainingPipeline();
        
        res.status(200).json({
            success: true,
            message: 'Full training pipeline completed successfully',
            data: {
                modelVersion: result.performance.modelVersion,
                accuracy: result.performance.accuracy,
                precision: result.performance.precision,
                recall: result.performance.recall,
                f1Score: result.performance.f1Score,
                trainingDataSize: result.dataset.length,
                testDataSize: result.performance.testDataSize
            }
        });

    } catch (error) {
        console.error('❌ API: Lỗi full training:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi chạy full training pipeline',
            error: error.message
        });
    }
};

/**
 * Thu thập training data
 */
const collectTrainingData = async (req, res) => {
    try {
        const { limit = 1000 } = req.query;
        
        console.log(`🔍 API: Thu thập training data (limit: ${limit})...`);
        
        const trainingData = await mlTrainingService.collectTrainingData(parseInt(limit));
        
        res.status(200).json({
            success: true,
            message: 'Training data collected successfully',
            data: {
                count: trainingData.length,
                samples: trainingData.slice(0, 10), // Show first 10 samples
                intents: [...new Set(trainingData.map(item => item.intent))],
                feedbackDistribution: {
                    positive: trainingData.filter(item => item.userFeedback === 'positive').length,
                    negative: trainingData.filter(item => item.userFeedback === 'negative').length,
                    neutral: trainingData.filter(item => item.userFeedback === 'neutral').length
                }
            }
        });

    } catch (error) {
        console.error('❌ API: Lỗi thu thập training data:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi thu thập training data',
            error: error.message
        });
    }
};

/**
 * Tạo training dataset
 */
const createDataset = async (req, res) => {
    try {
        console.log('📊 API: Tạo training dataset...');
        
        const dataset = await mlTrainingService.createTrainingDataset();
        
        res.status(200).json({
            success: true,
            message: 'Training dataset created successfully',
            data: {
                trainSize: dataset.trainData.length,
                testSize: dataset.testData.length,
                totalSize: dataset.fullDataset.length,
                intents: [...new Set(dataset.fullDataset.map(item => item.intent))],
                trainDataSample: dataset.trainData.slice(0, 5),
                testDataSample: dataset.testData.slice(0, 5)
            }
        });

    } catch (error) {
        console.error('❌ API: Lỗi tạo dataset:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo training dataset',
            error: error.message
        });
    }
};

/**
 * Training model
 */
const trainModel = async (req, res) => {
    try {
        console.log('🤖 API: Training model...');
        
        const dataset = await mlTrainingService.createTrainingDataset();
        const model = await mlTrainingService.trainModel(dataset.trainData);
        
        res.status(200).json({
            success: true,
            message: 'Model training completed successfully',
            data: {
                modelType: 'Intent Classification + Entity Recognition + Response Generation',
                trainingDataSize: dataset.trainData.length,
                intents: Object.keys(model.intentModel.predict('test').intent || {}),
                features: ['text', 'intent', 'entities', 'context']
            }
        });

    } catch (error) {
        console.error('❌ API: Lỗi training model:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi training model',
            error: error.message
        });
    }
};

/**
 * Evaluate model
 */
const evaluateModel = async (req, res) => {
    try {
        console.log('📊 API: Đánh giá model...');
        
        const dataset = await mlTrainingService.createTrainingDataset();
        const model = await mlTrainingService.trainModel(dataset.trainData);
        const performance = await mlTrainingService.evaluateModel(model, dataset.testData);
        
        res.status(200).json({
            success: true,
            message: 'Model evaluation completed successfully',
            data: {
                accuracy: performance.accuracy,
                precision: performance.precision,
                recall: performance.recall,
                f1Score: performance.f1Score,
                testDataSize: performance.testDataSize,
                intentResults: performance.intentResults,
                metrics: {
                    accuracy: `${(performance.accuracy * 100).toFixed(2)}%`,
                    precision: `${(performance.precision * 100).toFixed(2)}%`,
                    recall: `${(performance.recall * 100).toFixed(2)}%`,
                    f1Score: `${(performance.f1Score * 100).toFixed(2)}%`
                }
            }
        });

    } catch (error) {
        console.error('❌ API: Lỗi đánh giá model:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi đánh giá model',
            error: error.message
        });
    }
};

/**
 * Lưu training data
 */
const saveTrainingData = async (req, res) => {
    try {
        console.log('💾 API: Lưu training data...');
        
        const dataset = await mlTrainingService.createTrainingDataset();
        await mlTrainingService.saveTrainingData(dataset.fullDataset);
        
        res.status(200).json({
            success: true,
            message: 'Training data saved successfully',
            data: {
                savedCount: dataset.fullDataset.length,
                intents: [...new Set(dataset.fullDataset.map(item => item.intent))],
                feedbackDistribution: {
                    positive: dataset.fullDataset.filter(item => item.userFeedback === 'positive').length,
                    negative: dataset.fullDataset.filter(item => item.userFeedback === 'negative').length,
                    neutral: dataset.fullDataset.filter(item => item.userFeedback === 'neutral').length
                }
            }
        });

    } catch (error) {
        console.error('❌ API: Lỗi lưu training data:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lưu training data',
            error: error.message
        });
    }
};

/**
 * Lấy model performance history
 */
const getPerformanceHistory = async (req, res) => {
    try {
        console.log('📈 API: Lấy model performance history...');
        
        const performanceHistory = await mlTrainingService.getModelPerformanceHistory();
        
        res.status(200).json({
            success: true,
            message: 'Model performance history retrieved successfully',
            data: {
                history: performanceHistory,
                latest: performanceHistory[0] || null,
                improvement: performanceHistory.length > 1 ? 
                    performanceHistory[0].accuracy - performanceHistory[1].accuracy : 0
            }
        });

    } catch (error) {
        console.error('❌ API: Lỗi lấy performance history:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy model performance history',
            error: error.message
        });
    }
};

/**
 * Continuous learning
 */
const continuousLearning = async (req, res) => {
    try {
        console.log('🔄 API: Continuous learning...');
        
        await mlTrainingService.continuousLearning();
        
        res.status(200).json({
            success: true,
            message: 'Continuous learning completed successfully',
            data: {
                timestamp: new Date(),
                status: 'completed'
            }
        });

    } catch (error) {
        console.error('❌ API: Lỗi continuous learning:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi chạy continuous learning',
            error: error.message
        });
    }
};

/**
 * Test model với sample input
 */
const testModel = async (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({
                success: false,
                message: 'Message is required'
            });
        }

        console.log(`🧪 API: Test model với message: "${message}"`);
        
        // Tạo dataset và model
        const dataset = await mlTrainingService.createTrainingDataset();
        const model = await mlTrainingService.trainModel(dataset.trainData);
        
        // Test prediction
        const intentPrediction = model.intentModel.predict(message);
        const entities = model.entityModel.extract(message);
        const response = model.responseModel.generate(intentPrediction.intent, entities);
        
        res.status(200).json({
            success: true,
            message: 'Model test completed successfully',
            data: {
                input: message,
                prediction: {
                    intent: intentPrediction.intent,
                    confidence: intentPrediction.confidence,
                    entities: entities
                },
                response: response,
                modelInfo: {
                    intents: ['nutrition_advice', 'workout_advice', 'membership_info', 'booking_support', 'general_inquiry'],
                    features: ['text', 'intent', 'entities', 'context']
                }
            }
        });

    } catch (error) {
        console.error('❌ API: Lỗi test model:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi test model',
            error: error.message
        });
    }
};

/**
 * Lấy training data statistics
 */
const getTrainingStats = async (req, res) => {
    try {
        console.log('📊 API: Lấy training statistics...');
        
        const trainingData = await mlTrainingService.collectTrainingData(10000);
        
        // Tính statistics
        const stats = {
            totalSamples: trainingData.length,
            intents: [...new Set(trainingData.map(item => item.intent))],
            intentDistribution: {},
            feedbackDistribution: {
                positive: trainingData.filter(item => item.userFeedback === 'positive').length,
                negative: trainingData.filter(item => item.userFeedback === 'negative').length,
                neutral: trainingData.filter(item => item.userFeedback === 'neutral').length
            },
            confidenceStats: {
                average: trainingData.reduce((acc, item) => acc + item.confidence, 0) / trainingData.length,
                min: Math.min(...trainingData.map(item => item.confidence)),
                max: Math.max(...trainingData.map(item => item.confidence))
            },
            timeRange: {
                earliest: Math.min(...trainingData.map(item => new Date(item.timestamp).getTime())),
                latest: Math.max(...trainingData.map(item => new Date(item.timestamp).getTime()))
            }
        };

        // Intent distribution
        stats.intents.forEach(intent => {
            stats.intentDistribution[intent] = trainingData.filter(item => item.intent === intent).length;
        });

        res.status(200).json({
            success: true,
            message: 'Training statistics retrieved successfully',
            data: stats
        });

    } catch (error) {
        console.error('❌ API: Lỗi lấy training stats:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy training statistics',
            error: error.message
        });
    }
};

module.exports = {
    runFullTraining,
    collectTrainingData,
    createDataset,
    trainModel,
    evaluateModel,
    saveTrainingData,
    getPerformanceHistory,
    continuousLearning,
    testModel,
    getTrainingStats
};
