import React from 'react';
import { User, MapPin, Award, Calendar } from 'lucide-react';

const PTProfileHeader = ({ profile }) => {
    return (
        <div className="bg-[#141414] rounded-2xl p-6 border border-[#2a2a2a]">
            <div className="flex flex-col md:flex-row gap-6">
                {/* Avatar */}
                <div className="flex-shrink-0">
                    <div className="w-32 h-32 rounded-full overflow-hidden bg-[#2a2a2a] border-4 border-[#da2128] relative">
                        {profile?.anhDaiDien ? (
                            <img
                                src={profile.anhDaiDien}
                                alt={profile.hoTen}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <User className="w-16 h-16 text-gray-600" />
                            </div>
                        )}
                        {/* Online/Offline Status */}
                        <div className={`absolute bottom-2 right-2 w-6 h-6 border-4 border-[#141414] rounded-full ${profile?.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    </div>
                </div>

                {/* Info */}
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-bold text-white">{profile?.hoTen || 'PT'}</h1>
                        {/* Online/Offline Status Text */}
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#2a2a2a]">
                            <div className={`w-2 h-2 rounded-full ${profile?.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                            <span className={`text-sm font-medium ${profile?.isOnline ? 'text-green-400' : 'text-gray-400'}`}>
                                {profile?.isOnline ? 'Online' : 'Offline'}
                            </span>
                        </div>
                    </div>
                    <p className="text-gray-400 mb-4">{profile?.email}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-2 text-gray-300">
                            <MapPin className="w-5 h-5 text-[#da2128]" />
                            <span>{profile?.chinhanh?.tenChiNhanh || 'Chưa có chi nhánh'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-300">
                            <Calendar className="w-5 h-5 text-[#da2128]" />
                            <span>Ngày vào làm: {profile?.ngayThamGia ? new Date(profile.ngayThamGia).toLocaleDateString('vi-VN') : 'N/A'}</span>
                        </div>
                        {profile?.chuyenMon && Array.isArray(profile.chuyenMon) && profile.chuyenMon.length > 0 && (
                            <div className="flex items-center gap-2 text-gray-300 md:col-span-2">
                                <Award className="w-5 h-5 text-[#da2128]" />
                                <span>Chuyên môn: {profile.chuyenMon.join(', ')}</span>
                            </div>
                        )}
                    </div>

                    {profile?.moTa && (
                        <div className="mt-4 p-4 bg-[#0a0a0a] rounded-lg">
                            <p className="text-gray-300 text-sm leading-relaxed">{profile.moTa}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PTProfileHeader;
