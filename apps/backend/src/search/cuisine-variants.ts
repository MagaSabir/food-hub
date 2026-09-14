export function cuisineVariants(query: string): string[] {
  const trimmed = query.trim();
  const lower = trimmed.toLowerCase();
  const capitalized = lower.charAt(0).toUpperCase() + lower.slice(1);

  return [...new Set([trimmed, lower, capitalized])];
}
