export const getProgress = (evaluated: number, total: number) => total ? Math.round((evaluated / total) * 100) : 0;
