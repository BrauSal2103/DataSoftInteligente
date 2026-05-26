import { useState } from 'react';
import { Example } from '../../types/dataset';
import Button from '../ui/Button';
import Card from '../ui/Card';

export default function LLMJudgePanel({ example, onRun }: { example: Example; onRun: () => void }) {
  const [status, setStatus] = useState('LLM-Judge pendiente de conexión con backend.');
  const llm = example.llmJudge;
  return (
    <Card>
      <h3 className='text-2xl font-bold'>LLM-JUDGE GEMINI</h3>
      <p className='mt-2 text-sm text-slate-300'>{status}</p>
      <Button className='mt-3' onClick={() => { onRun(); setStatus('LLM-Judge pendiente de conexión con backend.'); }}>Ejecutar LLM-Judge</Button>
      <div className='mt-4 space-y-1 text-sm'>
        <p><b>Score:</b> {llm?.score ?? '—'}</p>
        <p><b>Errores semánticos:</b> {llm?.semantic_errors?.join(', ') ?? '—'}</p>
        <p><b>Conceptos faltantes:</b> {llm?.missing_concepts?.join(', ') ?? '—'}</p>
        <p><b>Comentario:</b> {llm?.comments ?? '—'}</p>
      </div>
    </Card>
  );
}
