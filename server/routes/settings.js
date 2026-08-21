import { Router } from 'express'
import db from '../db.js'
import { requireAuth, requireAdmin } from './auth.js'

const router = Router()

router.use(requireAuth)

// GET /api/settings
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM settings').all()
  const settings = {}
  rows.forEach(r => settings[r.key] = r.value)
  res.json(settings)
})

// PUT /api/settings — admin only
router.put('/', requireAdmin, (req, res) => {
  const { bep_threshold_months } = req.body
  if (bep_threshold_months !== undefined) {
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
      .run('bep_threshold_months', String(bep_threshold_months))
  }
  res.json({ message: 'Settings updated.' })
})

export default router
