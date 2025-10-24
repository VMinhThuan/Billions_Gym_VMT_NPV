import React from 'react';

const Card = ({
    children,
    className = '',
    padding = 'md',
    shadow = 'md',
    hover = false,
    ...rest
}) => {
    const paddingClasses = {
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
    };

    const shadowClasses = {
        sm: 'shadow-sm',
        md: 'shadow-md',
        lg: 'shadow-lg',
    };

    const classes = `
        bg-white rounded-lg border border-gray-200
        ${paddingClasses[padding] || ''}
        ${shadowClasses[shadow] || ''}
        ${hover ? 'transition-transform duration-300 hover:scale-105 hover:shadow-lg' : ''}
        ${className}
    `.trim();

    return (
        <div className={classes} {...rest}>
            {children}
        </div>
    );
};

const CardHeader = ({ children, className = '', ...rest }) => (
    <div className={`mb-4 ${className}`} {...rest}>
        {children}
    </div>
);

const CardTitle = ({ children, className = '', ...rest }) => (
    <h3 className={`text-lg font-semibold text-gray-900 ${className}`} {...rest}>
        {children}
    </h3>
);

const CardContent = ({ children, className = '', ...rest }) => (
    <div className={className} {...rest}>
        {children}
    </div>
);

const CardFooter = ({ children, className = '', ...rest }) => (
    <div className={`mt-4 pt-4 border-t border-gray-200 ${className}`} {...rest}>
        {children}
    </div>
);

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;
