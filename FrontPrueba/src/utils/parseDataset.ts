import { Example, Pictogram } from '../types/dataset';

type ParseResult = { examples: Example[]; errors: string[] };

const parsePictoList = (raw: unknown): Pictogram[] => {
  if (Array.isArray(raw)) return raw.map((p: any) => ({ id: p.id, label: String(p.label ?? p.id) }));
  if (typeof raw !== 'string') return [];
  const s = raw.trim();
  if (!s) return [];
  try {
    const parsed = JSON.parse(s);
    if (Array.isArray(parsed)) return parsed.map((p: any) => ({ id: p.id, label: String(p.label ?? p.id) }));
  } catch {}
  return s.split(',').map((part) => part.trim()).filter(Boolean).map((token) => {
    const [id, ...labelParts] = token.split(':');
    return { id: id.trim(), label: (labelParts.join(':').trim() || id.trim()) };
  });
};

const validateExample = (row: any, idx: number): string[] => {
  const hasNotebookSchema = 'oracion' in row && 'traduccion' in row;
  const hasFrontendSchema = 'texto' in row && 'referencia' in row;
  const errors: string[] = [];

  if (!('id' in row)) errors.push(`Fila ${idx + 1}: falta campo id`);

  if (hasNotebookSchema) {
    if (typeof row.oracion !== 'string') errors.push(`Fila ${idx + 1}: oracion debe ser string`);
    if (!row.traduccion) errors.push(`Fila ${idx + 1}: falta traduccion`);
    return errors;
  }

  if (hasFrontendSchema) {
    if (typeof row.texto !== 'string') errors.push(`Fila ${idx + 1}: texto debe ser string`);
    if (!row.referencia) errors.push(`Fila ${idx + 1}: falta referencia`);
    if (!row.modelo_1) errors.push(`Fila ${idx + 1}: falta modelo_1`);
    if (!row.modelo_2) errors.push(`Fila ${idx + 1}: falta modelo_2`);
    if (!row.modelo_3) errors.push(`Fila ${idx + 1}: falta modelo_3`);
    if (!row.modelo_4) errors.push(`Fila ${idx + 1}: falta modelo_4`);
    return errors;
  }

  errors.push(`Fila ${idx + 1}: formato no reconocido`);
  return errors;
};

const normalize = (row: any): Example => {
  const reference = row.referencia ?? row.traduccion ?? row.reference ?? row.referencias;
  const model1 = row.modelo_1 ?? row.m1 ?? row.model_1 ?? row.model1 ?? row.output?.modelo_1;
  const model2 = row.modelo_2 ?? row.m2 ?? row.model_2 ?? row.model2 ?? row.output?.modelo_2;
  const model3 = row.modelo_3 ?? row.m3 ?? row.model_3 ?? row.model3 ?? row.output?.modelo_3;
  const model4 = row.modelo_4 ?? row.m4 ?? row.model_4 ?? row.model4 ?? row.output?.modelo_4;

  return {
    id: row.id,
    texto: row.texto ?? row.oracion ?? row.text ?? '',
    referencia: parsePictoList(reference),
    modelo_1: parsePictoList(model1),
    modelo_2: parsePictoList(model2),
    modelo_3: parsePictoList(model3),
    modelo_4: parsePictoList(model4),
  };
};

const splitCsvLine = (line: string) => {
  const out: string[] = []; let cur = ''; let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') q = !q;
    else if (c === ',' && !q) { out.push(cur); cur = ''; }
    else cur += c;
  }
  out.push(cur);
  return out.map((v) => v.trim());
};

const parseCsv = (content: string): any[] => {
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const vals = splitCsvLine(line);
    return headers.reduce((acc: any, h, i) => ({ ...acc, [h]: vals[i] ?? '' }), {});
  });
};

export const parseDataset = (content: string, filename: string): ParseResult => {
  const errors: string[] = [];
  let rows: any[] = [];
  try {
    if (filename.toLowerCase().endsWith('.json') || content.trim().startsWith('[')) rows = JSON.parse(content);
    else rows = parseCsv(content);
  } catch (e) { return { examples: [], errors: ['No se pudo parsear archivo JSON/CSV.'] }; }
  if (!Array.isArray(rows) || rows.length === 0) return { examples: [], errors: ['Dataset vacío o formato inválido.'] };
  rows.forEach((r, i) => errors.push(...validateExample(r, i)));
  const examples = rows.map(normalize).filter((e) => e.referencia.length > 0);
  if (examples.length !== rows.length) errors.push('Algunas filas tienen listas de pictogramas inválidas o referencias vacías.');
  return { examples, errors };
};
