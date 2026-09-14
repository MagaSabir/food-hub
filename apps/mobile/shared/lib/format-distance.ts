export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 10) * 100} м`;

  return `${km.toFixed(1).replace('.', ',')} км`;
}
