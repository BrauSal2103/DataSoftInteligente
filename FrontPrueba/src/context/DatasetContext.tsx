import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { Example, HumanEvaluation, SessionInfo } from '../types/dataset';
import { getExamples, getMetricSummary, getProgress } from '../services/evaluationApi';

const CURRENT_SESSION_KEY = 'pictoeval.current-session';

const readJson = <T,>(key: string): T | null => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};

const writeJson = (key: string, value: unknown) => {
  localStorage.setItem(key, JSON.stringify(value));
};

type Ctx = {
  examples: Example[];
  currentExampleIndex: number;
  setCurrentExampleIndex: (n: number) => void;
  setDataset: (e: Example[], session?: SessionInfo) => void;
  updateExample: (exampleId: string | number, patch: Partial<Example>) => void;
  saveHumanEvaluation: (exampleId: string | number, evaluation: Omit<HumanEvaluation, 'timestamp'>) => void;
  evaluations: Record<string, HumanEvaluation>;
  evaluatedCount: number;
  totalCount: number;
  session: SessionInfo | null;
  backendProgress: { total: number; evaluated: number; pending: number; progress: number };
  metricSummary: unknown;
  loadingSession: boolean;
  resetDataset: () => void;
};
const DatasetContext = createContext<Ctx | null>(null);
export const DatasetProvider = ({ children }: { children: ReactNode }) => {
  const [examples, setExamples] = useState<Example[]>([]);
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0);
  const [evaluations, setEvaluations] = useState<Record<string, HumanEvaluation>>({});
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [backendProgress, setBackendProgress] = useState({ total: 0, evaluated: 0, pending: 0, progress: 0 });
  const [metricSummary, setMetricSummary] = useState<unknown>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
    const restoredSession = readJson<SessionInfo>(CURRENT_SESSION_KEY);
    const restoredEvaluations = restoredSession ? readJson<Record<string, HumanEvaluation>>(`${CURRENT_SESSION_KEY}.evaluations.${restoredSession.sessionId}`) : null;

    const hydrate = async () => {
      if (!restoredSession) {
        setLoadingSession(false);
        return;
      }

      try {
        const remoteExamples = await getExamples(restoredSession.sessionId);
        setExamples(remoteExamples);
        setSession(restoredSession);
        if (restoredEvaluations) {
          setEvaluations(restoredEvaluations);
        }
        const progress = await getProgress(restoredSession.sessionId);
        setBackendProgress(progress);
        const summary = await getMetricSummary(restoredSession.sessionId);
        setMetricSummary(summary);
      } catch {
        localStorage.removeItem(CURRENT_SESSION_KEY);
      } finally {
        setLoadingSession(false);
      }
    };

    void hydrate();
  }, []);

  useEffect(() => {
    if (session) {
      writeJson(CURRENT_SESSION_KEY, session);
      writeJson(`${CURRENT_SESSION_KEY}.evaluations.${session.sessionId}`, evaluations);
    }
  }, [session, evaluations]);

  const setDataset = (nextExamples: Example[], nextSession?: SessionInfo) => {
    setExamples(nextExamples);
    if (nextSession) {
      setSession(nextSession);
    }
  };

  const updateExample = (exampleId: string | number, patch: Partial<Example>) => {
    setExamples((previous) => previous.map((example) => (String(example.id) === String(exampleId) ? { ...example, ...patch } : example)));
  };

  const saveHumanEvaluation = (exampleId: string | number, evaluation: Omit<HumanEvaluation, 'timestamp'>) => setEvaluations((p) => ({ ...p, [String(exampleId)]: { ...evaluation, timestamp: new Date().toISOString() } }));
  const resetDataset = () => { setExamples([]); setEvaluations({}); setCurrentExampleIndex(0); setSession(null); setBackendProgress({ total: 0, evaluated: 0, pending: 0, progress: 0 }); localStorage.removeItem(CURRENT_SESSION_KEY); };
  const value = useMemo(() => ({ examples, currentExampleIndex, setCurrentExampleIndex, setDataset, updateExample, saveHumanEvaluation, evaluations, evaluatedCount: Object.keys(evaluations).length, totalCount: examples.length, session, backendProgress, metricSummary, loadingSession, resetDataset }), [examples, currentExampleIndex, evaluations, session, backendProgress, metricSummary, loadingSession]);
  return <DatasetContext.Provider value={value}>{children}</DatasetContext.Provider>;
};
export const useDataset = () => { const ctx = useContext(DatasetContext); if (!ctx) throw new Error('DatasetContext missing'); return ctx; };
