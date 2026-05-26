import { useState } from 'react';
import { pictogramUrl } from '../../utils/pictogramUrl';

export default function PictogramImage({ id, label }: { id: number | string; label: string }) {
  const [error, setError] = useState(false);
  return (
    <div className='w-24 rounded-xl border border-[#1F2937] bg-[#111827] p-2 text-center'>
      {!error ? (
        <img className='mx-auto h-16 w-16 rounded bg-white p-1' src={pictogramUrl(id)} alt={label} onError={() => setError(true)} />
      ) : (
        <div className='mx-auto flex h-16 w-16 items-center justify-center rounded bg-slate-700 text-xs'>N/A</div>
      )}
      <div className='mt-2 text-xs text-slate-300'>{label}</div>
    </div>
  );
}
