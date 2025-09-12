import React from 'react';
import './Loading.css';

interface LoadingProps {
    size?: 'small' | 'medium' | 'large';
    text?: string;
    overlay?: boolean;
}

const Loading: React.FC<LoadingProps> = ({
    size = 'medium',
    text = 'Đang tải...',
    overlay = false
}) => {
    const sizeClass = `loading-${size}`;

    if (overlay) {
        return (
            <div className="loading-overlay">
                <div className={`loading-spinner ${sizeClass}`}>
                    <div className="spinner"></div>
                </div>
                {text && <p className="loading-text">{text}</p>}
            </div>
        );
    }

    return (
        <div className="loading-container">
            <div className={`loading-spinner ${sizeClass}`}>
                <div className="spinner"></div>
            </div>
            {text && <p className="loading-text">{text}</p>}
        </div>
    );
};

export default Loading;
