import { useState } from 'react';
import { Example, ModelKey } from '../../types/dataset';
import Button from '../ui/Button';
import Card from '../ui/Card';

const modelOptions: { key: ModelKey; label: string }[] = [
  { key: 'modelo_1', label: 'Modelo 1' },
  { key: 'modelo_2', label: 'Modelo 2' },
  { key: 'modelo_3', label: 'Modelo 3' },
  { key: 'modelo_4', label: 'Modelo 4' },
];

export default function LLMJudgePanel({ example, onRun }: { example: Example; onRun: (modelKey: ModelKey) => Promise<void> }) {
  const [status, setStatus] = useState('Selecciona un modelo y ejecuta LLM-Judge.');
  const [running, setRunning] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelKey>('modelo_1');
  const llm = example.llmJudge;

  const handleRun = async () => {
    setRunning(true);
    setStatus('Consultando Gemini...');
    try {
      await onRun(selectedModel);
      setStatus(`LLM-Judge completado para ${modelOptions.find((item) => item.key === selectedModel)?.label ?? selectedModel}.`);
    } catch (error) {
      console.error('No se pudo ejecutar LLM-Judge', error);
      setStatus('No se pudo ejecutar LLM-Judge. Revisa el backend y la API key de Gemini.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <Card>
      <h3 className='text-2xl font-bold'>LLM-JUDGE GEMINI</h3>
      <p className='mt-2 text-sm text-slate-400'>Equivalente a la celda del notebook que evalúa un modelo seleccionado sobre el ejemplo activo.</p>
      <div className='mt-4 flex flex-wrap gap-3'>
        <label className='flex flex-col gap-1 text-sm text-slate-300'>
          Modelo a evaluar
          <select
            className='rounded-xl border border-[#1F2937] bg-[#111827] px-3 py-2 text-white'
            value={selectedModel}
            onChange={(event) => setSelectedModel(event.target.value as ModelKey)}
          >
            {modelOptions.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
          </select>
        </label>
        <div className='flex items-end'>
          <Button className='mt-3' onClick={handleRun} disabled={running}>
            {running ? 'Ejecutando...' : 'Ejecutar LLM-Judge'}
          </Button>
        </div>
      </div>
      <p className='mt-2 text-sm text-slate-300'>{status}</p>
      <div className='mt-4 space-y-1 text-sm'>
        <p><b>Modelo evaluado:</b> {llm?.modelLabel ?? '—'}</p>
        <p><b>Score:</b> {llm?.score ?? '—'}</p>
        <p><b>Errores semánticos:</b> {llm?.semantic_errors?.length ? llm.semantic_errors.join(' | ') : '—'}</p>
        <p><b>Conceptos faltantes:</b> {llm?.missing_concepts?.length ? llm.missing_concepts.join(' | ') : '—'}</p>
        <p><b>Comentario:</b> {llm?.comments ?? '—'}</p>
      </div>
    </Card>
  );
}
