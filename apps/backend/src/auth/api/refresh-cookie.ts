import { CookieOptions, Response } from 'express';
import { CookieConfig } from '../../config';
import { REFRESH_TOKEN_COOKIE } from '../constants/auth.constants';

const REFRESH_COOKIE_PATH = '/api/auth';

function baseOptions(config: CookieConfig): CookieOptions {
  return {
    httpOnly: config.httpOnly,
    secure: config.secure,
    sameSite: config.sameSite,
    path: REFRESH_COOKIE_PATH,
  };
}

export function setRefreshCookie(
  res: Response,
  config: CookieConfig,
  token: string,
  ttlSec: number,
): void {
  res.cookie(REFRESH_TOKEN_COOKIE, token, {
    ...baseOptions(config),
    maxAge: ttlSec * 1000,
  });
}

export function clearRefreshCookie(res: Response, config: CookieConfig): void {
  res.clearCookie(REFRESH_TOKEN_COOKIE, baseOptions(config));
}
