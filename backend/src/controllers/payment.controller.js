const momoPaymentService = require('../services/momoPayment.service');
const zaloPaymentService = require('../services/zaloPayment.service');
const GoiTap = require('../models/GoiTap');
const PackageRegistration = require('../models/PackageRegistration');
const { NguoiDung } = require('../models/NguoiDung');

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
                redirectUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-success?orderId=${orderId}`,
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

            // Lưu thông tin đăng ký gói tập
            const registrationData = {
                goiTapId: packageId,
                nguoiDungId: userId,
                thoiGianDangKy: new Date(),
                trangThai: 'CHO_THANH_TOAN',
                thongTinThanhToan: {
                    phuongThuc: 'momo',
                    orderId: orderId,
                    amount: amount,
                    requestId: momoResult.requestId,
                    paymentUrl: momoResult.data.payUrl
                },
                thongTinKhachHang: paymentData
            };

            // Lưu vào database
            const registration = new PackageRegistration(registrationData);
            await registration.save();

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
                redirectUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-success?orderId=${orderId}`,
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

            // Lưu thông tin đăng ký gói tập
            const registrationData = {
                goiTapId: packageId,
                nguoiDungId: userId,
                thoiGianDangKy: new Date(),
                trangThai: 'CHO_THANH_TOAN',
                thongTinThanhToan: {
                    phuongThuc: 'zalopay',
                    orderId: orderId,
                    amount: amount,
                    app_trans_id: zaloResult.app_trans_id,
                    paymentUrl: zaloResult.data.order_url
                },
                thongTinKhachHang: paymentData
            };

            // Lưu vào database
            const registration = new PackageRegistration(registrationData);
            await registration.save();

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
                await this.updateRegistrationStatus(result.app_trans_id, 'DA_THANH_TOAN', result);

                console.log(`ZaloPay payment successful for app_trans_id: ${result.app_trans_id}`);
            } else {
                // Cập nhật trạng thái thất bại
                await this.updateRegistrationStatus(result.app_trans_id, 'THANH_TOAN_THAT_BAI', result);

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
            const registration = await PackageRegistration.findOne({
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
                    status: registration.trangThai,
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
                trangThai: status,
                thoiGianCapNhat: new Date(),
                'thongTinThanhToan.ketQuaThanhToan': paymentResult
            };

            await PackageRegistration.findOneAndUpdate(
                { 'thongTinThanhToan.orderId': orderId },
                updateData,
                { new: true }
            );

            console.log(`Updated registration status for order ${orderId} to ${status}`);

        } catch (error) {
            console.error('Error updating registration status:', error);
        }
    }
}

module.exports = new PaymentController();
