import { ClientGateway } from './gateways/client.gateway';
import { RestaurantGateway } from './gateways/restaurant.gateway';
import { RealtimeNotifier } from './realtime.notifier';
import { branchRoom, clientRoom, restaurantRoom } from './rooms';

describe('RealtimeNotifier', () => {
  const target = { restaurantId: 'brand-1', branchId: 'branch-7' };

  const namespace = (emit: jest.Mock) => {
    const to = jest.fn(() => ({ emit }));
    return { gateway: { namespace: { to } }, to };
  };

  const build = (restaurantEmit: jest.Mock, clientEmit = jest.fn()) => {
    const restaurant = namespace(restaurantEmit);
    const client = namespace(clientEmit);

    return {
      notifier: new RealtimeNotifier(
        restaurant.gateway as unknown as RestaurantGateway,
        client.gateway as unknown as ClientGateway,
      ),
      restaurantTo: restaurant.to,
      clientTo: client.to,
    };
  };

  it('ресторану — в комнаты точки и бренда', () => {
    const emit = jest.fn();
    const { notifier, restaurantTo } = build(emit);

    notifier.emitToBranch(target, 'order:new', { orderId: 'o1' });

    expect(restaurantTo).toHaveBeenCalledWith([
      branchRoom('branch-7'),
      restaurantRoom('brand-1'),
    ]);
    expect(emit).toHaveBeenCalledWith('order:new', { orderId: 'o1' });
  });

  it('клиенту — в его личную комнату и в ДРУГУЮ дверь', () => {
    const clientEmit = jest.fn();
    const { notifier, clientTo, restaurantTo } = build(jest.fn(), clientEmit);

    notifier.emitToClient('alice', 'order:status', { orderId: 'o1' });

    expect(clientTo).toHaveBeenCalledWith(clientRoom('alice'));
    expect(clientEmit).toHaveBeenCalledWith('order:status', { orderId: 'o1' });
    expect(restaurantTo).not.toHaveBeenCalled();
  });

  it('сбой сокет-сервера НЕ выбрасывается наружу', () => {
    const boom = jest.fn(() => {
      throw new Error('socket.io лёг');
    });
    const { notifier } = build(boom, boom);

    expect(() => notifier.emitToBranch(target, 'order:new', {})).not.toThrow();
    expect(() =>
      notifier.emitToClient('alice', 'order:status', {}),
    ).not.toThrow();
  });
});
