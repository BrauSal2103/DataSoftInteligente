## Configuración rápida

Este proyecto tiene dos partes:

- Backend: FastAPI en `http://localhost:8000`
- Frontend: Vite en `http://localhost:5173` o `http://localhost:5174` si el puerto 5173 ya está ocupado

## Paso a paso para inicializar el backend y el frontend

### 1. Abrir una terminal en la raíz del proyecto

Ubícate en la carpeta `DataSoftInteligente`.

### 2. Activar el entorno virtual de Python

En PowerShell:

```powershell
.\venv\Scripts\Activate.ps1
```

Si el entorno virtual no existe todavía, créalo una sola vez desde la raíz del proyecto:

```powershell
py -m venv venv
```

### 3. Instalar dependencias del backend

```powershell
pip install -r backend\requirements.txt
```

### 4. Levantar el backend

Desde la raíz del proyecto:

```powershell
python -m uvicorn backend.main:app --reload
```

Si entras directamente a la carpeta `backend`, también puedes usar:

```powershell
uvicorn main:app --reload
```

### 5. Instalar dependencias del frontend

En otra terminal:

```powershell
cd FrontPrueba
npm install
```

### 6. Levantar el frontend

```powershell
npm run dev
```

### 7. Abrir la aplicación

- Frontend: `http://localhost:5173`
- Si Vite cambia el puerto, abre la URL que te muestre la terminal, por ejemplo `http://localhost:5174`

## Configuración de Gemini

Para usar la API de Gemini, crea un archivo `.env` en la raíz del proyecto o en la carpeta del backend con este contenido:

```env
GEMINI_API_KEY=TU_API_KEY
```

La API key se obtiene desde Google AI Studio.

## Notas

- El frontend consume por defecto el backend en `http://localhost:8000`.
- Si quieres cambiar esa URL, define `VITE_API_BASE_URL` en el frontend.

## Evaluación Humana

La evaluación humana permite calificar cada predicción de modelo para un ejemplo específico. No requiere login y se guarda temporalmente en archivos físicos dentro del backend.

Endpoint para guardar:

```txt
POST /api/examples/{id}/human-evaluation
```

Body esperado:

```json
{
  "sessionId": "abc123",
  "modelKey": "modelo_1",
  "semanticScore": 4,
  "clarityScore": 3,
  "comment": "Se entiende la acción principal, pero falta un concepto importante."
}
```

Validaciones principales:

- `sessionId` es obligatorio.
- `modelKey` debe ser `modelo_1`, `modelo_2`, `modelo_3` o `modelo_4`.
- `semanticScore` y `clarityScore` deben estar entre 1 y 5.
- El ejemplo debe existir en el dataset de la sesión.

Los archivos se guardan en:

```txt
backend/data/{sessionId}/human_evaluations/example_{exampleId}_{modelKey}.json
```

También existen endpoints para consultar:

```txt
GET /api/human-evaluations?sessionId=abc123
GET /api/examples/{id}/human-evaluation?sessionId=abc123&modelKey=modelo_1
```

El endpoint `/api/progress` incluye progreso humano con `evaluatedHumanCount`, `pendingHumanCount` y `humanProgress`.

Por ahora se usa almacenamiento físico en JSON. Para una futura migración a PostgreSQL/Supabase, están preparados estos scripts:

```txt
backend/sql/create_human_evaluations.sql
backend/sql/insert_human_evaluation_example.sql
```
