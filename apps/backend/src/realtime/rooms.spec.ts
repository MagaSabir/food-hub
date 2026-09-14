import { Role } from '@prisma/client';
import { AccessTokenPayload } from '../auth/domain/types/access-token-payload';
import {
  branchRoom,
  clientRoom,
  restaurantRoom,
  roomsForBranchOrder,
  roomsForConnection,
} from './rooms';

describe('roomsForConnection', () => {
  const payload = (over: Partial<AccessTokenPayload>): AccessTokenPayload => ({
    sub: 'user-1',
    role: Role.CLIENT,
    ...over,
  });

  it('клиент попадает в свою личную комнату', () => {
    expect(roomsForConnection(payload({ sub: 'alice' }))).toEqual([
      clientRoom('alice'),
    ]);
  });

  it('сотрудник точки — только в комнату своей точки', () => {
    const rooms = roomsForConnection(
      payload({
        role: Role.RESTAURANT_STAFF,
        restaurantId: 'brand-1',
        branchId: 'branch-7',
      }),
    );

    expect(rooms).toEqual([branchRoom('branch-7')]);
    expect(rooms).not.toContain(restaurantRoom('brand-1'));
  });

  it('владелец без привязки к точке — в комнату бренда', () => {
    expect(
      roomsForConnection(
        payload({
          role: Role.RESTAURANT_OWNER,
          restaurantId: 'brand-1',
          branchId: null,
        }),
      ),
    ).toEqual([restaurantRoom('brand-1')]);
  });

  it('владелец, привязанный к одной точке, видит только её', () => {
    expect(
      roomsForConnection(
        payload({
          role: Role.RESTAURANT_OWNER,
          restaurantId: 'brand-1',
          branchId: 'branch-2',
        }),
      ),
    ).toEqual([branchRoom('branch-2')]);
  });

  it('сотрудник без ресторана в токене не получает ни одной комнаты', () => {
    expect(
      roomsForConnection(payload({ role: Role.RESTAURANT_STAFF })),
    ).toEqual([]);
  });

  it('админу платформы живые заказы не адресуются', () => {
    expect(roomsForConnection(payload({ role: Role.PLATFORM_ADMIN }))).toEqual(
      [],
    );
  });
});

describe('roomsForBranchOrder', () => {
  const rooms = roomsForBranchOrder('brand-1', 'branch-7');

  it('заказ на точке доходит до её сотрудника', () => {
    const staff = roomsForConnection({
      sub: 'staff',
      role: Role.RESTAURANT_STAFF,
      restaurantId: 'brand-1',
      branchId: 'branch-7',
    });

    expect(rooms).toEqual(expect.arrayContaining(staff));
  });

  it('и до владельца бренда, который смотрит на все точки сразу', () => {
    const owner = roomsForConnection({
      sub: 'owner',
      role: Role.RESTAURANT_OWNER,
      restaurantId: 'brand-1',
      branchId: null,
    });

    expect(rooms).toEqual(expect.arrayContaining(owner));
  });

  it('но НЕ до сотрудника соседней точки того же бренда', () => {
    const neighbour = roomsForConnection({
      sub: 'staff-2',
      role: Role.RESTAURANT_STAFF,
      restaurantId: 'brand-1',
      branchId: 'branch-9',
    });

    expect(rooms).not.toEqual(expect.arrayContaining(neighbour));
  });

  it('и не до чужого бренда', () => {
    const stranger = roomsForConnection({
      sub: 'owner-2',
      role: Role.RESTAURANT_OWNER,
      restaurantId: 'brand-2',
      branchId: null,
    });

    expect(rooms).not.toEqual(expect.arrayContaining(stranger));
  });
});
