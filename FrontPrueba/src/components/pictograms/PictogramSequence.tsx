import { Pictogram } from '../../types/dataset';
import PictogramImage from './PictogramImage';

export default function PictogramSequence({ items }: { items: Pictogram[] }) {
  return <div className='flex flex-wrap gap-2'>{items.map((p, i) => <PictogramImage key={`${p.id}-${i}`} id={p.id} label={p.label} />)}</div>;
}
