const PTCheckInRecord = require('../models/PTCheckInRecord');
const BuoiTap = require('../models/BuoiTap');
const { PT } = require('../models/NguoiDung');
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

// Helper function to determine PT check-in status (phải có mặt trước 15 phút)
const getPTCheckInStatus = (checkInTime, scheduledStartTime) => {
    const requiredCheckInTime = new Date(scheduledStartTime);
    requiredCheckInTime.setMinutes(requiredCheckInTime.getMinutes() - 15); // Phải có mặt trước 15 phút

    const diffMinutes = getTimeDifference(checkInTime, requiredCheckInTime);

    if (diffMinutes <= 0) {
        // Check-in trước hoặc đúng thời gian yêu cầu (trước 15 phút)
        return 'DUNG_GIO';
    } else if (checkInTime < scheduledStartTime) {
        // Check-in sau thời gian yêu cầu nhưng vẫn trước giờ bắt đầu
        return 'MUON'; // Đi muộn so với yêu cầu
    } else {
        // Check-in sau giờ bắt đầu
        return 'MUON';
    }
};

// Helper function to calculate penalty for late check-in (trừ lương)
const calculatePenalty = (minutesLate, baseSalary) => {
    // Trừ 5% lương cho mỗi 5 phút muộn
    const penaltyRate = 0.05; // 5% per 5 minutes
    const penaltyUnits = Math.ceil(minutesLate / 5);
    const penalty = baseSalary * penaltyRate * penaltyUnits;
    return Math.min(penalty, baseSalary * 0.5); // Tối đa trừ 50% lương
};

// Get today's sessions for PT
exports.getTodaySessions = async (req, res) => {
    try {
        const ptId = req.user.id;

        const now = new Date();
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(now);
        todayEnd.setHours(23, 59, 59, 999);

        // Find sessions where PT is assigned
        const buoiTaps = await BuoiTap.find({
            ptPhuTrach: ptId,
            ngayTap: {
                $gte: todayStart,
                $lte: todayEnd
            }
        })
            .populate('chiNhanh', 'tenChiNhanh diaChi')
            .sort({ gioBatDau: 1 });

        // Get check-in records for today
        const checkInRecords = await PTCheckInRecord.find({
            pt: ptId,
            checkInTime: {
                $gte: todayStart,
                $lte: todayEnd
            }
        }).populate('buoiTap').sort({ checkInTime: -1 });

        // Map sessions with check-in status
        const sessionsWithStatus = buoiTaps.map(buoiTap => {
            const checkInRecord = checkInRecords.find(
                record => record.buoiTap && record.buoiTap._id.toString() === buoiTap._id.toString()
            );

            const scheduledStartTime = parseTime(buoiTap.gioBatDau, buoiTap.ngayTap);
            const scheduledEndTime = parseTime(buoiTap.gioKetThuc, buoiTap.ngayTap);
            const requiredCheckInTime = new Date(scheduledStartTime);
            requiredCheckInTime.setMinutes(requiredCheckInTime.getMinutes() - 15);

            return {
                _id: buoiTap._id,
                tenBuoiTap: buoiTap.tenBuoiTap,
                ngayTap: buoiTap.ngayTap,
                gioBatDau: buoiTap.gioBatDau,
                gioKetThuc: buoiTap.gioKetThuc,
                chiNhanh: buoiTap.chiNhanh,
                scheduledStartTime: scheduledStartTime,
                scheduledEndTime: scheduledEndTime,
                requiredCheckInTime: requiredCheckInTime,
                hasCheckedIn: !!checkInRecord,
                hasCheckedOut: checkInRecord && checkInRecord.checkOutTime !== null,
                checkInRecord: checkInRecord ? {
                    _id: checkInRecord._id,
                    checkInTime: checkInRecord.checkInTime,
                    checkOutTime: checkInRecord.checkOutTime,
                    checkInStatus: checkInRecord.checkInStatus,
                    checkOutStatus: checkInRecord.checkOutStatus,
                    thoiGianMuonCheckIn: checkInRecord.thoiGianMuonCheckIn,
                    tienLuong: checkInRecord.tienLuong,
                    tienPhat: checkInRecord.tienPhat
                } : null
            };
        });

        res.status(200).json({
            success: true,
            data: sessionsWithStatus
        });
    } catch (error) {
        console.error('Error in getTodaySessions (PT):', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy danh sách buổi tập',
            error: error.message
        });
    }
};

// PT Check-in
exports.checkIn = async (req, res) => {
    try {
        const { buoiTapId, qrCode, image } = req.body;
        const ptId = req.user.id;

        if (!buoiTapId) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng chọn buổi tập'
            });
        }

        // If QR code is provided, verify it matches the PT's QR code
        if (qrCode) {
            const pt = await PT.findById(ptId).select('qrCode');
            if (!pt || pt.qrCode !== qrCode) {
                return res.status(403).json({
                    success: false,
                    message: 'Mã QR không hợp lệ hoặc không khớp với tài khoản của bạn'
                });
            }
        }

        // Find buoi tap
        const buoiTap = await BuoiTap.findById(buoiTapId);
        if (!buoiTap) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy buổi tập'
            });
        }

        // Verify PT is assigned to this session
        if (buoiTap.ptPhuTrach.toString() !== ptId) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không được phân công buổi tập này'
            });
        }

        // Check if already checked in
        const existingCheckIn = await PTCheckInRecord.findOne({
            pt: ptId,
            buoiTap: buoiTapId,
            checkOutTime: null
        });

        if (existingCheckIn) {
            return res.status(400).json({
                success: false,
                message: 'Bạn đã check-in vào buổi tập này'
            });
        }

        const now = new Date();
        const scheduledStartTime = parseTime(buoiTap.gioBatDau, buoiTap.ngayTap);
        const requiredCheckInTime = new Date(scheduledStartTime);
        requiredCheckInTime.setMinutes(requiredCheckInTime.getMinutes() - 15);

        // Check if too early (can check-in up to 30 minutes before required time)
        const earliestCheckIn = new Date(requiredCheckInTime);
        earliestCheckIn.setMinutes(earliestCheckIn.getMinutes() - 15); // 30 phút trước giờ bắt đầu

        if (now < earliestCheckIn) {
            return res.status(400).json({
                success: false,
                message: 'Chưa đến thời gian check-in. Bạn chỉ có thể check-in 30 phút trước giờ bắt đầu buổi tập.'
            });
        }

        // Calculate check-in status
        const checkInStatus = getPTCheckInStatus(now, scheduledStartTime);
        const thoiGianMuonCheckIn = now > requiredCheckInTime
            ? getTimeDifference(now, requiredCheckInTime)
            : 0;

        // Get PT info to calculate base salary
        const pt = await PT.findById(ptId);
        const baseSalary = pt?.luongCoBan || 0; // Lương cơ bản cho mỗi buổi tập

        // Calculate penalty if late
        let tienPhat = 0;
        if (thoiGianMuonCheckIn > 0) {
            tienPhat = calculatePenalty(thoiGianMuonCheckIn, baseSalary);
        }

        const tienLuong = baseSalary - tienPhat;

        // Create check-in record
        const checkInRecord = new PTCheckInRecord({
            pt: ptId,
            buoiTap: buoiTapId,
            checkInTime: now,
            checkInStatus: checkInStatus,
            thoiGianMuonCheckIn: thoiGianMuonCheckIn,
            anhCheckIn: image || null,
            tienLuong: tienLuong,
            tienPhat: tienPhat
        });

        await checkInRecord.save();

        // Populate buoiTap
        await buoiTap.populate('chiNhanh', 'tenChiNhanh');

        const buoiTapData = {
            _id: buoiTap._id,
            tenBuoiTap: buoiTap.tenBuoiTap,
            ngayTap: buoiTap.ngayTap,
            gioBatDau: buoiTap.gioBatDau,
            gioKetThuc: buoiTap.gioKetThuc,
            chiNhanh: buoiTap.chiNhanh
        };

        res.status(200).json({
            success: true,
            message: thoiGianMuonCheckIn > 0
                ? `Check-in thành công. Bạn đã đi muộn ${thoiGianMuonCheckIn} phút. Số tiền bị phạt: ${tienPhat.toLocaleString('vi-VN')} VNĐ`
                : 'Check-in thành công',
            data: {
                checkInRecord: {
                    checkInTime: checkInRecord.checkInTime,
                    checkInStatus: checkInRecord.checkInStatus,
                    thoiGianMuonCheckIn: checkInRecord.thoiGianMuonCheckIn,
                    tienLuong: checkInRecord.tienLuong,
                    tienPhat: checkInRecord.tienPhat
                },
                buoiTap: buoiTapData
            }
        });
    } catch (error) {
        console.error('Error in PT checkIn:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi check-in',
            error: error.message
        });
    }
};

// PT Check-out (chỉ được check-out khi hết buổi tập)
exports.checkOut = async (req, res) => {
    try {
        const { checkInRecordId, buoiTapId, qrCode, image } = req.body;
        const ptId = req.user.id;

        // If QR code is provided, verify it matches the PT's QR code
        if (qrCode) {
            const pt = await PT.findById(ptId).select('qrCode');
            if (!pt || pt.qrCode !== qrCode) {
                return res.status(403).json({
                    success: false,
                    message: 'Mã QR không hợp lệ hoặc không khớp với tài khoản của bạn'
                });
            }
        }

        // Prefer checkInRecordId if provided, otherwise use buoiTapId
        let checkInRecord;
        if (checkInRecordId) {
            checkInRecord = await PTCheckInRecord.findById(checkInRecordId).populate('buoiTap');
            if (!checkInRecord) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy bản ghi check-in'
                });
            }
            if (checkInRecord.pt.toString() !== ptId) {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn không có quyền check-out bản ghi này'
                });
            }
        } else if (buoiTapId) {
            checkInRecord = await PTCheckInRecord.findOne({
                pt: ptId,
                buoiTap: buoiTapId,
                checkOutTime: null
            }).populate('buoiTap');
        } else {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp ID bản ghi check-in hoặc ID buổi tập'
            });
        }

        if (!checkInRecord) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bản ghi check-in hoặc đã check-out rồi'
            });
        }

        const buoiTap = checkInRecord.buoiTap;
        if (!buoiTap) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy buổi tập'
            });
        }

        const now = new Date();
        const scheduledEndTime = parseTime(buoiTap.gioKetThuc, buoiTap.ngayTap);

        // Kiểm tra: PT chỉ được check-out khi hết buổi tập (sau giờ kết thúc)
        if (now < scheduledEndTime) {
            const minutesRemaining = getTimeDifference(scheduledEndTime, now);
            return res.status(400).json({
                success: false,
                message: `Bạn không thể check-out sớm. Buổi tập còn ${minutesRemaining} phút nữa mới kết thúc.`
            });
        }

        // Calculate check-out status
        const diffMinutes = getTimeDifference(now, scheduledEndTime);
        const checkOutStatus = diffMinutes <= 5 ? 'DUNG_GIO' : 'DUNG_GIO'; // Nếu muộn vẫn OK

        // Update check-out record
        checkInRecord.checkOutTime = now;
        checkInRecord.checkOutStatus = checkOutStatus;
        checkInRecord.anhCheckOut = image || null;

        // Recalculate duration and salary
        checkInRecord.sessionDuration = checkInRecord.calculateDuration();

        await checkInRecord.save();

        res.status(200).json({
            success: true,
            message: 'Check-out thành công',
            data: {
                checkInRecord: {
                    checkInTime: checkInRecord.checkInTime,
                    checkOutTime: checkInRecord.checkOutTime,
                    sessionDuration: checkInRecord.sessionDuration,
                    tienLuong: checkInRecord.tienLuong,
                    tienPhat: checkInRecord.tienPhat
                }
            }
        });
    } catch (error) {
        console.error('Error in PT checkOut:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi check-out',
            error: error.message
        });
    }
};

// Get PT check-in history
exports.getCheckInHistory = async (req, res) => {
    try {
        const ptId = req.user.id;
        const { limit = 50, startDate, endDate } = req.query;

        const query = {
            pt: ptId
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

        const checkInRecords = await PTCheckInRecord.find(query)
            .populate({
                path: 'buoiTap',
                select: 'tenBuoiTap ngayTap gioBatDau gioKetThuc chiNhanh',
                populate: {
                    path: 'chiNhanh',
                    select: 'tenChiNhanh'
                }
            })
            .sort({ checkInTime: -1 })
            .limit(parseInt(limit))
            .lean();

        res.status(200).json({
            success: true,
            data: checkInRecords,
            count: checkInRecords.length
        });
    } catch (error) {
        console.error('Error in getCheckInHistory (PT):', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy lịch sử check-in',
            error: error.message
        });
    }
};

// Get QR code of current PT
exports.getQRCode = async (req, res) => {
    try {
        const ptId = req.user.id;

        // Find PT
        const pt = await PT.findById(ptId).select('qrCode hoTen');

        if (!pt) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy PT'
            });
        }

        // If QR code doesn't exist, generate it (for existing PTs)
        if (!pt.qrCode) {
            // Generate QR code
            const crypto = require('crypto');
            let qrCode;
            let isUnique = false;

            while (!isUnique) {
                qrCode = crypto.randomBytes(32).toString('hex');
                const existing = await PT.findOne({ qrCode: qrCode });
                if (!existing) {
                    isUnique = true;
                }
            }

            pt.qrCode = qrCode;
            await pt.save();
        }

        res.status(200).json({
            success: true,
            data: {
                qrCode: pt.qrCode,
                hoTen: pt.hoTen
            }
        });
    } catch (error) {
        console.error('Error in getQRCode (PT):', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy mã QR',
            error: error.message
        });
    }
};

