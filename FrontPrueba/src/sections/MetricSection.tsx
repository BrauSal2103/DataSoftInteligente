import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Example, ModelMetrics, SessionInfo } from '../types/dataset';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import ExampleSelector from '../components/evaluation/ExampleSelector';
import PictogramSequence from '../components/pictograms/PictogramSequence';
import { MetricSummary } from '../services/evaluationApi';

export type MetricKey = keyof Pick<ModelMetrics, 'bleu' | 'chrf' | 'conceptF1' | 'coverage'>;

const metricLabels: Record<MetricKey, string> = {
  bleu: 'BLEU',
  chrf: 'chrF++',
  conceptF1: 'Concept F1',
  coverage: 'Coverage',
};

const metricDescriptions: Record<MetricKey, string> = {
  bleu: 'Coincidencia n-grama entre la referencia y la predicción.',
  chrf: 'Similitud a nivel de caracteres con orden de palabras extendido.',
  conceptF1: 'Coincidencia de conceptos pictográficos sin importar el orden.',
  coverage: 'Cobertura de conceptos de referencia presentes en la predicción.',
};

const colors = ['#EF0015', '#F97316', '#22C55E', '#38BDF8'];

export default function MetricSection({
  metricKey,
  examples,
  currentIndex,
  setCurrentIndex,
  onRun,
  running,
  session,
  summary,
}: {
  metricKey: MetricKey;
  examples: Example[];
  currentIndex: number;
  setCurrentIndex: (n: number) => void;
  onRun: () => Promise<void>;
  running: boolean;
  session: SessionInfo | null;
  summary: MetricSummary | null;
}) {
  const [message, setMessage] = useState('');
  const example = examples[currentIndex];

  const chartData = useMemo(() => {
    const currentSummary = summary?.[metricKey] ?? [];
    if (currentSummary.length) {
      return currentSummary.map((item) => ({ name: item.model, value: item.value ?? 0 }));
    }
    const metrics = example?.metrics ?? {};
    return [
      { name: 'Modelo 1', value: metrics.modelo_1?.[metricKey] ?? 0 },
      { name: 'Modelo 2', value: metrics.modelo_2?.[metricKey] ?? 0 },
      { name: 'Modelo 3', value: metrics.modelo_3?.[metricKey] ?? 0 },
      { name: 'Modelo 4', value: metrics.modelo_4?.[metricKey] ?? 0 },
    ];
  }, [example, metricKey, summary]);

  const valuesReady = chartData.some((item) => item.value !== 0);
  const formatValue = (value: number) => {
    if (!Number.isFinite(value)) return '—';
    if (value === 0) return '0';
    return Math.abs(value) < 0.01 ? value.toExponential(3) : value.toFixed(2);
  };

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-end justify-between gap-4'>
        <div>
          <h1 className='text-5xl font-bold'>{metricLabels[metricKey]}</h1>
          <p className='mt-2 text-2xl text-slate-300'>{metricDescriptions[metricKey]}</p>
        </div>
        <div className='text-right text-sm text-slate-400'>
          <p>Sesión: {session?.sessionId ?? 'sin sesión'}</p>
          <p>{examples.length} ejemplos cargados</p>
        </div>
      </div>

      <Card className='p-5'>
        <div className='flex flex-wrap items-center gap-3'>
          <ExampleSelector ids={examples.map((e) => e.id)} value={currentIndex} onChange={setCurrentIndex} />
          <Button
            disabled={running || !session}
            onClick={async () => {
              if (!session) {
                setMessage('No hay una sesión activa. Vuelve a cargar el dataset para poder ejecutar la métrica.');
                return;
              }
              setMessage('Procesando métricas para toda la sesión...');
              try {
                await onRun();
                setMessage('Proceso terminado. Los resultados quedan guardados por sesión en el backend.');
              } catch (error) {
                console.error(`Error al ejecutar ${metricLabels[metricKey]}`, error);
                setMessage('No se pudo conectar con el backend o el cálculo falló. Revisa que el backend esté activo en http://localhost:8000.');
              }
            }}
          >
            {running ? 'Procesando...' : `Iniciar ${metricLabels[metricKey]}`}
          </Button>
          <span className='ml-auto text-slate-300'>Ejemplo #{example?.id ?? '—'}</span>
        </div>
        <p className='mt-3 text-sm text-slate-400'>{message || 'Al ejecutar se calculan y guardan las métricas por sesión.'}</p>
      </Card>

      <Card className='p-5'>
        <h3 className='text-xl font-bold text-slate-300'>RESUMEN AGREGADO DE LA SESIÓN</h3>
        <p className='mt-2 text-sm text-slate-400'>Este bloque replica el resultado que muestra el notebook para la métrica seleccionada.</p>
        {!valuesReady && <p className='mt-3 rounded-lg border border-[#374151] bg-[#111827] p-3 text-sm text-slate-300'>Todavía no hay resultados para esta métrica. Pulsa <b>Iniciar</b> para calcularlos.</p>}
        <div className='mt-4 overflow-x-auto'>
          <table className='w-full text-left text-sm'>
            <thead><tr className='text-slate-300'><th>Modelo</th><th>Resultado</th><th>Lectura notebook</th></tr></thead>
            <tbody>
              {chartData.map((row) => (
                <tr key={row.name} className='border-t border-[#1F2937]'>
                  <td className='py-2'>{row.name}</td>
                  <td>{formatValue(row.value)}</td>
                  <td>{metricKey === 'bleu' || metricKey === 'chrf' ? 'corpus_score' : 'promedio por ejemplo'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className='grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_1fr]'>
        <div className='space-y-4'>
          <Card className='p-5'>
            <h3 className='text-xl font-bold text-slate-300'>TEXTO ORIGINAL</h3>
            <p className='mt-3 text-4xl'>{example?.texto ?? '—'}</p>
          </Card>

          <Card className='p-5'>
            <h3 className='text-xl font-bold text-slate-300'>PICTOGRAMAS DE REFERENCIA</h3>
            <div className='mt-3'><PictogramSequence items={example?.referencia ?? []} /></div>
          </Card>
        </div>

        <Card className='p-5'>
          <h3 className='text-xl font-bold text-slate-300'>COMPARACIÓN DE MODELOS</h3>
          <div className='mt-4 h-80'>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                <CartesianGrid strokeDasharray='3 3' stroke='#1F2937' />
                <XAxis dataKey='name' tick={{ fill: '#CBD5E1' }} />
                <YAxis tick={{ fill: '#CBD5E1' }} domain={[0, 'dataMax + 10']} />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1F2937', color: '#fff' }} />
                <Bar dataKey='value' radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className='mt-3 text-sm text-slate-400'>{valuesReady ? 'La gráfica refleja el último cálculo almacenado.' : 'Todavía no hay métricas calculadas para este ejemplo.'}</p>
        </Card>
      </div>

      <Card className='p-5'>
        <h3 className='text-xl font-bold text-slate-300'>VALORES POR MODELO</h3>
        <div className='mt-3 overflow-x-auto'>
          <table className='w-full text-left text-sm'>
            <thead><tr className='text-slate-300'><th>Modelo</th><th>Valor</th><th>Estado</th></tr></thead>
            <tbody>
              {chartData.map((row) => (
                <tr key={row.name} className='border-t border-[#1F2937]'>
                  <td className='py-2'>{row.name}</td>
                  <td>{row.value ? row.value.toFixed(2) : '—'}</td>
                  <td>{row.value ? 'Procesado' : 'Pendiente'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
