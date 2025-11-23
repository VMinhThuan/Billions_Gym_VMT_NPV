import { CreditCard, Calendar, Clock, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";

export function CurrentMembership({ onViewDetails, onRenew }) {
    const membership = {
        planName: "Gói Pro - 6 Tháng",
        planType: "Pro",
        startDate: "15/05/2025",
        endDate: "15/11/2025",
        daysRemaining: 5,
        price: "3,500,000đ",
        features: [
            "Tập không giới hạn",
            "Tư vấn dinh dưỡng",
            "PT riêng 4 buổi/tháng",
            "Phòng xông hơi miễn phí"
        ],
        isExpired: false,
        imageUrl: "https://images.unsplash.com/photo-1519859660545-3dea8ddf683c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxneW0lMjBtZW1iZXJzaGlwJTIwY2FyZHxlbnwxfHx8fDE3NjM2MzMyNDJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
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

    const isExpiringSoon = membership.daysRemaining <= 7 && !membership.isExpired;

    return (
        <div className="bg-[#141414] rounded-xl overflow-hidden">
            {/* Header */}
            <div className="p-6 pb-0">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-gradient-to-br from-[#da2128] to-[#9b1c1f] rounded-lg">
                        <CreditCard size={20} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Gói tập hiện tại</h3>
                        <p className="text-zinc-500 text-sm">Thông tin thành viên</p>
                    </div>
                </div>
            </div>

            {/* Membership Card */}
            <div className="px-6 pb-6">
                <div className="relative bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-2xl overflow-hidden group hover:scale-[1.02] transition-all duration-300">
                    {/* Background Image */}
                    <div className="absolute inset-0 opacity-10">
                        <img
                            src={membership.imageUrl}
                            alt="Membership"
                            className="w-full h-full object-cover"
                        />
                    </div>

                    {/* Gradient Overlay */}
                    <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${getPlanColor(membership.planType)} opacity-20 blur-3xl`}></div>

                    <div className="relative p-6">
                        {/* Card Header */}
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-br ${getPlanColor(membership.planType)} rounded-lg mb-3 shadow-lg`}>
                                    <CheckCircle size={16} />
                                    <span className="text-sm">{membership.planType} Member</span>
                                </div>
                                <h4 className="text-xl font-bold text-white mb-1">
                                    {membership.planName}
                                </h4>
                                <p className="text-zinc-400 text-sm">{membership.price}</p>
                            </div>

                            {/* Status Badge */}
                            {membership.isExpired ? (
                                <div className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-sm border border-red-500/30 flex items-center gap-2">
                                    <AlertCircle size={14} />
                                    <span>Đã hết hạn</span>
                                </div>
                            ) : isExpiringSoon ? (
                                <div className="px-3 py-1.5 bg-yellow-500/20 text-yellow-400 rounded-lg text-sm border border-yellow-500/30 flex items-center gap-2">
                                    <Clock size={14} />
                                    <span>Sắp hết hạn</span>
                                </div>
                            ) : (
                                <div className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-sm border border-green-500/30 flex items-center gap-2">
                                    <CheckCircle size={14} />
                                    <span>Đang hoạt động</span>
                                </div>
                            )}
                        </div>

                        {/* Dates */}
                        <div className="flex items-center gap-6 mb-6 pb-6 border-b border-zinc-800">
                            <div className="flex items-center gap-2">
                                <Calendar size={16} className="text-zinc-500" />
                                <div>
                                    <p className="text-zinc-500 text-xs">Ngày bắt đầu</p>
                                    <p className="text-white text-sm">{membership.startDate}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar size={16} className="text-zinc-500" />
                                <div>
                                    <p className="text-zinc-500 text-xs">Ngày kết thúc</p>
                                    <p className="text-white text-sm">{membership.endDate}</p>
                                </div>
                            </div>
                        </div>

                        {/* Time Remaining */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-zinc-400 text-sm">Thời gian còn lại</span>
                                <span className={`font-bold ${membership.isExpired ? 'text-red-400' : isExpiringSoon ? 'text-yellow-400' : 'text-white'}`}>
                                    {membership.isExpired ? 'Đã hết hạn' : `${membership.daysRemaining} ngày`}
                                </span>
                            </div>
                            {!membership.isExpired && (
                                <div className="relative h-2 bg-zinc-800 rounded-full overflow-hidden">
                                    <div
                                        className={`absolute inset-y-0 left-0 bg-gradient-to-r ${getPlanColor(membership.planType)} rounded-full transition-all duration-700`}
                                        style={{ width: `${((180 - membership.daysRemaining) / 180) * 100}%` }}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Features */}
                        <div className="grid grid-cols-2 gap-2 mb-6">
                            {membership.features.map((feature, index) => (
                                <div key={index} className="flex items-center gap-2 text-sm text-zinc-300">
                                    <div className="w-1.5 h-1.5 bg-[#da2128] rounded-full"></div>
                                    <span>{feature}</span>
                                </div>
                            ))}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            {membership.isExpired || isExpiringSoon ? (
                                <button
                                    onClick={onRenew}
                                    className="flex-1 bg-gradient-to-r from-[#da2128] to-[#ff4147] hover:from-[#b81d23] hover:to-[#da2128] py-3 rounded-xl transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2 shadow-lg hover:shadow-[#da2128]/50 font-bold"
                                >
                                    <Clock size={18} />
                                    <span>Gia hạn ngay</span>
                                </button>
                            ) : (
                                <button
                                    onClick={onViewDetails}
                                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
                                >
                                    <span>Xem chi tiết gói</span>
                                    <ArrowRight size={18} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
