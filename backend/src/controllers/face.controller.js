const FaceEncoding = require('../models/FaceEncoding');
const { HoiVien } = require('../models/NguoiDung');
const mongoose = require('mongoose');

// Helper function to calculate Euclidean distance between two face encodings
const calculateDistance = (encoding1, encoding2) => {
    if (encoding1.length !== encoding2.length) {
        return Infinity;
    }
    let sum = 0;
    for (let i = 0; i < encoding1.length; i++) {
        sum += Math.pow(encoding1[i] - encoding2[i], 2);
    }
    return Math.sqrt(sum);
};

// Helper function to calculate cosine similarity (better for face recognition)
const calculateCosineSimilarity = (encoding1, encoding2) => {
    if (encoding1.length !== encoding2.length) {
        return 0;
    }
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    for (let i = 0; i < encoding1.length; i++) {
        dotProduct += encoding1[i] * encoding2[i];
        norm1 += encoding1[i] * encoding1[i];
        norm2 += encoding2[i] * encoding2[i];
    }
    const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
    if (denominator === 0) return 0;
    return dotProduct / denominator;
};

// Validate that 3 enrollment encodings belong to the same person (internal helper)
const _validateEnrollmentEncodings = (encodings) => {
    if (!encodings || encodings.length !== 3) {
        return {
            isValid: false,
            message: 'Phải có đúng 3 face encodings'
        };
    }

    // Validate each encoding
    for (let i = 0; i < encodings.length; i++) {
        if (!Array.isArray(encodings[i]) || encodings[i].length !== 128) {
            return {
                isValid: false,
                message: `Face encoding ${i + 1} phải là mảng 128 số`
            };
        }
    }

    // Calculate similarities between all pairs
    const similarities = [];
    const threshold = 0.65; // Threshold for enrollment validation (slightly lower than check-in)

    // Compare encoding1 with encoding2
    const sim12 = calculateCosineSimilarity(encodings[0], encodings[1]);
    similarities.push({ pair: '1-2', similarity: sim12 });

    // Compare encoding2 with encoding3
    const sim23 = calculateCosineSimilarity(encodings[1], encodings[2]);
    similarities.push({ pair: '2-3', similarity: sim23 });

    // Compare encoding1 with encoding3
    const sim13 = calculateCosineSimilarity(encodings[0], encodings[2]);
    similarities.push({ pair: '1-3', similarity: sim13 });

    // Check if all similarities meet the threshold
    const minSimilarity = Math.min(sim12, sim23, sim13);
    const isValid = sim12 >= threshold && sim23 >= threshold && sim13 >= threshold;

    return {
        isValid,
        similarities: similarities.map(s => s.similarity),
        minSimilarity,
        message: isValid
            ? '3 lần quét khớp với nhau'
            : `3 lần quét không khớp. Độ tương đồng tối thiểu: ${minSimilarity.toFixed(3)} (yêu cầu: ${threshold})`
    };
};

// Enroll face - Save 3 face encodings for a member
exports.enrollFace = async (req, res) => {
    try {
        const { encodings } = req.body;
        const hoiVienId = req.user.id;

        // Validate input
        if (!encodings || !Array.isArray(encodings) || encodings.length !== 3) {
            return res.status(400).json({
                success: false,
                message: 'Phải cung cấp đúng 3 face encodings'
            });
        }

        // Validate each encoding is an array of 128 numbers
        for (let i = 0; i < encodings.length; i++) {
            if (!Array.isArray(encodings[i]) || encodings[i].length !== 128) {
                return res.status(400).json({
                    success: false,
                    message: `Face encoding ${i + 1} phải là mảng 128 số`
                });
            }
        }

        // Validate that all 3 encodings belong to the same person
        const validationResult = _validateEnrollmentEncodings(encodings);
        if (!validationResult.isValid) {
            return res.status(400).json({
                success: false,
                message: validationResult.message || '3 lần quét không khớp. Vui lòng đảm bảo quét cùng một khuôn mặt.',
                validationDetails: {
                    similarities: validationResult.similarities,
                    minSimilarity: validationResult.minSimilarity
                }
            });
        }

        // Check if user exists and is a member
        const hoiVien = await HoiVien.findById(hoiVienId);
        if (!hoiVien) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy hội viên'
            });
        }

        // Check if face encoding already exists
        let faceEncoding = await FaceEncoding.findOne({ hoiVien: hoiVienId });

        if (faceEncoding) {
            // Update existing encoding
            faceEncoding.encodings = encodings;
            faceEncoding.isActive = true;
            faceEncoding.updatedAt = new Date();
            await faceEncoding.save();
        } else {
            // Create new encoding
            faceEncoding = new FaceEncoding({
                hoiVien: hoiVienId,
                encodings: encodings
            });
            await faceEncoding.save();
        }

        // Log enrollment for debugging
        console.log(`[Face Enrollment] User: ${hoiVienId}, FaceEncoding ID: ${faceEncoding._id}, Average encoding calculated: ${faceEncoding.averageEncoding ? 'Yes' : 'No'}, Encoding count: ${faceEncoding.encodings.length}`);

        // Verify that average encoding was calculated
        if (!faceEncoding.averageEncoding || faceEncoding.averageEncoding.length !== 128) {
            console.error(`[Face Enrollment ERROR] Average encoding not calculated properly for user ${hoiVienId}`);
            return res.status(500).json({
                success: false,
                message: 'Lỗi khi tính toán average encoding. Vui lòng thử lại.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Đăng ký khuôn mặt thành công',
            data: {
                faceEncodingId: faceEncoding._id,
                hasFaceEncoding: true,
                averageEncodingLength: faceEncoding.averageEncoding.length
            }
        });
    } catch (error) {
        console.error('Error in enrollFace:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi đăng ký khuôn mặt',
            error: error.message
        });
    }
};

// Verify face - Compare face encoding with stored encodings
exports.verifyFace = async (req, res) => {
    try {
        const { encoding } = req.body;
        const hoiVienId = req.user.id;

        // Validate input
        if (!encoding || !Array.isArray(encoding) || encoding.length !== 128) {
            return res.status(400).json({
                success: false,
                message: 'Face encoding phải là mảng 128 số'
            });
        }

        // Get face encoding from database
        const faceEncoding = await FaceEncoding.findOne({
            hoiVien: hoiVienId,
            isActive: true
        });

        if (!faceEncoding) {
            return res.status(404).json({
                success: false,
                message: 'Chưa đăng ký khuôn mặt. Vui lòng đăng ký trước khi sử dụng tính năng này.',
                hasFaceEncoding: false
            });
        }

        // Validate face encoding is not invalid (all zeros, NaN, etc.)
        const isValidEncoding = encoding.every(val => typeof val === 'number' && !isNaN(val) && isFinite(val));
        if (!isValidEncoding) {
            console.error(`[Face Verification] Invalid encoding detected for user ${hoiVienId}`);
            return res.status(400).json({
                success: false,
                message: 'Face encoding không hợp lệ',
                isMatch: false
            });
        }

        // Calculate similarity with average encoding (required check)
        const similarityWithAverage = calculateCosineSimilarity(encoding, faceEncoding.averageEncoding);

        // CRITICAL SECURITY: Threshold for face matching - INCREASED to 0.90 for MAXIMUM strictness
        // Higher threshold = more strict matching (prevents false positives)
        // 0.90 is VERY strict - only nearly identical faces will pass
        // This is CRITICAL to prevent false positives from:
        // - Photos of other people (even on phone screens)
        // - Different people
        // - Similar-looking people
        // - 2D images (photos) vs 3D faces (real people)
        const threshold = 0.90;

        // CRITICAL: Check similarity with ALL stored encodings
        const similarities = [];
        for (let i = 0; i < faceEncoding.encodings.length; i++) {
            const storedEncoding = faceEncoding.encodings[i];
            const sim = calculateCosineSimilarity(encoding, storedEncoding);
            similarities.push({
                index: i,
                similarity: sim
            });
        }

        // Find maximum similarity
        const maxSimilarity = Math.max(similarityWithAverage, ...similarities.map(s => s.similarity));
        const bestMatchIndex = similarities.findIndex(s => s.similarity === maxSimilarity);

        // CRITICAL SECURITY VALIDATION: Require ALL of the following to pass:
        // 1. Similarity with average encoding MUST be >= threshold (0.90)
        // 2. At least 3/3 (100%) of stored encodings MUST match >= threshold
        // 3. Maximum similarity MUST be >= threshold
        // This is EXTREMELY strict to prevent ANY false positives
        const matchesWithAverage = similarityWithAverage >= threshold;
        const matchesWithStored = similarities.filter(s => s.similarity >= threshold);

        // CRITICAL: Changed from 2/3 to 3/3 (100%) - ALL encodings must match
        // This prevents false positives even more strictly
        const requiredMatches = faceEncoding.encodings.length; // ALL encodings must match (100%)

        const meetsStoredRequirement = matchesWithStored.length >= requiredMatches;

        // CRITICAL: Also check that maxSimilarity is significantly above threshold
        // Require maxSimilarity to be at least 0.92 (even higher than threshold)
        // This ensures we're not just barely passing the threshold
        const minMaxSimilarity = 0.92; // Even stricter than threshold
        const meetsMaxSimilarityRequirement = maxSimilarity >= minMaxSimilarity;

        // Final match requires ALL conditions to be true
        const finalMatch = matchesWithAverage &&
            meetsStoredRequirement &&
            maxSimilarity >= threshold &&
            meetsMaxSimilarityRequirement;

        // Log verification result for debugging with more details
        console.log(`[Face Verification] 🔒 SECURITY CHECK for User: ${hoiVienId}`);
        console.log(`  - Average encoding similarity: ${similarityWithAverage.toFixed(4)} (required: >= ${threshold})`);
        console.log(`  - Matches with average: ${matchesWithAverage ? '✅ YES' : '❌ NO'}`);
        console.log(`  - Individual encoding similarities:`, similarities.map(s => `${s.index + 1}: ${s.similarity.toFixed(4)}${s.similarity >= threshold ? ' ✅' : ' ❌'}`).join(', '));
        console.log(`  - Matches with stored encodings: ${matchesWithStored.length}/${faceEncoding.encodings.length} (required: ALL ${requiredMatches})`);
        console.log(`  - Meets stored requirement (100% match): ${meetsStoredRequirement ? '✅ YES' : '❌ NO'}`);
        console.log(`  - Max similarity: ${maxSimilarity.toFixed(4)} (threshold: ${threshold}, min required: ${minMaxSimilarity})`);
        console.log(`  - Meets max similarity requirement: ${meetsMaxSimilarityRequirement ? '✅ YES' : '❌ NO'}`);
        console.log(`  - Final Match: ${finalMatch ? '✅✅✅ PASS - FACE VERIFIED' : '❌❌❌ FAIL - FACE REJECTED'}`);
        console.log(`  - Best match with encoding: ${bestMatchIndex >= 0 ? `Encoding ${bestMatchIndex + 1}` : 'Average encoding'}`);

        if (!finalMatch) {
            console.log(`  - ❌❌❌ VERIFICATION FAILED - SECURITY REJECTION:`);
            if (!matchesWithAverage) {
                console.log(`    ❌ Average encoding similarity (${similarityWithAverage.toFixed(4)}) < threshold (${threshold})`);
            }
            if (!meetsStoredRequirement) {
                console.log(`    ❌ Only ${matchesWithStored.length}/${faceEncoding.encodings.length} stored encodings match (required: ALL ${requiredMatches})`);
                console.log(`    ❌ This face does NOT match the enrolled face profile`);
            }
            if (maxSimilarity < threshold) {
                console.log(`    ❌ Max similarity (${maxSimilarity.toFixed(4)}) < threshold (${threshold})`);
            }
            if (!meetsMaxSimilarityRequirement) {
                console.log(`    ❌ Max similarity (${maxSimilarity.toFixed(4)}) < minimum required (${minMaxSimilarity})`);
            }
            console.log(`  - 🔒 SECURITY: Face REJECTED - This is NOT the enrolled user's face`);
        } else {
            console.log(`  - ✅✅✅ SECURITY: Face VERIFIED - This IS the enrolled user's face`);
        }

        res.status(200).json({
            success: true,
            isMatch: finalMatch,
            similarity: maxSimilarity,
            similarityWithAverage: similarityWithAverage,
            threshold: threshold,
            matchesWithStored: matchesWithStored.length,
            totalStored: faceEncoding.encodings.length,
            requiredMatches: requiredMatches,
            message: finalMatch
                ? 'Xác thực khuôn mặt thành công'
                : `Không khớp với khuôn mặt đã đăng ký (Độ tương đồng tối đa: ${(maxSimilarity * 100).toFixed(1)}%, Yêu cầu: ${(threshold * 100).toFixed(1)}%. Khớp với ${matchesWithStored.length}/${faceEncoding.encodings.length} encodings, yêu cầu: >= ${requiredMatches})`
        });
    } catch (error) {
        console.error('Error in verifyFace:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi xác thực khuôn mặt',
            error: error.message
        });
    }
};

// Validate enrollment encodings - Check if 3 encodings belong to the same person
exports.validateEnrollmentEncodings = async (req, res) => {
    try {
        const { encodings } = req.body;

        // Validate input
        if (!encodings || !Array.isArray(encodings)) {
            return res.status(400).json({
                success: false,
                message: 'Phải cung cấp mảng encodings'
            });
        }

        // Validate encodings
        const validationResult = _validateEnrollmentEncodings(encodings);

        res.status(200).json({
            success: true,
            isValid: validationResult.isValid,
            message: validationResult.message,
            similarities: validationResult.similarities,
            minSimilarity: validationResult.minSimilarity
        });
    } catch (error) {
        console.error('Error in validateEnrollmentEncodings:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi xác thực encodings',
            error: error.message
        });
    }
};

// Check if member has face encoding
exports.checkFaceEncoding = async (req, res) => {
    try {
        const hoiVienId = req.user.id;

        const faceEncoding = await FaceEncoding.findOne({
            hoiVien: hoiVienId,
            isActive: true
        });

        res.status(200).json({
            success: true,
            hasFaceEncoding: !!faceEncoding,
            message: faceEncoding
                ? 'Đã đăng ký khuôn mặt'
                : 'Chưa đăng ký khuôn mặt'
        });
    } catch (error) {
        console.error('Error in checkFaceEncoding:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi kiểm tra khuôn mặt',
            error: error.message
        });
    }
};

