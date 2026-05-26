from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import os
import json
import uuid
from pathlib import Path
from typing import Optional

try:
    from .metrics import compute_example_metrics, compute_session_summary, evaluate_with_gemini, evaluate_batch_with_gemini, _load_model_records
except ImportError:
    from metrics import compute_example_metrics, compute_session_summary, evaluate_with_gemini, evaluate_batch_with_gemini, _load_model_records

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / 'data'
BACKEND_DATA = Path(__file__).resolve().parents[0] / 'data'
BACKEND_DATA.mkdir(parents=True, exist_ok=True)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def save_uploaded_file(session_id: str, upload: UploadFile) -> Path:
    session_dir = BACKEND_DATA / session_id
    session_dir.mkdir(parents=True, exist_ok=True)
    target = session_dir / upload.filename
    with target.open('wb') as f:
        f.write(upload.file.read())
    # Also copy to top-level data/ for notebook compatibility
    try:
        top_target = DATA_DIR / upload.filename
        with top_target.open('wb') as f:
            f.write((session_dir / upload.filename).read_bytes())
    except Exception:
        pass
    return target


def get_session_source(session_id: Optional[str]) -> tuple[Path, Path]:
    if session_id:
        folder = BACKEND_DATA / session_id
        if not folder.exists():
            raise HTTPException(404, 'session not found')
        files = list(folder.glob('*.json'))
        if not files:
            raise HTTPException(404, 'no json dataset in session')
        return folder, files[0]
    source = DATA_DIR / 'test (2).json'
    if not source.exists():
        raise HTTPException(404, 'no dataset available')
    return BACKEND_DATA / 'default', source


def get_model_bundle(folder: Path) -> dict:
    return _load_model_records(str(folder)) or _load_model_records(str(DATA_DIR))


class LLMJudgeBatchRequest(BaseModel):
    modelKey: str = Field(default='modelo_1')
    promptMode: str = Field(default='strict')
    selectionMode: str = Field(default='random')
    evalLimit: int = Field(default=5, ge=1)
    ids: list[int] = Field(default_factory=list)
    seed: int = Field(default=42)


def _normalize_llm_cache_entry(payload: object) -> object:
    if not isinstance(payload, dict):
        return payload
    result = payload.get('llmJudge', payload)
    if isinstance(result, dict):
        result = dict(result)
        if 'modelKey' not in result and 'modelKey' in payload:
            result['modelKey'] = payload.get('modelKey')
        if 'modelLabel' not in result and 'modelLabel' in payload:
            result['modelLabel'] = payload.get('modelLabel')
    return result


@app.post('/api/datasets/upload')
async def upload_dataset(file: UploadFile = File(...)):
    session_id = uuid.uuid4().hex[:8]
    saved = save_uploaded_file(session_id, file)
    # try parse and count examples
    examples_count = 0
    try:
        raw = json.loads(saved.read_text(encoding='utf-8'))
        if isinstance(raw, list):
            examples_count = len(raw)
    except Exception:
        pass
    return JSONResponse({'success': True, 'sessionId': session_id, 'filename': saved.name, 'examplesCount': examples_count})


@app.get('/api/examples')
def get_examples(sessionId: Optional[str] = Query(None)):
    folder, source = get_session_source(sessionId)
    raw = json.loads(source.read_text(encoding='utf-8'))
    metrics_dir = folder / 'metrics'
    llm_dir = folder / 'llm_judge'
    metrics_cache = {}
    llm_cache = {}
    model_records = get_model_bundle(folder)

    if metrics_dir.exists():
        for metric_file in metrics_dir.glob('example_*.json'):
            try:
                example_id = metric_file.stem.replace('example_', '')
                metrics_cache[example_id] = json.loads(metric_file.read_text(encoding='utf-8'))
            except Exception:
                pass

    if llm_dir.exists():
        for llm_file in llm_dir.glob('example_*.json'):
            try:
                example_id = llm_file.stem.replace('example_', '')
                llm_cache[example_id] = _normalize_llm_cache_entry(json.loads(llm_file.read_text(encoding='utf-8')))
            except Exception:
                pass

    # helper to parse sequence strings into list of {id,label}
    def parse_seq(s):
        if not s:
            return []
        if isinstance(s, list):
            return s
        if isinstance(s, str):
            toks = s.strip().split()
            return [{'id': t, 'label': t} for t in toks if t]
        return []

    # helper to get model predictions from model_records or inline fields
    def get_model_pred(record, example_id_str, field_key, inline_keys):
        if model_records:
            mapping = model_records.get(field_key, {})
            pred = mapping.get(example_id_str)
            if pred:
                return parse_seq(pred)
        inline = None
        for k in inline_keys:
            inline = record.get(k)
            if inline:
                break
        return parse_seq(inline)

    # convert notebook schema (oracion/traduccion) to frontend Example schema if needed
    examples = []
    for r in raw:
        example_id_str = str(r.get('id'))
        ex = {
            'id': r.get('id'),
            'texto': r.get('oracion') or r.get('texto') or r.get('text') or '',
            'referencia': [],
            'modelo_1': [],
            'modelo_2': [],
            'modelo_3': [],
            'modelo_4': [],
            'metrics': metrics_cache.get(example_id_str),
            'llmJudge': llm_cache.get(example_id_str),
        }

        ex['referencia'] = parse_seq(r.get('traduccion') or r.get('referencia'))
        ex['modelo_1'] = get_model_pred(r, example_id_str, 'modelo_1', ['m1', 'modelo_1', 'modelo1'])
        ex['modelo_2'] = get_model_pred(r, example_id_str, 'modelo_2', ['m2', 'modelo_2', 'modelo2'])
        ex['modelo_3'] = get_model_pred(r, example_id_str, 'modelo_3', ['m3', 'modelo_3', 'modelo3'])
        ex['modelo_4'] = get_model_pred(r, example_id_str, 'modelo_4', ['m4', 'modelo_4', 'modelo4'])
        examples.append(ex)
    return JSONResponse(examples)


@app.get('/api/results')
def get_results(sessionId: Optional[str] = Query(None)):
    folder, source = get_session_source(sessionId)
    raw = json.loads(source.read_text(encoding='utf-8'))
    summary = compute_session_summary(raw, get_model_bundle(folder))
    out_dir = folder / 'summary'
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / 'metric_summary.json'
    out_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding='utf-8')
    return JSONResponse(summary)


@app.post('/api/examples/{example_id}/metrics')
def compute_metrics(example_id: int, sessionId: Optional[str] = Query(None)):
    folder, source = get_session_source(sessionId)
    data = json.loads(source.read_text(encoding='utf-8'))
    by_id = {x['id']: x for x in data}
    if example_id not in by_id:
        raise HTTPException(404, 'example id not found')
    example = by_id[example_id]
    # compute metrics for this example using notebook logic
    metrics = compute_example_metrics(example, data, get_model_bundle(folder))
    # persist per-session folder
    out_dir = folder / 'metrics'
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f'example_{example_id}.json'
    out_path.write_text(json.dumps(metrics, ensure_ascii=False, indent=2), encoding='utf-8')
    return JSONResponse({'exampleId': example_id, 'metrics': metrics, 'stored': str(out_path)})


@app.post('/api/examples/{example_id}/llm-judge')
def llm_judge(
    example_id: int,
    sessionId: Optional[str] = Query(None),
    modelKey: str = Query('modelo_1'),
    promptMode: str = Query('strict'),
):
    folder, source = get_session_source(sessionId)
    data = json.loads(source.read_text(encoding='utf-8'))
    model_records = get_model_bundle(folder)
    by_id = {x['id']: x for x in data}
    if example_id not in by_id:
        raise HTTPException(404, 'example id not found')
    example = by_id[example_id]
    allowed_keys = {'modelo_1', 'modelo_2', 'modelo_3', 'modelo_4'}
    if modelKey not in allowed_keys:
        raise HTTPException(400, 'invalid modelKey')
    if promptMode not in {'strict', 'flexible'}:
        raise HTTPException(400, 'invalid promptMode')

    result = evaluate_with_gemini(example, model_records=model_records, model_key=modelKey, prompt_mode=promptMode)
    model_label = {
        'modelo_1': 'Modelo 1',
        'modelo_2': 'Modelo 2',
        'modelo_3': 'Modelo 3',
        'modelo_4': 'Modelo 4',
    }[modelKey]

    payload = {
        'exampleId': example_id,
        'modelKey': modelKey,
        'modelLabel': model_label,
        'promptMode': promptMode,
        'llmJudge': result,
    }
    out_dir = folder / 'llm_judge'
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f'example_{example_id}.json'
    out_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding='utf-8')
    return JSONResponse({**payload, 'stored': str(out_path)})


@app.post('/api/llm-judge/batch')
def llm_judge_batch(body: LLMJudgeBatchRequest, sessionId: Optional[str] = Query(None)):
    folder, source = get_session_source(sessionId)
    data = json.loads(source.read_text(encoding='utf-8'))
    model_records = get_model_bundle(folder)
    by_id = {x['id']: x for x in data}
    allowed_keys = {'modelo_1', 'modelo_2', 'modelo_3', 'modelo_4'}
    if body.modelKey not in allowed_keys:
        raise HTTPException(400, 'invalid modelKey')
    if body.promptMode not in {'strict', 'flexible'}:
        raise HTTPException(400, 'invalid promptMode')
    if body.selectionMode not in {'random', 'ids'}:
        raise HTTPException(400, 'invalid selectionMode')

    model_prediction_ids = set()
    for example_id in model_records.get(body.modelKey, {}):
        try:
            model_prediction_ids.add(int(example_id))
        except (TypeError, ValueError):
            continue

    available_ids = sorted(example_id for example_id in by_id.keys() if example_id in model_prediction_ids)
    selected_ids: list[int]
    if body.selectionMode == 'ids':
        selected_ids = [candidate_id for candidate_id in body.ids if candidate_id in by_id and candidate_id in model_prediction_ids]
    else:
        import random

        rng = random.Random(body.seed)
        selected_ids = rng.sample(available_ids, k=min(body.evalLimit, len(available_ids)))

    selected_ids = selected_ids[: body.evalLimit]
    results = evaluate_batch_with_gemini(
        data,
        selected_ids,
        model_records=model_records,
        model_key=body.modelKey,
        prompt_mode=body.promptMode,
    )

    out_dir = folder / 'llm_judge'
    out_dir.mkdir(parents=True, exist_ok=True)
    stored_files = []
    for item in results:
        out_path = out_dir / f"example_{item['id']}.json"
        payload = {
            'exampleId': item['id'],
            'modelKey': body.modelKey,
            'promptMode': body.promptMode,
            'llmJudge': item['llmJudge'],
        }
        out_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding='utf-8')
        stored_files.append(str(out_path))

    return JSONResponse({
        'modelKey': body.modelKey,
        'promptMode': body.promptMode,
        'selectionMode': body.selectionMode,
        'evalLimit': body.evalLimit,
        'seed': body.seed,
        'selectedIds': selected_ids,
        'results': results,
        'stored': stored_files,
    })


@app.get('/api/progress')
def progress(sessionId: Optional[str] = Query(None)):
    folder, source = get_session_source(sessionId)
    metrics_dir = folder / 'metrics'
    total = 0
    evaluated = 0
    try:
        raw = json.loads(source.read_text(encoding='utf-8'))
        if isinstance(raw, list):
            total = len(raw)
    except Exception:
        total = 0
    if metrics_dir.exists():
        evaluated = len(list(metrics_dir.glob('example_*.json')))
    pending = total - evaluated
    progress = int((evaluated / total) * 100) if total else 0
    return JSONResponse({'total': total, 'evaluated': evaluated, 'pending': pending, 'progress': progress})


if __name__ == '__main__':
    import uvicorn
    uvicorn.run('backend.main:app', host='0.0.0.0', port=8000, reload=True)
