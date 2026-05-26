import { Example } from '../../types/dataset';
import PictogramSequence from '../pictograms/PictogramSequence';
import Card from '../ui/Card';

export default function ModelComparisonPanel({ example }: { example: Example }) {
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
          <h4 className='text-lg font-bold'>{m.name}</h4>
          <div className='mt-3'><PictogramSequence items={m.data} /></div>
          <p className='mt-3 text-sm text-slate-400'>{example.metrics?.[m.key]?.bleu !== undefined ? 'Métricas disponibles' : 'Métricas pendientes'}</p>
        </Card>
      ))}
    </div>
  );
}
