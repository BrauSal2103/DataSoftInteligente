import { useEffect, useState } from 'react';
import LikertScale from './LikertScale';
import Button from '../ui/Button';

export default function HumanEvaluationForm({ onSave, initial }: { onSave: (v: { semanticAdequacy: number; clarity: number; comments: string }) => void; initial?: { semanticAdequacy: number; clarity: number; comments: string } }) {
  const [semantic, setSemantic] = useState(3);
  const [clarity, setClarity] = useState(3);
  const [comments, setComments] = useState('');
  const [ok, setOk] = useState(false);

  useEffect(() => {
    setSemantic(initial?.semanticAdequacy ?? 3);
    setClarity(initial?.clarity ?? 3);
    setComments(initial?.comments ?? '');
    setOk(false);
  }, [initial?.semanticAdequacy, initial?.clarity, initial?.comments]);

  return (
    <div className='rounded-2xl border border-[#1F2937] bg-[#18181B] p-5'>
      <h3 className='text-2xl font-bold'>Evaluación humana</h3>
      <p className='mt-3'>Adecuación semántica</p>
      <LikertScale value={semantic} onChange={setSemantic} />
      <p className='mt-3'>Claridad</p>
      <LikertScale value={clarity} onChange={setClarity} />
      <textarea className='mt-3 w-full rounded-xl border border-[#1F2937] bg-[#111827] p-2 text-slate-100' rows={4} value={comments} onChange={(e) => setComments(e.target.value)} placeholder='Comentario' />
      <Button className='mt-3' onClick={() => { onSave({ semanticAdequacy: semantic, clarity, comments }); setOk(true); }}>Guardar evaluación</Button>
      {ok && <p className='mt-2 text-sm text-green-400'>Evaluación guardada correctamente.</p>}
    </div>
  );
}
