/** Common dial codes for phone forms (ISO 3166-1 alpha-2). */
export type PhoneCountry = {
  iso: string;
  name: string;
  /** Digits only, no `+`. */
  dialCode: string;
  flag: string;
  /** Preferred national digit count (validation target). */
  nationalLength: number;
  /** Min national digits accepted (defaults to nationalLength). */
  nationalMin?: number;
  /** US-style `(555) 012-3456` vs spaced groups. */
  format: 'us' | 'grouped';
};

export const PHONE_COUNTRIES: PhoneCountry[] = [
  { iso: 'US', name: 'United States', dialCode: '1', flag: '🇺🇸', nationalLength: 10, format: 'us' },
  { iso: 'CA', name: 'Canada', dialCode: '1', flag: '🇨🇦', nationalLength: 10, format: 'us' },
  { iso: 'GB', name: 'United Kingdom', dialCode: '44', flag: '🇬🇧', nationalLength: 10, nationalMin: 9, format: 'grouped' },
  { iso: 'AU', name: 'Australia', dialCode: '61', flag: '🇦🇺', nationalLength: 9, format: 'grouped' },
  { iso: 'PK', name: 'Pakistan', dialCode: '92', flag: '🇵🇰', nationalLength: 10, format: 'grouped' },
  { iso: 'IN', name: 'India', dialCode: '91', flag: '🇮🇳', nationalLength: 10, format: 'grouped' },
  { iso: 'AE', name: 'United Arab Emirates', dialCode: '971', flag: '🇦🇪', nationalLength: 9, format: 'grouped' },
  { iso: 'SA', name: 'Saudi Arabia', dialCode: '966', flag: '🇸🇦', nationalLength: 9, format: 'grouped' },
  { iso: 'DE', name: 'Germany', dialCode: '49', flag: '🇩🇪', nationalLength: 11, nationalMin: 10, format: 'grouped' },
  { iso: 'FR', name: 'France', dialCode: '33', flag: '🇫🇷', nationalLength: 9, format: 'grouped' },
  { iso: 'NL', name: 'Netherlands', dialCode: '31', flag: '🇳🇱', nationalLength: 9, format: 'grouped' },
  { iso: 'SG', name: 'Singapore', dialCode: '65', flag: '🇸🇬', nationalLength: 8, format: 'grouped' },
  { iso: 'MY', name: 'Malaysia', dialCode: '60', flag: '🇲🇾', nationalLength: 9, nationalMin: 8, format: 'grouped' },
  { iso: 'PH', name: 'Philippines', dialCode: '63', flag: '🇵🇭', nationalLength: 10, format: 'grouped' },
  { iso: 'BD', name: 'Bangladesh', dialCode: '880', flag: '🇧🇩', nationalLength: 10, format: 'grouped' },
  { iso: 'NG', name: 'Nigeria', dialCode: '234', flag: '🇳🇬', nationalLength: 10, format: 'grouped' },
  { iso: 'ZA', name: 'South Africa', dialCode: '27', flag: '🇿🇦', nationalLength: 9, format: 'grouped' },
  { iso: 'BR', name: 'Brazil', dialCode: '55', flag: '🇧🇷', nationalLength: 11, nationalMin: 10, format: 'grouped' },
  { iso: 'MX', name: 'Mexico', dialCode: '52', flag: '🇲🇽', nationalLength: 10, format: 'grouped' },
];

export const DEFAULT_PHONE_COUNTRY_ISO = 'US';

export function getPhoneCountryByIso(iso: string): PhoneCountry {
  const found = PHONE_COUNTRIES.find((c) => c.iso === iso.toUpperCase());
  return found ?? PHONE_COUNTRIES[0];
}

/** Longest dial-code match first (e.g. 971 before 9). */
export function findPhoneCountryByDialDigits(digits: string): PhoneCountry | null {
  const sorted = [...PHONE_COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);
  for (const country of sorted) {
    if (digits.startsWith(country.dialCode)) return country;
  }
  return null;
}
