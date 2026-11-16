import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        // During development, requests to /api go to the Python backend
        // (backend/README.md shows how to start it), so the browser only ever
        // talks to one address and needs no CORS setup.
        proxy: {
            '/api': 'http://localhost:8000',
        },
    },
});
