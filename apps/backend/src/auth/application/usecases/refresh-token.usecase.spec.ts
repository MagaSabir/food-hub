import { Test } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { AuthSubjectType, AuthTokens } from '../../domain/types/auth-subject';
import { InvalidRefreshTokenError } from '../../domain/errors/auth.errors';
import { RefreshSession } from '../../domain/types/refresh-session';
import { PlatformAdminsRepository } from '../../infrastructure/repositories/platform-admins.repository';
import {
  SessionsRepository,
  SessionState,
} from '../../infrastructure/repositories/sessions.repository';
import { StaffUsersRepository } from '../../infrastructure/repositories/staff-users.repository';
import { UsersRepository } from '../../infrastructure/repositories/users.repository';
import { SessionIssuer } from '../services/session-issuer.service';
import {
  RefreshTokenCommand,
  RefreshTokenUseCase,
} from './refresh-token.usecase';

const STAFF = {
  id: 'staff-1',
  role: Role.RESTAURANT_STAFF,
  restaurantId: 'restaurant-1',
  branchId: 'branch-1',
};

const SESSION: RefreshSession = {
  subjectId: STAFF.id,
  subjectType: AuthSubjectType.STAFF,
  sessionId: 'session-1',
  token: 'refresh.jwt',
  source: 'cookie',
};

const TOKENS: AuthTokens = {
  accessToken: 'new.access',
  refreshToken: 'new.refresh',
  refreshTtlSec: 2_592_000,
};

describe('RefreshTokenUseCase', () => {
  let useCase: RefreshTokenUseCase;
  let check: jest.Mock;
  let deleteAllForSubject: jest.Mock;
  let findStaffById: jest.Mock;
  let findAdminById: jest.Mock;
  let findUserById: jest.Mock;
  let issue: jest.Mock;

  beforeEach(async () => {
    check = jest.fn().mockResolvedValue(SessionState.CURRENT);
    deleteAllForSubject = jest.fn().mockResolvedValue(undefined);
    findStaffById = jest.fn().mockResolvedValue(STAFF);
    findAdminById = jest.fn().mockResolvedValue(null);
    findUserById = jest.fn().mockResolvedValue(null);
    issue = jest.fn().mockResolvedValue(TOKENS);

    const moduleRef = await Test.createTestingModule({
      providers: [
        RefreshTokenUseCase,
        {
          provide: SessionsRepository,
          useValue: { check, deleteAllForSubject },
        },
        {
          provide: StaffUsersRepository,
          useValue: { findActiveById: findStaffById },
        },
        {
          provide: PlatformAdminsRepository,
          useValue: { findActiveById: findAdminById },
        },
        {
          provide: UsersRepository,
          useValue: { findActiveById: findUserById },
        },
        { provide: SessionIssuer, useValue: { issue } },
      ],
    }).compile();

    useCase = moduleRef.get(RefreshTokenUseCase);
  });

  const refresh = (session: RefreshSession = SESSION) =>
    useCase.execute(new RefreshTokenCommand(session));

  describe('обычное обновление', () => {
    it('актуальный токен → новая пара', async () => {
      await expect(refresh()).resolves.toEqual(TOKENS);
    });

    it('сессия та же — обновление не «переезжает» на другое устройство', async () => {
      await refresh();

      expect(issue).toHaveBeenCalledWith(
        AuthSubjectType.STAFF,
        expect.anything(),
        SESSION.sessionId,
      );
    });

    it('права пересобираются из БД, а не берутся из старого токена', async () => {
      findStaffById.mockResolvedValue({
        ...STAFF,
        role: Role.RESTAURANT_STAFF,
        branchId: 'branch-2',
      });

      await refresh();

      expect(issue).toHaveBeenCalledWith(
        AuthSubjectType.STAFF,
        {
          sub: STAFF.id,
          role: Role.RESTAURANT_STAFF,
          restaurantId: STAFF.restaurantId,
          branchId: 'branch-2',
        },
        SESSION.sessionId,
      );
    });
  });

  describe('STALE — сессия жива, токен от неё старый (признак утечки)', () => {
    beforeEach(() => check.mockResolvedValue(SessionState.STALE));

    it('отказ', async () => {
      await expect(refresh()).rejects.toBeInstanceOf(InvalidRefreshTokenError);
    });

    it('гасит ВСЕ сессии аккаунта, а не только эту', async () => {
      await refresh().catch(() => undefined);

      expect(deleteAllForSubject).toHaveBeenCalledWith(
        AuthSubjectType.STAFF,
        STAFF.id,
      );
    });

    it('новых токенов не выдаёт', async () => {
      await refresh().catch(() => undefined);

      expect(issue).not.toHaveBeenCalled();
    });
  });

  describe('MISSING — сессии нет (выход, срок, вытеснена новым входом)', () => {
    beforeEach(() => check.mockResolvedValue(SessionState.MISSING));

    it('отказ', async () => {
      await expect(refresh()).rejects.toBeInstanceOf(InvalidRefreshTokenError);
    });

    it('чужие сессии НЕ гасит — это не кража', async () => {
      await refresh().catch(() => undefined);

      expect(deleteAllForSubject).not.toHaveBeenCalled();
    });
  });

  describe('аккаунт выключен', () => {
    it('уволенный сотрудник не обновит токен', async () => {
      findStaffById.mockResolvedValue(null);

      await expect(refresh()).rejects.toBeInstanceOf(InvalidRefreshTokenError);
      expect(issue).not.toHaveBeenCalled();
    });

    it('выключенный админ платформы не обновит токен', async () => {
      findAdminById.mockResolvedValue(null);

      await expect(
        refresh({ ...SESSION, subjectType: AuthSubjectType.ADMIN }),
      ).rejects.toBeInstanceOf(InvalidRefreshTokenError);
    });

    it('удалённый клиент (152-ФЗ) не обновит токен', async () => {
      findUserById.mockResolvedValue(null);

      await expect(
        refresh({ ...SESSION, subjectType: AuthSubjectType.CLIENT }),
      ).rejects.toBeInstanceOf(InvalidRefreshTokenError);
    });
  });

  describe('клиент', () => {
    it('обновляется через таблицу users, роль CLIENT', async () => {
      findUserById.mockResolvedValue({ id: 'user-1', phone: '+79280000000' });

      await refresh({
        ...SESSION,
        subjectId: 'user-1',
        subjectType: AuthSubjectType.CLIENT,
      });

      expect(findUserById).toHaveBeenCalledWith('user-1');
      expect(findStaffById).not.toHaveBeenCalled();
      expect(issue).toHaveBeenCalledWith(
        AuthSubjectType.CLIENT,
        { sub: 'user-1', role: Role.CLIENT },
        SESSION.sessionId,
      );
    });
  });

  describe('тип субъекта выбирает таблицу', () => {
    it('admin ищется среди админов платформы', async () => {
      findAdminById.mockResolvedValue({ id: 'admin-1' });

      await refresh({
        ...SESSION,
        subjectId: 'admin-1',
        subjectType: AuthSubjectType.ADMIN,
      });

      expect(findAdminById).toHaveBeenCalledWith('admin-1');
      expect(findStaffById).not.toHaveBeenCalled();
      expect(issue).toHaveBeenCalledWith(
        AuthSubjectType.ADMIN,
        { sub: 'admin-1', role: Role.PLATFORM_ADMIN },
        SESSION.sessionId,
      );
    });
  });
});
