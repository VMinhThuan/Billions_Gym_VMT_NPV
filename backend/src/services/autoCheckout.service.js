const CheckInRecord = require('../models/CheckInRecord');
const BuoiTap = require('../models/BuoiTap');

// Helper function to parse time string (HH:mm) to Date
const parseTime = (timeString, date) => {
    if (!timeString || !date) return null;
    const [hours, minutes] = timeString.split(':').map(Number);
    const time = new Date(date);
    time.setHours(hours, minutes, 0, 0);
    return time;
};

// Helper function to determine check-out status
const getCheckOutStatus = (checkOutTime, scheduledEndTime) => {
    const diffMinutes = Math.round((checkOutTime - scheduledEndTime) / (1000 * 60));
    if (diffMinutes >= -5 && diffMinutes <= 5) {
        return 'DUNG_GIO';
    } else if (diffMinutes < -5) {
        return 'SOM';
    } else {
        return 'DUNG_GIO'; // If late, still consider as on-time for check-out
    }
};

/**
 * Tự động check-out các buổi tập đã quá 3 giờ kể từ khi hết giờ tập
 * @returns {Promise<{success: boolean, processed: number, errors: number}>}
 */
exports.autoCheckoutExpiredSessions = async () => {
    try {
        console.log('[Auto Check-out] Bắt đầu kiểm tra các buổi tập cần tự động check-out...');

        // Tìm tất cả các check-in record chưa check-out
        const pendingCheckOuts = await CheckInRecord.find({
            checkOutTime: null
        }).populate('buoiTap', 'tenBuoiTap ngayTap gioKetThuc');

        if (!pendingCheckOuts || pendingCheckOuts.length === 0) {
            console.log('[Auto Check-out] Không có buổi tập nào cần tự động check-out');
            return {
                success: true,
                processed: 0,
                errors: 0,
                details: []
            };
        }

        console.log(`[Auto Check-out] Tìm thấy ${pendingCheckOuts.length} buổi tập chưa check-out`);

        const now = new Date();
        const AUTO_CHECKOUT_DELAY_HOURS = 3; // 3 giờ sau khi hết giờ tập
        const AUTO_CHECKOUT_DELAY_MS = AUTO_CHECKOUT_DELAY_HOURS * 60 * 60 * 1000; // 3 giờ = 3 * 60 * 60 * 1000 ms

        let processedCount = 0;
        let errorCount = 0;
        const details = [];

        for (const checkInRecord of pendingCheckOuts) {
            try {
                const buoiTap = checkInRecord.buoiTap;

                // Kiểm tra xem buoiTap có tồn tại không
                if (!buoiTap) {
                    console.warn(`[Auto Check-out] Buổi tập không tồn tại cho check-in record ${checkInRecord._id}`);
                    errorCount++;
                    continue;
                }

                // Kiểm tra xem có gioKetThuc và ngayTap không
                if (!buoiTap.gioKetThuc || !buoiTap.ngayTap) {
                    console.warn(`[Auto Check-out] Buổi tập ${buoiTap._id} thiếu thông tin gioKetThuc hoặc ngayTap`);
                    errorCount++;
                    continue;
                }

                // Tính thời gian kết thúc của buổi tập
                const scheduledEndTime = parseTime(buoiTap.gioKetThuc, buoiTap.ngayTap);

                if (!scheduledEndTime) {
                    console.warn(`[Auto Check-out] Không thể parse thời gian kết thúc cho buổi tập ${buoiTap._id}`);
                    errorCount++;
                    continue;
                }

                // Tính thời gian tự động check-out (3 giờ sau khi hết giờ tập)
                const autoCheckoutTime = new Date(scheduledEndTime.getTime() + AUTO_CHECKOUT_DELAY_MS);

                // Kiểm tra xem đã quá 3 giờ kể từ khi hết giờ tập chưa
                if (now >= autoCheckoutTime) {
                    // Tự động check-out
                    const checkOutTime = now;
                    const checkOutStatus = getCheckOutStatus(checkOutTime, scheduledEndTime);
                    const thoiGianSomCheckOut = checkOutTime < scheduledEndTime
                        ? Math.round((scheduledEndTime - checkOutTime) / (1000 * 60))
                        : 0;

                    // Cập nhật check-in record
                    checkInRecord.checkOutTime = checkOutTime;
                    checkInRecord.checkOutStatus = checkOutStatus;
                    checkInRecord.thoiGianSomCheckOut = thoiGianSomCheckOut;
                    checkInRecord.ghiChu = 'Tự động check-out do hội viên quên';
                    await checkInRecord.save();

                    processedCount++;
                    details.push({
                        checkInRecordId: checkInRecord._id,
                        buoiTapId: buoiTap._id,
                        buoiTapName: buoiTap.tenBuoiTap || 'N/A',
                        hoiVienId: checkInRecord.hoiVien,
                        scheduledEndTime: scheduledEndTime,
                        autoCheckoutTime: autoCheckoutTime,
                        actualCheckoutTime: checkOutTime,
                        hoursLate: ((checkOutTime - scheduledEndTime) / (1000 * 60 * 60)).toFixed(2)
                    });

                    console.log(`[Auto Check-out] ✅ Đã tự động check-out buổi tập "${buoiTap.tenBuoiTap}" cho hội viên ${checkInRecord.hoiVien}`);
                    console.log(`   - Thời gian kết thúc dự kiến: ${scheduledEndTime.toLocaleString('vi-VN')}`);
                    console.log(`   - Thời gian tự động check-out: ${checkOutTime.toLocaleString('vi-VN')}`);
                    console.log(`   - Trễ: ${((checkOutTime - scheduledEndTime) / (1000 * 60 * 60)).toFixed(2)} giờ`);
                } else {
                    // Chưa đến thời gian tự động check-out
                    const remainingMs = autoCheckoutTime - now;
                    const remainingHours = (remainingMs / (1000 * 60 * 60)).toFixed(2);
                    console.log(`[Auto Check-out] ⏳ Buổi tập "${buoiTap.tenBuoiTap}" chưa đến thời gian tự động check-out (còn ${remainingHours} giờ)`);
                }
            } catch (error) {
                console.error(`[Auto Check-out] ❌ Lỗi khi xử lý check-in record ${checkInRecord._id}:`, error.message);
                errorCount++;
                details.push({
                    checkInRecordId: checkInRecord._id,
                    error: error.message
                });
            }
        }

        console.log(`[Auto Check-out] Hoàn thành: ${processedCount} buổi tập đã được tự động check-out, ${errorCount} lỗi`);

        return {
            success: true,
            processed: processedCount,
            errors: errorCount,
            details: details
        };
    } catch (error) {
        console.error('[Auto Check-out] ❌ Lỗi khi chạy tự động check-out:', error);
        return {
            success: false,
            processed: 0,
            errors: 1,
            error: error.message,
            details: []
        };
    }
};

