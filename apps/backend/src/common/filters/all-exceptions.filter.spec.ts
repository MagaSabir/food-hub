import { ArgumentsHost, BadRequestException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AllExceptionsFilter,
  ErrorResponseBody,
} from './all-exceptions.filter';
import {
  ConflictError,
  Extension,
  InputValidationError,
  NotFoundError,
} from '../errors/domain.error';

class RestaurantNotFoundError extends NotFoundError {
  readonly code = 'RESTAURANT_NOT_FOUND';
  constructor() {
    super('Ресторан не найден');
  }
}
class PhoneAlreadyTakenError extends ConflictError {
  readonly code = 'PHONE_ALREADY_TAKEN';
  constructor() {
    super('Телефон уже занят');
  }
}

function makeHost(): {
  host: ArgumentsHost;
  getBody: () => ErrorResponseBody;
  getStatus: () => number;
} {
  let statusCode = 0;
  let body: ErrorResponseBody;
  const res = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(payload: ErrorResponseBody) {
      body = payload;
      return this;
    },
  };
  const req = { url: '/api/test', method: 'GET' };
  const host = {
    switchToHttp: () => ({
      getResponse: () => res,
      getRequest: () => req,
    }),
  } as unknown as ArgumentsHost;

  return { host, getBody: () => body, getStatus: () => statusCode };
}

function makeFilter(sendDetails = false): AllExceptionsFilter {
  const config = {
    getOrThrow: () => ({ sendInternalServerErrorDetails: sendDetails }),
  } as unknown as ConfigService;
  return new AllExceptionsFilter(config);
}

describe('AllExceptionsFilter', () => {
  it('HttpException → статус и сообщение из исключения', () => {
    const { host, getBody, getStatus } = makeHost();
    makeFilter().catch(new BadRequestException('плохой ввод'), host);

    expect(getStatus()).toBe(HttpStatus.BAD_REQUEST);
    const body = getBody();
    expect(body.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(body.message).toBe('плохой ввод');
    expect(body.path).toBe('/api/test');
    expect(body.timestamp).toBeDefined();
  });

  it('DomainError (NotFound) → 404 + код + текст из ошибки', () => {
    const { host, getBody, getStatus } = makeHost();
    makeFilter().catch(new RestaurantNotFoundError(), host);

    expect(getStatus()).toBe(HttpStatus.NOT_FOUND);
    const body = getBody();
    expect(body.statusCode).toBe(HttpStatus.NOT_FOUND);
    expect(body.code).toBe('RESTAURANT_NOT_FOUND');
    expect(body.message).toBe('Ресторан не найден');
  });

  it('DomainError (Conflict) → 409 + код', () => {
    const { host, getBody, getStatus } = makeHost();
    makeFilter().catch(new PhoneAlreadyTakenError(), host);

    expect(getStatus()).toBe(HttpStatus.CONFLICT);
    expect(getBody().code).toBe('PHONE_ALREADY_TAKEN');
  });

  it('InputValidationError → 400 + extensions по полям', () => {
    const { host, getBody, getStatus } = makeHost();
    const ext = [new Extension('Неверный формат', 'phone')];
    makeFilter().catch(new InputValidationError(ext), host);

    expect(getStatus()).toBe(HttpStatus.BAD_REQUEST);
    const body = getBody();
    expect(body.code).toBe('VALIDATION_ERROR');
    expect(body.extensions).toEqual([
      { message: 'Неверный формат', field: 'phone' },
    ]);
  });

  it('неизвестная ошибка → 500, детали скрыты', () => {
    const { host, getBody, getStatus } = makeHost();
    makeFilter(false).catch(new Error('секрет БД'), host);

    expect(getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(getBody().message).toBe('Internal server error');
  });

  it('неизвестная ошибка + флаг → отдаём детали', () => {
    const { host, getBody } = makeHost();
    makeFilter(true).catch(new Error('детали для dev'), host);

    expect(getBody().message).toBe('детали для dev');
  });
});
