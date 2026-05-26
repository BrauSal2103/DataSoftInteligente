import Button from '../ui/Button';

export default function Header({ onReset }: { onReset: () => void }) {
  return (
    <header className='sticky top-0 z-10 flex items-center justify-between border-b border-[#1F2937] bg-[#111827] px-8 py-4'>
      <div>
        <h2 className='text-4xl font-bold'>Plataforma de Evaluación</h2>
        <p className='text-xl text-slate-300'>Análisis semántico de pictogramas generados por IA</p>
      </div>
      <Button onClick={onReset}>Cargar otro dataset</Button>
    </header>
  );
}
