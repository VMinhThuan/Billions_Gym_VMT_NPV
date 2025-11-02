export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const validatePassword = (password) => {
    if (!password) {
        return { isValid: false, message: 'Password is required' };
    }

    if (password.length < 8) {
        return { isValid: false, message: 'Password must be at least 8 characters long' };
    }

    if (!/(?=.*[a-z])/.test(password)) {
        return { isValid: false, message: 'Password must contain at least one lowercase letter' };
    }

    if (!/(?=.*[A-Z])/.test(password)) {
        return { isValid: false, message: 'Password must contain at least one uppercase letter' };
    }

    if (!/(?=.*\d)/.test(password)) {
        return { isValid: false, message: 'Password must contain at least one number' };
    }

    if (!/(?=.*[@$!%*?&])/.test(password)) {
        return { isValid: false, message: 'Password must contain at least one special character' };
    }

    return { isValid: true, message: 'Password is valid' };
};

export const isValidPhone = (phone) => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
};

export const isValidUrl = (url) => {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

export const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;

    return input
        .trim()
        .replace(/[<>]/g, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+=/gi, '');
};

export const validateForm = (formData, rules) => {
    const errors = {};

    Object.keys(rules).forEach(field => {
        const value = formData[field];
        const rule = rules[field];

        if (rule.required && (!value || value.trim() === '')) {
            errors[field] = rule.required;
            return;
        }

        if (value && rule.email && !isValidEmail(value)) {
            errors[field] = rule.email;
            return;
        }

        if (value && rule.minLength && value.length < rule.minLength) {
            errors[field] = rule.minLength;
            return;
        }

        if (value && rule.maxLength && value.length > rule.maxLength) {
            errors[field] = rule.maxLength;
            return;
        }

        if (value && rule.pattern && !rule.pattern.test(value)) {
            errors[field] = rule.pattern;
            return;
        }
    });

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};
