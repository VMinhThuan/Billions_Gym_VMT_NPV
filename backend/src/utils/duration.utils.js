const removeDiacritics = (value = '') => {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

const normalizeDonViThoiHan = (unit = '') => {
    if (!unit) return '';
    return removeDiacritics(unit).toLowerCase();
};

const addDuration = (startDate, amount = 0, unit = 'ngay') => {
    const date = new Date(startDate);
    const normalized = normalizeDonViThoiHan(unit);

    switch (normalized) {
        case 'thang':
            date.setMonth(date.getMonth() + amount);
            break;
        case 'nam':
            date.setFullYear(date.getFullYear() + amount);
            break;
        case 'phut':
            date.setMinutes(date.getMinutes() + amount);
            break;
        default:
            // Mặc định là ngày
            date.setDate(date.getDate() + amount);
            break;
    }

    return date;
};

const convertDurationToDays = (amount = 0, unit = 'ngay') => {
    const normalized = normalizeDonViThoiHan(unit);
    switch (normalized) {
        case 'thang':
            return amount * 30;
        case 'nam':
            return amount * 365;
        case 'phut':
            return amount / (60 * 24);
        default:
            return amount;
    }
};

const convertDurationToMonths = (amount = 0, unit = 'ngay') => {
    const normalized = normalizeDonViThoiHan(unit);
    switch (normalized) {
        case 'thang':
            return amount;
        case 'nam':
            return amount * 12;
        case 'phut':
            return amount / (60 * 24 * 30);
        default:
            return amount / 30;
    }
};

module.exports = {
    addDuration,
    convertDurationToDays,
    convertDurationToMonths,
    normalizeDonViThoiHan
};

