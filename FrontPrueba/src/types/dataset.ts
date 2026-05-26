export type Pictogram = { id: number | string; label: string };
export type HumanEvaluation = { semanticAdequacy: number; clarity: number; comments: string; timestamp: string };
export type ModelMetrics = { bleu?: number; chrf?: number; conceptF1?: number; coverage?: number };
export type LLMJudgeResult = { score?: number; semantic_errors?: string[]; missing_concepts?: string[]; comments?: string };
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
