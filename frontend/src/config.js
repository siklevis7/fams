const envUrl = import.meta.env.VITE_API_URL;
export const API_BASE = (envUrl && envUrl.includes('fams-backend')) 
    ? 'https://kfms-backend.onrender.com' 
    : (envUrl || 'https://kfms-backend.onrender.com');
