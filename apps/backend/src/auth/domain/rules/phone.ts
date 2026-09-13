const E164_RU = /^\+7\d{10}$/;

export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');

  const withCountryCode =
    digits.length === 11 && digits.startsWith('8')
      ? `7${digits.slice(1)}`
      : digits;

  const normalized = `+${withCountryCode}`;

  return E164_RU.test(normalized) ? normalized : null;
}
