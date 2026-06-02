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
python -m venv venv
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
- Si quieres cambiar esa URL, define `VITE_API_BASE_URL` en el frontend.## Integrantes 
- Sebasti�n Ayala Alberca 
- Joshua Barrantes Navarro 
- Diego Gamarra Chavez 
- Jhan Reyes Fabian 
- Braulio Salda�a Alarcon 
- Andrew Serna Quiroz 
 
## Integrantes 
- Sebasti�n Ayala Alberca 
- Joshua Barrantes Navarro 
- Diego Gamarra Chavez 
- Jhan Reyes Fabian 
- Braulio Salda�a Alarcon 
- Andrew Serna Quiroz 
 
## Tecnolog�as utilizadas 
- Python 3.12 
- FastAPI + Uvicorn 
- React + TypeScript + Vite 
- Sentence Transformers (all-MiniLM-L6-v2) 
- SacreBleu (BLEU, chrF++) 
- Google Gemini API (LLM-Judge) 
- Corpus PICTOEDUCA (MINEDU Peru) 
 
## Resultados principales 
- LLM-Judge flexible: correlacion Spearman p=0.68 con juicio humano 
- BLEU: correlacion r=0.27 (metrica insuficiente para CAA) 
- Similitud Semantica: correlacion r=0.50 
- 8 evaluadores humanos, 50 ejemplos, 4 modelos evaluados 
