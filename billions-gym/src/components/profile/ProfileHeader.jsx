import { Camera, Edit, Settings, Star, Medal, Crown, Gem } from "lucide-react";

export function ProfileHeader({ name, email, memberSince, imageUrl, memberRank }) {
    const getRankLabel = () => {
        if (!memberRank) return 'Thành viên';

        const code = (memberRank.tenHang || memberRank).toString().toUpperCase();

        switch (code) {
            case 'BRONZE':
                return 'Thành viên Đồng';
            case 'SILVER':
                return 'Thành viên Bạc';
            case 'GOLD':
                return 'Thành viên Vàng';
            case 'PLATINUM':
                return 'Thành viên Bạch kim';
            case 'DIAMOND':
                return 'Thành viên Kim cương';
            default:
                return memberRank.tenHienThi || 'Thành viên';
        }
    };
    const getRankIcon = () => {
        if (!memberRank) return null;

        const code = (memberRank.tenHang || memberRank).toString().toUpperCase();

        switch (code) {
            case 'BRONZE':
                return Star;
            case 'SILVER':
                return Medal;
            case 'GOLD':
                return Crown;
            case 'PLATINUM':
                return Gem;
            case 'DIAMOND':
                return Gem;
            default:
                return Star;
        }
    };
    return (
        <div className="relative bg-[#141414] rounded-2xl overflow-hidden">
            {/* Cover Image with Gradient Overlay */}
            <div className="relative h-48 bg-gradient-to-br from-[#da2128] via-[#9b1c1f] to-[#0a0a0a]">
                <div className="absolute inset-0 opacity-20">
                    <img
                        src="https://images.unsplash.com/photo-1573858129122-33bdb25d6950?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaXRuZXNzJTIwd29ya291dCUyMHRyYWluaW5nfGVufDF8fHx8MTc2MzU4NDQ5OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                        alt="Cover"
                        className="w-full h-full object-cover"
                    />
                </div>
                <button className="absolute top-4 right-4 bg-[#141414]/80 hover:bg-[#da2128] p-3 rounded-xl transition-all duration-300 hover:scale-110">
                    <Settings size={20} />
                </button>
            </div>

            {/* Profile Info */}
            <div className="relative px-8 pb-8">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                    {/* Avatar */}
                    <div className="relative -mt-16">
                        <div className="relative">
                            <img
                                src={imageUrl}
                                alt={name}
                                className="w-32 h-32 rounded-2xl border-4 border-[#141414] object-cover shadow-2xl"
                            />
                            <button className="absolute bottom-0 right-0 bg-[#da2128] hover:bg-[#b81d23] p-2.5 rounded-xl transition-all duration-300 hover:scale-110 shadow-lg">
                                <Camera size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Name and Info */}
                    <div className="flex-1 md:ml-6 mt-4 md:mt-0">
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-white">{name}</h1>
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#da2128]/20 text-[#da2128] rounded-lg text-sm border border-[#da2128]/30">
                                {(() => {
                                    const Icon = getRankIcon();
                                    return Icon ? <Icon size={14} /> : null;
                                })()}
                                <span>{getRankLabel()}</span>
                            </span>
                        </div>
                        <p className="text-zinc-400 mt-1">{email}</p>
                        <p className="text-zinc-500 text-sm mt-1">Thành viên từ {memberSince}</p>
                    </div>

                    {/* Edit Button */}
                    <button className="bg-[#da2128] hover:bg-[#b81d23] px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105 flex items-center gap-2 shadow-lg hover:shadow-[#da2128]/50">
                        <Edit size={18} />
                        <span>Chỉnh sửa hồ sơ</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
