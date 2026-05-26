import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataset } from '../context/DatasetContext';
import WorkspaceLayout from '../components/layout/WorkspaceLayout';
import SummarySection from '../sections/SummarySection';
import MetricSection from '../sections/MetricSection';
import LLMJudgeSection from '../sections/LLMJudgeSection';
import { calculateMetrics, getMetricSummary, getProgress } from '../services/evaluationApi';

type Tab = 'Dashboard' | 'BLEU' | 'chrF++' | 'Concept F1' | 'Coverage' | 'LLM Judge';

export default function EvaluationWorkspace() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('Dashboard');
  const [running, setRunning] = useState(false);
  const [progressSnapshot, setProgressSnapshot] = useState({ total: 0, evaluated: 0, pending: 0, progress: 0 });
  const [metricSummary, setMetricSummary] = useState<any>(null);
  const dataset = useDataset();
  const jsonPreview = useMemo(() => JSON.stringify(dataset.examples.slice(0, 2), null, 2), [dataset.examples]);

  useEffect(() => {
    if (!dataset.session) return;
    const loadBackendData = async () => {
      const next = await getProgress(dataset.session!.sessionId);
      setProgressSnapshot(next);
      const summary = await getMetricSummary(dataset.session!.sessionId);
      setMetricSummary(summary);
    };
    void loadBackendData();
  }, [dataset.session?.sessionId]);

  if (dataset.totalCount === 0) {
    navigate('/');
    return null;
  }

  const refreshProgress = async () => {
    if (!dataset.session) return;
    const next = await getProgress(dataset.session.sessionId);
    setProgressSnapshot(next);
    const summary = await getMetricSummary(dataset.session.sessionId);
    setMetricSummary(summary);
  };

  const runMetrics = async () => {
    if (!dataset.session) return;
    setRunning(true);
    try {
      for (const example of dataset.examples) {
        const result = await calculateMetrics(example, dataset.session.sessionId);
        dataset.updateExample(example.id, { metrics: result.metrics });
      }
      await refreshProgress();
    } catch (error) {
      console.error('No se pudieron calcular las métricas', error);
      throw error;
    } finally {
      setRunning(false);
    }
  };

  const metricMap: Record<Exclude<Tab, 'Dashboard'>, 'bleu' | 'chrf' | 'conceptF1' | 'coverage'> = {
    BLEU: 'bleu',
    'chrF++': 'chrf',
    'Concept F1': 'conceptF1',
    Coverage: 'coverage',
    'LLM Judge': 'coverage',
  };

  return (
    <WorkspaceLayout active={tab} onChangeTab={setTab} onReset={() => { dataset.resetDataset(); navigate('/'); }}>
      {tab === 'Dashboard' && <SummarySection total={dataset.totalCount} evaluated={dataset.evaluatedCount} onGo={setTab} examples={dataset.examples} session={dataset.session} backendProgress={progressSnapshot.total ? progressSnapshot : dataset.backendProgress} jsonPreview={jsonPreview} />}
      {tab !== 'Dashboard' && tab !== 'LLM Judge' && (
        <MetricSection
          metricKey={metricMap[tab]}
          examples={dataset.examples}
          currentIndex={dataset.currentExampleIndex}
          setCurrentIndex={dataset.setCurrentExampleIndex}
          onRun={runMetrics}
          running={running}
          session={dataset.session}
          summary={metricSummary ?? dataset.metricSummary as any}
        />
      )}
      {tab === 'LLM Judge' && <LLMJudgeSection examples={dataset.examples} sessionId={dataset.session?.sessionId ?? null} />}
    </WorkspaceLayout>
  );
}
