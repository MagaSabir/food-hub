import { Injectable, Logger } from '@nestjs/common';
import { isExpoPushToken } from './expo-push-token';
import {
  DEVICE_NOT_REGISTERED,
  IPushChannel,
  PushDelivery,
  PushMessage,
} from './push-channel.interface';
import { PushPolicy } from './push.policy';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

const CHUNK_SIZE = 100;

interface ExpoTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
}

@Injectable()
export class ExpoPushChannel implements IPushChannel {
  private readonly logger = new Logger(ExpoPushChannel.name);

  constructor(private readonly accessToken: string | undefined) {}

  async send(tokens: string[], message: PushMessage): Promise<PushDelivery[]> {
    const valid = tokens.filter(isExpoPushToken);
    const rejected: PushDelivery[] = tokens
      .filter((t) => !isExpoPushToken(t))
      .map((token) => ({ token, ok: false, error: DEVICE_NOT_REGISTERED }));

    if (valid.length === 0) return rejected;

    const delivered: PushDelivery[] = [];

    for (const chunk of split(valid, CHUNK_SIZE)) {
      const tickets = await this.post(chunk, message);

      chunk.forEach((token, i) => {
        delivered.push(this.readTicket(token, tickets[i]));
      });
    }

    return [...delivered, ...rejected];
  }

  private async post(
    tokens: string[],
    message: PushMessage,
  ): Promise<ExpoTicket[]> {
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(this.accessToken
          ? { Authorization: `Bearer ${this.accessToken}` }
          : {}),
      },
      body: JSON.stringify(
        tokens.map((to) => ({
          to,
          title: message.title,
          body: message.body,
          data: message.data,
          sound: 'default',
          ttl: PushPolicy.TTL_SECONDS,
          priority: 'high',
        })),
      ),
    });

    if (!response.ok) {
      throw new Error(
        `Expo ответил ${response.status}: ${await safeBody(response)}`,
      );
    }

    const body = (await response.json()) as { data?: ExpoTicket[] };

    return body.data ?? [];
  }

  private readTicket(token: string, ticket?: ExpoTicket): PushDelivery {
    if (!ticket) {
      this.logger.warn(`Expo не ответил по токену ${mask(token)}`);
      return { token, ok: false, error: 'NoTicket' };
    }

    if (ticket.status === 'ok') return { token, ok: true };

    const error = ticket.details?.error ?? 'UnknownError';
    this.logger.warn(`Push на ${mask(token)} отклонён: ${error}`);

    return { token, ok: false, error };
  }
}

function split<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];

  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }

  return chunks;
}

async function safeBody(response: Response): Promise<string> {
  try {
    return (await response.text()).slice(0, 300);
  } catch {
    return '<тело не прочитано>';
  }
}

function mask(token: string): string {
  return `…${token.slice(-6)}`;
}
