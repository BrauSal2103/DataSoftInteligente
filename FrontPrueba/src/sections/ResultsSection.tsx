import { HumanEvaluation } from '../types/dataset';
import Card from '../components/ui/Card';

const modelLabels = {
  modelo_1: 'Modelo 1',
  modelo_2: 'Modelo 2',
  modelo_3: 'Modelo 3',
  modelo_4: 'Modelo 4',
};

export default function ResultsSection({ humanEvaluations }: { humanEvaluations: HumanEvaluation[] }) {
  return (
    <Card className='p-6'>
      <h3 className='text-3xl font-bold'>Evaluaciones humanas</h3>
      {!humanEvaluations.length ? (
        <p className='mt-3 rounded-lg border border-[#374151] bg-[#111827] p-3 text-sm text-slate-300'>No hay evaluaciones humanas registradas.</p>
      ) : (
        <div className='mt-4 overflow-x-auto'>
          <table className='w-full text-left text-sm'>
            <thead className='text-slate-300'>
              <tr>
                <th>ID ejemplo</th>
                <th>Modelo</th>
                <th>Adecuación semántica</th>
                <th>Claridad</th>
                <th>Comentario</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {humanEvaluations.map((item) => (
                <tr key={`${item.exampleId}-${item.modelKey}`} className='border-t border-[#1F2937]'>
                  <td className='py-2'>{item.exampleId}</td>
                  <td>{modelLabels[item.modelKey]}</td>
                  <td>{item.semanticScore}</td>
                  <td>{item.clarityScore}</td>
                  <td className='max-w-md truncate'>{item.comment || '—'}</td>
                  <td>{item.updatedAt ?? item.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
