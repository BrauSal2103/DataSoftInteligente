import { ReactNode } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

type Tab = 'Dashboard' | 'BLEU' | 'chrF++' | 'Concept F1' | 'Coverage' | 'Semantic Similarity' | 'LLM Judge';

export default function WorkspaceLayout({ active, onChangeTab, onReset, children }: { active: Tab; onChangeTab: (tab: Tab) => void; onReset: () => void; children: ReactNode }) {
  return (
    <div className='min-h-screen bg-[#080808] text-white'>
      <Sidebar active={active} onChange={onChangeTab} />
      <main className='min-h-screen lg:ml-64'>
        <Header onReset={onReset} />
        <div className='p-4 sm:p-6 lg:p-8'>{children}</div>
      </main>
    </div>
  );
}
