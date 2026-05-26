import json
import os
from pathlib import Path
from typing import Any, Dict, List

import numpy as np
import requests
from sacrebleu.metrics import BLEU, CHRF


MODEL_LABELS = {
    'modelo_1': 'Modelo 1',
    'modelo_2': 'Modelo 2',
    'modelo_3': 'Modelo 3',
    'modelo_4': 'Modelo 4',
}

GEMINI_URL = os.environ.get(
    'GEMINI_URL',
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',
)
GEMINI_MODEL_KEY = os.environ.get('GEMINI_MODEL', 'gemini-flash-latest')


def _load_local_env() -> None:
    candidates = [
        Path.cwd() / '.env',
        Path(__file__).resolve().parents[1] / '.env',
        Path(__file__).resolve().parent / '.env',
    ]

    for candidate in candidates:
        if not candidate.exists():
            continue
        try:
            for line in candidate.read_text(encoding='utf-8').splitlines():
                line = line.strip()
                if not line or line.startswith('#') or '=' not in line:
                    continue
                key, value = line.split('=', 1)
                os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))
        except Exception:
            continue
        break


_load_local_env()

PROMPT_JUEZ_SISTEMA = """
Eres un experto lingüista y evaluador de sistemas de comunicación aumentativa y alternativa (CAA).
Tu tarea es evaluar qué tan bien una secuencia de pictogramas representa el significado de un texto original en español.

Evalúa bajo los siguientes criterios (Escala del 1 al 5):
- 5 (Excelente): No falta ningún concepto, el orden es coherente y no hay errores semánticos.
- 4 (Bueno): Se entiende perfectamente, pero omitió algún elemento secundario o conector menor.
- 3 (Aceptable): El sentido general se captura, pero faltan conceptos importantes o hay confusión leve.
- 2 (Deficiente): Hay errores semánticos graves; la secuencia confunde el mensaje original.
- 1 (Inaceptable): No tiene ninguna relación semántica con el texto.

OBLIGATORIO: Debes responder ÚNICAMENTE con un objeto JSON válido que contenga exactamente la siguiente estructura:
{
  "score": [número entero del 1 al 5],
  "semantic_errors": [lista de strings con errores detectados],
  "missing_concepts": [lista de strings con conceptos del texto original faltantes],
  "comments": [string con tu justificación detallada de la nota]
}
No agregues texto introductorio ni explicaciones fuera del JSON.
"""

PROMPT_JUEZ_FLEXIBLE = """
Eres un educador de primaria evaluando secuencias de pictogramas para niños con dificultades de comunicación.
Tu prioridad es determinar si la INTENCIÓN comunicativa global se mantiene, ignorando si faltan palabras gramaticales, artículos o si el orden varía de forma válida.

Asigna un puntaje del 1 al 5:
- 5 o 4: Si un usuario humano promedio podría entender perfectamente la acción principal o mensaje global con solo ver los pictogramas.
- 3: Si se entiende la idea central, pero requiere un esfuerzo cognitivo extra o genera dudas leves.
- 1 o 2: Si el significado se distorsiona tanto que confunde por completo la acción original o transmite algo opuesto.

OBLIGATORIO: Debes responder ÚNICAMENTE con un objeto JSON válido que contenga exactamente la siguiente estructura:
{
    "score": [número entero del 1 al 5],
    "semantic_errors": [lista de strings con errores detectados],
    "missing_concepts": [lista de strings con conceptos del texto original faltantes],
    "comments": [string con tu justificación detallada de la nota]
}
No agregues texto introductorio ni explicaciones fuera del JSON.
"""


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


def _extract_json_from_response(text: str) -> dict[str, Any]:
    cleaned = text.strip()
    if cleaned.startswith('```'):
        cleaned = cleaned.strip('`')
        if cleaned.lower().startswith('json'):
            cleaned = cleaned[4:].strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        start = cleaned.find('{')
        if start != -1:
            depth = 0
            end = None
            in_string = False
            escape_next = False
            for index, char in enumerate(cleaned[start:], start=start):
                if escape_next:
                    escape_next = False
                    continue
                if char == '\\' and in_string:
                    escape_next = True
                    continue
                if char == '"':
                    in_string = not in_string
                    continue
                if in_string:
                    continue
                if char == '{':
                    depth += 1
                elif char == '}':
                    depth -= 1
                    if depth == 0:
                        end = index
                        break
            if end is not None and end > start:
                candidate = cleaned[start:end + 1]
                try:
                    return json.loads(candidate)
                except json.JSONDecodeError:
                    candidate = candidate.replace('\n', ' ').replace('\r', ' ')
                    candidate = candidate.replace('“', '"').replace('”', '"').replace("'", '"')
                    try:
                        return json.loads(candidate)
                    except json.JSONDecodeError:
                        pass
        return {
            'score': None,
            'semantic_errors': ['La respuesta de Gemini no pudo convertirse a JSON válido'],
            'missing_concepts': [],
            'comments': cleaned[:1000],
        }


def _example_text(example: Dict[str, Any]) -> str:
    return str(
        example.get('oracion')
        or example.get('texto')
        or example.get('text')
        or ''
    )


def _available_model_keys(example: Dict[str, Any]) -> Dict[str, str | List[str] | List[Dict[str, Any]]]:
    return {
        'modelo_1': example.get('modelo_1') or example.get('m1') or example.get('model_1') or example.get('model1') or [],
        'modelo_2': example.get('modelo_2') or example.get('m2') or example.get('model_2') or example.get('model2') or [],
        'modelo_3': example.get('modelo_3') or example.get('m3') or example.get('model_3') or example.get('model3') or [],
        'modelo_4': example.get('modelo_4') or example.get('m4') or example.get('model_4') or example.get('model4') or [],
    }


def _prompt_for_mode(prompt_mode: str) -> str:
    return PROMPT_JUEZ_FLEXIBLE if prompt_mode == 'flexible' else PROMPT_JUEZ_SISTEMA


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


def evaluate_with_gemini(
    example: Dict[str, Any],
    model_records: Dict[str, Dict[str, str]] | None = None,
    model_key: str = 'modelo_1',
    prompt_mode: str = 'strict',
):
    model_key = model_key if model_key in MODEL_LABELS else 'modelo_1'
    model_label = MODEL_LABELS[model_key]
    text_original = _example_text(example)
    model_map = _example_model_map(example, model_records) if model_records else _available_model_keys(example)
    prediction_tokens = _clean_sequence(model_map.get(model_key))
    prediction_text = ' '.join(prediction_tokens)

    key = os.environ.get('GEMINI_API_KEY')
    if not key:
        return {
            'score': None,
            'semantic_errors': ['Falta GEMINI_API_KEY en el entorno'],
            'missing_concepts': [],
            'comments': 'No se encontró la clave API en el entorno del backend.',
        }

    payload = {
        'systemInstruction': {'parts': [{'text': _prompt_for_mode(prompt_mode)}]},
        'contents': [
            {
                'parts': [
                    {
                        'text': (
                            f'Texto Original: "{text_original}"\n'
                            f'Modelo a evaluar: {model_label}\n'
                            f'Secuencia de Pictogramas Generada: {prediction_text}'
                        )
                    }
                ]
            }
        ],
        'generationConfig': {
            'temperature': 0.1,
            'responseMimeType': 'application/json',
        },
    }

    response = requests.post(
        GEMINI_URL,
        headers={
            'Content-Type': 'application/json',
            'X-goog-api-key': key,
        },
        json=payload,
        timeout=60,
    )

    if response.status_code == 429:
        return {
            'score': None,
            'semantic_errors': [f'Error de ejecución: 429 RESOURCE_EXHAUSTED. {response.text[:200]}'],
            'missing_concepts': [],
            'comments': 'Cuota agotada o límite de peticiones alcanzado.',
        }

    response.raise_for_status()
    response_data = response.json()
    response_text = response_data['candidates'][0]['content']['parts'][0]['text']
    result = _extract_json_from_response(response_text)

    return {
        'score': result.get('score'),
        'semantic_errors': result.get('semantic_errors', []),
        'missing_concepts': result.get('missing_concepts', []),
        'comments': result.get('comments', ''),
    }


def evaluate_batch_with_gemini(
    dataset: List[Dict[str, Any]],
    ids: List[int],
    model_records: Dict[str, Dict[str, str]] | None = None,
    model_key: str = 'modelo_1',
    prompt_mode: str = 'strict',
):
    results = []
    by_id = {x.get('id'): x for x in dataset}
    for example_id in ids:
        example = by_id.get(example_id)
        if not example:
            continue
        judge = evaluate_with_gemini(example, model_records=model_records, model_key=model_key, prompt_mode=prompt_mode)
        model_map = _example_model_map(example, model_records)
        results.append({
            'id': example_id,
            'texto': _example_text(example),
            'prediction': ' '.join(_clean_sequence(model_map.get(model_key))),
            'llmJudge': judge,
        })
    return results
