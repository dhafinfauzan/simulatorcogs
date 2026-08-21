import { Router } from 'express'
import { calculate, validateInput } from '../calcEngine.js'
import db from '../db.js'
import { requireAuth } from './auth.js'

const router = Router()

router.use(requireAuth)

// POST /api/simulate/calculate
router.post('/calculate', (req, res) => {
  const input = req.body

  // Validate
  const errors = validateInput(input)
  if (errors.length) {
    return res.status(400).json({ errors })
  }

  // Get BEP threshold from settings
  const setting = db.prepare('SELECT value FROM settings WHERE key = ?').get('bep_threshold_months')
  const threshold = setting ? parseInt(setting.value) : 10

  const result = calculate(input, threshold)
  res.json(result)
})

// POST /api/simulate/save — save simulation to history
router.post('/save', (req, res) => {
  const { deviceId, scheme, result } = req.body
  // TODO: implement save if feature is enabled
  res.status(501).json({ error: 'Save simulation is not enabled in MVP.' })
})

// GET /api/simulate/history
router.get('/history', (req, res) => {
  const rows = db.prepare('SELECT * FROM simulations ORDER BY created_at DESC LIMIT 50').all()
  res.json(rows)
})

export default router
