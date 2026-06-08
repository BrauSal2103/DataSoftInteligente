import json
from datetime import datetime
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
BACKEND_DATA = ROOT / 'backend' / 'data'
MODEL_KEYS = {'modelo_1', 'modelo_2', 'modelo_3', 'modelo_4'}


def utc_now_iso() -> str:
    return datetime.utcnow().replace(microsecond=0).isoformat()


def get_human_evaluations_dir(session_id: str) -> Path:
    return BACKEND_DATA / session_id / 'human_evaluations'


def get_human_evaluation_path(session_id: str, example_id: str | int, model_key: str) -> Path:
    return get_human_evaluations_dir(session_id) / f'example_{example_id}_{model_key}.json'


def save_human_evaluation(session_id: str, example_id: str | int, model_key: str, data: dict[str, Any]) -> tuple[dict[str, Any], bool]:
    # TODO: Reemplazar persistencia en JSON por INSERT/UPDATE en tabla human_evaluations.
    out_dir = get_human_evaluations_dir(session_id)
    out_dir.mkdir(parents=True, exist_ok=True)
    path = get_human_evaluation_path(session_id, example_id, model_key)
    existed = path.exists()
    previous = load_human_evaluation(session_id, example_id, model_key) if existed else None
    now = utc_now_iso()
    payload = {
        'sessionId': session_id,
        'exampleId': example_id,
        'modelKey': model_key,
        'semanticScore': data['semanticScore'],
        'clarityScore': data['clarityScore'],
        'comment': data.get('comment') or '',
        'createdAt': previous.get('createdAt') if previous else now,
    }
    if existed:
        payload['updatedAt'] = now
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding='utf-8')
    return payload, existed


def load_human_evaluation(session_id: str, example_id: str | int, model_key: str) -> dict[str, Any] | None:
    path = get_human_evaluation_path(session_id, example_id, model_key)
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding='utf-8'))
    except Exception:
        return None


def load_all_human_evaluations(session_id: str) -> list[dict[str, Any]]:
    folder = get_human_evaluations_dir(session_id)
    if not folder.exists():
        return []
    evaluations: list[dict[str, Any]] = []
    for path in sorted(folder.glob('example_*_modelo_*.json')):
        try:
            payload = json.loads(path.read_text(encoding='utf-8'))
            if isinstance(payload, dict):
                evaluations.append(payload)
        except Exception:
            continue
    return evaluations


def count_human_evaluations(session_id: str) -> int:
    return len(load_all_human_evaluations(session_id))
