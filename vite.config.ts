import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  base: './',
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(
      process.env.VITE_SUPABASE_URL || 'https://ftjukgofugzoxhvqhrez.supabase.co'
    ),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(
      process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0anVrZ29mdWd6b3hodnFocmV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2NjQyMDksImV4cCI6MjA3NzI0MDIwOX0.j8kwtLaklvEB59X4_ir3HBGGkUmXfFbnl4M8lFC8wZM'
    ),
  },
});
