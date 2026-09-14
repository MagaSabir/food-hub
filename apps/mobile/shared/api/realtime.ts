import { io, type Socket } from 'socket.io-client';
import { WS_NAMESPACES } from '@foodhubme/shared';
import { env } from '@/shared/config/env';
import { getAccessToken } from '@/shared/api/auth-token';

let socket: Socket | null = null;

function serverOrigin(): string {
  return env.apiUrl.replace(/\/api\/?$/, '');
}

export function realtimeSocket(): Socket {
  socket ??= io(`${serverOrigin()}${WS_NAMESPACES.CLIENT}`, {
    transports: ['websocket'],
    autoConnect: false,
    auth: (cb) => cb({ token: getAccessToken() }),
  });

  return socket;
}

export function connectRealtime(): void {
  const connection = realtimeSocket();
  if (!connection.connected) connection.connect();
}

export function disconnectRealtime(): void {
  socket?.disconnect();
}
