import { hash, verify } from '@node-rs/argon2';
import { Injectable } from '@nestjs/common';
import { ARGON2_OPTIONS } from '../../domain/policies/password.policy';

export const DUMMY_PASSWORD_HASH =
  '$argon2id$v=19$m=65536,t=3,p=1$mV71w/Vv2Q/hHZjMk2RN4w$NeQOQ6swVwB4nwmKMMEfzcReINwGueM/ZMhQShOF5kQ';

@Injectable()
export class PasswordHasher {
  hash(plain: string): Promise<string> {
    return hash(plain, ARGON2_OPTIONS);
  }

  async verify(passwordHash: string, plain: string): Promise<boolean> {
    try {
      return await verify(passwordHash, plain);
    } catch {
      return false;
    }
  }
}
