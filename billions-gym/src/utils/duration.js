const removeDiacritics = (value = '') =>
    value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export const normalizeDurationUnit = (unit = '') =>
    removeDiacritics(unit).toLowerCase();

export const formatDurationUnitLabel = (unit = '') => {
    const normalized = normalizeDurationUnit(unit);
    switch (normalized) {
        case 'thang':
            return 'Tháng';
        case 'nam':
            return 'Năm';
        case 'phut':
            return 'Phút';
        default:
            return 'Ngày';
    }
};

export const convertDurationToDays = (amount = 0, unit = 'ngay') => {
    const normalized = normalizeDurationUnit(unit);
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

export const addDuration = (startDate, amount = 0, unit = 'ngay') => {
    const start = new Date(startDate);
    const date = new Date(start);
    const normalized = normalizeDurationUnit(unit);

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
            date.setDate(date.getDate() + amount);
            break;
    }

    return date;
};

