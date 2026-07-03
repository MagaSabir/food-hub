export const ErrorCodes = {
    /** Ошибка валидации входных DTO (кидает глобальный ValidationPipe). */
    VALIDATION_ERROR: 'VALIDATION_ERROR',
} as const;

/** Тип-объединение всех кодов: 'VALIDATION_ERROR' | ... */
export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];