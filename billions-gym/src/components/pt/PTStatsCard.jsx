import React from 'react';

const PTStatsCard = ({ icon: Icon, label, value, subValue, trend, iconColor = '#da2128' }) => {
    return (
        <div className="bg-[#141414] rounded-xl p-6 border border-[#2a2a2a] hover:border-[#da2128] transition-all">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-gray-400 text-sm mb-2">{label}</p>
                    <p className="text-3xl font-bold text-white mb-1">{value}</p>
                    {subValue && (
                        <p className="text-gray-500 text-sm">{subValue}</p>
                    )}
                    {trend && (
                        <div className={`mt-2 text-xs ${trend.positive ? 'text-green-500' : 'text-red-500'}`}>
                            {trend.text}
                        </div>
                    )}
                </div>
                <div className="flex-shrink-0">
                    <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${iconColor}20` }}
                    >
                        <Icon className="w-6 h-6" style={{ color: iconColor }} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PTStatsCard;
