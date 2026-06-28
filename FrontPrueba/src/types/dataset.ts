export type Pictogram = { id: number | string; label: string };
export type ModelKey = 'modelo_1' | 'modelo_2' | 'modelo_3' | 'modelo_4';
export type HumanEvaluation = {
  sessionId: string;
  exampleId: number | string;
  modelKey: ModelKey;
  semanticScore: number;
  clarityScore: number;
  comment: string;
  createdAt: string;
  updatedAt?: string;
};
export type ModelMetrics = { bleu?: number; chrf?: number; conceptF1?: number; coverage?: number; semanticSimilarity?: number };
export type LLMJudgeResult = { score?: number; semantic_errors?: string[]; missing_concepts?: string[]; comments?: string; modelKey?: ModelKey; modelLabel?: string };
export type SessionInfo = { sessionId: string; sourceHash: string; filename?: string };
export type Example = {
  id: number | string;
  texto: string;
  referencia: Pictogram[];
  modelo_1: Pictogram[];
  modelo_2: Pictogram[];
  modelo_3: Pictogram[];
  modelo_4: Pictogram[];
  metrics?: Record<string, ModelMetrics>;
  llmJudge?: LLMJudgeResult;
};
