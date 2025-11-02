import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import './Reviews.css';

const Reviews = ({ packageId, user, onNavigateToLogin }) => {
    // Mock data for testing
    const mockReviews = [
        {
            _id: '1',
            rating: 5,
            comment: 'Gói tập này thực sự tuyệt vời! Phòng gym rất hiện đại, trang thiết bị đầy đủ. Huấn luyện viên rất chuyên nghiệp và nhiệt tình. Tôi đã đạt được mục tiêu giảm cân trong 3 tháng đầu tiên.',
            hinhAnh: [
                'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=200&fit=crop',
                'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=300&h=200&fit=crop'
            ],
            ngayTao: '2024-01-15T10:30:00Z',
            hoiVienId: {
                hoTen: 'Nguyễn Minh Anh',
                anhDaiDien: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face'
            }
        },
        {
            _id: '2',
            rating: 4,
            comment: 'Dịch vụ tốt, giá cả hợp lý. Phòng gym sạch sẽ, không gian thoáng mát. Chỉ có một chút ồn ào vào giờ cao điểm, nhưng nhìn chung rất hài lòng.',
            hinhAnh: [
                'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=300&h=200&fit=crop'
            ],
            ngayTao: '2024-01-10T14:20:00Z',
            hoiVienId: {
                hoTen: 'Trần Văn Đức',
                anhDaiDien: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face'
            }
        },
        {
            _id: '3',
            rating: 5,
            comment: 'Tuyệt vời! Tôi đã thử nhiều phòng gym nhưng Billions là tốt nhất. Huấn luyện viên tư vấn rất chi tiết, chương trình tập phù hợp với từng cá nhân.',
            hinhAnh: [],
            ngayTao: '2024-01-08T09:15:00Z',
            hoiVienId: {
                hoTen: 'Lê Thị Hương',
                anhDaiDien: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face'
            }
        },
        {
            _id: '4',
            rating: 4,
            comment: 'Phòng gym có đầy đủ thiết bị hiện đại. Nhân viên thân thiện, sẵn sàng hỗ trợ. Giá hơi cao một chút nhưng chất lượng tương xứng.',
            hinhAnh: [
                'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300&h=200&fit=crop'
            ],
            ngayTao: '2024-01-05T16:45:00Z',
            hoiVienId: {
                hoTen: 'Phạm Quang Minh',
                anhDaiDien: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'
            }
        },
        {
            _id: '5',
            rating: 5,
            comment: 'Tôi đã tập ở đây được 6 tháng và rất hài lòng. Cơ sở vật chất tốt, không gian rộng rãi. Đặc biệt là hệ thống đặt lịch rất tiện lợi.',
            hinhAnh: [
                'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=200&fit=crop',
                'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=300&h=200&fit=crop',
                'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=300&h=200&fit=crop'
            ],
            ngayTao: '2024-01-03T11:30:00Z',
            hoiVienId: {
                hoTen: 'Võ Thị Lan',
                anhDaiDien: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face'
            }
        }
    ];

    const mockStats = {
        averageRating: 4.6,
        totalCount: 127,
        distribution: [
            { rating: 5, count: 89 },
            { rating: 4, count: 28 },
            { rating: 3, count: 8 },
            { rating: 2, count: 2 },
            { rating: 1, count: 0 }
        ]
    };

    const [reviews, setReviews] = useState([]);
    const [stats, setStats] = useState({
        averageRating: 0,
        totalCount: 0,
        distribution: []
    });
    const [loading, setLoading] = useState(true);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [newReview, setNewReview] = useState({
        rating: 5,
        comment: '',
        hinhAnh: []
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasNext, setHasNext] = useState(false);
    const [hasPrev, setHasPrev] = useState(false);

    // Fetch reviews (using mock data for testing)
    const fetchReviews = async (page = 1) => {
        try {
            setLoading(true);

            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 500));

            // Use mock data
            const startIndex = (page - 1) * 5;
            const endIndex = startIndex + 5;
            const newReviews = mockReviews.slice(startIndex, endIndex);

            if (page === 1) {
                setReviews(newReviews);
                setStats(mockStats);
            } else {
                setReviews(prev => [...prev, ...newReviews]);
            }

            setCurrentPage(page);
            setHasNext(endIndex < mockReviews.length);
            setHasPrev(page > 1);

            // Uncomment below to use real API
            /*
            const response = await api.get(`/goitap/${packageId}/reviews?page=${page}&limit=5`);
            
            if (response.data.success) {
                const { reviews: newReviews, stats: newStats, pagination } = response.data.data;
                
                if (page === 1) {
                    setReviews(newReviews);
                } else {
                    setReviews(prev => [...prev, ...newReviews]);
                }
                
                setStats(newStats);
                setCurrentPage(pagination.currentPage);
                setHasNext(pagination.hasNext);
                setHasPrev(pagination.hasPrev);
            }
            */
        } catch (error) {
            console.error('Error fetching reviews:', error);
            setError('Không thể tải đánh giá');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (packageId) {
            fetchReviews(1);
        }
    }, [packageId]);

    // Handle review submission
    const handleSubmitReview = async (e) => {
        e.preventDefault();

        if (!user) {
            onNavigateToLogin();
            return;
        }

        if (!newReview.comment.trim()) {
            setError('Vui lòng nhập nội dung đánh giá');
            return;
        }

        try {
            setSubmitting(true);
            setError(null);

            const response = await api.post(`/goitap/${packageId}/review`, {
                rating: newReview.rating,
                comment: newReview.comment,
                hinhAnh: newReview.hinhAnh
            });

            if (response.data.success) {
                setShowReviewForm(false);
                setNewReview({ rating: 5, comment: '', hinhAnh: [] });
                fetchReviews(1); // Refresh reviews
            }
        } catch (error) {
            console.error('Error submitting review:', error);
            setError(error.response?.data?.message || 'Có lỗi xảy ra khi gửi đánh giá');
        } finally {
            setSubmitting(false);
        }
    };

    // Handle image upload
    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);

        if (files.length > 3) {
            setError('Chỉ được tải lên tối đa 3 hình ảnh');
            return;
        }

        const imagePromises = files.map(file => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        });

        Promise.all(imagePromises)
            .then(base64Images => {
                setNewReview(prev => ({
                    ...prev,
                    hinhAnh: [...prev.hinhAnh, ...base64Images]
                }));
            })
            .catch(error => {
                console.error('Error processing images:', error);
                setError('Có lỗi khi xử lý hình ảnh');
            });
    };

    // Remove image
    const removeImage = (index) => {
        setNewReview(prev => ({
            ...prev,
            hinhAnh: prev.hinhAnh.filter((_, i) => i !== index)
        }));
    };

    // Render star rating
    const renderStars = (rating, interactive = false, onRatingChange = null) => {
        return (
            <div className="star-rating">
                {[1, 2, 3, 4, 5].map(star => (
                    <button
                        key={star}
                        type={interactive ? "button" : undefined}
                        className={`star ${star <= rating ? 'filled' : ''}`}
                        onClick={interactive ? () => onRatingChange(star) : undefined}
                        disabled={!interactive}
                    >
                        ★
                    </button>
                ))}
            </div>
        );
    };

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading && reviews.length === 0) {
        return (
            <div className="reviews-section">
                <div className="loading-reviews">
                    <div className="spinner"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="reviews-section">
            <div className="reviews-header">
                <h3>Đánh giá từ hội viên</h3>

                {/* Rating Summary */}
                <div className="rating-summary">
                    <div className="average-rating">
                        <span className="rating-number">{stats.averageRating}</span>
                        <div className="stars-large">
                            {renderStars(Math.round(stats.averageRating))}
                        </div>
                        <span className="total-reviews">({stats.totalCount} đánh giá)</span>
                    </div>

                    {/* Rating Distribution */}
                    <div className="rating-distribution">
                        {stats.distribution.map(item => (
                            <div key={item.rating} className="rating-bar">
                                <span className="rating-label">{item.rating}★</span>
                                <div className="bar-container">
                                    <div
                                        className="bar-fill"
                                        style={{
                                            width: `${stats.totalCount > 0 ? (item.count / stats.totalCount) * 100 : 0}%`
                                        }}
                                    ></div>
                                </div>
                                <span className="rating-count">{item.count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Write Review Button */}
                {user ? (
                    <button
                        className="write-review-btn"
                        onClick={() => setShowReviewForm(!showReviewForm)}
                    >
                        {showReviewForm ? 'Hủy viết đánh giá' : 'Viết đánh giá'}
                    </button>
                ) : (
                    <button
                        className="write-review-btn"
                        onClick={onNavigateToLogin}
                    >
                        Đăng nhập để viết đánh giá
                    </button>
                )}
            </div>

            {/* Review Form */}
            {showReviewForm && (
                <div className="review-form">
                    <form onSubmit={handleSubmitReview}>
                        <div className="form-group">
                            <label>Đánh giá của bạn:</label>
                            <div className="rating-input">
                                {renderStars(newReview.rating, true, (rating) =>
                                    setNewReview(prev => ({ ...prev, rating }))
                                )}
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Nhận xét:</label>
                            <textarea
                                value={newReview.comment}
                                onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                                placeholder="Chia sẻ trải nghiệm của bạn với gói tập này..."
                                rows="4"
                                maxLength="1000"
                            />
                            <div className="char-count">
                                {newReview.comment.length}/1000
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Hình ảnh (tối đa 3 ảnh):</label>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImageUpload}
                                disabled={newReview.hinhAnh.length >= 3}
                            />

                            {newReview.hinhAnh.length > 0 && (
                                <div className="image-preview">
                                    {newReview.hinhAnh.map((image, index) => (
                                        <div key={index} className="preview-item">
                                            <img src={image} alt={`Preview ${index + 1}`} />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(index)}
                                                className="remove-image"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {error && <div className="error-message">{error}</div>}

                        <div className="form-actions">
                            <button
                                type="button"
                                onClick={() => setShowReviewForm(false)}
                                disabled={submitting}
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                disabled={submitting || !newReview.comment.trim()}
                            >
                                {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Reviews List */}
            <div className="reviews-list">
                {reviews.length === 0 ? (
                    <div className="no-reviews">
                        <p>Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá!</p>
                    </div>
                ) : (
                    reviews.map((review) => (
                        <div key={review._id} className="review-item">
                            <div className="review-header">
                                <div className="reviewer-info">
                                    <div className="reviewer-avatar">
                                        {review.hoiVienId?.anhDaiDien ? (
                                            <img
                                                src={review.hoiVienId.anhDaiDien}
                                                alt={review.hoiVienId.hoTen}
                                            />
                                        ) : (
                                            <div className="avatar-placeholder">
                                                {review.hoiVienId?.hoTen?.charAt(0) || 'U'}
                                            </div>
                                        )}
                                    </div>
                                    <div className="reviewer-details">
                                        <h4>{review.hoiVienId?.hoTen || 'Người dùng'}</h4>
                                        <div className="review-meta">
                                            {renderStars(review.rating)}
                                            <span className="review-date">{formatDate(review.ngayTao)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="review-content">
                                <p>{review.comment}</p>

                                {review.hinhAnh && review.hinhAnh.length > 0 && (
                                    <div className="review-images">
                                        {review.hinhAnh.map((image, index) => (
                                            <img
                                                key={index}
                                                src={image}
                                                alt={`Review image ${index + 1}`}
                                                className="review-image"
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Load More Button */}
            {hasNext && (
                <div className="load-more-section">
                    <button
                        className="load-more-btn"
                        onClick={() => fetchReviews(currentPage + 1)}
                        disabled={loading}
                    >
                        {loading ? 'Đang tải...' : 'Xem thêm đánh giá'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default Reviews;
