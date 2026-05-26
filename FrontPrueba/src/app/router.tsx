import { createBrowserRouter } from 'react-router-dom';
import WelcomePage from '../pages/WelcomePage';
import EvaluationWorkspace from '../pages/EvaluationWorkspace';

export const router = createBrowserRouter([
  { path: '/', element: <WelcomePage /> },
  { path: '/workspace', element: <EvaluationWorkspace /> }
]);
