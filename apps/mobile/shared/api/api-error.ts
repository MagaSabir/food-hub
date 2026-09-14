import type { ErrorCode } from '@foodhubme/shared';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ErrorCode | undefined,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  is(code: ErrorCode): boolean {
    return this.code === code;
  }
}
