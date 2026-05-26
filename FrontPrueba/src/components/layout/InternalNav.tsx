const tabs=['Resumen','Evaluación','Resultados','Correlaciones','Análisis de errores'] as const;
export default ({value,onChange}:{value:string;onChange:(v:string)=>void})=><div className='flex flex-wrap gap-2'>{tabs.map(t=><button key={t} onClick={()=>onChange(t)} className={`rounded-xl px-4 py-2 ${value===t?'bg-[#EF0015]':'bg-[#18181B] border border-[#1F2937]'}`}>{t}</button>)}</div>;
