import { SessionInfo } from '../types/dataset';

const SESSION_INDEX_KEY = 'pictoeval.session.index';

const readIndex = (): Record<string, SessionInfo> => {
  try {
    const raw = localStorage.getItem(SESSION_INDEX_KEY);
    return raw ? (JSON.parse(raw) as Record<string, SessionInfo>) : {};
  } catch {
    return {};
  }
};

const writeIndex = (next: Record<string, SessionInfo>) => {
  localStorage.setItem(SESSION_INDEX_KEY, JSON.stringify(next));
};

export const computeFileHash = async (file: File) => {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
};

export const getStoredSessionByHash = (sourceHash: string) => readIndex()[sourceHash] ?? null;

export const rememberSession = (session: SessionInfo) => {
  const index = readIndex();
  index[session.sourceHash] = session;
  writeIndex(index);
  localStorage.setItem('pictoeval.current-session', JSON.stringify(session));
};

export const getCurrentSession = (): SessionInfo | null => {
  try {
    const raw = localStorage.getItem('pictoeval.current-session');
    return raw ? (JSON.parse(raw) as SessionInfo) : null;
  } catch {
    return null;
  }
};
