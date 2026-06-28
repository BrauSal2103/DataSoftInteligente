# Explicacion Del Frontend, Backend Y Notebook

## Resumen general

Este proyecto esta hecho como una aplicacion de evaluacion semantica de pictogramas. La idea original esta en `pictogramas_eval.ipynb`, donde se cargan datasets, predicciones de modelos, metricas automaticas y evaluacion con Gemini. Luego esa logica se separo en una arquitectura web con frontend y backend.

Partes principales del proyecto:

- Frontend React/Vite: `FrontPrueba`
- Backend FastAPI: `backend`
- Datos base: `data`
- Notebook original: `pictogramas_eval.ipynb`

El frontend no calcula las metricas pesadas directamente. Su funcion principal es cargar datasets, mostrar ejemplos, pedir calculos al backend y visualizar resultados.

## Frontend

El frontend esta hecho con:

- React 18
- TypeScript
- Vite
- TailwindCSS
- Axios
- React Router
- Recharts para graficas

Archivos principales:

- `FrontPrueba/src/app/router.tsx`: define las rutas de la aplicacion.
- `FrontPrueba/src/pages/WelcomePage.tsx`: pantalla inicial para cargar el dataset.
- `FrontPrueba/src/pages/EvaluationWorkspace.tsx`: dashboard principal de evaluacion.
- `FrontPrueba/src/services/evaluationApi.ts`: cliente Axios que consume el backend.
- `FrontPrueba/src/context/DatasetContext.tsx`: estado global del dataset, sesion y progreso.
- `FrontPrueba/src/sections/MetricSection.tsx`: vista de metricas como BLEU, chrF++, Concept F1, Coverage y Similaridad Semantica.
- `FrontPrueba/src/sections/LLMJudgeSection.tsx`: vista para ejecutar evaluacion con Gemini.

## Flujo del frontend

1. El usuario carga un archivo JSON o CSV en la pantalla inicial.
2. El frontend valida el formato localmente con `parseDataset`.
3. Calcula un hash del archivo para saber si ya existe una sesion previa.
4. Si existe sesion, recupera los ejemplos desde el backend.
5. Si no existe, sube el archivo al backend.
6. Entra al workspace.
7. Desde el workspace se pueden calcular metricas, ver progreso y ejecutar LLM-Judge.

El frontend usa por defecto este backend:

```txt
http://localhost:8000
```

Esto esta configurado en:

```txt
FrontPrueba/src/services/evaluationApi.ts
```

Tambien puede cambiarse con la variable de entorno:

```env
VITE_API_BASE_URL
```

## Rutas del frontend

La aplicacion tiene dos rutas principales:

```txt
/
```

Pantalla de bienvenida y carga de dataset.

```txt
/workspace
```

Dashboard de evaluacion.

En el workspace aparecen pestañas como:

- Dashboard
- BLEU
- chrF++
- Concept F1
- Coverage
- Semantic Similarity
- LLM Judge

## Endpoints consumidos por el frontend

El archivo `FrontPrueba/src/services/evaluationApi.ts` consume estos endpoints:

| Metodo | Endpoint | Uso |
|---|---|---|
| `POST` | `/api/datasets/upload` | Sube un dataset al backend y crea una sesion. |
| `GET` | `/api/examples` | Obtiene los ejemplos normalizados para el frontend. |
| `GET` | `/api/progress` | Consulta cuantos ejemplos ya tienen metricas calculadas. |
| `GET` | `/api/results` | Obtiene resumen agregado de metricas por modelo. |
| `POST` | `/api/examples/{id}/metrics` | Calcula metricas para un ejemplo especifico. |
| `POST` | `/api/examples/{id}/llm-judge` | Evalua un ejemplo con Gemini. |
| `POST` | `/api/llm-judge/batch` | Ejecuta LLM-Judge por lote. |

## Backend

El backend esta hecho con FastAPI.

Archivos principales:

- `backend/main.py`: define la API y los endpoints.
- `backend/metrics.py`: contiene la logica de metricas reutilizada desde el notebook.
- `backend/requirements.txt`: dependencias del backend.

Dependencias principales:

```txt
fastapi
uvicorn
sacrebleu
python-multipart
requests
sentence-transformers
numpy
```

El backend corre en:

```txt
http://localhost:8000
```

Y permite CORS para que el frontend de Vite pueda conectarse desde:

```txt
http://localhost:5173
```

## Endpoints del backend

### `POST /api/datasets/upload`

Recibe un archivo usando `multipart/form-data`.

Hace lo siguiente:

- Crea un `sessionId`.
- Guarda el archivo en `backend/data/{sessionId}`.
- Tambien intenta copiarlo a `data/` para compatibilidad con el notebook.
- Devuelve la cantidad de ejemplos.

Respuesta ejemplo:

```json
{
  "success": true,
  "sessionId": "abc12345",
  "filename": "test.json",
  "examplesCount": 50
}
```

### `GET /api/examples`

Carga el dataset de la sesion y lo convierte al formato que espera React.

Convierte campos del notebook como:

```json
{
  "oracion": "...",
  "traduccion": "..."
}
```

a campos del frontend:

```json
{
  "texto": "...",
  "referencia": [],
  "modelo_1": [],
  "modelo_2": [],
  "modelo_3": [],
  "modelo_4": []
}
```

Tambien carga metricas y resultados LLM ya guardados si existen.

### `GET /api/progress`

Devuelve el progreso de metricas calculadas.

```json
{
  "total": 50,
  "evaluated": 10,
  "pending": 40,
  "progress": 20
}
```

### `GET /api/results`

Calcula o devuelve el resumen agregado de metricas por modelo:

- BLEU
- chrF++
- Concept F1
- Coverage
- Semantic Similarity

Guarda el resumen en:

```txt
backend/data/{sessionId}/summary/metric_summary.json
```

### `POST /api/examples/{example_id}/metrics`

Calcula metricas para un ejemplo concreto.

Guarda el resultado en:

```txt
backend/data/{sessionId}/metrics/example_{id}.json
```

### `POST /api/examples/{example_id}/llm-judge`

Evalua un ejemplo con Gemini.

Parametros principales:

- `sessionId`
- `modelKey`
- `promptMode`

Ejemplo:

```txt
/api/examples/10/llm-judge?sessionId=abc12345&modelKey=modelo_1&promptMode=strict
```

### `POST /api/llm-judge/batch`

Evalua varios ejemplos con Gemini.

Recibe un cuerpo como este:

```json
{
  "modelKey": "modelo_1",
  "promptMode": "strict",
  "selectionMode": "random",
  "evalLimit": 5,
  "ids": [],
  "seed": 42
}
```

## Metricas implementadas

### BLEU

Usa `sacrebleu.metrics.BLEU`.

Compara la secuencia generada por el modelo contra la referencia.

### chrF++

Usa `sacrebleu.metrics.CHRF` con:

```py
CHRF(word_order=2)
```

Evalua similitud a nivel de caracteres y palabras.

### Concept F1

Compara conjuntos de pictogramas sin importar el orden.

Calcula:

- Precision
- Recall
- F1

### Coverage

Mide que porcentaje de pictogramas de la referencia aparecen en la prediccion.

### Semantic Similarity

Convierte los IDs de pictogramas a palabras usando:

```txt
data/pictogramasArasaac.json
```

Luego usa embeddings multilingues:

```py
SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
```

Finalmente calcula similitud coseno entre:

- texto original
- texto generado a partir de pictogramas

## LLM-Judge

La evaluacion con LLM usa Gemini.

El notebook tenia una seccion llamada:

```txt
# 9. Implementacion de LLM-Judge
```

Esa logica fue llevada al backend en `backend/metrics.py`.

El backend define dos prompts:

- `PROMPT_JUEZ_SISTEMA`: evaluacion estricta.
- `PROMPT_JUEZ_FLEXIBLE`: evaluacion mas tolerante.

Gemini debe devolver JSON con esta estructura:

```json
{
  "score": 1,
  "semantic_errors": [],
  "missing_concepts": [],
  "comments": ""
}
```

Para que funcione se necesita una API key:

```env
GEMINI_API_KEY=TU_API_KEY
```

Puede estar en:

- `.env` en la raiz
- `.env` dentro de `backend`

## Como esta hecho a partir del IPYNB

El notebook `pictogramas_eval.ipynb` era el prototipo inicial. Ahi se hacia todo en celdas:

1. Instalacion de dependencias.
2. Carga de datos desde `data/`.
3. Carga de `train.json`, `test (2).json`, `validation.json`.
4. Carga de predicciones `modelo1.json`, `modelo2.json`, `modelo3.json`, `modelo4.json`.
5. Calculo de metricas BLEU y chrF++.
6. Calculo de Concept F1, Coverage y Semantic Similarity.
7. Generacion de graficas.
8. Evaluaciones humanas.
9. LLM-Judge con Gemini.

La aplicacion actual toma esa logica y la convierte en una arquitectura web:

- Las funciones de metricas del notebook se pasaron a `backend/metrics.py`.
- La carga de datos y sesiones se paso a `backend/main.py`.
- Las graficas del notebook se reemplazaron por componentes React con `Recharts`.
- La seleccion manual de ejemplos en el notebook se transformo en una interfaz web.
- El LLM-Judge del notebook se convirtio en endpoints del backend.
- Los resultados ya no quedan solo en memoria del notebook, sino guardados por sesion en `backend/data/{sessionId}`.

En resumen, el `.ipynb` fue el experimento inicial y la aplicacion web es la version operacional, separando responsabilidades entre frontend, backend y almacenamiento por sesion.
