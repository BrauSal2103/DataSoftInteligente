import { Example, HumanEvaluation, ModelKey } from '../../types/dataset';
import Card from '../ui/Card';

const toGeneratedText = (items: Example[ModelKey]) => items.map((item) => item.label).filter(Boolean).map((label) => `{${label}}`).join('') || '{Sin pictogramas generados}';

export default function ModelComparisonPanel({ example, humanEvaluations = [] }: { example: Example; humanEvaluations?: HumanEvaluation[] }) {
  const models = [
    { key: 'modelo_1', name: 'Modelo 1', data: example.modelo_1 },
    { key: 'modelo_2', name: 'Modelo 2', data: example.modelo_2 },
    { key: 'modelo_3', name: 'Modelo 3', data: example.modelo_3 },
    { key: 'modelo_4', name: 'Modelo 4', data: example.modelo_4 },
  ] as const;

  return (
    <div className='grid grid-cols-1 gap-3 2xl:grid-cols-4 lg:grid-cols-2'>
      {models.map((m) => (
        <Card key={m.name}>
          <div className='flex items-start justify-between gap-3'>
            <h4 className='text-lg font-bold'>{m.name}</h4>
            {humanEvaluations.some((item) => String(item.exampleId) === String(example.id) && item.modelKey === m.key) ? (
              <span className='rounded-full bg-green-500/15 px-3 py-1 text-xs font-semibold text-green-300'>Evaluado</span>
            ) : (
              <span className='rounded-full bg-slate-700 px-3 py-1 text-xs font-semibold text-slate-300'>Pendiente</span>
            )}
          </div>
          <p className='mt-3 rounded-lg border border-[#243244] bg-black/30 p-3 text-xl leading-snug'>{toGeneratedText(m.data)}</p>
          <p className='mt-3 text-sm text-slate-400'>{example.metrics?.[m.key]?.bleu !== undefined ? 'Métricas disponibles' : 'Métricas pendientes'}</p>
        </Card>
      ))}
    </div>
  );
}
