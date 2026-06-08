import { useEffect, useState } from 'react';
import LikertScale from './LikertScale';
import Button from '../ui/Button';
import { HumanEvaluation, ModelKey, SessionInfo } from '../../types/dataset';
import { getHumanEvaluation, saveHumanEvaluation } from '../../services/evaluationApi';

const models: Array<{ key: ModelKey; label: string }> = [
  { key: 'modelo_1', label: 'Modelo 1' },
  { key: 'modelo_2', label: 'Modelo 2' },
  { key: 'modelo_3', label: 'Modelo 3' },
  { key: 'modelo_4', label: 'Modelo 4' },
];

export default function HumanEvaluationForm({ exampleId, session, onSaved }: { exampleId: string | number; session: SessionInfo | null; onSaved: (evaluation: HumanEvaluation) => void }) {
  const [modelKey, setModelKey] = useState<ModelKey>('modelo_1');
  const [semantic, setSemantic] = useState<number | null>(null);
  const [clarity, setClarity] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      setMessage('');
      setError('');
      setSemantic(null);
      setClarity(null);
      setComment('');
      if (!session) return;
      try {
        const response = await getHumanEvaluation(exampleId, session.sessionId, modelKey);
        if (!active) return;
        if (response.evaluation) {
          setSemantic(response.evaluation.semanticScore);
          setClarity(response.evaluation.clarityScore);
          setComment(response.evaluation.comment ?? '');
        }
      } catch (err) {
        if (active) setError('No se pudo cargar la evaluación previa.');
      }
    };
    void load();
    return () => { active = false; };
  }, [exampleId, modelKey, session?.sessionId]);

  const handleSave = async () => {
    if (!session) {
      setError('No hay una sesión activa.');
      return;
    }
    if (!semantic || !clarity) {
      setError('Selecciona adecuación semántica y claridad.');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const response = await saveHumanEvaluation(exampleId, {
        sessionId: session.sessionId,
        modelKey,
        semanticScore: semantic,
        clarityScore: clarity,
        comment,
      });
      onSaved(response.evaluation);
      setMessage(response.message || 'Evaluación humana guardada correctamente');
    } catch (err) {
      setError('No se pudo guardar la evaluación humana.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='rounded-2xl border border-[#1F2937] bg-[#18181B] p-5'>
      <h3 className='text-2xl font-bold'>Evaluación humana</h3>
      <label className='mt-3 block text-sm text-slate-300'>Modelo a evaluar</label>
      <select className='mt-2 rounded-xl border border-[#1F2937] bg-[#111827] px-3 py-2 text-slate-100' value={modelKey} onChange={(event) => setModelKey(event.target.value as ModelKey)}>
        {models.map((model) => <option key={model.key} value={model.key}>{model.label}</option>)}
      </select>
      <p className='mt-3'>Adecuación semántica</p>
      <LikertScale value={semantic} onChange={setSemantic} />
      <p className='mt-3'>Claridad</p>
      <LikertScale value={clarity} onChange={setClarity} />
      <textarea className='mt-3 w-full rounded-xl border border-[#1F2937] bg-[#111827] p-2 text-slate-100' rows={4} value={comment} onChange={(e) => setComment(e.target.value)} placeholder='Comentario' />
      <Button className='mt-3' disabled={loading || !session} onClick={handleSave}>{loading ? 'Guardando...' : 'Guardar evaluación'}</Button>
      {message && <p className='mt-2 text-sm text-green-400'>{message}</p>}
      {error && <p className='mt-2 text-sm text-red-400'>{error}</p>}
    </div>
  );
}
