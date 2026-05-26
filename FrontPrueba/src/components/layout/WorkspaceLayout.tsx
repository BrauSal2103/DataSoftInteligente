import { ReactNode } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

type Tab = 'Dashboard' | 'BLEU' | 'chrF++' | 'Concept F1' | 'Coverage' | 'Semantic Similarity' | 'LLM Judge';

export default function WorkspaceLayout({ active, onChangeTab, onReset, children }: { active: Tab; onChangeTab: (tab: Tab) => void; onReset: () => void; children: ReactNode }) {
  return (
    <div className='min-h-screen bg-[#080808] text-white'>
      <Sidebar active={active} onChange={onChangeTab} />
      <main className='ml-64 min-h-screen'>
        <Header onReset={onReset} />
        <div className='p-8'>{children}</div>
      </main>
    </div>
  );
}
