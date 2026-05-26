import { useMemo, useState } from 'react';
import { Example, ModelKey, LLMJudgeResult } from '../types/dataset';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { runLLMJudgeBatch } from '../services/evaluationApi';

type PromptMode = 'strict' | 'flexible';
type SelectionMode = 'random' | 'ids';

const modelOptions: { key: ModelKey; label: string }[] = [
  { key: 'modelo_1', label: 'Modelo 1' },
  { key: 'modelo_2', label: 'Modelo 2' },
  { key: 'modelo_3', label: 'Modelo 3' },
  { key: 'modelo_4', label: 'Modelo 4' },
];

const promptOptions: { key: PromptMode; label: string; description: string }[] = [
  { key: 'strict', label: 'Estricto', description: 'Prioriza exactitud semántica y penaliza omisiones relevantes.' },
  { key: 'flexible', label: 'Flexible', description: 'Tolera mejor artículos, conectores y variaciones sintácticas.' },
];

type BatchRow = { id: number | string; texto: string; prediction: string; llmJudge: LLMJudgeResult };

export default function LLMJudgeSection({ examples, sessionId }: { examples: Example[]; sessionId?: string | null }) {
  const [modelKey, setModelKey] = useState<ModelKey>('modelo_1');
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('random');
  const [promptMode, setPromptMode] = useState<PromptMode>('strict');
  const [evalLimit, setEvalLimit] = useState(5);
  const [idsText, setIdsText] = useState('');
  const [seed, setSeed] = useState(42);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState('Configura el lote y ejecuta el juez.');
  const [selectedIds, setSelectedIds] = useState<Array<number | string>>([]);
  const [results, setResults] = useState<BatchRow[]>([]);

  const availableIds = useMemo(() => examples.map((example) => example.id), [examples]);

  const handleRun = async () => {
    if (!sessionId) {
      setStatus('No hay una sesión activa. Carga un dataset primero.');
      return;
    }

    const maxRecords = Math.max(1, Math.min(evalLimit, availableIds.length));
    const parsedIds = idsText
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
      .map((value) => (Number.isNaN(Number(value)) ? value : Number(value)));

    setRunning(true);
    setStatus('Ejecutando Gemini...');
    try {
      const response = await runLLMJudgeBatch({
        modelKey,
        promptMode,
        selectionMode,
        evalLimit: maxRecords,
        ids: parsedIds,
        seed,
      }, sessionId);
      setSelectedIds(response.selectedIds);
      setResults(response.results);
      setStatus(`Procesados ${response.results.length} registros con prompt ${promptMode === 'strict' ? 'estricto' : 'flexible'}.`);
    } catch (error) {
      console.error('No se pudo ejecutar el lote de LLM-Judge', error);
      setStatus('No se pudo ejecutar el lote. Revisa el backend y la API key de Gemini.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-6xl font-bold'>LLM Judge</h1>
        <p className='mt-2 text-2xl text-slate-300'>Ejecución por lotes con Gemini, usando el mismo criterio del notebook.</p>
      </div>

      <Card className='space-y-5 p-6'>
        <div className='grid gap-4 lg:grid-cols-2'>
          <label className='flex flex-col gap-2 text-sm text-slate-300'>
            Modelo a evaluar
            <select className='rounded-xl border border-[#1F2937] bg-[#111827] px-3 py-2 text-white' value={modelKey} onChange={(event) => setModelKey(event.target.value as ModelKey)}>
              {modelOptions.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
            </select>
          </label>

          <label className='flex flex-col gap-2 text-sm text-slate-300'>
            Cantidad de registros
            <input className='rounded-xl border border-[#1F2937] bg-[#111827] px-3 py-2 text-white' type='number' min={1} max={availableIds.length || 1} value={evalLimit} onChange={(event) => setEvalLimit(Number(event.target.value) || 1)} />
          </label>

          <label className='flex flex-col gap-2 text-sm text-slate-300'>
            Modo de selección
            <select className='rounded-xl border border-[#1F2937] bg-[#111827] px-3 py-2 text-white' value={selectionMode} onChange={(event) => setSelectionMode(event.target.value as SelectionMode)}>
              <option value='random'>Aleatorio</option>
              <option value='ids'>IDs específicos</option>
            </select>
          </label>

          <label className='flex flex-col gap-2 text-sm text-slate-300'>
            Semilla aleatoria
            <input className='rounded-xl border border-[#1F2937] bg-[#111827] px-3 py-2 text-white' type='number' value={seed} onChange={(event) => setSeed(Number(event.target.value) || 42)} />
          </label>
        </div>

        <div>
          <p className='mb-2 text-sm text-slate-300'>Tipo de prompt</p>
          <div className='grid gap-3 md:grid-cols-2'>
            {promptOptions.map((option) => (
              <button
                key={option.key}
                className={`rounded-2xl border p-4 text-left transition ${promptMode === option.key ? 'border-[#EF0015] bg-[#2A1214]' : 'border-[#1F2937] bg-[#111827]'}`}
                onClick={() => setPromptMode(option.key)}
                type='button'
              >
                <p className='text-lg font-semibold'>{option.label}</p>
                <p className='mt-1 text-sm text-slate-400'>{option.description}</p>
              </button>
            ))}
          </div>
        </div>

        <label className='flex flex-col gap-2 text-sm text-slate-300'>
          IDs a enviar separados por coma
          <textarea
            className='min-h-[96px] rounded-xl border border-[#1F2937] bg-[#111827] px-3 py-2 text-white'
            placeholder='Ej: 13, 17, 25'
            value={idsText}
            onChange={(event) => setIdsText(event.target.value)}
            disabled={selectionMode !== 'ids'}
          />
        </label>

        <div className='flex flex-wrap gap-3'>
          <Button onClick={handleRun} disabled={running || !examples.length}>
            {running ? 'Ejecutando...' : 'Ejecutar LLM-Judge'}
          </Button>
          <span className='self-center text-sm text-slate-400'>{status}</span>
        </div>
      </Card>

      <div className='grid gap-4 xl:grid-cols-2'>
        <Card className='p-6'>
          <h3 className='text-2xl font-bold'>Selección enviada</h3>
          <p className='mt-2 text-sm text-slate-400'>IDs realmente evaluados en el lote.</p>
          <div className='mt-4 flex flex-wrap gap-2'>
            {selectedIds.length ? selectedIds.map((id) => <span key={String(id)} className='rounded-full border border-[#1F2937] bg-[#111827] px-3 py-1 text-sm'>{id}</span>) : <span className='text-sm text-slate-400'>—</span>}
          </div>
        </Card>

        <Card className='p-6'>
          <h3 className='text-2xl font-bold'>Resumen</h3>
          <div className='mt-3 space-y-1 text-sm'>
            <p><b>Modelo:</b> {modelOptions.find((item) => item.key === modelKey)?.label}</p>
            <p><b>Prompt:</b> {promptMode === 'strict' ? 'Estricto' : 'Flexible'}</p>
            <p><b>Modo de selección:</b> {selectionMode === 'random' ? 'Aleatorio' : 'IDs específicos'}</p>
            <p><b>Registros:</b> {evalLimit}</p>
          </div>
        </Card>
      </div>

      <Card className='p-6'>
        <h3 className='text-2xl font-bold'>Resultados</h3>
        <div className='mt-4 overflow-x-auto'>
          <table className='w-full text-left text-sm'>
            <thead className='text-slate-300'>
              <tr>
                <th className='py-2'>ID</th>
                <th>Score</th>
                <th>Errores semánticos</th>
                <th>Faltantes</th>
                <th>Comentarios</th>
              </tr>
            </thead>
            <tbody>
              {results.length ? results.map((row) => (
                <tr key={String(row.id)} className='border-t border-[#1F2937] align-top'>
                  <td className='py-3'>{row.id}</td>
                  <td>{row.llmJudge.score ?? '—'}</td>
                  <td>{row.llmJudge.semantic_errors?.length ? row.llmJudge.semantic_errors.join(' | ') : '—'}</td>
                  <td>{row.llmJudge.missing_concepts?.length ? row.llmJudge.missing_concepts.join(' | ') : '—'}</td>
                  <td className='max-w-[420px]'>{row.llmJudge.comments ?? '—'}</td>
                </tr>
              )) : <tr><td className='py-4 text-slate-400' colSpan={5}>Todavía no hay resultados.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}