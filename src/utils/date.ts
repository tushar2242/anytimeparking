export const parseUtcDate = (isoString?: string | number | Date | null): Date | null => {
    if (!isoString) return null;
    if (isoString instanceof Date) return isNaN(isoString.getTime()) ? null : isoString;
    if (typeof isoString === 'number') {
        const d = new Date(isoString);
        return isNaN(d.getTime()) ? null : d;
    }
    let s = String(isoString).trim();
    if (!s) return null;
    s = s.replace(' ', 'T');
    // If it is an ISO datetime string missing timezone designator, treat as UTC
    if (s.includes('T') && !s.endsWith('Z') && !/[+-]\d{2}:?\d{2}$/.test(s)) {
        s += 'Z';
    }
    const date = new Date(s);
    return isNaN(date.getTime()) ? null : date;
};

export const formatDateTime = (isoString?: string | number | Date | null): string => {
    const date = parseUtcDate(isoString);
    if (!date) return 'N/A';
    try {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const day = date.getDate();
        const month = months[date.getMonth()];
        const year = date.getFullYear();

        let hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;

        return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
    } catch {
        return 'N/A';
    }
};

export const formatDate = (isoString?: string | number | Date | null): string => {
    const date = parseUtcDate(isoString);
    if (!date) return 'N/A';
    try {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const day = date.getDate();
        const month = months[date.getMonth()];
        const year = date.getFullYear();

        return `${day} ${month} ${year}`;
    } catch {
        return 'N/A';
    }
};

export const formatTime = (isoString?: string | number | Date | null): string => {
    const date = parseUtcDate(isoString);
    if (!date) return 'N/A';
    try {
        let hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        return `${hours}:${minutes} ${ampm}`;
    } catch {
        return 'N/A';
    }
};
