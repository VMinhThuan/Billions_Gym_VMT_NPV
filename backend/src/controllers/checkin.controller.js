const CheckInRecord = require('../models/CheckInRecord');
const BuoiTap = require('../models/BuoiTap');
const FaceEncoding = require('../models/FaceEncoding');
const { HoiVien } = require('../models/NguoiDung');
const mongoose = require('mongoose');

// Helper function to parse time string (HH:mm) to Date
const parseTime = (timeString, date) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const time = new Date(date);
    time.setHours(hours, minutes, 0, 0);
    return time;
};

// Helper function to calculate time difference in minutes
const getTimeDifference = (time1, time2) => {
    return Math.round((time1 - time2) / (1000 * 60)); // Difference in minutes
};

// Helper function to determine check-in status
const getCheckInStatus = (checkInTime, scheduledStartTime) => {
    const diffMinutes = getTimeDifference(checkInTime, scheduledStartTime);
    if (diffMinutes >= -5 && diffMinutes <= 5) {
        return 'DUNG_GIO';
    } else if (diffMinutes < -5) {
        return 'SOM';
    } else {
        return 'MUON';
    }
};

// Helper function to determine check-out status
const getCheckOutStatus = (checkOutTime, scheduledEndTime) => {
    const diffMinutes = getTimeDifference(checkOutTime, scheduledEndTime);
    if (diffMinutes >= -5 && diffMinutes <= 5) {
        return 'DUNG_GIO';
    } else if (diffMinutes < -5) {
        return 'SOM';
    } else {
        return 'DUNG_GIO'; // If late, still consider as on-time for check-out
    }
};

// Get today's sessions for a member
exports.getTodaySessions = async (req, res) => {
    try {
        const hoiVienId = req.user.id;

        // Get today's date - đơn giản hóa logic timezone
        // Lấy ngày hiện tại ở múi giờ local (server timezone)
        const now = new Date();

        // Tạo ngày bắt đầu hôm nay (00:00:00)
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);

        // Tạo ngày kết thúc hôm nay (23:59:59.999)
        const todayEnd = new Date(now);
        todayEnd.setHours(23, 59, 59, 999);

        // Log để debug
        console.log('[getTodaySessions] Date range:', {
            now: now.toISOString(),
            todayStart: todayStart.toISOString(),
            todayEnd: todayEnd.toISOString(),
            hoiVienId: hoiVienId.toString()
        });

        // Find sessions where member is registered
        // So sánh ngày tháng năm, không cần so sánh giờ chính xác
        const buoiTaps = await BuoiTap.find({
            'danhSachHoiVien.hoiVien': hoiVienId,
            ngayTap: {
                $gte: todayStart,
                $lte: todayEnd
            }
        })
            .populate('chiNhanh', 'tenChiNhanh diaChi')
            .populate('ptPhuTrach', 'hoTen')
            .sort({ gioBatDau: 1 });

        console.log('[getTodaySessions] Found sessions:', buoiTaps.length);
        if (buoiTaps.length > 0) {
            buoiTaps.forEach((bt, idx) => {
                console.log(`[getTodaySessions] Session ${idx + 1}:`, {
                    _id: bt._id,
                    tenBuoiTap: bt.tenBuoiTap,
                    ngayTap: bt.ngayTap,
                    ngayTapISO: bt.ngayTap?.toISOString(),
                    gioBatDau: bt.gioBatDau
                });
            });
        }

        // Get check-in records for today (including those without check-out)
        const checkInRecords = await CheckInRecord.find({
            hoiVien: hoiVienId,
            checkInTime: {
                $gte: todayStart,
                $lte: todayEnd
            }
        }).sort({ checkInTime: -1 });

        // Also get any pending check-out records (checked in today but not checked out yet)
        // This ensures we show sessions that need check-out even if they're from earlier
        const pendingCheckOutRecords = await CheckInRecord.find({
            hoiVien: hoiVienId,
            checkOutTime: null,
            checkInTime: {
                $gte: todayStart,
                $lte: todayEnd
            }
        });

        // Note: pendingCheckOutRecords is already included in checkInRecords
        // but we prioritize pending check-outs when mapping

        // Map check-in records to sessions
        const sessionsWithCheckIn = buoiTaps.map(buoiTap => {
            // Find check-in record for this session (prefer non-checked-out if exists)
            let checkInRecord = pendingCheckOutRecords.find(
                record => record.buoiTap.toString() === buoiTap._id.toString()
            );

            // If no pending check-out, find any check-in record
            if (!checkInRecord) {
                checkInRecord = checkInRecords.find(
                    record => record.buoiTap.toString() === buoiTap._id.toString()
                );
            }

            const memberInfo = buoiTap.danhSachHoiVien.find(
                member => member.hoiVien.toString() === hoiVienId
            );

            return {
                ...buoiTap.toObject(),
                hasCheckedIn: !!checkInRecord,
                checkInRecord: checkInRecord ? {
                    checkInTime: checkInRecord.checkInTime,
                    checkOutTime: checkInRecord.checkOutTime,
                    checkInStatus: checkInRecord.checkInStatus,
                    checkOutStatus: checkInRecord.checkOutStatus,
                    thoiGianMuonCheckIn: checkInRecord.thoiGianMuonCheckIn,
                    thoiGianSomCheckOut: checkInRecord.thoiGianSomCheckOut,
                    sessionDuration: checkInRecord.sessionDuration
                } : null,
                attendanceStatus: memberInfo ? memberInfo.trangThai : null
            };
        });

        res.status(200).json({
            success: true,
            data: sessionsWithCheckIn
        });
    } catch (error) {
        console.error('Error in getTodaySessions:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy danh sách buổi tập',
            error: error.message
        });
    }
};

// Check-in to a session
exports.checkIn = async (req, res) => {
    try {
        const { buoiTapId, faceEncoding, image } = req.body;
        const hoiVienId = req.user.id;

        // Validate input
        if (!buoiTapId) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp ID buổi tập'
            });
        }

        // QUAN TRỌNG: Kiểm tra TRƯỚC TIÊN xem có buổi tập nào đang check-in mà chưa check-out không
        // Điều này đảm bảo không thể check-in nhiều ca cùng lúc
        // Kiểm tra TRƯỚC khi verify face để tránh lãng phí thời gian
        const activeCheckIn = await CheckInRecord.findOne({
            hoiVien: hoiVienId,
            checkOutTime: null // Chưa check-out - bất kỳ buổi tập nào
        })
            .populate('buoiTap', 'tenBuoiTap ngayTap gioBatDau gioKetThuc');

        if (activeCheckIn) {
            const buoiTapInfo = activeCheckIn.buoiTap;
            const checkInTime = new Date(activeCheckIn.checkInTime);
            const timeStr = checkInTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

            // Kiểm tra xem có phải đang cố check-in lại cùng một buổi tập không
            const isSameSession = activeCheckIn.buoiTap._id.toString() === buoiTapId.toString();

            console.log(`❌ Check-in blocked: User ${hoiVienId} already has active check-in for session ${activeCheckIn.buoiTap._id}`);
            console.log(`   - Is same session: ${isSameSession}`);
            console.log(`   - Requested buoiTapId: ${buoiTapId}`);

            if (isSameSession) {
                return res.status(400).json({
                    success: false,
                    message: `Bạn đã check-in buổi tập "${buoiTapInfo?.tenBuoiTap || 'N/A'}" rồi. Vui lòng check-out trước khi check-in lại.`,
                    activeCheckIn: {
                        buoiTapId: activeCheckIn.buoiTap._id,
                        buoiTapName: buoiTapInfo?.tenBuoiTap || 'N/A',
                        checkInTime: activeCheckIn.checkInTime,
                        checkInTimeFormatted: timeStr
                    }
                });
            } else {
                return res.status(400).json({
                    success: false,
                    message: `Bạn đang có buổi tập chưa check-out. Vui lòng check-out buổi tập "${buoiTapInfo?.tenBuoiTap || 'N/A'}" (Check-in lúc ${timeStr}) trước khi check-in buổi tập mới. Không thể check-in nhiều ca cùng lúc.`,
                    activeCheckIn: {
                        buoiTapId: activeCheckIn.buoiTap._id,
                        buoiTapName: buoiTapInfo?.tenBuoiTap || 'N/A',
                        checkInTime: activeCheckIn.checkInTime,
                        checkInTimeFormatted: timeStr
                    }
                });
            }
        }

        // Validate face encoding AFTER checking for active check-in
        if (!faceEncoding || !Array.isArray(faceEncoding) || faceEncoding.length !== 128) {
            return res.status(400).json({
                success: false,
                message: 'Face encoding không hợp lệ'
            });
        }

        // Verify face
        const faceEncodingDoc = await FaceEncoding.findOne({
            hoiVien: hoiVienId,
            isActive: true
        });

        if (!faceEncodingDoc) {
            return res.status(404).json({
                success: false,
                message: 'Chưa đăng ký khuôn mặt. Vui lòng đăng ký trước khi check-in.',
                hasFaceEncoding: false
            });
        }

        // Validate face encoding is not invalid (all zeros, NaN, etc.)
        const isValidEncoding = faceEncoding.every(val => typeof val === 'number' && !isNaN(val) && isFinite(val));
        if (!isValidEncoding) {
            console.error(`[Check-in Verification] Invalid encoding detected for user ${hoiVienId}`);
            return res.status(400).json({
                success: false,
                message: 'Face encoding không hợp lệ',
                similarity: 0
            });
        }

        // Calculate similarity
        const calculateCosineSimilarity = (enc1, enc2) => {
            if (!enc1 || !enc2 || enc1.length !== enc2.length) return 0;
            let dotProduct = 0;
            let norm1 = 0;
            let norm2 = 0;
            for (let i = 0; i < enc1.length; i++) {
                dotProduct += enc1[i] * enc2[i];
                norm1 += enc1[i] * enc1[i];
                norm2 += enc2[i] * enc2[i];
            }
            const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
            return denominator === 0 ? 0 : dotProduct / denominator;
        };

        // CRITICAL: Calculate similarity with average encoding (required check)
        const similarityWithAverage = calculateCosineSimilarity(faceEncoding, faceEncodingDoc.averageEncoding);

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
        for (let i = 0; i < faceEncodingDoc.encodings.length; i++) {
            const storedEncoding = faceEncodingDoc.encodings[i];
            const sim = calculateCosineSimilarity(faceEncoding, storedEncoding);
            similarities.push({
                index: i,
                similarity: sim
            });
        }

        // Find maximum similarity
        const maxSimilarity = Math.max(similarityWithAverage, ...similarities.map(s => s.similarity));

        // CRITICAL SECURITY VALIDATION: Require ALL of the following to pass:
        // 1. Similarity with average encoding MUST be >= threshold (0.90)
        // 2. At least 3/3 (100%) of stored encodings MUST match >= threshold
        // 3. Maximum similarity MUST be >= threshold
        // 4. Max similarity MUST be >= 0.92 (even higher than threshold)
        // This is EXTREMELY strict to prevent ANY false positives
        const matchesWithAverage = similarityWithAverage >= threshold;
        const matchesWithStored = similarities.filter(s => s.similarity >= threshold);

        // CRITICAL: Changed from 2/3 to 3/3 (100%) - ALL encodings must match
        // This prevents false positives even more strictly
        const requiredMatches = faceEncodingDoc.encodings.length; // ALL encodings must match (100%)

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

        // Comprehensive logging for audit and debugging
        console.log(`[Check-in Verification] 🔒 SECURITY CHECK for User: ${hoiVienId}, Session: ${buoiTapId}`);
        console.log(`  - Average encoding similarity: ${similarityWithAverage.toFixed(4)} (required: >= ${threshold})`);
        console.log(`  - Matches with average: ${matchesWithAverage ? '✅ YES' : '❌ NO'}`);
        console.log(`  - Individual encoding similarities:`, similarities.map(s => `${s.index + 1}: ${s.similarity.toFixed(4)}${s.similarity >= threshold ? ' ✅' : ' ❌'}`).join(', '));
        console.log(`  - Matches with stored encodings: ${matchesWithStored.length}/${faceEncodingDoc.encodings.length} (required: ALL ${requiredMatches})`);
        console.log(`  - Meets stored requirement (100% match): ${meetsStoredRequirement ? '✅ YES' : '❌ NO'}`);
        console.log(`  - Max similarity: ${maxSimilarity.toFixed(4)} (threshold: ${threshold}, min required: ${minMaxSimilarity})`);
        console.log(`  - Meets max similarity requirement: ${meetsMaxSimilarityRequirement ? '✅ YES' : '❌ NO'}`);
        console.log(`  - Final Match: ${finalMatch ? '✅✅✅ PASS - FACE VERIFIED' : '❌❌❌ FAIL - FACE REJECTED'}`);

        if (!finalMatch) {
            console.log(`  - ❌❌❌ CHECK-IN BLOCKED - VERIFICATION FAILED - SECURITY REJECTION:`);
            if (!matchesWithAverage) {
                console.log(`    ❌ Average encoding similarity (${similarityWithAverage.toFixed(4)}) < threshold (${threshold})`);
            }
            if (!meetsStoredRequirement) {
                console.log(`    ❌ Only ${matchesWithStored.length}/${faceEncodingDoc.encodings.length} stored encodings match (required: ALL ${requiredMatches})`);
                console.log(`    ❌ This face does NOT match the enrolled face profile`);
            }
            if (maxSimilarity < threshold) {
                console.log(`    ❌ Max similarity (${maxSimilarity.toFixed(4)}) < threshold (${threshold})`);
            }
            if (!meetsMaxSimilarityRequirement) {
                console.log(`    ❌ Max similarity (${maxSimilarity.toFixed(4)}) < minimum required (${minMaxSimilarity})`);
            }
            console.log(`  - 🔒 SECURITY: Face REJECTED - This is NOT the enrolled user's face`);

            return res.status(401).json({
                success: false,
                message: `Khuôn mặt không khớp với khuôn mặt đã đăng ký (Độ tương đồng tối đa: ${(maxSimilarity * 100).toFixed(1)}%, Yêu cầu: ${(threshold * 100).toFixed(1)}%. Khớp với ${matchesWithStored.length}/${faceEncodingDoc.encodings.length} encodings, yêu cầu: TẤT CẢ ${requiredMatches})`,
                similarity: maxSimilarity,
                similarityWithAverage: similarityWithAverage,
                matchesWithStored: matchesWithStored.length,
                totalStored: faceEncodingDoc.encodings.length,
                requiredMatches: requiredMatches
            });
        }

        console.log(`  - ✅✅✅ SECURITY: Face VERIFIED - This IS the enrolled user's face`);
        console.log(`  - ✅ VERIFICATION PASSED - Allowing check-in`);

        // Find buoi tap
        const buoiTap = await BuoiTap.findById(buoiTapId);
        if (!buoiTap) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy buổi tập'
            });
        }

        // Check if member is registered
        const memberInfo = buoiTap.danhSachHoiVien.find(
            member => member.hoiVien.toString() === hoiVienId
        );

        if (!memberInfo) {
            return res.status(403).json({
                success: false,
                message: 'Bạn chưa đăng ký buổi tập này'
            });
        }

        if (memberInfo.trangThai !== 'DA_DANG_KY') {
            return res.status(400).json({
                success: false,
                message: `Không thể check-in. Trạng thái hiện tại: ${memberInfo.trangThai}`
            });
        }

        // Check if already checked in
        const existingCheckIn = await CheckInRecord.findOne({
            hoiVien: hoiVienId,
            buoiTap: buoiTapId,
            checkOutTime: null
        });

        if (existingCheckIn) {
            return res.status(400).json({
                success: false,
                message: 'Bạn đã check-in vào buổi tập này'
            });
        }

        // Check time constraints (can check-in up to 30 minutes before start time)
        const now = new Date();
        const scheduledStartTime = parseTime(buoiTap.gioBatDau, buoiTap.ngayTap);
        const thirtyMinutesBefore = new Date(scheduledStartTime);
        thirtyMinutesBefore.setMinutes(thirtyMinutesBefore.getMinutes() - 30);

        if (now < thirtyMinutesBefore) {
            return res.status(400).json({
                success: false,
                message: 'Chưa đến thời gian check-in. Bạn chỉ có thể check-in 30 phút trước giờ bắt đầu.'
            });
        }

        // Calculate check-in status
        const checkInStatus = getCheckInStatus(now, scheduledStartTime);
        const thoiGianMuonCheckIn = now > scheduledStartTime
            ? getTimeDifference(now, scheduledStartTime)
            : 0;

        // Create check-in record
        const checkInRecord = new CheckInRecord({
            hoiVien: hoiVienId,
            buoiTap: buoiTapId,
            checkInTime: now,
            checkInStatus: checkInStatus,
            thoiGianMuonCheckIn: thoiGianMuonCheckIn,
            anhCheckIn: image || null
        });

        await checkInRecord.save();

        // Update BuoiTap attendance status
        await buoiTap.updateAttendanceStatus(hoiVienId, 'DA_THAM_GIA');

        // Populate buoiTap với PT và chi nhánh
        await buoiTap.populate('ptPhuTrach', 'hoTen');
        await buoiTap.populate('chiNhanh', 'tenChiNhanh');

        // Chuyển đổi sang plain object để đảm bảo serialize đúng
        const buoiTapData = {
            _id: buoiTap._id,
            tenBuoiTap: buoiTap.tenBuoiTap,
            ngayTap: buoiTap.ngayTap,
            gioBatDau: buoiTap.gioBatDau,
            gioKetThuc: buoiTap.gioKetThuc,
            ptPhuTrach: buoiTap.ptPhuTrach ? {
                _id: buoiTap.ptPhuTrach._id,
                hoTen: buoiTap.ptPhuTrach.hoTen
            } : null,
            chiNhanh: buoiTap.chiNhanh ? {
                _id: buoiTap.chiNhanh._id,
                tenChiNhanh: buoiTap.chiNhanh.tenChiNhanh
            } : null
        };

        res.status(200).json({
            success: true,
            message: 'Check-in thành công',
            data: {
                checkInRecord: {
                    checkInTime: checkInRecord.checkInTime,
                    checkInStatus: checkInRecord.checkInStatus,
                    thoiGianMuonCheckIn: checkInRecord.thoiGianMuonCheckIn
                },
                buoiTap: buoiTapData
            }
        });
    } catch (error) {
        console.error('Error in checkIn:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi check-in',
            error: error.message
        });
    }
};

// Check-out from a session
exports.checkOut = async (req, res) => {
    try {
        const { buoiTapId, faceEncoding, image } = req.body;
        const hoiVienId = req.user.id;

        // Validate input
        if (!buoiTapId) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp ID buổi tập'
            });
        }

        if (!faceEncoding || !Array.isArray(faceEncoding) || faceEncoding.length !== 128) {
            return res.status(400).json({
                success: false,
                message: 'Face encoding không hợp lệ'
            });
        }

        // Verify face
        const faceEncodingDoc = await FaceEncoding.findOne({
            hoiVien: hoiVienId,
            isActive: true
        });

        if (!faceEncodingDoc) {
            return res.status(404).json({
                success: false,
                message: 'Chưa đăng ký khuôn mặt'
            });
        }

        // Validate face encoding is not invalid (all zeros, NaN, etc.)
        const isValidEncoding = faceEncoding.every(val => typeof val === 'number' && !isNaN(val) && isFinite(val));
        if (!isValidEncoding) {
            console.error(`[Check-out Verification] Invalid encoding detected for user ${hoiVienId}`);
            return res.status(400).json({
                success: false,
                message: 'Face encoding không hợp lệ',
                similarity: 0
            });
        }

        // Calculate similarity
        const calculateCosineSimilarity = (enc1, enc2) => {
            if (!enc1 || !enc2 || enc1.length !== enc2.length) return 0;
            let dotProduct = 0;
            let norm1 = 0;
            let norm2 = 0;
            for (let i = 0; i < enc1.length; i++) {
                dotProduct += enc1[i] * enc2[i];
                norm1 += enc1[i] * enc1[i];
                norm2 += enc2[i] * enc2[i];
            }
            const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
            return denominator === 0 ? 0 : dotProduct / denominator;
        };

        // CRITICAL: Calculate similarity with average encoding (required check)
        const similarityWithAverage = calculateCosineSimilarity(faceEncoding, faceEncodingDoc.averageEncoding);

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
        for (let i = 0; i < faceEncodingDoc.encodings.length; i++) {
            const storedEncoding = faceEncodingDoc.encodings[i];
            const sim = calculateCosineSimilarity(faceEncoding, storedEncoding);
            similarities.push({
                index: i,
                similarity: sim
            });
        }

        // Find maximum similarity
        const maxSimilarity = Math.max(similarityWithAverage, ...similarities.map(s => s.similarity));

        // CRITICAL SECURITY VALIDATION: Require ALL of the following to pass:
        // 1. Similarity with average encoding MUST be >= threshold (0.90)
        // 2. At least 3/3 (100%) of stored encodings MUST match >= threshold
        // 3. Maximum similarity MUST be >= threshold
        // 4. Max similarity MUST be >= 0.92 (even higher than threshold)
        // This is EXTREMELY strict to prevent ANY false positives
        const matchesWithAverage = similarityWithAverage >= threshold;
        const matchesWithStored = similarities.filter(s => s.similarity >= threshold);

        // CRITICAL: Changed from 2/3 to 3/3 (100%) - ALL encodings must match
        // This prevents false positives even more strictly
        const requiredMatches = faceEncodingDoc.encodings.length; // ALL encodings must match (100%)

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

        // Comprehensive logging for audit and debugging
        console.log(`[Check-out Verification] 🔒 SECURITY CHECK for User: ${hoiVienId}, Session: ${buoiTapId}`);
        console.log(`  - Average encoding similarity: ${similarityWithAverage.toFixed(4)} (required: >= ${threshold})`);
        console.log(`  - Matches with average: ${matchesWithAverage ? '✅ YES' : '❌ NO'}`);
        console.log(`  - Individual encoding similarities:`, similarities.map(s => `${s.index + 1}: ${s.similarity.toFixed(4)}${s.similarity >= threshold ? ' ✅' : ' ❌'}`).join(', '));
        console.log(`  - Matches with stored encodings: ${matchesWithStored.length}/${faceEncodingDoc.encodings.length} (required: ALL ${requiredMatches})`);
        console.log(`  - Meets stored requirement (100% match): ${meetsStoredRequirement ? '✅ YES' : '❌ NO'}`);
        console.log(`  - Max similarity: ${maxSimilarity.toFixed(4)} (threshold: ${threshold}, min required: ${minMaxSimilarity})`);
        console.log(`  - Meets max similarity requirement: ${meetsMaxSimilarityRequirement ? '✅ YES' : '❌ NO'}`);
        console.log(`  - Final Match: ${finalMatch ? '✅✅✅ PASS - FACE VERIFIED' : '❌❌❌ FAIL - FACE REJECTED'}`);

        if (!finalMatch) {
            console.log(`  - ❌❌❌ CHECK-OUT BLOCKED - VERIFICATION FAILED - SECURITY REJECTION:`);
            if (!matchesWithAverage) {
                console.log(`    ❌ Average encoding similarity (${similarityWithAverage.toFixed(4)}) < threshold (${threshold})`);
            }
            if (!meetsStoredRequirement) {
                console.log(`    ❌ Only ${matchesWithStored.length}/${faceEncodingDoc.encodings.length} stored encodings match (required: ALL ${requiredMatches})`);
                console.log(`    ❌ This face does NOT match the enrolled face profile`);
            }
            if (maxSimilarity < threshold) {
                console.log(`    ❌ Max similarity (${maxSimilarity.toFixed(4)}) < threshold (${threshold})`);
            }
            if (!meetsMaxSimilarityRequirement) {
                console.log(`    ❌ Max similarity (${maxSimilarity.toFixed(4)}) < minimum required (${minMaxSimilarity})`);
            }
            console.log(`  - 🔒 SECURITY: Face REJECTED - This is NOT the enrolled user's face`);

            return res.status(401).json({
                success: false,
                message: `Khuôn mặt không khớp với khuôn mặt đã đăng ký (Độ tương đồng tối đa: ${(maxSimilarity * 100).toFixed(1)}%, Yêu cầu: ${(threshold * 100).toFixed(1)}%. Khớp với ${matchesWithStored.length}/${faceEncodingDoc.encodings.length} encodings, yêu cầu: TẤT CẢ ${requiredMatches})`,
                similarity: maxSimilarity,
                similarityWithAverage: similarityWithAverage,
                matchesWithStored: matchesWithStored.length,
                totalStored: faceEncodingDoc.encodings.length,
                requiredMatches: requiredMatches
            });
        }

        console.log(`  - ✅✅✅ SECURITY: Face VERIFIED - This IS the enrolled user's face`);

        console.log(`  - ✅ VERIFICATION PASSED - Allowing check-out`);

        // Find check-in record
        const checkInRecord = await CheckInRecord.findOne({
            hoiVien: hoiVienId,
            buoiTap: buoiTapId,
            checkOutTime: null
        }).populate('buoiTap');

        if (!checkInRecord) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bản ghi check-in. Vui lòng check-in trước.'
            });
        }

        // Get buoi tap
        const buoiTap = checkInRecord.buoiTap || await BuoiTap.findById(buoiTapId);
        if (!buoiTap) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy buổi tập'
            });
        }

        // Calculate check-out status
        const now = new Date();
        const scheduledEndTime = parseTime(buoiTap.gioKetThuc, buoiTap.ngayTap);
        const checkOutStatus = getCheckOutStatus(now, scheduledEndTime);
        const thoiGianSomCheckOut = now < scheduledEndTime
            ? getTimeDifference(scheduledEndTime, now)
            : 0;

        // Update check-in record
        checkInRecord.checkOutTime = now;
        checkInRecord.checkOutStatus = checkOutStatus;
        checkInRecord.thoiGianSomCheckOut = thoiGianSomCheckOut;
        checkInRecord.anhCheckOut = image || null;
        await checkInRecord.save();

        res.status(200).json({
            success: true,
            message: 'Check-out thành công',
            data: {
                checkInRecord: {
                    checkInTime: checkInRecord.checkInTime,
                    checkOutTime: checkInRecord.checkOutTime,
                    checkInStatus: checkInRecord.checkInStatus,
                    checkOutStatus: checkInRecord.checkOutStatus,
                    thoiGianSomCheckOut: checkInRecord.thoiGianSomCheckOut,
                    sessionDuration: checkInRecord.sessionDuration
                },
                buoiTap: {
                    tenBuoiTap: buoiTap.tenBuoiTap,
                    gioBatDau: buoiTap.gioBatDau,
                    gioKetThuc: buoiTap.gioKetThuc
                }
            }
        });
    } catch (error) {
        console.error('Error in checkOut:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi check-out',
            error: error.message
        });
    }
};

// Get check-in history
exports.getCheckInHistory = async (req, res) => {
    try {
        const hoiVienId = req.user.id;
        const { limit = 50, startDate, endDate } = req.query;

        const query = {
            hoiVien: hoiVienId
        };

        if (startDate || endDate) {
            query.checkInTime = {};
            if (startDate) {
                query.checkInTime.$gte = new Date(startDate);
            }
            if (endDate) {
                query.checkInTime.$lte = new Date(endDate);
            }
        }

        const checkInRecords = await CheckInRecord.find(query)
            .populate({
                path: 'buoiTap',
                select: 'tenBuoiTap ngayTap gioBatDau gioKetThuc chiNhanh ptPhuTrach',
                populate: [
                    {
                        path: 'chiNhanh',
                        select: 'tenChiNhanh'
                    },
                    {
                        path: 'ptPhuTrach',
                        select: 'hoTen'
                    }
                ]
            })
            .sort({ checkInTime: -1 })
            .limit(parseInt(limit))
            .lean(); // Sử dụng lean() để trả về plain JavaScript objects

        // Đảm bảo serialize đúng
        const serializedRecords = checkInRecords.map(record => {
            const serialized = {
                ...record,
                buoiTap: record.buoiTap ? {
                    _id: record.buoiTap._id,
                    tenBuoiTap: record.buoiTap.tenBuoiTap,
                    ngayTap: record.buoiTap.ngayTap,
                    gioBatDau: record.buoiTap.gioBatDau,
                    gioKetThuc: record.buoiTap.gioKetThuc,
                    chiNhanh: record.buoiTap.chiNhanh ? {
                        _id: record.buoiTap.chiNhanh._id,
                        tenChiNhanh: record.buoiTap.chiNhanh.tenChiNhanh
                    } : null,
                    ptPhuTrach: record.buoiTap.ptPhuTrach ? {
                        _id: record.buoiTap.ptPhuTrach._id,
                        hoTen: record.buoiTap.ptPhuTrach.hoTen
                    } : null
                } : null
            };
            return serialized;
        });

        res.status(200).json({
            success: true,
            data: serializedRecords,
            count: serializedRecords.length
        });
    } catch (error) {
        console.error('Error in getCheckInHistory:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy lịch sử check-in',
            error: error.message
        });
    }
};

// Get QR code of current member
exports.getQRCode = async (req, res) => {
    try {
        const hoiVienId = req.user.id;

        // Find member
        const hoiVien = await HoiVien.findById(hoiVienId).select('qrCode hoTen');

        if (!hoiVien) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy hội viên'
            });
        }

        // If QR code doesn't exist, generate it (for existing members)
        if (!hoiVien.qrCode) {
            // Generate QR code
            const crypto = require('crypto');
            let qrCode;
            let isUnique = false;

            while (!isUnique) {
                qrCode = crypto.randomBytes(32).toString('hex');
                const existing = await HoiVien.findOne({ qrCode: qrCode });
                if (!existing) {
                    isUnique = true;
                }
            }

            hoiVien.qrCode = qrCode;
            await hoiVien.save();
        }

        res.status(200).json({
            success: true,
            data: {
                qrCode: hoiVien.qrCode,
                hoTen: hoiVien.hoTen
            }
        });
    } catch (error) {
        console.error('Error in getQRCode:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy mã QR',
            error: error.message
        });
    }
};

// Check-in with QR code
exports.checkInWithQR = async (req, res) => {
    try {
        const { buoiTapId, qrCode } = req.body;

        // Validate input
        if (!buoiTapId) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp ID buổi tập'
            });
        }

        if (!qrCode) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp mã QR'
            });
        }

        // Find member by QR code
        const hoiVien = await HoiVien.findOne({ qrCode: qrCode });

        if (!hoiVien) {
            return res.status(404).json({
                success: false,
                message: 'Mã QR không hợp lệ'
            });
        }

        // Check if member is active
        if (hoiVien.trangThaiHoiVien !== 'DANG_HOAT_DONG') {
            return res.status(403).json({
                success: false,
                message: 'Tài khoản hội viên không hoạt động'
            });
        }

        const hoiVienId = hoiVien._id;

        // QUAN TRỌNG: Kiểm tra xem có buổi tập nào đang check-in mà chưa check-out không
        // Điều này đảm bảo không thể check-in nhiều ca cùng lúc
        const activeCheckIn = await CheckInRecord.findOne({
            hoiVien: hoiVienId,
            checkOutTime: null // Chưa check-out - bất kỳ buổi tập nào
        })
            .populate('buoiTap', 'tenBuoiTap ngayTap gioBatDau gioKetThuc');

        if (activeCheckIn) {
            const buoiTapInfo = activeCheckIn.buoiTap;
            const checkInTime = new Date(activeCheckIn.checkInTime);
            const timeStr = checkInTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

            // Kiểm tra xem có phải đang cố check-in lại cùng một buổi tập không
            const isSameSession = activeCheckIn.buoiTap._id.toString() === buoiTapId.toString();

            console.log(`❌ QR Check-in blocked: User ${hoiVienId} already has active check-in for session ${activeCheckIn.buoiTap._id}`);
            console.log(`   - Is same session: ${isSameSession}`);
            console.log(`   - Requested buoiTapId: ${buoiTapId}`);

            if (isSameSession) {
                return res.status(400).json({
                    success: false,
                    message: `Bạn đã check-in buổi tập "${buoiTapInfo?.tenBuoiTap || 'N/A'}" rồi. Vui lòng check-out trước khi check-in lại.`,
                    activeCheckIn: {
                        buoiTapId: activeCheckIn.buoiTap._id,
                        buoiTapName: buoiTapInfo?.tenBuoiTap || 'N/A',
                        checkInTime: activeCheckIn.checkInTime,
                        checkInTimeFormatted: timeStr
                    }
                });
            } else {
                return res.status(400).json({
                    success: false,
                    message: `Bạn đang có buổi tập chưa check-out. Vui lòng check-out buổi tập "${buoiTapInfo?.tenBuoiTap || 'N/A'}" (Check-in lúc ${timeStr}) trước khi check-in buổi tập mới. Không thể check-in nhiều ca cùng lúc.`,
                    activeCheckIn: {
                        buoiTapId: activeCheckIn.buoiTap._id,
                        buoiTapName: buoiTapInfo?.tenBuoiTap || 'N/A',
                        checkInTime: activeCheckIn.checkInTime,
                        checkInTimeFormatted: timeStr
                    }
                });
            }
        }

        // Check if session exists and member is registered
        const buoiTap = await BuoiTap.findById(buoiTapId)
            .populate('chiNhanh', 'tenChiNhanh diaChi')
            .populate('ptPhuTrach', 'hoTen');

        if (!buoiTap) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy buổi tập'
            });
        }

        // Check if member is registered for this session
        const memberInfo = buoiTap.danhSachHoiVien.find(
            member => member.hoiVien.toString() === hoiVienId.toString()
        );

        if (!memberInfo || memberInfo.trangThai !== 'DA_DANG_KY') {
            return res.status(403).json({
                success: false,
                message: 'Bạn chưa đăng ký buổi tập này'
            });
        }

        // Calculate check-in status
        const now = new Date();
        const scheduledStartTime = parseTime(buoiTap.gioBatDau, buoiTap.ngayTap);
        const checkInStatus = getCheckInStatus(now, scheduledStartTime);
        const thoiGianMuonCheckIn = now > scheduledStartTime
            ? getTimeDifference(now, scheduledStartTime)
            : 0;

        // Create check-in record
        const checkInRecord = new CheckInRecord({
            hoiVien: hoiVienId,
            buoiTap: buoiTapId,
            checkInTime: now,
            checkInStatus: checkInStatus,
            thoiGianMuonCheckIn: thoiGianMuonCheckIn
        });

        await checkInRecord.save();

        // Populate buoiTap với PT và chi nhánh
        await buoiTap.populate('ptPhuTrach', 'hoTen');
        await buoiTap.populate('chiNhanh', 'tenChiNhanh');

        // Chuyển đổi sang plain object để đảm bảo serialize đúng
        const buoiTapData = {
            _id: buoiTap._id,
            tenBuoiTap: buoiTap.tenBuoiTap,
            ngayTap: buoiTap.ngayTap,
            gioBatDau: buoiTap.gioBatDau,
            gioKetThuc: buoiTap.gioKetThuc,
            ptPhuTrach: buoiTap.ptPhuTrach ? {
                _id: buoiTap.ptPhuTrach._id,
                hoTen: buoiTap.ptPhuTrach.hoTen
            } : null,
            chiNhanh: buoiTap.chiNhanh ? {
                _id: buoiTap.chiNhanh._id,
                tenChiNhanh: buoiTap.chiNhanh.tenChiNhanh
            } : null
        };

        console.log(`[QR Check-in] ✅ Member ${hoiVienId} checked in to session ${buoiTapId} using QR code`);

        res.status(200).json({
            success: true,
            message: 'Check-in thành công',
            data: {
                checkInRecord: {
                    checkInTime: checkInRecord.checkInTime,
                    checkInStatus: checkInRecord.checkInStatus,
                    thoiGianMuonCheckIn: checkInRecord.thoiGianMuonCheckIn
                },
                buoiTap: buoiTapData
            }
        });
    } catch (error) {
        console.error('Error in checkInWithQR:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi check-in bằng QR code',
            error: error.message
        });
    }
};

// Check-out with QR code
exports.checkOutWithQR = async (req, res) => {
    try {
        const { buoiTapId, qrCode } = req.body;

        // Validate input
        if (!buoiTapId) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp ID buổi tập'
            });
        }

        if (!qrCode) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp mã QR'
            });
        }

        // Find member by QR code
        const hoiVien = await HoiVien.findOne({ qrCode: qrCode });

        if (!hoiVien) {
            return res.status(404).json({
                success: false,
                message: 'Mã QR không hợp lệ'
            });
        }

        // Check if member is active
        if (hoiVien.trangThaiHoiVien !== 'DANG_HOAT_DONG') {
            return res.status(403).json({
                success: false,
                message: 'Tài khoản hội viên không hoạt động'
            });
        }

        const hoiVienId = hoiVien._id;

        // Find check-in record
        const checkInRecord = await CheckInRecord.findOne({
            hoiVien: hoiVienId,
            buoiTap: buoiTapId,
            checkOutTime: null
        }).populate('buoiTap');

        if (!checkInRecord) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bản ghi check-in. Vui lòng check-in trước.'
            });
        }

        // Get buoi tap
        const buoiTap = checkInRecord.buoiTap || await BuoiTap.findById(buoiTapId);
        if (!buoiTap) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy buổi tập'
            });
        }

        // Calculate check-out status
        const now = new Date();
        const scheduledEndTime = parseTime(buoiTap.gioKetThuc, buoiTap.ngayTap);
        const checkOutStatus = getCheckOutStatus(now, scheduledEndTime);
        const thoiGianSomCheckOut = now < scheduledEndTime
            ? getTimeDifference(scheduledEndTime, now)
            : 0;

        // Calculate session duration
        const sessionDuration = getTimeDifference(now, checkInRecord.checkInTime);

        // Update check-in record
        checkInRecord.checkOutTime = now;
        checkInRecord.checkOutStatus = checkOutStatus;
        checkInRecord.thoiGianSomCheckOut = thoiGianSomCheckOut;
        checkInRecord.sessionDuration = sessionDuration;
        await checkInRecord.save();

        console.log(`[QR Check-out] ✅ Member ${hoiVienId} checked out from session ${buoiTapId} using QR code`);

        res.status(200).json({
            success: true,
            message: 'Check-out thành công',
            data: {
                checkInRecord: {
                    checkInTime: checkInRecord.checkInTime,
                    checkOutTime: checkInRecord.checkOutTime,
                    checkInStatus: checkInRecord.checkInStatus,
                    checkOutStatus: checkInRecord.checkOutStatus,
                    thoiGianSomCheckOut: checkInRecord.thoiGianSomCheckOut,
                    sessionDuration: checkInRecord.sessionDuration
                },
                buoiTap: {
                    tenBuoiTap: buoiTap.tenBuoiTap,
                    gioBatDau: buoiTap.gioBatDau,
                    gioKetThuc: buoiTap.gioKetThuc
                }
            }
        });
    } catch (error) {
        console.error('Error in checkOutWithQR:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi check-out bằng QR code',
            error: error.message
        });
    }
};

