export const EXPO_PUSH_TOKEN_PATTERN = /^Expo(nent)?PushToken\[[^\s\]]+\]$/;

export function isExpoPushToken(token: string): boolean {
  return EXPO_PUSH_TOKEN_PATTERN.test(token);
}
