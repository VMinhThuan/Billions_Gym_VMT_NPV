import React from 'react';
import './Card.css';

interface CardProps {
    children: React.ReactNode;
    title?: string;
    subtitle?: string;
    image?: string;
    imageAlt?: string;
    className?: string;
    hover?: boolean;
    onClick?: (e?: React.MouseEvent) => void;
    header?: React.ReactNode;
    footer?: React.ReactNode;
    variant?: 'default' | 'elevated' | 'outlined' | 'filled';
}

const Card: React.FC<CardProps> = ({
    children,
    title,
    subtitle,
    image,
    imageAlt,
    className = '',
    hover = false,
    onClick,
    header,
    footer,
    variant = 'default'
}) => {
    const baseClass = 'card';
    const variantClass = `card-${variant}`;
    const hoverClass = hover ? 'card-hover' : '';
    const clickableClass = onClick ? 'card-clickable' : '';

    const cardClass = [
        baseClass,
        variantClass,
        hoverClass,
        clickableClass,
        className
    ].filter(Boolean).join(' ');

    return (
        <div className={cardClass} onClick={onClick}>
            {image && (
                <div className="card-image">
                    <img src={image} alt={imageAlt || title || 'Card image'} />
                </div>
            )}

            {(header || title || subtitle) && (
                <div className="card-header">
                    {header || (
                        <>
                            {title && <h3 className="card-title">{title}</h3>}
                            {subtitle && <p className="card-subtitle">{subtitle}</p>}
                        </>
                    )}
                </div>
            )}

            <div className="card-content">
                {children}
            </div>

            {footer && (
                <div className="card-footer">
                    {footer}
                </div>
            )}
        </div>
    );
};

export default Card;
