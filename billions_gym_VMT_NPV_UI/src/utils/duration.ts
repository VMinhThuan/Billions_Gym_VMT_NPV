const removeDiacritics = (value: string = '') =>
    value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export const normalizeDurationUnit = (value: string = '') =>
    removeDiacritics(value).toLowerCase();

export const formatDurationUnitLabel = (value: string = '') => {
    const normalized = normalizeDurationUnit(value);
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

export const convertDurationToDays = (amount: number, unit: string) => {
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

export const addDuration = (startDate: string | Date, amount: number, unit: string) => {
    const start = new Date(startDate);
    const normalized = normalizeDurationUnit(unit);
    const date = new Date(start);

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

