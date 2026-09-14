export type NetworkFailureKind = 'offline' | 'timeout' | 'unreachable';

export class NetworkError extends Error {
  constructor(
    readonly kind: NetworkFailureKind,
    readonly cause?: unknown,
  ) {
    super(MESSAGES[kind]);
    this.name = 'NetworkError';
  }
}

const MESSAGES: Record<NetworkFailureKind, string> = {
  offline: 'Нет соединения с интернетом',
  timeout: 'Сервер не ответил вовремя',
  unreachable: 'Сервер недоступен',
};
