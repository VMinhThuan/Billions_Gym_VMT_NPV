import React, { useState } from 'react';
import { Star, MessageCircle, Calendar, X, Clock } from 'lucide-react';
import ptService from '../../services/pt.service';

const PTReviewsList = ({ reviews, loading }) => {
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [studentReviews, setStudentReviews] = useState([]);
    const [studentInfo, setStudentInfo] = useState(null);
    const [loadingStudentReviews, setLoadingStudentReviews] = useState(false);

    const handleStudentClick = async (hoiVienId) => {
        if (!hoiVienId) return;

        setSelectedStudent(hoiVienId);
        setLoadingStudentReviews(true);

        try {
            const response = await ptService.getStudentReviews(hoiVienId);
            if (response.success && response.data) {
                setStudentReviews(response.data.reviews || []);
                setStudentInfo(response.data.studentInfo || null);
            }
        } catch (error) {
            console.error('Error loading student reviews:', error);
            setStudentReviews([]);
            setStudentInfo(null);
        } finally {
            setLoadingStudentReviews(false);
        }
    };

    const closeStudentModal = () => {
        setSelectedStudent(null);
        setStudentReviews([]);
        setStudentInfo(null);
    };
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
                                    <p
                                        className="text-white font-medium cursor-pointer hover:text-[#da2128] transition-colors"
                                        onClick={() => handleStudentClick(review.hoiVienId?._id)}
                                    >
                                        {review.hoiVienId?.hoTen || 'Học viên'}
                                    </p>
                                    <div className="flex items-center gap-1">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`w-4 h-4 ${i < (review.rating || 0)
                                                    ? 'fill-yellow-500 text-yellow-500'
                                                    : 'text-gray-600'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                    {review.buoiTap && (
                                        <p className="text-gray-400 text-xs mt-1">
                                            {review.buoiTap.tenBuoiTap}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1 text-gray-500 text-xs">
                                <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    <span>
                                        {new Date(review.createdAt || review.ngayTao || new Date()).toLocaleDateString('vi-VN')}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    <span>
                                        {new Date(review.createdAt || review.ngayTao || new Date()).toLocaleTimeString('vi-VN', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                </div>
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

            {/* Modal hiển thị danh sách đánh giá của hội viên */}
            {selectedStudent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75" onClick={closeStudentModal}>
                    <div
                        className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="sticky top-0 bg-[#1a1a1a] border-b border-[#2a2a2a] p-6 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-white">Lịch sử đánh giá</h3>
                                {studentInfo && (
                                    <div className="flex items-center gap-2 mt-2">
                                        {studentInfo.anhDaiDien ? (
                                            <img
                                                src={studentInfo.anhDaiDien}
                                                alt={studentInfo.hoTen}
                                                className="w-8 h-8 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-[#2a2a2a] flex items-center justify-center">
                                                <span className="text-white text-sm font-semibold">
                                                    {studentInfo.hoTen?.charAt(0) || 'U'}
                                                </span>
                                            </div>
                                        )}
                                        <p className="text-gray-400">
                                            {studentInfo.hoTen}
                                        </p>
                                        {studentReviews.length > 0 && (
                                            <span className="text-gray-500 text-sm">
                                                ({studentReviews.length} đánh giá)
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={closeStudentModal}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6">
                            {loadingStudentReviews ? (
                                <div className="flex items-center justify-center h-32">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#da2128]"></div>
                                </div>
                            ) : studentReviews.length === 0 ? (
                                <div className="text-center text-gray-500 py-8">
                                    Hội viên này chưa có đánh giá nào
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {studentReviews.map((review, index) => (
                                        <div
                                            key={review._id || index}
                                            className="bg-[#0a0a0a] rounded-lg p-4 border border-[#2a2a2a]"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1">
                                                    {review.buoiTap && (
                                                        <p className="text-white font-medium mb-1">
                                                            {review.buoiTap.tenBuoiTap}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center gap-1 mb-2">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star
                                                                key={i}
                                                                className={`w-4 h-4 ${i < (review.rating || 0)
                                                                    ? 'fill-yellow-500 text-yellow-500'
                                                                    : 'text-gray-600'
                                                                    }`}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-1 text-gray-500 text-xs ml-4">
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        <span>
                                                            {new Date(review.createdAt || review.ngayTao || new Date()).toLocaleDateString('vi-VN')}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        <span>
                                                            {new Date(review.createdAt || review.ngayTao || new Date()).toLocaleTimeString('vi-VN', {
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </span>
                                                    </div>
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
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PTReviewsList;
