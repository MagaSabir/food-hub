import { PushData } from '@foodhubme/shared';

export interface PushMessage {
  title: string;
  body: string;
  data: PushData;
}

export interface PushDelivery {
  token: string;
  ok: boolean;
  error?: string;
}

export const DEVICE_NOT_REGISTERED = 'DeviceNotRegistered';

export interface IPushChannel {
  send(tokens: string[], message: PushMessage): Promise<PushDelivery[]>;
}

export const PUSH_CHANNEL = Symbol('PUSH_CHANNEL');
