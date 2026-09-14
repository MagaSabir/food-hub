import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { MAX_SAVED_ADDRESSES } from '@foodhubme/shared';
import { ErrorResponseViewDto } from '../../common/api/error-response.view-dto';
import { UserAddressViewDto } from '../view-dto/user-address.view-dto';

const clientOnly = () => [
  ApiBearerAuth(),
  ApiUnauthorizedResponse({
    description: 'Нет токена или он не принят',
    type: ErrorResponseViewDto,
  }),
  ApiForbiddenResponse({
    description: 'ACCESS_DENIED — адреса есть только у клиента',
    type: ErrorResponseViewDto,
  }),
];

const addressNotFound = () =>
  ApiNotFoundResponse({
    description:
      'ADDRESS_NOT_FOUND — адреса нет ИЛИ он не ваш. Ответ один и тот же ' +
      'намеренно: иначе перебором id выясняется, какие адреса существуют.',
    type: ErrorResponseViewDto,
  });

export const ApiGetAddresses = () =>
  applyDecorators(
    ...clientOnly(),
    ApiOperation({
      summary: 'Мои сохранённые адреса',
      description:
        'Основной первым, дальше свежие сверху — приложение берёт первый и ' +
        'не разбирает флаги.',
    }),
    ApiOkResponse({ type: UserAddressViewDto, isArray: true }),
  );

export const ApiSaveAddress = () =>
  applyDecorators(
    ...clientOnly(),
    ApiOperation({
      summary: 'Сохранить адрес в книгу',
      description:
        `Не больше ${MAX_SAVED_ADDRESSES} адресов. Новый сразу становится ` +
        'ОСНОВНЫМ: человек только что его выбрал, значит именно туда и ' +
        'заказывает. Разовые адреса в книгу НЕ попадают — сохранение всегда ' +
        'явное действие.',
    }),
    ApiOkResponse({ type: UserAddressViewDto }),
    ApiBadRequestResponse({
      description: 'VALIDATION_ERROR — пустой адрес или кривые координаты',
      type: ErrorResponseViewDto,
    }),
    ApiConflictResponse({
      description: 'ADDRESS_LIMIT_REACHED — книга заполнена, удалите лишний',
      type: ErrorResponseViewDto,
    }),
  );

export const ApiMakeAddressDefault = () =>
  applyDecorators(
    ...clientOnly(),
    ApiParam({ name: 'id', format: 'uuid' }),
    ApiOperation({
      summary: 'Сделать адрес основным',
      description:
        'Зовётся, когда человек выбирает адрес из книги: основной — это тот, ' +
        'которым пользуются, поэтому отдельного переключателя нет.',
    }),
    ApiOkResponse({ type: UserAddressViewDto }),
    addressNotFound(),
  );

export const ApiRemoveAddress = () =>
  applyDecorators(
    ...clientOnly(),
    ApiParam({ name: 'id', format: 'uuid' }),
    ApiOperation({
      summary: 'Убрать адрес из книги',
      description:
        'Если убрали основной, основным станет самый свежий из оставшихся — ' +
        'иначе при следующем запуске человек вводил бы адрес руками, имея ' +
        'два сохранённых.',
    }),
    ApiNoContentResponse({ description: 'Удалён' }),
    addressNotFound(),
  );
