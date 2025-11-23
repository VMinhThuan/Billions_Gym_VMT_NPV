import { X, CheckCircle, Star, Users, Dumbbell, Calendar, Clock, Zap } from "lucide-react";

export function MembershipDetailModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    const membershipDetails = {
        name: "Gói Pro - 6 Tháng",
        type: "Pro",
        price: "3,500,000đ",
        pricePerMonth: "583,333đ/tháng",
        startDate: "15/05/2025",
        endDate: "15/11/2025",
        features: [
            {
                icon: Dumbbell,
                title: "Tập không giới hạn",
                description: "Truy cập phòng gym 24/7, tất cả các ngày trong tuần"
            },
            {
                icon: Users,
                title: "PT riêng 4 buổi/tháng",
                description: "Huấn luyện viên cá nhân theo dõi và hướng dẫn tận tình"
            },
            {
                icon: Star,
                title: "Tư vấn dinh dưỡng",
                description: "Chuyên gia dinh dưỡng xây dựng thực đơn phù hợp"
            },
            {
                icon: Zap,
                title: "Phòng xông hơi miễn phí",
                description: "Thư giãn sau buổi tập với phòng xông hơi cao cấp"
            }
        ],
        benefits: [
            "Không giới hạn thời gian tập",
            "Tham gia tất cả lớp group class",
            "Sử dụng tủ khóa cá nhân",
            "Khăn tắm & nước uống miễn phí",
            "Giảm 20% cho bạn bè giới thiệu",
            "Ưu đãi đặc biệt từ đối tác"
        ]
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="relative bg-[#141414] rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="relative p-6 pb-0">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-br from-[#da2128] to-[#9b1c1f] rounded-lg mb-3">
                                <Star size={16} />
                                <span className="text-sm">{membershipDetails.type} Member</span>
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-2">{membershipDetails.name}</h2>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-white">{membershipDetails.price}</span>
                                <span className="text-zinc-500 text-sm">({membershipDetails.pricePerMonth})</span>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Dates */}
                    <div className="flex items-center gap-6 p-4 bg-zinc-900/50 rounded-xl mb-6">
                        <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-zinc-500" />
                            <div>
                                <p className="text-zinc-500 text-xs">Bắt đầu</p>
                                <p className="text-white text-sm">{membershipDetails.startDate}</p>
                            </div>
                        </div>
                        <div className="w-px h-8 bg-zinc-800"></div>
                        <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-zinc-500" />
                            <div>
                                <p className="text-zinc-500 text-xs">Kết thúc</p>
                                <p className="text-white text-sm">{membershipDetails.endDate}</p>
                            </div>
                        </div>
                        <div className="w-px h-8 bg-zinc-800"></div>
                        <div className="flex items-center gap-2">
                            <Clock size={16} className="text-[#da2128]" />
                            <div>
                                <p className="text-zinc-500 text-xs">Còn lại</p>
                                <p className="text-white text-sm">5 ngày</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 pt-0 max-h-[calc(90vh-250px)] overflow-y-auto scrollbar-hide">
                    {/* Main Features */}
                    <div className="mb-8">
                        <h3 className="text-xl font-bold text-white mb-4">Tính năng chính</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {membershipDetails.features.map((feature, index) => {
                                const Icon = feature.icon;
                                return (
                                    <div
                                        key={index}
                                        className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800 hover:border-[#da2128]/30 transition-colors"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0 p-2 bg-gradient-to-br from-[#da2128] to-[#9b1c1f] rounded-lg">
                                                <Icon size={20} />
                                            </div>
                                            <div>
                                                <h4 className="text-white mb-1 font-semibold">{feature.title}</h4>
                                                <p className="text-zinc-400 text-sm">{feature.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Additional Benefits */}
                    <div>
                        <h3 className="text-xl font-bold text-white mb-4">Quyền lợi thành viên</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {membershipDetails.benefits.map((benefit, index) => (
                                <div key={index} className="flex items-start gap-3 text-zinc-300">
                                    <CheckCircle size={18} className="text-[#da2128] flex-shrink-0 mt-0.5" />
                                    <span className="text-sm">{benefit}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Notice */}
                    <div className="mt-6 p-4 bg-gradient-to-br from-[#da2128]/10 to-transparent rounded-xl border border-[#da2128]/20">
                        <p className="text-zinc-400 text-sm">
                            <span className="text-[#da2128]">Lưu ý:</span> Gói tập của bạn sẽ hết hạn vào ngày <span className="text-white">15/11/2025</span>.
                            Để tiếp tục sử dụng dịch vụ, vui lòng gia hạn trước khi gói hết hạn.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 pt-4 border-t border-zinc-800">
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 border border-zinc-700 rounded-xl text-zinc-300 hover:bg-zinc-800 transition-all duration-300"
                        >
                            Đóng
                        </button>
                        <button className="flex-1 bg-gradient-to-r from-[#da2128] to-[#ff4147] hover:from-[#b81d23] hover:to-[#da2128] py-3 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-[#da2128]/50 font-bold">
                            Gia hạn gói
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
