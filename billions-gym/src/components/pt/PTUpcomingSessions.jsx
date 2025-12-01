import React from 'react';
import { Clock, MapPin, Users } from 'lucide-react';

const PTUpcomingSessions = ({ sessions, loading }) => {
    if (loading) {
        return (
            <div className="bg-[#141414] rounded-xl p-6 border border-[#2a2a2a]">
                <h3 className="text-lg font-semibold text-white mb-4">Lịch sắp tới</h3>
                <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#da2128]"></div>
                </div>
            </div>
        );
    }

    if (!sessions || sessions.length === 0) {
        return (
            <div className="bg-[#141414] rounded-xl p-6 border border-[#2a2a2a]">
                <h3 className="text-lg font-semibold text-white mb-4">Lịch sắp tới</h3>
                <div className="text-center text-gray-500 py-8">
                    Không có lịch sắp tới
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#141414] rounded-xl p-6 border border-[#2a2a2a]">
            <h3 className="text-lg font-semibold text-white mb-4">Lịch sắp tới</h3>
            <div className="space-y-3">
                {sessions.map((session, index) => (
                    <div
                        key={index}
                        className="bg-[#0a0a0a] rounded-lg p-4 border border-[#2a2a2a] hover:border-[#da2128] transition-all cursor-pointer"
                    >
                        <h4 className="text-white font-semibold mb-2">{session.tenBuoiTap}</h4>
                        <div className="space-y-1.5 text-sm">
                            <div className="flex items-center gap-2 text-gray-400">
                                <Clock className="w-4 h-4 text-[#da2128]" />
                                <span>
                                    {new Date(session.ngayTap).toLocaleDateString('vi-VN')} - {session.gioBatDau} - {session.gioKetThuc}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-400">
                                <MapPin className="w-4 h-4 text-[#da2128]" />
                                <span>{session.chiNhanh?.tenChiNhanh || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-400">
                                <Users className="w-4 h-4 text-[#da2128]" />
                                <span>
                                    {session.soLuongHienTai}/{session.soLuongToiDa} học viên
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PTUpcomingSessions;
