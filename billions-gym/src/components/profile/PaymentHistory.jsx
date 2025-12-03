import { Receipt, CheckCircle, Calendar, CreditCard, Download } from "lucide-react";
import { useState } from "react";

export function PaymentHistory({ payments = [] }) {
    const [filter, setFilter] = useState("all");

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('vi-VN');
        } catch {
            return 'N/A';
        }
    };

    const formatPaymentData = () => {
        if (!payments || !Array.isArray(payments) || payments.length === 0) {
            return [];
        }

        return payments.map(payment => {
            // Handle different payment structures - ThanhToan model structure
            const chiTietGoiTap = payment.maChiTietGoiTap || payment.chiTietGoiTap;
            const pkg = chiTietGoiTap?.goiTapId || chiTietGoiTap?.maGoiTap || null;
            const planName = pkg?.tenGoiTap || 'Gói tập';
            const planType = planName.includes('Pro') ? 'Pro' : planName.includes('Premium') ? 'Premium' : 'Basic';
            const amount = payment.soTien || payment.amount || 0;
            const methodMap = {
                'TIEN_MAT': 'Tiền mặt',
                'CHUYEN_KHOAN': 'Chuyển khoản',
                'THE_TIN_DUNG': 'Thẻ tín dụng',
                'momo': 'MoMo',
                'zalopay': 'ZaloPay'
            };
            const method = methodMap[payment.phuongThuc] || payment.phuongThuc || 'Chuyển khoản';

            // Trạng thái thanh toán từ collection ThanhToan (có thể là DANG_XU_LY)
            let rawStatus = payment.trangThaiThanhToan || payment.trangThai || 'pending';

            // Nếu chiTietGoiTap đã đánh dấu thanh toán thành công, ưu tiên coi là THÀNH CÔNG
            const registrationStatus =
                chiTietGoiTap?.trangThaiThanhToan ||
                chiTietGoiTap?.trangThaiDangKy ||
                chiTietGoiTap?.trangThaiSuDung;

            if (
                registrationStatus === 'DA_THANH_TOAN' ||
                registrationStatus === 'HOAN_THANH' ||
                registrationStatus === 'DANG_SU_DUNG' ||
                registrationStatus === 'DANG_HOAT_DONG'
            ) {
                rawStatus = 'THANH_CONG';
            }

            // Calculate duration
            let duration = 'N/A';
            if (pkg?.thoiHan && pkg?.donViThoiHan) {
                const unit = pkg.donViThoiHan === 'Ngay' || pkg.donViThoiHan === 'Ngày' ? 'ngày' :
                    pkg.donViThoiHan === 'Thang' || pkg.donViThoiHan === 'Tháng' ? 'tháng' :
                        pkg.donViThoiHan === 'Nam' || pkg.donViThoiHan === 'Năm' ? 'năm' :
                            pkg.donViThoiHan === 'Phut' || pkg.donViThoiHan === 'Phút' ? 'phút' : '';
                duration = `${pkg.thoiHan} ${unit}`;
            }

            return {
                id: payment._id || payment.id || `INV-${Date.now()}`,
                planName,
                planType,
                amount: `${amount.toLocaleString('vi-VN')}₫`,
                amountValue: amount, // For calculations
                date: formatDate(payment.ngayThanhToan || payment.paymentDate || payment.createdAt),
                method,
                status: rawStatus === 'THANH_CONG' || rawStatus === 'completed' || rawStatus === 'thanhCong' ? 'completed' :
                    rawStatus === 'DANG_XU_LY' || rawStatus === 'pending' || rawStatus === 'choThanhToan' ? 'pending' :
                        rawStatus === 'THAT_BAI' || rawStatus === 'failed' || rawStatus === 'thatBai' ? 'failed' : 'pending',
                duration,
                rawDate: payment.ngayThanhToan || payment.paymentDate || payment.createdAt
            };
        });
    };

    const formattedPayments = formatPaymentData();

    // Calculate statistics
    const calculateStats = () => {
        const completedPayments = formattedPayments.filter(p => p.status === 'completed');
        const totalSpent = completedPayments.reduce((sum, p) => sum + (p.amountValue || 0), 0);
        const transactionCount = completedPayments.length;

        // Calculate time range
        let timeRange = '0 tháng';
        if (formattedPayments.length > 0) {
            const dates = formattedPayments
                .filter(p => p.rawDate)
                .map(p => new Date(p.rawDate))
                .sort((a, b) => a - b);

            if (dates.length > 0) {
                const oldest = dates[0];
                const newest = dates[dates.length - 1];
                const diffMonths = Math.round((newest - oldest) / (1000 * 60 * 60 * 24 * 30));
                timeRange = diffMonths > 0 ? `${diffMonths} tháng` : '1 tháng';
            }
        }

        return {
            totalSpent,
            transactionCount,
            timeRange
        };
    };

    const stats = calculateStats();

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'pending':
                return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            case 'failed':
                return 'bg-red-500/20 text-red-400 border-red-500/30';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'completed':
                return 'Thành công';
            case 'pending':
                return 'Đang xử lý';
            case 'failed':
                return 'Thất bại';
        }
    };

    const getPlanColor = (type) => {
        switch (type) {
            case "Premium":
                return "from-yellow-500 to-yellow-700";
            case "Pro":
                return "from-[#da2128] to-[#9b1c1f]";
            case "Basic":
                return "from-blue-500 to-blue-700";
            default:
                return "from-zinc-600 to-zinc-800";
        }
    };

    const filteredPayments = filter === "all"
        ? formattedPayments
        : formattedPayments.filter(p => p.status === filter);

    return (
        <div className="bg-[#141414] rounded-xl p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-[#da2128] to-[#9b1c1f] rounded-lg">
                        <Receipt size={20} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Lịch sử thanh toán</h3>
                        <p className="text-zinc-500 text-sm">{payments.length} giao dịch</p>
                    </div>
                </div>

                {/* Filter Buttons */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setFilter("all")}
                        className={`px-4 py-2 rounded-lg text-sm transition-all duration-300 ${filter === "all"
                            ? "bg-[#da2128] text-white"
                            : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                            }`}
                    >
                        Tất cả
                    </button>
                    <button
                        onClick={() => setFilter("completed")}
                        className={`px-4 py-2 rounded-lg text-sm transition-all duration-300 ${filter === "completed"
                            ? "bg-[#da2128] text-white"
                            : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                            }`}
                    >
                        Thành công
                    </button>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gradient-to-br from-[#da2128]/10 to-transparent rounded-xl border border-[#da2128]/20">
                <div className="text-center">
                    <p className="text-zinc-400 text-xs mb-1">Tổng chi tiêu</p>
                    <p className="font-bold text-white">{stats.totalSpent.toLocaleString('vi-VN')}₫</p>
                </div>
                <div className="text-center border-x border-zinc-800">
                    <p className="text-zinc-400 text-xs mb-1">Giao dịch</p>
                    <p className="font-bold text-white">{stats.transactionCount}</p>
                </div>
                <div className="text-center">
                    <p className="text-zinc-400 text-xs mb-1">Thời gian</p>
                    <p className="font-bold text-white">{stats.timeRange}</p>
                </div>
            </div>

            {/* Payment List */}
            <div className="space-y-3 max-h-[600px] overflow-y-auto scrollbar-hide">
                {filteredPayments.map((payment, index) => (
                    <div
                        key={index}
                        className="group bg-zinc-900/30 hover:bg-zinc-900/60 rounded-xl p-4 transition-all duration-300 border border-zinc-800 hover:border-[#da2128]/30"
                    >
                        <div className="flex items-start gap-4">
                            {/* Icon */}
                            <div className={`flex-shrink-0 w-12 h-12 bg-gradient-to-br ${getPlanColor(payment.planType)} rounded-xl flex items-center justify-center shadow-lg`}>
                                <Receipt size={20} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-4 mb-2">
                                    <div>
                                        <h4 className="text-white mb-1 group-hover:text-[#da2128] transition-colors">
                                            {payment.planName}
                                        </h4>
                                        <div className="flex items-center gap-3 text-sm text-zinc-400">
                                            <div className="flex items-center gap-1">
                                                <Calendar size={14} />
                                                <span>{payment.date}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <CreditCard size={14} />
                                                <span>{payment.method}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <p className="font-bold text-white mb-1">{payment.amount}</p>
                                        <div className={`px-2 py-1 rounded-lg text-xs border ${getStatusColor(payment.status)}`}>
                                            {getStatusText(payment.status)}
                                        </div>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-zinc-500">Mã hóa đơn:</span>
                                        <span className="text-xs text-zinc-400 font-mono">{payment.id}</span>
                                    </div>

                                    <button className="flex items-center gap-2 text-xs text-[#da2128] hover:text-[#ff4147] transition-colors">
                                        <Download size={14} />
                                        <span>Tải hóa đơn</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* View All Button */}
            {filteredPayments.length > 4 && (
                <button className="w-full mt-4 py-3 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white hover:border-[#da2128] transition-all duration-300">
                    Xem tất cả lịch sử
                </button>
            )}
        </div>
    );
}
