import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CheckInButton.css';

const CheckInButton = ({ className = '', variant = 'primary' }) => {
    const navigate = useNavigate();
    const [isHovered, setIsHovered] = useState(false);

    const handleClick = () => {
        // Điều hướng đến trang check-in
        navigate('/checkin-out');
    };

    return (
        <button
            className={`checkin-button checkin-button-${variant} ${className}`}
            onClick={handleClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            title="Mở camera để check-in"
        >
            <span className="checkin-button-icon">📷</span>
            <span className="checkin-button-text">Check-in</span>
        </button>
    );
};

export default CheckInButton;

