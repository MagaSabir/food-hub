import { applyDecorators } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
} from '@nestjs/swagger';
import { HealthViewDto } from '../view-dto/health.view-dto';

export const ApiHealth = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Проверка живости: приложение, PostgreSQL, Redis',
      description:
        'Дёргает мониторинг, поэтому доступна без токена. Пингует обе ' +
        'обязательные зависимости параллельно. Если лежит хотя бы одна — ' +
        '503 с тем же телом: мониторингу нужен НЕ-200, иначе он не заметит ' +
        'аварию, а нам в теле видно, что именно упало.',
    }),
    ApiOkResponse({ type: HealthViewDto, description: 'Всё живо' }),
    ApiServiceUnavailableResponse({
      type: HealthViewDto,
      description: 'db или redis = down; тело то же, статус 503',
    }),
  );
