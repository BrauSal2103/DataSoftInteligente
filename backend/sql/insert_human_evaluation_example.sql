INSERT INTO human_evaluations (
    session_id,
    example_id,
    model_key,
    semantic_score,
    clarity_score,
    comment
) VALUES (
    'abc123',
    '13',
    'modelo_1',
    4,
    3,
    'Se entiende la acción principal, pero falta un concepto importante.'
)
ON CONFLICT (session_id, example_id, model_key)
DO UPDATE SET
    semantic_score = EXCLUDED.semantic_score,
    clarity_score = EXCLUDED.clarity_score,
    comment = EXCLUDED.comment,
    updated_at = CURRENT_TIMESTAMP;
