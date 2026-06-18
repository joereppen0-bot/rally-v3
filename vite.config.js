import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { handleAI } from './api/_aiHandler.js'

export default defineConfig(({ mode }) => {
  // Loads ALL env vars (incl. non-VITE) into this Node process only — never shipped to the client.
  const env = loadEnv(mode, process.cwd(), '')
  const apiKey = env.ANTHROPIC_API_KEY

  return {
    plugins: [
      react(),
      {
        name: 'rally-ai-dev',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.method === 'POST' && req.url && req.url.startsWith('/api/ai')) {
              let data = ''
              req.on('data', (c) => (data += c))
              req.on('end', async () => {
                res.setHeader('Content-Type', 'application/json')
                try {
                  const out = await handleAI(JSON.parse(data || '{}'), apiKey)
                  res.end(JSON.stringify(out))
                } catch (e) {
                  res.end(JSON.stringify({ error: 'server_error', detail: String(e) }))
                }
              })
            } else {
              next()
            }
          })
        },
      },
    ],
    server: { port: 5173 },
  }
})
