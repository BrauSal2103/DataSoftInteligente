import Card from '../components/ui/Card';

const rows = ['BLEU vs Humano', 'chrF++ vs Humano', 'Concept F1 vs Humano', 'Coverage vs Humano', 'LLM-Judge vs Humano'];

export default function CorrelationsSection() {
  return (
    <div className='space-y-5'>
      <h1 className='text-6xl font-bold'>Correlaciones</h1>
      <Card>
        <p className='mb-4 text-slate-300'>No hay suficientes datos para calcular correlaciones.</p>
        <table className='w-full text-left'>
          <thead><tr className='text-slate-300'><th>Métrica</th><th>Pearson</th><th>Spearman</th></tr></thead>
          <tbody>{rows.map((r) => <tr key={r} className='border-t border-[#1F2937]'><td className='py-2'>{r}</td><td>—</td><td>—</td></tr>)}</tbody>
        </table>
      </Card>
    </div>
  );
}
