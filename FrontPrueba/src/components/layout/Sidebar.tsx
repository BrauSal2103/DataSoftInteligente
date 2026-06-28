import { BarChart3, ClipboardCheck, LayoutDashboard, Sigma, ArrowUpCircle, TrendingUp, BrainCircuit, Sparkles } from 'lucide-react';

type Tab = 'Dashboard' | 'BLEU' | 'chrF++' | 'Concept F1' | 'Coverage' | 'Semantic Similarity' | 'LLM Judge';

const items: { label: Tab; icon: any }[] = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'BLEU', icon: ClipboardCheck },
  { label: 'chrF++', icon: BarChart3 },
  { label: 'Concept F1', icon: Sigma },
  { label: 'Coverage', icon: TrendingUp },
  { label: 'Semantic Similarity', icon: Sparkles },
  { label: 'LLM Judge', icon: BrainCircuit },
];

export default function Sidebar({ active, onChange }: { active: Tab; onChange: (tab: Tab) => void }) {
  return (
    <aside className='sticky top-0 z-20 border-b border-[#1F2937] bg-[#050505] p-3 lg:fixed lg:left-0 lg:top-0 lg:flex lg:h-screen lg:w-64 lg:flex-col lg:border-b-0 lg:border-r lg:p-4'>
      <div className='min-w-0'>
        <h1 className='text-2xl font-bold sm:text-3xl lg:text-4xl'><span className='text-[#EF0015]'>Semantic</span> PictoEval</h1>
        <p className='text-sm text-slate-400'>Evaluación de Pictogramas IA</p>
      </div>
      <nav className='mt-4 flex gap-2 overflow-x-auto pb-1 lg:mt-8 lg:flex-1 lg:flex-col lg:overflow-visible lg:pb-0'>
        {items.map(({ label, icon: Icon }) => (
          <button key={label} onClick={() => onChange(label)} className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-left text-sm sm:text-base lg:gap-3 lg:px-4 lg:py-3 lg:text-lg ${active === label ? 'bg-[#EF0015] text-white' : 'text-slate-300 hover:bg-[#111827]'}`}>
            <Icon size={18} /> <span className='whitespace-nowrap'>{label}</span>
          </button>
        ))}
        <div className='mt-4 hidden border-t border-[#1F2937] pt-4 lg:block'>
          <div className='flex items-center gap-2 text-slate-400'><ArrowUpCircle size={16}/> Navegación interna</div>
        </div>
      </nav>
      <div className='hidden border-t border-[#1F2937] pt-3 text-sm text-slate-400 lg:block'>© 2026 Semantic PictoEval<br/>Versión 1.0.0</div>
    </aside>
  );
}
