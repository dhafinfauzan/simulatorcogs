import express from 'express'
import cors from 'cors'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync } from 'fs'

import authRoutes from './routes/auth.js'
import deviceRoutes from './routes/devices.js'
import simulateRoutes from './routes/simulate.js'
import settingsRoutes from './routes/settings.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// --- API Routes ---
app.use('/api/auth', authRoutes)
app.use('/api/devices', deviceRoutes)
app.use('/api/simulate', simulateRoutes)
app.use('/api/settings', settingsRoutes)

// --- Serve React build in production ---
if (process.env.NODE_ENV === 'production') {
  const distDir = join(__dirname, '..', 'dist')
  app.use(express.static(distDir))
  app.get('*', (_req, res) => {
    res.sendFile(join(distDir, 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`\n  APP MODEL API → http://localhost:${PORT}`)
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}\n`)
})
