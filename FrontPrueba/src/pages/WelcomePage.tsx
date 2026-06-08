import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import Card from '../components/ui/Card';
import DatasetUploader from '../components/dataset/DatasetUploader';
import { readDatasetFile } from '../services/datasetApi';
import { useDataset } from '../context/DatasetContext';
import { computeFileHash, getStoredSessionByHash, rememberSession } from '../utils/datasetSession';
import { getExamples, getHumanEvaluations, uploadDataset } from '../services/evaluationApi';

export default function WelcomePage() {
	const [file, setFile] = useState<File | null>(null);
	const [status, setStatus] = useState('Esperando archivo');
	const navigate = useNavigate();
	const { setDataset, setHumanEvaluations } = useDataset();

	const upload = async () => {
		if (!file) return;
		setStatus('Validando dataset...');
		const result = await readDatasetFile(file);
		if (result.errors.length) {
			setStatus('El archivo no tiene el formato esperado');
			return;
		}

		const sourceHash = await computeFileHash(file);
		const existing = getStoredSessionByHash(sourceHash);

		if (existing) {
			setStatus('Recuperando sesión previa...');
			try {
				const examples = await getExamples(existing.sessionId);
				const human = await getHumanEvaluations(existing.sessionId);
				setDataset(examples, existing);
				setHumanEvaluations(human.evaluations);
				rememberSession(existing);
				navigate('/workspace');
				return;
			} catch (error: any) {
				const msg = error?.message || 'Error desconocido';
				setStatus(`Error al recuperar sesión: ${msg}. Intenta recargar el archivo.`);
				return;
			}
		}

		setStatus('Subiendo dataset al backend...');
		try {
			const uploaded = await uploadDataset(file);
			const session = { sessionId: uploaded.sessionId, sourceHash, filename: file.name };
			const examples = await getExamples(session.sessionId);
			const human = await getHumanEvaluations(session.sessionId);
			setDataset(examples, session);
			setHumanEvaluations(human.evaluations);
			rememberSession(session);
			setStatus(`Dataset cargado correctamente (${uploaded.examplesCount} ejemplos)`);
			navigate('/workspace');
		} catch (error: any) {
			console.error('Error en la subida:', error);
			const msg = error?.response ? `Error del servidor: ${error.response.status} ${error.response.statusText}` : error?.message || 'Error desconocido';
			setStatus(`Error: ${msg}. Verifica que el backend esté corriendo en http://localhost:8000`);
		}
	};

	return <AppShell><div className='mx-auto max-w-4xl space-y-6'><h1 className='text-5xl font-bold'><span className='text-[#EF0015]'>Semantic</span> PictoEval</h1><p className='text-xl text-[#CBD5E1]'>Evaluación semántica de pictogramas generados por IA</p><Card>La aplicación carga un JSON, crea o recupera una sesión por hash y mantiene los resultados por carpeta de backend sin perder procesos anteriores.</Card><Card><h3 className='mb-2 text-xl font-semibold'>¿Qué puedes hacer?</h3><ul className='list-disc space-y-1 pl-6 text-[#CBD5E1]'><li>Cargar un dataset CSV o JSON</li><li>Reutilizar la sesión si subes el mismo JSON</li><li>Entrar al dashboard con la información del dataset</li><li>Ejecutar una métrica por pestaña y ver sus gráficos</li></ul></Card><DatasetUploader file={file} onPick={setFile} onUpload={upload} status={status}/></div></AppShell>}
