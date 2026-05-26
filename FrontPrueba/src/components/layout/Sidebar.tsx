import { BarChart3, ClipboardCheck, LayoutDashboard, Sigma, ArrowUpCircle, TrendingUp, BrainCircuit } from 'lucide-react';

type Tab = 'Dashboard' | 'BLEU' | 'chrF++' | 'Concept F1' | 'Coverage' | 'LLM Judge';

const items: { label: Tab; icon: any }[] = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'BLEU', icon: ClipboardCheck },
  { label: 'chrF++', icon: BarChart3 },
  { label: 'Concept F1', icon: Sigma },
  { label: 'Coverage', icon: TrendingUp },
  { label: 'LLM Judge', icon: BrainCircuit },
];

export default function Sidebar({ active, onChange }: { active: Tab; onChange: (tab: Tab) => void }) {
  return (
    <aside className='fixed left-0 top-0 flex h-screen w-64 flex-col border-r border-[#1F2937] bg-[#050505] p-4'>
      <div>
        <h1 className='text-4xl font-bold'><span className='text-[#EF0015]'>Semantic</span> PictoEval</h1>
        <p className='text-sm text-slate-400'>Evaluación de Pictogramas IA</p>
      </div>
      <nav className='mt-8 flex flex-1 flex-col gap-2'>
        {items.map(({ label, icon: Icon }) => (
          <button key={label} onClick={() => onChange(label)} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left text-lg ${active === label ? 'bg-[#EF0015] text-white' : 'text-slate-300 hover:bg-[#111827]'}`}>
            <Icon size={18} /> {label}
          </button>
        ))}
        <div className='mt-4 border-t border-[#1F2937] pt-4'>
          <div className='flex items-center gap-2 text-slate-400'><ArrowUpCircle size={16}/> Navegación interna</div>
        </div>
      </nav>
      <div className='border-t border-[#1F2937] pt-3 text-sm text-slate-400'>© 2026 Semantic PictoEval<br/>Versión 1.0.0</div>
    </aside>
  );
}
