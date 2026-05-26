import axios from 'axios';
import { Example, HumanEvaluation, LLMJudgeResult, ModelKey, SessionInfo } from '../types/dataset';

const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000', timeout: 120000 });

export type ProgressResult = { total: number; evaluated: number; pending: number; progress: number };
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

export const saveHumanEvaluationApi = async (payload: { exampleId: string | number; evaluation: HumanEvaluation }, session?: SessionInfo | null) => {
  return { ok: true, payload, session };
};

export default api;
