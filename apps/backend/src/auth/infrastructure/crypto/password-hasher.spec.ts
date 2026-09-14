import { DUMMY_PASSWORD_HASH, PasswordHasher } from './password-hasher';
import { PasswordPolicy } from '../../domain/policies/password.policy';

describe('PasswordHasher', () => {
  const hasher = new PasswordHasher();

  it('хеш не содержит пароль и помечен argon2id', async () => {
    const hash = await hasher.hash('Admin12345!');

    expect(hash).toContain('$argon2id$');
    expect(hash).not.toContain('Admin12345!');
  });

  it('один пароль даёт РАЗНЫЕ хеши (случайная соль внутри)', async () => {
    const first = await hasher.hash('Admin12345!');
    const second = await hasher.hash('Admin12345!');

    expect(first).not.toBe(second);
    await expect(hasher.verify(first, 'Admin12345!')).resolves.toBe(true);
    await expect(hasher.verify(second, 'Admin12345!')).resolves.toBe(true);
  });

  it('verify: неверный пароль → false', async () => {
    const hash = await hasher.hash('Admin12345!');

    await expect(hasher.verify(hash, 'admin12345!')).resolves.toBe(false);
    await expect(hasher.verify(hash, 'что-то другое')).resolves.toBe(false);
  });

  it('verify: битый хеш → false, а не исключение', async () => {
    await expect(hasher.verify('не-хеш-вовсе', 'Admin12345!')).resolves.toBe(
      false,
    );
  });

  it('DUMMY_PASSWORD_HASH — валидный хеш, к которому не подходит пароль', async () => {
    await expect(
      hasher.verify(DUMMY_PASSWORD_HASH, 'Admin12345!'),
    ).resolves.toBe(false);
    expect(DUMMY_PASSWORD_HASH).toContain('$argon2id$');
  });

  it('хеш считается заданными параметрами (64 МиБ, 3 прохода)', async () => {
    const value = await hasher.hash('Admin12345!');

    expect(value).toContain(
      `m=${PasswordPolicy.MEMORY_COST},t=${PasswordPolicy.TIME_COST},p=${PasswordPolicy.PARALLELISM}`,
    );
  });

  it('у DUMMY те же параметры — иначе он выдаёт отсутствие аккаунта', () => {
    expect(DUMMY_PASSWORD_HASH).toContain(
      `m=${PasswordPolicy.MEMORY_COST},t=${PasswordPolicy.TIME_COST},p=${PasswordPolicy.PARALLELISM}`,
    );
  });
});
