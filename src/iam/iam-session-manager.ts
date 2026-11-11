import { ErrorCode, ErrorCodeUtils, PurchasesError } from "../entities/errors";
import { Logger } from "../helpers/logger";
import { getNullableWindow } from "../helpers/browser-globals";
import type { IamAuthClient, IamIdentity } from "./iam-auth-client";
import { IamLock } from "./iam-lock";
import {
  deserializeSession,
  type IamSession,
  serializeSession,
  sessionFromTokensResponse,
} from "./iam-session";
import type { IamStorage } from "./iam-storage";

const LOCKED_STATUS_CODE = 423;
// khepri's ConcurrentRefreshError asks for a 1s backoff.
const DEFAULT_LOCKED_RETRY_DELAY_MS = 1000;

/** The token a request was sent with, and the user it was sent for. */
export interface IamCredentials {
  readonly accessToken: string;
  readonly appUserId: string;
}

/** What the networking layer needs to authorize requests with IAM tokens. */
export interface IamRequestAuthorizer {
  /**
   * The credentials of the session in memory, or null while none is loaded.
   * Lets callers that must not yield (keepalive event flushes) skip the wait.
   */
  getCurrentCredentials(): IamCredentials | null;

  getCredentials(): Promise<IamCredentials>;

  /**
   * Called after a request sent with `failed` got a 401. Returns the
   * credentials to retry with, or null when the request must not be retried
   * because the session ended or now belongs to a different user.
   */
  refreshAfterUnauthorized(
    failed: IamCredentials,
  ): Promise<IamCredentials | null>;
}

export type IamSessionListener = (
  session: IamSession | null,
  previous: IamSession | null,
) => void;

interface IamSessionManagerProps {
  authClient: IamAuthClient;
  storage: IamStorage;
  storageKey: string;
  /** Listen for `storage` events: only meaningful for `localStorage`. */
  syncAcrossTabs: boolean;
  lock?: IamLock;
  lockedRetryDelayMs?: number;
}

function statusCodeOf(error: unknown): number | undefined {
  return error instanceof PurchasesError ? error.extra?.statusCode : undefined;
}

function isRejectedRefreshToken(error: unknown): boolean {
  const statusCode = statusCodeOf(error);
  return statusCode === 400 || statusCode === 401 || statusCode === 403;
}

function credentialsOf(session: IamSession): IamCredentials {
  return { accessToken: session.accessToken, appUserId: session.appUserId };
}

/**
 * Owns the IAM session: loads it from storage, signs in anonymously when
 * there is none, refreshes it after a 401 and switches it on login/logout.
 *
 * Every operation that reads and replaces the stored session runs inside
 * {@link IamLock} and re-reads storage first, so tabs never refresh the same
 * token twice and always converge on the latest stored session.
 */
export class IamSessionManager implements IamRequestAuthorizer {
  private readonly authClient: IamAuthClient;
  private readonly storage: IamStorage;
  private readonly storageKey: string;
  private readonly lock: IamLock;
  private readonly lockedRetryDelayMs: number;
  private readonly listeners = new Set<IamSessionListener>();
  private readonly onStorageEvent?: (event: StorageEvent) => void;

  private session: IamSession | null = null;
  private pendingSession: Promise<IamSession> | null = null;

  constructor({
    authClient,
    storage,
    storageKey,
    syncAcrossTabs,
    lock,
    lockedRetryDelayMs = DEFAULT_LOCKED_RETRY_DELAY_MS,
  }: IamSessionManagerProps) {
    this.authClient = authClient;
    this.storage = storage;
    this.storageKey = storageKey;
    this.lock = lock ?? new IamLock(storageKey);
    this.lockedRetryDelayMs = lockedRetryDelayMs;

    const win = getNullableWindow();
    if (syncAcrossTabs && win) {
      this.onStorageEvent = (event: StorageEvent) => {
        if (event.key === this.storageKey || event.key === null) {
          this.adopt(deserializeSession(event.newValue));
        }
      };
      win.addEventListener("storage", this.onStorageEvent);
    }
  }

  /** The session in memory, without waiting for one to be loaded. */
  getCurrentSession(): IamSession | null {
    return this.session;
  }

  addListener(listener: IamSessionListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Resolves with the stored session, signing in anonymously if there is none. */
  ensureSession(): Promise<IamSession> {
    if (this.session) {
      return Promise.resolve(this.session);
    }
    if (!this.pendingSession) {
      this.pendingSession = this.lock
        .run(() => this.loadOrSignInAnonymously())
        .finally(() => {
          this.pendingSession = null;
        });
    }
    return this.pendingSession;
  }

  getCurrentCredentials(): IamCredentials | null {
    return this.session ? credentialsOf(this.session) : null;
  }

  async getCredentials(): Promise<IamCredentials> {
    return credentialsOf(await this.ensureSession());
  }

  refreshAfterUnauthorized(
    failed: IamCredentials,
  ): Promise<IamCredentials | null> {
    return this.lock.run(async () => {
      const storedRaw = await this.readStoredRaw();
      const current = deserializeSession(storedRaw);
      if (current === null || current.appUserId !== failed.appUserId) {
        this.adopt(current);
        return null;
      }
      if (current.accessToken !== failed.accessToken) {
        // Another tab, or an earlier request in this one, already refreshed.
        this.adopt(current);
        return credentialsOf(current);
      }
      if (!current.refreshToken) {
        await this.clearStoredSession();
        return null;
      }

      let refreshed: IamSession;
      try {
        refreshed = sessionFromTokensResponse(
          await this.refreshWithLockedRetry(current.refreshToken),
          current,
        );
      } catch (error) {
        if (isRejectedRefreshToken(error)) {
          Logger.warnLog(
            "The IAM session can no longer be refreshed. Signing in again.",
          );
          await this.clearStoredSession();
          return null;
        }
        throw error;
      }

      // Without Web Locks another tab may have written meanwhile; theirs wins.
      const latestRaw = await this.readStoredRaw();
      if (latestRaw !== storedRaw) {
        const latest = deserializeSession(latestRaw);
        this.adopt(latest);
        return latest && latest.appUserId === failed.appUserId
          ? credentialsOf(latest)
          : null;
      }

      await this.persist(refreshed);
      return refreshed.appUserId === failed.appUserId
        ? credentialsOf(refreshed)
        : null;
    });
  }

  logIn(identity: IamIdentity): Promise<IamSession> {
    return this.lock.run(async () => {
      const current = deserializeSession(await this.readStoredRaw());
      const session = sessionFromTokensResponse(
        await this.authClient.logIn(identity, current?.idToken ?? null),
      );
      await this.persist(session);
      return session;
    });
  }

  /**
   * Revokes the refresh token, then signs in anonymously, like the mobile
   * SDKs. A failed revocation keeps the current session.
   */
  logOut(): Promise<IamSession> {
    return this.lock.run(async () => {
      const current = deserializeSession(await this.readStoredRaw());
      if (!current || current.isAnonymous) {
        throw new PurchasesError(
          ErrorCode.LogOutWithAnonymousUserError,
          ErrorCodeUtils.getPublicMessage(
            ErrorCode.LogOutWithAnonymousUserError,
          ),
        );
      }
      if (current.refreshToken) {
        await this.authClient.revokeRefreshToken(current.refreshToken);
      }
      await this.clearStoredSession();
      return await this.signInAnonymously();
    });
  }

  dispose(): void {
    if (this.onStorageEvent) {
      getNullableWindow()?.removeEventListener("storage", this.onStorageEvent);
    }
    this.listeners.clear();
  }

  private async loadOrSignInAnonymously(): Promise<IamSession> {
    const stored = deserializeSession(await this.readStoredRaw());
    if (stored) {
      this.adopt(stored);
      return stored;
    }
    return await this.signInAnonymously();
  }

  private async signInAnonymously(): Promise<IamSession> {
    const session = sessionFromTokensResponse(
      await this.authClient.logInAnonymously(),
    );
    await this.persist(session);
    return session;
  }

  private async refreshWithLockedRetry(refreshToken: string) {
    try {
      return await this.authClient.refresh(refreshToken);
    } catch (error) {
      if (statusCodeOf(error) !== LOCKED_STATUS_CODE) {
        throw error;
      }
      await new Promise((resolve) =>
        setTimeout(resolve, this.lockedRetryDelayMs),
      );
      return await this.authClient.refresh(refreshToken);
    }
  }

  private async readStoredRaw(): Promise<string | null> {
    try {
      return await this.storage.getItem(this.storageKey);
    } catch (error) {
      Logger.warnLog(`Could not read the IAM session: ${error}`);
      return this.session ? serializeSession(this.session) : null;
    }
  }

  private async persist(session: IamSession): Promise<void> {
    try {
      await this.storage.setItem(this.storageKey, serializeSession(session));
    } catch (error) {
      Logger.warnLog(`Could not store the IAM session: ${error}`);
    }
    this.adopt(session);
  }

  private async clearStoredSession(): Promise<void> {
    try {
      await this.storage.removeItem(this.storageKey);
    } catch (error) {
      Logger.warnLog(`Could not remove the IAM session: ${error}`);
    }
    this.adopt(null);
  }

  private adopt(session: IamSession | null): void {
    const previous = this.session;
    this.session = session;
    if (previous?.accessToken === session?.accessToken) {
      return;
    }
    for (const listener of this.listeners) {
      try {
        listener(session, previous);
      } catch (error) {
        Logger.errorLog(`IAM session listener failed: ${error}`);
      }
    }
  }
}
