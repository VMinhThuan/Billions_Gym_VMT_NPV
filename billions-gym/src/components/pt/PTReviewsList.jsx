import React from 'react';
import { Star, MessageCircle, Calendar } from 'lucide-react';

const PTReviewsList = ({ reviews, loading }) => {
    if (loading) {
        return (
            <div className="bg-[#141414] rounded-xl p-6 border border-[#2a2a2a]">
                <h3 className="text-lg font-semibold text-white mb-4">Đánh giá từ học viên</h3>
                <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#da2128]"></div>
                </div>
            </div>
        );
    }

    if (!reviews || reviews.length === 0) {
        return (
            <div className="bg-[#141414] rounded-xl p-6 border border-[#2a2a2a]">
                <h3 className="text-lg font-semibold text-white mb-4">Đánh giá từ học viên</h3>
                <div className="text-center text-gray-500 py-8">
                    Chưa có đánh giá nào
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#141414] rounded-xl p-6 border border-[#2a2a2a]">
            <h3 className="text-lg font-semibold text-white mb-4">Đánh giá từ học viên</h3>
            <div className="space-y-4">
                {reviews.map((review, index) => (
                    <div
                        key={index}
                        className="bg-[#0a0a0a] rounded-lg p-4 border border-[#2a2a2a]"
                    >
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded-full bg-[#2a2a2a] flex items-center justify-center">
                                    {review.hoiVienId?.anhDaiDien ? (
                                        <img
                                            src={review.hoiVienId.anhDaiDien}
                                            alt={review.hoiVienId.hoTen}
                                            className="w-full h-full rounded-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-white font-semibold">
                                            {review.hoiVienId?.hoTen?.charAt(0) || 'U'}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <p className="text-white font-medium">
                                        {review.hoiVienId?.hoTen || 'Học viên'}
                                    </p>
                                    <div className="flex items-center gap-1">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`w-4 h-4 ${i < review.rating
                                                        ? 'fill-yellow-500 text-yellow-500'
                                                        : 'text-gray-600'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 text-gray-500 text-xs">
                                <Calendar className="w-3 h-3" />
                                <span>
                                    {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                                </span>
                            </div>
                        </div>
                        {review.comment && (
                            <div className="mt-3 flex items-start gap-2 text-gray-300 text-sm">
                                <MessageCircle className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                                <p className="leading-relaxed">{review.comment}</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PTReviewsList;
