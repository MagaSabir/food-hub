import { ApiError } from '@/shared/api/api-error';
import { NetworkError } from '@/shared/api/network-error';

export interface ErrorDescription {
  title: string;
  note: string;
  canRetry: boolean;
}

export function describeError(error: unknown): ErrorDescription {
  if (error instanceof NetworkError) {
    if (error.kind === 'offline') {
      return {
        title: 'Нет интернета',
        note: 'Проверьте связь — Wi-Fi или мобильные данные.',
        canRetry: true,
      };
    }

    return {
      title: 'Сервер не отвечает',
      note: 'Мы уже знаем о проблеме. Попробуйте через минуту.',
      canRetry: true,
    };
  }

  if (error instanceof ApiError) {
    if (error.status >= 500) {
      return {
        title: 'Что-то сломалось у нас',
        note: 'Мы уже знаем о проблеме. Попробуйте через минуту.',
        canRetry: true,
      };
    }

    if (error.status === 429) {
      return {
        title: 'Слишком часто',
        note: 'Подождите немного и попробуйте снова.',
        canRetry: true,
      };
    }

    return {
      title: 'Не получилось',
      note: 'Обновите экран или вернитесь назад.',
      canRetry: false,
    };
  }

  return {
    title: 'Что-то пошло не так',
    note: 'Попробуйте ещё раз.',
    canRetry: true,
  };
}
