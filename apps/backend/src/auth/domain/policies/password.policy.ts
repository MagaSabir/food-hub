export const PasswordPolicy = {
  MEMORY_COST: 2 ** 16,
  TIME_COST: 3,
  PARALLELISM: 1,
} as const;

export const ARGON2_OPTIONS = {
  memoryCost: PasswordPolicy.MEMORY_COST,
  timeCost: PasswordPolicy.TIME_COST,
  parallelism: PasswordPolicy.PARALLELISM,
} as const;
