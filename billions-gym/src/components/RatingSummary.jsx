import React from 'react';
import './RatingSummary.css';

const RatingSummary = ({ averageRating, totalReviews, onClick }) => {
    const renderStars = (rating) => {
        return (
            <div className="star-rating">
                {[1, 2, 3, 4, 5].map(star => (
                    <span
                        key={star}
                        className={`star ${star <= rating ? 'filled' : ''}`}
                    >
                        ★
                    </span>
                ))}
            </div>
        );
    };

    return (
        <div className="rating-summary-compact" onClick={onClick}>
            <div className="rating-stars">
                {renderStars(Math.round(averageRating))}
            </div>
            <div className="rating-info">
                <span className="rating-number">{averageRating.toFixed(1)}</span>
                <span className="review-count">({totalReviews} đánh giá)</span>
            </div>
            <div className="rating-arrow">→</div>
        </div>
    );
};

export default RatingSummary;
