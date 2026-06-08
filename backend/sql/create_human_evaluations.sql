CREATE TABLE IF NOT EXISTS human_evaluations (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL,
    example_id VARCHAR(100) NOT NULL,
    model_key VARCHAR(50) NOT NULL,
    semantic_score INTEGER NOT NULL CHECK (semantic_score BETWEEN 1 AND 5),
    clarity_score INTEGER NOT NULL CHECK (clarity_score BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (session_id, example_id, model_key)
);

CREATE INDEX IF NOT EXISTS idx_human_evaluations_session
ON human_evaluations(session_id);

CREATE INDEX IF NOT EXISTS idx_human_evaluations_example
ON human_evaluations(example_id);

CREATE INDEX IF NOT EXISTS idx_human_evaluations_model
ON human_evaluations(model_key);
