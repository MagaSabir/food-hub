export const StatusActor = {
  CLIENT: 'user',

  staff: (staffUserId: string): string => `staff:${staffUserId}`,

  SYSTEM: 'system',
} as const;
