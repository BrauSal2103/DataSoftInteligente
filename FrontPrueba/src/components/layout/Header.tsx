import Button from '../ui/Button';

export default function Header({ onReset }: { onReset: () => void }) {
  return (
    <header className='sticky top-0 z-10 flex flex-col gap-4 border-b border-[#1F2937] bg-[#111827] px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8'>
      <div className='min-w-0'>
        <h2 className='text-3xl font-bold sm:text-4xl'>Plataforma de Evaluación</h2>
        <p className='mt-1 text-base text-slate-300 sm:text-xl'>Evaluación Semántica de la Generación de Pictogramas en Español mediante Métricas Automáticas y LLM-Judge</p>
      </div>
      <Button className='w-full sm:w-fit' onClick={onReset}>Cargar otro dataset</Button>
    </header>
  );
}
