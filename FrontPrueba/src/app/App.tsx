import { RouterProvider } from 'react-router-dom'; import { router } from './router'; import { DatasetProvider } from '../context/DatasetContext';
export default ()=> <DatasetProvider><RouterProvider router={router} /></DatasetProvider>;
