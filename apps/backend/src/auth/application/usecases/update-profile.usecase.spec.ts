import { Role } from '@foodhubme/shared';
import { InvalidAccessTokenError } from '../../domain/errors/auth.errors';
import { UsersRepository } from '../../infrastructure/repositories/users.repository';
import {
  UpdateProfileCommand,
  UpdateProfileUseCase,
} from './update-profile.usecase';

const USER = {
  id: 'user-1',
  phone: '+79280000000',
  name: 'Магомед',
} as never;

const makeUseCase = (updated: unknown = USER) => {
  const updateName = jest.fn().mockResolvedValue(updated);
  const useCase = new UpdateProfileUseCase({
    updateName,
  } as unknown as UsersRepository);

  return { useCase, updateName };
};

const run = (useCase: UpdateProfileUseCase, name = 'Магомед') =>
  useCase.execute(new UpdateProfileCommand('user-1', name));

describe('UpdateProfileUseCase', () => {
  it('пишет имя тому, чей ТОКЕН, а не тому, кто назван в теле', async () => {
    const { useCase, updateName } = makeUseCase();

    await run(useCase);

    expect(updateName).toHaveBeenCalledWith('user-1', 'Магомед');
  });

  it('отвечает профилем целиком, а не «ок»', async () => {
    const { useCase } = makeUseCase();

    await expect(run(useCase)).resolves.toMatchObject({
      id: 'user-1',
      role: Role.CLIENT,
      name: 'Магомед',
      phone: '+79280000000',
    });
  });

  it('аккаунта уже нет → та же ошибка, что у протухшего токена', async () => {
    const { useCase } = makeUseCase(null);

    await expect(run(useCase)).rejects.toBeInstanceOf(InvalidAccessTokenError);
  });
});
