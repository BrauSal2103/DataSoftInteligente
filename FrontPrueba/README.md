# Semantic PictoEval Frontend

Aplicación frontend con flujo de **dos páginas**:
1. Bienvenida + carga/validación de dataset.
2. Workspace de evaluación (Resumen, Evaluación, Resultados, Correlaciones, Análisis de errores) con tabs internas.

## Instalación
```bash
npm install
```

## Ejecución
```bash
npm run dev
```

## Flujo
- Inicia en WelcomePage.
- Carga archivo `.json` o `.csv`.
- Se valida estructura mínima.
- Si es válido, redirige automáticamente a `/workspace`.

## Formato esperado del dataset
Campos obligatorios por ejemplo:
- `id`
- `texto`
- `referencia`
- `modelo_1`
- `modelo_2`
- `modelo_3`
- `modelo_4`

### Ejemplo JSON
```json
[
  {
    "id": 1,
    "texto": "El niño come una manzana",
    "referencia": [{"id": 2335, "label": "niño"}],
    "modelo_1": [{"id": 2335, "label": "niño"}],
    "modelo_2": [{"id": 2335, "label": "niño"}],
    "modelo_3": [{"id": 2335, "label": "niño"}],
    "modelo_4": [{"id": 2335, "label": "niño"}]
  }
]
```

### Ejemplo CSV
```csv
id,texto,referencia,modelo_1,modelo_2,modelo_3,modelo_4
1,"El niño come una manzana","[{""id"":2335,""label"":""niño""}]","2335:niño,7381:comer","2335:niño","2335:niño","2335:niño"
```

## LLM-Judge

La vista de evaluación incluye un panel de **LLM-Judge Gemini** por ejemplo.

- El usuario selecciona el modelo a evaluar.
- El frontend llama al backend en `POST /api/examples/{id}/llm-judge`.
- El backend consulta Gemini con `GEMINI_API_KEY` y devuelve `score`, `semantic_errors`, `missing_concepts` y `comments`.
- El resultado queda guardado por sesión en `backend/data/{sessionId}/llm_judge/`.
