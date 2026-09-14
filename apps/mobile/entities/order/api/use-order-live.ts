import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  WS_EVENTS,
  type OrderListItemView,
  type OrderStatusEvent,
  type OrderView,
} from '@foodhubme/shared';
import { realtimeSocket } from '@/shared/api/realtime';

export function useOrderLive(): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = realtimeSocket();

    const onStatus = (event: OrderStatusEvent) => {
      queryClient.setQueryData<OrderView>(['order', event.orderId], (order) =>
        order
          ? {
              ...order,
              status: event.status,
              prepMinutes: event.prepMinutes,
              cancelReason: event.cancelReason,
            }
          : order,
      );

      queryClient.setQueryData<OrderListItemView[]>(['my-orders'], (orders) =>
        orders?.map((order) =>
          order.id === event.orderId
            ? { ...order, status: event.status }
            : order,
        ),
      );
    };

    const onConnect = () => {
      void queryClient.invalidateQueries({ queryKey: ['order'] });
      void queryClient.invalidateQueries({ queryKey: ['my-orders'] });
    };

    socket.on(WS_EVENTS.ORDER_STATUS, onStatus);
    socket.on('connect', onConnect);

    return () => {
      socket.off(WS_EVENTS.ORDER_STATUS, onStatus);
      socket.off('connect', onConnect);
    };
  }, [queryClient]);
}
