import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Debug environment variables
console.log('Environment variables:', {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  SUPABASE_KEY_EXISTS: !!import.meta.env.VITE_SUPABASE_ANON_KEY
});

createRoot(document.getElementById("root")!).render(<App />);
