/**
 * Timezone utility for CDMX (America/Mexico_City)
 * All date operations should use this utility to ensure consistency
 */

/**
 * Get current date/time in CDMX timezone
 */
export function nowInCDMX(): Date {
    return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Mexico_City' }));
}

/**
 * Convert a date to CDMX timezone
 */
export function toCDMX(date: Date): Date {
    return new Date(date.toLocaleString('en-US', { timeZone: 'America/Mexico_City' }));
}

/**
 * Get start of day (00:00:00) in CDMX for a given date
 */
export function startOfDayInCDMX(date: Date): Date {
    const cdmxDate = toCDMX(date);
    cdmxDate.setHours(0, 0, 0, 0);
    return cdmxDate;
}

/**
 * Get end of day (23:59:59) in CDMX for a given date
 */
export function endOfDayInCDMX(date: Date): Date {
    const cdmxDate = toCDMX(date);
    cdmxDate.setHours(23, 59, 59, 999);
    return cdmxDate;
}

/**
 * Check if a date is within the same day in CDMX timezone
 */
export function isSameDayInCDMX(date1: Date, date2: Date): boolean {
    const d1 = toCDMX(date1);
    const d2 = toCDMX(date2);

    return (
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate()
    );
}

/**
 * Add days to a date in CDMX timezone
 */
export function addDaysInCDMX(date: Date, days: number): Date {
    const cdmxDate = toCDMX(date);
    cdmxDate.setDate(cdmxDate.getDate() + days);
    return cdmxDate;
}

/**
 * Add hours to a date in CDMX timezone
 */
export function addHoursInCDMX(date: Date, hours: number): Date {
    const cdmxDate = toCDMX(date);
    cdmxDate.setHours(cdmxDate.getHours() + hours);
    return cdmxDate;
}

/**
 * Check if current time in CDMX is within event day (00:00 - 23:59)
 */
export function isWithinEventDay(eventDate: Date): boolean {
    const now = nowInCDMX();
    return isSameDayInCDMX(now, eventDate);
}
