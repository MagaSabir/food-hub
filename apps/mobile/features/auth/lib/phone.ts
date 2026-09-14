export const PHONE_DIGITS = 10;

export function toDigits(input: string): string {
  return input.replace(/\D/g, '').slice(0, PHONE_DIGITS);
}

export function stripCountryCode(input: string): string {
  const digits = input.replace(/\D/g, '');

  if (
    digits.length > PHONE_DIGITS &&
    (digits.startsWith('7') || digits.startsWith('8'))
  ) {
    return digits.slice(1, PHONE_DIGITS + 1);
  }

  return digits.slice(0, PHONE_DIGITS);
}

export function formatPhone(digits: string): string {
  const parts = [
    digits.slice(0, 3),
    digits.slice(3, 6),
    digits.slice(6, 8),
    digits.slice(8, 10),
  ].filter(Boolean);

  if (parts.length === 0) return '';

  let result = `(${parts[0]}`;
  if (digits.length > 3) result += ') ';
  if (parts[1]) result += parts[1];
  if (parts[2]) result += `-${parts[2]}`;
  if (parts[3]) result += `-${parts[3]}`;

  return result;
}

export function toE164(digits: string): string {
  return `+7${digits}`;
}

export function isPhoneComplete(digits: string): boolean {
  return digits.length === PHONE_DIGITS;
}
