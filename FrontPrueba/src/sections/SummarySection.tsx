import { BarChart3, CheckCircle2, Clock3, TrendingUp } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Example, SessionInfo } from '../types/dataset';

type Tab = 'Dashboard' | 'BLEU' | 'chrF++' | 'Concept F1' | 'Coverage';

export default function SummarySection({ total, evaluated, onGo, examples, session, backendProgress, jsonPreview }: { total: number; evaluated: number; onGo: (tab: Tab) => void; examples: Example[]; session: SessionInfo | null; backendProgress: { total: number; evaluated: number; pending: number; progress: number }; jsonPreview: string }) {
  const pending = total - evaluated;
  const progress = backendProgress.total ? backendProgress.progress : (total ? Math.round((evaluated / total) * 100) : 0);
  const stats = [
    { label: 'Total de ejemplos', value: total, icon: BarChart3 },
    { label: 'Evaluados', value: evaluated, icon: CheckCircle2 },
    { label: 'Pendientes', value: pending, icon: Clock3 },
    { label: 'Progreso', value: `${progress}%`, icon: TrendingUp },
  ];

  return (
    <div className='space-y-6'>
      <h1 className='text-6xl font-bold'>Dashboard</h1>
      <p className='text-3xl text-slate-300'>Visión general del proyecto de evaluación</p>
      <Card className='grid gap-4 md:grid-cols-3'>
        <div>
          <p className='text-slate-400'>Sesión activa</p>
          <p className='mt-2 text-lg font-semibold'>{session?.sessionId ?? 'sin sesión'}</p>
        </div>
        <div>
          <p className='text-slate-400'>Archivo cargado</p>
          <p className='mt-2 text-lg font-semibold'>{session?.filename ?? '—'}</p>
        </div>
        <div>
          <p className='text-slate-400'>Primer ejemplo</p>
          <p className='mt-2 text-lg font-semibold truncate'>{examples[0]?.texto ?? '—'}</p>
        </div>
      </Card>

      <Card className='p-6'>
        <h3 className='text-3xl font-bold'>JSON ingresado</h3>
        <p className='mt-2 text-slate-300'>Vista previa del dataset cargado. Si subes el mismo JSON, la sesión se recupera y esta vista se mantiene.</p>
        <pre className='mt-4 max-h-[320px] overflow-auto rounded-xl border border-[#1F2937] bg-[#111827] p-4 text-xs text-slate-200 whitespace-pre-wrap'>
{jsonPreview || '—'}
        </pre>
      </Card>

      <div className='grid grid-cols-1 gap-4 xl:grid-cols-2'>
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label} className='flex items-center justify-between p-6'>
            <div><p className='text-xl text-slate-300'>{label}</p><p className='mt-2 text-6xl font-bold'>{value}</p></div>
            <div className='rounded-2xl bg-[#EF0015] p-4'><Icon size={28} /></div>
          </Card>
        ))}
      </div>
      <Card className='p-6'>
        <h3 className='text-4xl font-bold'>Acciones rápidas</h3>
        <div className='mt-4 flex flex-wrap gap-3'>
          <Button onClick={() => onGo('BLEU')}>Ir a BLEU</Button>
          <Button onClick={() => onGo('chrF++')}>Ver chrF++</Button>
          <Button onClick={() => onGo('Concept F1')}>Revisar Concept F1</Button>
          <Button onClick={() => onGo('Coverage')}>Abrir Coverage</Button>
        </div>
      </Card>
    </div>
  );
}
