import {
  DEFAULT_PHONE_COUNTRY_ISO,
  findPhoneCountryByDialDigits,
  getPhoneCountryByIso,
  type PhoneCountry,
} from '@/lib/ui/phone-countries';

/** Display format used across forms, e.g. `+1 (555) 012-3456`. */
export const PHONE_INPUT_PLACEHOLDER = '+1 (555) 012-3456';

export type ParsedPhoneValue = {
  country: PhoneCountry;
  /** National digits only (no dial code). */
  nationalDigits: string;
  /** Full display string. */
  formatted: string;
  /** Digits only including country code. */
  e164Digits: string;
};

function onlyDigits(raw: string): string {
  return raw.replace(/\D/g, '');
}

/** US / CA national: `(555) 012-3456`. */
export function formatUsNational(nationalDigits: string): string {
  const d = onlyDigits(nationalDigits).slice(0, 10);
  if (!d) return '';
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

/** Generic grouped national digits: `300 123 4567`. */
export function formatGroupedNational(nationalDigits: string, maxLen: number): string {
  const d = onlyDigits(nationalDigits).slice(0, maxLen);
  if (!d) return '';
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
  if (d.length <= 10) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 10)} ${d.slice(10)}`.trim();
}

export function formatNationalForCountry(country: PhoneCountry, nationalDigits: string): string {
  if (country.format === 'us') return formatUsNational(nationalDigits);
  return formatGroupedNational(nationalDigits, country.nationalLength + 2);
}

export function formatPhoneWithCountry(country: PhoneCountry, nationalDigits: string): string {
  const national = onlyDigits(nationalDigits).slice(0, Math.max(country.nationalLength, 15));
  if (!national) return `+${country.dialCode}`;
  const nationalFmt = formatNationalForCountry(country, national);
  return `+${country.dialCode} ${nationalFmt}`.trim();
}

/**
 * Format as the user types.
 * - Prefer explicit `countryIso` when provided (country picker).
 * - Otherwise infer from leading dial digits (web-compatible US `+1` path).
 */
export function formatPhoneInputValue(raw: string, countryIso?: string): string {
  const digits = onlyDigits(raw);
  if (!digits) return '';

  if (countryIso) {
    const country = getPhoneCountryByIso(countryIso);
    let national = digits;
    if (digits.startsWith(country.dialCode)) {
      national = digits.slice(country.dialCode.length);
    }
    return formatPhoneWithCountry(country, national);
  }

  // Legacy / web parity: bare 10-digit US numbers → +1 (xxx) xxx-xxxx
  if (digits.length <= 10 && !digits.startsWith('1')) {
    return formatPhoneWithCountry(getPhoneCountryByIso('US'), digits);
  }

  const matched = findPhoneCountryByDialDigits(digits);
  if (matched) {
    return formatPhoneWithCountry(matched, digits.slice(matched.dialCode.length));
  }

  return `+${digits.slice(0, 15)}`;
}

export function parsePhoneInputValue(
  raw: string,
  fallbackIso: string = DEFAULT_PHONE_COUNTRY_ISO,
): ParsedPhoneValue {
  const digits = onlyDigits(raw);
  if (!digits) {
    const country = getPhoneCountryByIso(fallbackIso);
    return {
      country,
      nationalDigits: '',
      formatted: '',
      e164Digits: '',
    };
  }

  const matched = findPhoneCountryByDialDigits(digits);
  const country = matched ?? getPhoneCountryByIso(fallbackIso);
  const nationalDigits = matched
    ? digits.slice(matched.dialCode.length)
    : digits.startsWith(country.dialCode)
      ? digits.slice(country.dialCode.length)
      : digits;

  const capped = nationalDigits.slice(0, Math.max(country.nationalLength, 15));
  return {
    country,
    nationalDigits: capped,
    formatted: formatPhoneWithCountry(country, capped),
    e164Digits: `${country.dialCode}${capped}`,
  };
}

export type PhoneValidationOptions = {
  required?: boolean;
  /** When set, validate against this country instead of parsing. */
  countryIso?: string;
};

export function getPhoneValidationError(
  value: string,
  options: PhoneValidationOptions = {},
): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return options.required ? 'Phone number is required.' : null;
  }

  const parsed = parsePhoneInputValue(trimmed, options.countryIso ?? DEFAULT_PHONE_COUNTRY_ISO);
  const country = options.countryIso ? getPhoneCountryByIso(options.countryIso) : parsed.country;
  const national = options.countryIso
    ? onlyDigits(trimmed).startsWith(country.dialCode)
      ? onlyDigits(trimmed).slice(country.dialCode.length)
      : onlyDigits(trimmed)
    : parsed.nationalDigits;

  const min = country.nationalMin ?? country.nationalLength;
  const max = country.nationalLength;

  if (national.length < min) {
    return `Enter a valid ${country.name} number (${min} digits).`;
  }
  if (national.length > max + 2) {
    return `Phone number is too long for ${country.name}.`;
  }
  // Soft complete: if US format, prefer exactly 10
  if (country.format === 'us' && national.length !== 10) {
    return 'Enter a complete US number, e.g. (555) 012-3456.';
  }
  return null;
}

export function isPhoneValid(value: string, options: PhoneValidationOptions = {}): boolean {
  return getPhoneValidationError(value, options) === null;
}

/** Digits-only E.164 without `+` for APIs that prefer raw phone. */
export function phoneToE164Digits(value: string, countryIso?: string): string {
  return parsePhoneInputValue(value, countryIso ?? DEFAULT_PHONE_COUNTRY_ISO).e164Digits;
}
