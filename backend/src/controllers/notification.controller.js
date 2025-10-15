const UserNotification = require('../models/UserNotification');
const GoiTap = require('../models/GoiTap');
const ChiTietGoiTap = require('../models/ChiTietGoiTap');
const NguoiDung = require('../models/NguoiDung');

// Lấy danh sách thông báo của user
const getUserNotifications = async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const notifications = await UserNotification.find({ userId: userId })
            .populate('duLieuLienQuan.goiTapId', 'tenGoiTap donGia thoiHan donViThoiHan')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await UserNotification.countDocuments({ userId: userId });

        res.json({
            success: true,
            data: {
                notifications,
                totalPages: Math.ceil(total / limit),
                currentPage: page,
                total
            }
        });
    } catch (error) {
        console.error('Error getting user notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông báo'
        });
    }
};

// Đánh dấu thông báo đã đọc
const markAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const { userId } = req.body;

        const notification = await UserNotification.findOneAndUpdate(
            { _id: notificationId, userId: userId },
            {
                daDoc: true,
                thoiGianDoc: new Date()
            },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông báo'
            });
        }

        res.json({
            success: true,
            message: 'Đã đánh dấu thông báo đã đọc'
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi đánh dấu thông báo'
        });
    }
};

// Đánh dấu tất cả thông báo đã đọc
const markAllAsRead = async (req, res) => {
    try {
        const { userId } = req.body;

        await UserNotification.updateMany(
            { userId: userId, daDoc: false },
            {
                daDoc: true,
                thoiGianDoc: new Date()
            }
        );

        res.json({
            success: true,
            message: 'Đã đánh dấu tất cả thông báo đã đọc'
        });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi đánh dấu thông báo'
        });
    }
};

// Lấy số lượng thông báo chưa đọc
const getUnreadCount = async (req, res) => {
    try {
        const { userId } = req.params;

        const unreadCount = await UserNotification.countDocuments({
            userId: userId,
            daDoc: false
        });

        res.json({
            success: true,
            data: { unreadCount }
        });
    } catch (error) {
        console.error('Error getting unread count:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy số lượng thông báo chưa đọc'
        });
    }
};

// Tạo thông báo mới (dùng cho payment success)
const createNotification = async (userId, notificationData) => {
    try {
        const notification = new UserNotification({
            userId: userId,
            ...notificationData
        });

        await notification.save();
        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
};

// Tạo thông báo thanh toán thành công
const createPaymentSuccessNotification = async (userId, packageData, chiTietGoiTapId) => {
    try {
        console.log(`🔍 [NOTIFICATION] Attempting to create payment success notification for userId: ${userId}, chiTietGoiTapId: ${chiTietGoiTapId}`);

        // Sử dụng findOneAndUpdate với upsert để tránh race condition
        const existingNotification = await UserNotification.findOneAndUpdate(
            {
                userId: userId,
                loaiThongBao: 'PAYMENT_SUCCESS',
                'duLieuLienQuan.chiTietGoiTapId': chiTietGoiTapId
            },
            {
                // Nếu không tìm thấy, tạo mới với dữ liệu này
                userId: userId,
                tieuDe: `Thanh toán gói tập thành công — ${packageData.tenGoiTap}`,
                noiDung: `Chúc mừng! Bạn đã thanh toán thành công gói tập "${packageData.tenGoiTap}". 

📅 Thời hạn: ${packageData.thoiHan} ${packageData.donViThoiHan}
💰 Giá: ${packageData.donGia.toLocaleString('vi-VN')} VND

🎯 Các bước tiếp theo:
• Hoàn thiện thông tin đăng ký gói tập
• Chọn lịch tập phù hợp
• Bắt đầu hành trình fitness của bạn

💪 Hãy tận dụng tối đa gói tập để đạt được mục tiêu fitness của bạn!`,
                loaiThongBao: 'PAYMENT_SUCCESS',
                daDoc: false,
                duLieuLienQuan: {
                    goiTapId: packageData._id,
                    chiTietGoiTapId: chiTietGoiTapId
                }
            },
            {
                upsert: true, // Tạo mới nếu không tìm thấy
                new: true,    // Trả về document sau khi update
                setDefaultsOnInsert: true
            }
        );

        if (existingNotification.isNew) {
            console.log(`✅ [NOTIFICATION] Created new payment success notification for userId: ${userId}, chiTietGoiTapId: ${chiTietGoiTapId}, id: ${existingNotification._id}`);
        } else {
            console.log(`🔍 [NOTIFICATION] Found existing payment success notification for userId: ${userId}, chiTietGoiTapId: ${chiTietGoiTapId}, id: ${existingNotification._id}`);
        }

        return existingNotification;
    } catch (error) {
        console.error('Error in createPaymentSuccessNotification:', error);
        throw error;
    }
};

// Tạo thông báo nâng cấp gói tập thành công
const createUpgradeSuccessNotification = async (userId, newPackageData, oldPackageData, upgradeInfo, chiTietGoiTapId) => {
    try {
        console.log(`🔍 [NOTIFICATION] Attempting to create upgrade success notification for userId: ${userId}, chiTietGoiTapId: ${chiTietGoiTapId}`);

        // Sử dụng findOneAndUpdate với upsert để tránh race condition
        const existingNotification = await UserNotification.findOneAndUpdate(
            {
                userId: userId,
                loaiThongBao: 'UPGRADE_SUCCESS',
                'duLieuLienQuan.chiTietGoiTapId': chiTietGoiTapId
            },
            {
                // Nếu không tìm thấy, tạo mới với dữ liệu này
                userId: userId,
                tieuDe: `Nâng cấp gói tập thành công — ${newPackageData.tenGoiTap}`,
                noiDung: `🎉 Chúc mừng! Bạn đã nâng cấp gói tập thành công!

📦 Gói cũ: ${oldPackageData.tenGoiTap}
📦 Gói mới: ${newPackageData.tenGoiTap}
💰 Số tiền bù: ${upgradeInfo.soTienBu.toLocaleString('vi-VN')} VND
📅 Thời hạn gói mới: ${newPackageData.thoiHan} ${newPackageData.donViThoiHan}

🎯 Các bước tiếp theo:
• Gói cũ đã được tự động ngừng hoạt động
• Gói mới đã được kích hoạt thành công
• Bắt đầu hành trình fitness với gói tập mới

💪 Hãy tận dụng tối đa gói tập nâng cấp để đạt được mục tiêu fitness của bạn!`,
                loaiThongBao: 'UPGRADE_SUCCESS',
                daDoc: false,
                duLieuLienQuan: {
                    goiTapId: newPackageData._id,
                    chiTietGoiTapId: chiTietGoiTapId,
                    oldPackageId: oldPackageData._id,
                    upgradeInfo: {
                        soTienBu: upgradeInfo.soTienBu,
                        isUpgrade: upgradeInfo.isUpgrade,
                        ghiChu: upgradeInfo.ghiChu
                    }
                }
            },
            {
                upsert: true, // Tạo mới nếu không tìm thấy
                new: true,    // Trả về document sau khi update
                setDefaultsOnInsert: true
            }
        );

        if (existingNotification.isNew) {
            console.log(`✅ [NOTIFICATION] Created new upgrade success notification for userId: ${userId}, chiTietGoiTapId: ${chiTietGoiTapId}, id: ${existingNotification._id}`);
        } else {
            console.log(`🔍 [NOTIFICATION] Found existing upgrade success notification for userId: ${userId}, chiTietGoiTapId: ${chiTietGoiTapId}, id: ${existingNotification._id}`);
        }

        return existingNotification;
    } catch (error) {
        console.error('Error in createUpgradeSuccessNotification:', error);
        throw error;
    }
};

// Tạo thông báo cho người thứ 2 trong gói tập 2 người
const createPartnerAddedNotification = async (userId, packageData, partnerName, chiTietGoiTapId) => {
    try {
        console.log(`🔍 [NOTIFICATION] Attempting to create partner notification for userId: ${userId}, packageId: ${packageData._id}, chiTietGoiTapId: ${chiTietGoiTapId}`);

        // Sử dụng findOneAndUpdate với upsert để tránh race condition
        const existingNotification = await UserNotification.findOneAndUpdate(
            {
                userId: userId,
                loaiThongBao: 'PACKAGE_ADDED',
                'duLieuLienQuan.goiTapId': packageData._id,
                'duLieuLienQuan.chiTietGoiTapId': chiTietGoiTapId
            },
            {
                // Nếu không tìm thấy, tạo mới với dữ liệu này
                userId: userId,
                tieuDe: `Bạn đã được thêm vào gói tập — ${packageData.tenGoiTap}`,
                noiDung: `Chúc mừng! Bạn đã được ${partnerName} thêm vào gói tập "${packageData.tenGoiTap}".

📅 Thời hạn: ${packageData.thoiHan} ${packageData.donViThoiHan}
👥 Gói tập: 2 người

🎯 Các bước tiếp theo:
• Hoàn thiện thông tin cá nhân
• Đồng bộ lịch tập với bạn tập
• Bắt đầu hành trình fitness cùng nhau

💪 Hãy cùng nhau đạt được mục tiêu fitness!`,
                loaiThongBao: 'PACKAGE_ADDED',
                daDoc: false,
                duLieuLienQuan: {
                    goiTapId: packageData._id,
                    chiTietGoiTapId: chiTietGoiTapId
                }
            },
            {
                upsert: true, // Tạo mới nếu không tìm thấy
                new: true,    // Trả về document sau khi update
                setDefaultsOnInsert: true
            }
        );

        if (existingNotification.isNew) {
            console.log(`✅ [NOTIFICATION] Created new partner notification for userId: ${userId}, packageId: ${packageData._id}, chiTietGoiTapId: ${chiTietGoiTapId}, id: ${existingNotification._id}`);
        } else {
            console.log(`🔍 [NOTIFICATION] Found existing partner notification for userId: ${userId}, packageId: ${packageData._id}, chiTietGoiTapId: ${chiTietGoiTapId}, id: ${existingNotification._id}`);
        }

        return existingNotification;
    } catch (error) {
        console.error('Error in createPartnerAddedNotification:', error);
        throw error;
    }
};

// Test tạo notification
const testCreateNotification = async (req, res) => {
    try {
        const { userId } = req.body;

        const notification = new UserNotification({
            userId: userId,
            tieuDe: 'Test Notification',
            noiDung: 'Đây là thông báo test',
            daDoc: false
        });

        await notification.save();

        res.json({
            success: true,
            message: 'Tạo notification test thành công',
            data: notification
        });
    } catch (error) {
        console.error('Error creating test notification:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi tạo notification test',
            error: error.message
        });
    }
};

// Test unread count
const testUnreadCount = async (req, res) => {
    try {
        const { userId } = req.params;
        console.log('Testing unread count for user:', userId);

        const unreadCount = await UserNotification.countDocuments({
            userId: userId,
            daDoc: false
        });

        console.log('Unread count result:', unreadCount);

        res.json({
            success: true,
            data: { unreadCount },
            message: 'Test unread count thành công'
        });
    } catch (error) {
        console.error('Error in test unread count:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi test unread count',
            error: error.message
        });
    }
};

// Test tạo workflow notification
const testCreateWorkflowNotification = async (req, res) => {
    try {
        const { userId, registrationId, packageName } = req.body;

        if (!userId || !registrationId || !packageName) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin bắt buộc: userId, registrationId, packageName'
            });
        }

        console.log(`🔍 [TEST] Creating test workflow notification for userId: ${userId}, registrationId: ${registrationId}`);

        const notification = await createWorkflowNotification(
            userId,
            registrationId,
            packageName,
            false
        );

        res.json({
            success: true,
            message: 'Tạo workflow notification test thành công',
            data: notification
        });
    } catch (error) {
        console.error('Error creating test workflow notification:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi tạo workflow notification test',
            error: error.message
        });
    }
};

// Tạo thông báo workflow cho người thanh toán
const createWorkflowNotification = async (userId, registrationId, packageName, isUpgrade = false) => {
    try {
        console.log(`🔍 [NOTIFICATION] Creating workflow notification for userId: ${userId}, registrationId: ${registrationId}`);

        const notification = await UserNotification.findOneAndUpdate(
            {
                userId: userId,
                loaiThongBao: 'WORKFLOW',
                'duLieuLienQuan.registrationId': registrationId
            },
            {
                userId: userId,
                tieuDe: isUpgrade ? 'Hoàn tất nâng cấp gói tập' : 'Hoàn tất đăng ký gói tập',
                noiDung: `Vui lòng hoàn thành các bước sau để hoàn tất việc ${isUpgrade ? 'nâng cấp' : 'đăng ký'} gói tập ${packageName}`,
                loaiThongBao: 'WORKFLOW',
                daDoc: false,
                duLieuLienQuan: {
                    registrationId: registrationId,
                    workflowType: isUpgrade ? 'upgrade' : 'registration',
                    packageName: packageName,
                    actionUrl: `/package-workflow/${registrationId}`
                }
            },
            {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true
            }
        );

        console.log(`✅ [NOTIFICATION] Created workflow notification for userId: ${userId}, registrationId: ${registrationId}, id: ${notification._id}`);
        return notification;
    } catch (error) {
        console.error('Error in createWorkflowNotification:', error);
        throw error;
    }
};

// Tạo thông báo workflow cho người được mời
const createPartnerWorkflowNotification = async (partnerUserId, registrationId, packageName, ownerName) => {
    try {
        console.log(`🔍 [NOTIFICATION] Creating partner workflow notification for userId: ${partnerUserId}, registrationId: ${registrationId}`);

        const notification = await UserNotification.findOneAndUpdate(
            {
                userId: partnerUserId,
                loaiThongBao: 'WORKFLOW',
                'duLieuLienQuan.registrationId': registrationId,
                'duLieuLienQuan.workflowType': 'partner'
            },
            {
                userId: partnerUserId,
                tieuDe: 'Hoàn tất đăng ký gói tập',
                noiDung: `${ownerName} đã mời bạn tham gia gói tập ${packageName}. Vui lòng hoàn thành các bước để bắt đầu tập luyện`,
                loaiThongBao: 'WORKFLOW',
                daDoc: false,
                duLieuLienQuan: {
                    registrationId: registrationId,
                    workflowType: 'partner',
                    packageName: packageName,
                    ownerName: ownerName,
                    actionUrl: `/package-workflow/${registrationId}`
                }
            },
            {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true
            }
        );

        console.log(`✅ [NOTIFICATION] Created partner workflow notification for userId: ${partnerUserId}, registrationId: ${registrationId}, id: ${notification._id}`);
        return notification;
    } catch (error) {
        console.error('Error in createPartnerWorkflowNotification:', error);
        throw error;
    }
};

module.exports = {
    getUserNotifications,
    markAsRead,
    markAllAsRead,
    getUnreadCount,
    createNotification,
    createPaymentSuccessNotification,
    createUpgradeSuccessNotification,
    createPartnerAddedNotification,
    createWorkflowNotification,
    createPartnerWorkflowNotification,
    testCreateNotification,
    testUnreadCount,
    testCreateWorkflowNotification
};
