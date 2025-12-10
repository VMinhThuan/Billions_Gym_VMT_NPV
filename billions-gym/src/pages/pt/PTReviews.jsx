import React, { useState, useEffect } from 'react';
import {
    Star,
    StarHalf,
    MessageSquare,
    ThumbsUp,
    TrendingUp,
    Users,
    Calendar,
    Filter,
    Search,
    ChevronDown,
    Image as ImageIcon
} from 'lucide-react';
import PTSidebar from '../../components/pt/PTSidebar';
import Header from '../../components/layout/Header';
import { api } from '../../services/api';

const PTReviews = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        try {
            return localStorage.getItem('sidebarCollapsed') === 'true';
        } catch (e) {
            return false;
        }
    });

    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState(null);
    const [selectedRating, setSelectedRating] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [showRatingDropdown, setShowRatingDropdown] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState(null);

    // Mock data for development
    const mockData = {
        reviews: [
            {
                _id: '1',
                hoiVienId: {
                    _id: 'hv1',
                    hoTen: 'Nguyễn Văn An',
                    anhDaiDien: 'https://i.pravatar.cc/150?img=1'
                },
                goiTapId: {
                    _id: 'gt1',
                    tenGoiTap: 'Gói tập Premium 3 tháng'
                },
                rating: 5,
                comment: 'Huấn luyện viên rất nhiệt tình và tận tâm. Các bài tập được thiết kế phù hợp với thể trạng của tôi. Sau 2 tháng tập đã thấy hiệu quả rõ rệt. Rất đáng để đầu tư!',
                hinhAnh: ['https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400'],
                ngayTao: '2024-12-01T10:30:00Z'
            },
            {
                _id: '2',
                hoiVienId: {
                    _id: 'hv2',
                    hoTen: 'Trần Thị Bình',
                    anhDaiDien: 'https://i.pravatar.cc/150?img=5'
                },
                goiTapId: {
                    _id: 'gt2',
                    tenGoiTap: 'Gói tập VIP 6 tháng'
                },
                rating: 5,
                comment: 'PT rất chuyên nghiệp, luôn theo sát và chỉnh sửa động tác giúp tôi. Chế độ dinh dưỡng hợp lý. Tôi đã giảm được 8kg trong 3 tháng!',
                hinhAnh: [],
                ngayTao: '2024-11-28T14:20:00Z'
            },
            {
                _id: '3',
                hoiVienId: {
                    _id: 'hv3',
                    hoTen: 'Lê Minh Châu',
                    anhDaiDien: 'https://i.pravatar.cc/150?img=8'
                },
                goiTapId: {
                    _id: 'gt1',
                    tenGoiTap: 'Gói tập Premium 3 tháng'
                },
                rating: 4,
                comment: 'PT dạy rất kỹ và nhiệt tình. Thiết bị phòng gym hiện đại. Tuy nhiên có lúc phòng tập hơi đông nên phải đợi máy.',
                hinhAnh: ['https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400', 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400'],
                ngayTao: '2024-11-25T09:15:00Z'
            },
            {
                _id: '4',
                hoiVienId: {
                    _id: 'hv4',
                    hoTen: 'Phạm Hoàng Dũng',
                    anhDaiDien: 'https://i.pravatar.cc/150?img=3'
                },
                goiTapId: {
                    _id: 'gt3',
                    tenGoiTap: 'Gói tập Standard 1 tháng'
                },
                rating: 5,
                comment: 'Tôi rất hài lòng với dịch vụ. PT luôn động viên và tạo động lực cho tôi. Giờ tập linh hoạt, phù hợp với lịch làm việc.',
                hinhAnh: [],
                ngayTao: '2024-11-20T16:45:00Z'
            },
            {
                _id: '5',
                hoiVienId: {
                    _id: 'hv5',
                    hoTen: 'Võ Thị Eâu',
                    anhDaiDien: 'https://i.pravatar.cc/150?img=9'
                },
                goiTapId: {
                    _id: 'gt2',
                    tenGoiTap: 'Gói tập VIP 6 tháng'
                },
                rating: 4,
                comment: 'Chất lượng dịch vụ tốt, PT am hiểu và có kinh nghiệm. Môi trường tập sạch sẽ. Mình sẽ tiếp tục gia hạn gói tập.',
                hinhAnh: ['https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400'],
                ngayTao: '2024-11-18T11:00:00Z'
            },
            {
                _id: '6',
                hoiVienId: {
                    _id: 'hv6',
                    hoTen: 'Đặng Quốc Phú',
                    anhDaiDien: 'https://i.pravatar.cc/150?img=12'
                },
                goiTapId: {
                    _id: 'gt1',
                    tenGoiTap: 'Gói tập Premium 3 tháng'
                },
                rating: 5,
                comment: 'Đây là phòng gym tốt nhất mà tôi từng tập. PT rất tâm huyết, các buổi tập không bao giờ nhàm chán. Kết quả vượt mong đợi!',
                hinhAnh: [],
                ngayTao: '2024-11-15T08:30:00Z'
            },
            {
                _id: '7',
                hoiVienId: {
                    _id: 'hv7',
                    hoTen: 'Bùi Thị Giang',
                    anhDaiDien: 'https://i.pravatar.cc/150?img=10'
                },
                goiTapId: {
                    _id: 'gt3',
                    tenGoiTap: 'Gói tập Standard 1 tháng'
                },
                rating: 3,
                comment: 'Dịch vụ ổn, PT dạy khá tốt. Tuy nhiên giá hơi cao so với mặt bằng chung. Nếu có chương trình khuyến mãi sẽ tốt hơn.',
                hinhAnh: [],
                ngayTao: '2024-11-10T13:20:00Z'
            }
        ],
        summary: {
            avgRating: 4.6,
            totalReviews: 7,
            ratingDistribution: {
                5: 4,
                4: 2,
                3: 1,
                2: 0,
                1: 0
            }
        },
        pagination: {
            page: 1,
            limit: 20,
            total: 7,
            pages: 1
        }
    };

    useEffect(() => {
        loadReviews();
    }, [selectedRating, currentPage]);

    const handleToggleSidebar = () => {
        const newCollapsedState = !sidebarCollapsed;
        setSidebarCollapsed(newCollapsedState);
        try {
            localStorage.setItem('sidebarCollapsed', newCollapsedState);
        } catch (e) {
            console.error("Failed to save sidebar state to localStorage", e);
        }
    };

    const loadReviews = async () => {
        try {
            setLoading(true);
            // Uncomment when API is ready
            // const params = {
            //     page: currentPage,
            //     limit: 20
            // };
            // if (selectedRating) {
            //     params.rating = selectedRating;
            // }
            // const response = await api.get('/pt/reviews', { params });
            // if (response.data.success) {
            //     setReviews(response.data.data.reviews);
            //     setSummary(response.data.data.summary);
            //     setPagination(response.data.data.pagination);
            // }

            // Using mock data for now
            await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
            setReviews(mockData.reviews);
            setSummary(mockData.summary);
            setPagination(mockData.pagination);
        } catch (error) {
            console.error('Error loading reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderStars = (rating) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                stars.push(<Star key={i} size={16} className="fill-yellow-400 text-yellow-400" />);
            } else if (i - 0.5 === rating) {
                stars.push(<StarHalf key={i} size={16} className="fill-yellow-400 text-yellow-400" />);
            } else {
                stars.push(<Star key={i} size={16} className="text-gray-600" />);
            }
        }
        return stars;
    };

    const getRatingPercentage = (rating) => {
        if (!summary || summary.totalReviews === 0) return 0;
        return Math.round((summary.ratingDistribution[rating] / summary.totalReviews) * 100);
    };

    const filteredReviews = reviews.filter(review => {
        const matchesSearch = review.hoiVienId?.hoTen?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            review.comment?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            review.goiTapId?.tenGoiTap?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Hôm nay';
        if (diffDays === 1) return 'Hôm qua';
        if (diffDays < 7) return `${diffDays} ngày trước`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} tháng trước`;
        return date.toLocaleDateString('vi-VN');
    };

    return (
        <div className="h-screen bg-[#0a0a0a] overflow-hidden flex flex-col">
            <Header />
            <PTSidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                collapsed={sidebarCollapsed}
                onToggle={handleToggleSidebar}
            />

            <main className={`ml-0 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-80'} transition-all duration-300 flex-1 flex flex-col overflow-hidden pt-16 sm:pt-20`}>
                <div className="px-4 sm:px-6 py-4">
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">Đánh giá từ học viên</h2>
                    <p className="text-gray-400 mt-1">Xem và quản lý đánh giá từ học viên của bạn</p>
                </div>

                <div className="flex-1 px-4 sm:px-6 pb-4 sm:pb-6 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#da2128]"></div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* Average Rating Card */}
                                <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl p-6">
                                    <div className="flex items-center justify-between mb-3">
                                        <Star className="w-8 h-8 text-yellow-400 fill-yellow-400" />
                                        <TrendingUp className="w-5 h-5 text-yellow-400" />
                                    </div>
                                    <div className="text-4xl font-bold text-white mb-1">
                                        {summary?.avgRating || 0}
                                    </div>
                                    <div className="flex items-center gap-1 mb-2">
                                        {renderStars(Math.round(summary?.avgRating || 0))}
                                    </div>
                                    <div className="text-sm text-white">Đánh giá trung bình</div>
                                </div>

                                {/* Total Reviews Card */}
                                <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl p-6">
                                    <div className="flex items-center justify-between mb-3">
                                        <MessageSquare className="w-8 h-8 text-blue-400" />
                                    </div>
                                    <div className="text-4xl font-bold text-white mb-1">
                                        {summary?.totalReviews || 0}
                                    </div>
                                    <div className="text-sm text-white">Tổng đánh giá</div>
                                </div>

                                {/* 5 Star Reviews Card */}
                                <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-6">
                                    <div className="flex items-center justify-between mb-3">
                                        <ThumbsUp className="w-8 h-8 text-green-400" />
                                    </div>
                                    <div className="text-4xl font-bold text-white mb-1">
                                        {summary?.ratingDistribution?.[5] || 0}
                                    </div>
                                    <div className="text-sm text-white">Đánh giá 5 sao</div>
                                </div>

                                {/* Active Members Card */}
                                <div className="bg-gradient-to-br from-[#da2128]/20 to-red-500/20 rounded-xl p-6">
                                    <div className="flex items-center justify-between mb-3">
                                        <Users className="w-8 h-8 text-[#da2128]" />
                                    </div>
                                    <div className="text-4xl font-bold text-white mb-1">
                                        {summary?.totalReviews || 0}
                                    </div>
                                    <div className="text-sm text-white">Học viên đánh giá</div>
                                </div>
                            </div>

                            {/* Rating Distribution */}
                            <div className="bg-[#141414] rounded-xl p-6">
                                <h3 className="text-xl font-bold text-white mb-4">Phân bố đánh giá</h3>
                                <div className="space-y-3">
                                    {[5, 4, 3, 2, 1].map(rating => (
                                        <div key={rating} className="flex items-center gap-4">
                                            <div className="flex items-center gap-1 w-20">
                                                <span className="text-white font-medium">{rating}</span>
                                                <Star size={16} className="fill-yellow-400 text-yellow-400" />
                                            </div>
                                            <div className="flex-1 h-3 bg-[#2a2a2a] rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 transition-all duration-500"
                                                    style={{ width: `${getRatingPercentage(rating)}%` }}
                                                />
                                            </div>
                                            <div className="w-20 text-right">
                                                <span className="text-gray-400 text-sm">
                                                    {summary?.ratingDistribution?.[rating] || 0} ({getRatingPercentage(rating)}%)
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Filters */}
                            <div className="bg-[#141414] rounded-xl p-4">
                                <div className="flex flex-col sm:flex-row gap-3">
                                    {/* Search */}
                                    <div className="flex-1 relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Tìm kiếm theo tên học viên, nội dung đánh giá..."
                                            className="w-full pl-10 pr-4 py-2.5 bg-[#0a0a0a] text-white rounded-lg focus:outline-none"
                                        />
                                    </div>

                                    {/* Rating Filter */}
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowRatingDropdown(!showRatingDropdown)}
                                            className="px-4 py-2.5 bg-[#1a1a1a] text-white rounded-lg hover:bg-[#2a2a2a] transition-colors flex items-center gap-2 cursor-pointer min-w-[180px] justify-between"
                                        >
                                            <span className="text-sm">
                                                {selectedRating ? `${selectedRating} sao` : 'Tất cả đánh giá'}
                                            </span>
                                            <ChevronDown className="w-4 h-4" />
                                        </button>

                                        {showRatingDropdown && (
                                            <div className="absolute right-0 top-12 w-full bg-[#1a1a1a] rounded-lg shadow-xl z-10">
                                                <div className="p-2">
                                                    <button
                                                        onClick={() => { setSelectedRating(''); setShowRatingDropdown(false); }}
                                                        className={`w-full px-3 py-2 rounded-lg text-left text-sm transition-colors cursor-pointer ${selectedRating === '' ? 'bg-[#da2128] text-white' : 'text-gray-400 hover:bg-[#2a2a2a]'
                                                            }`}
                                                    >
                                                        Tất cả đánh giá
                                                    </button>
                                                    {[5, 4, 3, 2, 1].map(rating => (
                                                        <button
                                                            key={rating}
                                                            onClick={() => { setSelectedRating(rating); setShowRatingDropdown(false); }}
                                                            className={`w-full px-3 py-2 rounded-lg text-left text-sm transition-colors cursor-pointer flex items-center gap-2 ${selectedRating === rating ? 'bg-[#da2128] text-white' : 'text-gray-400 hover:bg-[#2a2a2a]'
                                                                }`}
                                                        >
                                                            <Star size={14} className="fill-yellow-400 text-yellow-400" />
                                                            {rating} sao
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Reviews List */}
                            <div className="space-y-4">
                                {filteredReviews.length > 0 ? (
                                    filteredReviews.map(review => (
                                        <div
                                            key={review._id}
                                            className="bg-[#141414] rounded-xl p-6 hover:bg-[#2a2a2a] transition-all cursor-pointer"
                                        >
                                            {/* Header */}
                                            <div className="flex items-start gap-4 mb-4">
                                                <img
                                                    src={review.hoiVienId?.anhDaiDien || 'https://i.pravatar.cc/150'}
                                                    alt={review.hoiVienId?.hoTen}
                                                    className="w-14 h-14 rounded-full object-cover"
                                                />
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <h4 className="text-white font-bold text-lg">
                                                            {review.hoiVienId?.hoTen || 'N/A'}
                                                        </h4>
                                                        <div className="flex items-center gap-1">
                                                            {renderStars(review.rating)}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-sm text-gray-400">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar size={14} />
                                                            {formatDate(review.ngayTao)}
                                                        </span>
                                                        <span>•</span>
                                                        <span className="text-[#da2128]">
                                                            {review.goiTapId?.tenGoiTap || 'N/A'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Comment */}
                                            <p className="text-white leading-relaxed mb-4">
                                                {review.comment}
                                            </p>

                                            {/* Images */}
                                            {review.hinhAnh && review.hinhAnh.length > 0 && (
                                                <div className="flex gap-2 flex-wrap">
                                                    {review.hinhAnh.map((img, idx) => (
                                                        <img
                                                            key={idx}
                                                            src={img}
                                                            alt={`Review image ${idx + 1}`}
                                                            className="w-32 h-32 object-cover rounded-lg hover:opacity-80 transition-all cursor-pointer"
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="bg-[#141414] rounded-xl p-12 text-center">
                                        <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                                        <h3 className="text-white text-lg font-semibold mb-2">
                                            Không tìm thấy đánh giá
                                        </h3>
                                        <p className="text-gray-400">
                                            {searchQuery ? 'Thử tìm kiếm với từ khóa khác' : 'Chưa có đánh giá nào từ học viên'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default PTReviews;
