export type DistanceInput = number | string | null | undefined;
export type DurationInput = number | string | null | undefined;

/**
 * Coerces a given input (string or number) into a numeric value in meters.
 * Handles inputs like "678m", "0.7 km", or numbers.
 * @param input The distance value to coerce.
 * @returns The distance in meters, or null if parsing fails.
 */
export function coerceMeters(input: DistanceInput): number | null {
  if (input === null || input === undefined) return null;
  if (typeof input === 'number') return isFinite(input) ? input : null;

  if (typeof input === 'string') {
    const cleanedInput = input.trim().toLowerCase().replace(',', '.');
    const match = cleanedInput.match(/^(-?\d+(\.\d+)?)\s*(km|m)?$/);

    if (!match) return null;

    const value = parseFloat(match[1]);
    const unit = match[3];

    if (unit === 'km') {
      return value * 1000;
    }
    return value;
  }

  return null;
}

/**
 * Coerces a given input (string or number) into a numeric value in seconds.
 * Handles inputs like "12 min", "1 h 5 min", or numbers (assumed to be seconds).
 * @param input The duration value to coerce.
 * @returns The duration in seconds, or null if parsing fails.
 */
export function coerceSeconds(input: DurationInput): number | null {
  if (input === null || input === undefined) return null;
  if (typeof input === 'number') {
    return isFinite(input) ? input : null;
  }
  if (typeof input !== 'string') return null;

  const cleanedInput = input.trim().toLowerCase();
  if (!cleanedInput) return null;

  let totalSeconds = 0;
  const hourMatches = cleanedInput.match(/(\d+(\.\d+)?)\s*h/);
  const minMatches = cleanedInput.match(/(\d+(\.\d+)?)\s*min/);
  const secMatches = cleanedInput.match(/(\d+(\.\d+)?)\s*s/);

  if (hourMatches) {
    totalSeconds += parseFloat(hourMatches[1]) * 3600;
  }
  if (minMatches) {
    totalSeconds += parseFloat(minMatches[1]) * 60;
  }
  if (secMatches) {
    totalSeconds += parseFloat(secMatches[1]);
  }

  if (!hourMatches && !minMatches && !secMatches && /^\d+(\.\d+)?$/.test(cleanedInput)) {
    return parseFloat(cleanedInput);
  }

  return totalSeconds > 0 ? totalSeconds : null;
}

/**
 * Formats a distance in meters into a human-readable string ("x m" or "y.z km").
 * @param meters The distance in meters.
 * @returns A formatted string, or '—' if the input is invalid.
 */
export function formatDistance(meters: number | null | undefined, locale = 'de-DE'): string {
  if (meters === null || meters === undefined || !isFinite(meters)) {
    return '—';
  }

  if (meters >= 1000) {
    const kilometers = meters / 1000;
    const decimalPlaces = kilometers < 10 ? 1 : 0;
    const formatted = kilometers.toFixed(decimalPlaces);
    return `${formatted.replace('.', ',')} km`;
  }

  if (meters < 10) {
    return `${Math.floor(meters)} m`;
  }

  return `${Math.round(meters)} m`;
}

/**
 * Formats a duration in seconds into a human-readable string ("X min" or "X h Y min").
 * @param seconds The duration in seconds.
 * @returns A formatted string, or '—' if the input is invalid.
 */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || !isFinite(seconds) || seconds < 0) {
    return '—';
  }

  if (seconds < 60) {
    return '< 1 min';
  }

  const totalMinutes = Math.round(seconds / 60);

  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (minutes === 0) {
    return `${hours} h`;
  }

  return `${hours} h ${minutes} min`;
}

/**
 * Formats a duration in seconds into a short, locale-aware string ("11 Min" or "1 Std 5 Min").
 * @param seconds The duration in seconds.
 * @param locale The locale to use for formatting (currently only 'de' is customized).
 * @returns A formatted duration string.
 */
export function formatDurationShort(seconds: number | null | undefined, locale = 'de'): string {
  if (seconds === null || seconds === undefined || !isFinite(seconds) || seconds < 0) {
    return '–';
  }

  const totalMin = Math.round(seconds / 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;

  if (locale === 'de') {
    if (h > 0) return `${h} Std${m > 0 ? ` ${m} Min` : ''}`;
    return `${m} Min`;
  }

  // Default/English formatting
  if (h > 0) return `${h}h${m > 0 ? ` ${m}m` : ''}`;
  return `${m}m`;
}

/**
 * Formats a Date object into a localized time string (e.g., "16:56").
 * @param date The date to format.
 * @returns A formatted time string or '—' if invalid.
 */
export function formatETA(date: Date | null | undefined): string {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  });
}
