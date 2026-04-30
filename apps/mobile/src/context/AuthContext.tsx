import React, { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AuthUser } from '@carelink/shared';
import { ErrorCodes } from '@carelink/shared';
import {
  loadStoredSession,
  login as authLogin,
  logout as authLogout,
  refresh as authRefresh,
  register as authRegister,
} from '../services/auth';
import { clearElderSession, mintPairCode, verifyPairCode } from '../services/elder';
import { createElder, createFamily, getFamily } from '../services/family';
import { ApiClientError } from '../services/apiClient';
import { canUseLiveApi } from '../services/apiConfig';
import { storage, StorageKeys } from '../services/storage';

// Two run modes:
//
//   - 'mock': everything short-circuits. No login screen, no network. App
//     boots straight into the demo experience (current behaviour).
//   - 'live': real /auth/* + Authorization headers. Caregiver must log in.
//
// The mode is persisted in storage so toggling via TweaksPanel survives
// reloads. Default is 'mock' if no live API is configured, 'mock' on
// first run otherwise (we don't want a fresh install to demand a login
// before the user opts into live mode).

export type AuthMode = 'mock' | 'live';

// Caregiver bootstrap state — surfaced after register/login when we
// auto-create their family + elder, or when they tap "regenerate" from
// the TweaksPanel. Cleared by dismissPairCode().
export interface PairCodeInfo {
  code: string;
  expiresAt: string;
  elderName: string;
}

interface AuthState {
  mode: AuthMode;
  user: AuthUser | null;
  elderId: string | null; // set after a successful pair-code verify (elder side)
  familyId: string | null; // caregiver-side cached family
  caredElderId: string | null; // caregiver-side: the elder under their care
  pairCode: PairCodeInfo | null; // surfaced once after bootstrap
  loading: boolean; // true while we hydrate from storage on boot
  error: string | null;
}

interface AuthContextValue extends AuthState {
  liveAvailable: boolean;
  setMode: (m: AuthMode) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  pairElder: (code: string) => Promise<void>;
  unpairElder: () => Promise<void>;
  regeneratePairCode: () => Promise<void>;
  dismissPairCode: () => void;
  clearError: () => void;
}

const AuthCtx = createContext<AuthContextValue>({
  mode: 'mock',
  user: null,
  elderId: null,
  familyId: null,
  caredElderId: null,
  pairCode: null,
  loading: true,
  error: null,
  liveAvailable: false,
  setMode: async () => {},
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  pairElder: async () => {},
  unpairElder: async () => {},
  regeneratePairCode: async () => {},
  dismissPairCode: () => {},
  clearError: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const liveAvailable = canUseLiveApi();
  const [state, setState] = useState<AuthState>({
    mode: 'mock',
    user: null,
    elderId: null,
    familyId: null,
    caredElderId: null,
    pairCode: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    (async () => {
      const storedMode = (await storage.get(StorageKeys.apiMode)) as AuthMode | null;
      const mode: AuthMode = storedMode === 'live' && liveAvailable ? 'live' : 'mock';
      let user: AuthUser | null = null;
      let elderId: string | null = null;
      let familyId: string | null = null;
      let caredElderId: string | null = null;
      if (mode === 'live') {
        const session = await loadStoredSession();
        if (session) {
          try {
            await authRefresh(session.refreshToken);
            user = session.user;
          } catch {
            user = null;
          }
        }
        // Elder JWT is long-lived (no refresh); presence in storage = paired.
        elderId = await storage.get(StorageKeys.elderId);
        familyId = await storage.get(StorageKeys.familyId);
        caredElderId = await storage.get(StorageKeys.caredElderId);
      }
      setState({ mode, user, elderId, familyId, caredElderId, pairCode: null, loading: false, error: null });
    })();
  }, [liveAvailable]);

  const setMode = useCallback(async (m: AuthMode) => {
    await storage.set(StorageKeys.apiMode, m);
    setState((s) => ({ ...s, mode: m, error: null, user: m === 'mock' ? null : s.user }));
  }, []);

  // Auto-bootstrap a family + elder for caregivers who don't have one yet.
  // Idempotent: re-uses cached familyId/caredElderId from storage when
  // present. Always mints a fresh pair code (the previous one might have
  // expired). Returns the new pair code which the caller surfaces.
  const bootstrapFamily = useCallback(async (callerName: string): Promise<PairCodeInfo | null> => {
    let famId = await storage.get(StorageKeys.familyId);
    let elderId = await storage.get(StorageKeys.caredElderId);
    let elderName = '我的家人';

    if (!famId) {
      const fam = await createFamily('我的家庭');
      famId = fam.id;
      await storage.set(StorageKeys.familyId, famId);
    }

    if (!elderId) {
      // Use the caregiver's family-name + 「的家人」 as a placeholder.
      // User can rename in settings.
      elderName = callerName ? `${callerName}的家人` : '我的家人';
      const e = await createElder(famId, { name: elderName });
      elderId = e.id;
      await storage.set(StorageKeys.caredElderId, elderId);
    } else {
      // Re-fetch elder name for the pair-code banner.
      try {
        const fam = await getFamily(famId);
        const e = fam.elders.find((x) => x.id === elderId);
        if (e) elderName = e.name;
      } catch {
        // best-effort
      }
    }

    const pair = await mintPairCode(elderId);
    setState((s) => ({
      ...s,
      familyId: famId,
      caredElderId: elderId,
      pairCode: { code: pair.pairCode, expiresAt: pair.expiresAt, elderName },
    }));
    return { code: pair.pairCode, expiresAt: pair.expiresAt, elderName };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setState((s) => ({ ...s, error: null }));
    try {
      const data = await authLogin(email, password);
      setState((s) => ({ ...s, user: data.user, error: null }));
      try {
        await bootstrapFamily(data.user.name);
      } catch (bootErr) {
        // Don't block the login — surface as banner-less. Bootstrap can
        // be retried via TweaksPanel "重新產生配對碼".
        console.warn('[AuthContext] bootstrap failed', bootErr);
      }
    } catch (e) {
      const msg = formatAuthError(e);
      setState((s) => ({ ...s, error: msg }));
      throw e;
    }
  }, [bootstrapFamily]);

  const register = useCallback(async (name: string, email: string, password: string) => {
    setState((s) => ({ ...s, error: null }));
    try {
      const data = await authRegister(name, email, password);
      setState((s) => ({ ...s, user: data.user, error: null }));
      try {
        await bootstrapFamily(data.user.name);
      } catch (bootErr) {
        console.warn('[AuthContext] bootstrap failed', bootErr);
      }
    } catch (e) {
      const msg = formatAuthError(e);
      setState((s) => ({ ...s, error: msg }));
      throw e;
    }
  }, [bootstrapFamily]);

  const logout = useCallback(async () => {
    await authLogout();
    setState((s) => ({ ...s, user: null, error: null }));
  }, []);

  const pairElder = useCallback(async (code: string) => {
    setState((s) => ({ ...s, error: null }));
    try {
      const data = await verifyPairCode(code.trim().toUpperCase());
      setState((s) => ({ ...s, elderId: data.elderId, error: null }));
    } catch (e) {
      const msg = formatAuthError(e);
      setState((s) => ({ ...s, error: msg }));
      throw e;
    }
  }, []);

  const unpairElder = useCallback(async () => {
    await clearElderSession();
    setState((s) => ({ ...s, elderId: null, error: null }));
  }, []);

  const regeneratePairCode = useCallback(async () => {
    const callerName = state.user?.name ?? '';
    try {
      await bootstrapFamily(callerName);
    } catch (e) {
      const msg = formatAuthError(e);
      setState((s) => ({ ...s, error: msg }));
      throw e;
    }
  }, [bootstrapFamily, state.user]);

  const dismissPairCode = useCallback(() => setState((s) => ({ ...s, pairCode: null })), []);

  const clearError = useCallback(() => setState((s) => ({ ...s, error: null })), []);

  return (
    <AuthCtx.Provider
      value={{
        ...state,
        liveAvailable,
        setMode,
        login,
        register,
        logout,
        pairElder,
        unpairElder,
        regeneratePairCode,
        dismissPairCode,
        clearError,
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  return useContext(AuthCtx);
}

function formatAuthError(e: unknown): string {
  if (e instanceof ApiClientError) {
    if (e.code === ErrorCodes.AUTH_INVALID_CREDENTIALS) return '帳號或密碼錯誤';
    if (e.code === ErrorCodes.AUTH_PAIR_CODE_INVALID) return '配對碼錯誤或已過期';
    if (e.code === ErrorCodes.VALIDATION_ERROR) return '輸入格式不正確';
    if (e.code === ErrorCodes.ALREADY_EXISTS) return '此電子信箱已被註冊';
    if (e.status === 0) return '無法連線後端，請確認伺服器是否啟動';
    return e.message || '登入失敗';
  }
  return (e as Error)?.message || '登入失敗';
}
