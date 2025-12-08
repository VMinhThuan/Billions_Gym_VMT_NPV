const momoPaymentService = require('../services/momoPayment.service');
const zaloPaymentService = require('../services/zaloPayment.service');
const GoiTap = require('../models/GoiTap');
const ChiTietGoiTap = require('../models/ChiTietGoiTap');
const { NguoiDung } = require('../models/NguoiDung');
const { createPaymentSuccessNotification, createUpgradeSuccessNotification, createPartnerAddedNotification, createWorkflowNotification, createPartnerWorkflowNotification } = require('./notification.controller');
const { addDuration } = require('../utils/duration.utils');

class PaymentController {
    /**
     * Tạo thanh toán MoMo
     */
    async createMomoPayment(req, res) {
        try {
            const {
                packageId,
                userId,
                paymentData
            } = req.body;

            // Validate input
            if (!packageId || !userId || !paymentData) {
                return res.status(400).json({
                    success: false,
                    message: 'Thiếu thông tin bắt buộc'
                });
            }

            // Lấy thông tin gói tập
            const packageInfo = await GoiTap.findById(packageId);
            if (!packageInfo) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy gói tập'
                });
            }

            // Lấy thông tin người dùng
            const userInfo = await NguoiDung.findById(userId);
            if (!userInfo) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy thông tin người dùng'
                });
            }

            // Tạo order ID
            const orderId = `MOMO_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const amount = packageInfo.donGia;

            // Chuẩn bị dữ liệu thanh toán
            const paymentRequest = {
                amount: amount,
                orderId: orderId,
                orderInfo: `Thanh toán gói tập: ${packageInfo.tenGoiTap}`,
                redirectUrl: `${process.env.FRONTEND_URL_CLIENT || 'http://localhost:3000'}/payment-success?orderId=${orderId}`,
                ipnUrl: `${process.env.BACKEND_URL || 'http://localhost:4000'}/api/payment/momo/callback`,
                extraData: JSON.stringify({
                    packageId: packageId,
                    userId: userId,
                    packageName: packageInfo.tenGoiTap
                })
            };

            // Tạo thanh toán MoMo
            const momoResult = await momoPaymentService.createPayment(paymentRequest);

            if (!momoResult.success) {
                return res.status(500).json({
                    success: false,
                    message: momoResult.message || 'Lỗi tạo thanh toán MoMo'
                });
            }

            // Tính ngày kết thúc dựa trên ngày bắt đầu và thời hạn gói tập
            const startDate = paymentData.startDate ? new Date(paymentData.startDate) : new Date();
            const ngayKetThuc = addDuration(startDate, packageInfo.thoiHan, packageInfo.donViThoiHan);

            // Nếu chọn giữ thông tin từ gói cũ, copy branchId và PT
            let finalBranchId = paymentData.branchId;
            let finalPtId = null;

            if (paymentData.keepPreviousInfo && paymentData.previousBranchId) {
                finalBranchId = paymentData.previousBranchId;
                console.log('✅ [MOMO] Keeping previous branch:', finalBranchId);
            }

            if (paymentData.keepPreviousInfo && paymentData.previousPtId) {
                finalPtId = paymentData.previousPtId;
                console.log('✅ [MOMO] Keeping previous PT:', finalPtId);
            }

            // Lưu thông tin đăng ký gói tập
            const registrationData = {
                goiTapId: packageId,
                nguoiDungId: userId,
                thoiGianDangKy: new Date(),
                trangThai: 'CHO_THANH_TOAN',
                soTienThanhToan: amount, // Thêm field bắt buộc
                thongTinThanhToan: {
                    phuongThuc: 'momo',
                    orderId: orderId,
                    amount: amount,
                    requestId: momoResult.requestId,
                    paymentUrl: momoResult.data.payUrl
                },
                thongTinKhachHang: paymentData,
                branchId: finalBranchId,
                ptDuocChon: finalPtId, // Copy PT từ gói cũ nếu chọn giữ
                ngayChonPT: finalPtId ? new Date() : undefined, // Đánh dấu đã chọn PT nếu copy từ gói cũ
                ngayBatDau: startDate,
                ngayKetThuc: ngayKetThuc, // Tính ngày kết thúc
                // Nếu đã copy PT và branch từ gói cũ, tự động chuyển sang bước tiếp theo
                trangThaiDangKy: finalPtId ? 'DA_CHON_PT' : 'CHO_CHON_PT',
                // Thêm thông tin upgrade
                isUpgrade: paymentData.isUpgrade || false,
                soTienBu: paymentData.soTienBu || 0,
                giaGoiTapGoc: paymentData.giaGoiTapGoc || amount,
                ghiChu: paymentData.isUpgrade && paymentData.existingPackageId
                    ? `Nâng cấp từ gói cũ - Số tiền bù: ${(paymentData.soTienBu || 0).toLocaleString('vi-VN')}₫`
                    : (paymentData.keepPreviousInfo ? 'Giữ thông tin từ gói tập trước' : null)
            };

            // Lưu vào database
            const registration = new ChiTietGoiTap(registrationData);
            await registration.save();

            // Tạo record ThanhToan ngay khi tạo payment request
            try {
                const ThanhToan = require('../models/ThanhToan');
                const { NguoiDung } = require('../models/NguoiDung');

                // Tìm hoiVien từ userId (vì HoiVien là discriminator của NguoiDung)
                let hoiVienId = userId;
                try {
                    const user = await NguoiDung.findById(userId).select('_id');
                    hoiVienId = user?._id || userId;
                } catch (userError) {
                    console.warn('Could not find user, using userId as hoiVienId:', userError.message);
                }

                const newPayment = new ThanhToan({
                    hoiVien: hoiVienId,
                    maChiTietGoiTap: registration._id,
                    soTien: amount,
                    ngayThanhToan: new Date(),
                    phuongThuc: 'CHUYEN_KHOAN', // Map momo/zalopay to CHUYEN_KHOAN
                    noiDung: `Thanh toán gói tập: ${packageInfo.tenGoiTap}`,
                    trangThaiThanhToan: 'DANG_XU_LY', // Sẽ update thành THANH_CONG khi callback thành công
                    isLocked: false
                });

                await newPayment.save();
                console.log(`✅ [MOMO] Created ThanhToan record for order ${orderId}, hoiVien: ${hoiVienId}, amount: ${amount}`);
            } catch (paymentError) {
                console.error('❌ [MOMO] Error creating ThanhToan record:', paymentError);
                // Không throw error để không ảnh hưởng đến flow chính
            }

            // Nếu là upgrade, cập nhật gói cũ
            if (paymentData.isUpgrade && paymentData.existingPackageId) {
                console.log(`🔄 [MOMO] Updating old package ${paymentData.existingPackageId} to DA_NANG_CAP status`);
                try {
                    await this.updateOldPackageOnUpgrade(paymentData.existingPackageId, {
                        soTienBu: paymentData.soTienBu || 0,
                        isUpgrade: true,
                        ghiChu: `Nâng cấp lên gói ${packageInfo.tenGoiTap} - Số tiền bù: ${(paymentData.soTienBu || 0).toLocaleString('vi-VN')}₫`
                    });
                    console.log(`✅ [MOMO] Old package updated successfully`);
                } catch (upgradeError) {
                    console.error(`❌ [MOMO] Error updating old package:`, upgradeError);
                    // Không throw error vì gói mới đã được tạo thành công
                }
            }

            return res.status(200).json({
                success: true,
                message: 'Tạo thanh toán MoMo thành công',
                data: {
                    orderId: orderId,
                    paymentUrl: momoResult.data.payUrl,
                    amount: amount,
                    packageName: packageInfo.tenGoiTap
                }
            });

        } catch (error) {
            console.error('PaymentController.createMomoPayment error:', error);
            return res.status(500).json({
                success: false,
                message: 'Lỗi server khi tạo thanh toán MoMo',
                error: error.message
            });
        }
    }

    /**
     * Tạo thanh toán ZaloPay
     */
    async createZaloPayment(req, res) {
        try {
            const {
                packageId,
                userId,
                paymentData
            } = req.body;

            // Validate input
            if (!packageId || !userId || !paymentData) {
                return res.status(400).json({
                    success: false,
                    message: 'Thiếu thông tin bắt buộc'
                });
            }

            // Lấy thông tin gói tập
            const packageInfo = await GoiTap.findById(packageId);
            if (!packageInfo) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy gói tập'
                });
            }

            // Lấy thông tin người dùng
            const userInfo = await NguoiDung.findById(userId);
            if (!userInfo) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy thông tin người dùng'
                });
            }

            // Tạo order ID
            const orderId = `ZALO_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const amount = packageInfo.donGia;

            // Chuẩn bị dữ liệu thanh toán
            const paymentRequest = {
                amount: amount,
                orderId: orderId,
                orderInfo: `Thanh toán gói tập: ${packageInfo.tenGoiTap}`,
                redirectUrl: `${process.env.FRONTEND_URL_CLIENT || 'http://localhost:3000'}/payment-success?orderId=${orderId}`,
                callbackUrl: `${process.env.BACKEND_URL || 'http://localhost:4000'}/api/payment/zalo/callback`,
                userId: userInfo._id.toString(),
                extraData: {
                    packageId: packageId,
                    userId: userId,
                    packageName: packageInfo.tenGoiTap
                }
            };

            // Tạo thanh toán ZaloPay
            const zaloResult = await zaloPaymentService.createPayment(paymentRequest);

            if (!zaloResult.success) {
                return res.status(500).json({
                    success: false,
                    message: zaloResult.message || 'Lỗi tạo thanh toán ZaloPay'
                });
            }

            // Tính ngày kết thúc dựa trên ngày bắt đầu và thời hạn gói tập
            const startDate = paymentData.startDate ? new Date(paymentData.startDate) : new Date();
            const ngayKetThuc = addDuration(startDate, packageInfo.thoiHan, packageInfo.donViThoiHan);

            // Nếu chọn giữ thông tin từ gói cũ, copy branchId và PT
            let finalBranchId = paymentData.branchId;
            let finalPtId = null;

            if (paymentData.keepPreviousInfo && paymentData.previousBranchId) {
                finalBranchId = paymentData.previousBranchId;
                console.log('✅ [ZALO] Keeping previous branch:', finalBranchId);
            }

            if (paymentData.keepPreviousInfo && paymentData.previousPtId) {
                finalPtId = paymentData.previousPtId;
                console.log('✅ [ZALO] Keeping previous PT:', finalPtId);
            }

            // Lưu thông tin đăng ký gói tập
            const registrationData = {
                goiTapId: packageId,
                nguoiDungId: userId,
                thoiGianDangKy: new Date(),
                trangThai: 'CHO_THANH_TOAN',
                soTienThanhToan: amount, // Thêm field bắt buộc
                thongTinThanhToan: {
                    phuongThuc: 'zalopay',
                    orderId: orderId,
                    amount: amount,
                    app_trans_id: zaloResult.app_trans_id,
                    paymentUrl: zaloResult.data.order_url
                },
                thongTinKhachHang: paymentData,
                branchId: finalBranchId,
                ptDuocChon: finalPtId, // Copy PT từ gói cũ nếu chọn giữ
                ngayChonPT: finalPtId ? new Date() : undefined, // Đánh dấu đã chọn PT nếu copy từ gói cũ
                ngayBatDau: startDate,
                ngayKetThuc: ngayKetThuc, // Tính ngày kết thúc
                // Nếu đã copy PT và branch từ gói cũ, tự động chuyển sang bước tiếp theo
                trangThaiDangKy: finalPtId ? 'DA_CHON_PT' : 'CHO_CHON_PT',
                // Thêm thông tin upgrade
                isUpgrade: paymentData.isUpgrade || false,
                soTienBu: paymentData.soTienBu || 0,
                giaGoiTapGoc: paymentData.giaGoiTapGoc || amount,
                ghiChu: paymentData.isUpgrade && paymentData.existingPackageId
                    ? `Nâng cấp từ gói cũ - Số tiền bù: ${(paymentData.soTienBu || 0).toLocaleString('vi-VN')}₫`
                    : (paymentData.keepPreviousInfo ? 'Giữ thông tin từ gói tập trước' : null)
            };

            // Lưu vào database
            const registration = new ChiTietGoiTap(registrationData);
            await registration.save();

            // Tạo record ThanhToan ngay khi tạo payment request
            try {
                const ThanhToan = require('../models/ThanhToan');
                const { NguoiDung } = require('../models/NguoiDung');

                // Tìm hoiVien từ userId (vì HoiVien là discriminator của NguoiDung)
                let hoiVienId = userId;
                try {
                    const user = await NguoiDung.findById(userId).select('_id');
                    hoiVienId = user?._id || userId;
                } catch (userError) {
                    console.warn('Could not find user, using userId as hoiVienId:', userError.message);
                }

                const newPayment = new ThanhToan({
                    hoiVien: hoiVienId,
                    maChiTietGoiTap: registration._id,
                    soTien: amount,
                    ngayThanhToan: new Date(),
                    phuongThuc: 'CHUYEN_KHOAN', // Map momo/zalopay to CHUYEN_KHOAN
                    noiDung: `Thanh toán gói tập: ${packageInfo.tenGoiTap}`,
                    trangThaiThanhToan: 'DANG_XU_LY', // Sẽ update thành THANH_CONG khi callback thành công
                    isLocked: false
                });

                await newPayment.save();
                console.log(`✅ [ZALOPAY] Created ThanhToan record for order ${orderId}, hoiVien: ${hoiVienId}, amount: ${amount}`);
            } catch (paymentError) {
                console.error('❌ [ZALOPAY] Error creating ThanhToan record:', paymentError);
                // Không throw error để không ảnh hưởng đến flow chính
            }

            // Nếu là upgrade, cập nhật gói cũ
            if (paymentData.isUpgrade && paymentData.existingPackageId) {
                console.log(`🔄 [ZALOPAY] Updating old package ${paymentData.existingPackageId} to DA_NANG_CAP status`);
                try {
                    await this.updateOldPackageOnUpgrade(paymentData.existingPackageId, {
                        soTienBu: paymentData.soTienBu || 0,
                        isUpgrade: true,
                        ghiChu: `Nâng cấp lên gói ${packageInfo.tenGoiTap} - Số tiền bù: ${(paymentData.soTienBu || 0).toLocaleString('vi-VN')}₫`
                    });
                    console.log(`✅ [ZALOPAY] Old package updated successfully`);
                } catch (upgradeError) {
                    console.error(`❌ [ZALOPAY] Error updating old package:`, upgradeError);
                    // Không throw error vì gói mới đã được tạo thành công
                }
            }

            return res.status(200).json({
                success: true,
                message: 'Tạo thanh toán ZaloPay thành công',
                data: {
                    orderId: orderId,
                    paymentUrl: zaloResult.data.order_url,
                    amount: amount,
                    packageName: packageInfo.tenGoiTap
                }
            });

        } catch (error) {
            console.error('PaymentController.createZaloPayment error:', error);
            return res.status(500).json({
                success: false,
                message: 'Lỗi server khi tạo thanh toán ZaloPay',
                error: error.message
            });
        }
    }

    /**
     * Xử lý callback từ MoMo
     */
    async handleMomoCallback(req, res) {
        try {
            const callbackData = req.body;
            console.log('Momo callback received:', callbackData);

            // Xử lý callback
            const result = momoPaymentService.processCallback(callbackData);

            if (result.success) {
                // Cập nhật trạng thái đăng ký gói tập
                await this.updateRegistrationStatus(result.orderId, 'DA_THANH_TOAN', result);

                console.log(`Momo payment successful for order: ${result.orderId}`);
            } else {
                // Cập nhật trạng thái thất bại
                await this.updateRegistrationStatus(result.orderId, 'THANH_TOAN_THAT_BAI', result);

                console.log(`Momo payment failed for order: ${result.orderId}`);
            }

            // Trả về status 204 cho MoMo
            return res.status(204).json({});

        } catch (error) {
            console.error('PaymentController.handleMomoCallback error:', error);
            return res.status(500).json({
                success: false,
                message: 'Lỗi xử lý callback MoMo',
                error: error.message
            });
        }
    }

    /**
     * Xử lý callback từ ZaloPay
     */
    async handleZaloCallback(req, res) {
        try {
            const callbackData = req.body;
            console.log('ZaloPay callback received:', callbackData);

            // Xử lý callback
            const result = zaloPaymentService.processCallback(callbackData);

            if (result.success) {
                // Cập nhật trạng thái đăng ký gói tập
                await this.updateZaloRegistrationStatus(result.app_trans_id, 'DA_THANH_TOAN', result);

                console.log(`ZaloPay payment successful for app_trans_id: ${result.app_trans_id}`);
            } else {
                // Cập nhật trạng thái thất bại
                await this.updateZaloRegistrationStatus(result.app_trans_id, 'THANH_TOAN_THAT_BAI', result);

                console.log(`ZaloPay payment failed for app_trans_id: ${result.app_trans_id}`);
            }

            // Trả về kết quả cho ZaloPay
            return res.json({
                return_code: result.success ? 1 : 0,
                return_message: result.success ? 'success' : result.message
            });

        } catch (error) {
            console.error('PaymentController.handleZaloCallback error:', error);
            return res.json({
                return_code: 0,
                return_message: error.message
            });
        }
    }

    /**
     * Kiểm tra trạng thái thanh toán
     */
    async checkPaymentStatus(req, res) {
        try {
            const { orderId } = req.params;

            // Tìm đăng ký gói tập
            const registration = await ChiTietGoiTap.findOne({
                'thongTinThanhToan.orderId': orderId
            });

            if (!registration) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy đơn hàng'
                });
            }

            return res.status(200).json({
                success: true,
                data: {
                    orderId: orderId,
                    status: registration.trangThaiThanhToan,
                    paymentMethod: registration.thongTinThanhToan.phuongThuc,
                    amount: registration.thongTinThanhToan.amount,
                    registrationTime: registration.thoiGianDangKy
                }
            });

        } catch (error) {
            console.error('PaymentController.checkPaymentStatus error:', error);
            return res.status(500).json({
                success: false,
                message: 'Lỗi kiểm tra trạng thái thanh toán',
                error: error.message
            });
        }
    }

    /**
     * Cập nhật trạng thái đăng ký gói tập
     */
    async updateRegistrationStatus(orderId, status, paymentResult) {
        try {
            const updateData = {
                trangThaiThanhToan: status,
                thoiGianCapNhat: new Date(),
                'thongTinThanhToan.ketQuaThanhToan': paymentResult
            };

            // Tìm registration trước để kiểm tra ngày kết thúc
            const registration = await ChiTietGoiTap.findOne({
                'thongTinThanhToan.orderId': orderId
            }).populate('goiTapId');

            // Nếu chưa có ngày kết thúc và đã có ngày bắt đầu, tính lại
            if (registration && !registration.ngayKetThuc && registration.ngayBatDau && registration.goiTapId) {
                const ngayKetThuc = addDuration(registration.ngayBatDau, registration.goiTapId.thoiHan, registration.goiTapId.donViThoiHan);
                updateData.ngayKetThuc = ngayKetThuc;
                console.log(`[CALLBACK] Calculated ngayKetThuc: ${ngayKetThuc.toISOString()}`);
            }

            const updatedRegistration = await ChiTietGoiTap.findOneAndUpdate(
                { 'thongTinThanhToan.orderId': orderId },
                updateData,
                { new: true }
            ).populate('goiTapId').populate('nguoiDungId');

            console.log(`Updated registration status for order ${orderId} to ${status}`);

            // Cập nhật record thanh toán trong ThanhToan collection khi thanh toán thành công
            if (status === 'DA_THANH_TOAN' && updatedRegistration) {
                try {
                    const ThanhToan = require('../models/ThanhToan');
                    const existingPayment = await ThanhToan.findOne({
                        maChiTietGoiTap: updatedRegistration._id
                    });

                    if (existingPayment) {
                        // Cập nhật trạng thái nếu đã tồn tại (đã tạo khi tạo payment request)
                        existingPayment.trangThaiThanhToan = 'THANH_CONG';
                        existingPayment.ngayThanhToan = new Date();
                        existingPayment.isLocked = true;
                        // Cập nhật số tiền nếu có thay đổi
                        if (updatedRegistration.thongTinThanhToan?.amount) {
                            existingPayment.soTien = updatedRegistration.thongTinThanhToan.amount;
                        }
                        await existingPayment.save();
                        console.log(`✅ [CALLBACK] Updated ThanhToan record for order ${orderId}, status: THANH_CONG, amount: ${existingPayment.soTien}`);
                    } else {
                        // Nếu không tìm thấy (trường hợp cũ hoặc lỗi), tạo mới
                        console.warn(`⚠️ [CALLBACK] ThanhToan record not found for order ${orderId}, creating new one`);
                        const { NguoiDung } = require('../models/NguoiDung');

                        let hoiVienId = updatedRegistration.maHoiVien || updatedRegistration.nguoiDungId;
                        if (!updatedRegistration.maHoiVien && updatedRegistration.nguoiDungId) {
                            try {
                                const user = await NguoiDung.findById(updatedRegistration.nguoiDungId).select('_id');
                                hoiVienId = user?._id || updatedRegistration.nguoiDungId;
                            } catch (userError) {
                                console.warn('Could not find HoiVien from NguoiDung, using nguoiDungId:', userError.message);
                                hoiVienId = updatedRegistration.nguoiDungId;
                            }
                        }

                        const newPayment = new ThanhToan({
                            hoiVien: hoiVienId,
                            maChiTietGoiTap: updatedRegistration._id,
                            soTien: updatedRegistration.thongTinThanhToan?.amount || updatedRegistration.soTienThanhToan || 0,
                            ngayThanhToan: new Date(),
                            phuongThuc: 'CHUYEN_KHOAN',
                            noiDung: `Thanh toán gói tập: ${updatedRegistration.goiTapId?.tenGoiTap || 'N/A'}`,
                            trangThaiThanhToan: 'THANH_CONG',
                            isLocked: true
                        });

                        await newPayment.save();
                        console.log(`✅ [CALLBACK] Created new ThanhToan record for order ${orderId}, hoiVien: ${hoiVienId}`);
                    }

                    // Tự động cập nhật hạng hội viên sau khi thanh toán thành công
                    try {
                        const hangHoiVienService = require('../services/hanghoivien.service');
                        const hoiVienIdToUpdate = updatedRegistration.nguoiDungId || updatedRegistration.maHoiVien;
                        if (hoiVienIdToUpdate) {
                            const updatedHoiVien = await hangHoiVienService.tinhHangHoiVien(hoiVienIdToUpdate);
                            console.log(`✅ [CALLBACK] Updated member tier for hoiVien ${hoiVienIdToUpdate}, new tier: ${updatedHoiVien.hangHoiVien}, soTienTichLuy: ${updatedHoiVien.soTienTichLuy}`);
                        }
                    } catch (tierError) {
                        console.error(`⚠️ [CALLBACK] Error updating member tier:`, tierError);
                        // Không throw error để không ảnh hưởng đến quá trình thanh toán
                    }
                } catch (paymentError) {
                    console.error('❌ [CALLBACK] Error creating/updating ThanhToan record:', paymentError);
                    // Không throw error để không ảnh hưởng đến flow chính
                }
            }

            // Tạo notification khi thanh toán thành công
            if (status === 'DA_THANH_TOAN' && updatedRegistration) {
                try {
                    // Kiểm tra xem có phải upgrade không
                    if (updatedRegistration.isUpgrade && updatedRegistration.soTienBu > 0) {
                        console.log(`🔄 [CALLBACK] This is an upgrade package - creating upgrade notification`);

                        // ĐẢM BẢO cập nhật gói cũ nếu chưa được set trước đó
                        try {
                            const upgradeUpdate = {
                                trangThaiDangKy: 'DA_NANG_CAP',
                                trangThaiSuDung: 'DA_NANG_CAP',
                                lyDoTamDung: 'Nâng cấp gói tập',
                                ngayTamDung: new Date(),
                                thoiGianCapNhat: new Date()
                            };
                            const updateResult = await ChiTietGoiTap.updateMany({
                                nguoiDungId: updatedRegistration.nguoiDungId,
                                _id: { $ne: updatedRegistration._id },
                                trangThaiDangKy: { $ne: 'DA_NANG_CAP' }
                            }, { $set: upgradeUpdate });
                            console.log(`🔄 [CALLBACK] Fallback upgraded ${updateResult.modifiedCount || 0} old packages`);
                        } catch (fallbackErr) {
                            console.error('❌ [CALLBACK] Fallback upgrade update error:', fallbackErr);
                        }

                        // Tìm gói cũ của user này (gói có trangThai = DA_NANG_CAP)
                        const oldPackageData = await ChiTietGoiTap.findOne({
                            nguoiDungId: updatedRegistration.nguoiDungId,
                            trangThaiSuDung: 'DA_NANG_CAP',
                            trangThaiDangKy: 'DA_NANG_CAP'
                        }).populate('goiTapId');

                        console.log(`🔍 [CALLBACK] Found old package:`, oldPackageData ? oldPackageData._id : 'None');

                        // Tạo thông báo upgrade
                        await createUpgradeSuccessNotification(
                            updatedRegistration.nguoiDungId,
                            updatedRegistration.goiTapId,
                            oldPackageData ? oldPackageData.goiTapId : updatedRegistration.goiTapId, // Fallback nếu không tìm thấy gói cũ
                            {
                                soTienBu: updatedRegistration.soTienBu || 0,
                                isUpgrade: updatedRegistration.isUpgrade || true,
                                ghiChu: updatedRegistration.ghiChu || 'Nâng cấp gói tập'
                            },
                            updatedRegistration._id
                        );
                        console.log(`✅ [CALLBACK] Upgrade success notification created for user ${updatedRegistration.nguoiDungId}`);

                    } else {
                        // Tạo notification cho người thanh toán bình thường
                        await createPaymentSuccessNotification(
                            updatedRegistration.nguoiDungId,
                            updatedRegistration.goiTapId,
                            updatedRegistration._id
                        );
                    }

                    // Tạo thông báo workflow cho người thanh toán
                    try {
                        console.log(`🔍 [CALLBACK] Creating workflow notification for user ${updatedRegistration.nguoiDungId}, registration ${updatedRegistration._id}`);
                        await createWorkflowNotification(
                            updatedRegistration.nguoiDungId,
                            updatedRegistration._id,
                            updatedRegistration.goiTapId.tenGoiTap,
                            updatedRegistration.isUpgrade
                        );
                        console.log(`✅ [CALLBACK] Workflow notification created successfully for user ${updatedRegistration.nguoiDungId}`);
                    } catch (workflowError) {
                        console.error(`❌ [CALLBACK] Error creating workflow notification for user ${updatedRegistration.nguoiDungId}:`, workflowError);
                    }

                    // Nếu là gói tập 2 người, tạo notification cho người thứ 2
                    if (updatedRegistration.goiTapId.soLuongNguoiThamGia === 2 &&
                        updatedRegistration.thongTinKhachHang.partnerPhone) {

                        // Tìm người thứ 2 theo số điện thoại
                        const partner = await NguoiDung.findOne({
                            soDienThoai: updatedRegistration.thongTinKhachHang.partnerPhone
                        });

                        if (partner) {
                            await createPartnerAddedNotification(
                                partner._id,
                                updatedRegistration.goiTapId,
                                updatedRegistration.thongTinKhachHang.firstName + ' ' + updatedRegistration.thongTinKhachHang.lastName,
                                updatedRegistration._id
                            );

                            // Tạo thông báo workflow cho partner
                            const owner = await NguoiDung.findById(updatedRegistration.nguoiDungId);
                            await createPartnerWorkflowNotification(
                                partner._id,
                                updatedRegistration._id,
                                updatedRegistration.goiTapId.tenGoiTap,
                                owner.hoTen
                            );
                        }
                    }
                } catch (notificationError) {
                    console.error('Error creating notifications:', notificationError);
                    // Không throw error để không ảnh hưởng đến payment flow
                }
            }

        } catch (error) {
            console.error('Error updating registration status:', error);
        }
    }

    /**
     * Cập nhật trạng thái đăng ký gói tập cho ZaloPay (sử dụng app_trans_id)
     */
    async updateZaloRegistrationStatus(appTransId, status, paymentResult) {
        try {
            const updateData = {
                trangThaiThanhToan: status,
                thoiGianCapNhat: new Date(),
                'thongTinThanhToan.ketQuaThanhToan': paymentResult
            };

            // Tìm registration trước để kiểm tra ngày kết thúc
            const registration = await ChiTietGoiTap.findOne({
                'thongTinThanhToan.app_trans_id': appTransId
            }).populate('goiTapId');

            // Nếu chưa có ngày kết thúc và đã có ngày bắt đầu, tính lại
            if (registration && !registration.ngayKetThuc && registration.ngayBatDau && registration.goiTapId) {
                const ngayKetThuc = addDuration(registration.ngayBatDau, registration.goiTapId.thoiHan, registration.goiTapId.donViThoiHan);
                updateData.ngayKetThuc = ngayKetThuc;
                console.log(`[ZALO CALLBACK] Calculated ngayKetThuc: ${ngayKetThuc.toISOString()}`);
            }

            const updatedRegistration = await ChiTietGoiTap.findOneAndUpdate(
                { 'thongTinThanhToan.app_trans_id': appTransId },
                updateData,
                { new: true }
            ).populate('goiTapId').populate('nguoiDungId');

            console.log(`Updated ZaloPay registration status for app_trans_id ${appTransId} to ${status}`);

            // Cập nhật record thanh toán trong ThanhToan collection khi thanh toán thành công
            if (status === 'DA_THANH_TOAN' && updatedRegistration) {
                try {
                    const ThanhToan = require('../models/ThanhToan');
                    const existingPayment = await ThanhToan.findOne({
                        maChiTietGoiTap: updatedRegistration._id
                    });

                    if (existingPayment) {
                        // Cập nhật trạng thái nếu đã tồn tại (đã tạo khi tạo payment request)
                        existingPayment.trangThaiThanhToan = 'THANH_CONG';
                        existingPayment.ngayThanhToan = new Date();
                        existingPayment.isLocked = true;
                        // Cập nhật số tiền nếu có thay đổi
                        if (updatedRegistration.thongTinThanhToan?.amount) {
                            existingPayment.soTien = updatedRegistration.thongTinThanhToan.amount;
                        }
                        await existingPayment.save();
                        console.log(`✅ [ZALO CALLBACK] Updated ThanhToan record for app_trans_id ${appTransId}, status: THANH_CONG, amount: ${existingPayment.soTien}`);
                    } else {
                        // Nếu không tìm thấy (trường hợp cũ hoặc lỗi), tạo mới
                        console.warn(`⚠️ [ZALO CALLBACK] ThanhToan record not found for app_trans_id ${appTransId}, creating new one`);
                        const { NguoiDung } = require('../models/NguoiDung');

                        let hoiVienId = updatedRegistration.maHoiVien || updatedRegistration.nguoiDungId;
                        if (!updatedRegistration.maHoiVien && updatedRegistration.nguoiDungId) {
                            try {
                                const user = await NguoiDung.findById(updatedRegistration.nguoiDungId).select('_id');
                                hoiVienId = user?._id || updatedRegistration.nguoiDungId;
                            } catch (userError) {
                                console.warn('Could not find HoiVien from NguoiDung, using nguoiDungId:', userError.message);
                                hoiVienId = updatedRegistration.nguoiDungId;
                            }
                        }

                        const newPayment = new ThanhToan({
                            hoiVien: hoiVienId,
                            maChiTietGoiTap: updatedRegistration._id,
                            soTien: updatedRegistration.thongTinThanhToan?.amount || updatedRegistration.soTienThanhToan || 0,
                            ngayThanhToan: new Date(),
                            phuongThuc: 'CHUYEN_KHOAN',
                            noiDung: `Thanh toán gói tập: ${updatedRegistration.goiTapId?.tenGoiTap || 'N/A'}`,
                            trangThaiThanhToan: 'THANH_CONG',
                            isLocked: true
                        });

                        await newPayment.save();
                        console.log(`✅ [ZALO CALLBACK] Created new ThanhToan record for app_trans_id ${appTransId}, hoiVien: ${hoiVienId}`);
                    }

                    // Tự động cập nhật hạng hội viên sau khi thanh toán thành công
                    try {
                        const hangHoiVienService = require('../services/hanghoivien.service');
                        const hoiVienIdToUpdate = updatedRegistration.nguoiDungId || updatedRegistration.maHoiVien;
                        if (hoiVienIdToUpdate) {
                            const updatedHoiVien = await hangHoiVienService.tinhHangHoiVien(hoiVienIdToUpdate);
                            console.log(`✅ [ZALO CALLBACK] Updated member tier for hoiVien ${hoiVienIdToUpdate}, new tier: ${updatedHoiVien.hangHoiVien}, soTienTichLuy: ${updatedHoiVien.soTienTichLuy}`);
                        }
                    } catch (tierError) {
                        console.error(`⚠️ [ZALO CALLBACK] Error updating member tier:`, tierError);
                        // Không throw error để không ảnh hưởng đến quá trình thanh toán
                    }
                } catch (paymentError) {
                    console.error('❌ [ZALO CALLBACK] Error creating/updating ThanhToan record:', paymentError);
                    // Không throw error để không ảnh hưởng đến flow chính
                }
            }

            // Tạo notification khi thanh toán thành công
            if (status === 'DA_THANH_TOAN' && updatedRegistration) {
                try {
                    // Nếu là nâng cấp, fallback cập nhật gói cũ để đảm bảo đồng bộ
                    if (updatedRegistration.isUpgrade && updatedRegistration.soTienBu > 0) {
                        try {
                            const upgradeUpdate = {
                                trangThaiDangKy: 'DA_NANG_CAP',
                                trangThaiSuDung: 'DA_NANG_CAP',
                                lyDoTamDung: 'Nâng cấp gói tập',
                                ngayTamDung: new Date(),
                                thoiGianCapNhat: new Date()
                            };
                            const updateResult = await ChiTietGoiTap.updateMany({
                                nguoiDungId: updatedRegistration.nguoiDungId,
                                _id: { $ne: updatedRegistration._id },
                                trangThaiDangKy: { $ne: 'DA_NANG_CAP' }
                            }, { $set: upgradeUpdate });
                            console.log(`🔄 [ZALO CALLBACK] Fallback upgraded ${updateResult.modifiedCount || 0} old packages`);
                        } catch (fallbackErr) {
                            console.error('❌ [ZALO CALLBACK] Fallback upgrade update error:', fallbackErr);
                        }
                    }
                    // Tạo notification cho người thanh toán
                    await createPaymentSuccessNotification(
                        updatedRegistration.nguoiDungId,
                        updatedRegistration.goiTapId,
                        updatedRegistration._id
                    );

                    // Tạo thông báo workflow cho người thanh toán
                    try {
                        console.log(`🔍 [CALLBACK] Creating workflow notification for user ${updatedRegistration.nguoiDungId}, registration ${updatedRegistration._id}`);
                        await createWorkflowNotification(
                            updatedRegistration.nguoiDungId,
                            updatedRegistration._id,
                            updatedRegistration.goiTapId.tenGoiTap,
                            updatedRegistration.isUpgrade
                        );
                        console.log(`✅ [CALLBACK] Workflow notification created successfully for user ${updatedRegistration.nguoiDungId}`);
                    } catch (workflowError) {
                        console.error(`❌ [CALLBACK] Error creating workflow notification for user ${updatedRegistration.nguoiDungId}:`, workflowError);
                    }

                    // Nếu là gói tập 2 người, tạo notification cho người thứ 2
                    if (updatedRegistration.goiTapId.soLuongNguoiThamGia === 2 &&
                        updatedRegistration.thongTinKhachHang.partnerPhone) {

                        // Tìm người thứ 2 theo số điện thoại
                        const partner = await NguoiDung.findOne({
                            soDienThoai: updatedRegistration.thongTinKhachHang.partnerPhone
                        });

                        if (partner) {
                            await createPartnerAddedNotification(
                                partner._id,
                                updatedRegistration.goiTapId,
                                updatedRegistration.thongTinKhachHang.firstName + ' ' + updatedRegistration.thongTinKhachHang.lastName,
                                updatedRegistration._id
                            );

                            // Tạo thông báo workflow cho partner
                            const owner = await NguoiDung.findById(updatedRegistration.nguoiDungId);
                            await createPartnerWorkflowNotification(
                                partner._id,
                                updatedRegistration._id,
                                updatedRegistration.goiTapId.tenGoiTap,
                                owner.hoTen
                            );
                        }
                    }
                } catch (notificationError) {
                    console.error('Error creating notifications:', notificationError);
                    // Không throw error để không ảnh hưởng đến payment flow
                }
            }

        } catch (error) {
            console.error('Error updating ZaloPay registration status:', error);
        }
    }

    /**
     * Cập nhật gói cũ khi nâng cấp
     */
    async updateOldPackageOnUpgrade(oldPackageId, upgradeInfo) {
        try {
            console.log(`🔄 [UPGRADE] Updating old package ${oldPackageId} to DA_NANG_CAP status`);

            const updatedOldPackage = await ChiTietGoiTap.findByIdAndUpdate(
                oldPackageId,
                {
                    trangThaiDangKy: 'DA_NANG_CAP',
                    trangThaiSuDung: 'DA_NANG_CAP',
                    lyDoTamDung: 'Nâng cấp gói tập',
                    ngayTamDung: new Date(),
                    soTienBu: upgradeInfo.soTienBu,
                    isUpgrade: upgradeInfo.isUpgrade,
                    ghiChu: upgradeInfo.ghiChu
                },
                { new: true }
            );

            if (updatedOldPackage) {
                console.log(`✅ [UPGRADE] Successfully updated old package ${oldPackageId} to DA_NANG_CAP status`);
                return updatedOldPackage;
            } else {
                console.error(`❌ [UPGRADE] Failed to find old package ${oldPackageId}`);
                return null;
            }
        } catch (error) {
            console.error(`❌ [UPGRADE] Error updating old package ${oldPackageId}:`, error);
            throw error;
        }
    }

    /**
     * Manually update payment status (for testing)
     */
    async manualUpdatePaymentStatus(req, res) {
        try {
            const { orderId, status } = req.body;

            if (!orderId || !status) {
                return res.status(400).json({
                    success: false,
                    message: 'Thiếu orderId hoặc status'
                });
            }

            // Find registration
            const registration = await ChiTietGoiTap.findOne({
                'thongTinThanhToan.orderId': orderId
            }).populate('goiTapId');

            if (!registration) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy đơn hàng'
                });
            }

            // Update status
            const updateData = {
                trangThaiThanhToan: status,
                thoiGianCapNhat: new Date()
            };

            const updatedRegistration = await ChiTietGoiTap.findOneAndUpdate(
                { 'thongTinThanhToan.orderId': orderId },
                updateData,
                { new: true }
            ).populate('goiTapId');

            // Create notification if payment successful
            if (status === 'DA_THANH_TOAN' && updatedRegistration) {
                console.log(`🔔 [MANUAL UPDATE] Creating notifications for registration ${updatedRegistration._id}, user ${updatedRegistration.nguoiDungId}`);
                try {
                    // Kiểm tra xem có phải upgrade không
                    if (updatedRegistration.isUpgrade && updatedRegistration.soTienBu > 0) {
                        console.log(`🔄 [MANUAL UPDATE] This is an upgrade package - creating upgrade notification`);

                        // Tìm gói cũ của user này (gói có trangThai = DA_NANG_CAP)
                        const oldPackageData = await ChiTietGoiTap.findOne({
                            nguoiDungId: updatedRegistration.nguoiDungId,
                            trangThai: 'DA_NANG_CAP',
                            trangThaiDangKy: 'DA_NANG_CAP'
                        }).populate('goiTapId');

                        console.log(`🔍 [MANUAL UPDATE] Found old package:`, oldPackageData ? oldPackageData._id : 'None');

                        // Tạo thông báo upgrade
                        await createUpgradeSuccessNotification(
                            updatedRegistration.nguoiDungId,
                            updatedRegistration.goiTapId,
                            oldPackageData ? oldPackageData.goiTapId : updatedRegistration.goiTapId, // Fallback nếu không tìm thấy gói cũ
                            {
                                soTienBu: updatedRegistration.soTienBu || 0,
                                isUpgrade: updatedRegistration.isUpgrade || true,
                                ghiChu: updatedRegistration.ghiChu || 'Nâng cấp gói tập'
                            },
                            updatedRegistration._id
                        );
                        console.log(`✅ [MANUAL UPDATE] Upgrade success notification created for user ${updatedRegistration.nguoiDungId}`);

                    } else {
                        // Thông báo thanh toán bình thường
                        await createPaymentSuccessNotification(
                            updatedRegistration.nguoiDungId,
                            updatedRegistration.goiTapId,
                            updatedRegistration._id
                        );
                        console.log(`✅ [MANUAL UPDATE] Payment success notification created for user ${updatedRegistration.nguoiDungId}`);
                    }

                    // Tạo thông báo workflow cho người thanh toán
                    try {
                        console.log(`🔍 [CALLBACK] Creating workflow notification for user ${updatedRegistration.nguoiDungId}, registration ${updatedRegistration._id}`);
                        await createWorkflowNotification(
                            updatedRegistration.nguoiDungId,
                            updatedRegistration._id,
                            updatedRegistration.goiTapId.tenGoiTap,
                            updatedRegistration.isUpgrade
                        );
                        console.log(`✅ [CALLBACK] Workflow notification created successfully for user ${updatedRegistration.nguoiDungId}`);
                    } catch (workflowError) {
                        console.error(`❌ [CALLBACK] Error creating workflow notification for user ${updatedRegistration.nguoiDungId}:`, workflowError);
                    }

                    // Nếu là gói tập 2 người, tạo notification cho người thứ 2
                    if (updatedRegistration.goiTapId.soLuongNguoiThamGia === 2 &&
                        updatedRegistration.thongTinKhachHang.partnerPhone) {

                        console.log(`🔔 [MANUAL UPDATE] Creating partner notification for phone ${updatedRegistration.thongTinKhachHang.partnerPhone}`);
                        const partner = await NguoiDung.findOne({
                            soDienThoai: updatedRegistration.thongTinKhachHang.partnerPhone
                        });

                        if (partner) {
                            await createPartnerAddedNotification(
                                partner._id,
                                updatedRegistration.goiTapId,
                                updatedRegistration.thongTinKhachHang.firstName + ' ' + updatedRegistration.thongTinKhachHang.lastName,
                                updatedRegistration._id
                            );
                            console.log(`✅ [MANUAL UPDATE] Partner notification created for user ${partner._id}`);

                            // Tạo thông báo workflow cho partner
                            const owner = await NguoiDung.findById(updatedRegistration.nguoiDungId);
                            await createPartnerWorkflowNotification(
                                partner._id,
                                updatedRegistration._id,
                                updatedRegistration.goiTapId.tenGoiTap,
                                owner.hoTen
                            );
                        } else {
                            console.log(`❌ [MANUAL UPDATE] Partner not found for phone ${updatedRegistration.thongTinKhachHang.partnerPhone}`);
                        }
                    }
                } catch (notificationError) {
                    console.error('❌ [MANUAL UPDATE] Error creating notifications:', notificationError);
                }
            }

            return res.status(200).json({
                success: true,
                message: 'Cập nhật trạng thái thanh toán thành công',
                data: {
                    orderId: orderId,
                    status: status,
                    updatedAt: new Date()
                }
            });

        } catch (error) {
            console.error('PaymentController.manualUpdatePaymentStatus error:', error);
            return res.status(500).json({
                success: false,
                message: 'Lỗi cập nhật trạng thái thanh toán',
                error: error.message
            });
        }
    }
}

module.exports = new PaymentController();
