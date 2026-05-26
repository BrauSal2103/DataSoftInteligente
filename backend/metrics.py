import os
import json
from typing import Any, Dict, List
import numpy as np
from sacrebleu.metrics import BLEU, CHRF


def _clean_sequence(seq) -> List[str]:
    if not seq:
        return []
    if isinstance(seq, list):
        # assume list of pictogram objects or ids
        out = []
        for v in seq:
            if isinstance(v, dict):
                out.append(str(v.get('id') or v.get('label') or ''))
            else:
                out.append(str(v))
        return [t for t in out if t]
    if isinstance(seq, str):
        return [t for t in seq.strip().split() if t]
    return []


def concept_precision_recall_f1(hyp_tokens: List[str], ref_tokens: List[str]):
    hyp_set = set(hyp_tokens)
    ref_set = set(ref_tokens)
    if len(hyp_set) == 0 and len(ref_set) == 0:
        return 1.0, 1.0, 1.0
    if len(hyp_set) == 0 or len(ref_set) == 0:
        return 0.0, 0.0, 0.0
    tp = len(hyp_set & ref_set)
    precision = tp / len(hyp_set) if len(hyp_set) else 0.0
    recall = tp / len(ref_set) if len(ref_set) else 0.0
    if (precision + recall) == 0:
        f1 = 0.0
    else:
        f1 = 2 * precision * recall / (precision + recall)
    return precision, recall, f1


def coverage_score(hyp_tokens: List[str], ref_tokens: List[str]):
    if not ref_tokens:
        return 1.0
    hyp_set = set(hyp_tokens)
    covered = sum(1 for t in ref_tokens if t in hyp_set)
    return covered / len(ref_tokens)


def _load_model_records(source_dir: str):
    records = {}
    for filename, key in [
        ('modelo1.json', 'modelo_1'),
        ('modelo2.json', 'modelo_2'),
        ('modelo3.json', 'modelo_3'),
        ('modelo4.json', 'modelo_4'),
    ]:
        path = os.path.join(source_dir, filename)
        if not os.path.exists(path):
            continue
        try:
            raw = json.load(open(path, 'r', encoding='utf-8'))
            records[key] = {str(item.get('id')): item.get('output') or '' for item in raw}
        except Exception:
            continue
    return records


def _example_model_map(example: Dict[str, Any], model_records: Dict[str, Dict[str, str]] | None = None):
    example_id = str(example.get('id'))
    if model_records and any(example_id in mapping for mapping in model_records.values()):
        return {
            'modelo_1': model_records.get('modelo_1', {}).get(example_id, ''),
            'modelo_2': model_records.get('modelo_2', {}).get(example_id, ''),
            'modelo_3': model_records.get('modelo_3', {}).get(example_id, ''),
            'modelo_4': model_records.get('modelo_4', {}).get(example_id, ''),
        }
    return {
        'modelo_1': example.get('modelo_1') or example.get('m1') or example.get('model_1') or example.get('model1') or [],
        'modelo_2': example.get('modelo_2') or example.get('m2') or example.get('model_2') or example.get('model2') or [],
        'modelo_3': example.get('modelo_3') or example.get('m3') or example.get('model_3') or example.get('model3') or [],
        'modelo_4': example.get('modelo_4') or example.get('m4') or example.get('model_4') or example.get('model4') or [],
    }


def _valid_prediction_ids(model_records: Dict[str, Dict[str, str]] | None = None) -> set:
    ids: set = set()
    if model_records:
        for mapping in model_records.values():
            ids.update(mapping.keys())
    return ids


def compute_session_summary(dataset: List[Dict[str, Any]], model_records: Dict[str, Dict[str, str]] | None = None):
    bleu_metric = BLEU(effective_order=True)
    chrf_metric = CHRF(word_order=2)

    # Filter dataset to only examples that have model predictions (matching notebook EVAL_IDS)
    valid_ids = _valid_prediction_ids(model_records)
    if valid_ids:
        dataset = [ex for ex in dataset if str(ex.get('id')) in valid_ids]

    summary = {
        'bleu': [],
        'chrf': [],
        'conceptF1': [],
        'coverage': [],
    }

    for model_key in ['modelo_1', 'modelo_2', 'modelo_3', 'modelo_4']:
        hyps = []
        refs = []
        concept_f1_values = []
        coverage_values = []

        for example in dataset:
            ref_tokens = _clean_sequence(example.get('traduccion') or example.get('referencia') or example.get('reference') or example.get('referencias'))
            model_map = _example_model_map(example, model_records)
            hyp_tokens = _clean_sequence(model_map[model_key])
            if not hyp_tokens:
                continue
            hyps.append(' '.join(hyp_tokens))
            refs.append(' '.join(ref_tokens))
            _, _, f1 = concept_precision_recall_f1(hyp_tokens, ref_tokens)
            concept_f1_values.append(f1 * 100)
            coverage_values.append(coverage_score(hyp_tokens, ref_tokens) * 100)

        try:
            bleu_value = float(bleu_metric.corpus_score(hyps, [refs]).score)
        except Exception:
            bleu_value = None
        try:
            chrf_value = float(chrf_metric.corpus_score(hyps, [refs]).score)
        except Exception:
            chrf_value = None

        model_name = model_key.replace('_', ' ').title().replace('Modelo ', 'Modelo ')
        summary['bleu'].append({'model': model_name, 'value': bleu_value})
        summary['chrf'].append({'model': model_name, 'value': chrf_value})
        summary['conceptF1'].append({'model': model_name, 'value': round(float(np.mean(concept_f1_values)), 4) if concept_f1_values else 0})
        summary['coverage'].append({'model': model_name, 'value': round(float(np.mean(coverage_values)), 4) if coverage_values else 0})

    return summary


def compute_example_metrics(example: Dict[str, Any], dataset: List[Dict[str, Any]], model_records: Dict[str, Dict[str, str]] | None = None):
    # Attempt to locate reference and model predictions inside example
    ref = example.get('traduccion') or example.get('referencia') or example.get('reference') or example.get('referencias')
    models = _example_model_map(example, model_records)

    ref_tokens = _clean_sequence(ref)

    bleu_s = BLEU(effective_order=True)
    chrf_s = CHRF(word_order=2)

    results = {}
    for name, pred in models.items():
        hyp_tokens = _clean_sequence(pred)
        hyp_str = ' '.join(hyp_tokens)
        ref_str = ' '.join(ref_tokens)
        try:
            bleu_val = float(bleu_s.sentence_score(hyp_str, [ref_str]).score)
        except Exception:
            bleu_val = None
        try:
            chrf_val = float(chrf_s.sentence_score(hyp_str, [ref_str]).score)
        except Exception:
            chrf_val = None
        p, r, f1 = concept_precision_recall_f1(hyp_tokens, ref_tokens)
        cov = coverage_score(hyp_tokens, ref_tokens)
        results[name] = {
            'bleu': bleu_val,
            'chrf': chrf_val,
            'conceptF1': round(f1 * 100, 4),
            'coverage': round(cov * 100, 4),
        }
    return results


def evaluate_with_gemini(example: Dict[str, Any]):
    # Minimal wrapper: if GEMINI_API_KEY is present, return placeholder noting key present
    # Full integration (calling Google GenAI) can be added later.
    key = os.environ.get('GEMINI_API_KEY')
    if not key:
        return {
            'score': None,
            'semantic_errors': ['GEMINI_API_KEY missing in backend environment'],
            'missing_concepts': [],
            'comments': 'No API key configured; run LLM-Judge on backend after setting GEMINI_API_KEY.'
        }
    # If key exists, return a shallow stub indicating readiness (do not call external API automatically)
    return {
        'score': 3,
        'semantic_errors': [],
        'missing_concepts': [],
        'comments': 'GEMINI_API_KEY present — LLM-Judge call can be enabled in backend.'
    }
