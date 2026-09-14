import { Role } from '@prisma/client';
import { AuthTokenService } from '../auth/application/services/auth-token.service';
import { AccessTokenPayload } from '../auth/domain/types/access-token-payload';
import { InvalidAccessTokenError } from '../auth/domain/errors/auth.errors';
import { WsAuthService, extractToken } from './ws-auth.service';

describe('extractToken', () => {
  it('берёт токен из auth.token (штатный способ socket.io)', () => {
    expect(extractToken({ auth: { token: 'abc' } })).toBe('abc');
  });

  it('обрезает пробелы', () => {
    expect(extractToken({ auth: { token: '  abc  ' } })).toBe('abc');
  });

  it('понимает заголовок Authorization: Bearer', () => {
    expect(extractToken({ headers: { authorization: 'Bearer abc' } })).toBe(
      'abc',
    );
  });

  it('схема нечувствительна к регистру', () => {
    expect(extractToken({ headers: { authorization: 'bearer abc' } })).toBe(
      'abc',
    );
  });

  it('auth.token важнее заголовка', () => {
    expect(
      extractToken({
        auth: { token: 'from-auth' },
        headers: { authorization: 'Bearer from-header' },
      }),
    ).toBe('from-auth');
  });

  it.each([
    ['пустое рукопожатие', {}],
    ['пустая строка', { auth: { token: '   ' } }],
    ['не строка', { auth: { token: 42 } }],
    ['чужая схема', { headers: { authorization: 'Basic abc' } }],
    ['схема без токена', { headers: { authorization: 'Bearer' } }],
  ])('%s → токена нет', (_name, handshake) => {
    expect(extractToken(handshake)).toBeNull();
  });
});

describe('WsAuthService', () => {
  const user: AccessTokenPayload = { sub: 'alice', role: Role.CLIENT };

  const build = (verifyAccess: jest.Mock) =>
    new WsAuthService({ verifyAccess } as unknown as AuthTokenService);

  it('возвращает payload проверенного токена', async () => {
    const verifyAccess = jest.fn().mockResolvedValue(user);

    await expect(
      build(verifyAccess).authenticate({ auth: { token: 'good' } }),
    ).resolves.toEqual(user);
    expect(verifyAccess).toHaveBeenCalledWith('good');
  });

  it('без токена — отказ, до проверки подписи дело не доходит', async () => {
    const verifyAccess = jest.fn();

    await expect(build(verifyAccess).authenticate({})).rejects.toBeInstanceOf(
      InvalidAccessTokenError,
    );
    expect(verifyAccess).not.toHaveBeenCalled();
  });

  it('битый или протухший токен — та же ошибка, что и отсутствие', async () => {
    const verifyAccess = jest.fn().mockRejectedValue(new Error('jwt expired'));

    await expect(
      build(verifyAccess).authenticate({ auth: { token: 'bad' } }),
    ).rejects.toBeInstanceOf(InvalidAccessTokenError);
  });
});
