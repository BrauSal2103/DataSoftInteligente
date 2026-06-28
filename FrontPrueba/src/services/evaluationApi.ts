import axios from 'axios';
import { Example, HumanEvaluation, LLMJudgeResult, ModelKey } from '../types/dataset';

const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000', timeout: 120000 });

export type ProgressResult = { total: number; evaluated: number; pending: number; progress: number; totalExamples?: number; totalModelEvaluations?: number; evaluatedHumanCount?: number; pendingHumanCount?: number; humanProgress?: number };
export type MetricSummary = {
  bleu: { model: string; value: number | null }[];
  chrf: { model: string; value: number | null }[];
  conceptF1: { model: string; value: number | null }[];
  coverage: { model: string; value: number | null }[];
  semanticSimilarity: { model: string; value: number | null }[];
};

export const uploadDataset = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/api/datasets/upload', formData);
  return response.data as { success: boolean; sessionId: string; filename: string; examplesCount: number };
};

export const getExamples = async (sessionId?: string) => {
  const response = await api.get('/api/examples', { params: sessionId ? { sessionId } : undefined });
  return response.data as Example[];
};

export const getProgress = async (sessionId?: string) => {
  const response = await api.get('/api/progress', { params: sessionId ? { sessionId } : undefined });
  return response.data as ProgressResult;
};

export const getMetricSummary = async (sessionId?: string) => {
  const response = await api.get('/api/results', { params: sessionId ? { sessionId } : undefined });
  return response.data as MetricSummary;
};

export const calculateMetrics = async (example: Example, sessionId?: string) => {
  const response = await api.post(`/api/examples/${example.id}/metrics`, null, { params: sessionId ? { sessionId } : undefined });
  return response.data as { exampleId: number | string; metrics: Example['metrics']; stored: string };
};

export type LLMJudgeApiResponse = {
  exampleId: number | string;
  modelKey: ModelKey;
  modelLabel: string;
  promptMode?: 'strict' | 'flexible';
  llmJudge: LLMJudgeResult;
  stored: string;
};

export type LLMJudgeBatchRequest = {
  modelKey: ModelKey;
  promptMode: 'strict' | 'flexible';
  selectionMode: 'random' | 'ids';
  evalLimit: number;
  ids: Array<number | string>;
  seed: number;
};

export type LLMJudgeBatchResponse = {
  modelKey: ModelKey;
  promptMode: 'strict' | 'flexible';
  selectionMode: 'random' | 'ids';
  evalLimit: number;
  seed: number;
  selectedIds: Array<number | string>;
  results: Array<{ id: number | string; texto: string; prediction: string; llmJudge: LLMJudgeResult }>;
  stored: string[];
};

export const runLLMJudge = async (example: Example, sessionId?: string, modelKey: ModelKey = 'modelo_1', promptMode: 'strict' | 'flexible' = 'strict') => {
  const response = await api.post(`/api/examples/${example.id}/llm-judge`, null, {
    params: sessionId ? { sessionId, modelKey, promptMode } : { modelKey, promptMode },
  });
  return response.data as LLMJudgeApiResponse;
};

export const runLLMJudgeBatch = async (payload: LLMJudgeBatchRequest, sessionId?: string) => {
  const response = await api.post('/api/llm-judge/batch', payload, {
    params: sessionId ? { sessionId } : undefined,
  });
  return response.data as LLMJudgeBatchResponse;
};

export type SaveHumanEvaluationPayload = {
  sessionId: string;
  modelKey: ModelKey;
  semanticScore: number;
  clarityScore: number;
  comment?: string;
};

export const saveHumanEvaluation = async (exampleId: string | number, payload: SaveHumanEvaluationPayload) => {
  const response = await api.post(`/api/examples/${exampleId}/human-evaluation`, payload);
  return response.data as { success: boolean; message: string; evaluation: HumanEvaluation; stored: string };
};

export const getHumanEvaluations = async (sessionId: string) => {
  const response = await api.get('/api/human-evaluations', { params: { sessionId } });
  return response.data as { success: boolean; sessionId: string; total: number; evaluations: HumanEvaluation[] };
};

export const getHumanEvaluation = async (exampleId: string | number, sessionId: string, modelKey: ModelKey) => {
  const response = await api.get(`/api/examples/${exampleId}/human-evaluation`, { params: { sessionId, modelKey } });
  return response.data as { success: boolean; sessionId: string; exampleId: string | number; modelKey: ModelKey; evaluation: HumanEvaluation | null; message?: string };
};

export default api;
