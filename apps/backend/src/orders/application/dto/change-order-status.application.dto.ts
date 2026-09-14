import { OrderStatus } from '@foodhubme/shared';
import { StaffScope } from '../../../auth/domain/rules/staff-scope';

export type OrderStatusAction =
  | { status: OrderStatus.ACCEPTED; prepMinutes: number }
  | { status: OrderStatus.CANCELLED; cancelReason: string }
  | {
      status:
        | OrderStatus.PREPARING
        | OrderStatus.READY
        | OrderStatus.ON_THE_WAY
        | OrderStatus.COMPLETED;
    };

export interface ChangeOrderStatusDto {
  scope: StaffScope;
  staffUserId: string;
  orderId: string;
  action: OrderStatusAction;
}
