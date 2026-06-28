import { useState } from 'react';
import { Example } from '../../types/dataset';
import Button from '../ui/Button';
import Card from '../ui/Card';

const rows = [
  { key: 'modelo_1', label: 'Modelo 1' },
  { key: 'modelo_2', label: 'Modelo 2' },
  { key: 'modelo_3', label: 'Modelo 3' },
  { key: 'modelo_4', label: 'Modelo 4' },
] as const;

export default function MetricsPanel({ example, onCalc }: { example: Example; onCalc: () => void }) {
  const [msg, setMsg] = useState('');
  return (
    <Card>
      <h3 className='text-2xl font-bold'>MÉTRICAS AUTOMÁTICAS</h3>
      <div className='mt-3 overflow-x-auto'>
        <table className='w-full text-sm'>
          <thead className='text-slate-300'><tr><th className='text-left'>Modelo</th><th>BLEU</th><th>chrF++</th><th>Concept F1</th><th>Coverage</th><th>Sem. Sim.</th></tr></thead>
          <tbody>
            {rows.map((r) => {
              const m = example.metrics?.[r.key];
              return <tr key={r.key} className='border-t border-[#1F2937]'><td className='py-2'>{r.label}</td><td className='text-center'>{m?.bleu ?? '—'}</td><td className='text-center'>{m?.chrf ?? '—'}</td><td className='text-center'>{m?.conceptF1 ?? '—'}</td><td className='text-center'>{m?.coverage ?? '—'}</td><td className='text-center'>{m?.semanticSimilarity ?? '—'}</td></tr>;
            })}
          </tbody>
        </table>
      </div>
      <Button className='mt-4' onClick={() => { onCalc(); setMsg('Métricas pendientes de conexión con backend.'); }}>Calcular métricas</Button>
      {msg && <p className='mt-2 text-sm text-slate-300'>{msg}</p>}
    </Card>
  );
}
