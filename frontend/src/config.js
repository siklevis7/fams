const envUrl = import.meta.env.VITE_API_URL;
export const API_BASE = import.meta.env.DEV 
  ? 'http://localhost:8000' 
  : (envUrl && envUrl.includes('fams-backend') 
      ? 'https://kfms-backend.onrender.com' 
      : (envUrl || 'https://kfms-backend.onrender.com'));
