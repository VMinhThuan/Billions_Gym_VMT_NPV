const BuoiTap = require('../models/BuoiTap');
const UserNotification = require('../models/UserNotification');

// Helper function to parse time string (HH:mm) to Date
const parseTime = (timeString, date) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const time = new Date(date);
    time.setHours(hours, minutes, 0, 0);
    return time;
};

// Service to check and send notifications for PT sessions starting in 25 minutes
const checkAndNotifyPTSessions = async () => {
    try {
        const now = new Date();
        const twentyFiveMinutesLater = new Date(now);
        twentyFiveMinutesLater.setMinutes(twentyFiveMinutesLater.getMinutes() + 25);

        // Find all sessions starting in 25 minutes
        const upcomingSessions = await BuoiTap.find({
            ngayTap: {
                $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
                $lte: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
            },
            trangThai: { $ne: 'HUY' }
        })
            .populate('ptPhuTrach', '_id hoTen')
            .lean();

        for (const session of upcomingSessions) {
            if (!session.ptPhuTrach) continue;

            const scheduledStartTime = parseTime(session.gioBatDau, session.ngayTap);
            const notificationTime = new Date(scheduledStartTime);
            notificationTime.setMinutes(notificationTime.getMinutes() - 25);

            // Check if it's time to send notification (within 1 minute window)
            const timeDiff = Math.abs(now - notificationTime);
            if (timeDiff <= 60000) { // Within 1 minute window
                // Check if notification already sent
                const existingNotification = await UserNotification.findOne({
                    userId: session.ptPhuTrach._id,
                    loaiThongBao: 'PT_SESSION_REMINDER',
                    'duLieuLienQuan.buoiTapId': session._id.toString(),
                    createdAt: {
                        $gte: new Date(now.getTime() - 60000) // Within last minute
                    }
                });

                if (!existingNotification) {
                    // Create notification
                    await UserNotification.create({
                        userId: session.ptPhuTrach._id,
                        tieuDe: 'Buổi tập sắp bắt đầu',
                        noiDung: `Buổi tập "${session.tenBuoiTap}" của bạn sẽ bắt đầu trong 25 phút (${session.gioBatDau}). Vui lòng có mặt trước 15 phút để check-in.`,
                        loaiThongBao: 'PT_SESSION_REMINDER',
                        duLieuLienQuan: {
                            buoiTapId: session._id.toString(),
                            tenBuoiTap: session.tenBuoiTap,
                            gioBatDau: session.gioBatDau,
                            ngayTap: session.ngayTap
                        }
                    });

                    console.log(`[PT Notification] Sent reminder to PT ${session.ptPhuTrach.hoTen} for session ${session.tenBuoiTap}`);
                }
            }
        }
    } catch (error) {
        console.error('Error in checkAndNotifyPTSessions:', error);
    }
};

// Start the notification service (run every minute)
const startPTSessionNotificationService = () => {
    console.log('[PT Notification Service] Started - checking every minute for sessions starting in 25 minutes');

    // Run immediately
    checkAndNotifyPTSessions();

    // Then run every minute
    setInterval(checkAndNotifyPTSessions, 60000); // 60000ms = 1 minute
};

module.exports = {
    checkAndNotifyPTSessions,
    startPTSessionNotificationService
};

