import React, { useState, useEffect } from 'react';
import { X, Star, Building2, User } from 'lucide-react';
import { sessionReviewAPI } from '../../services/api';

const ReviewModal = ({ isOpen, onClose, checkInRecordId, buoiTap, onReviewComplete }) => {
    const [ptRating, setPtRating] = useState(0);
    const [ptComment, setPtComment] = useState('');
    const [branchRating, setBranchRating] = useState(0);
    const [branchComment, setBranchComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [existingReview, setExistingReview] = useState(null);

    // Reset tất cả state về giá trị ban đầu mỗi khi modal mở
    useEffect(() => {
        if (isOpen) {
            // Reset tất cả về trạng thái ban đầu
            setPtRating(0);
            setPtComment('');
            setBranchRating(0);
            setBranchComment('');
            setExistingReview(null);
            setLoading(false);
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate: ít nhất một trong hai đánh giá phải được điền
        if (ptRating === 0 && branchRating === 0) {
            alert('Vui lòng đánh giá ít nhất một trong hai: PT hoặc Chi nhánh');
            return;
        }

        setLoading(true);
        try {
            const result = await sessionReviewAPI.createOrUpdateReview(
                checkInRecordId,
                ptRating > 0 ? ptRating : null,
                ptComment,
                branchRating > 0 ? branchRating : null,
                branchComment
            );

            if (result.success) {
                if (onReviewComplete) {
                    onReviewComplete(result.data);
                }
                onClose();
            } else {
                alert(result.message || 'Có lỗi xảy ra khi lưu đánh giá');
            }
        } catch (error) {
            console.error('Error submitting review:', error);
            alert(error.message || 'Có lỗi xảy ra khi lưu đánh giá');
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = () => {
        onClose();
    };

    const renderStarRating = (rating, setRating, label) => {
        return (
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-3">{label}</label>
                <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className={`transition-all transform hover:scale-110 ${star <= rating ? 'text-yellow-400' : 'text-gray-500'
                                }`}
                        >
                            <Star
                                size={32}
                                fill={star <= rating ? 'currentColor' : 'none'}
                                className="cursor-pointer"
                            />
                        </button>
                    ))}
                    {rating > 0 && (
                        <span className="ml-2 text-sm text-gray-400">
                            {rating === 1 && 'Rất không hài lòng'}
                            {rating === 2 && 'Không hài lòng'}
                            {rating === 3 && 'Bình thường'}
                            {rating === 4 && 'Hài lòng'}
                            {rating === 5 && 'Rất hài lòng'}
                        </span>
                    )}
                </div>
            </div>
        );
    };

    if (!isOpen) return null;

    // Hàm format ngày
    const formatDate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
        const dayName = days[d.getDay()];
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${dayName}, ${day}/${month}/${year}`;
    };

    // Lấy thông tin PT và chi nhánh - xử lý cả trường hợp object và string ID
    const getPtName = () => {
        if (!buoiTap) {
            console.log('[ReviewModal] No buoiTap data:', buoiTap);
            return 'Chưa có thông tin';
        }

        const pt = buoiTap.ptPhuTrach;
        console.log('[ReviewModal] Full buoiTap:', JSON.stringify(buoiTap, null, 2));
        console.log('[ReviewModal] PT data:', pt, 'Type:', typeof pt, 'IsArray:', Array.isArray(pt));

        if (!pt) {
            console.log('[ReviewModal] No PT data');
            return 'Chưa có thông tin';
        }

        // Nếu là object (đã populate) và có hoTen
        if (typeof pt === 'object' && pt !== null && !Array.isArray(pt)) {
            // Kiểm tra hoTen trước (có thể là pt.hoTen hoặc pt.ptPhuTrach?.hoTen)
            const hoTen = pt.hoTen || (pt.ptPhuTrach && pt.ptPhuTrach.hoTen);
            if (hoTen && String(hoTen).trim() !== '') {
                console.log('[ReviewModal] Found PT name:', hoTen);
                return String(hoTen).trim();
            }
            // Kiểm tra xem có phải là ObjectId không (có _id nhưng không có hoTen)
            if (pt._id) {
                const ptId = typeof pt._id === 'string' ? pt._id : (pt._id.toString ? pt._id.toString() : '');
                if (ptId.length === 24 && /^[0-9a-fA-F]{24}$/.test(ptId)) {
                    console.log('[ReviewModal] PT is ObjectId, not populated:', ptId);
                    return 'Đang tải thông tin PT...';
                }
            }
        }

        // Nếu là string ID (chưa populate) - kiểm tra xem có phải ObjectId không
        if (typeof pt === 'string') {
            // ObjectId thường có 24 ký tự hex
            if (pt.length === 24 && /^[0-9a-fA-F]{24}$/.test(pt)) {
                console.log('[ReviewModal] PT is ObjectId string:', pt);
                return 'Đang tải thông tin PT...';
            }
            // Nếu không phải ObjectId, có thể là tên (fallback)
            return pt;
        }

        console.log('[ReviewModal] PT data format not recognized');
        return 'Chưa có thông tin';
    };

    const getBranchName = () => {
        if (!buoiTap) {
            console.log('[ReviewModal] No buoiTap data');
            return 'Chưa có thông tin';
        }

        const branch = buoiTap.chiNhanh;
        console.log('[ReviewModal] Branch data:', branch, 'Type:', typeof branch, 'IsArray:', Array.isArray(branch));

        if (!branch) {
            console.log('[ReviewModal] No branch data');
            return 'Chưa có thông tin';
        }

        // Nếu là object (đã populate) và có tenChiNhanh
        if (typeof branch === 'object' && branch !== null && !Array.isArray(branch)) {
            // Kiểm tra tenChiNhanh trước
            const tenChiNhanh = branch.tenChiNhanh || (branch.chiNhanh && branch.chiNhanh.tenChiNhanh);
            if (tenChiNhanh && String(tenChiNhanh).trim() !== '') {
                console.log('[ReviewModal] Found branch name:', tenChiNhanh);
                return String(tenChiNhanh).trim();
            }
            // Kiểm tra xem có phải là ObjectId không
            if (branch._id) {
                const branchId = typeof branch._id === 'string' ? branch._id : (branch._id.toString ? branch._id.toString() : '');
                if (branchId.length === 24 && /^[0-9a-fA-F]{24}$/.test(branchId)) {
                    console.log('[ReviewModal] Branch is ObjectId, not populated:', branchId);
                    return 'Đang tải thông tin chi nhánh...';
                }
            }
        }

        // Nếu là string ID (chưa populate) - kiểm tra xem có phải ObjectId không
        if (typeof branch === 'string') {
            // ObjectId thường có 24 ký tự hex
            if (branch.length === 24 && /^[0-9a-fA-F]{24}$/.test(branch)) {
                console.log('[ReviewModal] Branch is ObjectId string:', branch);
                return 'Đang tải thông tin chi nhánh...';
            }
            // Nếu không phải ObjectId, có thể là tên (fallback)
            return branch;
        }

        console.log('[ReviewModal] Branch data format not recognized');
        return 'Chưa có thông tin';
    };

    const ptName = getPtName();
    const branchName = getBranchName();
    const ngayTapFormatted = buoiTap?.ngayTap ? formatDate(buoiTap.ngayTap) : '';

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-75 p-4" style={{ paddingTop: '80px' }}>
            <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] w-full max-w-2xl mx-4 max-h-[85vh] overflow-y-auto">
                <div className="sticky top-0 bg-[#1a1a1a] border-b border-[#2a2a2a] p-6 flex items-center justify-between z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Cảm ơn bạn đã tham gia buổi tập!</h2>
                        <p className="text-gray-400 mt-1">Hãy chia sẻ trải nghiệm của bạn</p>
                    </div>
                    <button
                        onClick={handleSkip}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    {buoiTap && (
                        <div className="mb-6 p-4 bg-[#141414] rounded-lg border border-[#2a2a2a]">
                            <h3 className="text-lg font-semibold text-white mb-3">{buoiTap.tenBuoiTap}</h3>
                            <div className="space-y-2">
                                {ngayTapFormatted && (
                                    <p className="text-sm text-white font-medium">
                                        <span className="text-gray-400">Ngày tập:</span> <span className="text-white">{ngayTapFormatted}</span>
                                    </p>
                                )}
                                <p className="text-sm text-gray-400">
                                    <span className="text-gray-500">Thời gian:</span> {buoiTap.gioBatDau} - {buoiTap.gioKetThuc}
                                </p>
                                <div className="flex items-center gap-2 pt-2 border-t border-[#2a2a2a]">
                                    <User className="text-[#da2128]" size={16} />
                                    <p className="text-sm text-white font-medium">
                                        <span className="text-gray-400">PT phụ trách:</span> <span className="text-white">{ptName}</span>
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Building2 className="text-[#da2128]" size={16} />
                                    <p className="text-sm text-white font-medium">
                                        <span className="text-gray-400">Chi nhánh:</span> <span className="text-white">{branchName}</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Đánh giá PT */}
                    <div className="mb-6 p-4 bg-[#141414] rounded-lg border border-[#2a2a2a]">
                        <div className="flex items-center gap-2 mb-4">
                            <User className="text-[#da2128]" size={20} />
                            <div>
                                <h3 className="text-lg font-semibold text-white">Đánh giá PT</h3>
                                <p className="text-sm text-gray-400 mt-0.5">PT: <span className="text-white font-medium">{ptName}</span></p>
                            </div>
                        </div>
                        {renderStarRating(ptRating, setPtRating, 'Bạn đánh giá PT như thế nào?')}
                        <textarea
                            value={ptComment}
                            onChange={(e) => setPtComment(e.target.value)}
                            placeholder="Chia sẻ thêm về trải nghiệm với PT (tùy chọn)..."
                            className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#da2128] resize-none"
                            rows="3"
                            maxLength={1000}
                        />
                        <p className="text-xs text-gray-500 mt-1">{ptComment.length}/1000 ký tự</p>
                    </div>

                    {/* Đánh giá Chi nhánh */}
                    <div className="mb-6 p-4 bg-[#141414] rounded-lg border border-[#2a2a2a]">
                        <div className="flex items-center gap-2 mb-4">
                            <Building2 className="text-[#da2128]" size={20} />
                            <div>
                                <h3 className="text-lg font-semibold text-white">Đánh giá Cơ sở vật chất</h3>
                                <p className="text-sm text-gray-400 mt-0.5">Chi nhánh: <span className="text-white font-medium">{branchName}</span></p>
                            </div>
                        </div>
                        {renderStarRating(branchRating, setBranchRating, 'Bạn đánh giá cơ sở vật chất của chi nhánh như thế nào?')}
                        <textarea
                            value={branchComment}
                            onChange={(e) => setBranchComment(e.target.value)}
                            placeholder="Chia sẻ thêm về cơ sở vật chất (tùy chọn)..."
                            className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#da2128] resize-none"
                            rows="3"
                            maxLength={1000}
                        />
                        <p className="text-xs text-gray-500 mt-1">{branchComment.length}/1000 ký tự</p>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={handleSkip}
                            className="flex-1 px-6 py-3 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white rounded-lg font-medium transition-colors"
                        >
                            Bỏ qua
                        </button>
                        <button
                            type="submit"
                            disabled={loading || (ptRating === 0 && branchRating === 0)}
                            className="flex-1 px-6 py-3 bg-[#da2128] hover:bg-[#b71c24] disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                        >
                            {loading ? 'Đang lưu...' : 'Gửi đánh giá'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReviewModal;

