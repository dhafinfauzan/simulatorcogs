import { Router } from 'express'
import db from '../db.js'

const router = Router()

// Simple session store (in-memory for MVP)
const sessions = new Map()

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' })
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password)
  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password.' })
  }

  const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64')
  sessions.set(token, { id: user.id, username: user.username, role: user.role })

  res.json({
    token,
    user: { id: user.id, username: user.username, role: user.role }
  })
})

// GET /api/auth/me — verify token
router.get('/me', (req, res) => {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' })
  const token = auth.slice(7)
  const session = sessions.get(token)
  if (!session) return res.status(401).json({ error: 'Unauthorized' })
  res.json(session)
})

// Middleware for protected routes
export function requireAuth(req, res, next) {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' })
  const token = auth.slice(7)
  const session = sessions.get(token)
  if (!session) return res.status(401).json({ error: 'Unauthorized' })
  req.user = session
  next()
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required.' })
  next()
}

export default router
