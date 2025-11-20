import { X, CreditCard, Calendar, Tag, CheckCircle, ArrowRight } from "lucide-react";
import { useState } from "react";

export function RenewalModal({ isOpen, onClose }) {
    const [selectedPlan, setSelectedPlan] = useState("pro-6");
    const [selectedPayment, setSelectedPayment] = useState("visa");

    if (!isOpen) return null;

    const plans = [
        {
            id: "pro-3",
            name: "Gói Pro - 3 Tháng",
            duration: "3 tháng",
            price: "2,100,000đ",
            pricePerMonth: "700,000đ/tháng",
            features: ["Tập không giới hạn", "PT riêng 4 buổi/tháng", "Tư vấn dinh dưỡng"]
        },
        {
            id: "pro-6",
            name: "Gói Pro - 6 Tháng",
            duration: "6 tháng",
            price: "3,500,000đ",
            originalPrice: "4,200,000đ",
            discount: "Tiết kiệm 700,000đ",
            pricePerMonth: "583,333đ/tháng",
            popular: true,
            features: ["Tập không giới hạn", "PT riêng 4 buổi/tháng", "Tư vấn dinh dưỡng", "Xông hơi miễn phí"]
        },
        {
            id: "pro-12",
            name: "Gói Pro - 12 Tháng",
            duration: "12 tháng",
            price: "6,000,000đ",
            originalPrice: "8,400,000đ",
            discount: "Tiết kiệm 2,400,000đ",
            pricePerMonth: "500,000đ/tháng",
            features: ["Tập không giới hạn", "PT riêng 4 buổi/tháng", "Tư vấn dinh dưỡng", "Xông hơi miễn phí", "Khăn tắm miễn phí"]
        }
    ];

    const paymentMethods = [
        { id: "visa", name: "Thẻ Visa/Mastercard", icon: CreditCard, info: "****4532" },
        { id: "transfer", name: "Chuyển khoản ngân hàng", icon: CreditCard, info: "Vietcombank" },
        { id: "cash", name: "Tiền mặt tại quầy", icon: CreditCard, info: "GymNutrition HQ" }
    ];

    const handleRenew = () => {
        alert("Gia hạn thành công!");
        onClose();
    };

    const selectedPlanData = plans.find(p => p.id === selectedPlan);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="relative bg-[#141414] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="relative p-6 border-b border-zinc-800">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-3xl font-bold text-white mb-2">Gia hạn gói tập</h2>
                            <p className="text-zinc-400 text-sm">Chọn gói phù hợp và phương thức thanh toán</p>
                        </div>

                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto scrollbar-hide">
                    {/* Plan Selection */}
                    <div className="mb-8">
                        <h3 className="text-xl font-bold text-white mb-4">Chọn gói tập</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {plans.map((plan) => (
                                <div
                                    key={plan.id}
                                    onClick={() => setSelectedPlan(plan.id)}
                                    className={`relative p-5 rounded-xl border-2 cursor-pointer transition-all duration-300 ${selectedPlan === plan.id
                                            ? "border-[#da2128] bg-[#da2128]/5"
                                            : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/30"
                                        }`}
                                >
                                    {plan.popular && (
                                        <div className="absolute -top-2 right-4 px-3 py-1 bg-gradient-to-r from-[#da2128] to-[#ff4147] rounded-full text-xs shadow-lg">
                                            Phổ biến nhất
                                        </div>
                                    )}

                                    <div className="mb-3">
                                        <h4 className="text-white mb-1 font-semibold">{plan.name}</h4>
                                        {plan.originalPrice && (
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-zinc-500 text-sm line-through">{plan.originalPrice}</span>
                                                <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">
                                                    Giảm giá
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-xl font-bold text-white">{plan.price}</span>
                                        </div>
                                        <p className="text-zinc-500 text-xs mt-1">{plan.pricePerMonth}</p>
                                    </div>

                                    <div className="space-y-2">
                                        {plan.features.map((feature, idx) => (
                                            <div key={idx} className="flex items-start gap-2 text-xs text-zinc-400">
                                                <CheckCircle size={14} className="text-[#da2128] flex-shrink-0 mt-0.5" />
                                                <span>{feature}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {selectedPlan === plan.id && (
                                        <div className="absolute top-4 right-4 w-6 h-6 bg-[#da2128] rounded-full flex items-center justify-center">
                                            <CheckCircle size={16} />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {selectedPlanData?.discount && (
                            <div className="mt-4 p-4 bg-gradient-to-br from-green-500/10 to-transparent rounded-xl border border-green-500/20">
                                <div className="flex items-center gap-2 text-green-400">
                                    <Tag size={18} />
                                    <span className="text-sm">{selectedPlanData.discount}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Payment Method */}
                    <div className="mb-6">
                        <h3 className="text-xl font-bold text-white mb-4">Phương thức thanh toán</h3>
                        <div className="space-y-3">
                            {paymentMethods.map((method) => {
                                const Icon = method.icon;
                                return (
                                    <div
                                        key={method.id}
                                        onClick={() => setSelectedPayment(method.id)}
                                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${selectedPayment === method.id
                                                ? "border-[#da2128] bg-[#da2128]/5"
                                                : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/30"
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-zinc-800 rounded-lg">
                                                    <Icon size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-white text-sm">{method.name}</p>
                                                    <p className="text-zinc-500 text-xs">{method.info}</p>
                                                </div>
                                            </div>

                                            {selectedPayment === method.id && (
                                                <div className="w-6 h-6 bg-[#da2128] rounded-full flex items-center justify-center">
                                                    <CheckCircle size={16} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="p-5 bg-zinc-900/50 rounded-xl border border-zinc-800">
                        <h3 className="text-xl font-bold text-white mb-4">Tóm tắt đơn hàng</h3>
                        <div className="space-y-3 mb-4 pb-4 border-b border-zinc-800">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-zinc-400">Gói đã chọn</span>
                                <span className="text-white">{selectedPlanData?.name}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-zinc-400">Thời gian</span>
                                <span className="text-white">{selectedPlanData?.duration}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-zinc-400">Thanh toán</span>
                                <span className="text-white">{paymentMethods.find(p => p.id === selectedPayment)?.name}</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xl font-bold text-white">Tổng thanh toán</span>
                            <span className="text-2xl font-bold text-[#da2128]">{selectedPlanData?.price}</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 pt-4 border-t border-zinc-800">
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 border border-zinc-700 rounded-xl text-zinc-300 hover:bg-zinc-800 transition-all duration-300"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleRenew}
                            className="flex-1 bg-gradient-to-r from-[#da2128] to-[#ff4147] hover:from-[#b81d23] hover:to-[#da2128] py-3 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-[#da2128]/50 font-bold flex items-center justify-center gap-2"
                        >
                            <span>Xác nhận thanh toán</span>
                            <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
