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
    // Validate inputs
    if (!encoding1 || !encoding2) {
        console.error('[calculateCosineSimilarity] One or both encodings are null/undefined');
        return 0;
    }

    if (!Array.isArray(encoding1) || !Array.isArray(encoding2)) {
        console.error('[calculateCosineSimilarity] One or both encodings are not arrays');
        return 0;
    }

    if (encoding1.length !== encoding2.length) {
        console.error(`[calculateCosineSimilarity] Encoding length mismatch: ${encoding1.length} vs ${encoding2.length}`);
        return 0;
    }

    // Check for invalid values
    const hasInvalid1 = encoding1.some(val => typeof val !== 'number' || isNaN(val) || !isFinite(val));
    const hasInvalid2 = encoding2.some(val => typeof val !== 'number' || isNaN(val) || !isFinite(val));

    if (hasInvalid1 || hasInvalid2) {
        console.error('[calculateCosineSimilarity] One or both encodings contain invalid values (NaN/Infinity)');
        return 0;
    }

    // Calculate cosine similarity
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < encoding1.length; i++) {
        const val1 = encoding1[i];
        const val2 = encoding2[i];
        dotProduct += val1 * val2;
        norm1 += val1 * val1;
        norm2 += val2 * val2;
    }

    const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);

    if (denominator === 0) {
        console.error('[calculateCosineSimilarity] Denominator is 0 (one or both encodings are all zeros)');
        return 0;
    }

    const similarity = dotProduct / denominator;

    // Validate result
    if (isNaN(similarity) || !isFinite(similarity)) {
        console.error('[calculateCosineSimilarity] Calculated similarity is invalid:', similarity);
        return 0;
    }

    // Cosine similarity should be between -1 and 1, but for face recognition it's usually between 0 and 1
    if (similarity < -1 || similarity > 1) {
        console.warn('[calculateCosineSimilarity] Similarity out of expected range:', similarity);
    }

    return similarity;
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

        // Debug: Log incoming request
        console.log(`[Face Verification] Received verification request for user ${hoiVienId}`);
        console.log(`[Face Verification] Request body keys:`, Object.keys(req.body));
        console.log(`[Face Verification] Encoding type:`, typeof encoding);
        console.log(`[Face Verification] Encoding is array:`, Array.isArray(encoding));
        console.log(`[Face Verification] Encoding length:`, encoding ? encoding.length : 'null/undefined');

        // Validate input
        if (!encoding) {
            console.error(`[Face Verification] Encoding is null/undefined for user ${hoiVienId}`);
            return res.status(400).json({
                success: false,
                message: 'Face encoding không được để trống',
                isMatch: false,
                similarity: 0
            });
        }

        if (!Array.isArray(encoding)) {
            console.error(`[Face Verification] Encoding is not an array for user ${hoiVienId}, type: ${typeof encoding}`);
            return res.status(400).json({
                success: false,
                message: 'Face encoding phải là mảng',
                isMatch: false,
                similarity: 0
            });
        }

        if (encoding.length !== 128) {
            console.error(`[Face Verification] Encoding length is ${encoding.length}, expected 128 for user ${hoiVienId}`);
            return res.status(400).json({
                success: false,
                message: `Face encoding phải là mảng 128 số (nhận được ${encoding.length} số)`,
                isMatch: false,
                similarity: 0
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
                isMatch: false,
                similarity: 0
            });
        }

        // Debug: Check if encoding is all zeros
        const isAllZeros = encoding.every(val => val === 0);
        if (isAllZeros) {
            console.error(`[Face Verification] Encoding is all zeros for user ${hoiVienId}`);
            return res.status(400).json({
                success: false,
                message: 'Face encoding không hợp lệ (toàn số 0)',
                isMatch: false,
                similarity: 0
            });
        }

        // Debug: Check stored encoding
        const isStoredEncodingAllZeros = faceEncoding.averageEncoding && faceEncoding.averageEncoding.every(val => val === 0);
        if (isStoredEncodingAllZeros) {
            console.error(`[Face Verification] Stored average encoding is all zeros for user ${hoiVienId}`);
            return res.status(500).json({
                success: false,
                message: 'Dữ liệu khuôn mặt trong hệ thống không hợp lệ. Vui lòng đăng ký lại.',
                isMatch: false,
                similarity: 0
            });
        }

        // Debug: Log encoding statistics
        const encodingStats = {
            length: encoding.length,
            min: Math.min(...encoding),
            max: Math.max(...encoding),
            sum: encoding.reduce((a, b) => a + b, 0),
            avg: encoding.reduce((a, b) => a + b, 0) / encoding.length
        };
        console.log(`[Face Verification] Incoming encoding stats for user ${hoiVienId}:`, encodingStats);

        const storedEncodingStats = {
            length: faceEncoding.averageEncoding.length,
            min: Math.min(...faceEncoding.averageEncoding),
            max: Math.max(...faceEncoding.averageEncoding),
            sum: faceEncoding.averageEncoding.reduce((a, b) => a + b, 0),
            avg: faceEncoding.averageEncoding.reduce((a, b) => a + b, 0) / faceEncoding.averageEncoding.length
        };
        console.log(`[Face Verification] Stored average encoding stats for user ${hoiVienId}:`, storedEncodingStats);

        // Calculate similarity with average encoding (required check)
        const similarityWithAverage = calculateCosineSimilarity(encoding, faceEncoding.averageEncoding);

        console.log(`[Face Verification] Similarity with average encoding: ${similarityWithAverage.toFixed(4)} for user ${hoiVienId}`);

        // CRITICAL SECURITY: Threshold for face matching - INCREASED to 0.95 for EXTREME strictness
        // Higher threshold = more strict matching (prevents false positives)
        // 0.95 is EXTREMELY strict - only nearly identical faces will pass
        // This is CRITICAL to prevent false positives from:
        // - Photos of other people (even on phone screens)
        // - Different people
        // - Similar-looking people
        // - 2D images (photos) vs 3D faces (real people)
        // - Twins or very similar faces
        // NOTE: This may cause some false negatives (rejecting valid users) but is necessary for security
        const threshold = 0.95;

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
        // Require maxSimilarity to be at least 0.96 (even higher than threshold)
        // This ensures we're not just barely passing the threshold
        // This is EXTREMELY strict to prevent ANY false positives
        const minMaxSimilarity = 0.96; // Even stricter than threshold (0.95)
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

        // CRITICAL: Ensure similarity is never 0 unless there's a real issue
        // If maxSimilarity is 0, there's a problem with the encodings
        if (maxSimilarity === 0) {
            console.error(`[Face Verification] CRITICAL: maxSimilarity is 0 for user ${hoiVienId}`);
            console.error(`[Face Verification] This indicates a problem with encoding comparison`);
            console.error(`[Face Verification] Similarity with average: ${similarityWithAverage}`);
            console.error(`[Face Verification] Individual similarities:`, similarities.map(s => `${s.index}: ${s.similarity.toFixed(4)}`));
        }

        res.status(200).json({
            success: true,
            isMatch: finalMatch,
            similarity: maxSimilarity > 0 ? maxSimilarity : 0, // Ensure we never return negative or NaN
            similarityWithAverage: similarityWithAverage > 0 ? similarityWithAverage : 0,
            threshold: threshold,
            matchesWithStored: matchesWithStored.length,
            totalStored: faceEncoding.encodings.length,
            requiredMatches: requiredMatches,
            message: finalMatch
                ? 'Xác thực khuôn mặt thành công'
                : maxSimilarity === 0
                    ? 'Không thể so sánh khuôn mặt. Vui lòng thử lại hoặc đăng ký lại khuôn mặt.'
                    : `Không khớp với khuôn mặt đã đăng ký (Độ tương đồng tối đa: ${(maxSimilarity * 100).toFixed(1)}%, Yêu cầu: ${(threshold * 100).toFixed(1)}%. Khớp với ${matchesWithStored.length}/${faceEncoding.encodings.length} encodings, yêu cầu: TẤT CẢ ${requiredMatches})`
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

