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
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Find sessions where member is registered
        const buoiTaps = await BuoiTap.find({
            'danhSachHoiVien.hoiVien': hoiVienId,
            ngayTap: {
                $gte: today,
                $lt: tomorrow
            }
        })
            .populate('chiNhanh', 'tenChiNhanh diaChi')
            .populate('ptPhuTrach', 'hoTen')
            .sort({ gioBatDau: 1 });

        // Get check-in records for today
        const checkInRecords = await CheckInRecord.find({
            hoiVien: hoiVienId,
            checkInTime: {
                $gte: today,
                $lt: tomorrow
            }
        });

        // Map check-in records to sessions
        const sessionsWithCheckIn = buoiTaps.map(buoiTap => {
            const checkInRecord = checkInRecords.find(
                record => record.buoiTap.toString() === buoiTap._id.toString()
            );

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
                    checkOutStatus: checkInRecord.checkOutStatus
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

        // Threshold for face matching - increased to 0.85 for EXTREMELY strict matching
        // This prevents false positives from photos, different people, etc.
        const threshold = 0.85;

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

        // CRITICAL VALIDATION: Require similarity with average encoding AND at least 2/3 stored encodings
        const matchesWithAverage = similarityWithAverage >= threshold;
        const matchesWithStored = similarities.filter(s => s.similarity >= threshold);
        const requiredMatches = Math.ceil((faceEncodingDoc.encodings.length * 2) / 3); // At least 2/3

        const meetsStoredRequirement = matchesWithStored.length >= requiredMatches;
        const finalMatch = matchesWithAverage && meetsStoredRequirement && maxSimilarity >= threshold;

        // Comprehensive logging for audit and debugging
        console.log(`[Check-in Verification] User: ${hoiVienId}, Session: ${buoiTapId}`);
        console.log(`  - Average encoding similarity: ${similarityWithAverage.toFixed(4)} (required: >= ${threshold})`);
        console.log(`  - Matches with average: ${matchesWithAverage ? 'YES' : 'NO'}`);
        console.log(`  - Individual encoding similarities:`, similarities.map(s => `${s.index + 1}: ${s.similarity.toFixed(4)}`).join(', '));
        console.log(`  - Matches with stored encodings: ${matchesWithStored.length}/${faceEncodingDoc.encodings.length} (required: >= ${requiredMatches})`);
        console.log(`  - Max similarity: ${maxSimilarity.toFixed(4)}`);
        console.log(`  - Threshold: ${threshold}`);
        console.log(`  - Meets stored requirement: ${meetsStoredRequirement ? 'YES' : 'NO'}`);
        console.log(`  - Final Match: ${finalMatch ? '✅ PASS' : '❌ FAIL'}`);

        if (!finalMatch) {
            console.log(`  - ❌ CHECK-IN BLOCKED - VERIFICATION FAILED:`);
            if (!matchesWithAverage) {
                console.log(`    - Average encoding similarity (${similarityWithAverage.toFixed(4)}) < threshold (${threshold})`);
            }
            if (!meetsStoredRequirement) {
                console.log(`    - Only ${matchesWithStored.length}/${faceEncodingDoc.encodings.length} stored encodings match (required: >= ${requiredMatches})`);
            }
            if (maxSimilarity < threshold) {
                console.log(`    - Max similarity (${maxSimilarity.toFixed(4)}) < threshold (${threshold})`);
            }

            return res.status(401).json({
                success: false,
                message: `Khuôn mặt không khớp với khuôn mặt đã đăng ký (Độ tương đồng tối đa: ${(maxSimilarity * 100).toFixed(1)}%, Yêu cầu: ${(threshold * 100).toFixed(1)}%. Khớp với ${matchesWithStored.length}/${faceEncodingDoc.encodings.length} encodings, yêu cầu: >= ${requiredMatches})`,
                similarity: maxSimilarity,
                similarityWithAverage: similarityWithAverage,
                matchesWithStored: matchesWithStored.length,
                totalStored: faceEncodingDoc.encodings.length,
                requiredMatches: requiredMatches
            });
        }

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

        res.status(200).json({
            success: true,
            message: 'Check-in thành công',
            data: {
                checkInRecord: {
                    checkInTime: checkInRecord.checkInTime,
                    checkInStatus: checkInRecord.checkInStatus,
                    thoiGianMuonCheckIn: checkInRecord.thoiGianMuonCheckIn
                },
                buoiTap: {
                    tenBuoiTap: buoiTap.tenBuoiTap,
                    gioBatDau: buoiTap.gioBatDau,
                    gioKetThuc: buoiTap.gioKetThuc
                }
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

        // Threshold for face matching - increased to 0.85 for EXTREMELY strict matching
        // This prevents false positives from photos, different people, etc.
        const threshold = 0.85;

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

        // CRITICAL VALIDATION: Require similarity with average encoding AND at least 2/3 stored encodings
        const matchesWithAverage = similarityWithAverage >= threshold;
        const matchesWithStored = similarities.filter(s => s.similarity >= threshold);
        const requiredMatches = Math.ceil((faceEncodingDoc.encodings.length * 2) / 3); // At least 2/3

        const meetsStoredRequirement = matchesWithStored.length >= requiredMatches;
        const finalMatch = matchesWithAverage && meetsStoredRequirement && maxSimilarity >= threshold;

        // Comprehensive logging for audit and debugging
        console.log(`[Check-out Verification] User: ${hoiVienId}, Session: ${buoiTapId}`);
        console.log(`  - Average encoding similarity: ${similarityWithAverage.toFixed(4)} (required: >= ${threshold})`);
        console.log(`  - Matches with average: ${matchesWithAverage ? 'YES' : 'NO'}`);
        console.log(`  - Individual encoding similarities:`, similarities.map(s => `${s.index + 1}: ${s.similarity.toFixed(4)}`).join(', '));
        console.log(`  - Matches with stored encodings: ${matchesWithStored.length}/${faceEncodingDoc.encodings.length} (required: >= ${requiredMatches})`);
        console.log(`  - Max similarity: ${maxSimilarity.toFixed(4)}`);
        console.log(`  - Threshold: ${threshold}`);
        console.log(`  - Meets stored requirement: ${meetsStoredRequirement ? 'YES' : 'NO'}`);
        console.log(`  - Final Match: ${finalMatch ? '✅ PASS' : '❌ FAIL'}`);

        if (!finalMatch) {
            console.log(`  - ❌ CHECK-OUT BLOCKED - VERIFICATION FAILED:`);
            if (!matchesWithAverage) {
                console.log(`    - Average encoding similarity (${similarityWithAverage.toFixed(4)}) < threshold (${threshold})`);
            }
            if (!meetsStoredRequirement) {
                console.log(`    - Only ${matchesWithStored.length}/${faceEncodingDoc.encodings.length} stored encodings match (required: >= ${requiredMatches})`);
            }
            if (maxSimilarity < threshold) {
                console.log(`    - Max similarity (${maxSimilarity.toFixed(4)}) < threshold (${threshold})`);
            }

            return res.status(401).json({
                success: false,
                message: `Khuôn mặt không khớp với khuôn mặt đã đăng ký (Độ tương đồng tối đa: ${(maxSimilarity * 100).toFixed(1)}%, Yêu cầu: ${(threshold * 100).toFixed(1)}%. Khớp với ${matchesWithStored.length}/${faceEncodingDoc.encodings.length} encodings, yêu cầu: >= ${requiredMatches})`,
                similarity: maxSimilarity,
                similarityWithAverage: similarityWithAverage,
                matchesWithStored: matchesWithStored.length,
                totalStored: faceEncodingDoc.encodings.length,
                requiredMatches: requiredMatches
            });
        }

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
            .populate('buoiTap', 'tenBuoiTap ngayTap gioBatDau gioKetThuc chiNhanh ptPhuTrach')
            .populate('buoiTap.chiNhanh', 'tenChiNhanh')
            .populate('buoiTap.ptPhuTrach', 'hoTen')
            .sort({ checkInTime: -1 })
            .limit(parseInt(limit));

        res.status(200).json({
            success: true,
            data: checkInRecords,
            count: checkInRecords.length
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

