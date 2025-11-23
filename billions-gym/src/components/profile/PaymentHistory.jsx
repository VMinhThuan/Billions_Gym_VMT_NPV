import { Receipt, CheckCircle, Calendar, CreditCard, Download } from "lucide-react";
import { useState } from "react";

export function PaymentHistory() {
    const [filter, setFilter] = useState("all");

    const payments = [
        {
            id: "INV-2025-001234",
            planName: "Gói Pro - 6 Tháng",
            planType: "Pro",
            amount: "3,500,000đ",
            date: "15/05/2025",
            method: "Thẻ Visa ****4532",
            status: "completed",
            duration: "6 tháng"
        },
        {
            id: "INV-2024-009876",
            planName: "Gói Basic - 3 Tháng",
            planType: "Basic",
            amount: "1,200,000đ",
            date: "15/11/2024",
            method: "Chuyển khoản",
            status: "completed",
            duration: "3 tháng"
        },
        {
            id: "INV-2024-007654",
            planName: "Gói Pro - 6 Tháng",
            planType: "Pro",
            amount: "3,200,000đ",
            date: "15/05/2024",
            method: "Thẻ Visa ****4532",
            status: "completed",
            duration: "6 tháng"
        },
        {
            id: "INV-2023-005432",
            planName: "Gói Basic - 1 Tháng",
            planType: "Basic",
            amount: "450,000đ",
            date: "10/11/2023",
            method: "Tiền mặt",
            status: "completed",
            duration: "1 tháng"
        }
    ];

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
        ? payments
        : payments.filter(p => p.status === filter);

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
                    <p className="font-bold text-white">8,350,000đ</p>
                </div>
                <div className="text-center border-x border-zinc-800">
                    <p className="text-zinc-400 text-xs mb-1">Giao dịch</p>
                    <p className="font-bold text-white">{payments.length}</p>
                </div>
                <div className="text-center">
                    <p className="text-zinc-400 text-xs mb-1">Thời gian</p>
                    <p className="font-bold text-white">16 tháng</p>
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
