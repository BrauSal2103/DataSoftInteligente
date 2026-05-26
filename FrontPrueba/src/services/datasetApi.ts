import { parseDataset } from '../utils/parseDataset';

export const readDatasetFile = async (file: File) => {
  const content = await file.text();
  return parseDataset(content, file.name);
};
