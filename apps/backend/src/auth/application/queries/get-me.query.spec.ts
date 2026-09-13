import { Test } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { MeViewDto } from '../../api/view-dto/me.view-dto';
import { InvalidAccessTokenError } from '../../domain/errors/auth.errors';
import { AuthQueryRepository } from '../../infrastructure/repositories/auth.query-repository';
import { GetMeQuery, GetMeQueryHandler } from './get-me.query';

describe('GetMeQueryHandler', () => {
  let handler: GetMeQueryHandler;
  let findMe: jest.Mock;

  beforeEach(async () => {
    findMe = jest.fn().mockResolvedValue(new MeViewDto());

    const moduleRef = await Test.createTestingModule({
      providers: [
        GetMeQueryHandler,
        { provide: AuthQueryRepository, useValue: { findMe } },
      ],
    }).compile();

    handler = moduleRef.get(GetMeQueryHandler);
  });

  it('ищет по id и роли ИЗ ТОКЕНА', async () => {
    await handler.execute(new GetMeQuery('staff-1', Role.RESTAURANT_OWNER));

    expect(findMe).toHaveBeenCalledWith('staff-1', Role.RESTAURANT_OWNER);
  });

  it('аккаунт выключен или удалён → 401, а не пустой ответ', async () => {
    findMe.mockResolvedValue(null);

    await expect(
      handler.execute(new GetMeQuery('staff-1', Role.RESTAURANT_STAFF)),
    ).rejects.toBeInstanceOf(InvalidAccessTokenError);
  });
});

describe('MeViewDto', () => {
  it('у сотрудника — принадлежность к ресторану', () => {
    const dto = MeViewDto.fromStaff({
      id: 'staff-1',
      email: 'owner@syrovarnya.local',
      role: Role.RESTAURANT_OWNER,
      restaurantId: 'restaurant-1',
      branchId: null,
    } as Parameters<typeof MeViewDto.fromStaff>[0]);

    expect(dto).toEqual({
      id: 'staff-1',
      role: 'RESTAURANT_OWNER',
      email: 'owner@syrovarnya.local',
      phone: null,
      name: null,
      restaurantId: 'restaurant-1',
      branchId: null,
    });
  });

  it('у клиента — телефон вместо email', () => {
    const dto = MeViewDto.fromUser({
      id: 'user-1',
      phone: '+79280000000',
      name: null,
    } as Parameters<typeof MeViewDto.fromUser>[0]);

    expect(dto).toEqual({
      id: 'user-1',
      role: 'CLIENT',
      email: null,
      phone: '+79280000000',
      name: null,
      restaurantId: null,
      branchId: null,
    });
  });

  it('у админа платформы принадлежности НЕТ', () => {
    const dto = MeViewDto.fromAdmin({
      id: 'admin-1',
      email: 'admin@foodhub.local',
    } as Parameters<typeof MeViewDto.fromAdmin>[0]);

    expect(dto.restaurantId).toBeNull();
    expect(dto.branchId).toBeNull();
    expect(dto.role).toBe('PLATFORM_ADMIN');
  });
});
