import React from 'react';
import './Button.css';

interface ButtonProps {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'small' | 'medium' | 'large';
    disabled?: boolean;
    loading?: boolean;
    fullWidth?: boolean;
    icon?: React.ReactNode;
    onClick?: () => void;
    type?: 'button' | 'submit' | 'reset';
    className?: string;
}

const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'medium',
    disabled = false,
    loading = false,
    fullWidth = false,
    icon,
    onClick,
    type = 'button',
    className = ''
}) => {
    const baseClass = 'btn';
    const variantClass = `btn-${variant}`;
    const sizeClass = `btn-${size}`;
    const fullWidthClass = fullWidth ? 'btn-full-width' : '';
    const disabledClass = disabled || loading ? 'btn-disabled' : '';
    const loadingClass = loading ? 'btn-loading' : '';

    const buttonClass = [
        baseClass,
        variantClass,
        sizeClass,
        fullWidthClass,
        disabledClass,
        loadingClass,
        className
    ].filter(Boolean).join(' ');

    return (
        <button
            type={type}
            className={buttonClass}
            onClick={onClick}
            disabled={disabled || loading}
        >
            {loading && (
                <div className="btn-spinner">
                    <div className="spinner"></div>
                </div>
            )}
            {!loading && icon && (
                <span className="btn-icon">{icon}</span>
            )}
            <span className="btn-text">{children}</span>
        </button>
    );
};

export default Button;
